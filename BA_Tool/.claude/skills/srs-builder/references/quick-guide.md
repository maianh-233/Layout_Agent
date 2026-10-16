# Chế độ nhanh — Website nhiều trang từ cấu hình (không có SRS)

Mục tiêu: **một website hoàn chỉnh, nhiều trang, điều hướng thật, thiết kế nhất quán, ảnh đúng chủ đề** để show khách — từ cấu hình BA nhập ở màn hình Quick Create. Không viết SRS, không hỏi lại. Không biến mọi chủ đề thành một landing page dài.

## `quick-prototype`

1. Đọc **hết** `PROJECT_DIR/concept.md` — chỉ file này trong `PROJECT_DIR`. File gồm: chủ đề, thương hiệu, mục đích, ngôn ngữ, preset, mức chuyển động, màu, font (kèm kết quả tool kiểm tra font), section BA chọn + mô tả riêng, trạng thái công cụ ảnh, và **chú thích bổ sung nguyên văn ở cuối** (đọc tới dòng cuối). Dự án cũ chưa có `concept.md` → đọc `request.md` và chọn một preset trong [presets.md](presets.md).
2. Gọi skill `design-taste-frontend`, rồi đọc [layout-guide.md](layout-guide.md), [sections.md](sections.md), [motion-guide.md](motion-guide.md), [ui-guide.md](ui-guide.md), [image-guide.md](image-guide.md).
   **Thứ tự ưu tiên khi khác nhau:** ràng buộc cụ thể của BA (chú thích, mô tả section, màu, font) → các mục khác của `concept.md` → preset → các guide này → taste skill. Preset thay cho "màu / font / mức chuyển động tự chọn" của taste skill; mục "Được phép" của preset ghi đè "Không dùng" của layout-guide. Hiệu ứng **chỉ dùng `motion.js` + `atmos.js` + `ui.js`** (tool sinh sẵn), không GSAP / Swiper / three.js…
3. **Lập sitemap trước khi viết HTML** và ghi `TARGET_DIR/_build/sitemap.json` (định dạng dưới):
   - Từ chủ đề + mục đích + section BA chọn, quyết định các trang. Thường **4–7 trang**: Home + các trang theo mục đích (About, Services, Projects / Portfolio, Collections, Gallery, Blog, FAQ, Contact…) + **2–3 trang chi tiết mẫu** khi có danh sách (service-…, project-…, article-…). Không website nào bắt buộc có đủ mọi trang.
   - Chỉ dựng **một trang** khi BA nói rõ (chú thích) hoặc chủ đề thật sự là một chiến dịch / sự kiện ngắn — ghi lý do vào `adjustments`.
   - Phân bổ section vào **đúng trang**: trang chủ chỉ giữ hero + phần giới thiệu ngắn / nổi bật dẫn sang trang riêng (ví dụ 3 bài blog mới → trang Blog; 3 dự án nổi bật → trang Projects). Không lặp nguyên nội dung giữa các trang.
   - Mỗi trang một mục đích rõ ràng; ghi vào `purpose`.
   - Chức năng cần backend mà chưa có (gửi form, đặt chỗ, thanh toán, đăng nhập) → dựng giao diện bản demo và ghi vào `limitations`; **không giả vờ đã hoạt động**. Không tự thêm thương mại điện tử nếu BA không yêu cầu.
4. **Bản thiết kế** (trong đầu, không ghi file riêng): khách mục tiêu, hành động chính, **một ý tưởng thị giác đặc trưng** xuyên suốt mọi trang (ghi `visualIdea`), biến thể section theo sections.md (không hai section liền nhau cùng nhóm bố cục), mức chuyển động (motion-guide mục 1 + `concept.md`), **3+ thành phần tương tác** hợp ngành (ui-guide). Thông tin BA chưa nói → tự đặt hợp lý theo ngành (nội dung mẫu, nghe như thật, không bịa số liệu "đã xác nhận").
5. **Ảnh theo từng trang** (image-guide): liệt kê vị trí cần ảnh của từng trang trong `images` của sitemap, tìm → tải → mở xem kiểm tra **trước khi** viết trang đó. Cập nhật `file` / `status` trong sitemap.json sau khi có ảnh.
6. Ghi vào `TARGET_DIR`, **mỗi file ghi một lần bằng Write** (không đọc lại file vừa ghi, không sửa vụn từng dòng). Mọi trang HTML nằm **ngay ở gốc** `TARGET_DIR` (đường dẫn asset giống nhau, link giữa các trang đơn giản):

   ```
   TARGET_DIR/
   ├── _build/sitemap.json   # Ghi ĐẦU TIÊN, cập nhật ảnh ở cuối
   ├── index.html            # Trang chủ
   ├── about.html, services.html, service-<slug>.html, projects.html, project-<slug>.html,
   │   blog.html, article-<slug>.html, gallery.html, faq.html, contact.html …   # theo sitemap
   ├── assets/js/tw-config.js # tailwind.config dùng chung: màu (tên theo vai trò), fontFamily — MỘT nguồn cho mọi trang
   ├── assets/css/site.css    # :root biến màu / font + vài style Tailwind không làm được (+ reduced-motion cho animation tự viết)
   ├── assets/js/site.js      # (chỉ khi cần) logic riêng mà ui.js không có, bọc theo từng khối
   ├── assets/js/motion.js    # (CÓ SẴN — tool sinh, không sửa)
   ├── assets/js/ui.js        # (CÓ SẴN — tool sinh, không sửa) menu, tabs, accordion, carousel, lightbox, modal, form demo
   ├── assets/js/atmos.js     # (CÓ SẴN — tool sinh, không sửa) Level 2–3
   └── assets/img/            # (tool tải qua use_image, kèm CREDITS.md) — không tự thêm ảnh khác
   ```
   **Không viết `README.md`** — tool sinh README của website sau khi kiểm thử (từ sitemap.json, file thật, log ảnh, kết quả QA).
   Thứ tự: `sitemap.json` → ảnh trang chủ → `tw-config.js` + `site.css` → `index.html` → (ảnh → trang) cho từng trang còn lại → cập nhật `sitemap.json`.
7. Mỗi trang HTML:
   - `<!doctype html>`, `<html lang="…">` **đúng ngôn ngữ trong concept.md**, `<meta charset="utf-8">`, viewport, `<title>` dạng "<Tên trang> — <Thương hiệu>" (trang chủ: thương hiệu + khẩu hiệu ngắn), `<meta name="description">` cùng ngôn ngữ.
   - Toàn bộ chữ hiển thị bằng **ngôn ngữ đã chọn** (menu, nút, form, footer, alt ảnh). Không trộn ngôn ngữ.
   - `<head>`: Google Fonts `<link>` (font đã chốt + fallback theo concept.md) → `<script src="https://cdn.tailwindcss.com"></script>` → `<script src="assets/js/tw-config.js"></script>` → `<link rel="stylesheet" href="assets/css/site.css">` → `<script src="assets/js/ui.js"></script>`. Cuối `<body>`: `site.js` (nếu có) → `motion.js` → `atmos.js` (chỉ khi mức chuyển động cho phép và trang dùng thuộc tính của atmos).
   - **Header và footer giống hệt nhau trên mọi trang** (cùng thứ tự menu, cùng logo chữ thương hiệu). Mục menu của trang hiện tại có `aria-current="page"` + kiểu active. Menu điện thoại dùng `data-menu-toggle` / `data-menu` của ui.js. Footer liệt kê các trang + liên hệ + © thương hiệu.
   - Trang con có hero nhỏ (tiêu đề trang + một dòng dẫn + breadcrumb nếu là trang chi tiết) — không lặp hero lớn của trang chủ.
   - Section ghép từ [sections.md](sections.md) theo quy ước `<section id data-section>` (id duy nhất trong trang). Bố cục, responsive theo layout-guide.
   - **Mọi link / nút đều hoạt động**: tới trang có thật trong sitemap, tới `#id` có thật, mở modal, `tel:`, `mailto:`, sao chép số. Không `href="#"`, không link tới trang chưa tạo. Trang danh sách (blog, projects) chỉ liên kết tới trang chi tiết đã tạo; mục còn lại không có link (hoặc ghi "Coming soon" bằng ngôn ngữ đã chọn).
   - Form dùng `form[data-form]` của ui.js (tự báo bản demo theo ngôn ngữ). Không có backend → ghi chú nhỏ cạnh nút gửi nói rõ là bản demo.
   - Chạy được bằng `file://`: không ES module `import`, không `fetch` file local, không thư viện JS khác.
8. **Tự xem và sửa** bằng công cụ `preview`:
   1. `check_page` cho **từng trang** (rẻ, không ảnh) → sửa hết lỗi JS, file hỏng, tràn ngang, link chết, ảnh hỏng nó báo.
   2. `view_page` `full: true` trang chủ ở `width: 1440` và `375`; `view_page` (màn hình đầu) của 1–2 trang con ở 1440. Nhìn như giám đốc sáng tạo khó tính theo mục **Tự rà thẩm mỹ**.
   3. Gom mọi chỗ chưa đạt, sửa bằng Edit (gộp nhiều chỗ một lần; lỗi ở header / footer → sửa trên mọi trang), rồi `view_page` với `section: "#id"` chỉ ở khối vừa sửa.
   Tối đa **2 vòng** sửa. Công cụ báo không mở được trình duyệt → bỏ qua bước này.
9. Trả lời một dòng: số trang + hướng thiết kế + số ảnh + những gì đã sửa sau khi tự xem.

### `_build/sitemap.json`

```json
{
  "brand": "AN NAM KÝ",
  "language": "vi",
  "preset": "editorial",
  "motionLevel": 2,
  "visualIdea": "Đường chỉ khâu chạy xuyên các trang như một sợi chỉ kể chuyện",
  "purposeInferred": "",
  "pages": [
    {
      "file": "index.html",
      "title": "Trang chủ",
      "purpose": "Giới thiệu thương hiệu, dẫn sang bộ sưu tập và câu chuyện",
      "sections": [
        { "id": "hero", "catalog": "hero", "variant": "hero-type", "source": "ba", "note": "" },
        { "id": "story-teaser", "catalog": "story", "variant": "story-letter", "source": "ba", "note": "Đoạn ngắn, link sang about.html" }
      ],
      "images": [
        { "slot": "hero", "query": "silk ao dai fabric detail", "file": "assets/img/hero-lua.jpg", "status": "ok" },
        { "slot": "story-teaser", "query": "tailor hands sewing", "file": null, "status": "none" }
      ]
    }
  ],
  "adjustments": ["Bỏ Pricing vì website chỉ giới thiệu thương hiệu (theo chú thích của BA)"],
  "limitations": ["Form liên hệ là bản demo, chưa có backend"]
}
```
- `catalog`: id trong danh mục section của concept.md (`hero`, `story`, `services`, `features`, `projects`, `gallery`, `collections`, `testimonials`, `team`, `process`, `pricing`, `faq`, `blog`, `editorial`, `cta`, `contact`, `footer`); `source`: `ba` (BA chọn) / `ai` (AI thêm).
- `images[].status`: `ok` (đã tải, đang dùng) / `none` (không có ảnh phù hợp hoặc công cụ ảnh lỗi → bố cục không ảnh).
- Tool đối chiếu file này với trang thật, section BA chọn, ảnh đã tải — sai lệch thành lỗi QA.

## Tự rà thẩm mỹ (khi xem ảnh chụp)

- **Màn hình đầu** trang chủ (1440): trong 3 giây hiểu được thương hiệu là ai, website để làm gì, bấm vào đâu. Tiêu đề đủ lớn, CTA nổi bật, ảnh hero rõ chủ thể, chữ không đè lên mặt người / chủ thể.
- **Nhất quán giữa các trang**: cùng header / footer, cùng màu, font, nhịp khoảng trắng, kiểu nút; trang con không "lạc" sang phong cách khác.
- **Phân cấp chữ**: mỗi section một tiêu đề rõ; dòng ≤ 70 ký tự Latin; không khối chữ dày đặc.
- **Nhịp & lặp nhàm**: section cách đều; không quá 2 section liền nhau cùng kiểu; đổi bố cục / nền.
- **Màu & tương phản**: chữ đọc rõ trên nền và trên ảnh; màu BA yêu cầu dùng có chủ đích.
- **Ảnh**: đúng chủ đề của **trang / section đó**, không méo (`object-cover` + tỉ lệ cố định), không lặp một ảnh ở nhiều vị trí.
- **Điện thoại (375)**: không tràn ngang, chữ ≥ 14px, nút ≥ 44px, menu thu vào nút.
- **Kết trang**: trang chính có khối CTA cuối trước footer dẫn tới liên hệ.

## `quick-revise` — sửa theo góp ý

1. Đọc `PROJECT_DIR/feedback.md` (góp ý của BA / khách, hoặc danh sách lỗi QA — gồm cả lỗi kiểm tra bằng code như ngôn ngữ, sitemap, màu / font BA yêu cầu, link giả), rồi `TARGET_DIR/_build/sitemap.json` (nếu có) để biết các trang. Chỉ mở những file cần sửa.
   **Có mục "Phạm vi" (một section của một trang)** → không đọc cả trang: `Grep` tìm `id="<section>"` và `</section>` trong đúng file, `Read` đúng đoạn đó (offset / limit), sửa trong khối đó (đổi biến thể được, giữ nguyên `id`), xem lại bằng `view_page` với `page` + `section: "#<id>"` ở 1440 và 375. Không gọi taste skill, không chụp toàn trang.
   Góp ý đổi phong cách cả website ("sang trọng hơn", "kiểu retro") → sửa màu / font trong `assets/js/tw-config.js` (và `site.css`) theo preset tương ứng trong [presets.md](presets.md) trước, rồi mới sửa từng section — không viết lại trang. Website cũ còn `tailwind.config` nằm trong từng trang → sửa đồng bộ mọi trang.
   Góp ý về header / footer / menu → sửa giống nhau trên **mọi** trang.
   Góp ý "thêm trang …" → thêm trang mới theo bước 7 của `quick-prototype`, thêm vào menu header / footer của mọi trang và vào sitemap.json.
2. Góp ý về thẩm mỹ / bố cục lớn → gọi `design-taste-frontend` và đọc [layout-guide.md](layout-guide.md) trước khi sửa. Góp ý nhỏ → sửa thẳng.
   Góp ý về ảnh ("đổi ảnh hero", "thiếu hình", "ảnh không đúng") → làm theo [image-guide.md](image-guide.md) (tìm theo đúng trang / section → tải → mở xem), cập nhật sitemap.json. Không dùng link ngoài.
   Góp ý về hiệu ứng → [motion-guide.md](motion-guide.md), tăng / giảm bằng `data-*` (không sửa `motion.js` / `atmos.js`). Cần atmos mà trang chưa nạp → thêm `<script src="assets/js/atmos.js"></script>` sau motion.js.
   Góp ý về tương tác → [ui-guide.md](ui-guide.md), dùng `data-*` của `ui.js` (không sửa `ui.js`).
3. Lỗi QA:
   - *Bố cục dồn giữa* → layout-guide mục 1. *Tràn ngang* → layout-guide mục 2. *Lỗi JavaScript / Không tải được file* → sửa script, đường dẫn tương đối.
   - *Ảnh không đúng nguồn / Ảnh hỏng / Ảnh chưa dùng* → thay / gắn ảnh lấy qua `search_images` + `use_image` (image-guide).
   - *Link hỏng / Link giả* → trỏ tới trang / `#id` có thật hoặc tạo trang còn thiếu.
   - *Ngôn ngữ* → sửa `lang` và dịch phần chữ sai ngôn ngữ. *Thương hiệu* → đưa đúng tên vào title / header / footer.
   - *Màu / Font BA yêu cầu* → đưa đúng mã màu / font vào `tw-config.js` + `site.css`. *Mức chuyển động* → thêm / bỏ thuộc tính `data-*` cho khớp level.
   - *Sitemap* → tạo trang còn thiếu hoặc cập nhật sitemap.json cho khớp trang thật.
4. Sửa đúng chỗ bằng Edit; giữ nguyên phần khách không góp ý. Không xóa file. Không viết README.md (tool sinh lại).
5. Xem lại bằng `view_page` (`page` + `section: "#id"`) cho từng khối đã sửa; góp ý toàn website → `full: true` trang chủ ở 1440. Lỗi tràn / link → `check_page` trang đó. Chưa đạt thì sửa thêm một vòng.
6. Trả lời một dòng tóm tắt đã sửa gì.
