import {documentRequest} from './api';

export const LOCAL_AI_URL = 'http://127.0.0.1:12345/v1';

async function localFetch(path: string, init?: RequestInit, timeout = 10000): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(LOCAL_AI_URL + path, {...init, credentials: 'omit', signal: AbortSignal.timeout(timeout)});
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('로컬 AI 응답 시간이 초과되었습니다. 모델 로딩 상태를 확인하고 다시 시도해 주세요.');
    }
    throw new Error('로컬 AI에 연결하지 못했습니다. 이 브라우저와 같은 PC에서 모델 서버를 켜고, LM Studio의 CORS 허용과 브라우저의 로컬 네트워크 접근 권한을 확인해 주세요.');
  }
  if (!response.ok) throw new Error(`로컬 AI 서버가 오류를 반환했습니다 (HTTP ${response.status}). 모델 로딩과 서버 로그를 확인해 주세요.`);
  return response;
}

export async function loadLocalModels(): Promise<string[]> {
  const response = await localFetch('/models');
  const data = await response.json();
  const models = Array.isArray(data.data) ? data.data.map((m: {id?: unknown}) => m.id).filter((id: unknown): id is string => typeof id === 'string' && id.length > 0) : [];
  if (!models.length) throw new Error('사용 가능한 모델이 없습니다. LM Studio에서 대화 모델을 로드한 뒤 다시 연결해 주세요.');
  return models;
}

export async function generateLocally<T>(title: string, source: string, model: string): Promise<T> {
  if (!model) throw new Error('로컬 AI 연결 버튼을 눌러 모델을 선택해 주세요.');
  const {systemPrompt} = await documentRequest<{systemPrompt: string}>('/generation-prompt');
  const response = await localFetch('/chat/completions', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({model, max_tokens: 6000, stream: false,
      messages: [{role: 'system', content: systemPrompt}, {role: 'user', content: JSON.stringify({title, source})}]})
  }, 180000);
  const data = await response.json();
  const choice = data.choices?.[0];
  if (typeof choice?.message?.content !== 'string') throw new Error('로컬 AI 응답에 본문이 없습니다. 대화 모델을 선택해 주세요.');
  return documentRequest<T>('/validate-generation', 'POST', {title, content: choice.message.content, finishReason: choice.finish_reason || 'stop'});
}
