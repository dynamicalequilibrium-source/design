import React, { useState, useEffect, useRef } from 'react';
import { 
  KinThread, 
  KinAnswer, 
  WikiSentence, 
  WikiBlock, 
  EvidenceLink 
} from '../types/wiki';
import { 
  X, 
  CheckCircle, 
  Heart, 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  Sparkles,
  HelpCircle,
  Award,
  Share2,
  Bookmark,
  Check,
  CornerDownRight,
  PenTool,
  Quote
} from 'lucide-react';

interface NaverKinModalProps {
  sentence: WikiSentence;
  block: WikiBlock;
  thread?: KinThread;
  draftKey: string;
  threads: KinThread[];
  onSelectThread: (id: string) => void;
  onClose: () => void;
  onAddAnswer: (threadId: string, answerText: string, evidenceTitle: string, evidenceLoc: string) => Promise<void>;
  onCreateThread: (sentenceId: string, quote: string, title: string, content: string) => Promise<void>;
  onToggleEmpathy: (threadId: string) => void;
  onToggleAnswerLike: (threadId: string, answerId: string) => void;
  onAddComment: (threadId: string, answerId: string, commentText: string) => Promise<void>;
}

export const NaverKinModal: React.FC<NaverKinModalProps> = ({
  sentence,
  block,
  thread,
  threads,
  onSelectThread,
  draftKey,
  onClose,
  onAddAnswer,
  onCreateThread,
  onToggleEmpathy,
  onToggleAnswerLike,
  onAddComment
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>('button, input, select, textarea')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {event.stopPropagation(); onClose();}
      if (event.key !== 'Tab' || !dialog) return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea')).filter(n => n.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
      if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);
  function useDraft<T>(field: string, fallback: T) {
    const answerScope = ['answer', 'evidenceTitle', 'evidenceLoc'].includes(field) ? `:${thread?.id || 'new'}` : '';
    const key = `baton:sample:${draftKey}${answerScope}:${field}`;
    const read = () => {
      try {return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;}
      catch {return fallback;}
    };
    const [stored, setStored] = useState<{key: string; value: T}>(() => ({key, value: read()}));
    const value = stored.key === key ? stored.value : read();
    const setValue = (next: T) => {
      setStored({key, value: next});
      try {localStorage.setItem(key, JSON.stringify(next));}
      catch {setError('이 브라우저에 임시저장하지 못했습니다. 입력 내용은 현재 화면에 유지됩니다.');}
    };
    return [value, setValue] as const;
  }
  const [activeTab, setActiveTab] = useState<'view' | 'new_question' | 'write_answer'>(
    thread ? 'view' : 'new_question'
  );

  const [error, setError] = useState('');
  // Answer creation state
  const [answerContent, setAnswerContent] = useDraft('answer', '');
  const [evidenceTitle, setEvidenceTitle] = useDraft('evidenceTitle', '');
  const [evidenceLoc, setEvidenceLoc] = useDraft('evidenceLoc', '');
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);

  // New Question state
  const [newTitle, setNewTitle] = useDraft('title', '');
  const [newContent, setNewContent] = useDraft('content', '');

  // Comment input per answer
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const handleCommentChange = (answerId: string, text: string) => {
    setCommentInputs(prev => ({ ...prev, [answerId]: text }));
  };

  const handleToggleComments = (answerId: string) => {
    setOpenComments(prev => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const handleSubmitComment = async (answerId: string) => {
    const text = commentInputs[answerId]?.trim();
    if (!text || !thread || isAnswerSubmitting) return;
    setIsAnswerSubmitting(true); setError('');
    try {
      await onAddComment(thread.id, answerId, text);
      setCommentInputs(prev => ({...prev, [answerId]: ''}));
      setOpenComments(prev => ({...prev, [answerId]: true}));
    } catch (e) {setError(e instanceof Error ? e.message : '저장하지 못했습니다. 입력 내용은 유지됩니다.');}
    finally {setIsAnswerSubmitting(false);}
  };
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim() || !thread || isAnswerSubmitting) return;
    setIsAnswerSubmitting(true); setError('');
    try {
      await onAddAnswer(thread.id, answerContent, evidenceTitle, evidenceLoc);
      setAnswerContent(''); setEvidenceTitle(''); setEvidenceLoc(''); setActiveTab('view');
    } catch (e) {setError(e instanceof Error ? e.message : '저장하지 못했습니다. 입력 내용은 유지됩니다.');}
    finally {setIsAnswerSubmitting(false);}
  };
  const handleSubmitNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || isAnswerSubmitting) return;
    setIsAnswerSubmitting(true); setError('');
    try {
      await onCreateThread(sentence.id, sentence.text, newTitle, newContent);
      setNewTitle(''); setNewContent(''); setActiveTab('view');
    } catch (e) {setError(e instanceof Error ? e.message : '등록하지 못했습니다. 입력 내용은 유지됩니다.');}
    finally {setIsAnswerSubmitting(false);}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Modal Container: Styled as NAVER JiSik-iN */}
      <div 
        ref={dialogRef} role="dialog" aria-modal="true" aria-label="문장별 질문과 답변" className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {error && <p role="alert" className="p-3 bg-red-50 text-red-800">{error}</p>}
        {threads.length > 0 && <label className="p-3 text-sm">연결된 질문 {threads.length}건
          <select aria-label="연결된 질문 선택" value={thread?.id || ''} onChange={e => {onSelectThread(e.target.value); setActiveTab('view');}} className="w-full border p-2">
            {threads.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>}
        {/* 1. Baton Q&A Classic Top Green Header */}
        <div className="bg-[#00a495] text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            {/* Iconic Baton Badge Logo */}
            <div className="bg-white text-[#008275] font-black text-xs px-2 py-0.5 rounded tracking-tighter shadow-2xs">
              BATON
            </div>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight">
              <span className="text-white text-base font-extrabold">바통 Q&A</span>
              <span className="text-emerald-100 text-xs font-normal border-l border-white/30 pl-2">
                업무 바통 실무 지식 아카이브
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] bg-black/15 px-2 py-0.5 rounded text-white/90">
              {block.sectionNumber} {block.title}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/20 text-white transition cursor-pointer"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Original Sentence Quote Box */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-3 shrink-0">
          <div className="flex items-start gap-2 text-xs">
            <Quote className="w-3.5 h-3.5 text-[#00a495] shrink-0 mt-0.5 rotate-180" />
            <div className="flex-1">
              <span className="text-[11px] font-bold text-[#008275] block mb-0.5">
                바통위키 본문 인용 구절
              </span>
              <p className="text-slate-800 font-medium leading-relaxed italic bg-white/70 p-2 rounded border border-emerald-200/60">
                "{sentence.text}"
              </p>
            </div>
          </div>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-5 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('view')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'view'
                ? 'border-[#00a495] text-[#008275] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>바통 Q&A 질문 & 답변 {thread ? `(${thread.answers.length}개)` : '(0개)'}</span>
          </button>

          {thread && (
            <button
              onClick={() => setActiveTab('write_answer')}
              className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'write_answer'
                  ? 'border-[#00a495] text-[#008275] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-[#00a495]" />
              <span>답변 작성하기</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('new_question')}
            className={`py-2.5 px-4 font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'new_question'
                ? 'border-[#00a495] text-[#008275] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>새 질문 등록</span>
          </button>
        </div>

        {/* 3. Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* VIEW TAB: QUESTION & ANSWERS */}
          {activeTab === 'view' && (
            <>
              {thread ? (
                <div className="space-y-6">
                  
                  {/* QUESTION CARD (바통 Q&A 질문 레이아웃) */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                    
                    {/* Big Green Q and Title */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00a495] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                        Q
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            thread.status === 'RESOLVED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {thread.status === 'RESOLVED' ? '질문 해결됨' : thread.answers.length ? '답변 있음 · 미해결' : '답변 대기중'}
                          </span>
                          <span className="text-[11px] text-slate-400">내공 50</span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-400">조회 {thread.views}</span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-[11px] text-slate-400">{thread.createdAt}</span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {thread.title}
                        </h2>
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="mt-4 pl-11 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {thread.content}
                    </div>

                    {/* Question Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="mt-4 pl-11 flex items-center gap-1.5 flex-wrap">
                        {thread.tags.map(tag => (
                          <span key={tag} className="text-[11px] text-[#008275] bg-emerald-50 px-2 py-0.5 rounded hover:underline cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Question Author & Empathy Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${thread.author.avatarColor} text-white flex items-center justify-center font-bold text-[10px]`}>
                          {thread.author.name[0]}
                        </div>
                        <span className="font-semibold text-slate-800">{thread.author.name}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">
                          {thread.author.level}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Interactive Empathy: 나도 궁금해요 */}
                        <button
                          disabled title="이번 단계에서는 제공하지 않습니다"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border ${
                            thread.userEmpathized
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${thread.userEmpathized ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>나도 궁금해요</span>
                          <span className="font-bold">{thread.empathyCount}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('write_answer')}
                          className="px-3 py-1.5 bg-[#03cf5d] hover:bg-[#02b350] text-white rounded-full font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>답변하기</span>
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* ANSWERS LIST SECTION */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>답변</span>
                        <span className="text-[#03cf5d]">{thread.answers.length}개</span>
                      </h3>
                      <span className="text-xs text-slate-500">
                        {thread.adoptedAnswerId ? '질문자 채택 완료' : '채택 대기중'}
                      </span>
                    </div>

                    {thread.answers.map((answer) => {
                      const isAdopted = answer.isAdopted;
                      const hasComments = openComments[answer.id];

                      return (
                        <div
                          key={answer.id}
                          className={`rounded-xl p-5 border transition ${
                            isAdopted
                              ? 'border-2 border-[#03cf5d] bg-white ring-2 ring-emerald-50 shadow-md'
                              : 'border-slate-200 bg-white shadow-2xs'
                          }`}
                        >
                          {/* Adopted Answer Badge */}
                          {isAdopted && (
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                              <div className="flex items-center gap-1.5 text-xs font-black text-[#03cf5d]">
                                <Award className="w-4 h-4 fill-[#03cf5d] text-[#03cf5d]" />
                                <span className="tracking-tight">질문자 채택 답변</span>
                              </div>
                              {answer.isOfficialReviewed && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                                  <ShieldCheck className="w-3 h-3 text-[#008275]" />
                                  <span>공식 담당자 검토 완료</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Answer Author Header */}
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${answer.author.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                                {answer.author.name[0]}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="font-bold text-slate-900">{answer.author.name}</span>
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                                    {answer.author.level}
                                  </span>
                                  {answer.author.adoptRate && (
                                    <span className="text-[10px] text-slate-400">
                                      채택률 {answer.author.adoptRate}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {answer.author.department} · {answer.author.role} · {answer.createdAt}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Note */}
                          {answer.reviewNote && (
                            <div className="mb-3 p-2 bg-emerald-50/70 rounded-md border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-[#008275] shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">행정 검토의견: </span>
                                {answer.reviewNote}
                              </div>
                            </div>
                          )}

                          {/* Answer Content */}
                          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line py-1">
                            {answer.content}
                          </div>

                          {/* Evidence Links */}
                          {answer.evidenceNote?.title && <p className="text-xs p-2 bg-amber-50">사용자 입력 근거 · 확인 필요: {answer.evidenceNote.title} {answer.evidenceNote.location}</p>}
                          {answer.evidenceLinks && answer.evidenceLinks.length > 0 && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#008275]" />
                                <span>인용된 근거 규정 및 업무 매뉴얼 ({answer.evidenceLinks.length}건)</span>
                              </div>
                              <div className="space-y-1">
                                {answer.evidenceLinks.map((ev, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-medium">
                                        {ev.sourceType}
                                      </span>
                                      <span className="font-medium text-slate-800 truncate">{ev.title}</span>
                                    </div>
                                    <span className="text-[11px] text-[#008275] font-semibold shrink-0 ml-2">
                                      {ev.referenceLocation}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Answer Footer Actions: Like, Comment Toggle */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {/* Answer Like */}
                              <button
                                disabled title="이번 단계에서는 제공하지 않습니다"
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer border ${
                                  answer.userLiked
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>추천</span>
                                <span className="font-bold">{answer.likes}</span>
                              </button>

                              {/* Comment Toggle */}
                              <button
                                onClick={() => handleToggleComments(answer.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>댓글 {answer.comments.length}</span>
                              </button>
                            </div>

                            <span className="text-[11px] text-slate-400">
                              검토 및 본문 반영은 후속 단계에서 제공합니다
                            </span>
                          </div>

                          {/* Nested Comments Box */}
                          {hasComments && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 bg-slate-50/60 p-3 rounded-lg">
                              {answer.comments.map(c => (
                                <div key={c.id} className="text-xs space-y-0.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-700">{c.author}</span>
                                    <span className="text-slate-400">{c.createdAt}</span>
                                  </div>
                                  <p className="text-slate-600 leading-normal">{c.content}</p>
                                </div>
                              ))}

                              {/* Comment input form */}
                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="text"
                                  value={commentInputs[answer.id] || ''}
                                  onChange={(e) => handleCommentChange(answer.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSubmitComment(answer.id);
                                    }
                                  }}
                                  placeholder="선배님께 추가 질문이나 감사 댓글을 남겨보세요..."
                                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                />
                                <button
                                  onClick={() => handleSubmitComment(answer.id)}
                                  className="px-2.5 py-1 bg-[#00a495] hover:bg-[#008275] text-white text-xs font-semibold rounded cursor-pointer"
                                >
                                  등록
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              ) : (
                /* No thread exists yet for this sentence */
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#008275] flex items-center justify-center mx-auto text-xl font-bold">
                    ?
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    아직 이 문장에 등록된 질문이 없습니다.
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    이해하기 어렵거나 규정 확인이 필요한 문장인가요? 
                    신임 담당자로서 첫 번째 질문을 등록하고 선배의 생생한 답변을 받아보세요.
                  </p>
                  <button
                    onClick={() => setActiveTab('new_question')}
                    className="px-4 py-2 bg-[#03cf5d] hover:bg-[#02b350] text-white font-bold text-xs rounded-lg shadow-sm transition cursor-pointer"
                  >
                    이 문장에 첫 질문 남기기
                  </button>
                </div>
              )}
            </>
          )}

          {/* WRITE ANSWER TAB */}
          {activeTab === 'write_answer' && thread && (
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800">질문 대상:</span>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5">{thread.title}</h4>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  바통 Q&A 답변 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="후임자가 바로 업무에 적용할 수 있는 구체적인 팁, 주의사항, 시스템 조작 경로 등을 상세히 남겨주세요."
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    근거 법령 / 매뉴얼 제목 (선택)
                  </label>
                  <input
                    type="text"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    placeholder="예: 2026 국고보조금 통합관리지침"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    조항 번호 / 페이지 (선택)
                  </label>
                  <input
                    type="text"
                    value={evidenceLoc}
                    onChange={(e) => setEvidenceLoc(e.target.value)}
                    placeholder="예: 제14조 2항 또는 p.45"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('view')}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAnswerSubmitting || !answerContent.trim()}
                  className="px-4 py-1.5 bg-[#00a495] hover:bg-[#008275] disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
                >
                  답변 등록하기
                </button>
              </div>
            </form>
          )}

          {/* NEW QUESTION TAB */}
          {activeTab === 'new_question' && (
            <form onSubmit={handleSubmitNewQuestion} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">질문 대상 문장: </span>
                <span className="text-slate-600 italic">"{sentence.text}"</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  질문 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="궁금한 핵심 내용을 한 줄로 요약해주세요 (예: 자부담금 선입금 기한 연장이 가능한가요?)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  질문 상세 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="실제 마주친 상황, 혼란스러운 점, 상대 기관/기업의 요구사항 등을 자세히 적어주시면 선배들이 정확한 규정과 실무 팁을 답변해 드립니다."
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  질문은 이 샘플 서버에 저장됩니다. 알림 발송, 검토 승인 및 본문 반영은 아직 제공하지 않습니다.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {thread && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('view')}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    이전 목록으로
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isAnswerSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 bg-[#00a495] hover:bg-[#008275] disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
                >
                  바통 질문 등록하기
                </button>
              </div>
            </form>
          )}

        </div>

        {/* 4. Modal Bottom Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a495]" />
            <span>바통위키 공식 실무 인수인계 Q&A 아카이브</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-medium cursor-pointer"
          >
            본문으로 돌아가기
          </button>
        </div>

      </div>

    </div>
  );
};

