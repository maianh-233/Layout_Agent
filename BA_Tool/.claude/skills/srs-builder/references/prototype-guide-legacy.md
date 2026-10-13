# Hướng dẫn dựng prototype — dự án cũ (`SRS_MODE: legacy`)

Prototype dùng để trình diễn cho khách hàng và làm tiền đề cho team frontend làm thật.

## 1. Bắt buộc

1. **Gọi skill `design-taste-frontend`** (taste skill) trước khi viết HTML. Áp dụng nó trong suốt quá trình dựng giao diện để đảm bảo thẩm mỹ.
2. **Design system lấy từ `srs/09-ui-ux/01-design-system.md`** (màu, font, khoảng cách, bo góc). Khi taste skill và SRS khác nhau, **SRS thắng**.
3. Mỗi màn hình trong `srs/09-ui-ux/03-screen-inventory.md` là **một file HTML**. Không thêm màn hình ngoài danh sách.

## 2. Công nghệ

- **Chỉ HTML + Tailwind CSS (CDN) + JavaScript thuần.** Không React, Vue, jQuery, Alpine hay bất kỳ thư viện JS nào khác.
- Tailwind: `<script src="https://cdn.tailwindcss.com"></script>`, cấu hình màu/font trong `tailwind.config` ngay sau thẻ script (giống nhau ở mọi trang, đặt trong `layout.js` hoặc lặp lại đầu mỗi trang).
- Font từ Google Fonts nếu design system chỉ định.
- Không cần bước build: mở `index.html` là chạy (kể cả qua `file://`). Vì vậy **không dùng ES module `import`, không `fetch` file JSON local** — dữ liệu nằm trong biến toàn cục của `mock-data.js`.

## 3. Cấu trúc

```
<TARGET_DIR>/
├── index.html              # Trang chủ / trang vào đầu tiên
├── <các-trang>.html        # Tên file = screen-slug trong SRS
├── assets/
│   ├── css/custom.css      # chỉ khi Tailwind không đủ
│   ├── js/layout.js        # header, footer, dải "Bản demo", menu — render vào #app-header / #app-footer
│   ├── js/mock-data.js     # window.MOCK = { products: [...], ... }
│   ├── js/app.js           # xử lý giả: giỏ hàng, lọc, tìm kiếm, đăng nhập giả, form, toast
│   └── img/                # chỉ khi cần ảnh tĩnh
└── README.md
```

Thứ tự nạp script ở mỗi trang: `mock-data.js` → `layout.js` → `app.js` → script riêng của trang (inline, ngắn).

## 4. Dữ liệu giả (`mock-data.js`)

- Nội dung **chân thực theo ngành**: tên sản phẩm/dịch vụ tiếng Việt thật, giá VNĐ (định dạng `toLocaleString('vi-VN')` + " ₫"), tên người, địa chỉ Việt Nam.
- Ảnh placeholder: dùng `https://picsum.photos/seed/<từ-khóa>/600/800` hoặc khối màu/SVG inline. Luôn có `alt`.
- Trường dữ liệu theo `07-data-requirements.md` / màn hình trong `09-ui-ux/screens/`. Đủ số lượng để trình diễn lọc, phân trang (ví dụ 12–24 sản phẩm).

## 5. Xử lý giả (`app.js`)

- Thêm vào giỏ, cập nhật số lượng, lọc/tìm kiếm/sắp xếp, phân trang, đăng nhập/đăng xuất giả, gửi form → hiện thông báo thành công, validation phía client đúng như 9.13/9.18.
- Trạng thái lưu bằng `localStorage`, **luôn bọc try/catch** (fallback biến trong bộ nhớ).
- Có đủ trạng thái **loading / rỗng / lỗi / thành công** như SRS mô tả (loading giả bằng `setTimeout` ngắn, skeleton).
- Mọi nút đều có phản hồi; nút chưa có chức năng thì hiện toast "Tính năng sẽ có ở bản chính thức".

## 6. Giao diện

- Responsive: mobile, tablet, desktop (theo 9.16).
- Một dải nhỏ cố định ghi **"Bản demo — dữ liệu giả"** (render trong `layout.js`).
- Accessibility cơ bản: tương phản đủ, focus thấy được, label cho input, `alt` cho ảnh.
- Ngôn ngữ giao diện: tiếng Việt (trừ khi SRS nói khác).

## 7. Code

- Sạch, comment ngắn ở đầu mỗi file và mỗi hàm quan trọng.
- Tên class/ID dễ hiểu (`product-grid`, `cart-drawer`, `btn-add-to-cart`). Gắn `data-screen="SCR-xxx"` vào `<body>` mỗi trang để truy vết.
- Hàm JS đặt tên rõ, gom theo tính năng (`Cart.add`, `Filters.apply`…) để dễ chuyển sang framework.

## 8. `README.md` của prototype

- Danh sách trang: `File | Màn hình | Mã SCR | Mô tả ngắn`.
- Cách chạy: mở `index.html` bằng trình duyệt (hoặc chạy một static server bất kỳ).
- Ghi chú: dữ liệu giả, xử lý giả, những gì chưa mô phỏng.
