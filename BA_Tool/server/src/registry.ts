// Sổ đăng ký mã dùng chung (srs/_registry.json) và ma trận phân quyền (srs/_permissions.json).
// AI ghi hai file này; code kiểm tra tham chiếu chéo rồi sinh Phần 12 (truy vết) và bảng 4.2 (RBAC),
// để những phần này luôn khớp registry thay vì do AI viết tay.
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// ---------- Schema ----------

/** <LOẠI>-<MODULE>-<3 chữ số>, ví dụ FR-SALES-001. NFR dùng nhóm thay cho module: NFR-PERF-001. */
const code = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}-[A-Z0-9]{2,8}-\\d{3}$`), `Mã phải dạng ${prefix}-<MODULE>-<3 chữ số>, ví dụ ${prefix}-SALES-001`);
const ids = z.array(z.string()).default([]);
const file = z.string().min(1);
/** true = nội dung [ĐỀ XUẤT] chưa được khách xác nhận */
const proposed = z.boolean().optional();

export const RegistrySchema = z.object({
  roles: z.array(
    z.object({ id: z.string().regex(/^ROLE-\d{2}$/, 'Mã vai trò dạng ROLE-01'), name: z.string().min(1), file, proposed }),
  ),
  modules: z.array(
    z.object({
      id: z.string().regex(/^MOD-[A-Z0-9]{2,8}$/, 'Mã module dạng MOD-SALES'),
      name: z.string().min(1),
      file,
      proposed,
    }),
  ),
  businessRules: z.array(z.object({ id: code('BR'), summary: z.string().min(1), file, proposed })).default([]),
  userStories: z
    .array(z.object({ id: code('US'), summary: z.string().min(1), file, role: z.string(), businessRules: ids, proposed }))
    .default([]),
  useCases: z
    .array(z.object({ id: code('UC'), summary: z.string().min(1), file, actors: ids, userStories: ids, proposed }))
    .default([]),
  functional: z
    .array(
      z.object({
        id: code('FR'),
        summary: z.string().min(1),
        file,
        useCases: ids,
        businessRules: ids,
        priority: z.enum(['Must', 'Should', 'Could', "Won't"]).optional(),
        proposed,
      }),
    )
    .default([]),
  nonFunctional: z.array(z.object({ id: code('NFR'), summary: z.string().min(1), file, proposed })).default([]),
  entities: z
    .array(z.object({ id: z.string().regex(/^ENT-[A-Z0-9_]{2,30}$/, 'Mã thực thể dạng ENT-ORDER'), name: z.string().min(1), file, module: z.string().optional() }))
    .default([]),
  /** Chứng từ có vòng đời — bản máy đọc được của 5.6 (prototype dùng để mô phỏng chuyển trạng thái) */
  documents: z
    .array(
      z.object({
        id: z.string().regex(/^DOC-[A-Z0-9]{2,8}-[A-Z0-9_]{2,30}$/, 'Mã chứng từ dạng DOC-SALES-ORDER'),
        name: z.string().min(1),
        file,
        entity: z.string().optional(),
        /** Quy tắc đánh mã, ví dụ DH-{YYYY}-{00000} */
        numbering: z.string().optional(),
        states: z
          .array(
            z.object({
              id: z.string().regex(/^[A-Z][A-Z0-9_]*$/, 'Mã trạng thái IN_HOA, ví dụ PENDING_APPROVAL'),
              name: z.string().min(1),
              tone: z.enum(['neutral', 'info', 'warning', 'success', 'danger']).default('neutral'),
              initial: z.boolean().optional(),
              final: z.boolean().optional(),
            }),
          )
          .min(2),
        transitions: z
          .array(
            z.object({
              from: z.string(),
              event: z.string().min(1),
              to: z.string(),
              roles: ids,
              condition: z.string().optional(),
              /** Mã quyền thực hiện, ví dụ SALES.ORDER.APPROVE */
              permission: z.string().optional(),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
  screens: z
    .array(z.object({ id: code('SCR'), name: z.string().min(1), file, functional: ids, roles: ids, proposed }))
    .default([]),
  testCases: z.array(z.object({ id: code('TC'), summary: z.string().min(1), file, functional: ids })).default([]),
});
export type Registry = z.infer<typeof RegistrySchema>;

export const PERMISSION_ACTIONS = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'] as const;
export const ACTION_LABELS: Record<(typeof PERMISSION_ACTIONS)[number], string> = {
  VIEW: 'Xem',
  CREATE: 'Tạo',
  UPDATE: 'Sửa',
  DELETE: 'Xóa',
  APPROVE: 'Duyệt',
  EXPORT: 'Xuất',
};
const SCOPES = ['own', 'team', 'branch', 'all'] as const;
const SCOPE_LABELS: Record<(typeof SCOPES)[number], string> = { own: 'Của mình', team: 'Nhóm', branch: 'Chi nhánh', all: 'Toàn bộ' };

export const PermissionsSchema = z.object({
  /** Tài nguyên = chức năng / đối tượng được phân quyền. Mã dạng <MODULE>.<ĐỐI_TƯỢNG>, ví dụ SALES.ORDER */
  resources: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Z0-9]{2,8}\.[A-Z0-9_]{2,30}$/, 'Mã tài nguyên dạng SALES.ORDER'),
        name: z.string().min(1),
        module: z.string(),
      }),
    )
    .min(1),
  /** matrix[ROLE-01][SALES.ORDER] = ["VIEW","CREATE"] */
  matrix: z.record(z.string(), z.record(z.string(), z.array(z.enum(PERMISSION_ACTIONS)))),
  /** Phạm vi dữ liệu: scope[ROLE-01][SALES.ORDER] = "own" | "team" | "branch" | "all" */
  scope: z.record(z.string(), z.record(z.string(), z.enum(SCOPES))).default({}),
  /** Màn hình mặc định sau đăng nhập (bổ sung ở bước giao diện) */
  defaultScreen: z.record(z.string(), z.string()).default({}),
  proposed: z.boolean().optional(),
});
export type Permissions = z.infer<typeof PermissionsSchema>;

// ---------- Đọc + kiểm tra ----------

export const REGISTRY_FILE = '_registry.json';
export const PERMISSIONS_FILE = '_permissions.json';

async function readJson(file: string): Promise<unknown> {
  const raw = (await fs.readFile(file, 'utf8')).replace(/^﻿/, '').trim();
  return JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''));
}

const zodErrors = (e: z.ZodError, file: string) =>
  e.issues.slice(0, 20).map((i) => `${file} › ${i.path.join('.') || '(gốc)'}: ${i.message}`);

export interface RegistryCheck {
  ok: boolean;
  errors: string[];
  registry?: Registry;
  permissions?: Permissions;
}

/**
 * Kiểm tra _registry.json và _permissions.json: đúng schema, mã không trùng, tham chiếu tồn tại,
 * phần <MODULE> của mã khớp module đã đăng ký, file được nhắc có thật trong srs/.
 * `phase === 'ui'` thì bắt buộc có màn hình.
 */
export async function checkRegistry(srs: string, phase: 'business' | 'ui'): Promise<RegistryCheck> {
  const errors: string[] = [];
  const regFile = path.join(srs, REGISTRY_FILE);
  const permFile = path.join(srs, PERMISSIONS_FILE);
  if (!existsSync(regFile)) return { ok: false, errors: [`Thiếu file srs/${REGISTRY_FILE}`] };
  if (!existsSync(permFile)) errors.push(`Thiếu file srs/${PERMISSIONS_FILE}`);

  let registry: Registry | undefined;
  try {
    const r = RegistrySchema.safeParse(await readJson(regFile));
    if (r.success) registry = r.data;
    else errors.push(...zodErrors(r.error, REGISTRY_FILE));
  } catch (e) {
    errors.push(`${REGISTRY_FILE} không phải JSON hợp lệ: ${(e as Error).message}`);
  }
  let permissions: Permissions | undefined;
  if (existsSync(permFile)) {
    try {
      const r = PermissionsSchema.safeParse(await readJson(permFile));
      if (r.success) permissions = r.data;
      else errors.push(...zodErrors(r.error, PERMISSIONS_FILE));
    } catch (e) {
      errors.push(`${PERMISSIONS_FILE} không phải JSON hợp lệ: ${(e as Error).message}`);
    }
  }
  if (!registry) return { ok: false, errors };

  const R = registry;
  const all = new Map<string, string>();
  const kinds: [string, { id: string }[]][] = [
    ['roles', R.roles],
    ['modules', R.modules],
    ['businessRules', R.businessRules],
    ['userStories', R.userStories],
    ['useCases', R.useCases],
    ['functional', R.functional],
    ['nonFunctional', R.nonFunctional],
    ['entities', R.entities],
    ['documents', R.documents],
    ['screens', R.screens],
    ['testCases', R.testCases],
  ];
  for (const [kind, list] of kinds)
    for (const x of list) {
      if (all.has(x.id)) errors.push(`Trùng mã ${x.id} (${all.get(x.id)} và ${kind})`);
      all.set(x.id, kind);
    }

  const moduleCodes = new Set(R.modules.map((m) => m.id.slice('MOD-'.length)));
  const has = (kind: string, id: string) => all.get(id) === kind;
  const refs = (owner: string, kind: string, list: string[], label: string) => {
    for (const id of list) if (!has(kind, id)) errors.push(`${owner}: ${label} "${id}" không có trong registry`);
  };
  const moduleOf = (id: string) => id.split('-')[1];
  const checkModule = (id: string) => {
    if (!moduleCodes.has(moduleOf(id))) errors.push(`${id}: module "${moduleOf(id)}" chưa đăng ký trong modules (cần MOD-${moduleOf(id)})`);
  };

  for (const x of [...R.businessRules, ...R.userStories, ...R.useCases, ...R.functional, ...R.screens, ...R.testCases]) checkModule(x.id);
  for (const d of R.documents) checkModule(d.id);
  for (const us of R.userStories) {
    refs(us.id, 'roles', [us.role], 'vai trò');
    refs(us.id, 'businessRules', us.businessRules, 'BR');
  }
  for (const uc of R.useCases) {
    refs(uc.id, 'roles', uc.actors, 'tác nhân');
    refs(uc.id, 'userStories', uc.userStories, 'US');
  }
  for (const fr of R.functional) {
    refs(fr.id, 'useCases', fr.useCases, 'UC');
    refs(fr.id, 'businessRules', fr.businessRules, 'BR');
  }
  for (const s of R.screens) {
    refs(s.id, 'functional', s.functional, 'FR');
    refs(s.id, 'roles', s.roles, 'vai trò');
  }
  for (const tc of R.testCases) refs(tc.id, 'functional', tc.functional, 'FR');
  for (const e of R.entities) if (e.module && !has('modules', e.module)) errors.push(`${e.id}: module "${e.module}" không có trong registry`);
  for (const d of R.documents) {
    if (d.entity && !has('entities', d.entity)) errors.push(`${d.id}: thực thể "${d.entity}" không có trong registry`);
    const states = new Set(d.states.map((s) => s.id));
    if (!d.states.some((s) => s.initial)) errors.push(`${d.id}: chưa đánh dấu trạng thái đầu (initial: true)`);
    for (const t of d.transitions) {
      if (!states.has(t.from)) errors.push(`${d.id}: chuyển trạng thái từ "${t.from}" không có trong states`);
      if (!states.has(t.to)) errors.push(`${d.id}: chuyển trạng thái tới "${t.to}" không có trong states`);
      refs(`${d.id} (${t.event})`, 'roles', t.roles, 'vai trò');
    }
  }
  if (phase === 'ui' && R.screens.length === 0) errors.push('Bước giao diện: registry chưa có màn hình nào (screens)');

  // File được nhắc phải tồn tại trong srs/
  const files = new Set<string>();
  for (const [, list] of kinds) for (const x of list as { file?: string }[]) if (x.file) files.add(x.file.split('#')[0]);
  for (const f of files) {
    if (path.isAbsolute(f) || f.includes('..')) errors.push(`Đường dẫn file "${f}" phải là đường dẫn tương đối trong srs/`);
    else if (!existsSync(path.join(srs, f))) errors.push(`File "${f}" được nhắc trong registry nhưng không có trong srs/`);
  }

  if (permissions) {
    const P = permissions;
    const resources = new Set(P.resources.map((r) => r.id));
    for (const r of P.resources) if (!has('modules', r.module)) errors.push(`${PERMISSIONS_FILE}: tài nguyên ${r.id} trỏ tới module "${r.module}" không có`);
    for (const [role, row] of Object.entries(P.matrix)) {
      if (!has('roles', role)) errors.push(`${PERMISSIONS_FILE}: vai trò "${role}" trong matrix không có trong registry`);
      for (const res of Object.keys(row)) if (!resources.has(res)) errors.push(`${PERMISSIONS_FILE}: matrix[${role}] dùng tài nguyên "${res}" chưa khai báo trong resources`);
    }
    for (const role of R.roles.map((r) => r.id)) if (!P.matrix[role]) errors.push(`${PERMISSIONS_FILE}: vai trò ${role} chưa có dòng nào trong matrix`);
    for (const [role, row] of Object.entries(P.scope))
      for (const res of Object.keys(row)) if (!resources.has(res)) errors.push(`${PERMISSIONS_FILE}: scope[${role}] dùng tài nguyên "${res}" chưa khai báo`);
    for (const [role, scr] of Object.entries(P.defaultScreen)) {
      if (!has('roles', role)) errors.push(`${PERMISSIONS_FILE}: defaultScreen có vai trò "${role}" không tồn tại`);
      if (!has('screens', scr)) errors.push(`${PERMISSIONS_FILE}: defaultScreen[${role}] = "${scr}" không phải màn hình trong registry`);
    }
    for (const d of R.documents)
      for (const t of d.transitions) {
        if (!t.permission) continue;
        const res = t.permission.split('.').slice(0, 2).join('.');
        if (!resources.has(res)) errors.push(`${d.id} (${t.event}): quyền "${t.permission}" dùng tài nguyên "${res}" chưa khai báo`);
      }
  }

  return { ok: errors.length === 0, errors, registry, permissions };
}

// ---------- Sinh Phần 12 ----------

const AUTO_NOTE = '> Phần này **do tool sinh tự động** từ `srs/_registry.json` sau mỗi lần tạo / cập nhật SRS. Không sửa tay — sửa registry hoặc file SRS nguồn rồi chạy lại.';

const cell = (list: string[]) => (list.length ? list.join(', ') : '—');
const uniq = (list: string[]) => [...new Set(list)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const pct = (n: number, d: number) => (d === 0 ? '—' : `${Math.round((n / d) * 100)}%`);
const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Bản đồ quan hệ ngược: FR → TC, FR → SCR, UC → FR, US → UC, BR → US/FR. */
export function traceIndex(R: Registry) {
  const push = (m: Map<string, string[]>, k: string, v: string) => m.set(k, [...(m.get(k) ?? []), v]);
  const frToTc = new Map<string, string[]>();
  const frToScr = new Map<string, string[]>();
  const ucToFr = new Map<string, string[]>();
  const usToUc = new Map<string, string[]>();
  const brToUs = new Map<string, string[]>();
  const brToFr = new Map<string, string[]>();
  for (const tc of R.testCases) for (const fr of tc.functional) push(frToTc, fr, tc.id);
  for (const s of R.screens) for (const fr of s.functional) push(frToScr, fr, s.id);
  for (const fr of R.functional) {
    for (const uc of fr.useCases) push(ucToFr, uc, fr.id);
    for (const br of fr.businessRules) push(brToFr, br, fr.id);
  }
  for (const uc of R.useCases) for (const us of uc.userStories) push(usToUc, us, uc.id);
  for (const us of R.userStories) for (const br of us.businessRules) push(brToUs, br, us.id);
  return { frToTc, frToScr, ucToFr, usToUc, brToUs, brToFr };
}

export function renderTraceability(R: Registry, opts: { uiDone: boolean }): string {
  const ix = traceIndex(R);
  const uc = new Map(R.useCases.map((u) => [u.id, u]));
  const get = (m: Map<string, string[]>, k: string) => uniq(m.get(k) ?? []);
  const L: string[] = [];
  L.push('# PHẦN 12. REQUIREMENTS TRACEABILITY — TRUY VẾT YÊU CẦU', '', AUTO_NOTE, '');

  L.push('## 12.1. Requirement ID Convention — Quy ước mã yêu cầu', '');
  L.push('Mã có dạng `<LOẠI>-<MODULE>-<SỐ 3 chữ số>`, ví dụ `FR-SALES-001`. Mã đã cấp không đổi, không dùng lại.', '');
  L.push('| Tiền tố | Ý nghĩa | Số lượng |', '|---|---|---|');
  const prefixes: [string, string, number][] = [
    ['ROLE-', 'Vai trò người dùng', R.roles.length],
    ['MOD-', 'Module', R.modules.length],
    ['BR-', 'Quy tắc nghiệp vụ', R.businessRules.length],
    ['US-', 'User Story', R.userStories.length],
    ['UC-', 'Ca sử dụng (Use Case)', R.useCases.length],
    ['FR-', 'Yêu cầu chức năng', R.functional.length],
    ['NFR-', 'Yêu cầu phi chức năng (theo nhóm: PERF, SEC, USAB…)', R.nonFunctional.length],
    ['ENT-', 'Thực thể dữ liệu', R.entities.length],
    ['DOC-', 'Chứng từ có vòng đời trạng thái', R.documents.length],
    ['SCR-', 'Màn hình', R.screens.length],
    ['TC-', 'Test case', R.testCases.length],
  ];
  for (const [p, m, n] of prefixes) L.push(`| \`${p}\` | ${m} | ${n} |`);
  L.push('', '| Mã module | Module | File |', '|---|---|---|');
  for (const m of R.modules) L.push(`| \`${m.id.slice(4)}\` | ${esc(m.name)}${m.proposed ? ' [ĐỀ XUẤT]' : ''} | ${m.file} |`);
  L.push('');

  L.push('## 12.2. Requirements Traceability Matrix (RTM) — Ma trận truy vết', '');
  L.push('Mỗi dòng là một yêu cầu chức năng (FR) và các mục liên quan.', '');
  L.push(`| BR | US | UC | FR | TC |${opts.uiDone ? ' SCR |' : ''}`, `|---|---|---|---|---|${opts.uiDone ? '---|' : ''}`);
  for (const fr of R.functional) {
    const ucs = fr.useCases;
    const uss = uniq(ucs.flatMap((u) => uc.get(u)?.userStories ?? []));
    const brs = uniq([...fr.businessRules, ...uss.flatMap((u) => R.userStories.find((x) => x.id === u)?.businessRules ?? [])]);
    const row = [cell(brs), cell(uss), cell(ucs), `**${fr.id}** ${esc(fr.summary)}`, cell(get(ix.frToTc, fr.id))];
    if (opts.uiDone) row.push(cell(get(ix.frToScr, fr.id)));
    L.push(`| ${row.join(' | ')} |`);
  }
  if (!opts.uiDone) L.push('', '_Cột màn hình (SCR) được thêm sau bước giao diện._');
  L.push('');

  const twoCol = (title: string, head: [string, string], rows: [string, string[]][]) => {
    L.push(title, '', `| ${head[0]} | ${head[1]} |`, '|---|---|');
    for (const [k, v] of rows) L.push(`| ${k} | ${cell(v)} |`);
    L.push('');
  };
  twoCol('## 12.3. Business Requirements to User Stories', ['BR', 'User Story'], R.businessRules.map((b) => [`**${b.id}** ${esc(b.summary)}`, get(ix.brToUs, b.id)]));
  twoCol('## 12.4. User Stories to Use Cases', ['User Story', 'Use Case'], R.userStories.map((u) => [`**${u.id}** ${esc(u.summary)}`, get(ix.usToUc, u.id)]));
  twoCol('## 12.5. Use Cases to Functional Requirements', ['Use Case', 'FR'], R.useCases.map((u) => [`**${u.id}** ${esc(u.summary)}`, get(ix.ucToFr, u.id)]));
  twoCol('## 12.6. Functional Requirements to Test Cases', ['FR', 'Test case'], R.functional.map((f) => [`**${f.id}** ${esc(f.summary)}`, get(ix.frToTc, f.id)]));

  L.push('## 12.7. Change Impact Analysis — Phân tích ảnh hưởng thay đổi', '');
  L.push('Khi thay đổi một quy tắc nghiệp vụ, cần rà lại các mục bên phải.', '');
  L.push(`| BR thay đổi | FR bị ảnh hưởng | TC cần chạy lại |${opts.uiDone ? ' Màn hình |' : ''}`, `|---|---|---|${opts.uiDone ? '---|' : ''}`);
  for (const b of R.businessRules) {
    const viaUs = get(ix.brToUs, b.id).flatMap((u) => get(ix.usToUc, u)).flatMap((u) => get(ix.ucToFr, u));
    const frs = uniq([...get(ix.brToFr, b.id), ...viaUs]);
    const row = [b.id, cell(frs), cell(uniq(frs.flatMap((f) => get(ix.frToTc, f))))];
    if (opts.uiDone) row.push(cell(uniq(frs.flatMap((f) => get(ix.frToScr, f)))));
    L.push(`| ${row.join(' | ')} |`);
  }
  L.push('');

  L.push('## 12.8. Coverage and Completeness — Độ bao phủ yêu cầu', '');
  const frNoUc = R.functional.filter((f) => f.useCases.length === 0).map((f) => f.id);
  const frNoTc = R.functional.filter((f) => !ix.frToTc.has(f.id)).map((f) => f.id);
  const frNoScr = R.functional.filter((f) => !ix.frToScr.has(f.id)).map((f) => f.id);
  const ucNoFr = R.useCases.filter((u) => !ix.ucToFr.has(u.id)).map((u) => u.id);
  const scrNoFr = R.screens.filter((s) => s.functional.length === 0).map((s) => s.id);
  const nFr = R.functional.length;
  L.push('| Chỉ số | Kết quả | Còn thiếu |', '|---|---|---|');
  L.push(`| FR có Use Case | ${pct(nFr - frNoUc.length, nFr)} | ${cell(frNoUc)} |`);
  L.push(`| FR có Test case | ${pct(nFr - frNoTc.length, nFr)} | ${cell(frNoTc)} |`);
  L.push(`| Use Case có FR | ${pct(R.useCases.length - ucNoFr.length, R.useCases.length)} | ${cell(ucNoFr)} |`);
  if (opts.uiDone) {
    L.push(`| FR có màn hình | ${pct(nFr - frNoScr.length, nFr)} | ${cell(frNoScr)} |`);
    L.push(`| Màn hình gắn FR | ${pct(R.screens.length - scrNoFr.length, R.screens.length)} | ${cell(scrNoFr)} |`);
  }
  const proposedCount = [...R.modules, ...R.functional, ...R.businessRules, ...R.userStories, ...R.useCases, ...R.nonFunctional, ...R.screens].filter(
    (x) => (x as { proposed?: boolean }).proposed,
  ).length;
  L.push('', `Số mục còn ở trạng thái [ĐỀ XUẤT] (chưa được khách xác nhận): **${proposedCount}**.`, '');
  return L.join('\n');
}

// ---------- Sinh bảng 4.2 (RBAC) ----------

const RBAC_BEGIN = '<!-- AUTO:RBAC — tool sinh từ srs/_permissions.json, không sửa tay -->';
const RBAC_END = '<!-- /AUTO:RBAC -->';

export function renderRbac(R: Registry, P: Permissions): string {
  const L: string[] = [RBAC_BEGIN, ''];
  L.push('Quyền: **X** Xem · **T** Tạo · **S** Sửa · **Xo** Xóa · **D** Duyệt · **Xu** Xuất. Phạm vi dữ liệu ghi trong ngoặc khi khác "Toàn bộ".', '');
  const short: Record<string, string> = { VIEW: 'X', CREATE: 'T', UPDATE: 'S', DELETE: 'Xo', APPROVE: 'D', EXPORT: 'Xu' };
  const roles = R.roles;
  L.push(`| Chức năng | ${roles.map((r) => esc(r.name)).join(' | ')} |`, `|---|${roles.map(() => '---').join('|')}|`);
  for (const res of P.resources) {
    const cells = roles.map((r) => {
      const acts = P.matrix[r.id]?.[res.id] ?? [];
      if (!acts.length) return '—';
      const sc = P.scope[r.id]?.[res.id];
      return acts.map((a) => short[a]).join(' ') + (sc && sc !== 'all' ? ` (${SCOPE_LABELS[sc]})` : '');
    });
    L.push(`| ${esc(res.name)} \`${res.id}\` | ${cells.join(' | ')} |`);
  }
  if (P.proposed) L.push('', '[ĐỀ XUẤT] Ma trận này có phần do AI đề xuất — cần khách xác nhận.');
  L.push('', RBAC_END);
  return L.join('\n');
}

/** Thay khối RBAC trong 04-user-requirements.md; chưa có khối thì chèn ngay dưới tiêu đề 4.2. */
export function injectRbac(md: string, block: string): string {
  const start = md.indexOf('<!-- AUTO:RBAC');
  const end = md.indexOf(RBAC_END);
  if (start >= 0 && end > start) return md.slice(0, start) + block + md.slice(end + RBAC_END.length);
  const heading = /^##\s*4\.2\b.*$/m.exec(md);
  if (!heading) return `${md.trimEnd()}\n\n## 4.2. User Roles and Permissions — Vai trò và quyền hạn\n\n${block}\n`;
  const at = heading.index + heading[0].length;
  return `${md.slice(0, at)}\n\n${block}\n${md.slice(at)}`;
}

/** Sinh 12-traceability.md và khối RBAC trong 04 từ registry đã hợp lệ. Trả về danh sách file đã ghi. */
export async function writeGenerated(srs: string, check: RegistryCheck, opts: { uiDone: boolean }): Promise<string[]> {
  const written: string[] = [];
  if (!check.registry) return written;
  await fs.writeFile(path.join(srs, '12-traceability.md'), renderTraceability(check.registry, opts), 'utf8');
  written.push('12-traceability.md');
  const userReq = path.join(srs, '04-user-requirements.md');
  if (check.permissions && existsSync(userReq)) {
    const md = await fs.readFile(userReq, 'utf8');
    const next = injectRbac(md, renderRbac(check.registry, check.permissions));
    if (next !== md) {
      await fs.writeFile(userReq, next, 'utf8');
      written.push('04-user-requirements.md');
    }
  }
  return written;
}
