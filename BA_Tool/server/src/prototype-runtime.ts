// Phần "xử lý giả" phải khớp SRS nên do code sinh (AI chỉ dùng):
//   assets/js/permissions.js — vai trò, ma trận quyền, màn hình được vào, màn hình mặc định (từ _permissions.json + registry)
//   assets/js/workflows.js   — vòng đời chứng từ (documents trong registry): nút theo trạng thái, chuyển trạng thái, lịch sử
//   assets/js/demo-store.js  — lưu thay đổi của bản demo (localStorage, bọc try/catch) + đặt lại dữ liệu demo
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { checkRegistry, type Permissions, type Registry } from './registry.js';

/** JSON chỉ gồm ký tự ASCII (tiếng Việt thành \uXXXX) — đọc đúng kể cả khi trang thiếu <meta charset>. */
const ascii = (v: unknown, space?: number) =>
  JSON.stringify(v, null, space).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const HEADER = '/* Sinh tự động bởi SRS & Prototype Builder từ srs/_registry.json + srs/_permissions.json — không sửa tay. */\n';

export interface ScreenMeta {
  id: string;
  name: string;
  module: string;
  /** Đường dẫn trang trong prototype, tính từ gốc, ví dụ pages/sales/orders.html */
  path: string;
  roles: string[];
}

/** Lấy "File prototype" trong đặc tả màn hình; không có thì theo quy ước pages/<module>/<slug>.html. */
export async function screenPaths(srs: string, R: Registry): Promise<ScreenMeta[]> {
  const out: ScreenMeta[] = [];
  for (const s of R.screens) {
    const module = s.id.split('-')[1];
    const specRel = s.file.split('#')[0];
    const slug = path.basename(specRel, '.md');
    let p = `pages/${module.toLowerCase()}/${slug}.html`;
    const spec = path.join(srs, specRel);
    if (existsSync(spec)) {
      const m = /\|\s*File prototype\s*\|\s*`?([^|`\s]+\.html)`?\s*\|/i.exec(await fs.readFile(spec, 'utf8'));
      if (m) p = m[1].replace(/^\.?\//, '');
    }
    out.push({ id: s.id, name: s.name, module, path: p, roles: s.roles });
  }
  return out;
}

export function renderPermissionsJs(appName: string, R: Registry, P: Permissions, screens: ScreenMeta[]): string {
  const byId = new Map(screens.map((s) => [s.id, s.path]));
  const meta = {
    appName,
    roles: R.roles.map((r) => ({ id: r.id, name: r.name })),
    resources: P.resources,
    matrix: P.matrix,
    scope: P.scope,
    defaultScreen: Object.fromEntries(Object.entries(P.defaultScreen).map(([role, scr]) => [role, byId.get(scr) ?? null])),
    screens,
  };
  return (
    HEADER +
    `// API: Perm.role(), Perm.setRole(id), Perm.can('SALES.ORDER.APPROVE'), Perm.scope('SALES.ORDER'),
//      Perm.canOpen(screenId), Perm.home(roleId?), Perm.url(path), Perm.guard(), Perm.apply(root)
// Phần tử có data-permission="SALES.ORDER.APPROVE" tự bị gỡ nếu vai trò hiện tại không có quyền
// (data-permission-mode="disable" để chỉ làm mờ). Áp dụng cả cho phần tử render sau (MutationObserver).
(function () {
  var META = (window.APP_META = ${ascii(meta, 2)});
  var MSG = ${ascii({ noPerm: 'Bạn không có quyền thực hiện thao tác này' })};
  var KEY = 'demo.role';
  var memory = null;
  // Gốc prototype tính từ vị trí file này (assets/js/permissions.js) — chạy được cả qua file://
  var src = (document.currentScript && document.currentScript.src) || '';
  var ROOT = src.replace(/assets\\/js\\/permissions\\.js(\\?.*)?$/, '');

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return memory; } }
  function write(v) { memory = v; try { if (v === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {} }
  function screenOf(id) { for (var i = 0; i < META.screens.length; i++) if (META.screens[i].id === id) return META.screens[i]; return null; }

  var Perm = {
    meta: META,
    root: ROOT,
    /** Vai trò đang đăng nhập (null nếu chưa chọn) */
    role: function () { var r = read(); return META.roles.some(function (x) { return x.id === r; }) ? r : null; },
    roleName: function (id) { id = id || Perm.role(); for (var i = 0; i < META.roles.length; i++) if (META.roles[i].id === id) return META.roles[i].name; return ''; },
    setRole: function (id) { write(id); },
    logout: function () { write(null); location.href = ROOT + 'index.html'; },
    /** code dạng MODULE.RESOURCE.ACTION, ví dụ SALES.ORDER.APPROVE */
    can: function (code, roleId) {
      roleId = roleId || Perm.role();
      if (!roleId || !code) return false;
      var parts = String(code).split('.');
      var action = parts.pop();
      var resource = parts.join('.');
      var acts = (META.matrix[roleId] || {})[resource] || [];
      return acts.indexOf(action) >= 0;
    },
    /** Phạm vi dữ liệu: own | team | branch | all */
    scope: function (resource, roleId) { roleId = roleId || Perm.role(); return ((META.scope[roleId] || {})[resource]) || 'all'; },
    canOpen: function (screenId, roleId) {
      roleId = roleId || Perm.role();
      var s = screenOf(screenId);
      return !s || !s.roles.length || s.roles.indexOf(roleId) >= 0;
    },
    /** Màn hình mặc định sau đăng nhập của vai trò (URL đầy đủ) */
    home: function (roleId) {
      roleId = roleId || Perm.role();
      var p = META.defaultScreen[roleId];
      if (!p) for (var i = 0; i < META.screens.length; i++) if (Perm.canOpen(META.screens[i].id, roleId) && META.screens[i].path !== 'index.html') { p = META.screens[i].path; break; }
      return ROOT + (p || 'index.html');
    },
    url: function (p) { return ROOT + String(p).replace(/^\\//, ''); },
    screen: screenOf,
    /** Trang hiện tại có được vào không (theo body[data-screen]). Chưa chọn vai trò → về trang đăng nhập. */
    guard: function () {
      var id = document.body && document.body.getAttribute('data-screen');
      if (!Perm.role()) { if (!/index\\.html$|\\/$/.test(location.pathname)) location.href = ROOT + 'index.html'; return false; }
      return !id || Perm.canOpen(id);
    },
    apply: function (root) {
      var nodes = (root || document).querySelectorAll ? (root || document).querySelectorAll('[data-permission]') : [];
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (Perm.can(el.getAttribute('data-permission'))) continue;
        if (el.getAttribute('data-permission-mode') === 'disable') { el.setAttribute('disabled', ''); el.setAttribute('aria-disabled', 'true'); el.title = MSG.noPerm; }
        else el.remove();
      }
    }
  };
  window.Perm = Perm;

  function start() {
    Perm.apply(document);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++)
        for (var j = 0; j < list[i].addedNodes.length; j++) {
          var n = list[i].addedNodes[j];
          if (n.nodeType !== 1) continue;
          if (n.hasAttribute('data-permission')) Perm.apply(n.parentNode); else Perm.apply(n);
        }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
`
  );
}

export function renderWorkflowsJs(R: Registry): string {
  const docs = Object.fromEntries(
    R.documents.map((d) => [
      d.id,
      {
        name: d.name,
        numbering: d.numbering ?? null,
        states: Object.fromEntries(d.states.map((s) => [s.id, { name: s.name, tone: s.tone, initial: Boolean(s.initial), final: Boolean(s.final) }])),
        transitions: d.transitions,
      },
    ]),
  );
  return (
    HEADER +
    `// Vòng đời chứng từ đúng như 5.6 của SRS. API:
//   Workflow.initial(docId) → mã trạng thái đầu
//   Workflow.state(docId, stateId) → { name, tone, initial, final }
//   Workflow.actions(docId, stateId) → các chuyển trạng thái vai trò hiện tại được làm (theo roles + permission)
//   Workflow.apply(docId, record, event, { note }) → bản ghi mới: state đổi, history thêm 1 dòng; ném lỗi nếu không hợp lệ
//   Workflow.nextCode(docId, existingCodes) → mã chứng từ mới theo quy tắc đánh mã, ví dụ DH-2026-00042
// Bản ghi chứng từ dùng trường: code, state, history: [{ at, role, roleName, event, from, to, note }]
(function () {
  var DOCS = (window.WORKFLOWS = ${ascii(docs, 2)});
  var MSG = ${ascii({
    noDoc: 'Không có chứng từ ',
    cannot: 'Không thể "{event}" khi chứng từ đang ở trạng thái "{state}"',
    denied: 'Vai trò hiện tại không được "{event}"',
  })};

  function doc(id) { var d = DOCS[id]; if (!d) throw new Error(MSG.noDoc + id); return d; }
  function role() { return window.Perm ? Perm.role() : null; }
  function allowed(t) {
    var r = role();
    if (t.roles && t.roles.length && t.roles.indexOf(r) < 0) return false;
    if (t.permission && window.Perm && !Perm.can(t.permission)) return false;
    return true;
  }

  window.Workflow = {
    docs: DOCS,
    initial: function (docId) {
      var s = doc(docId).states;
      for (var k in s) if (s[k].initial) return k;
      return Object.keys(s)[0];
    },
    state: function (docId, stateId) { return doc(docId).states[stateId] || { name: stateId, tone: 'neutral' }; },
    transitions: function (docId, stateId) { return doc(docId).transitions.filter(function (t) { return t.from === stateId; }); },
    actions: function (docId, stateId) { return Workflow.transitions(docId, stateId).filter(allowed); },
    apply: function (docId, record, event, opts) {
      var t = Workflow.transitions(docId, record.state).filter(function (x) { return x.event === event; })[0];
      if (!t) throw new Error(MSG.cannot.replace('{event}', event).replace('{state}', Workflow.state(docId, record.state).name));
      if (!allowed(t)) throw new Error(MSG.denied.replace('{event}', event));
      var entry = {
        at: new Date().toISOString(),
        role: role(),
        roleName: window.Perm ? Perm.roleName() : '',
        event: event,
        from: record.state,
        to: t.to,
        note: (opts && opts.note) || ''
      };
      var next = {};
      for (var k in record) next[k] = record[k];
      next.state = t.to;
      next.history = (record.history || []).concat([entry]);
      return next;
    },
    nextCode: function (docId, existing) {
      var pattern = doc(docId).numbering;
      if (!pattern) return null;
      var now = new Date();
      var base = pattern
        .replace('{YYYY}', String(now.getFullYear()))
        .replace('{YY}', String(now.getFullYear()).slice(-2))
        .replace('{MM}', ('0' + (now.getMonth() + 1)).slice(-2));
      var m = /\\{(0+)\\}/.exec(base);
      if (!m) return base;
      var prefix = base.slice(0, m.index);
      var max = 0;
      (existing || []).forEach(function (c) {
        if (String(c).indexOf(prefix) === 0) { var n = parseInt(String(c).slice(prefix.length), 10); if (n > max) max = n; }
      });
      return prefix + String(max + 1).padStart(m[1].length, '0') + base.slice(m.index + m[0].length);
    }
  };
})();
`
  );
}

export function renderDemoStoreJs(slug: string): string {
  return (
    HEADER +
    `// Dữ liệu giả: window.MOCK.<tên> = [...] khai báo trong assets/js/mock-data/*.js.
// Thay đổi khi trình diễn (tạo, sửa, duyệt…) lưu localStorage; lỗi / trình duyệt chặn thì giữ trong bộ nhớ.
// API: DemoStore.list(name), DemoStore.get(name, id), DemoStore.insert(name, row), DemoStore.update(name, id, patch | fn),
//      DemoStore.remove(name, id), DemoStore.reset() (Đặt lại dữ liệu demo), DemoStore.on(fn) (nghe thay đổi)
(function () {
  window.MOCK = window.MOCK || {};
  var PREFIX = 'demo.${slug}.';
  var memory = {};
  var listeners = [];
  function key(name) { return PREFIX + name; }
  function load(name) {
    if (memory[name]) return memory[name];
    var raw = null;
    try { raw = localStorage.getItem(key(name)); } catch (e) {}
    var rows;
    try { rows = raw ? JSON.parse(raw) : null; } catch (e) { rows = null; }
    if (!rows) rows = JSON.parse(JSON.stringify(window.MOCK[name] || []));
    memory[name] = rows;
    return rows;
  }
  function save(name, rows) {
    memory[name] = rows;
    try { localStorage.setItem(key(name), JSON.stringify(rows)); } catch (e) {}
    listeners.forEach(function (fn) { try { fn(name); } catch (e) {} });
  }
  window.DemoStore = {
    list: function (name) { return load(name).slice(); },
    get: function (name, id) { return load(name).filter(function (r) { return r.id === id; })[0] || null; },
    insert: function (name, row) { var rows = load(name).slice(); rows.unshift(row); save(name, rows); return row; },
    update: function (name, id, patch) {
      var rows = load(name).map(function (r) {
        if (r.id !== id) return r;
        if (typeof patch === 'function') return patch(r);
        var n = {}; for (var k in r) n[k] = r[k]; for (var p in patch) n[p] = patch[p]; return n;
      });
      save(name, rows);
      return window.DemoStore.get(name, id);
    },
    remove: function (name, id) { save(name, load(name).filter(function (r) { return r.id !== id; })); },
    reset: function () {
      memory = {};
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) localStorage.removeItem(k); }
      } catch (e) {}
      listeners.forEach(function (fn) { try { fn('*'); } catch (e) {} });
    },
    on: function (fn) { listeners.push(fn); }
  };
})();
`
  );
}

/** Ghi permissions.js, workflows.js, demo-store.js. Trả về danh sách file + màn hình (để kiểm trang thiếu). */
export async function writeRuntime(target: string, srs: string, appName: string, slug: string): Promise<{ files: string[]; screens: ScreenMeta[] }> {
  const check = await checkRegistry(srs, 'ui');
  if (!check.registry) throw new Error('srs/_registry.json chưa hợp lệ — mở tab Rà soát để sửa trước khi dựng prototype.');
  if (!check.permissions) throw new Error('srs/_permissions.json chưa hợp lệ — mở tab Rà soát để sửa trước khi dựng prototype.');
  const screens = await screenPaths(srs, check.registry);
  const files: [string, string][] = [
    ['assets/js/permissions.js', renderPermissionsJs(appName, check.registry, check.permissions, screens)],
    ['assets/js/workflows.js', renderWorkflowsJs(check.registry)],
    ['assets/js/demo-store.js', renderDemoStoreJs(slug)],
  ];
  for (const [rel, content] of files) {
    await fs.mkdir(path.dirname(path.join(target, rel)), { recursive: true });
    await fs.writeFile(path.join(target, rel), content, 'utf8');
  }
  return { files: files.map(([r]) => r), screens };
}
