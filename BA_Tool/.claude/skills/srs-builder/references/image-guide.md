# Ảnh trong prototype / website — ảnh thật, đúng chủ đề

## Luật bắt buộc

1. **Chỉ lấy ảnh qua hai công cụ của tool:** `search_images` (tìm) → `use_image` (tải về `assets/img/` + ghi nguồn vào `assets/img/CREDITS.md`). Trong HTML / CSS chỉ dùng đường dẫn tương đối tới file trong `assets/img/`.
2. **Cấm:** link ảnh tự nghĩ ra / đoán mã (kể cả `images.unsplash.com/photo-…`), `picsum.photos`, `placehold.co`, `via.placeholder.com`, `dummyimage`, `loremflickr`, `source.unsplash.com`, ảnh do AI tạo, ảnh `data:` base64, và **hình vẽ SVG / CSS giả làm ảnh chụp**. Icon nét, logo chữ, hoa văn trang trí trừu tượng thì được.
3. **Đúng chủ đề của vị trí đặt:** ảnh khớp ngành, sản phẩm, bối cảnh **của trang và section đó** (hero tiệm bánh = bánh của tiệm; trang dịch vụ niềng răng = ca niềng răng, không phải bệnh viện chung chung). Ưu tiên bối cảnh châu Á / Việt Nam khi phù hợp.
4. **Không tuyên bố có ảnh khi chưa có:** chỉ ghi `"status": "ok"` trong sitemap khi `use_image` đã trả về đường dẫn và trang đã dùng file đó.

## Cách làm — theo từng trang

1. **Lập danh sách vị trí cần ảnh cho từng trang** (chế độ nhanh: ghi vào `images` của trang trong `_build/sitemap.json`), ví dụ:
   - Hero trang chủ: ảnh chủ đạo mang tinh thần thương hiệu.
   - About: ảnh thể hiện câu chuyện / con người / nơi làm việc.
   - Services / trang chi tiết dịch vụ: mỗi dịch vụ một ảnh đúng dịch vụ đó.
   - Projects / Collections: ảnh tương ứng từng dự án / bộ sưu tập.
   - Gallery: 6–10 ảnh đa dạng nhưng cùng tông.
   - Contact: chỉ dùng ảnh nếu thật sự hợp (không bắt buộc).
   Không section nào bắt buộc phải có ảnh. Website nhiều trang thường **10–25 ảnh**; hệ thống quản trị chỉ cần ảnh trang đăng nhập / ảnh sản phẩm trong dữ liệu giả — avatar dùng chữ cái đầu tên.
2. `search_images` với từ khóa **tiếng Anh, 2–4 từ, chủ thể chính đứng đầu**, viết riêng cho từng vị trí (kết hợp chủ đề + nội dung section + phong cách: `"glacier blue ice cave"`, `"tailor hands silk"`), `orientation` theo khung (hero / dải ngang → `landscape`, thẻ dọc → `portrait`). Không dùng một từ khóa chung cho cả website.
3. Đọc tiêu đề + tag, chọn id khớp nhất, ưu tiên ảnh đủ lớn (hero ≥ 1600px ngang). Ảnh đánh dấu `ĐÃ DÙNG` → chọn ảnh khác (chỉ dùng lại khi thật sự hợp lý). Không khớp → tìm lại bằng từ khóa khác (đồng nghĩa, rộng hơn, hẹp hơn). **Tối đa 3 lần tìm cho một vị trí.**
4. `use_image(id, name, purpose)` với `name` gợi nhớ trang + vị trí (`about-xuong-may`, `service-nieng-rang`), `purpose` ghi trang và vị trí (`"about.html — ảnh xưởng may"`).
5. **Mở file ảnh vừa tải bằng Read để tự kiểm tra** nội dung đúng chủ đề, không chữ / logo / watermark lạ, chất lượng ổn. Sai → chọn ảnh khác (ghi đè cùng `name`).
6. HTML: `<img src="assets/img/about-xuong-may.jpg" alt="<mô tả đúng nội dung ảnh, bằng ngôn ngữ của website>" class="… object-cover" width height>` trong khung có `aspect-*` và **nền dự phòng** (màu thương hiệu nhạt) để khung không trống nếu ảnh lỗi; `loading="lazy"` trừ ảnh hero.
7. Cập nhật `images[].file` / `status` trong sitemap.json.

## Khi công cụ ảnh lỗi

- Tool tự chuyển nguồn (Pexels → Unsplash → Openverse) khi một nguồn hỏng khóa / hết hạn mức — một lượt tìm lỗi nghĩa là **mọi nguồn** đều lỗi.
- `search_images` trả lỗi → thử lại **một** lần với từ khóa khác. Vẫn lỗi → **dừng tìm ảnh** cho cả lượt (không gọi lặp lại), mục 7 của `concept.md` cũng có thể đã báo trước công cụ không khả dụng.
- `use_image` lỗi tải (link hỏng, file quá nhỏ) → chọn id khác trong cùng kết quả.
- **Không tìm được ảnh phù hợp** → **không** chèn ảnh sai chủ đề hay ảnh tự tạo, không link ngoài: đổi bố cục vị trí đó sang khối chữ / số liệu / màu thương hiệu / hoa văn trừu tượng, ghi `"status": "none"` + từ khóa dự kiến trong sitemap.json (chế độ nhanh — README của website do tool liệt kê "cần ảnh thật từ khách"); prototype có SRS thì ghi vào `README.md` mục "Cần ảnh thật từ khách: <vị trí>".

Một ảnh dùng một lần trên toàn website; không dùng cùng một ảnh cho nhiều sản phẩm / dự án khác nhau.
