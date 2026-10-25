import io
import json
import os
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import httpx
from test_app import api


class DocumentTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        api.DB_PATH = Path(self.temp.name) / 'documents.sqlite3'
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test')
        self.headers = {'X-CSRF-Token': (await self.client.get('/api/session')).json()['csrfToken']}
        self.body = {'title': '새 업무', 'summary': '업무 요약', 'sections': [{'title': '절차', 'text': '담당자를 확인한다.\n일정을 확인한다.'}]}

    async def asyncTearDown(self):
        await self.client.aclose()
        self.temp.cleanup()

    async def create(self):
        res = await self.client.post('/api/documents', json=self.body, headers=self.headers)
        self.assertEqual(res.status_code, 200, res.text)
        return res.json()['document']

    async def transition(self, doc, action, note='원문 대조 완료'):
        return await self.client.post('/api/documents/' + doc['id'] + '/workflow', json={'expectedRevision': doc['revision'], 'action': action, 'note': note}, headers=self.headers)

    async def test_create_edit_review_publish_and_history(self):
        doc = await self.create()
        self.assertEqual(doc['status'], 'draft')
        review = (await self.transition(doc, 'submit')).json()['document']
        editing = await self.client.put('/api/documents/' + doc['id'], json={**self.body, 'expectedRevision': review['revision']}, headers=self.headers)
        self.assertEqual(editing.status_code, 409)
        self.assertEqual((await self.transition(review, 'publish', '')).status_code, 422)
        returned = (await self.transition(review, 'return', '일정 보완 필요')).json()['document']
        changed = await self.client.put('/api/documents/' + doc['id'], json={**self.body, 'title': '수정한 업무', 'expectedRevision': returned['revision']}, headers=self.headers)
        updated = changed.json()['document']
        self.assertEqual((await self.transition(updated, 'publish')).status_code, 409)
        reviewed = (await self.transition(updated, 'submit')).json()['document']
        published = (await self.transition(reviewed, 'publish')).json()['document']
        self.assertEqual(published['status'], 'published')
        versions = (await self.client.get('/api/documents/' + doc['id'] + '/history')).json()['versions']
        self.assertEqual(len(versions), 6)
        self.assertEqual(versions[-1]['document']['title'], '새 업무')
        state = (await self.client.get('/api/state')).json()
        self.assertEqual(next(d for d in state['documents'] if d['id'] == doc['id'])['status'], 'published')

    async def test_conflict_and_export_old_version(self):
        doc = await self.create()
        url = '/api/documents/' + doc['id']
        edit = {**self.body, 'title': '변경', 'expectedRevision': 1}
        self.assertEqual((await self.client.put(url, json=edit, headers=self.headers)).status_code, 200)
        self.assertEqual((await self.client.put(url, json=edit, headers=self.headers)).status_code, 409)
        exported = await self.client.get(url + '/export?format=markdown&version=1')
        self.assertIn('# 새 업무', exported.text)
        self.assertIn('attachment', exported.headers['content-disposition'])
        self.assertEqual((await self.client.get(url + '/export?format=json')).json()['title'], '변경')
        self.assertEqual((await self.client.get(url + '/export?version=900')).status_code, 404)
        self.assertEqual((await self.client.get(url + '/export?format=exe')).status_code, 422)

    async def test_question_anchor_preservation_on_edit(self):
        doc = await self.create()
        b = doc['blocks'][0]
        s = b['sentences'][0]
        question = await self.client.post('/api/mutations', headers={**self.headers, 'Idempotency-Key': 'anchor'}, json={'action': 'question', 'documentId': doc['id'], 'blockId': b['id'], 'sentenceId': s['id'], 'quote': s['text'], 'title': '질문', 'content': '왜? '})
        self.assertEqual(question.status_code, 200)
        res = await self.client.put('/api/documents/' + doc['id'], headers=self.headers, json={**self.body, 'expectedRevision': 1, 'sections': [{'id': b['id'], 'title': '수정', 'text': '담당자를 확인한다.\n새 일정이다.'}]})
        updated = res.json()['document']
        self.assertEqual(updated['blocks'][0]['sentences'][0]['id'], s['id'])
        self.assertNotEqual(updated['blocks'][0]['sentences'][1]['id'], b['sentences'][1]['id'])
        self.assertIn(question.json()['thread']['id'], (await self.client.get('/api/state')).json()['threads'])

    async def test_import_text_docx_and_errors(self):
        async def upload(name, content):
            return await self.client.post('/api/documents/import', headers=self.headers, files={'file': (name, content)})
        self.assertEqual((await upload('업무.txt', '업무 정리\n인수인계'.encode())).json()['text'], '업무 정리\n인수인계')
        self.assertEqual((await upload('한글.txt', '업무'.encode('cp949'))).json()['text'], '업무')
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as archive:
            archive.writestr('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>담당 업무</w:t></w:r></w:p></w:body></w:document>')
        self.assertEqual((await upload('업무.docx', buffer.getvalue())).json()['text'], '담당 업무')
        from pypdf import PdfWriter
        from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
        writer = PdfWriter()
        page = writer.add_blank_page(width=600, height=800)
        font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): writer._add_object(font)})})
        stream = DecodedStreamObject()
        stream.set_data(b'BT /F1 12 Tf 50 700 Td (Monthly report on day 5) Tj ET')
        page[NameObject('/Contents')] = writer._add_object(stream)
        pdf = io.BytesIO()
        writer.write(pdf)
        self.assertIn('Monthly report', (await upload('report.pdf', pdf.getvalue())).json()['text'])
        self.assertEqual((await upload('bad.pdf', b'not pdf')).status_code, 422)
        self.assertEqual((await upload('bad.exe', b'hello')).status_code, 422)
        self.assertEqual((await upload('empty.txt', b'')).status_code, 422)
        self.assertEqual((await upload('large.txt', b'x' * (5 * 1024 * 1024 + 1))).status_code, 413)

    async def test_auth_and_validation(self):
        anonymous = httpx.AsyncClient(transport=httpx.ASGITransport(app=api.app), base_url='http://test')
        self.assertEqual((await anonymous.post('/api/documents', json=self.body)).status_code, 401)
        self.assertEqual((await self.client.post('/api/documents', json=self.body)).status_code, 403)
        self.assertEqual((await self.client.post('/api/documents', json={**self.body, 'title': ' '}, headers=self.headers)).status_code, 422)
        self.assertEqual((await self.client.post('/api/documents', json={**self.body, 'sections': []}, headers=self.headers)).status_code, 422)
        await anonymous.aclose()

    async def test_ai_unconfigured_valid_and_invalid_output(self):
        body = {'title': '인수인계', 'source': '매월 5일에 담당자가 실적 보고서를 제출한다. 원문 자료.'}
        with patch.dict(os.environ, {'BATON_AI_BASE_URL': '', 'BATON_AI_MODEL': ''}):
            self.assertEqual((await self.client.post('/api/documents/generate', json=body, headers=self.headers)).status_code, 503)
        real_client = httpx.AsyncClient
        for content, finish, expected in [(json.dumps({'summary': '요약', 'sections': [{'title': '보고', 'text': '매월 5일 제출'}]}), 'stop', 200), ('garbage', 'stop', 502), ('{}', 'length', 502)]:
            def respond(request):
                sent = json.loads(request.content)
                self.assertEqual(sent['model'], 'test-model')
                self.assertIn(body['source'], sent['messages'][1]['content'])
                return httpx.Response(200, json={'choices': [{'message': {'content': content}, 'finish_reason': finish}]})
            with patch.dict(os.environ, {'BATON_AI_BASE_URL': 'http://model/v1', 'BATON_AI_MODEL': 'test-model'}), patch('server.documents.httpx.AsyncClient', side_effect=lambda **kw: real_client(transport=httpx.MockTransport(respond), **kw)):
                result = await self.client.post('/api/documents/generate', json=body, headers=self.headers)
                self.assertEqual(result.status_code, expected, result.text)
        self.assertEqual(len((await self.client.get('/api/state')).json()['documents']), 2)

    async def test_browser_generation_prompt_and_response_validation(self):
        prompt = await self.client.get('/api/documents/generation-prompt')
        self.assertEqual(prompt.status_code, 200)
        self.assertIn('확인 필요', prompt.json()['systemPrompt'])
        body = {'title': '로컬 AI 초안', 'content': '```json\n' + json.dumps({'summary': '요약', 'sections': [{'title': '업무', 'text': '보고서를 전달한다.'}]}) + '\n```', 'finishReason': 'stop'}
        result = await self.client.post('/api/documents/validate-generation', headers=self.headers, json=body)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()['draft']['title'], body['title'])
        self.assertEqual((await self.client.post('/api/documents/validate-generation', headers=self.headers, json={**body, 'finishReason': 'length'})).status_code, 422)
        self.assertEqual((await self.client.post('/api/documents/validate-generation', headers=self.headers, json={**body, 'content': 'invalid'})).status_code, 422)
        self.assertEqual((await self.client.post('/api/documents/validate-generation', json=body)).status_code, 403)
        self.assertEqual(len((await self.client.get('/api/state')).json()['documents']), 2)
