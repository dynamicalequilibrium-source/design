import {MOCK_WIKI_DOCUMENTS, MOCK_KIN_THREADS} from './data/mockWikiData';
import type {KinAnswer, KinThread, WikiAuthor} from './types/wiki';

// Netlify is a static host. Demo changes stay in this browser only.
// Opt in to the original FastAPI backend by setting VITE_USE_FASTAPI=true at build time.
export const isBrowserDemo =
  import.meta.env.PROD && import.meta.env.VITE_USE_FASTAPI !== 'true';

const STORAGE_KEY = 'baton:netlify-browser-demo:v1';
const DEMO_USER: WikiAuthor = {
  name: '시연 사용자',
  role: '질문·답변 작성자',
  level: '',
  department: '개인 브라우저',
  avatarColor: 'bg-indigo-500'
};

function seedThreads(): Record<string, KinThread> {
  return Object.fromEntries(Object.values(MOCK_KIN_THREADS).map(original => {
    const thread: KinThread = structuredClone(original);
    // Example answers must not pretend to have official approval.
    thread.answers = thread.answers.map(answer => ({
      ...answer, isOfficialReviewed: false, reviewNote: undefined
    }));
    return [thread.id, thread];
  }));
}

function readThreads(): Record<string, KinThread> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, KinThread>;
      }
    }
  } catch {
    // Do not discard the app when storage is unavailable; writes will report failure.
  }
  return seedThreads();
}

export function loadBrowserDemoState() {
  return {documents: structuredClone(MOCK_WIKI_DOCUMENTS), threads: readThreads()};
}

export function saveBrowserDemoMutation(payload: Record<string, string>): {thread: KinThread} {
  const threads = readThreads();
  const now = new Date().toISOString();
  let thread: KinThread;

  if (payload.action === 'question') {
    const document = MOCK_WIKI_DOCUMENTS.find(doc => doc.id === payload.documentId);
    const block = document?.blocks.find(item => item.id === payload.blockId);
    const sentence = block?.sentences.find(item => item.id === payload.sentenceId);
    if (!document || !block || !sentence || sentence.text !== payload.quote) {
      throw new Error('질문 대상 문장과 문서를 다시 선택해 주세요.');
    }
    if (!payload.title?.trim() || !payload.content?.trim()) {
      throw new Error('질문 제목과 내용을 입력해 주세요.');
    }

    thread = {
      id: 'thread-' + crypto.randomUUID(),
      documentId: document.id,
      blockId: block.id,
      sentenceId: sentence.id,
      sentenceQuote: sentence.text,
      title: payload.title.trim(),
      content: payload.content.trim(),
      author: DEMO_USER,
      createdAt: now,
      views: 0,
      empathyCount: 0,
      status: 'WAITING',
      tags: [],
      answers: []
    };
  } else {
    const existing = threads[payload.threadId];
    if (!existing) throw new Error('선택한 질문을 찾지 못했습니다.');
    thread = structuredClone(existing);

    if (payload.action === 'answer') {
      if (!payload.content?.trim()) throw new Error('답변 내용을 입력해 주세요.');
      const answer: KinAnswer = {
        id: 'answer-' + crypto.randomUUID(),
        author: DEMO_USER,
        content: payload.content.trim(),
        createdAt: now,
        isAdopted: false,
        isOfficialReviewed: false,
        likes: 0,
        evidenceLinks: [],
        comments: [],
        evidenceNote: {
          title: payload.evidenceTitle || '',
          location: payload.evidenceLoc || '',
          verified: false
        }
      };
      thread.answers = [...thread.answers, answer];
    } else if (payload.action === 'comment') {
      if (!payload.content?.trim()) throw new Error('댓글 내용을 입력해 주세요.');
      const answer = thread.answers.find(item => item.id === payload.answerId);
      if (!answer) throw new Error('답변을 찾지 못했습니다.');
      answer.comments = [
        ...answer.comments,
        {id: 'comment-' + crypto.randomUUID(), author: DEMO_USER.name,
         content: payload.content.trim(), createdAt: now}
      ];
    } else {
      throw new Error('지원하지 않는 작업입니다.');
    }
  }

  threads[thread.id] = thread;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    throw new Error('브라우저 저장에 실패했습니다. 저장 공간과 사이트 권한을 확인해 주세요.');
  }
  return {thread};
}
