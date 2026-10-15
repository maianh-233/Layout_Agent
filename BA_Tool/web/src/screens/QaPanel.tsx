// Kết quả QA prototype (Playwright): lỗi theo mức, kiểm tra theo vai trò, ảnh chụp 3 kích thước.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner } from '../components/ConfirmDialog';
import { SEVERITY_LABELS, type JobKind, type Project, type QaReport, type Severity } from '../types';

const SEV_CLS: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800',
  major: 'bg-amber-100 text-amber-900',
  minor: 'bg-sky-100 text-sky-800',
};
const VP_LABEL = { mobile: 'Mobile 375', tablet: 'Tablet 768', desktop: 'Desktop 1440', wide: 'Màn rộng 1920' } as const;

interface Props {
  project: Project;
  onStartJob: (kind: JobKind) => Promise<void>;
  onOpenPage: (page: string) => void;
  /** Tác vụ "Để AI sửa": prototype-fix (luồng có SRS) hoặc quick-revise (chế độ nhanh) */
  fixKind?: JobKind;
}

export function QaPanel({ project, onStartJob, onOpenPage, fixKind = 'prototype-fix' }: Props) {
  const [report, setReport] = useState<QaReport | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [vp, setVp] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [zoom, setZoom] = useState<string | null>(null);

  useEffect(() => {
    api.getQa(project.slug).then(setReport).catch((e: Error) => setError(e.message));
  }, [project.slug, project.updatedAt]);

  const base = `/preview/${project.slug}/`;
  const bust = `?v=${encodeURIComponent(report?.createdAt ?? '')}`;
  const open = report?.issues ?? [];
  const count = (s: Severity) => open.filter((i) => i.severity === s).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Kiểm thử tự động (QA)</h2>
          <p className="text-sm text-muted">
            {report
              ? `Lần gần nhất: ${new Date(report.createdAt).toLocaleString('vi-VN')} · ${report.pages.length} trang × 3 kích thước`
              : project.qa?.error
                ? `QA chưa chạy được: ${project.qa.error}`
                : 'Chưa chạy QA.'}
          </p>
        </div>
        <button type="button" className="btn-outline" onClick={() => void onStartJob('prototype-qa')}>
          ↻ Chạy QA lại
        </button>
        <button type="button" className="btn-primary" disabled={!open.length} onClick={() => void onStartJob(fixKind)}>
          ✦ Để AI sửa các lỗi này
        </button>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}
      {report === undefined && <p className="text-sm text-muted">Đang tải…</p>}

      {report && (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            {(['critical', 'major', 'minor'] as Severity[]).map((s) => (
              <span key={s} className={`rounded-full px-3 py-1 font-medium ${SEV_CLS[s]}`}>
                {SEVERITY_LABELS[s]} · {count(s)}
              </span>
            ))}
            <a className="ml-auto text-sm text-brand-dark underline-offset-2 hover:underline" href={`${base}_qa-report.md${bust}`} target="_blank" rel="noreferrer">
              Mở _qa-report.md ↗
            </a>
          </div>

          {open.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">Không phát hiện lỗi nào. 🎉</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-xs text-muted uppercase">
                  <tr>
                    <th className="px-3 py-2">Mức</th>
                    <th className="px-3 py-2">Nhóm</th>
                    <th className="px-3 py-2">Trang</th>
                    <th className="px-3 py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {open.map((i) => (
                    <tr key={i.id} className="align-top">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEV_CLS[i.severity]}`}>{SEVERITY_LABELS[i.severity]}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{i.category}</td>
                      <td className="px-3 py-2">
                        {i.page ? (
                          <button type="button" className="font-mono text-xs text-brand-dark hover:underline" onClick={() => onOpenPage(i.page!)}>
                            {i.page}
                          </button>
                        ) : (
                          '—'
                        )}
                        {i.viewport && <span className="ml-1 text-xs text-muted">({VP_LABEL[i.viewport as keyof typeof VP_LABEL] ?? i.viewport})</span>}
                      </td>
                      <td className="px-3 py-2 break-words">{i.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.roles.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Kiểm tra theo vai trò</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {report.roles.map((r) => {
                  const bad = r.forbiddenInMenu.length > 0 || r.noPermissionPage?.ok === false;
                  return (
                    <div key={r.role} className={['rounded-xl border bg-white p-3 text-sm', bad ? 'border-red-200' : 'border-line'].join(' ')}>
                      <p className="font-semibold">
                        {bad ? '✕' : '✓'} {r.name}
                      </p>
                      <p className="text-xs text-muted">Mặc định: {r.home ?? '—'} · {r.menu.length} mục menu</p>
                      {r.forbiddenInMenu.length > 0 && <p className="mt-1 text-xs text-red-700">Thấy mục không được phép: {r.forbiddenInMenu.join(', ')}</p>}
                      {r.noPermissionPage && (
                        <p className={['mt-1 text-xs', r.noPermissionPage.ok ? 'text-emerald-700' : 'text-red-700'].join(' ')}>
                          Trang cấm ({r.noPermissionPage.path}): {r.noPermissionPage.ok ? 'hiện "Không có quyền truy cập"' : 'KHÔNG chặn'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-semibold">Ảnh chụp ({report.screenshots.length})</h3>
              {(['mobile', 'tablet', 'desktop'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVp(v)}
                  className={['rounded-full px-3 py-1 text-xs font-medium ring-1', vp === v ? 'bg-brand text-white ring-brand' : 'bg-white ring-line'].join(' ')}
                >
                  {VP_LABEL[v]}
                </button>
              ))}
            </div>
            <div className={['grid gap-3', vp === 'mobile' ? 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-6' : vp === 'tablet' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-3'].join(' ')}>
              {report.screenshots
                .filter((s) => s.viewport === vp)
                .map((s) => (
                  <figure key={s.file} className="overflow-hidden rounded-lg border border-line bg-white">
                    <button type="button" className="block w-full" onClick={() => setZoom(s.file)} title="Phóng to">
                      <img src={`${base}${s.file}${bust}`} alt={`${s.page} — ${VP_LABEL[s.viewport as keyof typeof VP_LABEL]}`} loading="lazy" className="w-full" />
                    </button>
                    <figcaption className="truncate border-t border-line px-2 py-1 font-mono text-[11px] text-muted">{s.page}</figcaption>
                  </figure>
                ))}
            </div>
          </section>
        </>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-stone-900/70 p-4" onClick={() => setZoom(null)}>
          <img src={`${base}${zoom}${bust}`} alt="Ảnh chụp phóng to" className="max-h-full max-w-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
