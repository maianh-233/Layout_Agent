// Tab "Phiên bản" của màn hình SRS: chốt phiên bản, so sánh hai phiên bản, xuất gói gửi khách.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner } from '../components/ConfirmDialog';
import { DiffView } from '../components/DiffView';
import type { FileDiff, Project, VersionInfo } from '../types';

const nextId = (list: VersionInfo[]) => {
  if (!list.length) return 'v0.1';
  const [maj, min] = list[list.length - 1].id.slice(1).split('.').map(Number);
  return `v${maj}.${min + 1}`;
};
const label = (v: string) => (v === 'current' ? 'Hiện tại (chưa chốt)' : v);

export function VersionsPanel({ project, onProjectChange }: { project: Project; onProjectChange: (p: Project) => void }) {
  const [versions, setVersions] = useState<VersionInfo[] | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('current');
  const [diffs, setDiffs] = useState<FileDiff[] | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    api
      .listVersions(project.slug)
      .then((list) => {
        setVersions(list);
        setA((cur) => cur || list[list.length - 1]?.id || '');
      })
      .catch((e: Error) => setError(e.message));
  }, [project.slug, project.updatedAt]);

  const lock = async () => {
    setBusy(true);
    try {
      onProjectChange(await api.lockVersion(project.slug, note));
      setNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const compare = async () => {
    setComparing(true);
    setDiffs(null);
    try {
      setDiffs(await api.compareVersions(project.slug, a, b));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setComparing(false);
    }
  };

  if (!versions) return <p className="text-sm text-muted">Đang tải danh sách phiên bản…</p>;
  const options = ['current', ...versions.map((v) => v.id).reverse()];
  const exportHref = (v: string) => `/api/projects/${project.slug}/export.zip?version=${v}`;

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold">Chốt phiên bản</h2>
        <p className="mt-1 text-sm text-muted">
          Lưu bản chụp SRS hiện tại thành <b>{nextId(versions)}</b> và ghi vào mục 0.3 / 0.5 (lịch sử chỉnh sửa). Nên chốt trước khi gửi khách.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="vnote">Nội dung thay đổi</label>
          <input
            id="vnote"
            className="input min-w-0 flex-1"
            placeholder="Nội dung thay đổi, ví dụ: Bổ sung module Kho theo buổi họp 15/10"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" className="btn-primary" disabled={busy || project.job?.status === 'running'} onClick={() => void lock()}>
            {busy ? 'Đang chốt…' : `Chốt ${nextId(versions)}`}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="min-w-0 flex-1 font-semibold">Các phiên bản</h2>
          <a className="btn-outline" href={exportHref('current')} download>
            ⬇ Xuất gói gửi khách (bản hiện tại)
          </a>
        </div>
        <p className="mt-1 text-xs text-muted">Gói gửi khách chỉ gồm các file SRS (.md) — không có kết quả rà soát, registry, ghi chú BA.</p>
        {versions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Chưa chốt phiên bản nào.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {[...versions].reverse().map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-semibold text-brand-dark">{v.id}</span>
                <span className="text-muted">{v.createdAt ? new Date(v.createdAt).toLocaleString('vi-VN') : ''}</span>
                <span className="min-w-0 flex-1 truncate">{v.note || '—'}</span>
                <a className="text-brand-dark underline-offset-2 hover:underline" href={exportHref(v.id)} download>
                  Xuất gói gửi khách
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold">So sánh hai phiên bản</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <select className="input !w-auto min-w-48" value={a} onChange={(e) => setA(e.target.value)} aria-label="Phiên bản cũ">
            <option value="" disabled>Chọn phiên bản</option>
            {options.map((v) => (
              <option key={v} value={v}>{label(v)}</option>
            ))}
          </select>
          <span className="text-muted">→</span>
          <select className="input !w-auto min-w-48" value={b} onChange={(e) => setB(e.target.value)} aria-label="Phiên bản mới">
            {options.map((v) => (
              <option key={v} value={v}>{label(v)}</option>
            ))}
          </select>
          <button type="button" className="btn-outline" disabled={!a || a === b || comparing} onClick={() => void compare()}>
            {comparing ? 'Đang so sánh…' : 'So sánh'}
          </button>
        </div>
        {diffs && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-muted">
              {label(a)} → {label(b)}: {diffs.length} file thay đổi
            </p>
            <DiffView diffs={diffs} emptyText="Hai phiên bản giống nhau." />
          </div>
        )}
      </section>
    </div>
  );
}
