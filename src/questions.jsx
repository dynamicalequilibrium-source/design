import React, { useRef, useState } from "react";
import {
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Plus,
  Send,
  Clock3,
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  Paperclip,
  X,
} from "lucide-react";
import {
  CURRENT_USER,
  handovers,
  sections,
  quoteFor,
  formatDate,
  questionStatus,
} from "./handover";
import { Avatar, Badge, Empty } from "./ui";

export function QuestionRows({ questions, openQuestion }) {
  return questions.length ? (
    <div className="question-rows">
      {questions.map((q) => {
        const doc = handovers.find((d) => d.id === q.doc);
        return (
          <button
            className="question-row"
            key={q.id}
            onClick={() => openQuestion(q)}
          >
            <span
              className={`question-state ${!q.answers.length ? "waiting" : ""}`}
            >
              <MessageCircle size={19} />
            </span>
            <div>
              <span className="question-doc">
                {doc?.title} <ChevronRight size={11} />{" "}
                {sections.find(([id]) => id === q.block)?.[1]}
              </span>
              <h3>{q.title}</h3>
              <p>
                {q.person} · {q.date} · 답변 {q.answers.length}
              </p>
            </div>
            <Badge
              tone={q.resolved ? "green" : q.answers.length ? "" : "amber"}
            >
              {questionStatus(q)}
            </Badge>
            <ChevronRight size={17} />
          </button>
        );
      })}
    </div>
  ) : (
    <Empty title="표시할 질문이 없어요">
      다른 필터로 찾아보거나 인수인계서에서 질문을 남겨보세요.
    </Empty>
  );
}

export default function QuestionPanel({
  doc,
  currentBlock,
  questions,
  route,
  go,
  closePanel,
  updateQuestion,
  setQuestions,
  drafts,
  setDrafts,
  draftsSaved,
  questionsSaved,
  setDialog,
  setToast,
}) {
  const [writing, setWriting] = useState(false),
    [error, setError] = useState("");
  const inputRef = useRef(null),
    submitLock = useRef(false);
  const draftKey = `${CURRENT_USER}:doc-${doc.id}:${currentBlock}`,
    draft = drafts[draftKey] || "";
  const related = questions.filter(
    (q) => q.doc === doc.id && q.block === currentBlock,
  );
  const selected = related.find((q) => String(q.id) === route.thread),
    quote = selected?.quote || quoteFor(doc, currentBlock);
  function write() {
    setWriting(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }
  function submit(e) {
    e.preventDefault();
    if (submitLock.current) return;
    if (draft.replace(/\s/g, "").length < 5) {
      setError("질문을 공백 제외 5자 이상 입력해주세요.");
      inputRef.current?.focus();
      return;
    }
    submitLock.current = true;
    const q = {
      id: crypto.randomUUID(),
      doc: doc.id,
      block: currentBlock,
      quote: quoteFor(doc, currentBlock),
      version: doc.version,
      year: doc.year,
      title: draft.trim().split("\n")[0].slice(0, 90),
      body: draft.trim(),
      person: CURRENT_USER,
      date: formatDate(Date.now()),
      resolved: false,
      answers: [],
    };
    setQuestions((qs) => [q, ...qs]);
    setDrafts((ds) => ({ ...ds, [draftKey]: "" }));
    setWriting(false);
    setError("");
    go({ ...route, thread: q.id });
    setToast("질문을 등록했어요. 이 브라우저에서 확인할 수 있어요.");
    setTimeout(() => {
      submitLock.current = false;
    }, 500);
  }
  return (
    <aside className="question-panel" aria-label="문맥별 질문과 답변">
      <div className="panel-heading">
        <h2>
          <MessageCircle size={18} /> 문맥에서 묻고 답하기
        </h2>
        <button
          className="icon-button"
          aria-label="질문 닫고 본문으로 돌아가기"
          onClick={closePanel}
        >
          <X size={20} />
        </button>
      </div>
      <button className="panel-back" onClick={closePanel}>
        <ArrowLeft size={14} /> 읽던 본문으로
      </button>
      <div className="panel-quote">
        <span>
          {sections.find(([id]) => id === currentBlock)?.[1]} · v
          {selected?.version || doc.version}
        </span>
        <blockquote>{quote}</blockquote>
        <small>{selected?.year || doc.year}년 기준 · 질문 당시 원문</small>
      </div>
      <div className="panel-body">
        {selected ? (
          <>
            <button
              className="back-link"
              onClick={() => go({ ...route, thread: null })}
            >
              <ChevronLeft size={15} /> 연결된 질문 {related.length}개
            </button>
            <div className="thread-heading">
              <Badge
                tone={
                  selected.resolved
                    ? "green"
                    : selected.answers.length
                      ? ""
                      : "amber"
                }
              >
                {questionStatus(selected)}
              </Badge>
              <h3>{selected.title}</h3>
              <div className="person-line">
                <Avatar name={selected.person} />
                <strong>{selected.person}</strong>
                <span>{selected.date}</span>
              </div>
              <p className="thread-body">{selected.body}</p>
            </div>
            <div className="answers-heading">
              <h3>
                답변 <span>{selected.answers.length}</span>
              </h3>
              <span>검토 여부는 답변별로 확인해요</span>
            </div>
            {selected.answers.length ? (
              selected.answers.map((answer) => (
                <Answer
                  key={answer.id}
                  {...{ answer, selected, updateQuestion, setDialog }}
                />
              ))
            ) : (
              <div className="waiting-message">
                <Clock3 size={22} />
                <p>아직 답변을 기다리고 있어요.</p>
                <small>관련 자료나 경험이 있다면 알려주세요.</small>
              </div>
            )}
            {selected.person === CURRENT_USER && (
              <button
                className={`button ${selected.resolved ? "secondary" : "resolve-button"} full-width`}
                onClick={() =>
                  updateQuestion(selected.id, (q) => ({
                    ...q,
                    resolved: !q.resolved,
                  }))
                }
              >
                {selected.resolved ? (
                  <RotateCcw size={15} />
                ) : (
                  <CheckCheck size={15} />
                )}{" "}
                {selected.resolved
                  ? "질문 다시 열기"
                  : "궁금한 점이 해결됐어요"}
              </button>
            )}
            <p className="state-explanation">
              질문 해결 표시는 답변의 담당자 검토와 별개예요.
            </p>
            <AnswerForm
              key={selected.id}
              question={selected}
              {...{ drafts, setDrafts, draftsSaved }}
              onSubmit={(body) =>
                updateQuestion(selected.id, (q) => ({
                  ...q,
                  answers: [
                    ...q.answers,
                    {
                      id: crypto.randomUUID(),
                      body,
                      person: CURRENT_USER,
                      date: formatDate(Date.now()),
                      reviewed: false,
                      comments: [],
                    },
                  ],
                }))
              }
            />
          </>
        ) : (
          <>
            <div className="connected-heading">
              <h3>
                연결된 질문 <span>{related.length}</span>
              </h3>
              <button className="text-button" onClick={write}>
                <Plus size={15} /> 질문하기
              </button>
            </div>
            {related.length ? (
              related.map((q) => (
                <button
                  key={q.id}
                  className="thread-preview"
                  onClick={() => go({ ...route, thread: q.id })}
                >
                  <Badge
                    tone={
                      q.resolved ? "green" : q.answers.length ? "" : "amber"
                    }
                  >
                    {questionStatus(q)}
                  </Badge>
                  <h3>{q.title}</h3>
                  <p>
                    {q.person} · 답변 {q.answers.length}
                  </p>
                  <ChevronRight size={16} />
                </button>
              ))
            ) : (
              <div className="empty-panel">
                <MessageCircle size={26} />
                <h3>이 문맥의 첫 질문을 남겨보세요.</h3>
                <p>
                  궁금했던 부분이 다음 사람에게도
                  <br />
                  도움이 될 수 있어요.
                </p>
              </div>
            )}
            {writing || draft ? (
              <form className="question-form" onSubmit={submit}>
                <label htmlFor="new-question">어떤 점이 궁금한가요?</label>
                <textarea
                  ref={inputRef}
                  id="new-question"
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => {
                    setDrafts((ds) => ({ ...ds, [draftKey]: e.target.value }));
                    setError("");
                  }}
                  placeholder="예: 첨부서류가 빠져 있으면 먼저 접수해도 되나요?"
                  required
                  aria-describedby="question-save question-error"
                />
                <div className="input-meta">
                  <small id="question-save">
                    {draftsSaved ? "이 기기에 임시저장됨" : "임시저장 실패"}
                  </small>
                  <span>{draft.length}/2,000</span>
                </div>
                {error && (
                  <p id="question-error" className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button primary full-width" type="submit">
                  <Send size={15} /> 질문 등록
                </button>
              </form>
            ) : (
              <button className="button primary full-width" onClick={write}>
                <Plus size={16} /> 이 문맥에 질문하기
              </button>
            )}
          </>
        )}
        <p className="panel-storage">
          {questionsSaved
            ? "질문·답변은 이 브라우저에 저장됩니다."
            : "질문·답변을 이 기기에 저장하지 못했어요."}
          <br />
          샘플 환경에서는 다른 사용자에게 전송되지 않아요.
        </p>
      </div>
    </aside>
  );
}
function Answer({ answer, selected, updateQuestion, setDialog }) {
  const [comment, setComment] = useState(""),
    [expanded, setExpanded] = useState(false);
  function addComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    updateQuestion(selected.id, (q) => ({
      ...q,
      answers: q.answers.map((a) =>
        a.id === answer.id
          ? {
              ...a,
              comments: [
                ...(a.comments || []),
                {
                  id: crypto.randomUUID(),
                  body: comment.trim(),
                  person: CURRENT_USER,
                },
              ],
            }
          : a,
      ),
    }));
    setComment("");
  }
  return (
    <div className="answer-card">
      <div className="person-line">
        <Avatar name={answer.person} />
        <strong>{answer.person}</strong>
        <span>{answer.date}</span>
      </div>
      <Badge tone={answer.reviewed ? "green" : "neutral"}>
        {answer.reviewed ? (
          <>
            <ShieldCheck size={12} /> 담당자 검토 완료 · 샘플
          </>
        ) : (
          "담당자 미검토"
        )}
      </Badge>
      {answer.reviewed && (
        <small className="review-detail">
          {answer.reviewer} · {selected.year}년 적용 기준
        </small>
      )}
      <p>{answer.body}</p>
      {answer.reviewed && (
        <button className="source-link" onClick={() => setDialog("source")}>
          <Paperclip size={14} /> 샘플 근거 확인
        </button>
      )}
      <button
        className="comment-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <MessageCircle size={14} /> 추가 댓글 {(answer.comments || []).length}
        <ChevronDown size={13} />
      </button>
      {expanded && (
        <div className="comments">
          {(answer.comments || []).map((c) => (
            <div key={c.id}>
              <strong>{c.person}</strong>
              <p>{c.body}</p>
            </div>
          ))}
          <form onSubmit={addComment}>
            <label htmlFor={`comment-${answer.id}`}>
              답변에 추가 질문·댓글
            </label>
            <textarea
              id={`comment-${answer.id}`}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="같은 주제의 추가 질문을 남겨주세요."
              required
            />
            <button className="button secondary" type="submit">
              댓글 등록
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
function AnswerForm({ question, drafts, setDrafts, draftsSaved, onSubmit }) {
  const key = `${CURRENT_USER}:answer:${question.id}`,
    body = drafts[key] || "";
  return (
    <form
      className="answer-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        onSubmit(body.trim());
        setDrafts((ds) => ({ ...ds, [key]: "" }));
      }}
    >
      <label htmlFor="answer">경험이나 자료로 답변해주세요</label>
      <textarea
        id="answer"
        maxLength={5000}
        value={body}
        onChange={(e) => setDrafts((ds) => ({ ...ds, [key]: e.target.value }))}
        placeholder="적용 기준과 확인이 필요한 점을 함께 적어주세요."
        required
      />
      <small>
        {draftsSaved ? "이 기기에 임시저장됨" : "임시저장 실패"} · 등록한 답변은
        미검토로 표시돼요.
      </small>
      <button className="button primary full-width" type="submit">
        <Send size={15} /> 답변 등록
      </button>
    </form>
  );
}
