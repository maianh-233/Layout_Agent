<!-- Sinh tự động từ server/src/presets.ts khi server khởi động — không sửa tay. Thêm / sửa preset trong presets.ts. -->
# Danh mục design preset (chế độ nhanh)

Mỗi preset là một bộ quy tắc thiết kế đầy đủ. `PROJECT_DIR/concept.md` cho biết preset đã chốt; file này dùng khi phải tự chọn hoặc khi BA muốn đổi phong cách.

### Preset: Dreamy / Anime / Cinematic (`dreamy`)
Bầu trời, ánh chiều, khoảnh khắc lặng — như một khung phim hoạt hình.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `sky-dawn` #F6D8C8 · `sky-day` #A9C6E8 · `dusk` #2B3566 · `night` #0E1430 · `ink` #1E2340 · `paper` #FBF7F2 · `glow` #FFC98B · `sakura` #E8A6B8
**Font** (Google Fonts): display `Shippori Mincho:wght@500;700;800` · body `Zen Kaku Gothic New:wght@400;500;700` · nhãn `Zen Kaku Gothic New`

**Chữ**
- Tiêu đề Shippori Mincho (serif kiểu poster phim Nhật), cỡ rất lớn ở hero (clamp 3.5rem → 8rem), dòng chặt (leading-[0.95]), chữ thường xen chữ hoa.
- Nhãn nhỏ: chữ hoa, tracking-[0.3em], cỡ 11–12px — như phụ đề / số cảnh ("SCENE 02 — THE FIELD").
- Thân bài 17–18px, leading-relaxed, màu ink/80; câu ngắn, giàu hình ảnh, giọng tự sự.
**Bố cục**
- Hero toàn màn hình `min-h-[100dvh]`, tiêu đề đặt góc dưới-trái hoặc căn giữa trên bầu trời — được phép căn giữa.
- Mỗi section là một "cảnh": nền chuyển màu theo giờ trong ngày (sáng → chiều → đêm) khi cuộn xuống — dùng `data-sky` trên `<body>` và để section trong suốt.
- Xen kẽ cảnh rộng tràn viền với khối chữ hẹp (max-w-prose) đặt lệch trái / phải — nhiều khoảng trống bầu trời.
- Ít nhất một cảnh ghim theo cuộn (`story-pinned`) kể chuyện bằng 3 câu ngắn đổi lần lượt.
**Ảnh**
- Ảnh chụp thật: cánh đồng / ngọn đồi / ga tàu vắng / mặt hồ / đường quê / bầu trời mây lớn — một chủ thể nhỏ cô độc giữa khung rộng.
- Từ khóa gợi ý: "lone tree field clouds", "empty train station countryside", "summer clouds blue sky", "mountain lake dusk", "sunset grass field", "starry night sky".
- Xử lý ảnh bằng CSS cho tông phim hoạt hình: `saturate-[1.15] contrast-[1.05]` + lớp phủ gradient màu trời (mix-blend-soft-light), đáy ảnh hòa vào nền bằng gradient.
**Khoảng trắng:** Rất nhiều: section `py-28 lg:py-40`, chữ chiếm ≤ 40% khung, để bầu trời "thở".
**Chuyển động mặc định:** Level 3 — Advanced
- Hero: `data-clouds` (2–3 lớp) + `data-particles="dust"` hoặc `"fireflies"` (cảnh chiều / đêm) + tiêu đề `data-split="words"` chậm.
- Cảnh đêm: `data-particles="stars"`; cảnh ghim: `data-scene` + `data-step`.
- Ảnh lớn: `data-reveal="clip"`; lớp ảnh trong hero: `data-layers` với 2–3 `data-depth`.
- Nhịp chậm, êm; không tilt, không magnetic, không con trỏ tùy biến, không ripple.
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-scene` → `story-letter` → `story-pinned` → `gallery-filmstrip` → `quote-full` → `cta-sky` → `footer-minimal`
**Được phép (ghi đè layout-guide mục 3):** gradient bầu trời (cam đào → xanh trời → tím đêm); quầng sáng mềm / hạt sáng; hero căn giữa; mây vẽ bằng gradient (trang trí trừu tượng, không giả ảnh chụp)
**Tránh:** gradient tím–xanh neon; thẻ bo góc có bóng đổ kiểu SaaS; icon dày đặc; phóng to / thu nhỏ ảnh tĩnh để giả nhân vật chuyển động

### Preset: Nature / Organic / Atmospheric (`nature`)
Rêu, gỗ, sương sớm — chất liệu tự nhiên, nhịp chậm.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `moss` #3F5A3C · `fern` #6F8B5E · `mist` #F4F1EA · `sand` #E9E1D1 · `bark` #5A4636 · `sky` #BFD3D6 · `ochre` #C98A3D · `ink` #1F271D
**Font** (Google Fonts): display `Fraunces:opsz,wght@9..144,400;9..144,600` · body `Manrope:wght@400;500;700`

**Chữ**
- Tiêu đề Fraunces (serif mềm), một từ in nghiêng màu fern để nhấn ý.
- Thân bài Manrope 17px, màu ink/75; số liệu (độ cao, nhiệt độ, mùa) đặt thành nhãn nhỏ.
**Bố cục**
- Bố cục hữu cơ: ảnh bo góc lớn (rounded-[2rem]) hoặc vòm (rounded-t-full) xen ảnh vuông sắc cạnh.
- Lưới lệch nhịp 12 cột: ảnh chiếm 7 cột, chữ 4 cột lệch xuống; dải ảnh ngang kéo được.
- Nền mist / sand xen một dải moss đậm cho phần số liệu hoặc trích dẫn.
**Ảnh**
- Ảnh thật: rừng sương, lá cận cảnh, bàn tay làm việc, chất liệu gỗ / đá / vải lanh.
- Tông ấm hơi phai: `saturate-[.9] sepia-[.08]`.
**Khoảng trắng:** Rộng rãi, `py-24 lg:py-32`, khối chữ ngắn.
**Chuyển động mặc định:** Level 2 — Atmospheric
- `data-reveal="clip"` cho ảnh lớn, `data-reveal-stagger` cho lưới, `data-parallax` 0.1–0.15 cho ảnh hero.
- Một section có `data-particles="dust"` (nắng xuyên rừng) hoặc `data-clouds` mỏng (sương) — không hơn.
- `data-float` rất nhẹ (6px) cho 1–2 chi tiết trang trí (lá, nhãn).
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-split` → `story-editorial` → `features-numbered` → `gallery-lookbook` → `stats-band` → `quote-full` → `contact-split` → `footer-big`
**Được phép (ghi đè layout-guide mục 3):** sương mỏng bằng gradient; hình vòm / bo lớn
**Tránh:** xanh lá tươi chói; icon lá cây clip-art; gradient đa màu

### Preset: Minimal / Premium / Editorial (`editorial`)
Như tạp chí in: chữ lớn, lưới chặt, rất ít màu.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `paper` #F5F3EF · `ink` #111111 · `stone` #D9D4CB · `muted` #6B6760 · `bronze` #8C6A43
**Font** (Google Fonts): display `Instrument Serif:ital@0;1` · body `Geist:wght@300;400;500;600`

**Chữ**
- Tiêu đề Instrument Serif cực lớn (đến 10rem ở 2xl), một phần in nghiêng; tracking-tight.
- Thân Geist 16px; nhãn chữ hoa 11px tracking-[0.2em]; số trang / số mục kiểu tạp chí (No. 01).
**Bố cục**
- Lưới 12 cột với đường kẻ mảnh (border-ink/15) chia khối; căn trái tuyệt đối.
- Hero chữ là chính (`hero-type`), ảnh nhỏ đặt lệch; ảnh lớn xuất hiện ở section sau như trang đôi tạp chí.
- Không thẻ có bóng đổ; phân tách bằng đường kẻ và khoảng trắng.
**Ảnh**
- Ảnh studio / kiến trúc, nền trơn, nhiều khoảng trống; có thể đen trắng (`grayscale`) với 1 ảnh màu làm điểm nhấn.
**Khoảng trắng:** Rất rộng nhưng có kỷ luật: lề cố định, khối căn theo lưới.
**Chuyển động mặc định:** Level 1 — Basic
- Chỉ `data-reveal="fade"`/`"up"`, `data-reveal="clip"` cho 1–2 ảnh lớn, `data-split="words"` cho 1 tiêu đề.
- Hover: gạch chân chạy, ảnh phóng chậm 1.04. Không particles / clouds / tilt / cursor.
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-type` → `story-editorial` → `gallery-lookbook` → `features-numbered` → `quote-full` → `cta-type` → `footer-big`
**Tránh:** bo góc lớn; bóng đổ; nhiều màu; icon trang trí

### Preset: Vintage / Retro / Film (`film`)
Hạt phim, màu phai, nhãn đánh máy — hoài niệm có chủ đích.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `cream` #EFE6D2 · `ink` #2A211B · `faded-red` #B4442F · `mustard` #D9A441 · `teal` #2F6F6A · `paper` #F7F1E3
**Font** (Google Fonts): display `Young Serif:wght@400` · body `Work Sans:wght@400;500;700` · nhãn `Courier Prime:wght@400;700`

**Chữ**
- Tiêu đề Young Serif, cỡ lớn, có thể đặt trong khung viền kép như nhãn đĩa than.
- Nhãn / chú thích Courier Prime (đánh máy): số khung "FR. 24A", ngày tháng, giá.
**Bố cục**
- Ảnh khung polaroid / dải phim có lỗ (border-dashed), xoay nhẹ ±2° (`rotate-[-2deg]`).
- Khối màu phẳng (mustard, teal, faded-red) cắt ngang trang; đường kẻ đôi.
- Lớp hạt phim phủ toàn trang: một `<div>` fixed `pointer-events-none` với nhiễu bằng SVG feTurbulence, opacity .08.
**Ảnh**
- Ảnh thật tông ấm, phai: `sepia-[.25] saturate-[.85] contrast-[1.05]`; khung viền trắng dày.
**Khoảng trắng:** Vừa phải, nhịp dày hơn editorial; khối xếp chồng như sổ lưu niệm.
**Chuyển động mặc định:** Level 2 — Atmospheric
- `data-reveal="up"` + `data-reveal-stagger` cho ảnh polaroid, `data-float` rất nhẹ cho 1 ảnh xoay.
- `data-marquee` cho dải chữ kiểu băng rôn; `data-drag-scroll` cho dải phim.
- Không particles kiểu lấp lánh; không blur.
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-offset` → `story-letter` → `gallery-filmstrip` → `features-alternate` → `stats-band` → `cta-fullbleed` → `footer-minimal`
**Được phép (ghi đè layout-guide mục 3):** hạt nhiễu SVG feTurbulence làm lớp phủ; ảnh xoay nhẹ
**Tránh:** gradient hiện đại; glassmorphism; font sans hình học

### Preset: Futuristic / Digital Art (`futuristic`)
Nền tối, lưới kỹ thuật, ánh neon tiết chế.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `void` #07080C · `panel` #10131B · `line` #232838 · `ink` #E8ECF5 · `muted` #8A93A6 · `acid` #C6FF3D · `cyan` #3DF2E0
**Font** (Google Fonts): display `Unbounded:wght@400;600;800` · body `IBM Plex Sans:wght@400;500;600` · nhãn `JetBrains Mono:wght@400;600`

**Chữ**
- Tiêu đề Unbounded, chữ hoa / thường trộn, cỡ lớn; nhãn JetBrains Mono kiểu chỉ số hệ thống `[ 02 / MODULE ]`.
**Bố cục**
- Nền void, lưới kẻ mảnh (background-image linear-gradient 1px) mờ 6%; khối panel viền line.
- Bento không đều cho tính năng; dải số liệu mono; con số lớn.
**Ảnh**
- Ảnh thật: kiến trúc đêm, ánh đèn, phần cứng cận cảnh — xử lý `grayscale contrast-125` + lớp phủ màu acid/cyan mix-blend-color.
**Khoảng trắng:** Đặc hơn: `py-20`, mật độ thông tin cao nhưng căn lưới chặt.
**Chuyển động mặc định:** Level 3 — Advanced
- `data-spotlight` cho panel, `data-scrub` cho chữ lớn, `data-particles="stars"` mật độ thấp ở hero, `data-gradient-shift` cho một dải CTA.
- `data-cursor="ring"` được phép; `data-tilt` nhẹ (4) cho thẻ.
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-type` → `features-bento` → `stats-band` → `story-pinned` → `gallery-masonry` → `cta-sky` → `footer-big`
**Được phép (ghi đè layout-guide mục 3):** lưới kỹ thuật; quầng sáng neon nhỏ
**Tránh:** gradient tím–xanh; robot / não bộ clip-art; glassmorphism tràn lan

### Preset: Bold / Experimental / Creative (`bold`)
Chữ khổng lồ, khối màu mạnh, phá lưới có kiểm soát.

**Bảng màu** (đưa vào `tailwind.config` dưới đúng các tên này): `paper` #F2EFE6 · `ink` #0F0F0F · `signal` #FF4D1F · `cobalt` #2340FF · `acid` #E9FF3B
**Font** (Google Fonts): display `Bricolage Grotesque:opsz,wght@12..96,400;12..96,800` · body `Bricolage Grotesque:opsz,wght@12..96,400;12..96,500` · nhãn `Instrument Serif`

**Chữ**
- Một family Bricolage Grotesque: tiêu đề 800 cực lớn (tràn khung, chữ chạm mép), thân 400; điểm nhấn Instrument Serif nghiêng.
**Bố cục**
- Khối màu phẳng full-bleed đổi liên tục (signal → cobalt → paper); chữ khổng lồ chồng lên ảnh.
- Phá lưới có chủ đích: ảnh lệch, chữ xoay 90°, nhãn dán (sticker) bo tròn.
**Ảnh**
- Ảnh thật tương phản mạnh, cắt sát; có thể cắt khung hình tròn / pill.
**Khoảng trắng:** Ít hơn, dày đặc năng lượng nhưng mỗi section một ý.
**Chuyển động mặc định:** Level 2 — Atmospheric
- `data-marquee` chữ lớn, `data-magnetic` CTA, `data-tilt` thẻ dự án, `data-split="chars"` cho 1 tiêu đề, `data-cursor="dot"` + `data-cursor-label`.
**Section gợi ý (id trong sections.md, theo thứ tự):** `hero-offset` → `features-bento` → `gallery-masonry` → `stats-band` → `quote-full` → `cta-type` → `footer-big`
**Được phép (ghi đè layout-guide mục 3):** chữ xoay / chồng ảnh; khối màu bão hòa
**Tránh:** pastel nhạt nhòa; bố cục an toàn đối xứng
