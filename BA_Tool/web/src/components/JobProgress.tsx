// Màn hình chờ: nhận tiến độ tác vụ AI qua SSE và hiển thị từng file đang được tạo.
import { useEffect, useRef, useState } from 'react';
import type { JobEvent } from '../types';

interface Props {
  jobId: string;
  title: string;
  onDone: () => void;
  onError: (message: string) => void;
}

interface FileRow {
  path: string;
  edits: number;
}

export function JobProgress({ jobId, title, onDone, onError }: Props) {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [step, setStep] = useState('Đang khởi động AI…');
  const [elapsed, setElapsed] = useState(0);
  const cb = useRef({ onDone, onError });
  cb.current = { onDone, onError };
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    const es = new EventSource(`/api/jobs/${jobId}/events`);
    let finished = false;
    es.onmessage = (msg) => {
      const e = JSON.parse(msg.data) as JobEvent;
      if (e.type === 'file') {
        setFiles((prev) => {
          const i = prev.findIndex((f) => f.path === e.path);
          if (i >= 0) return prev.map((f, j) => (j === i ? { ...f, edits: f.edits + 1 } : f));
          return [...prev, { path: e.path, edits: 1 }];
        });
      } else if (e.type === 'log') {
        setLogs((prev) => [...prev.slice(-200), e.text]);
      } else if (e.type === 'step') {
        setStep(e.text);
      } else if (e.type === 'status' && e.status !== 'running') {
        finished = true;
        es.close();
        if (e.status === 'done') cb.current.onDone();
        else cb.current.onError(e.error || 'Tác vụ thất bại');
      }
    };
    es.onerror = () => {
      if (finished) return;
      es.close();
      // Server khởi động lại hoặc mất kết nối: để màn hình cha tải lại trạng thái dự án
      cb.current.onError('Mất kết nối với tác vụ AI. Tải lại trang để xem trạng thái mới nhất.');
    };
    return () => {
      clearInterval(timer);
      es.close();
    };
  }, [jobId]);

  // Dùng thân hàm có ngoặc: scrollIntoView có thể trả về Promise, không được trả nó cho useEffect
  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [logs]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-brand" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted">{step}</p>
          </div>
          <span className="font-mono text-sm text-muted tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        {files.length > 0 && (
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
            {files.map((f, i) => {
              const current = i === files.length - 1;
              return (
                <li key={f.path} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className={current ? 'text-brand' : 'text-emerald-600'}>{current ? '●' : '✓'}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{f.path}</span>
                  <span className="text-xs text-muted">
                    {current ? 'đang tạo…' : f.edits > 1 ? `xong (${f.edits} lần ghi)` : 'xong'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <details className="mt-4 text-sm" open={files.length === 0}>
          <summary className="cursor-pointer text-muted">Nhật ký AI ({logs.length})</summary>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg bg-stone-50 p-3 font-mono text-xs leading-5 text-stone-600">
            {logs.length === 0 ? <p>Đang chờ…</p> : logs.map((l, i) => <p key={i} className="whitespace-pre-wrap">{l}</p>)}
            <div ref={logEnd} />
          </div>
        </details>
      </div>
      <p className="mt-3 text-center text-xs text-muted">
        Bạn có thể đóng trình duyệt — tác vụ vẫn chạy trên máy, mở lại dự án để xem kết quả.
      </p>
    </section>
  );
}
