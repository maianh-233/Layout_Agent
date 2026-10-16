# Thành phần tương tác — `assets/js/ui.js` (tool sinh sẵn)

`TARGET_DIR/assets/js/ui.js` **có sẵn, không sửa, không tự viết lại** menu / tab / accordion / slider / lightbox / modal / kiểm tra form trong `site.js`. Chỉ viết HTML + Tailwind và gắn `data-*`. Thư viện lo trạng thái, bàn phím, ARIA, chuyển động, khóa cuộn.

Nạp trong `<head>` (không `defer`), ngay sau Tailwind: `<script src="assets/js/ui.js"></script>`. Màu nhấn của lightbox / chấm carousel lấy theo `currentColor`; đặt `--ui-accent` trong `:root` nếu cần.

**Style trạng thái bằng Tailwind** qua class `is-active` / `is-open`: `[&.is-active]:bg-primary-600 [&.is-active]:text-white`, `[&.is-open]:rotate-180`. Không cần JS.

## Chọn thành phần theo nội dung

| Nội dung | Dùng | Mẫu |
|---|---|---|
| Menu điện thoại | `data-menu-toggle` | `<button data-menu-toggle="#mnav" class="lg:hidden" aria-label="Mở menu">…</button>` + `<div id="mnav" class="fixed inset-x-4 top-20 z-50 rounded-2xl bg-white p-6 shadow-2xl lg:hidden">…</div>` (tự ẩn, trượt mờ khi mở, nền tối, Esc / bấm link để đóng) |
| Menu desktop sáng theo section | `data-scrollspy` | `<nav data-scrollspy>` + link `class="[&.is-active]:text-primary-700"` |
| Nút về đầu trang | `data-back-to-top` | `<a href="#top" data-back-to-top class="fixed bottom-6 right-6 z-40 …">↑</a>` |
| Thực đơn theo bữa, dịch vụ theo nhóm, khóa học theo cấp | `data-tabs` | `<div data-tabs><div class="relative flex gap-2">` nút `<button data-tab="sang">` … `<span data-tab-indicator class="bottom-0 h-0.5 bg-primary-600"></span></div>` + `<div data-tab-panel="sang" class="grid …">` |
| Câu hỏi thường gặp, chi tiết gói | `data-accordion` | `<div data-accordion>` → `<div data-acc-item data-open>` (mở sẵn mục đầu) gồm `<button data-acc-trigger class="flex w-full justify-between">Câu hỏi <span data-acc-icon>+</span></button>` + `<div data-acc-panel><div class="pb-5">Trả lời</div></div>` (panel không padding, padding đặt ở con) |
| Giá theo tháng / năm, giá lẻ / combo | `data-switch` | `<section data-switch="thang">` nút `<button data-switch-to="nam">Năm <span>-20%</span></button>`, giá `<span data-show-when="thang">199.000đ</span><span data-show-when="nam">159.000đ</span>` |
| Thư viện dự án / món / sản phẩm nhiều loại | `data-filter-group` | nút `<button data-filter="all">Tất cả</button><button data-filter="bep">Bếp</button>`, thẻ `<article data-category="bep phong-khach">` |
| Đánh giá khách, sản phẩm nổi bật, ảnh dự án | `data-carousel` | `<div data-carousel data-autoplay="6000">` → `<div data-carousel-track class="gap-6">` các thẻ `class="w-[85%] sm:w-[48%] lg:w-[32%]"` + nút `data-carousel-prev` / `data-carousel-next` + `<div data-carousel-dots class="text-primary-600">` |
| Trước / sau (spa, nha khoa, cải tạo nhà, sửa xe) | `data-compare` | `<div data-compare data-before="Trước" data-after="Sau" class="aspect-[4/3] rounded-2xl"><img src="…truoc.jpg" alt="…"><img src="…sau.jpg" alt="…"></div>` (cần 2 ảnh cùng khung hình) |
| Khuyến mãi, sự kiện, mở bán | `data-countdown` | `<div data-countdown="2026-12-31T20:00">` + `<span data-cd="d">` `<span data-cd="h">` `<span data-cd="m">` `<span data-cd="s">` — đặt mốc trong tương lai |
| Bộ sưu tập ảnh | `data-lightbox` | `<a href="assets/img/du-an-1.jpg" data-lightbox="du-an" data-caption="Căn hộ 2PN, Q.7"><img …></a>` — cùng nhóm có nút trước / sau, phím ←→, vuốt |
| Form đặt lịch / báo giá trong cửa sổ | `data-modal-open` | nút `<button data-modal-open="dat-lich">` + `<dialog id="dat-lich" class="…">…<button data-modal-close aria-label="Đóng">×</button></dialog>` |
| Số điện thoại, số tài khoản, mã giảm giá | `data-copy` | `<button data-copy="0901 234 567">Sao chép</button>` |
| Form liên hệ / đặt lịch | `form[data-form]` | `<form data-form="lien-he">` — trường dùng `required`, `type="email"`, `type="tel"`, `minlength`; nhãn bọc trường (`<label>Tên<input …></label>`) hoặc trường nằm trong một khối riêng để lỗi hiện ngay dưới. **Chưa có backend → form là bản demo**: ui.js tự báo "demo, chưa gửi đi" theo `<html lang>`; không viết câu "đã gửi thành công / chúng tôi sẽ gọi lại". Ghi chú nhỏ cạnh nút gửi nói rõ là bản demo. Khối `<div data-form-success>` (nếu dùng) cũng phải nói rõ là demo |

Thông báo tự viết: `UI.toast('Đã thêm vào giỏ', 'success')` trong `site.js`.

## Mức tương tác tối thiểu của một landing page

- Menu điện thoại (`data-menu-toggle`) + header dính (`data-header` của motion.js) + scrollspy.
- Ít nhất **3** thành phần ở bảng trên hợp ngành, ví dụ: nhà hàng → tabs thực đơn + carousel đánh giá + lightbox ảnh món; spa / nha khoa → compare trước–sau + accordion FAQ + modal đặt lịch; SaaS / khóa học → switch giá + tabs tính năng + accordion FAQ; bất động sản / nội thất → filter dự án + lightbox + countdown mở bán.
- Mọi nút kêu gọi chính đều làm được gì đó: cuộn tới form, mở modal đặt lịch, `tel:`, sao chép số.
- `site.js` chỉ còn phần riêng của trang (ví dụ giỏ hàng giả, tính giá theo lựa chọn). Không có gì riêng thì không tạo `site.js`.
