export interface WikiAuthor {
  name: string;
  role: string;
  level: string; // e.g. "태양신", "달신", "초인", "초보"
  badge?: string;
  department: string;
  adoptRate?: number;
  avatarColor: string;
}

export interface EvidenceLink {
  title: string;
  sourceType: '규정/법령' | '업무매뉴얼' | '공문서' | '전산시스템';
  referenceLocation: string; // e.g. "제14조 2항", "p.42", "메뉴 3.2"
}

export interface KinComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface KinAnswer {
  id: string;
  author: WikiAuthor;
  content: string;
  createdAt: string;
  isAdopted: boolean; // 질문자 채택 답변
  isOfficialReviewed: boolean; // 담당자 검토 완료 배지
  evidenceNote?: {title: string; location: string; verified: boolean};
  reviewNote?: string; // "2026년도 개정 지침 반영 확인 완료"
  likes: number;
  userLiked?: boolean;
  evidenceLinks: EvidenceLink[];
  comments: KinComment[];
}

export interface KinThread {
  id: string;
  documentId: string;
  blockId: string;
  sentenceId?: string;
  sentenceQuote: string; // 인용된 나무위키 본문 문장
  title: string;
  content: string;
  author: WikiAuthor;
  createdAt: string;
  views: number;
  empathyCount: number; // 나도 궁금해요
  userEmpathized?: boolean;
  adoptedAnswerId?: string;
  status: 'RESOLVED' | 'WAITING'; // '해결됨' | '답변대기'
  tags: string[];
  answers: KinAnswer[];
}

export interface WikiSentence {
  id: string;
  text: string;
  isStrikeThrough?: boolean;
  isBold?: boolean;
  isHighlight?: boolean;
  isInternalLink?: boolean;
  linkTarget?: string;
  footnoteNumber?: number;
  hasQuestions?: boolean;
  questionCount?: number;
}

export interface WikiTableCell {
  id: string;
  text: string;
  isBold?: boolean;
  hasQuestions?: boolean;
  questionCount?: number;
  isStrikeThrough?: boolean;
  footnoteNumber?: number;
}

export interface WikiTableRow {
  cells: WikiTableCell[];
}

export interface WikiTableData {
  title?: string;
  columns: string[];
  rows: WikiTableRow[];
}

export interface WikiBlock {
  id: string;
  sectionNumber: string;
  title?: string;
  level: 1 | 2 | 3;
  type: 'paragraph' | 'blockquote' | 'alert' | 'table';
  sentences: WikiSentence[];
  tableData?: WikiTableData;
  alertType?: 'info' | 'warning' | 'tip';
  alertTitle?: string;
}

export interface WikiInfoBox {
  title: string;
  subtitle: string;
  emblemText: string;
  items: {
    label: string;
    value: string;
    isLink?: boolean;
  }[];
}

export interface MilestoneItem {
  id: string;
  phase: string;
  period: string;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progress: number;
  owner: string;
  tasks: string[];
}

export interface ProcessStep {
  stepNumber: number;
  title: string;
  duration: string;
  system: string;
  keyAction: string;
  checkpoint: string;
  questionCount: number;
  isCritical?: boolean;
}

export interface ChecklistCategory {
  category: string;
  completed: number;
  total: number;
  items: { text: string; done: boolean }[];
}

export interface WikiDocument {
  status?: "draft" | "review" | "published";
  revision?: number;
  id: string;
  title: string;
  categories: string[];
  lastModified: string;
  viewCount: number;
  version: string;
  infoBox: WikiInfoBox;
  summary: string;
  footnotes: { number: number; text: string }[];
  blocks: WikiBlock[];
  milestones: MilestoneItem[];
  processSteps: ProcessStep[];
  checklist: ChecklistCategory[];
}

