import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Search,
  Bell,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Star,
  MessageCircle,
  Check,
  X,
  Clock3,
  CheckCheck,
  Menu,
  ShieldCheck,
  Layers,
  Bookmark,
  FileText,
} from "lucide-react";
import {
  CURRENT_USER,
  categories,
  handovers,
  sections,
  migrateQuestions,
  matchesQuery,
  searchTarget,
  questionStatus,
  questionMatches,
} from "./handover";
import { isArray, isObject, readSaved, useSaved } from "./storage";
import { Avatar, Badge, Brand, Dialog, DocIcon, Empty } from "./ui";
import Reader from "./Reader";
import Prepare from "./Prepare";
import { QuestionRows } from "./questions";
import "./style.css";

function readRoute() {
  return Object.fromEntries(new URLSearchParams(location.search));
}
function useRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const pop = () => setRoute(readRoute());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function go(next, replace = false) {
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    });
    history[replace ? "replaceState" : "pushState"](
      {},
      "",
      `${location.pathname}${p.size ? "?" + p : ""}`,
    );
    setRoute(readRoute());
  }
  return [route, go];
}

function App() {
  const [route, go] = useRoute();
  const [favorites, setFavorites] = useSaved(
      "baton-favorites",
      [1, 3],
      isArray,
    ),
    [recent, setRecent] = useSaved("baton-recent", [1, 2, 3], isArray);
  const [questions, setQuestions, questionsSaved] = useSaved(
    "baton-questions-v2",
    migrateQuestions(readSaved("baton-questions", undefined, isArray)),
    (v) => Array.isArray(v) && v.every((q) => q && Array.isArray(q.answers)),
  );
  const [checks, setChecks, checksSaved] = useSaved(
      "baton-doc-checks",
      {},
      isObject,
    ),
    [readPositions, setReadPositions] = useSaved("baton-reading", {}, isObject);
  const [preparation, setPreparation, prepSaved] = useSaved(
    "baton-preparation",
    { title: "", team: "", year: "2026", sources: [], step: 0 },
    isObject,
  );
  const [drafts, setDrafts, draftsSaved] = useSaved(
    "baton-question-drafts",
    {},
    isObject,
  );
  const [mobile, setMobile] = useState(false),
    [dialog, setDialog] = useState(null),
    [toast, setToast] = useState(""),
    [notifications, setNotifications] = useState(false);
  const libraryScroll = useRef(0),
    returnFocus = useRef(null),
    previousDoc = useRef(null);
  const page = ["docs", "questions", "me", "prepare"].includes(route.page)
      ? route.page
      : "docs",
    doc = handovers.find((d) => d.id === Number(route.doc));
  const currentBlock = sections.some(([id]) => id === route.block)
      ? route.block
      : "procedure",
    panel = !!doc && !!route.block;
  const pending = questions.filter(
      (q) => !q.resolved && !q.answers.length,
    ).length,
    query = route.q || "",
    tab = route.tab || "전체",
    category = route.category || "전체";
  useEffect(() => {
    document.title = doc
      ? `${doc.title} · 업무 바통`
      : "업무 바통 · 경험을 이어가는 인수인계서";
  }, [doc]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e) => {
      if (e.isComposing) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector("#global-search")?.focus();
      }
      if (e.key === "Escape" && !dialog) {
        if (panel) closePanel();
        else {
          setNotifications(false);
          setMobile(false);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  useEffect(() => {
    if (doc) {
      const block = route.block || readPositions[doc.id];
      requestAnimationFrame(() =>
        block
          ? document
              .getElementById(`block-${block}`)
              ?.scrollIntoView({ block: "start" })
          : window.scrollTo(0, 0),
      );
    } else if (previousDoc.current) {
      requestAnimationFrame(() => window.scrollTo(0, libraryScroll.current));
    } else window.scrollTo(0, 0);
    previousDoc.current = doc?.id;
  }, [doc?.id, page]);
  useEffect(() => {
    if (!panel) return;
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width:1100px)").matches) {
        document
          .querySelector(".question-panel")
          ?.scrollIntoView({ block: "start" });
        document.querySelector(".panel-back")?.focus({ preventScroll: true });
      } else
        document
          .getElementById(`block-${currentBlock}`)
          ?.scrollIntoView({ block: "nearest" });
    });
  }, [panel, currentBlock]);
  function navigate(next) {
    setMobile(false);
    setNotifications(false);
    go(next);
  }
  function openDoc(id, extra = {}) {
    if (!doc) libraryScroll.current = window.scrollY;
    setRecent((r) => [id, ...r.filter((n) => n !== id)]);
    navigate({
      ...route,
      page: "docs",
      doc: id,
      block: null,
      thread: null,
      ...extra,
    });
  }
  function openPanel(block, event) {
    returnFocus.current = event?.currentTarget;
    go({ ...route, block, thread: null });
  }
  function closePanel() {
    const block = currentBlock;
    go({ ...route, block: null, thread: null });
    requestAnimationFrame(() => {
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : document.getElementById(`ask-${block}`);
      target?.focus({ preventScroll: true });
      document
        .getElementById(`block-${block}`)
        ?.scrollIntoView({ block: "nearest" });
    });
  }
  function toggleFavorite(id) {
    setFavorites((f) =>
      f.includes(id) ? f.filter((n) => n !== id) : [...f, id],
    );
  }
  function openQuestion(q) {
    openDoc(q.doc, { block: q.block, thread: q.id });
  }
  function updateQuestion(id, update) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? update(q) : q)));
  }
  let filtered = handovers.filter(
    (d) =>
      (category === "전체" || d.category === category) &&
      (tab !== "즐겨찾기" || favorites.includes(d.id)) &&
      (tab !== "최근 읽은 문서" || recent.includes(d.id)) &&
      matchesQuery(d, query, questions),
  );
  if (route.sort === "이름순")
    filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  else if (tab === "최근 읽은 문서")
    filtered.sort((a, b) => recent.indexOf(a.id) - recent.indexOf(b.id));
  const continueDoc = handovers.find((d) => d.id === recent[0]) || handovers[0],
    hasDraft = !!preparation.title;
  const notificationQuestions = questions.filter(
    (q) => q.person === CURRENT_USER && q.answers.length,
  );
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="nav-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "mobile-open" : ""}`}
        aria-label="워크스페이스 메뉴"
      >
        <button
          className="brand"
          onClick={() => navigate({ page: "docs" })}
          aria-label="업무 바통 홈"
        >
          <Brand />
        </button>
        <div className="workspace">
          <span className="workspace-symbol">B</span>
          <div>
            <strong>바통 워크스페이스</strong>
            <small>경험을 이어가는 우리 팀</small>
          </div>
        </div>
        <button
          className="button primary sidebar-create"
          onClick={() => navigate({ page: "prepare" })}
        >
          <Plus size={17} /> 인수인계서 만들기
        </button>
        <div className="nav-label">우리 팀의 업무</div>
        <nav>
          {[
            ["docs", BookOpen, "인수인계서"],
            ["questions", MessageCircle, "질문함"],
            ["me", CheckCheck, "내 업무"],
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => navigate({ page: id })}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "questions" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
              {page === id && id !== "questions" && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="side-divider" />
        <div className="nav-label favorite-label">
          즐겨찾는 인수인계서 <Star size={13} />
        </div>
        <div className="favorite-nav">
          {handovers
            .filter((d) => favorites.includes(d.id))
            .map((d) => (
              <button key={d.id} onClick={() => openDoc(d.id)}>
                <span className={`tiny-square ${d.color}`} />
                <span>{d.title}</span>
              </button>
            ))}
          {!favorites.length && <p>문서의 별을 눌러 모아두세요.</p>}
        </div>
        <div className="sidebar-bottom">
          <div className="knowledge-card">
            <Layers size={20} />
            <strong>
              경험이 다음 사람의
              <br />
              시작이 되도록.
            </strong>
            <p>
              자료를 모으고, 맥락을 남기고,
              <br />
              질문으로 함께 보완해요.
            </p>
            <button onClick={() => setDialog("guide")}>
              바통 사용 가이드 <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="sidebar-user"
            onClick={() => navigate({ page: "me" })}
          >
            <Avatar />
            <span>
              <strong>정하늘</strong>
              <small>사업운영팀 · 샘플 사용자</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="메뉴 열기"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>워크스페이스</span>
            <ChevronRight size={13} />
            <button
              onClick={() =>
                navigate({ page: page === "prepare" ? "docs" : page })
              }
            >
              {
                {
                  docs: "인수인계서",
                  questions: "질문함",
                  me: "내 업무",
                  prepare: "인수인계서 만들기",
                }[page]
              }
            </button>
            {doc && (
              <>
                <ChevronRight size={13} />
                <span className="crumb-title">{doc.title}</span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="sample-pill">
              <i />
              샘플 워크스페이스
            </span>
            <div className="notification-anchor">
              <button
                className="icon-button"
                aria-label="알림 보기"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
              </button>
              {notifications && (
                <div className="notification-pop">
                  <h3>내 질문의 답변</h3>
                  <p className="muted">
                    샘플 대화와 이 기기에서 작성한 답변이에요.
                  </p>
                  {notificationQuestions.length ? (
                    notificationQuestions.map((q) => (
                      <button key={q.id} onClick={() => openQuestion(q)}>
                        <MessageCircle size={17} />
                        <span>
                          {q.title}
                          <small>
                            답변 {q.answers.length}개 · {questionStatus(q)}
                          </small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p>아직 도착한 답변이 없어요.</p>
                  )}
                </div>
              )}
            </div>
            <button
              className="profile-button"
              aria-label="내 업무 보기"
              onClick={() => navigate({ page: "me" })}
            >
              <Avatar />
            </button>
          </div>
        </header>
        <main>
          {page === "docs" && !route.doc && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">KNOWLEDGE THAT MOVES WITH YOU</div>
                  <h1>
                    우리 팀의 인수인계서
                    <span className="heading-dot" />
                  </h1>
                  <p>
                    넘겨줄 업무는 차근차근 정리하고, 처음 맡은 업무는 맥락부터
                    읽어보세요.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => navigate({ page: "prepare" })}
                >
                  <Plus size={17} /> 새 인수인계서
                </button>
              </div>
              <div className="overview-row">
                <section className="start-card">
                  <div className="welcome-kicker">
                    <span /> 넘겨줄 업무가 있나요?
                  </div>
                  <h2>
                    흩어진 자료를 모아,
                    <br />
                    다음 사람의 시작으로.
                  </h2>
                  <p>
                    업무자료부터 현재 상황까지.
                    <br />
                    빠뜨리지 않도록 한 단계씩 준비해요.
                  </p>
                  <button
                    className="button dark"
                    onClick={() => navigate({ page: "prepare" })}
                  >
                    인수인계서 {hasDraft ? "이어서 준비하기" : "만들기"}{" "}
                    <ArrowRight size={16} />
                  </button>
                  <div
                    className="start-steps"
                    aria-label="인수인계서 제작 흐름"
                  >
                    <span>
                      <b>01</b> 자료 준비
                    </span>
                    <ChevronRight size={12} />
                    <span>
                      <b>02</b> 초안 구성
                    </span>
                    <ChevronRight size={12} />
                    <span>
                      <b>03</b> 검토·공유
                    </span>
                  </div>
                  <div className="paper-art" aria-hidden="true">
                    <div className="paper back" />
                    <div className="paper front">
                      <span className="paper-tag">HANDOVER</span>
                      <b>
                        업무의 다음을
                        <br />
                        이어갑니다.
                      </b>
                      <i />
                      <i />
                      <i />
                      <span className="paper-check">
                        <Check size={15} /> 다음 할 일
                      </span>
                      <div className="paper-stamp">
                        <CheckCheck size={23} />
                      </div>
                    </div>
                    <span className="art-spark">✳</span>
                  </div>
                </section>
                <section className="continue-card">
                  <div className="card-heading">
                    <h2>
                      <Bookmark size={17} /> 이어서 읽기
                    </h2>
                    <Badge tone="green">최근 읽은 문서</Badge>
                  </div>
                  <div className="continue-title">
                    <DocIcon doc={continueDoc} />
                    <div>
                      <small>{continueDoc.category}</small>
                      <h3>{continueDoc.title}</h3>
                    </div>
                  </div>
                  <p className="continue-section">
                    {sections.find(
                      ([id]) => id === readPositions[continueDoc.id],
                    )?.[1] || "업무 개요"}
                    에서 이어가요
                  </p>
                  <div className="next-action">
                    <span>다음 할 일</span>
                    <p>{continueDoc.next}</p>
                  </div>
                  <button
                    className="button secondary full-width"
                    onClick={() => openDoc(continueDoc.id)}
                  >
                    읽던 곳으로 <ArrowRight size={16} />
                  </button>
                  <button
                    className="pending-link"
                    onClick={() =>
                      navigate({ page: "questions", filter: "답변 대기" })
                    }
                  >
                    <MessageCircle size={15} /> 답변을 기다리는 질문{" "}
                    <b>{pending}</b>
                    <ChevronRight size={14} />
                  </button>
                </section>
              </div>
              <section
                className="documents-section"
                aria-labelledby="library-title"
              >
                <div className="section-heading">
                  <h2 id="library-title">
                    인수인계서 모아보기 <span>{handovers.length}</span>
                  </h2>
                  <span className="muted">
                    모든 업무 내용과 인물은 가상 예시예요.
                  </span>
                </div>
                <div className="document-tabs">
                  <div className="tabs" aria-label="문서 범위">
                    {["전체", "즐겨찾기", "최근 읽은 문서"].map((t) => (
                      <button
                        key={t}
                        aria-pressed={tab === t}
                        className={tab === t ? "selected" : ""}
                        onClick={() => go({ ...route, tab: t })}
                      >
                        {t === "즐겨찾기" && <Star size={14} />} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="document-toolbar">
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      id="global-search"
                      aria-label="인수인계서·질문·답변 검색"
                      value={query}
                      onChange={(e) =>
                        go({ ...route, q: e.target.value }, true)
                      }
                      placeholder="업무명, 궁금한 내용, 담당자를 검색해보세요"
                    />
                    {query ? (
                      <button
                        type="button"
                        aria-label="검색 지우기"
                        className="icon-button"
                        onClick={() => go({ ...route, q: null }, true)}
                      >
                        <X size={15} />
                      </button>
                    ) : (
                      <kbd>⌘ K</kbd>
                    )}
                  </label>
                  <div className="toolbar-right">
                    <select
                      aria-label="문서 정렬"
                      value={route.sort || "최근 업데이트순"}
                      onChange={(e) => go({ ...route, sort: e.target.value })}
                    >
                      <option>최근 업데이트순</option>
                      <option>이름순</option>
                    </select>
                    <div className="view-switch">
                      {[
                        ["grid", LayoutGrid, "카드 보기"],
                        ["list", List, "목록 보기"],
                      ].map(([id, Icon, label]) => (
                        <button
                          key={id}
                          aria-label={label}
                          aria-pressed={(route.layout || "grid") === id}
                          className={
                            (route.layout || "grid") === id ? "selected" : ""
                          }
                          onClick={() => go({ ...route, layout: id })}
                        >
                          <Icon size={17} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="category-row">
                  {categories.map((c) => (
                    <button
                      key={c}
                      className={category === c ? "selected" : ""}
                      aria-pressed={category === c}
                      onClick={() => go({ ...route, category: c })}
                    >
                      {c}
                    </button>
                  ))}
                  <span className="result-count" role="status">
                    {filtered.length}개 문서
                  </span>
                </div>
                {query && (
                  <p className="search-note">
                    문서 본문과 연결된 질문·답변을 함께 검색했어요.
                  </p>
                )}
                <div
                  className={`document-grid ${route.layout === "list" ? "list-view" : ""}`}
                >
                  {filtered.map((d) => (
                    <article className="document-card" key={d.id}>
                      <div className="document-card-top">
                        <DocIcon doc={d} />
                        <span>{d.category}</span>
                        <button
                          className={`icon-button star-button ${favorites.includes(d.id) ? "is-favorite" : ""}`}
                          aria-label={`${d.title} 즐겨찾기`}
                          aria-pressed={favorites.includes(d.id)}
                          onClick={() => toggleFavorite(d.id)}
                        >
                          <Star size={18} />
                        </button>
                      </div>
                      <button
                        className="document-open"
                        onClick={() =>
                          openDoc(d.id, searchTarget(d, query, questions))
                        }
                      >
                        <h3>
                          {d.title}
                          <ArrowUpRight size={17} />
                        </h3>
                        <p>{d.desc}</p>
                      </button>
                      <div className="doc-context">
                        <Badge>{d.year}년 기준</Badge>
                        <span>{d.readMinutes}분 읽기</span>
                      </div>
                      <div className="doc-footer">
                        <span>
                          <Avatar name={d.owner} />
                          {d.owner}
                          <small>{d.team}</small>
                        </span>
                        <button
                          aria-label={`${d.title} 질문 보기`}
                          onClick={() => openDoc(d.id, { block: "procedure" })}
                        >
                          <MessageCircle size={14} />{" "}
                          {questions.filter((q) => q.doc === d.id).length}
                        </button>
                      </div>
                      <div className="doc-review">
                        <ShieldCheck size={13} /> 샘플 검토일 {d.reviewed}
                      </div>
                    </article>
                  ))}
                </div>
                {!filtered.length && (
                  <Empty
                    title="찾으시는 인수인계서가 없어요"
                    action={
                      <button
                        className="button secondary"
                        onClick={() => go({ page: "docs", q: query })}
                      >
                        분류와 범위 초기화
                      </button>
                    }
                  >
                    검색어를 유지한 채 분류를 바꾸거나, 서식명·담당자로
                    찾아보세요.
                  </Empty>
                )}
                <div className="bottom-note">
                  <ShieldCheck size={15} />
                  <span>
                    현재는 UX 시제품이에요. 질문과 준비 내용은 이 브라우저에
                    저장됩니다.
                  </span>
                  <button onClick={() => setDialog("guide")}>
                    사용 가이드 <ArrowUpRight size={14} />
                  </button>
                </div>
              </section>
            </>
          )}
          {page === "docs" && route.doc && !doc && (
            <Empty
              title="인수인계서를 찾을 수 없어요"
              action={
                <button
                  className="button primary"
                  onClick={() => navigate({ page: "docs" })}
                >
                  목록으로 돌아가기
                </button>
              }
            >
              문서 주소를 확인해주세요.
            </Empty>
          )}
          {page === "docs" && doc && (
            <Reader
              {...{
                doc,
                questions,
                checks,
                setChecks,
                checksSaved,
                readPositions,
                setReadPositions,
                currentBlock,
                panel,
                route,
                go,
                openPanel,
                closePanel,
                updateQuestion,
                setQuestions,
                drafts,
                setDrafts,
                draftsSaved,
                questionsSaved,
                setDialog,
                setToast,
              }}
              favorite={favorites.includes(doc.id)}
              toggleFavorite={() => toggleFavorite(doc.id)}
              back={() =>
                navigate({ ...route, doc: null, block: null, thread: null })
              }
            />
          )}
          {page === "questions" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    ASK IN CONTEXT, KEEP THE KNOWLEDGE
                  </div>
                  <h1>
                    질문함
                    <span className="heading-dot" />
                  </h1>
                  <p>
                    어떤 문장에서 시작된 질문인지, 어떤 기준의 답변인지 함께
                    확인해요.
                  </p>
                </div>
                <span className="heading-icon">
                  <MessageCircle size={27} />
                </span>
              </div>
              <div className="question-summary">
                <button
                  onClick={() => go({ page: "questions", filter: "답변 대기" })}
                >
                  <Clock3 size={21} />
                  <span>
                    답변을 기다려요
                    <strong>
                      {pending}
                      <small>건</small>
                    </strong>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  onClick={() => go({ page: "questions", filter: "검토 필요" })}
                >
                  <ShieldCheck size={21} />
                  <span>
                    답변 검토가 필요해요
                    <strong>
                      {
                        questions.filter((q) =>
                          q.answers.some((a) => !a.reviewed),
                        ).length
                      }
                      <small>건</small>
                    </strong>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  onClick={() => go({ page: "questions", filter: "해결됨" })}
                >
                  <CheckCheck size={21} />
                  <span>
                    질문이 해결됐어요
                    <strong>
                      {questions.filter((q) => q.resolved).length}
                      <small>건</small>
                    </strong>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="question-board">
                <div className="board-toolbar">
                  <div className="tabs">
                    {[
                      "전체",
                      "내 질문",
                      "답변 대기",
                      "검토 필요",
                      "해결됨",
                    ].map((f) => (
                      <button
                        key={f}
                        className={
                          (route.filter || "전체") === f ? "selected" : ""
                        }
                        aria-pressed={(route.filter || "전체") === f}
                        onClick={() => go({ ...route, filter: f })}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <label className="search-field">
                    <Search size={17} />
                    <input
                      id="global-search"
                      placeholder="질문·답변 검색"
                      aria-label="질문·답변 검색"
                      value={query}
                      onChange={(e) =>
                        go({ ...route, q: e.target.value }, true)
                      }
                    />
                  </label>
                </div>
                <p className="board-explainer">
                  ‘질문 해결’은 질문자의 확인, ‘담당자 검토’는 답변의 업무 기준
                  확인이에요.
                </p>
                <QuestionRows
                  questions={questions.filter(
                    (q) =>
                      questionMatches(q, route.filter || "전체") &&
                      [q.title, q.body, ...q.answers.map((a) => a.body)]
                        .join(" ")
                        .includes(query),
                  )}
                  openQuestion={openQuestion}
                />
              </div>
            </>
          )}
          {page === "me" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR NEXT STEP</div>
                  <h1>
                    하늘 님, 다음 업무를 이어가요
                    <span className="heading-dot" />
                  </h1>
                  <p>
                    준비하던 인수인계서와 질문, 읽던 문서를 한곳에서 확인하세요.
                  </p>
                </div>
                <Avatar />
              </div>
              <div className="me-layout">
                <section className="surface">
                  <div className="card-heading">
                    <h2>
                      <FileText size={19} /> 준비 중인 인수인계서
                    </h2>
                    <Badge>이 기기에 저장</Badge>
                  </div>
                  {hasDraft ? (
                    <div className="saved-preparation">
                      <h3>{preparation.title}</h3>
                      <p>
                        {preparation.team || "담당 부서 미입력"} ·{" "}
                        {preparation.year}년 · 샘플 자료{" "}
                        {preparation.sources?.length || 0}개 선택
                      </p>
                      <button
                        className="button primary"
                        onClick={() => navigate({ page: "prepare" })}
                      >
                        이어서 준비하기 <ArrowRight size={15} />
                      </button>
                    </div>
                  ) : (
                    <Empty
                      title="새로운 바통을 준비해보세요"
                      action={
                        <button
                          className="button secondary"
                          onClick={() => navigate({ page: "prepare" })}
                        >
                          <Plus size={16} /> 인수인계서 만들기
                        </button>
                      }
                    >
                      먼저 업무명과 준비할 자료를 정리해요.
                    </Empty>
                  )}
                </section>
                <section className="surface">
                  <div className="card-heading">
                    <h2>
                      <Clock3 size={19} /> 이어서 읽기
                    </h2>
                  </div>
                  {recent.slice(0, 3).map((id) => {
                    const d = handovers.find((d) => d.id === id);
                    return (
                      d && (
                        <button
                          key={id}
                          className="recent-row"
                          onClick={() => openDoc(id)}
                        >
                          <DocIcon doc={d} />
                          <span>
                            <strong>{d.title}</strong>
                            <small>
                              {sections.find(
                                ([key]) => key === readPositions[id],
                              )?.[1] || "업무 개요"}
                              에서 이어서
                            </small>
                          </span>
                          <ArrowUpRight size={16} />
                        </button>
                      )
                    );
                  })}
                </section>
                <section className="surface my-questions">
                  <div className="card-heading">
                    <h2>
                      <MessageCircle size={19} /> 내가 남긴 질문
                    </h2>
                    <button
                      className="text-button"
                      onClick={() =>
                        navigate({ page: "questions", filter: "내 질문" })
                      }
                    >
                      전체 보기 <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <QuestionRows
                    questions={questions.filter(
                      (q) => q.person === CURRENT_USER,
                    )}
                    openQuestion={openQuestion}
                  />
                </section>
              </div>
            </>
          )}
          {page === "prepare" && (
            <Prepare
              {...{ preparation, setPreparation, prepSaved }}
              onExit={() => navigate({ page: "docs" })}
              onSave={() => {
                setToast(
                  prepSaved
                    ? "준비 내용을 이 기기에 저장했어요."
                    : "저장 공간을 확인해주세요.",
                );
                navigate({ page: "me" });
              }}
              openSample={() => openDoc(1)}
            />
          )}
        </main>
        <footer>
          <span>
            업무 바통<span className="brand-dot">.</span>
          </span>
          <small>사람이 바뀌어도, 경험은 이어지도록.</small>
          <small>© 2026 BATON</small>
        </footer>
      </div>
      {dialog && (
        <Dialog
          title={
            dialog === "guide"
              ? "경험을 이어가는 세 가지 방법"
              : "출처 확인 · 샘플 자료"
          }
          onClose={() => setDialog(null)}
        >
          {dialog === "guide" ? (
            <>
              <p>
                업무를 넘겨줄 때부터, 처음 맡아 읽고 질문할 때까지 함께해요.
              </p>
              {[
                [
                  "01",
                  "넘겨줄 업무를 준비해요",
                  "업무명과 자료를 정리하고 인수인계서의 구성을 살펴보세요. 현재 생성 화면은 샘플 미리보기입니다.",
                ],
                [
                  "02",
                  "지금 할 일부터 읽어요",
                  "현재 현황, 다음 행동, 일정과 협의할 사람을 먼저 확인하세요.",
                ],
                [
                  "03",
                  "궁금한 문맥에서 질문해요",
                  "문단의 질문 버튼을 누르면 원문과 연결된 대화가 열려요. 닫으면 읽던 곳으로 돌아옵니다.",
                ],
              ].map(([n, t, p]) => (
                <div className="guide-step" key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <Badge tone="amber">실제 파일이 연결되지 않은 예시</Badge>
              <blockquote>
                “업무 요청 시 필수 서류를 확인하고, 누락된 자료는 담당자에게
                보완을 요청한다.”
              </blockquote>
              <p>
                원문·페이지 이동은 실제 자료 연결 후 제공됩니다. 현재 문구는 UX
                확인용 가상 인용이며 업무 근거로 사용할 수 없어요.
              </p>
            </>
          )}
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="알림 닫기" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {(!questionsSaved || !checksSaved || !prepSaved || !draftsSaved) && (
        <div className="storage-error" role="alert">
          이 브라우저에 저장하지 못했어요. 작성 내용은 현재 화면에 유지되지만
          새로고침하면 사라질 수 있어요.
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
