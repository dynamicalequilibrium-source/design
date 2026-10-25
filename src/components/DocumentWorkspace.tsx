import React, {useEffect, useRef, useState} from 'react';
import type {WikiDocument} from '../types/wiki';
import {documentRequest} from '../api';
import {generateLocally, loadLocalModels, LOCAL_AI_URL} from '../localAI';

type Section = {id?: string; title: string; text: string};
type Draft = {title: string; summary: string; sections: Section[]; expectedRevision: number};
type Version = {revision: number; note: string; document: WikiDocument};
const statuses: Record<string, string> = {draft: '초안', review: '검토 중', published: '게시됨', sample: '샘플'};
const blank = (): Draft => ({title: '', summary: '', sections: [{title: '업무 개요', text: ''}], expectedRevision: 0});
const field = 'w-full border border-slate-300 rounded-lg p-2 text-sm bg-white';
const button = 'px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-emerald-50 disabled:opacity-50';

export function DocumentWorkspace({document: doc, onSaved, editorSignal}: {document: WikiDocument; onSaved: (doc: WikiDocument) => void; editorSignal: number}) {
  const [mode, setMode] = useState<'new' | 'edit' | 'history' | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [source, setSource] = useState('');
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [localModel, setLocalModel] = useState('');
  const [useLocal, setUseLocal] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [preview, setPreview] = useState<Version | null>(null);
  const focus = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const status = doc.status || 'sample';
  const key = 'baton-authoring:' + (mode === 'new' ? 'new' : doc.id);

  const openEditor = (kind: 'new' | 'edit') => {
    trigger.current = window.document.activeElement as HTMLElement;
    const initial = kind === 'new' ? blank() : {title: doc.title, summary: doc.summary, expectedRevision: doc.revision || 0,
      sections: doc.blocks.map(b => ({id: b.id, title: b.title || '', text: b.sentences.map(s => s.text).join('\n')}))};
    const draftKey = 'baton-authoring:' + (kind === 'new' ? 'new' : doc.id);
    let recovered: {draft: Draft; source: string} | null = null;
    try { recovered = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* unavailable storage */ }
    setDraft(recovered?.draft || initial); setSource(recovered?.source || '');
    setNotice(recovered ? '이 브라우저에 남아 있던 작성 내용을 복원했습니다.' : '');
    setError(''); setMode(kind);
  };
  const lastSignal = useRef(editorSignal);
  useEffect(() => {
    if (lastSignal.current !== editorSignal) {lastSignal.current = editorSignal; openEditor('edit');}
  }, [editorSignal]);
  useEffect(() => {
    if (mode === 'new' || mode === 'edit') {
      try {localStorage.setItem(key, JSON.stringify({draft, source}));} catch { /* server save remains available */ }
    }
  }, [draft, source, mode, key]);
  const close = () => {if (!busy) {setMode(null); requestAnimationFrame(() => trigger.current?.focus());}};
  useEffect(() => {
    if (!mode) return;
    focus.current?.focus();
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {setMode(null); requestAnimationFrame(() => trigger.current?.focus());}
      if (e.key === 'Tab') {
        const items = Array.from(window.document.querySelectorAll<HTMLElement>('[data-authoring-dialog] button:not(:disabled), [data-authoring-dialog] input, [data-authoring-dialog] textarea, [data-authoring-dialog] a[href]'));
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && (window.document.activeElement === first || window.document.activeElement === focus.current)) {e.preventDefault(); last?.focus();}
        else if (!e.shiftKey && window.document.activeElement === last) {e.preventDefault(); first?.focus();}
      }
    };
    window.addEventListener('keydown', keydown);
    return () => {window.document.body.style.overflow = previous; window.removeEventListener('keydown', keydown);};
  }, [mode, busy]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try {await action();} catch (e) {setError(e instanceof Error ? e.message : '작업에 실패했습니다.');}
    finally {setBusy(false);}
  };
  const save = () => run(async () => {
    const result = await documentRequest<{document: WikiDocument}>(mode === 'new' ? '' : '/' + doc.id, mode === 'new' ? 'POST' : 'PUT', draft);
    try {localStorage.removeItem(key);} catch { /* optional storage */ }
    onSaved(result.document); setMode(null); setNotice('초안을 저장했습니다. 내용을 확인한 뒤 검토를 요청해 주세요.');
  });
  const workflow = (action: string) => run(async () => {
    const result = await documentRequest<{document: WikiDocument}>('/' + doc.id + '/workflow', 'POST', {action, note, expectedRevision: doc.revision || 0});
    onSaved(result.document); setNote(''); setNotice(action === 'publish' ? '검토 의견과 함께 게시했습니다.' : action === 'submit' ? '검토를 요청했습니다.' : '수정을 위해 초안으로 되돌렸습니다.');
  });
  const history = () => run(async () => {
    const result = await documentRequest<{versions: Version[]}>('/' + doc.id + '/history');
    trigger.current = window.document.activeElement as HTMLElement;
    setVersions(result.versions); setPreview(null); setMode('history');
  });
  const updateSection = (index: number, change: Partial<Section>) => setDraft(d => ({...d, sections: d.sections.map((s, i) => i === index ? {...s, ...change} : s)}));

  return <section aria-label="문서 관리" className="document-tools max-w-7xl mx-auto w-full p-4 space-y-3 bg-white border-b">
    <div className="flex items-center gap-2 flex-wrap">
      <strong className="text-sm text-emerald-800">{statuses[status]} · {doc.version}</strong>
      <button className={button + ' bg-emerald-700 text-white'} onClick={() => openEditor('new')} disabled={busy}>새 인수인계서</button>
      <button className={button} onClick={() => openEditor('edit')} disabled={busy || status === 'review'}>문서 편집</button>
      {status === 'draft' && <button className={button} onClick={() => workflow('submit')} disabled={busy}>검토 요청</button>}
      <button className={button} onClick={history} disabled={busy}>버전 기록</button>
      <a className={button} href={'/api/documents/' + doc.id + '/export?format=markdown'}>Markdown 다운로드</a>
      <a className={button} href={'/api/documents/' + doc.id + '/export?format=json'}>JSON 다운로드</a>
      <button className={button} onClick={() => window.print()}>인쇄 / PDF</button>
    </div>
    {status === 'review' && <div className="flex flex-wrap gap-2 items-center">
      <label className="flex-1 min-w-48">검토 의견<input className={field} value={note} onChange={e => setNote(e.target.value)} placeholder="원문 대조 결과와 수정 사항을 적어 주세요" maxLength={3000}/></label>
      <button className={button} onClick={() => workflow('return')} disabled={busy || !note.trim()}>수정 요청</button>
      <button className={button + ' bg-emerald-100'} onClick={() => workflow('publish')} disabled={busy || !note.trim()}>검토 완료 및 게시</button>
      <p className="text-xs text-slate-500 w-full">현재는 공유 샘플 사용자로 작성과 검토를 진행합니다.</p>
    </div>}
    {notice && !mode && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
    {error && !mode && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {mode && <div className="fixed inset-0 z-[100] bg-slate-900/50 p-3 sm:p-8 flex justify-center">
      <div role="dialog" aria-modal="true" aria-labelledby="authoring-heading" data-authoring-dialog className="bg-white rounded-xl w-full max-w-4xl overflow-auto p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center"><h2 id="authoring-heading" tabIndex={-1} ref={focus} className="text-xl font-bold">{mode === 'history' ? '문서 버전 기록' : mode === 'new' ? '새 인수인계서 작성' : '인수인계서 편집'}</h2><button className={button} onClick={close} disabled={busy}>닫기</button></div>
        {mode === 'history' ? <>
          {versions.length === 0 && <p>아직 저장된 편집 기록이 없습니다.</p>}
          {versions.map(v => <div key={v.revision} className="border rounded p-3 flex gap-2 flex-wrap items-center"><button className={button} onClick={() => setPreview(v)}>버전 {v.revision} 보기</button><span className="text-sm break-words">{v.note} · {v.document.lastModified}</span><a className={button} href={`/api/documents/${doc.id}/export?format=markdown&version=${v.revision}`}>이 버전 다운로드</a></div>)}
          {preview && <article className="bg-slate-50 p-4 space-y-3"><h3 className="font-bold">{preview.document.title} · 버전 {preview.revision}</h3><p>{preview.document.summary}</p>{preview.document.blocks.map(b => <div key={b.id}><h4 className="font-semibold">{b.title}</h4>{b.sentences.map(s => <p key={s.id} className="whitespace-pre-wrap">{s.text}</p>)}{b.tableData && <pre className="overflow-auto text-xs">{JSON.stringify(b.tableData, null, 2)}</pre>}</div>)}</article>}
        </> : <>
          <p className="text-sm text-slate-600">직접 작성하거나 파일에서 원문을 가져오세요. AI 초안은 내용을 확인한 후 저장해 주세요. 작성 중인 내용은 이 브라우저에 자동 보관됩니다.</p>
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
            <label className="block font-medium text-sm">문서 제목<input className={field} value={draft.title} maxLength={300} onChange={e => setDraft(d => ({...d, title: e.target.value}))}/></label>
            <details open={mode === 'new'} className="bg-emerald-50 p-3 rounded-lg">
              <summary className="cursor-pointer font-medium text-sm">파일 가져오기 · AI 초안 생성</summary>
              <div className="border border-emerald-200 rounded-lg p-3 mt-3 space-y-2">
                <p className="text-sm font-medium">내 PC의 로컬 AI</p>
                <p className="text-xs text-slate-600 break-all">{LOCAL_AI_URL} · 현재 브라우저와 같은 PC에서 실행 중인 모델에 연결합니다.</p>
                <button className={button} onClick={() => run(async () => {const models = await loadLocalModels(); setLocalModels(models); setLocalModel(previous => models.includes(previous) ? previous : models[0]); setUseLocal(true); setNotice('로컬 모델 목록을 확인했습니다. 모델을 선택하고 AI 초안 생성을 눌러 주세요.');})}>로컬 AI 연결</button>
                {localModels.length > 0 && <label className="block text-sm">로컬 AI 모델<select className={field} value={localModel} onChange={e => setLocalModel(e.target.value)}>{localModels.map(model => <option key={model} value={model}>{model}</option>)}</select></label>}
                {localModels.length > 0 && <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={useLocal} onChange={e => setUseLocal(e.target.checked)}/>선택한 로컬 모델로 초안 생성</label>}
                <p className="text-xs text-slate-600">LM Studio에서 CORS를 허용해 주세요. 원문이 선택한 모델로 전송되며, 연결 실패 시 입력은 유지됩니다.</p>
              </div>
              <label className="block text-sm mt-3">원문 파일 (TXT, MD, PDF, DOCX · 5MB 이하)<input className={field} type="file" accept=".txt,.md,.pdf,.docx" onChange={e => {
                const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
                if (file.size > 5 * 1024 * 1024) {setError('파일은 5MB 이하만 지원합니다.'); return;}
                run(async () => {const form = new FormData(); form.append('file', file); const result = await documentRequest<{text: string}>('/import', 'POST', form); setSource(result.text); setNotice('원문을 가져왔습니다. 아래에서 직접 본문으로 사용하거나 AI 초안을 생성하세요.');});
              }}/></label>
              <label className="block text-sm mt-3">참고 원문<textarea className={field} rows={6} value={source} maxLength={60000} onChange={e => setSource(e.target.value)}/></label>
              <div className="flex gap-2 flex-wrap mt-2">
                <button className={button} disabled={!source.trim()} onClick={() => {setDraft(d => ({...d, sections: [...d.sections.filter(s => s.text.trim()), {title: '가져온 원문', text: source}]})); setNotice('원문을 본문 끝에 추가했습니다.');}}>원문을 본문에 추가</button>
                <button className={button + ' bg-emerald-100'} disabled={!draft.title.trim() || source.trim().length < 20} onClick={() => run(async () => {const result = useLocal ? await generateLocally<{draft: Draft; notice: string}>(draft.title, source, localModel) : await documentRequest<{draft: Draft; notice: string}>('/generate', 'POST', {title: draft.title, source}); setDraft(d => ({...d, summary: result.draft.summary, sections: [...d.sections.filter(s => s.text.trim()), ...result.draft.sections]})); setNotice(result.notice + ' 기존 본문 뒤에 추가했습니다.');})}>AI 초안 생성</button>
              </div>
            </details>
            <label className="block text-sm font-medium">요약<textarea className={field} rows={2} value={draft.summary} maxLength={3000} onChange={e => setDraft(d => ({...d, summary: e.target.value}))}/></label>
            {draft.sections.map((s, i) => <div key={i} className="border rounded-lg p-3 space-y-2">
              <label className="block text-sm">문단 {i + 1} 제목<input className={field} value={s.title} maxLength={300} onChange={e => updateSection(i, {title: e.target.value})}/></label>
              <label className="block text-sm">문단 {i + 1} 본문<textarea className={field} rows={6} value={s.text} maxLength={60000} onChange={e => updateSection(i, {text: e.target.value})}/></label>
              {s.id && doc.blocks.find(b => b.id === s.id)?.tableData && <p className="text-xs text-slate-500">이 문단의 기존 표는 그대로 보존됩니다.</p>}
              <button className={button} disabled={draft.sections.length === 1} onClick={() => setDraft(d => ({...d, sections: d.sections.filter((_, n) => n !== i)}))}>문단 {i + 1} 삭제</button>
            </div>)}
            <button className={button} disabled={draft.sections.length >= 100} onClick={() => setDraft(d => ({...d, sections: [...d.sections, {title: '', text: ''}]}))}>문단 추가</button>
          </fieldset>
          <div className="flex gap-2 items-center"><button className={button + ' bg-emerald-700 text-white'} disabled={busy || !draft.title.trim() || !draft.sections.some(s => s.text.trim())} onClick={save}>초안 저장</button>{busy && <span role="status">처리 중입니다…</span>}</div>
        </>}
        {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </div>}
  </section>;
}
