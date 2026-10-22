"""Local sample API. Run on loopback; not a production authentication service."""
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field

app = FastAPI(title='업무 바통 · 로컬 샘플 API')
DB_PATH = Path(os.getenv('BATON_DB', str(Path(__file__).parent / 'data' / 'baton.sqlite3')))
SEED = json.loads(Path(__file__).with_name('seed.json').read_text())
USER = {'name': '샘플 질문자', 'role': '열람·질문자', 'level': '', 'department': '샘플 업무팀', 'avatarColor': 'bg-emerald-500'}

@contextmanager
def database():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH, timeout=10) as db:
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        db.executescript('''
          CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, data TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS threads (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id), data TEXT NOT NULL);
          CREATE INDEX IF NOT EXISTS threads_document ON threads(document_id);
          CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, csrf TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS requests (key TEXT PRIMARY KEY, session_id TEXT NOT NULL, body TEXT NOT NULL, result TEXT NOT NULL);
        ''')
        for doc in SEED['documents']:
            db.execute('INSERT OR IGNORE INTO documents VALUES (?,?)', (doc['id'], json.dumps(doc, ensure_ascii=False)))
        # Seed once, using stable thread IDs; never overwrite user changes.
        for thread in SEED['threads'].values():
            thread = json.loads(json.dumps(thread))
            for answer in thread['answers']:
                answer['isOfficialReviewed'] = False
                answer.pop('reviewNote', None)
            db.execute('INSERT OR IGNORE INTO threads VALUES (?,?,?)', (thread['id'], thread['documentId'], json.dumps(thread, ensure_ascii=False)))
        db.commit()
        yield db


def session(request, db, write=False):
    row = db.execute('SELECT * FROM sessions WHERE id=?', (request.cookies.get('baton_session', ''),)).fetchone()
    if not row:
        raise HTTPException(401, '샘플 세션을 다시 시작해 주세요.')
    if write and not secrets.compare_digest(request.headers.get('X-CSRF-Token', ''), row['csrf']):
        raise HTTPException(403, '요청 확인 정보가 올바르지 않습니다.')
    return row

@app.get('/api/session')
async def start_session(request: Request, response: Response):
    with database() as db:
        row = db.execute('SELECT * FROM sessions WHERE id=?', (request.cookies.get('baton_session', ''),)).fetchone()
        if not row:
            sid, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
            db.execute('INSERT INTO sessions VALUES (?,?)', (sid, csrf))
            row = {'id': sid, 'csrf': csrf}
        response.set_cookie('baton_session', row['id'], httponly=True, samesite='strict')
        response.headers['Cache-Control'] = 'no-store'
        return {'user': USER, 'csrfToken': row['csrf'], 'mode': 'local-sample'}

@app.get('/api/state')
async def read_state(request: Request, response: Response):
    with database() as db:
        session(request, db)
        response.headers['Cache-Control'] = 'no-store'
        return {'documents': [json.loads(r['data']) for r in db.execute('SELECT data FROM documents')],
                'threads': {r['id']: json.loads(r['data']) for r in db.execute('SELECT id,data FROM threads')}}

class Mutation(BaseModel):
    action: str
    documentId: str = ''
    blockId: str = ''
    sentenceId: str = ''
    quote: str = Field(default='', max_length=20000)
    threadId: str = ''
    answerId: str = ''
    title: str = Field(default='', max_length=300)
    content: str = Field(default='', max_length=20000)
    evidenceTitle: str = Field(default='', max_length=300)
    evidenceLoc: str = Field(default='', max_length=300)

@app.post('/api/mutations')
async def mutate(body: Mutation, request: Request):
    with database() as db:
        # Serialize replay checks and writes, including concurrent duplicate requests.
        db.execute('BEGIN IMMEDIATE')
        who = session(request, db, True)
        key = request.headers.get('Idempotency-Key', '')
        if not key or len(key) > 200:
            raise HTTPException(400, '요청 식별자가 필요합니다.')
        payload = body.model_dump_json()
        previous = db.execute('SELECT * FROM requests WHERE key=?', (key,)).fetchone()
        if previous:
            if previous['session_id'] != who['id'] or previous['body'] != payload:
                raise HTTPException(409, '같은 요청 식별자의 내용이 다릅니다.')
            return json.loads(previous['result'])
        now = datetime.now(timezone.utc).isoformat()
        if body.action == 'question':
            row = db.execute('SELECT data FROM documents WHERE id=?', (body.documentId,)).fetchone()
            if not row:
                raise HTTPException(404, '문서를 찾을 수 없습니다.')
            doc = json.loads(row['data'])
            block = next((b for b in doc['blocks'] if b['id'] == body.blockId), None)
            sentence = next((s for s in block['sentences'] if s['id'] == body.sentenceId), None) if block else None
            if not sentence or sentence['text'] != body.quote:
                raise HTTPException(409, '질문 대상 문장과 버전을 다시 확인해 주세요.')
            if not body.title.strip() or not body.content.strip():
                raise HTTPException(422, '질문 제목과 내용을 입력해 주세요.')
            tid = 'thread-' + uuid4().hex
            thread = {'id': tid, 'documentId': doc['id'], 'blockId': block['id'], 'sentenceId': sentence['id'],
                      'sentenceQuote': body.quote, 'originVersion': doc['version'],
                      'anchor': {'quote_exact': body.quote, 'quote_prefix': '', 'quote_suffix': '', 'start_cp': 0, 'end_cp': len(body.quote), 'resolution_state': 'bound'},
                      'title': body.title.strip(), 'content': body.content.strip(), 'author': USER,
                      'createdAt': now, 'views': 0, 'empathyCount': 0, 'status': 'WAITING', 'tags': [], 'answers': []}
            db.execute('INSERT INTO threads VALUES (?,?,?)', (tid, doc['id'], json.dumps(thread, ensure_ascii=False)))
        else:
            row = db.execute('SELECT data FROM threads WHERE id=?', (body.threadId,)).fetchone()
            if not row:
                raise HTTPException(404, '질문을 찾을 수 없습니다.')
            thread = json.loads(row['data'])
            if body.action == 'answer':
                if not body.content.strip():
                    raise HTTPException(422, '답변을 입력해 주세요.')
                thread['answers'].append({'id': 'answer-' + uuid4().hex, 'author': USER, 'content': body.content.strip(), 'createdAt': now,
                    'isAdopted': False, 'isOfficialReviewed': False, 'likes': 0, 'evidenceLinks': [], 'comments': [],
                    'evidenceNote': {'title': body.evidenceTitle, 'location': body.evidenceLoc, 'verified': False}})
            elif body.action == 'comment':
                answer = next((a for a in thread['answers'] if a['id'] == body.answerId), None)
                if not answer:
                    raise HTTPException(404, '답변을 찾을 수 없습니다.')
                if not body.content.strip():
                    raise HTTPException(422, '댓글을 입력해 주세요.')
                answer['comments'].append({'id': 'comment-' + uuid4().hex, 'author': USER['name'], 'content': body.content.strip(), 'createdAt': now})
            else:
                raise HTTPException(422, '지원하지 않는 작업입니다.')
            db.execute('UPDATE threads SET data=? WHERE id=?', (json.dumps(thread, ensure_ascii=False), thread['id']))
        result = {'thread': thread}
        db.execute('INSERT INTO requests VALUES (?,?,?,?)', (key, who['id'], payload, json.dumps(result, ensure_ascii=False)))
        return result
