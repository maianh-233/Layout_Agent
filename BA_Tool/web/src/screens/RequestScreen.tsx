// Màn hình 1 — Nhập yêu cầu ban đầu (khung chat).
import { useState } from 'react';

const EXAMPLE =
  'Tôi đang thu thập thông tin để hỗ trợ một chủ cửa hàng thời trang tạo ra trang web riêng của họ.';

export function RequestScreen({ initial, onSubmit }: { initial: string; onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const ok = text.trim().length >= 10;

  const send = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold">Yêu cầu của khách hàng là gì?</h2>
          <p className="mt-1 text-sm text-muted">
            Mô tả ngắn gọn bằng lời của bạn. AI sẽ tạo bộ câu hỏi dễ hiểu để bạn hỏi lại khách hàng.
          </p>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">AI</span>
            <p className="rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-[15px]">
              Chào bạn! Hãy cho tôi biết khách hàng là ai, kinh doanh gì và họ muốn có sản phẩm gì.
              <button type="button" className="mt-2 block text-left text-sm text-brand underline" onClick={() => setText(EXAMPLE)}>
                Dùng ví dụ: “{EXAMPLE}”
              </button>
            </p>
          </div>
        </div>

        <form
          className="flex items-end gap-3 border-t border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor="req" className="sr-only">
            Yêu cầu ban đầu
          </label>
          <textarea
            id="req"
            rows={4}
            className="input resize-y"
            placeholder="Ví dụ: Chủ quán cà phê muốn có website cho khách đặt bàn và xem thực đơn…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send();
            }}
          />
          <button className="btn-primary h-11 shrink-0" disabled={!ok || busy}>
            {busy ? 'Đang gửi…' : 'Gửi ➤'}
          </button>
        </form>
      </div>
      <p className="mt-2 text-right text-xs text-muted">Ctrl + Enter để gửi</p>
    </section>
  );
}
