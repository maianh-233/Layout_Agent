# Chuyển động & tương tác — làm trang "sống" nhưng hợp phong cách

`TARGET_DIR/assets/js/motion.js` **do tool sinh sẵn** — không sửa, không viết lại hiệu ứng tương tự bằng tay. Chỉ nạp file và **gắn thuộc tính `data-*`**. Thư viện tự tắt hiệu ứng chuột trên điện thoại, tôn trọng `prefers-reduced-motion`, tự nhận nội dung render sau bằng JS.

Nạp ở cuối `<body>`, sau các script khác của trang (đường dẫn tương đối theo độ sâu thư mục):

```html
<script src="assets/js/motion.js"></script>
```

## 1. Chọn mức chuyển động (bắt buộc chọn trước khi dựng)

`concept.md` (chế độ nhanh) đã ghi **Level** — theo đó. Không có thì chọn theo ngành. Level quyết định *được dùng gì*; preset quyết định *dùng thế nào* (nhịp nhanh / chậm, tính cách).

| Level | Hợp với | Được dùng (cộng dồn lên level trước) |
|---|---|---|
| **1 — Basic** | Luật, tài chính, y tế, editorial tối giản, hệ thống quản trị | `data-reveal="fade"`/`"up"`, `data-count-to`, `data-header`, hover (mục 3), chuyển động mở / đóng của ui.js |
| **2 — Atmospheric** | Nhà hàng, café, spa, du lịch, thiên nhiên, retro, sáng tạo | `data-split`, `data-reveal="clip"`, `data-reveal-stagger`, `data-parallax` (≤ 0.2), `data-marquee`, `data-drag-scroll`; của atmos.js: `data-float`, `data-gradient-shift`, `data-clouds`, `data-particles` (**một** section) |
| **3 — Advanced** | Dreamy / điện ảnh, công nghệ, sự kiện, portfolio | `data-sky` (nền đổi theo tiến độ cuộn), `data-layers` + `data-depth` (cảnh nhiều lớp), `data-scene` + `data-step` (cảnh ghim kể chuyện), `data-scrub`, `data-particles` tối đa ba section không liền nhau; con trỏ / tilt / magnetic / spotlight **chỉ khi preset cho phép** |

Tính cách theo preset (khi không có preset thì theo ngành):
- **Tinh tế / Editorial** — chậm, ít mà chắc: clip cho ảnh lớn, split cho 1–2 tiêu đề, ảnh hover phóng chậm 1.04 ~1.2s. Không tilt, con trỏ, ripple, spotlight.
- **Sinh động** — stagger cho lưới thẻ, tilt cho thẻ sản phẩm, magnetic cho CTA, marquee cho logo / đánh giá.
- **Biểu cảm** — `<body data-cursor="ring">` + `data-cursor-label`, spotlight cho khối tối, follow cho hình trang trí, scrub cho hiệu ứng theo cuộn.
- **Dreamy / thiên nhiên** — mây trôi, gradient bầu trời, hạt sáng (bụi nắng / đom đóm / sao), ảnh nhiều lớp, reveal mềm; tuyệt đối không tilt / ripple / con trỏ tùy biến.

Ghi Level + tính cách đã chọn vào `README.md`. Khách / BA nói rõ ("nhiều hiệu ứng", "đơn giản thôi") thì theo lời khách.

**Chỉ dùng kỹ thuật cho hiệu quả xứng đáng:** mỗi hiệu ứng phải phục vụ ý tưởng của section (kể chuyện, dẫn mắt, tạo không khí). Không giả lập nhân vật / sinh vật chuyển động bằng cách phóng to, thu nhỏ, lắc một ảnh tĩnh — không có asset động thật (video, sprite, Lottie do khách cung cấp) thì để ảnh đứng yên và tạo chuyển động bằng môi trường (mây, ánh sáng, hạt, lớp cảnh).

## 2. Thuộc tính có sẵn

| Nhóm | Thuộc tính | Gắn vào |
|---|---|---|
| Hiện khi cuộn | `data-reveal="up\|down\|left\|right\|fade\|zoom\|blur"`, `data-reveal-delay="150"` | Tiêu đề section, khối nội dung. Các phần tử vào màn hình cùng lúc **tự hiện nối tiếp** (90ms) — không cần tự đặt delay, chỉ đặt khi muốn nhịp riêng (ví dụ nút CTA hero sau tiêu đề) |
| | `data-reveal="clip"` | **Khung** ảnh (`overflow-hidden`, chứa `<img>`): màn che kéo từ dưới lên, ảnh thu từ 1.14 về 1. Hợp ảnh biên tập / lookbook |
| | `data-reveal-stagger="80"` | Khối **cha** của lưới thẻ / danh sách — các con hiện lần lượt |
| | `data-split="words\|chars"` | Tiêu đề lớn (hero, section chính) — chữ trượt lên lần lượt |
| Theo cuộn | `data-parallax="0.15"` (−0.3 … 0.3) | Ảnh nền hero, hình trang trí. **Đặt trên lớp bọc** cao hơn khung để không lộ mép khi trôi: `class="absolute inset-x-0 -inset-y-[15%]"` (không dùng `inset-0` / `scale-110`). Không đặt chung phần tử có `data-reveal` / `data-tilt`. Chỉ chạy trên máy có chuột |
| | `data-scrub` → biến CSS `--p` 0→1 | Ví dụ ảnh phóng dần: `style="transform: scale(calc(1.15 - var(--p) * .15))"` |
| | `data-scroll-progress` | Thanh mảnh trên cùng: `<div data-scroll-progress class="fixed inset-x-0 top-0 z-50 h-1 bg-primary-600"></div>` |
| | `data-header="shrink\|hide"` | Header dính; style trạng thái bằng `.is-scrolled` (ví dụ nền đặc + bóng khi đã cuộn) |
| Số liệu | `data-count-to="1284" data-suffix="+" data-decimals="1"` | Con số thống kê (viết sẵn giá trị cuối trong thẻ) |
| Băng chuyền | `data-marquee="40"` (px/giây) | Dải logo đối tác, dải đánh giá, dải khẩu hiệu |
| | `data-drag-scroll` | Vùng `overflow-x-auto` (bộ sưu tập, thẻ sản phẩm) — kéo bằng chuột |
| Chuột | `data-tilt="8"` (+ `data-tilt-glare`) | Thẻ sản phẩm / dự án / bảng giá nổi bật |
| | `data-magnetic="0.3"` | 1–2 nút kêu gọi chính, icon mạng xã hội |
| | `data-spotlight` (+ `data-spotlight-color="rgba(255,255,255,.12)"`) | Khối / thẻ nền tối, bảng giá |
| | `data-follow="0.06"` | Hình trang trí trong hero (khối cha là vùng theo dõi chuột) |
| | `<body data-cursor="dot\|ring">`, `data-cursor-label="Xem"` | Con trỏ tùy biến; nhãn hiện khi rê lên ảnh / thẻ dự án |
| Bấm | `data-ripple` | Nút, thẻ bấm được |

### 2b. `assets/js/atmos.js` — không khí & cảnh theo cuộn (Level 2–3)

Có sẵn trong `TARGET_DIR` (chế độ nhanh). Nạp **sau** motion.js: `<script src="assets/js/atmos.js"></script>`. Mỗi hiệu ứng tự cô lập lỗi, tự dừng khi ra khỏi màn hình, tôn trọng `prefers-reduced-motion`.

| Thuộc tính | Gắn vào | Ghi chú |
|---|---|---|
| `data-particles="fireflies\|dust\|snow\|petals\|stars\|rain"` (+ `data-particles-color="#FFC98B"`, `data-particles-density="0.3–2"`) | `<section>` (relative) | Canvas phủ khối, nằm dưới nội dung: nội dung trong khối cần `relative z-10`. Bụi nắng: chiều / sáng; đom đóm: chiều tối; sao: đêm |
| `data-clouds="3"` (+ `data-clouds-band="0-55"`, `data-clouds-color="#ffffff"`, `data-clouds-speed="1"`) | Section có nền trời | Mây trôi ngang nhiều lớp (xa nhỏ, chậm, mờ). Trang trí trừu tượng, không thay ảnh chụp |
| `data-float="10"` (+ `data-float-rotate="2"`) | Chi tiết trang trí, nhãn, ảnh nhỏ | Không đặt chung phần tử có `data-reveal` / `data-parallax` (cùng dùng transform) — bọc thêm một lớp |
| `data-gradient-shift="18"` | Khối có `bg-gradient-to-*` | Gradient trôi chậm (giây / chu kỳ) |
| `data-sky="#F6D8C8,#A9C6E8 \| #FFB38A,#6A7BB5 \| #1B2340,#0B1022"` | `<body>` (theo cả trang) hoặc một khối | Mỗi chặng `màu trên,màu dưới`; nền chuyển dần sáng → chiều → đêm khi cuộn. Section bên trong để nền trong suốt. Biến `--sky-t` (0→1) dùng cho chi tiết khác |
| `data-layers` + con `data-depth="0.1…0.4"` | Hero / cảnh | Lớp xa depth nhỏ, lớp gần depth lớn; lớp rộng hơn khung (`-inset-y-[8%]`). Điện thoại tự giảm biên độ |
| `data-scene="300"` + `data-step="0-0.33"` | Section kể chuyện | Con đầu tiên tự ghim 100dvh; `--sp` (0→1) dùng trong `style` (ví dụ ảnh thu nhỏ dần); con `data-step` hiện khi `--sp` trong khoảng. Không đặt trong khối `overflow-hidden` |

## 3. Hover & trạng thái — viết bằng Tailwind

Mọi phần tử bấm được phải có phản hồi: `transition duration-300` (không để mặc định 150ms), `hover:-translate-y-1 hover:shadow-lg` (thẻ), ảnh `transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]` trong khung `overflow-hidden`, mũi tên dịch sang `group-hover:translate-x-1`, `active:scale-[.98]` cho nút, `focus-visible:` rõ ràng (vòng viền màu nhấn, trắng trên nền tối). Menu mobile, accordion, modal đã có chuyển động mở **và đóng** trong `ui.js`.

Gạch chân menu: chạy vào từ trái, rút ra bên phải, giữ nguyên dưới mục đang xem (scrollspy):
`after:origin-right after:scale-x-0 after:transition-transform after:duration-500 after:ease-[cubic-bezier(.16,1,.3,1)] hover:after:origin-left hover:after:scale-x-100 [&.is-active]:after:scale-x-100`

## 3b. Nhịp chuyển động chung

- Đường cong: vào bằng expo-out `cubic-bezier(.16,1,.3,1)`; opacity ngắn hơn transform (0.8s / 1.1s); rời đi nhanh hơn vào (ease-in ~0.3–0.5s). Không bounce / overshoot.
- Thời lượng: hover màu 300ms, hover ảnh ~1.2s, reveal ~1s, chuyển slide hero ~1.2s. Trễ tối đa cho cả một nhóm ~0.7s (thư viện tự nén).
- Chỉ animate `transform`, `opacity`, `clip-path` (và `filter` nhẹ). Không animate `top/left/width/height` (trừ chiều cao accordion đã có sẵn).
- Hero slider tự viết: slide mới **che** slide cũ (clip-path wipe hoặc fade lên trên slide cũ còn nguyên) — không crossfade hai ảnh cùng mờ 50%; chữ cũ rời lên trên trước, chữ mới trồi lên sau.

## 4. Giới hạn

- Mỗi màn hình đầu (hero) tối đa 2–3 loại hiệu ứng; không gắn `data-reveal` cho **mọi** phần tử — chỉ khối chính của mỗi section.
- Hạt / mây: Level 2 một section có hạt, Level 3 tối đa ba section không liền nhau; mây 1–2 section. Mỗi loại hạt hợp thời điểm của cảnh (bụi nắng ban ngày, đom đóm chiều tối, sao ban đêm). Chữ trên nền có hạt / mây vẫn phải đủ tương phản.
- Không chặn nội dung: chữ, nút, giá luôn đọc được khi đang chuyển động; không ẩn nội dung quan trọng sau hover (điện thoại không có hover).
- Hệ thống quản trị (bảng, form, chứng từ): chỉ mức **Tinh tế** — `data-reveal="fade"` cho thẻ KPI / khối dashboard, `data-count-to` cho số KPI, hover dòng bảng, chuyển động modal / drawer / toast. Không con trỏ tùy biến, không parallax, không tilt trên bảng dữ liệu.
