# Bố cục, responsive và chống "trông như AI" — áp dụng cho mọi prototype

Áp dụng cho `prototype`, `prototype-fix`, `quick-prototype`, `quick-revise`. Khi khác taste skill về **độ rộng khung nội dung**, theo file này (taste skill gợi ý `max-w-7xl` = 1280px, quá hẹp trên màn 1920px).

Tool QA mở trang ở 375 / 768 / 1440px và **đo ở 1920px**: nội dung chiếm dưới 72% bề ngang bị báo "Bố cục dồn giữa", tràn ngang ở 375px bị báo lỗi.

## 1. Dùng hết bề ngang — không dồn cục vào giữa

- **Section = lớp ngoài tràn viền + khung trong rộng.** Lớp ngoài full-width mang nền / ảnh / màu; khung trong:
  - Website / landing: `mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10 2xl:px-16`.
  - Hệ thống quản trị: vùng nội dung `min-w-0 flex-1` lấp hết phần còn lại cạnh sidebar; giới hạn bằng token `max-w-content` (≥ 1600px), không thêm `max-w-*` khác. Bảng, dashboard, kanban chiếm toàn bộ bề ngang vùng nội dung.
- **Cấm** bọc cả trang hoặc cả section bằng `max-w-3xl … max-w-7xl mx-auto`. Khung hẹp chỉ dành cho: đoạn văn (`max-w-prose` / 65ch), form đơn lẻ (đăng nhập, liên hệ), trích dẫn — và khi đó khối hẹp nằm **trong lưới cùng nội dung khác** (ví dụ form bên phải, thông tin liên hệ + bản đồ bên trái), không đứng một mình giữa hai khoảng trắng.
- **Lưới thêm cột khi màn rộng:** thẻ sản phẩm / dịch vụ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`; KPI `grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6`; ảnh gallery dạng masonry / bento trải hết khung.
- **Hero:** mặc định tách đôi — chữ bên trái (khoảng 5–6/12 cột), hình bên phải **tràn tới mép phải màn hình** ở `lg+`; mobile xếp chồng chữ → hình. Landing có preset (`concept.md`) thì dùng biến thể hero preset gợi ý trong [sections.md](sections.md) (cảnh toàn màn, chữ là chính, ảnh chồng lệch…) — miễn là tràn hết bề ngang. Không đặt hero căn giữa trên nền tối trơn (trừ khi thông điệp chính là thiết kế).
- Trên màn ≥ 1920px không để mỗi bên trống quá ~15%: kéo nền / ảnh tràn viền, tăng cột lưới, tăng `gap` và cỡ chữ tiêu đề ở `2xl:`.

## 2. Đẹp trên cả máy tính và điện thoại (mobile-first)

- Viết class cho mobile trước, rồi thêm `sm: md: lg: xl: 2xl:`. Mỗi bố cục nhiều cột phải ghi rõ dạng một cột dưới `md`.
- **Điều hướng:** mobile là nút menu → drawer / sheet toàn màn hình (đóng bằng nút X, Esc, chạm nền); desktop là menu ngang (website) hoặc sidebar (quản trị; dưới `lg` thành drawer). Header dính trên cùng, gọn.
- **Chữ:** tiêu đề co giãn theo màn (`text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl`); thân bài tối thiểu 16px trên mobile; dòng chữ không quá ~75 ký tự.
- **Chạm:** nút và vùng bấm cao ≥ 44px trên mobile; nút kêu gọi chính rộng hết khung trên mobile. Landing nên có thanh liên hệ dính đáy trên mobile (Gọi / Zalo / Đặt lịch) nếu ngành cần.
- **Không tràn ngang:** ảnh `w-full h-auto object-cover` có `aspect-*`; con của flex có `min-w-0`; chuỗi dài `break-words`; bảng dưới `md` thành thẻ hoặc cuộn ngang trong khung riêng. Không dùng `w-screen` (tính cả thanh cuộn → tràn).
- Hero cao toàn màn dùng `min-h-[100dvh]`, không dùng `h-screen`.

## 3. Chống "trông như AI"

> **Preset thắng mục này** ở những điểm preset ghi "Được phép" (ví dụ preset Dreamy cho phép gradient bầu trời, quầng sáng, hạt sáng, hero căn giữa). Mục 1–2 (bề ngang, responsive) thì preset không được ghi đè.

**Không dùng:** gradient tím–xanh, blob mờ trôi nổi, kính mờ (glassmorphism) khắp nơi, emoji làm icon, ba thẻ tính năng giống hệt nhau xếp hàng, mọi thứ căn giữa, khẩu hiệu sáo rỗng ("Nâng tầm trải nghiệm", "Giải pháp toàn diện", "Đồng hành cùng bạn"), lorem ipsum, số liệu tròn trịa giả ("10.000+ khách hàng hài lòng", "99% hài lòng").

**Thay bằng:**
- Nội dung cụ thể của **đúng doanh nghiệp này**: tên sản phẩm / dịch vụ, giá, địa chỉ, giờ mở cửa, quy trình — **viết tiếng Anh tự nhiên** (tránh lỗi phông tiếng Việt), số liệu có vẻ thật (`1,284 orders`, `4.8/5 from 326 reviews`).
- Một **điểm nhấn thị giác riêng** hợp thương hiệu (ví dụ: tiệm bánh — ảnh cận cảnh + chữ viết tay cho nhãn giá; luật — chữ có chân, đường kẻ mảnh, nhiều khoảng trắng; spa — tông đất, ảnh mềm, bo góc lớn).
- **Một ý tưởng thị giác xuyên suốt:** cùng hệ màu, font, kiểu xử lý ảnh, kiểu nhãn nhỏ và nhịp chuyển động từ hero tới footer — section nào cũng nhận ra là "cùng một trang".
- **Nhịp section đa dạng:** landing 6+ section dùng ít nhất 4 kiểu bố cục khác nhau (biến thể trong [sections.md](sections.md)) (tách đôi, bento, dải số liệu, trích dẫn lớn, lưới ảnh, timeline quy trình, bảng giá…); không lặp ảnh-trái/chữ-phải quá 2 lần liên tiếp.
- **Màu:** 1 màu chủ đạo + thang trung tính + tối đa 1 màu nhấn; nền section xen kẽ nhẹ (trắng / trung tính rất nhạt / một dải màu chủ đạo đậm). Chữ căn trái là mặc định.
- **Font hỗ trợ tiếng Việt đầy đủ:** Be Vietnam Pro, Lexend, Nunito Sans, Manrope, Montserrat; tiêu đề sang trọng: Playfair Display, Lora, Cormorant Garamond. Tối đa 2 font.
- **Ảnh:** ảnh chụp thật, đúng chủ đề, lấy qua công cụ `search_images` / `use_image` theo [image-guide.md](image-guide.md). Cấm link tự nghĩ, picsum / placeholder, ảnh AI tạo, hình SVG giả làm ảnh chụp.
- **Icon:** SVG nét (kiểu Lucide), cùng độ dày nét; không emoji.
- **Chuyển động & tương tác hợp phong cách:** theo [motion-guide.md](motion-guide.md) — dùng thư viện `assets/js/motion.js` (tool sinh sẵn) bằng thuộc tính `data-*`, không tự viết lại.

## 4. Tự kiểm trước khi kết thúc

1. Ở 1920px: nội dung có trải gần hết bề ngang không, hay chỉ một cột hẹp giữa trang?
2. Ở 375px: có phần tử nào tràn ngang, chữ quá nhỏ, nút quá sát nhau không? Menu mở / đóng được không?
3. Có thứ nào trong danh sách "Không dùng" ở mục 3 không? Trang có "sống" không — hover cho mọi thứ bấm được, hiệu ứng cuộn / chuột đúng mức đã chọn trong motion-guide?
4. Nội dung có đúng ngành, đúng tên doanh nghiệp, viết tiếng Anh tự nhiên không?
