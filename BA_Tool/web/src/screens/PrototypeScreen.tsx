// Màn hình 5 — Chọn folder đích, dựng prototype, xem trước trong iframe.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { ConfirmDialog, ErrorBanner } from '../components/ConfirmDialog';
import { DevicePreview } from '../components/DevicePreview';
import { Markdown } from '../components/Markdown';
import type { DirListing, JobKind, Project } from '../types';
import { QaPanel } from './QaPanel';

interface Props {
  project: Project;
  onBuild: (dir: string) => Promise<void>;
  error: string;
  onClearError: () => void;
  /** Chạy QA / để AI sửa lỗi QA */
  onStartJob: (kind: JobKind) => Promise<void>;
}

export function PrototypeScreen({ project, onBuild, error, onClearError, onStartJob }: Props) {
  const built = project.screen === 'done' && project.prototype.dir;
  const [browsing, setBrowsing] = useState(!built);
  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onClose={onClearError} />}
      {built && !browsing ? (
        <Preview project={project} onRebuild={() => setBrowsing(true)} onStartJob={onStartJob} />
      ) : (
        <FolderPicker
          initial={project.prototype.dir}
          onCancel={built ? () => setBrowsing(false) : undefined}
          onBuild={async (dir) => {
            await onBuild(dir);
          }}
        />
      )}
    </div>
  );
}

function FolderPicker({ initial, onBuild, onCancel }: { initial: string | null; onBuild: (dir: string) => Promise<void>; onCancel?: () => void }) {
  const [listing, setListing] = useState<DirListing | null>(null);
  const [pathInput, setPathInput] = useState(initial ?? '');
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async (p?: string) => {
    setError('');
    try {
      const l = await api.listDir(p || undefined);
      setListing(l);
      setPathInput(l.path ?? '');
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => void load(initial ?? undefined), []);

  const createFolder = async () => {
    if (!listing?.path) return;
    try {
      const r = await api.mkdir(listing.path, newName);
      setNewName('');
      setShowNew(false);
      await load(r.path);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const start = async () => {
    setConfirm(false);
    if (!listing?.path) return;
    setBusy(true);
    try {
      const check = await api.checkDir(listing.path);
      if (!check.ok) throw new Error(check.error || 'Folder không ghi được');
      await onBuild(listing.path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const hasFiles = (listing?.fileCount ?? 0) > 0;

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b border-line p-5">
        <h2 className="text-lg font-semibold">Chọn folder để dựng prototype</h2>
        <p className="mt-1 text-sm text-muted">
          AI sẽ tạo các trang HTML + Tailwind + JavaScript thuần với dữ liệu giả vào folder này. Mở <code>index.html</code> là chạy.
        </p>
      </div>

      <div className="space-y-4 p-5">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load(pathInput);
          }}
        >
          <label htmlFor="dir" className="sr-only">
            Đường dẫn folder
          </label>
          <input id="dir" className="input font-mono text-sm" value={pathInput} onChange={(e) => setPathInput(e.target.value)} placeholder="D:\Prototypes\shop-thoi-trang" />
          <button className="btn-outline shrink-0">Đi tới</button>
        </form>

        {error && <ErrorBanner message={error} onClose={() => setError('')} />}

        <div className="rounded-xl border border-line">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-sm">
            <button
              type="button"
              className="btn-ghost px-2 py-1"
              disabled={listing?.parent === null || listing === null}
              onClick={() => void load(listing?.parent || undefined)}
            >
              ↑ Lên
            </button>
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-muted">{listing?.path ?? 'Ổ đĩa'}</span>
            {listing?.path && (
              <button type="button" className="btn-ghost px-2 py-1" onClick={() => setShowNew((s) => !s)}>
                + Tạo folder mới
              </button>
            )}
          </div>
          {showNew && (
            <form
              className="flex gap-2 border-b border-line bg-stone-50 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void createFolder();
              }}
            >
              <input autoFocus className="input py-1.5 text-sm" placeholder="Tên folder mới" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <button className="btn-primary py-1.5" disabled={!newName.trim()}>
                Tạo
              </button>
            </form>
          )}
          <ul className="max-h-72 overflow-y-auto py-1">
            {listing?.dirs.length === 0 && <li className="px-4 py-3 text-sm text-muted">(Không có folder con)</li>}
            {listing?.dirs.map((d) => (
              <li key={d.path}>
                <button type="button" className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm hover:bg-stone-50" onClick={() => void load(d.path)}>
                  <span aria-hidden>📁</span> {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {listing?.path && hasFiles && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            ⚠ Folder này đã có {listing.fileCount} mục. File trùng tên có thể bị ghi đè. Nên chọn hoặc tạo một folder trống.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className="min-w-0 flex-1 truncate text-sm">
            Folder đích: <b className="font-mono">{listing?.path ?? '— chưa chọn —'}</b>
          </span>
          {onCancel && (
            <button type="button" className="btn-ghost" onClick={onCancel}>
              Hủy
            </button>
          )}
          <button type="button" className="btn-primary" disabled={!listing?.path || busy} onClick={() => (hasFiles ? setConfirm(true) : void start())}>
            {busy ? 'Đang kiểm tra…' : 'Bắt đầu dựng'}
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirm} title="Folder không trống" confirmLabel="Vẫn dựng vào đây" onCancel={() => setConfirm(false)} onConfirm={() => void start()}>
        Folder <b className="font-mono">{listing?.path}</b> đã có {listing?.fileCount} mục. Các file trùng tên với prototype (ví dụ index.html) sẽ bị ghi đè. Tool không
        xóa file nào khác.
      </ConfirmDialog>
    </section>
  );
}

type View = 'preview' | 'qa' | 'handoff';

function Preview({ project, onRebuild, onStartJob }: { project: Project; onRebuild: () => void; onStartJob: (kind: JobKind) => Promise<void> }) {
  const pages = project.prototype.pages;
  const [page, setPage] = useState(pages.includes('index.html') ? 'index.html' : pages[0]);
  const bust = encodeURIComponent(project.prototype.builtAt ?? '');
  const url = `/preview/${project.slug}/${page}?v=${bust}`;
  // Dự án mới có QA tự động + HANDOFF.md
  const hasQa = Boolean(project.projectType);
  const [view, setView] = useState<View>('preview');
  const qaCount = project.qa ? project.qa.critical + project.qa.major + project.qa.minor : null;
  const openPage = (p: string) => {
    if (pages.includes(p)) setPage(p);
    setView('preview');
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="space-y-4 lg:w-64 lg:shrink-0">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">Prototype đã dựng xong 🎉</p>
          <p className="mt-1 break-all font-mono text-xs text-muted">{project.prototype.dir}</p>
          <div className="mt-3 flex flex-col gap-2">
            <a className="btn-primary" href={url} target="_blank" rel="noreferrer">
              Mở trong tab mới ↗
            </a>
            <a className="btn-outline" href={`/api/projects/${project.slug}/prototype.zip`} download>
              ⬇ Tải .zip
            </a>
            <button type="button" className="btn-outline" onClick={onRebuild}>
              Dựng lại / đổi folder
            </button>
          </div>
        </div>
        <nav className="rounded-2xl border border-line bg-white p-2 shadow-sm">
          <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase">Các trang ({pages.length})</p>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={['block w-full truncate rounded-lg px-2 py-1.5 text-left font-mono text-[13px]', p === page ? 'bg-brand-soft text-brand-dark' : 'hover:bg-stone-50'].join(' ')}
            >
              {p}
            </button>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 space-y-3">
      {hasQa && (
        <div role="tablist" className="flex gap-1 border-b border-line">
          {(
            [
              ['preview', 'Xem trước'],
              ['qa', `QA${qaCount !== null ? ` (${qaCount})` : ''}`],
              ['handoff', 'HANDOFF.md'],
            ] as [View, string][]
          ).map(([v, text]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={[
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
                view === v ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-stone-800',
                v === 'qa' && project.qa?.critical ? 'text-red-700' : '',
              ].join(' ')}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      {view === 'qa' && <QaPanel project={project} onStartJob={onStartJob} onOpenPage={openPage} />}
      {view === 'handoff' && <Handoff slug={project.slug} version={project.qa?.createdAt ?? bust} />}
      <div className={view === 'preview' ? '' : 'hidden'}>
        <DevicePreview url={url} label={page} />
      </div>
      </div>
    </div>
  );
}

/** HANDOFF.md do tool sinh sau QA — hiển thị như tài liệu. */
function Handoff({ slug, version }: { slug: string; version: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/preview/${slug}/HANDOFF.md?v=${encodeURIComponent(version)}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then(setText)
      .catch(() => setText(''));
  }, [slug, version]);
  if (text === null) return <p className="text-sm text-muted">Đang tải…</p>;
  if (!text) return <p className="text-sm text-muted">Chưa có HANDOFF.md — chạy QA để tool sinh tài liệu bàn giao.</p>;
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8">
      <Markdown source={text} />
    </article>
  );
}
