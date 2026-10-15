# Ảnh trong prototype — ảnh thật, đúng chủ đề

## Luật bắt buộc

1. **Chỉ lấy ảnh qua hai công cụ của tool:** `search_images` (tìm) → `use_image` (tải về `assets/img/` + ghi nguồn vào `assets/img/CREDITS.md`). Trong HTML chỉ dùng đường dẫn tương đối tới file trong `assets/img/`.
2. **Cấm:** link ảnh tự nghĩ ra / đoán mã (kể cả `images.unsplash.com/photo-…`), `picsum.photos`, `placehold.co`, `via.placeholder.com`, `dummyimage`, `loremflickr`, `source.unsplash.com`, ảnh do AI tạo, ảnh `data:` base64, và **hình vẽ SVG / CSS giả làm ảnh chụp** (bánh, người, phòng khám… vẽ bằng SVG). Icon nét, logo chữ, hoa văn trang trí trừu tượng thì được.
3. **Đúng chủ đề:** ảnh phải khớp ngành, sản phẩm, bối cảnh **của vị trí đặt** (hero tiệm bánh = bánh của tiệm, không phải bánh mì công nghiệp; phòng khám nha = nha sĩ / ghế nha, không phải bệnh viện chung chung). Ưu tiên bối cảnh châu Á / Việt Nam khi phù hợp (người, món ăn, cửa hàng).

## Cách làm

1. Lập danh sách vị trí cần ảnh trước khi viết HTML (ví dụ: hero, 3 sản phẩm, không gian cửa hàng, đội ngũ, quy trình). Landing page thường **5–10 ảnh**; hệ thống quản trị chỉ cần ảnh cho trang đăng nhập / ảnh sản phẩm trong dữ liệu giả (nếu có) — avatar dùng chữ cái đầu tên.
2. `search_images` với từ khóa **tiếng Anh, 2–4 từ, chủ thể chính đứng đầu** (`"birthday cake strawberry"`, `"dentist patient chair"`, `"vietnamese pho bowl"`), chọn `orientation` theo khung (hero ngang → `landscape`, thẻ dọc → `portrait`).
3. Đọc tiêu đề + tag trong kết quả, chọn id khớp nhất, ưu tiên ảnh đủ lớn (hero ≥ 1600px chiều ngang). Không khớp → tìm lại bằng từ khóa khác (đồng nghĩa, rộng hơn, hẹp hơn). Tối đa 3 lần tìm cho một vị trí.
4. `use_image(id, name, purpose)` với `name` gợi nhớ (`hero-banh-kem`, `sp-tiramisu`).
5. **Mở file ảnh vừa tải bằng Read để tự kiểm tra** nội dung đúng chủ đề, không có chữ / logo / watermark lạ, chất lượng ổn. Sai → chọn ảnh khác (ghi đè cùng `name`).
6. HTML: `<img src="assets/img/hero-banh-kem.webp" alt="<mô tả tiếng Việt đúng nội dung ảnh>" class="… object-cover" width height>` trong khung có `aspect-*` và nền dự phòng; `loading="lazy"` trừ ảnh hero.
7. **Không tìm được ảnh phù hợp** (hết lượt tìm, lỗi mạng): **không** chèn ảnh sai chủ đề hay ảnh tự tạo — đổi bố cục vị trí đó sang khối chữ / số liệu / màu thương hiệu, và ghi vào `README.md` mục "Cần ảnh thật từ khách: <vị trí>".

Một ảnh dùng một lần trên trang; không dùng cùng một ảnh cho nhiều sản phẩm khác nhau.
