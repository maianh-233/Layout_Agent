// Kiểu dữ liệu dùng chung với backend (server/src/schemas.ts).

export type QuestionType = 'text' | 'single' | 'multi';

export interface Question {
  id: string;
  text: string;
  hint: string;
  type: QuestionType;
  options: string[];
  srsSections: string[];
  /** Chỉ hiện khi câu questionId được chọn một trong các đáp án includes */
  showIf?: { questionId: string; includes: string | string[] };
  /** Câu hỏi bổ sung: vì sao hỏi */
  reason?: string;
}

export interface QuestionSet {
  groups: { id: string; title: string; questions: Question[]; followup?: boolean }[];
}

export interface Answer {
  status: 'answered' | 'skipped';
  value: string | string[];
  other?: string;
}

export type Phase = 'business' | 'ui';

export type ProjectType = 'website' | 'ecommerce' | 'crm' | 'erp' | 'management-generic';

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string; hint: string }[] = [
  { value: 'website', label: 'Website giới thiệu / Landing page', hint: 'Giới thiệu doanh nghiệp, sản phẩm, form liên hệ / đặt lịch' },
  { value: 'ecommerce', label: 'Thương mại điện tử', hint: 'Bán hàng online: giỏ hàng, thanh toán, đơn hàng' },
  { value: 'crm', label: 'CRM', hint: 'Quản lý khách hàng: lead, cơ hội bán hàng, chăm sóc khách' },
  { value: 'erp', label: 'ERP', hint: 'Quản trị doanh nghiệp: mua, bán, kho, kế toán, nhân sự…' },
  { value: 'management-generic', label: 'Hệ thống quản lý khác', hint: 'Phần mềm quản lý nội bộ theo nghiệp vụ riêng' },
];

/** Dự án tạo trước khi có loại dự án được coi là website. */
export const projectTypeLabel = (t: ProjectType | undefined) =>
  PROJECT_TYPE_OPTIONS.find((o) => o.value === (t ?? 'website'))!.label;
export type Screen = 'request' | 'business-qa' | 'business-review' | 'ui-qa' | 'ui-review' | 'prototype' | 'done';
export type JobKind =
  | 'business-questions'
  | 'business-followup'
  | 'business-srs'
  | 'ui-questions'
  | 'ui-followup'
  | 'ui-srs'
  | 'srs-review'
  | 'srs-fix'
  | 'prototype';

export interface PhaseState {
  questions: QuestionSet | null;
  answers: Record<string, Answer>;
  currentIndex: number;
  notes?: Record<string, string>;
  followupStatus?: 'asked' | 'skipped';
}

export interface Project {
  slug: string;
  name: string;
  projectType?: ProjectType;
  createdAt: string;
  updatedAt: string;
  screen: Screen;
  request: string;
  business: PhaseState;
  ui: PhaseState;
  srsChanges: { path: string; kind: 'new' | 'modified' }[];
  /** Lỗi còn lại của _registry.json / _permissions.json (dự án mới) */
  registryErrors?: string[];
  review?: { createdAt: string; critical: number; major: number; minor: number; aiStatus: 'done' | 'failed' | 'skipped' };
  pendingFix?: { findingId: string; createdAt: string } | null;
  versions?: VersionInfo[];
  prototype: { dir: string | null; builtAt: string | null; pages: string[] };
  job: {
    id: string;
    kind: JobKind;
    status: 'running' | 'done' | 'error';
    error?: string;
    errorCode?: 'usage_limit' | 'auth' | 'network' | 'other';
    resetsAt?: number;
    targetDir?: string;
    findingId?: string;
  } | null;
}

export type Severity = 'critical' | 'major' | 'minor';
export const SEVERITY_LABELS: Record<Severity, string> = { critical: 'Nghiêm trọng', major: 'Cần sửa', minor: 'Gợi ý' };

export interface Finding {
  id: string;
  severity: Severity;
  source: 'code' | 'ai';
  category: string;
  message: string;
  file?: string;
  section?: string;
  codes?: string[];
  suggestion?: string;
  status: 'open' | 'fixed';
}

export interface Review {
  createdAt: string;
  ai: { status: 'done' | 'failed' | 'skipped'; error?: string };
  findings: Finding[];
}

export interface FileDiff {
  path: string;
  status: 'added' | 'removed' | 'modified';
  patch: string;
  added: number;
  removed: number;
}

export interface VersionInfo {
  id: string;
  createdAt: string;
  note: string;
}

/** Trạng thái Claude Code trên máy (server/src/auth.ts) */
export interface AuthStatus {
  ready: boolean;
  cli: { installed: boolean; version?: string };
  account: { loggedIn: boolean; email?: string; subscriptionType?: string; error?: string };
  envApiKey: boolean;
  checkedAt: string;
  model: string;
}

export interface SrsFileInfo {
  path: string;
  needConfirm: number;
  proposed: number;
}

export type JobEvent =
  | { type: 'log'; text: string }
  | { type: 'file'; path: string; action: 'write' | 'edit' }
  | { type: 'step'; text: string }
  | { type: 'status'; status: 'running' | 'done' | 'error'; error?: string };

export interface DirListing {
  path: string | null;
  parent: string | null;
  dirs: { name: string; path: string }[];
  fileCount: number;
}

/** Câu hỏi phẳng kèm tên nhóm — tiện cho việc duyệt từng câu. */
export interface FlatQuestion extends Question {
  groupId: string;
  groupTitle: string;
  followup: boolean;
}

export function flatten(set: QuestionSet | null): FlatQuestion[] {
  if (!set) return [];
  return set.groups.flatMap((g) =>
    g.questions.map((q) => ({ ...q, groupId: g.id, groupTitle: g.title, followup: Boolean(g.followup) })),
  );
}

/**
 * Tập id câu hỏi đang hiện (giống server/src/schemas.ts → visibleQuestionIds).
 * Câu có showIf bị ẩn khi câu cổng bị ẩn, hoặc đã trả lời mà không chọn đáp án nào trong includes.
 * Câu cổng chưa trả lời / "Chưa rõ" thì câu con vẫn hiện.
 */
export function visibleIds(questions: FlatQuestion[], answers: Record<string, Answer>): Set<string> {
  const visible = new Set<string>();
  for (const q of questions) {
    if (!q.showIf) {
      visible.add(q.id);
      continue;
    }
    const gateId = q.showIf.questionId;
    if (!visible.has(gateId)) continue;
    const a = answers[gateId];
    if (!hasContent(a)) {
      visible.add(q.id);
      continue;
    }
    const chosen = Array.isArray(a!.value) ? a!.value : [a!.value];
    if ([q.showIf.includes].flat().some((v) => chosen.includes(v))) visible.add(q.id);
  }
  return visible;
}

/** Câu trả lời có nội dung hay chưa. */
export function hasContent(a: Answer | undefined): boolean {
  if (!a || a.status === 'skipped') return false;
  const vals = (Array.isArray(a.value) ? a.value : [a.value]).filter((v) => v && v !== OTHER);
  return vals.length > 0 || Boolean(a.other?.trim());
}

export const OTHER = '__other__';

export const STEP_LABELS = ['Nghiệp vụ', 'Giao diện', 'Dựng prototype', 'Hoàn tất'] as const;

export function stepOf(screen: Screen): number {
  switch (screen) {
    case 'request':
    case 'business-qa':
    case 'business-review':
      return 0;
    case 'ui-qa':
    case 'ui-review':
      return 1;
    case 'prototype':
      return 2;
    case 'done':
      return 3;
  }
}

export const SCREEN_LABELS: Record<Screen, string> = {
  request: 'Nhập yêu cầu',
  'business-qa': 'Trả lời câu hỏi nghiệp vụ',
  'business-review': 'Xem SRS nghiệp vụ',
  'ui-qa': 'Trả lời câu hỏi giao diện',
  'ui-review': 'Xem SRS giao diện',
  prototype: 'Dựng prototype',
  done: 'Hoàn tất',
};
