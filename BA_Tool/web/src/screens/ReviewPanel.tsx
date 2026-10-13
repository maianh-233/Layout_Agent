// Tab "Rà soát" của màn hình SRS: kết quả kiểm bằng code + AI, sửa từng lỗi qua bản nháp có diff.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { ErrorBanner } from '../components/ConfirmDialog';
import { DiffView } from '../components/DiffView';
import { SEVERITY_LABELS, type FileDiff, type Finding, type JobKind, type Project, type Review, type Severity } from '../types';

const SEV_CLS: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 ring-red-200',
  major: 'bg-amber-100 text-amber-900 ring-amber-200',
  minor: 'bg-sky-100 text-sky-800 ring-sky-200',
};

interface Props {
  project: Project;
  onOpenFile: (path: string) => void;
  onStartJob: (kind: JobKind, findingId?: string) => Promise<void>;
  onProjectChange: (p: Project) => void;
}

export function ReviewPanel({ project, onOpenFile, onStartJob, onProjectChange }: Props) {
  const [review, setReview] = useState<Review | null | undefined>(undefined);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [showFixed, setShowFixed] = useState(false);
  const [error, setError] = useState('');
  const [fix, setFix] = useState<{ finding: Finding | null; diffs: FileDiff[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getReview(project.slug).then(setReview).catch((e: Error) => setError(e.message));
  }, [project.slug, project.updatedAt]);

  const openFix = () => api.getFix(project.slug).then(setFix).catch((e: Error) => setError(e.message));
  // Vừa có bản sửa AI đề xuất → mở luôn phần xem thay đổi
  useEffect(() => {
    if (project.pendingFix) void openFix();
    else setFix(null);
  }, [project.pendingFix?.findingId, project.pendingFix?.createdAt]);

  const decide = async (apply: boolean) => {
    setBusy(true);
    try {
      onProjectChange(apply ? await api.applyFix(project.slug) : await api.discardFix(project.slug));
      setFix(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (review === undefined) return <p className="text-sm text-muted">Đang tải kết quả rà soát…</p>;

  const header = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">Rà soát chất lượng SRS</h2>
        <p className="text-sm text-muted">
          {review
            ? `Lần gần nhất: ${new Date(review.createdAt).toLocaleString('vi-VN')} · Lượt AI: ${
                review.ai.status === 'done' ? 'đã chạy' : review.ai.status === 'failed' ? `lỗi — ${review.ai.error ?? ''}` : 'chưa chạy'
              }`
            : 'Chưa rà soát lần nào.'}
        </p>
      </div>
      <button type="button" className="btn-outline" disabled={Boolean(project.pendingFix)} onClick={() => void onStartJob('srs-review')}>
        ↻ Rà soát lại
      </button>
    </div>
  );

  const findings = (review?.findings ?? []).filter((f) => (showFixed || f.status === 'open') && (filter === 'all' || f.severity === filter));
  const openCount = (s: Severity) => review?.findings.filter((f) => f.status === 'open' && f.severity === s).length ?? 0;

  return (
    <div className="space-y-4">
      {header}
      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {project.pendingFix && (
        <section className="rounded-2xl border-2 border-violet-300 bg-violet-50/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-violet-950">
              <b>AI đã đề xuất cách sửa {project.pendingFix.findingId}.</b> Xem thay đổi bên dưới rồi chọn lưu hoặc bỏ. Thay đổi chưa được ghi vào SRS.
            </p>
            <button type="button" className="btn-ghost" disabled={busy} onClick={() => void decide(false)}>
              Bỏ bản sửa
            </button>
            <button type="button" className="btn-primary" disabled={busy || !fix} onClick={() => void decide(true)}>
              {busy ? 'Đang lưu…' : 'Lưu thay đổi vào SRS'}
            </button>
          </div>
          {fix?.finding && <p className="mt-2 text-sm text-violet-900">Lỗi: {fix.finding.message}</p>}
          <div className="mt-3">{fix ? <DiffView diffs={fix.diffs} /> : <p className="text-sm text-muted">Đang tải thay đổi…</p>}</div>
        </section>
      )}

      {review && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Tất cả
          </FilterChip>
          {(['critical', 'major', 'minor'] as Severity[]).map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} cls={SEV_CLS[s]}>
              {SEVERITY_LABELS[s]} · {openCount(s)}
            </FilterChip>
          ))}
          <span className="flex-1" />
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="accent-brand" checked={showFixed} onChange={(e) => setShowFixed(e.target.checked)} />
            Hiện lỗi đã sửa
          </label>
        </div>
      )}

      {review && findings.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
          {review.findings.length ? 'Không có lỗi nào ở mức này.' : 'Không phát hiện vấn đề nào.'}
        </p>
      )}

      <ul className="space-y-2">
        {findings.map((f) => (
          <li key={f.id} className={['rounded-xl border border-line bg-white p-4', f.status === 'fixed' ? 'opacity-60' : ''].join(' ')}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ${SEV_CLS[f.severity]}`}>{SEVERITY_LABELS[f.severity]}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">{f.category}</span>
              <span className="text-muted">
                {f.id} · {f.source === 'code' ? 'Kiểm bằng code' : 'AI'}
              </span>
              {f.status === 'fixed' && <span className="font-semibold text-emerald-700">✓ Đã sửa</span>}
            </div>
            <p className="mt-2 text-sm leading-6">{f.message}</p>
            {f.suggestion && <p className="mt-1 text-sm text-muted">Gợi ý: {f.suggestion}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {f.file && (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 font-mono text-xs text-brand-dark underline-offset-2 hover:bg-brand-soft hover:underline"
                  onClick={() => onOpenFile(f.file!)}
                  disabled={!f.file.endsWith('.md')}
                  title={f.file.endsWith('.md') ? 'Mở file SRS' : 'File dữ liệu nội bộ'}
                >
                  {f.file}
                  {f.section ? ` · ${f.section}` : ''}
                </button>
              )}
              <span className="flex-1" />
              {f.status === 'open' && (
                <button
                  type="button"
                  className="btn-outline py-1 text-sm"
                  disabled={Boolean(project.pendingFix)}
                  title={project.pendingFix ? 'Hãy lưu hoặc bỏ bản sửa đang chờ trước' : undefined}
                  onClick={() => void onStartJob('srs-fix', f.id)}
                >
                  ✦ Để AI sửa lỗi này
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({ active, onClick, children, cls = 'bg-white text-stone-700 ring-line' }: { active: boolean; onClick: () => void; children: React.ReactNode; cls?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['rounded-full px-3 py-1 font-medium ring-1', cls, active ? 'outline-2 outline-offset-1 outline-brand' : 'opacity-80 hover:opacity-100'].join(' ')}
    >
      {children}
    </button>
  );
}
