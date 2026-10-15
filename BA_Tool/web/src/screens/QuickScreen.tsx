// Chế độ nhanh — landing page đã dựng: xem theo cỡ màn hình, sửa theo góp ý của khách, QA, tải về.
import { useState } from 'react';
import { DevicePreview } from '../components/DevicePreview';
import type { JobKind, Project } from '../types';
import { QaPanel } from './QaPanel';

interface Props {
  project: Project;
  /** Sửa theo góp ý (để trống = sửa theo báo cáo QA); section = chỉ sửa trong khối đó */
  onRevise: (feedback: string, section?: string) => Promise<void>;
  onStartJob: (kind: JobKind) => Promise<void>;
  /** Quay lại sửa mô tả rồi dựng lại từ đầu */
  onRestart: () => void;
}

/** Góp ý hay gặp — bấm để thêm vào ô góp ý */
const SUGGESTIONS = [
  'Sinh động hơn: thêm hiệu ứng cuộn và hover',
  'Thêm không khí: mây trôi, hạt sáng, trời đổi màu khi cuộn',
  'Đổi phong cách sang Minimal / Premium / Editorial',
  'Tối giản, sang trọng hơn',
  'Hero nổi bật hơn, chữ to hơn',
  'Thêm bảng giá có nút chuyển tháng / năm',
  'Thêm carousel đánh giá khách hàng',
  'Thêm câu hỏi thường gặp (FAQ)',
  'Thêm form đặt lịch dạng cửa sổ (modal)',
  'Thêm thư viện ảnh bấm để phóng to',
];

const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

export function QuickScreen({ project, onRevise, onStartJob, onRestart }: Props) {
  const pages = project.prototype.pages;
  const [page, setPage] = useState(pages.includes('index.html') ? 'index.html' : pages[0]);
  const [tab, setTab] = useState<'preview' | 'qa'>('preview');
  const [feedback, setFeedback] = useState('');
  /** Phạm vi sửa: '' = toàn trang, hoặc id một section của index.html */
  const [section, setSection] = useState('');
  const sections = project.prototype.sections ?? [];
  const [busy, setBusy] = useState(false);
  const url = `/preview/${project.slug}/${page}?v=${encodeURIComponent(project.prototype.builtAt ?? '')}`;
  const qaCount = project.qa ? project.qa.critical + project.qa.major + project.qa.minor : null;

  const revise = async () => {
    if (!feedback.trim()) return;
    setBusy(true);
    try {
      await onRevise(feedback.trim(), section || undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" className="flex gap-1 border-b border-line">
            {(
              [
                ['preview', 'Xem trước'],
                ['qa', `QA${qaCount !== null ? ` (${qaCount})` : ''}`],
              ] as const
            ).map(([v, text]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={tab === v}
                onClick={() => setTab(v)}
                className={[
                  '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
                  tab === v ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-stone-800',
                  v === 'qa' && project.qa?.critical ? 'text-red-700' : '',
                ].join(' ')}
              >
                {text}
              </button>
            ))}
          </div>
          {pages.length > 1 && (
            <select className="input w-auto py-1.5 font-mono text-xs" value={page} onChange={(e) => setPage(e.target.value)} aria-label="Trang">
              {pages.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          )}
          <span className="flex-1" />
          <a className="btn-outline py-1.5" href={url} target="_blank" rel="noreferrer">
            Mở tab mới ↗
          </a>
          <a className="btn-outline py-1.5" href={`/api/projects/${project.slug}/prototype.zip`} download>
            ⬇ Tải .zip
          </a>
        </div>
        {tab === 'preview' ? (
          <DevicePreview url={url} label={page} />
        ) : (
          <QaPanel
            project={project}
            onStartJob={onStartJob}
            fixKind="quick-revise"
            onOpenPage={(p) => {
              if (pages.includes(p)) setPage(p);
              setTab('preview');
            }}
          />
        )}
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Khách muốn sửa gì?</h2>
          <p className="mt-1 text-sm text-muted">Ghi góp ý bằng lời thường, AI sửa đúng chỗ và giữ nguyên phần còn lại.</p>
          {sections.length > 0 && (
            <label className="mt-3 block text-xs text-muted">
              Phạm vi sửa
              <select className="input mt-1 py-1.5 font-mono text-xs" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="">Toàn trang</option>
                {sections.map((id) => (
                  <option key={id} value={id}>
                    Chỉ section #{id}
                  </option>
                ))}
              </select>
              {section && <span className="mt-1 block">AI chỉ đọc và sửa khối này, các khối khác giữ nguyên — nhanh hơn sửa cả trang.</span>}
            </label>
          )}
          <label htmlFor="fb" className="sr-only">
            Góp ý
          </label>
          <textarea
            id="fb"
            rows={6}
            className="input mt-3 resize-y"
            placeholder="Ví dụ: Đổi màu chủ đạo sang xanh lá đậm; thêm mục bảng giá 3 gói; ảnh hero dùng cảnh cửa hàng; bỏ phần đánh giá."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void revise();
            }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((t) => (
              <button
                key={t}
                type="button"
                className="rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-brand hover:text-brand-dark"
                onClick={() => setFeedback((f) => (f.includes(t) ? f : f.trim() ? `${f.trim().replace(/[.;]$/, '')}; ${t}` : t))}
              >
                + {t}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary mt-3 w-full" disabled={!feedback.trim() || busy} onClick={() => void revise()}>
            {busy ? 'Đang gửi…' : section ? `✦ Sửa section #${section}` : '✦ Sửa theo góp ý'}
          </button>
        </section>

        {project.revisions && project.revisions.length > 0 && (
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Đã sửa ({project.revisions.length})</h2>
            <ol className="mt-2 space-y-2 text-sm">
              {[...project.revisions].reverse().map((r) => (
                <li key={r.createdAt} className="rounded-lg bg-stone-50 px-3 py-2">
                  <span className="block text-xs text-muted">{fmt(r.createdAt)}</span>
                  <span className="line-clamp-3 break-words">{r.text}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="rounded-2xl border border-line bg-white p-4 text-sm shadow-sm">
          <p className="break-all font-mono text-xs text-muted">{project.prototype.dir}</p>
          <button type="button" className="btn-ghost mt-2 -ml-3" onClick={onRestart}>
            ↺ Sửa mô tả & dựng lại từ đầu
          </button>
        </section>
      </aside>
    </div>
  );
}
