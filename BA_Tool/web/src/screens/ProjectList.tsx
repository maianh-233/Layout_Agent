// Màn hình 0 — Danh sách dự án.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner } from '../components/ConfirmDialog';
import {
  PROJECT_TYPE_OPTIONS,
  SCREEN_LABELS,
  STEP_LABELS,
  projectTypeLabel,
  stepOf,
  type Project,
  type ProjectType,
} from '../types';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function ProjectList({ onOpen }: { onOpen: (slug: string) => void }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.listProjects().then(setProjects).catch((e: Error) => setError(e.message));
  useEffect(() => void load(), []);

  const create = async () => {
    if (!type) return;
    setBusy(true);
    try {
      const p = await api.createProject(name, type);
      onOpen(p.slug);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dự án của bạn</h1>
          <p className="mt-1 text-muted">Mỗi dự án đi qua 4 bước: nghiệp vụ → giao diện → dựng prototype → hoàn tất.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
          + Tạo dự án mới
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorBanner message={error} onClose={() => setError('')} />
        </div>
      )}

      {creating && (
        <form
          className="mt-6 space-y-4 rounded-2xl border border-brand/30 bg-brand-soft/40 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && type) void create();
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="pname">
              Tên dự án
            </label>
            <input
              id="pname"
              autoFocus
              className="input"
              placeholder="Ví dụ: Website shop thời trang Linh Anh, ERP Công ty VLXD Hòa Phát"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Loại dự án</legend>
            <p className="mb-2 text-xs text-muted">Quyết định số lượng và chủ đề câu hỏi nghiệp vụ. Không đổi được sau khi tạo.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROJECT_TYPE_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={[
                    'flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition',
                    type === o.value ? 'border-brand ring-1 ring-brand' : 'border-line hover:border-stone-300',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="ptype"
                    className="mt-1 size-4 accent-brand"
                    checked={type === o.value}
                    onChange={() => setType(o.value)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-muted">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3">
            <button className="btn-primary" disabled={!name.trim() || !type || busy}>
              {busy ? 'Đang tạo…' : 'Tạo dự án'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {projects === null ? (
          <p className="text-muted">Đang tải…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <p className="font-medium">Chưa có dự án nào.</p>
            <p className="mt-1 text-sm text-muted">Bấm “Tạo dự án mới” để bắt đầu thu thập yêu cầu cho khách hàng.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {projects.map((p) => {
              const step = stepOf(p.screen);
              return (
                <li key={p.slug} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      <span className="font-medium text-stone-600">{projectTypeLabel(p.projectType)}</span> · Tạo lúc {fmtDate(p.createdAt)} · Cập nhật {fmtDate(p.updatedAt)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="rounded-full bg-brand-soft px-3 py-1 font-medium text-brand-dark">
                      Bước {step + 1}: {STEP_LABELS[step]}
                    </span>
                    <span className="ml-2 text-muted">{SCREEN_LABELS[p.screen]}</span>
                    {p.job?.status === 'running' && <span className="ml-2 text-amber-700">· AI đang chạy</span>}
                    {p.job?.status === 'error' && <span className="ml-2 text-red-700">· Lỗi lần chạy trước</span>}
                  </div>
                  <button type="button" className="btn-outline" onClick={() => onOpen(p.slug)}>
                    Mở tiếp →
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
