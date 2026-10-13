// Kiểu dữ liệu dùng chung với backend (server/src/schemas.ts).

export type QuestionType = 'text' | 'single' | 'multi';

export interface Question {
  id: string;
  text: string;
  hint: string;
  type: QuestionType;
  options: string[];
  srsSections: string[];
}

export interface QuestionSet {
  groups: { id: string; title: string; questions: Question[] }[];
}

export interface Answer {
  status: 'answered' | 'skipped';
  value: string | string[];
  other?: string;
}

export type Phase = 'business' | 'ui';
export type Screen = 'request' | 'business-qa' | 'business-review' | 'ui-qa' | 'ui-review' | 'prototype' | 'done';
export type JobKind = 'business-questions' | 'business-srs' | 'ui-questions' | 'ui-srs' | 'prototype';

export interface PhaseState {
  questions: QuestionSet | null;
  answers: Record<string, Answer>;
  currentIndex: number;
}

export interface Project {
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  screen: Screen;
  request: string;
  business: PhaseState;
  ui: PhaseState;
  srsChanges: { path: string; kind: 'new' | 'modified' }[];
  prototype: { dir: string | null; builtAt: string | null; pages: string[] };
  job: {
    id: string;
    kind: JobKind;
    status: 'running' | 'done' | 'error';
    error?: string;
    errorCode?: 'usage_limit' | 'auth' | 'network' | 'other';
    resetsAt?: number;
    targetDir?: string;
  } | null;
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
}

export function flatten(set: QuestionSet | null): FlatQuestion[] {
  if (!set) return [];
  return set.groups.flatMap((g) => g.questions.map((q) => ({ ...q, groupId: g.id, groupTitle: g.title })));
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
