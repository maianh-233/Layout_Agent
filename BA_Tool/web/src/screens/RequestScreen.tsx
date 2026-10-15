// Màn hình 1 — Nhập yêu cầu ban đầu (khung chat). Chế độ nhanh: mô tả landing page để AI dựng ngay.
import { useState } from 'react';
import { ConceptPanel, EMPTY_CONCEPT } from '../components/ConceptPanel';
import type { Concept, Flow } from '../types';

const COPY = {
  quick: {
    title: 'Mô tả landing page cần dựng',
    intro: 'AI sẽ dựng ngay một landing page đẹp trên cả máy tính lẫn điện thoại — không hỏi lại, không viết SRS.',
    bubble: 'Hãy cho tôi biết doanh nghiệp là ai, bán gì, khách mục tiêu là ai và muốn khách làm gì trên trang (gọi, đặt lịch, mua…). Có màu, phong cách, nội dung sẵn thì ghi luôn.',
    example:
      'Tiệm bánh kem Mây ở Đà Lạt cần landing page cho khách xem mẫu bánh sinh nhật, bảng giá theo size và đặt bánh qua form hoặc Zalo. Phong cách ấm áp, tông kem – nâu socola, ảnh bánh cận cảnh.',
    example2:
      'Landing page cho phim hoạt hình ngắn "The Last Summer Train": một cô gái đợi chuyến tàu cuối ở ga làng vắng. Mộng mơ kiểu anime, điện ảnh, cô đơn giữa thiên nhiên — bầu trời mây lớn, hoàng hôn, đom đóm, đêm sao. Có trailer, câu chuyện, thư viện cảnh, lịch chiếu và form nhận vé.',
    placeholder: 'Ví dụ: Phòng khám nha khoa Smile ở Quận 7 cần landing page giới thiệu dịch vụ niềng răng, bảng giá và form đặt lịch…',
    submit: 'Dựng landing page ➤',
  },
  default: {
    title: 'Yêu cầu của khách hàng là gì?',
    intro: 'Mô tả ngắn gọn bằng lời của bạn. AI sẽ tạo bộ câu hỏi dễ hiểu để bạn hỏi lại khách hàng.',
    bubble: 'Chào bạn! Hãy cho tôi biết khách hàng là ai, kinh doanh gì và họ muốn có sản phẩm gì.',
    example: 'Tôi đang thu thập thông tin để hỗ trợ một chủ cửa hàng thời trang tạo ra trang web riêng của họ.',
    placeholder: 'Ví dụ: Chủ quán cà phê muốn có website cho khách đặt bàn và xem thực đơn…',
    submit: 'Gửi ➤',
    example2: '',
  },
};

interface Props {
  initial: string;
  /** Chế độ nhanh: concept đã chọn lần trước */
  initialConcept?: Concept;
  flow?: Flow;
  onSubmit: (text: string, concept?: Concept) => Promise<void>;
}

export function RequestScreen({ initial, initialConcept, flow, onSubmit }: Props) {
  const copy = flow === 'quick' ? COPY.quick : COPY.default;
  const intro = flow === 'standard' ? 'Mô tả ngắn gọn bằng lời của bạn. AI sẽ soạn tối đa 10 câu hỏi then chốt để hỏi lại khách — phần còn lại AI tự đề xuất.' : copy.intro;
  const [text, setText] = useState(initial);
  const [concept, setConcept] = useState<Concept>(initialConcept ?? EMPTY_CONCEPT);
  const quick = flow === 'quick';
  const [busy, setBusy] = useState(false);
  const ok = text.trim().length >= 10;

  const send = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onSubmit(text.trim(), quick ? concept : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={['mx-auto', quick ? 'max-w-4xl' : 'max-w-3xl'].join(' ')}>
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted">{intro}</p>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">AI</span>
            <p className="rounded-2xl rounded-tl-sm bg-stone-100 px-4 py-3 text-[15px]">
              {copy.bubble}
              <button type="button" className="mt-2 block text-left text-sm text-brand underline" onClick={() => setText(copy.example)}>
                Dùng ví dụ: “{copy.example}”
              </button>
              {copy.example2 && (
                <button type="button" className="mt-2 block text-left text-sm text-brand underline" onClick={() => setText(copy.example2)}>
                  Ví dụ concept: “{copy.example2.slice(0, 110)}…”
                </button>
              )}
            </p>
          </div>
        </div>

        {quick && <ConceptPanel value={concept} onChange={setConcept} text={text} />}

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
            placeholder={copy.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void send();
            }}
          />
          <button className="btn-primary h-11 shrink-0" disabled={!ok || busy}>
            {busy ? 'Đang gửi…' : copy.submit}
          </button>
        </form>
      </div>
      <p className="mt-2 text-right text-xs text-muted">Ctrl + Enter để gửi</p>
    </section>
  );
}
