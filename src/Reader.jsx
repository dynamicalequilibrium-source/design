import React, { useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Star,
  Download,
  ShieldCheck,
  Sparkles,
  Users,
  CalendarDays,
  MessageCircle,
  X,
  ChevronDown,
  CircleHelp,
  FileText,
  CheckCheck,
} from "lucide-react";
import { sections, quoteFor } from "./handover";
import { Avatar, Badge, DocIcon } from "./ui";
import { useSaved } from "./storage";
import QuestionPanel from "./questions";

function Block({ id, selected, children }) {
  const label = sections.find(([key]) => key === id)[1];
  return (
    <section
      id={`block-${id}`}
      data-block={id}
      className={`reader-block ${selected === id ? "selected-block" : ""}`}
    >
      <div className="block-heading">
        <h2>{label}</h2>
      </div>
      {children}
    </section>
  );
}
function InlineQa({ id, questions, doc, selected, openPanel }) {
  const count = questions.filter(
    (q) => q.doc === doc.id && q.block === id,
  ).length;
  const label = sections.find(([key]) => key === id)[1];
  return (
    <button
      id={`ask-${id}`}
      className="inline-qa"
      onClick={(event) => openPanel(id, event)}
      aria-label={`${label} Q&A${count ? ` ${count}개 보기` : " 열기"}`}
      aria-expanded={selected === id}
    >
      Q&A{count > 0 ? ` ${count}` : ""}
    </button>
  );
}
export default function Reader(props) {
  const {
    doc,
    questions,
    checks,
    setChecks,
    checksSaved,
    readPositions,
    currentBlock,
    panel,
    openPanel,
    closePanel,
    setDialog,
    favorite,
    toggleFavorite,
    back,
    setReadPositions,
  } = props;
  const [help, setHelp] = useSaved(
    "baton-reader-tip",
    true,
    (v) => typeof v === "boolean",
  );
  const article = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries.find((e) => e.isIntersecting);
        if (e)
          setReadPositions((p) =>
            p[doc.id] === e.target.dataset.block
              ? p
              : { ...p, [doc.id]: e.target.dataset.block },
          );
      },
      { rootMargin: "-70px 0px -55% 0px" },
    );
    article.current
      ?.querySelectorAll("[data-block]")
      .forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [doc.id, panel]);
  function jump(block) {
    document
      .getElementById(`block-${block}`)
      ?.scrollIntoView({ block: "start" });
  }
  function download() {
    const text = `# ${doc.title}\n\n> UX 확인용 가상 인수인계서 · ${doc.year}년 기준 · v${doc.version}\n> 자료 파일은 연결되지 않은 샘플입니다.\n\n담당: ${doc.contact}\n\n## 업무 개요\n\n${doc.intro}\n\n## 현재 현황\n\n${doc.stage}\n\n다음 할 일: ${doc.next}\n\n## 처리 절차\n\n1. 진행 현황과 자료 확인: ${doc.tasks[0]}부터 시작합니다. 이전 기록과 관련 자료를 읽고 담당자와 처리 기한을 확인하세요.\n2. ${doc.tasks[1]}: ${doc.quote}\n3. ${doc.tasks[2]}: 처리 결과를 확인하고 다음 담당자가 이어갈 내용을 관련 자료와 함께 정리하세요.\n\n## 일정과 체크리스트\n\n${doc.due}\n\n${doc.tasks.map((task) => `- [ ] ${task}`).join("\n")}\n\n## 협의할 사람\n\n${doc.contact}\n\n## 예외·주의사항\n\n${doc.caution}\n\n## 관련 자료 (샘플)\n\n${doc.files.map((name) => `- ${name}`).join("\n")}\n`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    a.download = `${doc.title}_샘플.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const blockProps = {
    questions,
    doc,
    selected: panel ? currentBlock : null,
    openPanel,
  };
  return (
    <div className={`reader-page ${panel ? "with-panel" : ""}`}>
      <button className="back-link" onClick={back}>
        <ArrowLeft size={16} /> 인수인계서 목록
      </button>
      <div className="reader-header">
        <div className="reader-title">
          <div className="reader-category">
            <DocIcon doc={doc} />
            <span>{doc.category}</span>
            <Badge>샘플 인수인계서</Badge>
          </div>
          <h1>{doc.title}</h1>
          <div className="reader-meta">
            <span>{doc.year}년 적용 기준</span>
            <i />
            <span>
              {doc.owner} · {doc.team}
            </span>
            <i />
            <span>v{doc.version}</span>
          </div>
          <p className="review-meta">
            <ShieldCheck size={14} /> 샘플 검토일 {doc.reviewed}
            <span>수정일 {doc.updated}</span>
          </p>
        </div>
        <div className="reader-actions">
          <button
            className={`button secondary ${favorite ? "favorited" : ""}`}
            aria-pressed={favorite}
            onClick={toggleFavorite}
          >
            <Star size={16} /> 즐겨찾기
          </button>
          <button
            className="icon-button"
            aria-label="샘플 Markdown 내보내기"
            title="샘플 Markdown 내보내기"
            onClick={download}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      <div className={`reader-layout ${panel ? "panel-open" : ""}`}>
        <aside className="toc">
          <div className="toc-title">이 인수인계서에서</div>
          <nav aria-label="문서 목차">
            {sections.map(([id, label], i) => (
              <button
                key={id}
                className={
                  (readPositions[doc.id] || "overview") === id ? "active" : ""
                }
                onClick={() => jump(id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                {label}
              </button>
            ))}
          </nav>
          <div className="toc-note">
            <ShieldCheck size={19} />
            <p>
              적용 기준과 근거를
              <br />
              함께 확인하세요.
            </p>
            <small>가상 업무자료로 만든 예시</small>
          </div>
        </aside>
        <article
          ref={article}
          className="reader-content"
          aria-label={`${doc.title} 본문`}
        >
          <div className="handover-summary">
            <span className="summary-kicker">
              <Sparkles size={16} /> 처음 맡았다면, 여기부터
            </span>
            <h2>지금 이어받을 업무를 확인해요.</h2>
            <div className="summary-grid">
              <div>
                <span>현재 단계</span>
                <strong>{doc.stage}</strong>
              </div>
              <div>
                <span>
                  <CalendarDays size={14} /> 가까운 일정
                </span>
                <strong>{doc.due}</strong>
              </div>
            </div>
            <div className="summary-next">
              <span>다음 할 일</span>
              <p>{doc.next}</p>
            </div>
            <button onClick={() => jump("people")}>
              <Users size={15} /> 확인할 사람 <b>{doc.contact}</b>
              <ArrowRight size={15} />
            </button>
          </div>
          {help && (
            <div className="reader-tip">
              <MessageCircle size={16} />
              <p>
                읽다가 막히면 문장 끝의 <b>Q&A</b>를 눌러보세요.
              </p>
              <button
                className="icon-button"
                aria-label="질문 안내 닫기"
                onClick={() => setHelp(false)}
              >
                <X size={15} />
              </button>
            </div>
          )}
          <details className="mobile-toc">
            <summary>
              문서 목차 <ChevronDown size={16} />
            </summary>
            <div>
              {sections.map(([id, label]) => (
                <button key={id} onClick={() => jump(id)}>
                  {label}
                </button>
              ))}
            </div>
          </details>
          <Block id="overview" {...blockProps}>
            <p className="anchor-target">
              {doc.intro} <InlineQa id="overview" {...blockProps} />
            </p>
          </Block>
          <Block id="current" {...blockProps}>
            <div className="inline-stage">
              <span /> {doc.stage}
            </div>
            <p className="anchor-target">
              {doc.next} <InlineQa id="current" {...blockProps} />
            </p>
            <p className="muted">
              샘플 시점의 상황이에요. 실제 진행 현황은 문서 담당자에게
              확인해주세요.
            </p>
          </Block>
          <Block id="procedure" {...blockProps}>
            <div className="procedure">
              <span>01</span>
              <div>
                <h3>진행 현황과 자료 확인</h3>
                <p>
                  {doc.tasks[0]}부터 시작합니다. 이전 기록과 관련 자료를 읽고
                  담당자와 처리 기한을 확인하세요.
                </p>
              </div>
            </div>
            <div className="procedure">
              <span>02</span>
              <div>
                <h3>{doc.tasks[1]}</h3>
                <p className="anchor-target">
                  {doc.quote} <InlineQa id="procedure" {...blockProps} />
                </p>
                <p>
                  확인 과정에서 알게 된 예외나 협의 내용은 업무 기록에 함께
                  남깁니다.
                </p>
              </div>
            </div>
            <div className="procedure">
              <span>03</span>
              <div>
                <h3>{doc.tasks[2]}</h3>
                <p>
                  처리 결과를 확인하고, 다음 담당자가 이어갈 내용을 관련 자료와
                  함께 정리하세요.
                </p>
              </div>
            </div>
          </Block>
          <Block id="schedule" {...blockProps}>
            <p className="anchor-target">
              {doc.due} <InlineQa id="schedule" {...blockProps} />
            </p>
            <div className="reader-checklist">
              {doc.tasks.map((task, i) => (
                <label key={task}>
                  <input
                    type="checkbox"
                    checked={(checks[doc.id] || []).includes(i)}
                    onChange={() =>
                      setChecks((prev) => {
                        const ids = prev[doc.id] || [];
                        return {
                          ...prev,
                          [doc.id]: ids.includes(i)
                            ? ids.filter((n) => n !== i)
                            : [...ids, i],
                        };
                      })
                    }
                  />
                  <span>{task}</span>
                </label>
              ))}
            </div>
            <small className="save-status">
              {checksSaved
                ? "체크한 내용은 이 기기에 저장돼요."
                : "이 기기에 저장하지 못했어요."}
            </small>
          </Block>
          <Block id="people" {...blockProps}>
            <div className="contact-card">
              <Avatar name={doc.owner} />
              <div>
                <strong>{doc.owner}</strong>
                <span>{doc.team} · 문서 담당자</span>
              </div>
            </div>
            <p className="anchor-target contact-context">
              {quoteFor(doc, "people")} <InlineQa id="people" {...blockProps} />
            </p>
          </Block>
          <Block id="caution" {...blockProps}>
            <div className="warning-box">
              <CircleHelp size={20} />
              <p className="anchor-target">
                {doc.caution} <InlineQa id="caution" {...blockProps} />
              </p>
            </div>
          </Block>
          <Block id="sources" {...blockProps}>
            <p className="muted">
              자료 목록과 근거 확인 방식을 보여주는 가상 예시예요.
            </p>
            {doc.files.map((name, i) => (
              <div className="source-row" key={name}>
                <button
                  className={`attachment ${i === 0 ? "anchor-target" : ""}`}
                  onClick={() => setDialog("source")}
                >
                  <FileText size={22} />
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {i === 0
                        ? "업무 기준 · 샘플 인용 보기"
                        : "실제 파일 미연결"}
                    </small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
                {i === 0 && <InlineQa id="sources" {...blockProps} />}
              </div>
            ))}
          </Block>
          <div className="reader-end">
            <CheckCheck size={20} />
            <p>
              다음 사람이 업무를 이어갈 수 있도록,
              <br />
              작은 질문과 경험도 남겨주세요.
            </p>
            <button className="button secondary" onClick={back}>
              다른 인수인계서 보기 <ArrowRight size={15} />
            </button>
          </div>
        </article>
        {panel && (
          <QuestionPanel
            key={`${doc.id}-${currentBlock}`}
            {...props}
            closePanel={closePanel}
          />
        )}
      </div>
    </div>
  );
}
