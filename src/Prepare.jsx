import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  Check,
  Layers,
  BookOpen,
  FileText,
  ShieldCheck,
  Paperclip,
} from "lucide-react";
import { handovers } from "./handover";
import { Badge } from "./ui";

export default function Prepare({
  preparation,
  setPreparation,
  prepSaved,
  onExit,
  onSave,
  openSample,
}) {
  const step = Math.min(Math.max(Number(preparation.step) || 0, 0), 2),
    sources = preparation.sources || [],
    sample = handovers[0];
  function update(values) {
    setPreparation((p) => ({ ...p, ...values }));
  }
  return (
    <div className="prepare-page">
      <button className="back-link" onClick={onExit}>
        <ArrowLeft size={16} /> 인수인계서 목록
      </button>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PASS ON THE CONTEXT</div>
          <h1>다음 사람을 위한 인수인계서</h1>
          <p>무엇부터 남길지 막막하다면, 업무와 자료부터 하나씩 정리해요.</p>
        </div>
        <Badge tone="amber">제작 UX 체험</Badge>
      </div>
      <div className="preparation-notice">
        <CircleHelp size={18} />
        <p>
          현재는 <b>업무 정보 저장과 샘플 구성 미리보기</b>를 체험할 수 있어요.
          파일 업로드와 AI 생성은 아직 연결되지 않았습니다.
        </p>
      </div>
      <ol className="stepper">
        {["업무 정보", "자료 준비", "구성 미리보기"].map((title, i) => (
          <li
            key={title}
            className={i === step ? "active" : i < step ? "complete" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={17} /> : undigit(i)}</span>
            <div>
              <small>STEP {undigit(i)}</small>
              <strong>{title}</strong>
            </div>
          </li>
        ))}
      </ol>
      <div className="prepare-layout">
        <form
          className="preparation-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) update({ step: step + 1 });
            else onSave();
          }}
        >
          <div className="form-section-title">
            <span>{undigit(step)}</span>
            <div>
              <h2>
                {
                  [
                    "어떤 업무를 이어주나요?",
                    "어떤 자료를 준비할까요?",
                    "이런 구조로 업무를 이어줘요.",
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    "다음 담당자가 알아볼 수 있는 업무명을 적어주세요.",
                    "실제 생성에 필요한 자료를 샘플 목록으로 살펴보세요.",
                    "아래는 보조사업 업무의 고정 예시예요. 입력 내용을 분석한 결과가 아닙니다.",
                  ][step]
                }
              </p>
            </div>
          </div>
          {step === 0 ? (
            <>
              <label htmlFor="prep-title">
                업무명 <span>필수</span>
              </label>
              <input
                id="prep-title"
                required
                maxLength={100}
                value={preparation.title || ""}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="예: 보조사업 운영 및 정산"
              />
              <label htmlFor="prep-team">담당 부서</label>
              <input
                id="prep-team"
                maxLength={80}
                value={preparation.team || ""}
                onChange={(e) => update({ team: e.target.value })}
                placeholder="예: 사업운영팀"
              />
              <label htmlFor="prep-year">적용 연도</label>
              <select
                id="prep-year"
                value={preparation.year || "2026"}
                onChange={(e) => update({ year: e.target.value })}
              >
                {["2025", "2026", "2027"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <div className="form-tip">
                <BookOpen size={18} />
                <p>
                  업무명은 ‘사업운영팀 업무’보다
                  <br />
                  <b>‘보조사업 운영 및 정산’</b>처럼 구체적으로 적으면 좋아요.
                </p>
              </div>
            </>
          ) : step === 1 ? (
            <>
              <div className="sample-source-title">
                <h3>준비 자료 예시</h3>
                <Badge>고정 샘플</Badge>
              </div>
              {sample.files.map((name, i) => (
                <label className="sample-file" key={name}>
                  <input
                    type="checkbox"
                    checked={sources.includes(name)}
                    onChange={() =>
                      update({
                        sources: sources.includes(name)
                          ? sources.filter((n) => n !== name)
                          : [...sources, name],
                      })
                    }
                  />
                  <FileText size={23} />
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {
                        [
                          "절차·기준을 담은 자료",
                          "현재 진행 상황과 일정",
                          "자주 쓰는 서식",
                        ][i]
                      }
                    </small>
                  </span>
                </label>
              ))}
              <p className="muted source-choice">
                선택한 샘플 {sources.length}개 · 선택하지 않아도 구성을 살펴볼
                수 있어요.
              </p>
              <div className="form-tip">
                <ShieldCheck size={18} />
                <p>
                  향후에는 자료별 읽기 결과와 누락 여부를 확인한 뒤 초안을
                  만들게 됩니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="preview-document">
                <div className="preview-document-header">
                  <BookOpen size={22} />
                  <div>
                    <small>샘플 미리보기 · 입력 정보와 별개</small>
                    <h3>{sample.title}</h3>
                  </div>
                  <Badge>초안 예시</Badge>
                </div>
                {[
                  ["현재 현황", sample.stage],
                  ["다음 할 일", sample.next],
                  ["가까운 일정", sample.due],
                  ["협의할 사람", sample.contact],
                ].map(([title, content]) => (
                  <div className="preview-line" key={title}>
                    <strong>{title}</strong>
                    <p>{content}</p>
                  </div>
                ))}
                <div className="preview-evidence">
                  <Paperclip size={14} /> 근거 후보 → 원문 확인 → 담당자 검토 후
                  게시
                </div>
              </div>
              <p className="form-tip">
                실제 생성 기능에서는 자료에 없는 내용을 ‘담당자 확인 필요’로
                남기고 검토 후 게시합니다.
              </p>
              <button
                type="button"
                className="text-button preview-open"
                onClick={openSample}
              >
                완성된 샘플을 읽어보기 <ArrowUpRight size={15} />
              </button>
            </>
          )}
          <div className="form-bottom">
            <span className="save-status">
              {prepSaved ? "이 기기에 준비 내용 저장됨" : "저장하지 못했어요"}
            </span>
            <div>
              {step > 0 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => update({ step: step - 1 })}
                >
                  <ArrowLeft size={15} /> 이전
                </button>
              )}
              <button type="submit" className="button primary">
                {step === 2 ? "준비 내용 저장" : "다음"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
        <aside className="prepare-guide">
          <div className="guide-icon">
            <Layers size={25} />
          </div>
          <h2>
            좋은 인수인계서는
            <br />
            업무의 맥락을 남겨요.
          </h2>
          <p>
            파일 목록만으로 알기 어려운
            <br />
            ‘지금 어디까지 왔는지’를 함께 전해요.
          </p>
          {[
            "현재 진행 상황",
            "바로 해야 할 다음 행동",
            "일정과 확인할 담당자",
            "예외 사항과 원문 근거",
          ].map((t) => (
            <div key={t}>
              <Check size={15} />
              <span>{t}</span>
            </div>
          ))}
          <small>
            자료 준비 → 초안 생성 → 사람의 검토
            <br />
            이후 질문과 답변으로 계속 보완해요.
          </small>
        </aside>
      </div>
    </div>
  );
}
function undigit(i) {
  return `0${i + 1}`;
}
