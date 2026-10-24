import type {KinThread} from './types/wiki';

// This is a personal browser-to-localhost demo, not a shared AI service.
const LOCAL_API = 'http://127.0.0.1:12345/v1/chat/completions';

export async function generateAiDraft(thread: KinThread): Promise<string> {
  let response: Response;
  try {
    response = await fetch(LOCAL_API, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: 'google/gemma-4-e4b',
        messages: [
          {role: 'system', content: '당신은 업무 인수인계 답변 초안을 만드는 한국어 조력자입니다. 제공된 정보만 근거로 답하고, 법령 조항과 문서 근거를 만들어내지 마세요. 불확실한 사항은 확인 필요라고 표시하세요. 공식 답변이나 검토 완료라고 주장하지 마세요.'},
          {role: 'user', content:
            '관련 문장: ' + thread.sentenceQuote.slice(0, 1000) +
            '\n질문 제목: ' + thread.title.slice(0, 300) +
            '\n질문 내용: ' + thread.content.slice(0, 3000) +
            '\n\n실무적으로 도움이 되는 답변 초안을 작성해 주세요.'}
        ],
        max_tokens: 2048,
        temperature: 0.3,
        stream: false
      })
    });
  } catch {
    throw new Error('LM Studio에 연결하지 못했습니다. 같은 PC에서 모델 서버(12345)와 CORS 및 브라우저 로컬 네트워크 접근 권한을 확인해 주세요.');
  }
  if (!response.ok) {
    throw new Error('LM Studio API 오류 (' + response.status + '). 모델과 서버 상태를 확인해 주세요.');
  }
  const data = await response.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('AI 최종 답변이 비어 있습니다 (종료: ' +
      (choice?.finish_reason || '알 수 없음') + '). LM Studio 모델 설정을 확인해 주세요.');
  }
  return content.trim();
}
