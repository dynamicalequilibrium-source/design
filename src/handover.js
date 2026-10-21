import { docs, legacyQuestions } from "./data.js";

export const CURRENT_USER = "정하늘";
export const categories = [
  "전체",
  "사업 운영",
  "인사·총무",
  "예산·회계",
  "팀 협업",
];
export const sections = [
  ["overview", "업무 개요"],
  ["current", "현재 현황"],
  ["procedure", "처리 절차"],
  ["schedule", "일정과 체크리스트"],
  ["people", "협의할 사람"],
  ["caution", "예외·주의사항"],
  ["sources", "관련 자료"],
];
const details = [
  {
    stage: "정산 자료 취합 중",
    next: "미제출 단체의 정산 서류를 확인하고 보완을 요청하세요.",
    due: "10월 25일 · 정산 서류 취합",
    caution:
      "증빙 누락 건은 임의로 정산을 확정하지 말고 보완 기한을 담당자와 협의하세요.",
    tasks: [
      "단체별 제출 현황 확인",
      "누락 서류 보완 요청",
      "교부 내역과 정산 금액 대조",
    ],
    files: [
      "2026 보조사업 운영 가이드.pdf",
      "정산 서류 제출 현황.xlsx",
      "교부신청서 서식.hwpx",
    ],
  },
  {
    stage: "신규 입사자 맞이 준비",
    next: "입사 예정일을 확인하고 계정·장비 준비를 요청하세요.",
    due: "입사 3일 전 · 계정과 장비 확인",
    caution: "입사 일정이 바뀌면 계정 발급일과 교육 일정도 함께 조정하세요.",
    tasks: [
      "입사 일정과 담당자 확인",
      "계정·장비 준비 요청",
      "첫날 안내와 교육 일정 공유",
    ],
    files: [
      "신규 입사자 안내.pdf",
      "입사 준비 체크리스트.xlsx",
      "계정 발급 요청서.docx",
    ],
  },
  {
    stage: "이번 달 지출 증빙 취합 중",
    next: "부서별 지출 증빙을 모아 집행 내역과 대조하세요.",
    due: "매월 25일 · 지출 증빙 마감",
    caution:
      "연도 말 증빙 처리 기준은 월별 마감과 다를 수 있어 별도 확인이 필요해요.",
    tasks: [
      "지출 증빙 취합",
      "집행 내역과 증빙 대조",
      "예산 잔액과 집행률 확인",
    ],
    files: [
      "예산 집행 기준.pdf",
      "월별 예산 집행 내역.xlsx",
      "지출 증빙 안내.txt",
    ],
  },
  {
    stage: "행사 준비 사항 확인 중",
    next: "참여 인원과 운영 동선을 확인하고 현장 역할을 나누세요.",
    due: "행사 1주 전 · 운영 계획 확인",
    caution: "장소·인원 변경 시 안전 계획과 안내 문구도 함께 확인하세요.",
    tasks: [
      "참여 인원 확정",
      "현장 동선과 역할 점검",
      "행사 후 결과 자료 정리",
    ],
    files: [
      "행사 운영 계획.pdf",
      "현장 역할 분담표.xlsx",
      "결과 보고 양식.docx",
    ],
  },
  {
    stage: "구매 요청 자료 준비",
    next: "예산 잔액과 비교 견적을 확인해 구매 요청서를 준비하세요.",
    due: "요청 전 · 예산과 필수 서류 확인",
    caution: "계약 유형과 금액에 따른 절차는 경영지원팀에 먼저 확인하세요.",
    tasks: [
      "예산과 구매 필요성 확인",
      "비교 견적과 요청 자료 준비",
      "계약 검토 요청",
    ],
    files: ["계약·구매 기준.pdf", "비교 견적 목록.xlsx", "구매 요청서.hwpx"],
  },
  {
    stage: "다음 주 공유 사항 작성",
    next: "진행 상황과 협업이 필요한 내용을 공용 문서에 적어주세요.",
    due: "매주 금요일 오후 · 다음 주 공유",
    caution: "개인정보나 민감한 협의 내용은 공유 범위를 먼저 확인하세요.",
    tasks: [
      "진행 상황 정리",
      "협업 요청 사항 작성",
      "회의 후 담당자와 기한 기록",
    ],
    files: [
      "주간 업무 공유 가이드.pdf",
      "팀 업무 현황.xlsx",
      "회의 기록 양식.docx",
    ],
  },
];
export const handovers = docs.map((d, i) => ({
  ...d,
  ...details[i],
  contact: `${d.owner} · ${d.team}`,
  year: 2026,
  version: "1.3",
  reviewed: "2026. 10. 15.",
  updated: `2026. ${d.date}`,
  readMinutes: 5 + (i % 3),
}));
export function quoteFor(doc, block) {
  return (
    {
      overview: doc.intro,
      current: doc.next,
      procedure: doc.quote,
      schedule: doc.due,
      people: "진행 상황과 확인할 내용을 정리해 협의하세요.",
      caution: doc.caution,
      sources: doc.files[0],
    }[block] || doc.quote
  );
}
export function migrateQuestions(items = legacyQuestions) {
  return items
    .filter((q) => q && handovers.some((d) => d.id === q.doc))
    .map((q) => {
      if (q.answers) return q;
      const doc = handovers.find((d) => d.id === q.doc);
      return {
        id: q.id,
        doc: q.doc,
        block: "procedure",
        quote: doc.quote,
        version: "1.3",
        year: 2026,
        title: q.title,
        body: q.body,
        person: q.person,
        date: q.date,
        resolved: q.status === "해결됨",
        answers: q.answer
          ? [
              {
                id: `legacy-${q.id}`,
                person: doc.owner,
                body: q.answer,
                reviewed: q.status === "검토 완료",
                reviewer: "샘플 검토자",
                date: "샘플 답변",
                comments: [],
              },
            ]
          : [],
      };
    });
}
const normalize = (s) =>
  s.normalize("NFC").toLocaleLowerCase("ko").replace(/\s/g, "");
export function searchTarget(doc, query, questions) {
  const term = normalize(query.trim());
  if (!term) return {};
  if (
    normalize(
      `${doc.title} ${doc.desc} ${doc.owner} ${doc.team} ${doc.category}`,
    ).includes(term)
  )
    return {};
  const question = questions.find(
    (q) =>
      q.doc === doc.id &&
      normalize(
        [q.title, q.body, ...q.answers.map((a) => a.body)].join(" "),
      ).includes(term),
  );
  if (question) return { block: question.block, thread: question.id };
  const section = sections.find(([id]) =>
    normalize(quoteFor(doc, id)).includes(term),
  );
  return section ? { block: section[0] } : {};
}
export function matchesQuery(doc, query, questions) {
  const term = normalize(query.trim());
  return (
    !term ||
    normalize(
      [
        doc.title,
        doc.desc,
        doc.category,
        doc.owner,
        doc.team,
        ...sections.map(([id]) => quoteFor(doc, id)),
        ...questions
          .filter((q) => q.doc === doc.id)
          .flatMap((q) => [q.title, q.body, ...q.answers.map((a) => a.body)]),
      ].join(" "),
    ).includes(term)
  );
}
export function questionStatus(q) {
  return q.resolved ? "해결됨" : q.answers.length ? "답변 있음" : "답변 대기";
}
export function questionMatches(q, filter) {
  return (
    filter === "전체" ||
    (filter === "내 질문" && q.person === CURRENT_USER) ||
    (filter === "답변 대기" && !q.answers.length && !q.resolved) ||
    (filter === "검토 필요" && q.answers.some((a) => !a.reviewed)) ||
    (filter === "해결됨" && q.resolved)
  );
}
export function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}
