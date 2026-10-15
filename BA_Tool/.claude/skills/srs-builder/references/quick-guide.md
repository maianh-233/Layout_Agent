# Chế độ nhanh — Landing page từ mô tả (không có SRS)

Mục tiêu: **có ngay một landing page đẹp để show khách**, tốn ít lượt AI nhất. Không viết SRS, không hỏi lại, không tạo file ngoài danh sách dưới.

## `quick-prototype`

1. Đọc `PROJECT_DIR/concept.md` — **chỉ file này** trong `PROJECT_DIR` (đã gồm mô tả của BA, preset thiết kế, mức chuyển động, section BA muốn). Dự án cũ chưa có `concept.md` → đọc `request.md` và chọn một preset trong [presets.md](presets.md).
2. Gọi skill `design-taste-frontend`, rồi đọc [layout-guide.md](layout-guide.md), [sections.md](sections.md), [motion-guide.md](motion-guide.md), [ui-guide.md](ui-guide.md) và [image-guide.md](image-guide.md).
   **Thứ tự ưu tiên khi khác nhau:** mô tả của BA → preset trong `concept.md` → các guide này → taste skill. Preset thay cho "màu / font / mức chuyển động tự chọn" của taste skill; mục "Được phép" của preset ghi đè danh sách "Không dùng" của layout-guide. Về hiệu ứng, **chỉ dùng `motion.js` + `atmos.js` + `ui.js` (tool sinh sẵn)** thay cho thư viện taste skill gợi ý (GSAP, Framer Motion, Swiper, three.js…).
3. Lập **bản thiết kế** trong đầu (không cần hỏi, không ghi file riêng): ngành, khách mục tiêu, hành động chính (gọi / đặt lịch / mua / đăng ký), **một ý tưởng thị giác đặc trưng** xuyên suốt từ hero tới footer (thứ khách nhớ sau khi đóng trang), danh sách section theo id biến thể trong sections.md (theo preset / BA; không hai section liền nhau cùng nhóm bố cục), **mức chuyển động** (motion-guide mục 1) và **3+ thành phần tương tác** hợp ngành (ui-guide). Thông tin BA chưa nói → tự đặt hợp lý theo ngành (tên, giá, địa chỉ… nghe như thật).
4. Lấy đủ ảnh cho các vị trí theo image-guide (tìm → tải → mở xem kiểm tra) **trước khi** viết `index.html`.
5. Ghi vào `TARGET_DIR`, **mỗi file ghi một lần bằng Write** (không đọc lại file vừa ghi, không sửa vụn từng dòng):

   ```
   TARGET_DIR/
   ├── index.html          # Toàn bộ landing page
   ├── assets/js/motion.js # (CÓ SẴN — tool sinh, không sửa) hiệu ứng cuộn / chuột qua data-*
   ├── assets/js/ui.js     # (CÓ SẴN — tool sinh, không sửa) menu, tabs, accordion, carousel, lightbox, modal, form qua data-*
   ├── assets/js/atmos.js  # (CÓ SẴN — tool sinh, không sửa) mây, hạt sáng, bầu trời đổi màu, cảnh nhiều lớp, cảnh ghim (Level 2–3)
   ├── assets/js/site.js   # (chỉ khi cần) logic riêng của trang mà ui.js không có
   ├── assets/img/         # (tool tải qua use_image, kèm CREDITS.md) — không tự thêm ảnh khác
   ├── assets/css/site.css # (tùy chọn, ngắn) vài style Tailwind không làm được
   └── README.md           # 5–8 dòng: preset + ý tưởng thị giác, mức chuyển động, danh sách section (id → biến thể), cách mở
   ```
   Chỉ thêm trang con (ví dụ `pages/bang-gia.html`) khi mô tả của BA yêu cầu rõ.
6. `index.html`:
   - Toàn bộ nội dung trang viết **tiếng Anh** (tránh lỗi phông tiếng Việt). `<html lang="en">`, `<meta charset="utf-8">`, `<meta name="viewport" …>`, `<title>` tên doanh nghiệp.
   - Tailwind CDN `https://cdn.tailwindcss.com` + `tailwind.config` khai báo ngay trong `<head>`, lấy từ preset: `colors` dùng **đúng tên màu của preset** (`extend.colors`), `fontFamily.display` / `fontFamily.body` (+ `label` nếu có), Google Fonts của preset trong `<link>`. Mọi màu / font trong trang dùng các tên này — đổi phong cách sau này chỉ cần sửa config.
   - 6–9 section ghép từ [sections.md](sections.md), đúng quy ước `<section id data-section>` ở đầu file đó (sửa được từng section, lỗi không lan). Theo bố cục và responsive của layout-guide.
   - Trong `<head>` sau Tailwind: `<script src="assets/js/ui.js"></script>`. Cuối `<body>`: `site.js` (nếu có) → `<script src="assets/js/motion.js"></script>` → `<script src="assets/js/atmos.js"></script>` (chỉ khi dùng thuộc tính của atmos). Gắn hiệu ứng theo mức đã chọn; mọi thứ bấm được có hover (motion-guide mục 3).
   - Mọi nút / link đều hoạt động: cuộn tới section, mở modal đặt lịch, gọi `tel:`, sao chép số, Zalo / Messenger dạng link giả. Không để `href="#"`.
   - Form dùng `form[data-form]` của ui.js (kiểm lỗi tiếng Việt, trạng thái đang gửi, lưu `localStorage`, thông báo thành công) — không tự viết lại.
   - Chạy được khi mở bằng `file://`: không ES module `import`, không `fetch` file local, không thư viện JS khác.
7. **Tự xem và sửa** bằng công cụ `preview` (tool chụp trang thật qua Chromium, đúng như khách mở):
   1. `check_page` → sửa hết lỗi JS, file hỏng, tràn ngang, link chết nó báo.
   2. `view_page` với `full: true` ở `width: 1440`, rồi ở `width: 375`. Nhìn từng ảnh như giám đốc sáng tạo khó tính, theo danh sách ở mục **Tự rà thẩm mỹ** dưới đây.
   3. Gom mọi chỗ chưa đạt, sửa bằng Edit (gộp nhiều chỗ một lần), rồi `view_page` với `section: "#id"` chỉ ở khối vừa sửa để xác nhận.
   Tối đa **2 vòng** sửa; không chụp lại toàn trang khi chỉ sửa một khối. Công cụ báo không mở được trình duyệt → bỏ qua bước này.
8. Trả lời một dòng: hướng thiết kế + số section + số ảnh + những gì đã sửa sau khi tự xem.

## Tự rà thẩm mỹ (khi xem ảnh chụp)

- **Màn hình đầu** (ảnh đầu tiên ở 1440): trong 3 giây hiểu được bán gì, cho ai, bấm vào đâu. Tiêu đề đủ lớn và đậm, CTA nổi bật nhất màn hình, ảnh hero rõ chủ thể, không bị chữ đè lên mặt người / sản phẩm.
- **Phân cấp chữ**: mỗi section có một tiêu đề lớn rõ ràng; đoạn văn không quá 70 ký tự mỗi dòng; không có khối chữ dày đặc.
- **Nhịp khoảng trắng**: các section cách đều nhau (thường `py-20 lg:py-28`), không có khoảng trống thừa bất thường hay hai khối dính sát.
- **Lặp nhàm**: không quá 2 section liền nhau cùng một kiểu (ví dụ ba lưới 3 thẻ liên tiếp) — đổi bố cục, đổi nền (sáng / tối / màu thương hiệu nhạt).
- **Màu & tương phản**: chữ đọc rõ trên nền và trên ảnh (thêm lớp phủ tối nếu cần); màu thương hiệu dùng có chủ đích, không loè loẹt.
- **Ảnh**: đúng chủ đề, không méo, cắt khung đẹp (`object-cover` + tỉ lệ cố định), các ảnh trong một lưới cùng tỉ lệ.
- **Căn lề**: các khối thẳng hàng cùng một khung; thẻ trong lưới cao bằng nhau; nút cùng cấp cùng kích thước.
- **Điện thoại (375)**: không tràn ngang, chữ ≥ 14px, nút bấm ≥ 44px, ảnh không quá cao, lưới về 1–2 cột hợp lý, menu thu vào nút.
- **Kết trang**: có khối CTA cuối trước footer; footer đủ thông tin liên hệ, không trống trải.

## `quick-revise` — sửa theo góp ý

1. Đọc `PROJECT_DIR/feedback.md` (góp ý của BA / khách, hoặc danh sách lỗi QA), rồi chỉ những file trong `TARGET_DIR` cần sửa.
   **Có mục "Phạm vi" (một section)** → không đọc cả `index.html`: `Grep` tìm `id="<section>"` và `</section>` để biết dòng, `Read` đúng đoạn đó (offset / limit), sửa chỉ trong khối đó (đổi biến thể được, giữ nguyên `id`), xem lại bằng `view_page` với `section: "#<id>"` ở 1440 và 375. Không gọi taste skill, không chụp toàn trang.
   Góp ý đổi phong cách cả trang ("sang trọng hơn", "kiểu retro") → đổi màu / font trong `tailwind.config` theo preset tương ứng trong [presets.md](presets.md) trước, rồi mới sửa từng section — không viết lại trang.
2. Góp ý về thẩm mỹ / bố cục lớn → gọi `design-taste-frontend` và đọc [layout-guide.md](layout-guide.md) trước khi sửa. Góp ý nhỏ (đổi chữ, màu, số điện thoại, thêm / bớt một mục) → sửa thẳng, không cần đọc thêm.
   Góp ý về ảnh ("đổi ảnh hero", "ảnh không đúng") → làm theo [image-guide.md](image-guide.md) (tìm → tải → mở xem), không dùng link ngoài.
   Góp ý "thêm hiệu ứng / sinh động hơn / bớt rối / thêm mây, hạt sáng" → đọc [motion-guide.md](motion-guide.md), tăng / giảm mức chuyển động bằng thuộc tính `data-*` (không sửa `motion.js` / `atmos.js`). Trang chưa nạp `atmos.js` mà cần → thêm `<script src="assets/js/atmos.js"></script>` sau motion.js.
   Góp ý "thêm tương tác / slider / FAQ / bảng giá theo tháng-năm / ảnh trước-sau / form đặt lịch" → đọc [ui-guide.md](ui-guide.md), dùng `data-*` của `ui.js` (không sửa `ui.js`). Trang cũ còn tự viết menu / slider / form trong `site.js` mà ui.js đã có → chuyển sang ui.js khi sửa đúng khối đó.
   Trang chưa nạp `ui.js` trong `<head>` mà cần dùng → thêm `<script src="assets/js/ui.js"></script>` sau Tailwind.
3. Lỗi QA:
   - *Bố cục dồn giữa* → làm theo layout-guide mục 1 (khung `max-w-screen-2xl`, nền tràn viền, thêm cột ở `xl/2xl`, hero tách đôi tràn mép).
   - *Ảnh không đúng nguồn / Ảnh hỏng* → thay bằng ảnh lấy qua `search_images` + `use_image` (image-guide).
   - *Tràn ngang* → layout-guide mục 2. *Lỗi JavaScript / Không tải được file* → sửa script, đường dẫn tương đối.
4. Sửa đúng chỗ bằng Edit; giữ nguyên phần khách không góp ý. Không xóa file.
5. Xem lại bằng `view_page` với `section: "#id"` cho từng khối đã sửa (góp ý về toàn trang như đổi màu / font → `full: true` ở 1440). Lỗi QA tràn ngang → `check_page` xác nhận đã hết. Chưa đạt thì sửa thêm một vòng.
6. Trả lời một dòng tóm tắt đã sửa gì.
