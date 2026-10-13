# Hướng dẫn đặc tả giao diện (Phần 9) — phần quan trọng nhất của SRS

Prototype dựng từ Phần 9 phải **ra đúng ý khách**, và **đội frontend dựng tiếp** từ chính đặc tả + prototype này. Vì vậy Phần 9 phải đủ chi tiết để một lập trình viên frontend không cần đoán: mỗi màn hình rõ vùng, component, cột, trường, nút, quyền, trạng thái, responsive.

Nguồn: `answers-ui.md` (ưu tiên cao nhất), registry / phân quyền (vai trò, FR, chứng từ, thực thể), file module khi cần luồng. Khách chưa nói → chọn phương án hợp lý theo ngành, gắn `[ĐỀ XUẤT]`.

## 1. Design tokens — `srs/_design-tokens.json` (`SRS_MODE: registry`)

Bản máy đọc được của 9.2–9.5. Prototype sinh `tailwind.tokens.js` và `tokens.css` **bằng code** từ file này, nên mọi màu / chữ / khoảng cách trong prototype đều lấy từ đây. Backend kiểm tra định dạng.

```json
{
  "density": "compact",
  "colors": {
    "primary": { "50": "#EEF4FF", "100": "#D9E6FF", "200": "#BCD2FF", "300": "#8EB4FF", "400": "#598BFF", "500": "#3366FF", "600": "#1F4FE0", "700": "#1A3FB5", "800": "#1B378F", "900": "#1C3271" },
    "neutral": { "0": "#FFFFFF", "50": "#F8FAFC", "100": "#F1F5F9", "200": "#E2E8F0", "300": "#CBD5E1", "400": "#94A3B8", "500": "#64748B", "600": "#475569", "700": "#334155", "800": "#1E293B", "900": "#0F172A" },
    "success": { "50": "#ECFDF5", "100": "#D1FAE5", "500": "#10B981", "600": "#059669", "700": "#047857" },
    "warning": { "50": "#FFFBEB", "100": "#FEF3C7", "500": "#F59E0B", "600": "#D97706", "700": "#B45309" },
    "danger":  { "50": "#FEF2F2", "100": "#FEE2E2", "500": "#EF4444", "600": "#DC2626", "700": "#B91C1C" },
    "info":    { "50": "#EFF6FF", "100": "#DBEAFE", "500": "#3B82F6", "600": "#2563EB", "700": "#1D4ED8" }
  },
  "fontFamily": { "sans": "'Be Vietnam Pro', system-ui, sans-serif", "mono": "'JetBrains Mono', ui-monospace, monospace" },
  "fontSize": {
    "xs": ["12px", "16px"], "sm": ["13px", "20px"], "base": ["14px", "22px"], "lg": ["16px", "24px"],
    "xl": ["18px", "28px"], "2xl": ["22px", "30px"], "3xl": ["28px", "36px"]
  },
  "radius": { "sm": "4px", "md": "6px", "lg": "8px", "xl": "12px", "full": "9999px" },
  "shadow": { "sm": "0 1px 2px rgb(15 23 42 / 0.06)", "md": "0 4px 12px rgb(15 23 42 / 0.08)", "lg": "0 12px 32px rgb(15 23 42 / 0.12)" },
  "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px", "2xl": "1536px" },
  "layout": { "sidebarWidth": "248px", "sidebarCollapsedWidth": "64px", "topbarHeight": "56px", "contentMaxWidth": "1440px", "tableRowHeight": "40px", "controlHeight": "36px" },
  "googleFonts": ["Be Vietnam Pro:400,500,600,700"]
}
```

- `density`: `compact` (nhiều dữ liệu: bảng 36–40px/dòng, chữ base 13–14px) hoặc `comfortable` (thoáng: 48–52px/dòng, base 15–16px). Theo câu trả lời về mật độ hiển thị.
- `colors`: `primary` đủ 10 sắc độ 50→900, `neutral` 0 + 50→900, 4 màu ngữ nghĩa đủ 50/100/500/600/700. Mã HEX 6 chữ số. Màu thương hiệu của khách → sắc 500 hoặc 600 của `primary`; tự dựng các sắc còn lại. Kiểm tra tương phản chữ trắng trên 600 và chữ 700 trên nền 50 đạt WCAG AA.
- `fontSize`: `[cỡ, line-height]`. Font hỗ trợ tiếng Việt đầy đủ (Be Vietnam Pro, Inter, Nunito Sans, Lexend…).
- Màu badge trạng thái chứng từ lấy theo `tone` trong `documents[].states` của registry: `neutral → neutral`, `info → info`, `warning → warning`, `success → success`, `danger → danger`.
- Chế độ tối: chỉ khi khách yêu cầu — thêm khối `"dark": { "colors": { … } }` cùng cấu trúc `neutral` + màu nền.
- 9.3–9.5 trong `01-design-system.md` trình bày **cùng giá trị** dưới dạng bảng để người đọc, kèm lý do chọn (theo câu trả lời nào).

## 2. Thư viện component (9.12)

Màn hình **chỉ được ghép từ component trong danh sách này** (dùng đúng tên). Cần component mới thì thêm vào 9.12 trước, kèm lý do.

| Nhóm | Component | Biến thể / trạng thái phải đặc tả |
|---|---|---|
| Khung | `AppShell`, `Sidebar` (thu gọn được), `Topbar`, `Breadcrumb`, `RoleSwitcher`, `UserMenu`, `DemoBanner` | sidebar mở / thu gọn / mobile drawer; mục menu active / hover / có badge số |
| Trang | `PageHeader` (tiêu đề + mô tả + nút chính), `Tabs`, `Card`, `Section` | |
| Dữ liệu | `DataTable`, `FilterBar`, `SearchInput`, `Pagination`, `BulkActionBar`, `ColumnToggle`, `EmptyState`, `StatusBadge`, `Avatar`, `Tag` | bảng: loading (skeleton) / rỗng / lỗi / chọn nhiều dòng / dòng hover / cột sắp xếp tăng-giảm |
| Form | `Form`, `FieldGroup`, `TextInput`, `NumberInput`, `MoneyInput`, `Textarea`, `Select`, `SearchSelect`, `MultiSelect`, `DatePicker`, `DateRangePicker`, `Checkbox`, `RadioGroup`, `Switch`, `FileUpload`, `LineItemsTable` (dòng hàng của chứng từ) | default / hover / focus / disabled / readonly / lỗi (viền + thông báo dưới trường) / loading |
| Nút | `Button` (primary, secondary, ghost, danger, link; size sm/md), `IconButton`, `ButtonGroup`, `DropdownMenu` | default / hover / focus / disabled / loading |
| Chi tiết | `DetailHeader` (mã + badge trạng thái + nút theo trạng thái), `DescriptionList`, `Timeline` (lịch sử), `ApprovalFlow` (các cấp duyệt) | |
| Tổng quan | `KpiCard`, `BarChart`, `LineChart`, `DonutChart` (SVG + JS thuần), `Kanban` (cột theo trạng thái, kéo thả) | |
| Phản hồi | `Modal`, `ConfirmDialog`, `Drawer`, `Toast` (success / error / info), `Alert`, `Skeleton`, `Tooltip`, `NoPermission` | |

Mỗi component trong 9.12: mục đích, cấu tạo, các biến thể, các trạng thái, token dùng (ví dụ "nút primary: nền primary-600, hover primary-700, chữ neutral-0, cao layout.controlHeight, bo radius.md").

## 3. Đặc tả từng màn hình (`09-ui-ux/screens/<slug>.md`)

Theo mẫu `templates/09-ui-ux/screens/screen.md`, **bắt buộc đủ**:

1. **Thông tin chung:** mã SCR, loại màn hình (`Danh sách`, `Chi tiết`, `Form tạo/sửa`, `Dashboard`, `Kanban`, `Trang nội dung`, `Đăng nhập`), module, FR, vai trò được vào, đường dẫn prototype `pages/<mã module viết thường>/<slug>.html` (riêng đăng nhập là `index.html`), đến từ / đi tới màn hình nào.
2. **Wireframe 9.10:** khối ASCII cho desktop, ghi chú khác biệt trên mobile. Tên vùng trùng tên component.
3. **Bố cục theo vùng 9.11:** bảng `Vùng | Component | Nội dung / dữ liệu | Ghi chú`.
4. **Bảng dữ liệu** (nếu có): `Cột | Trường (ENT.field) | Định dạng | Sắp xếp | Lọc | Ẩn được | Căn / độ rộng | Mobile`. Kèm bộ lọc (`Bộ lọc | Kiểu | Giá trị | Mặc định`), sắp xếp mặc định, số dòng / trang, thao tác hàng loạt.
5. **Form** (nếu có): `Trường | Nhãn | Component | Bắt buộc | Mặc định | Validation | Thông báo lỗi | Nhóm`. Thông báo lỗi ghi **nguyên văn** tiếng Việt.
6. **Hành động:** `Hành động | Vị trí | Quyền (vd SALES.ORDER.APPROVE) | Hiện khi (trạng thái / điều kiện) | Kết quả | Chuyển trạng thái | Thông báo`. Nút đổi trạng thái chứng từ phải khớp `documents[].transitions`.
7. **Trạng thái màn hình:** loading, rỗng (nội dung chữ + nút gợi ý), lỗi, không có quyền, thành công — ghi chữ hiển thị nguyên văn.
8. **Responsive:** desktop ≥ lg / tablet md / mobile < md: cột nào ẩn, bảng thành thẻ, sidebar thành drawer…
9. **Dữ liệu giả:** số bản ghi, ví dụ 2–3 bản ghi tiêu biểu, quan hệ với dữ liệu màn hình khác.

## 4. Điều hướng (9.6–9.8)

- Bảng menu theo vai trò: `Nhóm menu | Mục | SCR | Icon | Vai trò thấy | Badge số`.
- Màn hình mặc định sau đăng nhập của từng vai trò (khớp `defaultScreen` trong `_permissions.json`).
- Sitemap `flowchart` + breadcrumb mẫu cho màn hình sâu nhất.

## 5. Website / thương mại điện tử

Cùng nguyên tắc, khác ở thư viện component: thay nhóm "Khung" bằng `SiteHeader`, `MegaMenu`, `SiteFooter`, `Hero`, `ProductCard`, `ProductGallery`, `CartDrawer`, `Testimonial`, `CTASection`… (khai báo trong 9.12). Loại màn hình dùng `Trang nội dung` là chính; đường dẫn prototype `pages/<slug>.html`, trang chủ là `index.html`.
