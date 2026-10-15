// Xem trước prototype theo cỡ màn hình thật (điện thoại / máy tính bảng / máy tính / màn rộng).
// Trang được render đúng bề rộng thiết bị rồi thu nhỏ cho vừa khung, để thấy bố cục thật ở 1920px hay 390px.
import { useEffect, useRef, useState } from 'react';

const DEVICES = [
  { id: 'mobile', label: 'Điện thoại', width: 390, height: 844 },
  { id: 'tablet', label: 'Máy tính bảng', width: 820, height: 1180 },
  { id: 'desktop', label: 'Máy tính', width: 1440, height: 900 },
  { id: 'wide', label: 'Màn rộng 1920', width: 1920, height: 1080 },
] as const;
type DeviceId = (typeof DEVICES)[number]['id'];

export function DevicePreview({ url, label }: { url: string; label: string }) {
  const [device, setDevice] = useState<DeviceId>('desktop');
  const box = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const d = DEVICES.find((x) => x.id === device)!;

  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setBoxWidth(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  // Thu nhỏ khi thiết bị rộng hơn khung xem; điện thoại / tablet giữ nguyên cỡ nếu vừa
  const scale = boxWidth ? Math.min(1, (boxWidth - 32) / d.width) : 1;
  const frameHeight = device === 'mobile' || device === 'tablet' ? d.height : Math.round(d.height * 1.15);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-stone-50 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{label}</span>
        <div role="radiogroup" aria-label="Cỡ màn hình" className="flex flex-wrap gap-1">
          {DEVICES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={device === x.id}
              onClick={() => setDevice(x.id)}
              className={[
                'rounded-full px-3 py-1 text-xs font-medium ring-1 transition',
                device === x.id ? 'bg-brand text-white ring-brand' : 'bg-white text-stone-700 ring-line hover:ring-stone-300',
              ].join(' ')}
            >
              {x.label} <span className="opacity-70">{x.width}</span>
            </button>
          ))}
        </div>
      </div>
      <div ref={box} className="flex justify-center overflow-hidden bg-stone-100 p-4" style={{ height: frameHeight * scale + 32 }}>
        <div style={{ width: d.width * scale, height: frameHeight * scale }} className="shrink-0">
          <iframe
            key={url}
            title="Xem trước prototype"
            src={url}
            style={{ width: d.width, height: frameHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            className={['block bg-white shadow-lg', device === 'mobile' ? 'rounded-[28px] ring-8 ring-stone-800' : 'rounded-md'].join(' ')}
          />
        </div>
      </div>
    </div>
  );
}
