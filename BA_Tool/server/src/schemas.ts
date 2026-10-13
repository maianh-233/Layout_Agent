// Schema zod cho bộ câu hỏi do AI sinh và dữ liệu dự án.
import { z } from 'zod';

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  hint: z.string(),
  type: z.enum(['text', 'single', 'multi']),
  options: z.array(z.string().min(1)),
  srsSections: z.array(z.string().min(1)).min(1),
});

export const QuestionSetSchema = z
  .object({
    groups: z
      .array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          questions: z.array(QuestionSchema).min(1),
        }),
      )
      .min(1),
  })
  .superRefine((set, ctx) => {
    const seen = new Set<string>();
    set.groups.forEach((g, gi) =>
      g.questions.forEach((q, qi) => {
        if (seen.has(q.id)) {
          ctx.addIssue({ code: 'custom', message: `Trùng id câu hỏi "${q.id}"`, path: ['groups', gi, 'questions', qi, 'id'] });
        }
        seen.add(q.id);
        if (q.type !== 'text' && q.options.length < 2) {
          ctx.addIssue({ code: 'custom', message: `Câu "${q.id}" kiểu ${q.type} cần ít nhất 2 lựa chọn`, path: ['groups', gi, 'questions', qi, 'options'] });
        }
      }),
    );
  });

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;

export const AnswerSchema = z.object({
  status: z.enum(['answered', 'skipped']),
  /** text: chuỗi; single: chuỗi; multi: mảng chuỗi */
  value: z.union([z.string(), z.array(z.string())]),
  /** Nội dung ô "Khác" (single/multi) */
  other: z.string().optional(),
});
export type Answer = z.infer<typeof AnswerSchema>;

export type Phase = 'business' | 'ui';

/** Loại dự án — quyết định file domain tham chiếu và số câu hỏi. */
export const PROJECT_TYPES = ['website', 'ecommerce', 'crm', 'erp', 'management-generic'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  website: 'Website giới thiệu / Landing page',
  ecommerce: 'Thương mại điện tử',
  crm: 'CRM',
  erp: 'ERP',
  'management-generic': 'Hệ thống quản lý khác',
};

/** Dự án tạo trước khi có trường này được coi là website. */
export const projectTypeOf = (p: { projectType?: ProjectType }): ProjectType => p.projectType ?? 'website';

/** CRM/ERP/quản lý: hệ thống lớn, cần nhiều bước AI hơn. */
export const isLargeSystem = (t: ProjectType) => t === 'crm' || t === 'erp' || t === 'management-generic';

/** Màn hình hiện tại của dự án — dùng để "Mở tiếp" đúng chỗ. */
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
  /** Không có ở dự án cũ — dùng projectTypeOf() để đọc */
  projectType?: ProjectType;
  createdAt: string;
  updatedAt: string;
  screen: Screen;
  request: string;
  business: PhaseState;
  ui: PhaseState;
  /** File SRS được tạo mới / sửa ở lần chạy gần nhất (đường dẫn tương đối trong srs/) */
  srsChanges: { path: string; kind: 'new' | 'modified' }[];
  prototype: { dir: string | null; builtAt: string | null; pages: string[] };
  /** Tác vụ AI đang chạy hoặc vừa kết thúc */
  job: {
    id: string;
    kind: JobKind;
    status: 'running' | 'done' | 'error';
    error?: string;
    /** Loại lỗi: usage_limit = chạm giới hạn sử dụng tài khoản */
    errorCode?: 'usage_limit' | 'auth' | 'network' | 'other';
    /** Thời điểm hạn mức được làm mới (epoch giây) */
    resetsAt?: number;
    /** Folder đích (bước prototype) — để "Chạy lại bước này" */
    targetDir?: string;
  } | null;
}

export const SaveAnswersSchema = z.object({
  answers: z.record(z.string(), AnswerSchema),
  currentIndex: z.number().int().min(0),
});
