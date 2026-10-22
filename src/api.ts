import type {WikiDocument, KinThread} from './types/wiki';
let csrfToken = '';
const pending = new Map<string, string>();
export async function loadState(): Promise<{documents: WikiDocument[]; threads: Record<string, KinThread>}> {
  const session = await fetch('/api/session');
  if (!session.ok) throw new Error('샘플 세션을 시작하지 못했습니다.');
  csrfToken = (await session.json()).csrfToken;
  const response = await fetch('/api/state');
  if (!response.ok) throw new Error('문서를 불러오지 못했습니다.');
  return response.json();
}
export async function saveMutation(payload: Record<string, string>): Promise<{thread: KinThread}> {
  const body = JSON.stringify(payload);
  const key = pending.get(body) || crypto.randomUUID();
  pending.set(body, key);
  const response = await fetch('/api/mutations', {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, 'Idempotency-Key': key}, body
  }).catch(() => {throw new Error('서버 저장 실패. 입력 내용은 유지됩니다. 다시 시도해 주세요.');});
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(typeof data.detail === 'string' ? data.detail : '저장 실패. 입력 내용을 확인해 주세요.');
  }
  pending.delete(body);
  return response.json();
}
