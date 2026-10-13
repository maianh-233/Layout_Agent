// Schema zod cho bộ câu hỏi do AI sinh và dữ liệu dự án.
import { z } from 'zod';

/** Câu hỏi rẽ nhánh: chỉ hiện khi câu `questionId` được chọn một trong các đáp án `includes`. */
export const ShowIfSchema = z.object({
  questionId: z.string().min(1),
  includes: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  hint: z.string(),
  type: z.enum(['text', 'single', 'multi']),
  options: z.array(z.string().min(1)),
  srsSections: z.array(z.string().min(1)).min(1),
  showIf: ShowIfSchema.optional(),
  /** Câu hỏi bổ sung: vì sao cần hỏi (thiếu / mơ hồ / mâu thuẫn với câu nào) */
  reason: z.string().optional(),
});

const GroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
  /** Nhóm thuộc vòng câu hỏi bổ sung */
  followup: z.boolean().optional(),
});

type RawSet = { groups: z.infer<typeof GroupSchema>[] };

/** Kiểm tra trùng id, số lựa chọn, và showIf trỏ tới câu đứng trước có đúng đáp án. */
function checkSet(set: RawSet, ctx: z.RefinementCtx) {
  const seen = new Map<string, z.infer<typeof QuestionSchema>>();
  set.groups.forEach((g, gi) =>
    g.questions.forEach((q, qi) => {
      const at = ['groups', gi, 'questions', qi];
      if (seen.has(q.id)) ctx.addIssue({ code: 'custom', message: `Trùng id câu hỏi "${q.id}"`, path: [...at, 'id'] });
      if (q.type !== 'text' && q.options.length < 2) {
        ctx.addIssue({ code: 'custom', message: `Câu "${q.id}" kiểu ${q.type} cần ít nhất 2 lựa chọn`, path: [...at, 'options'] });
      }
      if (q.showIf) {
        const gate = seen.get(q.showIf.questionId);
        if (!gate) {
          ctx.addIssue({ code: 'custom', message: `showIf của "${q.id}" trỏ tới "${q.showIf.questionId}" — câu này không tồn tại hoặc không đứng trước`, path: [...at, 'showIf'] });
        } else if (gate.type === 'text') {
          ctx.addIssue({ code: 'custom', message: `showIf của "${q.id}" trỏ tới câu kiểu text — chỉ được trỏ tới câu single/multi`, path: [...at, 'showIf'] });
        } else {
          for (const v of [q.showIf.includes].flat()) {
            if (!gate.options.includes(v)) {
              ctx.addIssue({ code: 'custom', message: `showIf của "${q.id}": "${v}" không phải lựa chọn của câu "${gate.id}" (phải trùng nguyên văn)`, path: [...at, 'showIf', 'includes'] });
            }
          }
        }
      }
      seen.set(q.id, q);
    }),
  );
}

export const QuestionSetSchema = z
  .object({ groups: z.array(GroupSchema).min(1) })
  .superRefine(checkSet);

/** Vòng câu hỏi bổ sung: tối đa 15 câu, mỗi câu có lý do; được phép rỗng (không cần hỏi thêm). */
export const MAX_FOLLOWUP = 15;
export const FollowupSetSchema = z
  .object({ groups: z.array(GroupSchema) })
  .superRefine((set, ctx) => {
    checkSet(set, ctx);
    const all = set.groups.flatMap((g) => g.questions);
    if (all.length > MAX_FOLLOWUP) ctx.addIssue({ code: 'custom', message: `Tối đa ${MAX_FOLLOWUP} câu hỏi bổ sung, đang có ${all.length}` });
    all.forEach((q) => {
      if (!q.reason?.trim()) ctx.addIssue({ code: 'custom', message: `Câu bổ sung "${q.id}" thiếu trường reason` });
      if (q.showIf) ctx.addIssue({ code: 'custom', message: `Câu bổ sung "${q.id}" không được dùng showIf` });
    });
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

/** Giá trị đặc biệt của lựa chọn "Khác" (giống web/src/types.ts) */
export const OTHER = '__other__';

export function hasContent(a: Answer | undefined): boolean {
  if (!a || a.status === 'skipped') return false;
  const vals = (Array.isArray(a.value) ? a.value : [a.value]).filter((v) => v && v !== OTHER);
  return vals.length > 0 || Boolean(a.other?.trim());
}

/**
 * Tập id câu hỏi đang hiện (giống web/src/types.ts).
 * Câu có showIf bị ẩn khi câu "cổng" bị ẩn, hoặc đã được trả lời mà không chọn đáp án nào trong `includes`.
 * Câu cổng chưa trả lời / "Chưa rõ" thì vẫn hiện câu con — chưa rõ thì vẫn nên hỏi.
 */
export function visibleQuestionIds(set: QuestionSet | null, answers: Record<string, Answer>): Set<string> {
  const visible = new Set<string>();
  if (!set) return visible;
  for (const g of set.groups)
    for (const q of g.questions) {
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

/** Dự án tạo từ khi có loại dự án dùng sổ đăng ký mã (srs/_registry.json); dự án cũ giữ cách viết cũ. */
export const usesRegistry = (p: { projectType?: ProjectType }) => p.projectType !== undefined;

/** CRM/ERP/quản lý: hệ thống lớn, cần nhiều bước AI hơn. */
export const isLargeSystem = (t: ProjectType) => t === 'crm' || t === 'erp' || t === 'management-generic';

/** Màn hình hiện tại của dự án — dùng để "Mở tiếp" đúng chỗ. */
export type Screen = 'request' | 'business-qa' | 'business-review' | 'ui-qa' | 'ui-review' | 'prototype' | 'done';

export const JOB_KINDS = [
  'business-questions',
  'business-followup',
  'business-srs',
  'ui-questions',
  'ui-followup',
  'ui-srs',
  'srs-review',
  'srs-fix',
  'prototype',
] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export interface PhaseState {
  questions: QuestionSet | null;
  answers: Record<string, Answer>;
  currentIndex: number;
  /** Ghi chú riêng của BA theo id câu hỏi (không bắt buộc) */
  notes?: Record<string, string>;
  /** Vòng câu hỏi bổ sung: đã chạy (asked) hoặc BA đã bỏ qua (skipped); chưa có = chưa làm */
  followupStatus?: 'asked' | 'skipped';
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
  /** Lỗi còn lại của srs/_registry.json / _permissions.json sau lần tạo SRS gần nhất (dự án mới) */
  registryErrors?: string[];
  /** Tóm tắt lần rà soát SRS gần nhất (chi tiết ở srs/_review.json) */
  review?: { createdAt: string; critical: number; major: number; minor: number; aiStatus: 'done' | 'failed' | 'skipped' };
  /** AI đã sửa một lỗi rà soát trên bản nháp (workspace/<slug>/_fix/srs), chờ BA xem thay đổi */
  pendingFix?: { findingId: string; createdAt: string } | null;
  /** Các phiên bản đã chốt (bản chụp ở srs/_versions/<id>/) */
  versions?: { id: string; createdAt: string; note: string }[];
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
    /** Lỗi rà soát cần sửa (tác vụ srs-fix) */
    findingId?: string;
  } | null;
}

export const SaveAnswersSchema = z.object({
  answers: z.record(z.string(), AnswerSchema),
  currentIndex: z.number().int().min(0),
  notes: z.record(z.string(), z.string().max(4000)).optional(),
});
