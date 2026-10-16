# Thư viện section — website chế độ nhanh

Mỗi section có **id biến thể** (preset trong `concept.md` gợi ý theo id). Trang chủ thường 5–8 section, trang con 3–6 section; **không lặp cùng một nhóm bố cục liền nhau** trong một trang. Biến thể dành cho trang con / trang chi tiết ở mục "Trang con & trang chi tiết" cuối file. Khung chung theo layout-guide mục 1 (`mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10 2xl:px-16`); preset quyết định màu, chữ, khoảng trắng, mức chuyển động.

Quy ước bắt buộc (để sửa riêng từng section và để lỗi một khối không lan ra cả trang):
- Mỗi section là `<section id="<tên-ngắn>" data-section="<id-biến-thể>">`, header là `<header id="top">`, footer là `<footer id="footer">`. Id viết thường, không dấu, duy nhất.
- Mỗi section **tự đủ**: không phụ thuộc class / biến JS của section khác. JS riêng (nếu có) trong `site.js` bọc theo từng khối: `document.querySelectorAll('#gallery').forEach(function (root) { try { … } catch (e) { console.error('[site] #gallery', e); } });`.
- Nền tối / sáng của section ghi ngay trên `<section>` (không dựa vào section trước).

## Hero

| Id | Khi nào | Cấu trúc |
|---|---|---|
| `hero-split` | Dịch vụ, sản phẩm cụ thể | Chữ 5–6/12 cột trái, ảnh tràn mép phải ở `lg+`; mobile chữ → ảnh |
| `hero-cinematic` | Du lịch, khách sạn, sự kiện | Ảnh tràn viền `min-h-[100dvh]`, lớp phủ gradient từ đáy, tiêu đề góc dưới-trái cực lớn, CTA + 1 dòng phụ đề |
| `hero-type` | Editorial, công nghệ, agency | Chữ là chính (8–10rem ở 2xl), ảnh nhỏ đặt lệch trong lưới, dòng thông tin dạng cột (địa điểm / năm / dịch vụ) |
| `hero-offset` | Retro, bold | 2–3 ảnh chồng lệch / xoay nhẹ, tiêu đề đè lên mép ảnh, nhãn dán bo tròn |
| `hero-scene` | Dreamy, thiên nhiên, điện ảnh | Cảnh nhiều lớp: bầu trời gradient + mây + hạt + ảnh phong cảnh hòa đáy — mẫu dưới |

`hero-scene` (Level 2–3):
```html
<section id="hero" data-section="hero-scene" class="relative min-h-[100dvh] overflow-hidden" data-clouds="3" data-clouds-band="0-55" data-particles="dust">
  <div data-layers class="absolute inset-0">
    <div data-depth="0.08" class="absolute inset-x-0 -inset-y-[8%] bg-gradient-to-b from-sky-day via-sky-dawn to-glow/60"></div>
    <div data-depth="0.18" class="absolute inset-x-0 bottom-0 top-[30%]">
      <img src="assets/img/hero-field.jpg" alt="…" class="h-full w-full object-cover object-bottom [mask-image:linear-gradient(to_bottom,transparent,black_35%)]">
    </div>
  </div>
  <div class="relative z-10 mx-auto flex min-h-[100dvh] max-w-screen-2xl flex-col justify-end px-4 pb-20 sm:px-6 lg:px-10 2xl:px-16">
    <p class="text-xs uppercase tracking-[0.3em]">Scene 01 — …</p>
    <h1 data-split="words" class="font-display text-[clamp(3.25rem,9vw,8rem)] leading-[0.95]">…</h1>
  </div>
</section>
```
Ảnh trong cảnh dùng `mask-image` để hòa vào bầu trời — không cắt cứng. Các lớp `data-depth` không gắn kèm `data-reveal` / `data-parallax`.

## Story / About

| Id | Cấu trúc |
|---|---|
| `story-editorial` | 12 cột: tiêu đề 4 cột trái dính (`lg:sticky lg:top-28`), thân 6 cột phải có chữ hoa đầu đoạn (drop cap `first-letter:`), 1 trích dẫn kéo ra lề |
| `story-letter` | Như một lá thư: khối chữ hẹp (max-w-prose) đặt **lệch** trong lưới, bên cạnh một ảnh dọc nhỏ + chú thích; chữ ký / ngày tháng cuối |
| `story-pinned` | Cảnh ghim theo cuộn: ảnh / cảnh đứng yên, 3 câu ngắn thay nhau hiện — mẫu dưới (Level 3) |

`story-pinned`:
```html
<section id="story" data-section="story-pinned" data-scene="320" class="relative">
  <div class="grid place-items-center">              <!-- con đầu tiên: tự sticky, cao 100dvh -->
    <img src="assets/img/story.jpg" alt="…" class="absolute inset-0 h-full w-full object-cover" style="transform: scale(calc(1.12 - var(--sp) * .12))">
    <div class="absolute inset-0 bg-night/40"></div>
    <div class="relative grid w-full max-w-3xl px-6 text-center [&>*]:col-start-1 [&>*]:row-start-1">
      <p data-step="0-0.34" class="font-display text-3xl lg:text-5xl">…câu 1…</p>
      <p data-step="0.34-0.68" class="font-display text-3xl lg:text-5xl">…câu 2…</p>
      <p data-step="0.68-1" class="font-display text-3xl lg:text-5xl">…câu 3…</p>
    </div>
  </div>
</section>
```
Không đặt section này trong khối có `overflow-hidden` (làm hỏng sticky). Tối đa 1–2 cảnh ghim mỗi trang.

## Feature / Service

| Id | Cấu trúc |
|---|---|
| `features-bento` | Lưới bento 6–12 cột, ô to nhỏ khác nhau (1 ô ảnh lớn, 1 ô số liệu, 2–3 ô chữ); `data-reveal-stagger` |
| `features-numbered` | Danh sách dọc số lớn `01 02 03` (font display), mỗi dòng: số · tên · mô tả · mũi tên; đường kẻ mảnh giữa dòng; hover đổi nền |
| `features-alternate` | Ảnh – chữ zigzag, **tối đa 2 cặp** rồi đổi kiểu |
| `features-tabs` | `data-tabs` của ui.js: tab trái, ảnh + mô tả phải |

## Gallery / Lookbook

| Id | Cấu trúc |
|---|---|
| `gallery-masonry` | `columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4`, ảnh `data-lightbox` |
| `gallery-lookbook` | Lưới 12 cột bất đối xứng: ảnh 7 cột cao + 2 ảnh 5 cột; chú thích nhỏ kiểu tạp chí; ảnh `data-reveal="clip"` |
| `gallery-filmstrip` | Dải ngang `overflow-x-auto snap-x data-drag-scroll`, thẻ `w-[78%] sm:w-[46%] lg:w-[30%] shrink-0`, chú thích dạng số khung "FR. 03 — Platform at dusk" |
| `gallery-filter` | `data-filter-group` của ui.js + lưới đều |

## Editorial / nhịp nghỉ

| Id | Cấu trúc |
|---|---|
| `quote-full` | Trích dẫn rất lớn (font display) trên nền màu đậm hoặc ảnh tối; tên người nói nhỏ |
| `stats-band` | Dải 3–4 số liệu `data-count-to`, nền đậm, chia cột bằng đường kẻ |
| `timeline` | Quy trình / hành trình theo mốc, đường dọc mảnh, mỗi mốc `data-reveal` |
| `marquee-band` | Dải chữ lớn chạy `data-marquee` (khẩu hiệu, tên đối tác) |

## Pricing, đánh giá, FAQ
Dùng thành phần của ui-guide: `data-switch` (giá), `data-carousel` (đánh giá), `data-accordion` (FAQ). Trình bày theo preset (editorial: bảng kẻ mảnh không thẻ; bold: khối màu).

## CTA

| Id | Cấu trúc |
|---|---|
| `cta-fullbleed` | Ảnh tràn viền + lớp phủ, tiêu đề lớn + 1 nút chính |
| `cta-type` | Tiêu đề khổng lồ là cả section, nút đặt sát chữ (`data-magnetic` khi preset cho phép) |
| `cta-sky` | Nền gradient bầu trời (`data-gradient-shift` hoặc nằm trong `data-sky`) + `data-particles="stars"` / `"fireflies"`, chữ căn giữa — kết thúc như cảnh cuối phim |

## Contact & Footer

| Id | Cấu trúc |
|---|---|
| `contact-split` | Trái: thông tin + bản đồ (iframe Google Maps) + giờ mở cửa; phải: `form[data-form]` |
| `footer-big` | Wordmark tên thương hiệu cực lớn tràn khung ở đáy, phía trên 3–4 cột link / liên hệ |
| `footer-minimal` | Một hàng: tên · liên hệ · mạng xã hội · © — trên nền tối liền với CTA cuối |

## Trang con & trang chi tiết (website nhiều trang)

| Id | Dùng cho | Cấu trúc |
|---|---|---|
| `page-hero` | Đầu mọi trang con | Tiêu đề trang lớn (font display) + 1 dòng dẫn, cao 40–55vh; ảnh nền / ảnh lệch tùy preset; breadcrumb nhỏ khi là trang chi tiết. Không lặp hero lớn của trang chủ |
| `list-cards` | Services, Projects, Collections, Blog (trang danh sách) | Lưới thẻ (ảnh + tên + mô tả 1–2 dòng + link "xem chi tiết" tới trang chi tiết **đã tạo**); có thể thêm `data-filter-group` theo nhóm |
| `teaser-row` | Trang chủ: dẫn sang trang danh sách | 2–3 mục nổi bật + link "Xem tất cả" tới trang riêng — không chép nguyên trang danh sách |
| `detail-article` | Bài viết, case study, chi tiết dịch vụ | Cột chữ `max-w-prose` (ngày, tác giả / danh mục, tiêu đề, ảnh lớn, nội dung có h2 / trích dẫn / ảnh xen), cột phụ (mục lục hoặc thông tin nhanh) ở `lg+`; cuối bài: "bài / mục liên quan" + CTA |
| `team-grid` | Team | Ảnh chân dung tỉ lệ đều (4:5) + tên + vai trò; hover hiện 1 câu giới thiệu. Không có ảnh người thật phù hợp → khối chữ cái đầu tên trên nền màu thương hiệu |
| `process-steps` | Process | Các bước đánh số theo `timeline` hoặc lưới ngang có đường nối; mỗi bước: số · tên · mô tả ngắn |
| `contact-page` | Contact | `contact-split` + giờ làm việc + FAQ ngắn (`data-accordion`) nếu BA chọn FAQ mà không có trang riêng |

Header / footer dùng chung mọi trang (cùng markup); mục menu trang hiện tại `aria-current="page"`.
