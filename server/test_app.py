import asyncio
import importlib.util
import tempfile
import unittest
from pathlib import Path
import httpx

spec = importlib.util.spec_from_file_location('baton_api', Path(__file__).with_name('app.py'))
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        api.DB_PATH = Path(self.tmp.name) / 'test.sqlite3'
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test')
        token = (await self.client.get('/api/session')).json()['csrfToken']
        self.headers = {'X-CSRF-Token': token, 'Idempotency-Key': 'test-key'}
        self.doc = (await self.client.get('/api/state')).json()['documents'][0]
        self.block = next(b for b in self.doc['blocks'] if b['sentences'])
        self.sentence = self.block['sentences'][0]

    async def asyncTearDown(self):
        await self.client.aclose()
        self.tmp.cleanup()

    def payload(self):
        return {'action': 'question', 'documentId': self.doc['id'], 'blockId': self.block['id'], 'sentenceId': self.sentence['id'], 'quote': self.sentence['text'], 'title': '새 질문', 'content': '확인해 주세요.'}

    async def post(self, payload, key='test-key'):
        return await self.client.post('/api/mutations', json=payload, headers={**self.headers, 'Idempotency-Key': key})

    async def test_persistent_question_and_independent_threads(self):
        first = (await self.post(self.payload())).json()['thread']
        second = (await self.post(self.payload(), 'second')).json()['thread']
        self.assertNotEqual(first['id'], second['id'])
        state = (await self.client.get('/api/state')).json()
        self.assertEqual(state['threads'][first['id']]['sentenceQuote'], self.sentence['text'])
        self.assertIn(second['id'], state['threads'])
        other = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test')
        await other.get('/api/session')
        self.assertIn(first['id'], (await other.get('/api/state')).json()['threads'])
        self.assertEqual(first['originVersion'], self.doc['version'])
        self.assertEqual(first['anchor']['end_cp'], len(self.sentence['text']))
        await other.aclose()

    async def test_replay_and_conflict(self):
        first = await self.post(self.payload())
        self.assertEqual(first.json(), (await self.post(self.payload())).json())
        self.assertEqual((await self.post({**self.payload(), 'content': '다른 내용'})).status_code, 409)

    async def test_concurrent_replay(self):
        responses = await asyncio.gather(*(self.post(self.payload()) for _ in range(4)))
        results = [r.json() for r in responses]
        self.assertTrue(all(r == results[0] for r in results))

    async def test_session_and_csrf_required(self):
        anonymous = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test')
        self.assertEqual((await anonymous.get('/api/state')).status_code, 401)
        self.assertEqual((await anonymous.post('/api/mutations', json=self.payload())).status_code, 401)
        self.assertEqual((await self.client.post('/api/mutations', json=self.payload())).status_code, 403)
        await anonymous.aclose()

    async def test_anchor_validation(self):
        self.assertEqual((await self.post({**self.payload(), 'quote': '가짜 인용'})).status_code, 409)
        self.assertEqual((await self.post({**self.payload(), 'blockId': '없는 문단'})).status_code, 409)
        self.assertEqual((await self.post({**self.payload(), 'documentId': '없는 문서'})).status_code, 404)

    async def test_answer_comment_and_no_automatic_review(self):
        thread = (await self.post(self.payload())).json()['thread']
        result = (await self.post({'action': 'answer', 'threadId': thread['id'], 'content': '샘플 답변', 'evidenceTitle': '검증되지 않은 자료'}, 'answer')).json()['thread']
        answer = result['answers'][0]
        self.assertFalse(answer['isOfficialReviewed'])
        self.assertEqual(answer['evidenceLinks'], [])
        self.assertFalse(answer['evidenceNote']['verified'])
        result = (await self.post({'action': 'comment', 'threadId': thread['id'], 'answerId': answer['id'], 'content': '댓글'}, 'comment')).json()['thread']
        self.assertEqual(result['answers'][0]['comments'][0]['content'], '댓글')
        self.assertEqual((await self.post({'action': 'review', 'threadId': thread['id']}, 'review')).status_code, 422)

    async def test_empty_and_unknown_targets(self):
        self.assertEqual((await self.post({**self.payload(), 'title': '  '})).status_code, 422)
        self.assertEqual((await self.post({'action': 'answer', 'threadId': 'unknown', 'content': 'x'})).status_code, 404)

if __name__ == '__main__':
    unittest.main()
