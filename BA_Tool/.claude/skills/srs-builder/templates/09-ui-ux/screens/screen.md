# SCR-xxx — <Tên màn hình>

| Thuộc tính | Nội dung |
|---|---|
| Mã màn hình | SCR-xxx |
| Loại | Danh sách / Chi tiết / Form tạo-sửa / Dashboard / Kanban / Trang nội dung / Đăng nhập |
| Module | |
| FR | |
| Vai trò được vào (quyền xem) | ROLE-xx (`MODULE.RESOURCE.VIEW`) |
| File prototype | pages/<module>/<screen-slug>.html |
| Đến từ | |
| Đi tới | |

## 9.10. Wireframes — Bản phác thảo giao diện

```text
┌──────────────────────────────────────────────┐
│ Topbar                                       │
├────────┬─────────────────────────────────────┤
│Sidebar │ PageHeader                          │
│        │ FilterBar                           │
│        │ DataTable                           │
│        │ Pagination                          │
└────────┴─────────────────────────────────────┘
```

Mobile: <khác biệt>

## 9.11. Screen Specifications — Đặc tả từng màn hình

Mục đích:

| Vùng | Component | Nội dung / dữ liệu | Ghi chú |
|---|---|---|---|

### Hành động

| Hành động | Vị trí | Quyền | Hiện khi | Kết quả | Chuyển trạng thái | Thông báo |
|---|---|---|---|---|---|---|

### Trạng thái màn hình

| Trạng thái | Hiển thị (nguyên văn) |
|---|---|
| Đang tải | |
| Rỗng | |
| Lỗi | |
| Không có quyền | |
| Thành công | |

### Responsive

| Kích thước | Thay đổi |
|---|---|
| Desktop (≥ 1024px) | |
| Tablet (768–1023px) | |
| Mobile (< 768px) | |

## 9.13. Form and Table Specifications — Đặc tả biểu mẫu và bảng

<!-- Chỉ giữ phần áp dụng cho màn hình này -->

### Bảng

| Cột | Trường (ENT.field) | Định dạng | Sắp xếp | Lọc | Ẩn được | Căn / độ rộng | Mobile |
|---|---|---|---|---|---|---|---|

| Bộ lọc | Kiểu | Giá trị | Mặc định |
|---|---|---|---|

Sắp xếp mặc định: · Số dòng / trang: · Thao tác hàng loạt:

### Form

| Trường | Nhãn | Component | Bắt buộc | Mặc định | Validation | Thông báo lỗi | Nhóm |
|---|---|---|---|---|---|---|---|

### Dữ liệu giả

Số bản ghi: · Ví dụ:
