# Hướng dẫn dựng prototype (`SRS_MODE: registry`)

Prototype dùng để **trình diễn cho khách** và là **điểm xuất phát của đội frontend**. Hai yêu cầu song song: giống thật, chỉn chu (dùng taste skill `design-taste-frontend` suốt quá trình) **và** có hệ thống: token → component → màn hình, đúng đặc tả Phần 9.

Dự án cũ (`SRS_MODE: legacy`) dùng [prototype-guide-legacy.md](prototype-guide-legacy.md).

## 1. Nguyên tắc bắt buộc

1. **Design system trước, màn hình sau.** Thứ tự ở mục 4. Không viết trang nào trước khi `components.js` và `components.html` xong.
2. **Màn hình chỉ ghép từ component** trong `assets/js/components.js` (tên theo thư viện 9.12 / design-guide mục 2). Không tự chế style riêng cho từng trang. Thiếu component → thêm vào `components.js` + `components.html` trước, rồi mới dùng.
3. **Không hardcode giá trị thiết kế.** Mọi màu, cỡ chữ, bo góc, bóng, khoảng cách lấy từ token:
   - Màu: chỉ `primary-*`, `neutral-*`, `success-*`, `warning-*`, `danger-*`, `info-*`, `white`, `black`, `transparent` (bảng màu Tailwind đã bị thay bằng token — `bg-blue-500`, `text-gray-600` **không tồn tại**).
   - Chữ: `text-xs` … `text-3xl` (token). Bo góc: `rounded-sm/md/lg/xl/full`. Bóng: `shadow-sm/md/lg`.
   - Kích thước khung: `w-sidebar`, `w-sidebar-collapsed`, `h-topbar`, `h-control`, `h-table-row`, `max-w-content` (từ `layout` trong tokens).
   - **Cấm** mã HEX trong HTML/JS và class giá trị tùy ý kiểu `text-[13px]`, `bg-[#3366ff]`, `w-[248px]`. Cần giá trị CSS trong JS thì dùng biến: `rgb(var(--c-primary-600))`, `var(--radius-md)`.
   Tool đếm và báo các chỗ vi phạm sau khi dựng.
4. **Đúng đặc tả:** mỗi màn hình trong `srs/09-ui-ux/03-screen-inventory.md` / `screens` của registry là **một file HTML** theo đường dẫn "File prototype" trong đặc tả. Cột bảng, trường form, thông báo lỗi, nút, trạng thái, responsive **làm đúng như `screens/<slug>.md`**. Không thêm màn hình ngoài danh sách (trừ `index.html`, `components.html`).
5. **Chỉ HTML + Tailwind CDN + JS thuần**, mở `index.html` bằng `file://` là chạy: không ES module `import`, không `fetch` file local, không thư viện JS nào khác (biểu đồ vẽ bằng SVG + JS thuần).

## 2. Cấu trúc

```
<TARGET_DIR>/
├── index.html                 # Hệ thống quản trị: đăng nhập giả + chọn vai trò. Website: trang chủ
├── components.html            # Style guide: tokens + toàn bộ component + đoạn HTML mẫu
├── pages/<module>/<slug>.html # Màn hình (module = mã module viết thường, ví dụ pages/sales/orders.html)
├── assets/
│   ├── js/tailwind.tokens.js  # (CÓ SẴN — tool sinh từ _design-tokens.json, không sửa)
│   ├── css/tokens.css         # (CÓ SẴN — tool sinh, không sửa)
│   ├── js/icons.js            # (CÓ SẴN — sprite icon, không sửa)
│   ├── js/components.js       # Thư viện component (window.UI)
│   ├── js/layout.js           # Khung ứng dụng: sidebar, topbar, breadcrumb, dải "Bản demo"
│   ├── js/mock-data/<module>.js
│   └── js/app.js              # Khởi động trang, trạng thái demo dùng chung
├── HANDOFF.md
└── README.md
```

Website / thương mại điện tử: trang ở `pages/<slug>.html`, `index.html` là trang chủ, `layout.js` render header / footer của site.

## 3. Khung mỗi trang

```html
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Danh sách đơn bán · <Tên hệ thống></title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="../../assets/js/tailwind.tokens.js"></script>
  <link rel="stylesheet" href="../../assets/css/tokens.css">
</head>
<body data-screen="SCR-SALES-001" data-module="SALES" class="bg-neutral-50 text-neutral-800">
  <div id="app"></div>
  <script src="../../assets/js/icons.js"></script>
  <script src="../../assets/js/mock-data/sales.js"></script>
  <script src="../../assets/js/components.js"></script>
  <script src="../../assets/js/layout.js"></script>
  <script src="../../assets/js/app.js"></script>
  <script>
    // Chỉ ghép component + dữ liệu cho màn hình này
    Layout.mount({ title: 'Đơn bán', breadcrumb: [['Bán hàng'], ['Đơn bán']], actions: [...] }, (main) => { ... });
  </script>
</body>
</html>
```

- Đường dẫn tương đối theo độ sâu thư mục (`../../` cho `pages/<module>/`).
- `data-screen` = mã SCR để truy vết; `data-module` = mã module.
- Script riêng của trang ngắn: chỉ cấu hình component + dữ liệu.

## 4. Thứ tự dựng

1. **Đọc** `srs/_design-tokens.json`, `srs/09-ui-ux/01-design-system.md`, `04-states-responsive.md` (9.12), `02-navigation-sitemap.md`, `03-screen-inventory.md`, `srs/_registry.json` (screens, documents, roles), `srs/_permissions.json`. Mở `screens/<slug>.md` khi dựng màn hình đó.
2. **`assets/js/components.js`** — thư viện component (mục 5).
3. **`components.html`** — style guide (mục 6). Mở được độc lập, dùng chính `components.js`.
4. **`assets/js/layout.js`** — `AppShell` theo menu 9.6 (sidebar thu gọn được + drawer trên mobile, topbar, breadcrumb, `RoleSwitcher`, `UserMenu`, `DemoBanner` "Bản demo — dữ liệu giả").
5. **`assets/js/mock-data/<module>.js`** + **`assets/js/app.js`**.
6. **`index.html`**, rồi **từng màn hình** theo thứ tự module trong 03-screen-inventory.
7. **`README.md`** (danh sách trang: `File | Mã SCR | Tên | Vai trò`; cách chạy; giới hạn của bản demo).

## 5. `components.js` — API thư viện

Một biến toàn cục `window.UI`. Hàm trả về **chuỗi HTML** (component tĩnh) hoặc **gắn vào phần tử** (component có tương tác). Class Tailwind chỉ dùng token. Mỗi hàm có comment 1 dòng mô tả tham số.

| Nhóm | Hàm tối thiểu |
|---|---|
| Định dạng | `UI.fmt.money(n)` (`1.250.000 ₫`), `UI.fmt.number(n)`, `UI.fmt.date(iso)` (`dd/mm/yyyy`), `UI.fmt.datetime(iso)`, `UI.fmt.percent(n)` |
| Nút | `UI.button({ label, variant: 'primary'\|'secondary'\|'ghost'\|'danger'\|'link', size: 'sm'\|'md', icon, loading, disabled, attrs })`, `UI.iconButton({ icon, label, ... })` |
| Hiển thị | `UI.badge(text, tone)`, `UI.statusBadge(label, tone)`, `UI.avatar(name)`, `UI.tag(text)`, `UI.card({ title, body, actions })`, `UI.pageHeader({ title, description, actions })`, `UI.descriptionList(items)`, `UI.emptyState({ icon, title, text, action })`, `UI.skeleton(lines)`, `UI.alert({ tone, title, text })` |
| Bảng | `UI.table(el, { columns: [{ key, label, format, sortable, align, width, hideBelow: 'md', render }], rows, pageSize, selectable, searchKeys, filters: [{ key, label, type: 'select'\|'date-range'\|'text', options }], bulkActions: [{ label, icon, onClick(rows) }], rowActions: (row) => [...], onRowClick, empty: { title, text } })` — có tìm kiếm, bộ lọc, sắp xếp, phân trang, chọn nhiều dòng + `BulkActionBar`, ẩn / hiện cột (`ColumnToggle`), skeleton khi tải, trạng thái rỗng; dưới `md` chuyển thành dạng thẻ |
| Form | `UI.field({ name, label, type: 'text'\|'number'\|'money'\|'textarea'\|'select'\|'search-select'\|'multi-select'\|'date'\|'date-range'\|'checkbox'\|'radio'\|'switch'\|'file', options, required, placeholder, hint, value, disabled, readonly })`, `UI.fieldGroup({ title, fields, columns })`, `UI.lineItems(el, { columns, rows, onChange })`, `UI.validate(formEl, rules)` (hiện lỗi dưới từng trường, viền danger, trả về true/false) |
| Chi tiết | `UI.tabs(el, tabs)`, `UI.detailHeader({ code, title, status, actions })`, `UI.timeline(items)`, `UI.approvalFlow(steps)` |
| Tổng quan | `UI.kpiCard({ label, value, delta, icon, tone })`, `UI.chart.bar(el, data)`, `UI.chart.line(el, data)`, `UI.chart.donut(el, data)` (SVG thuần, có tooltip, nhãn trục, chú thích), `UI.kanban(el, { columns, cards, onMove })` (kéo thả bằng pointer events) |
| Phản hồi | `UI.modal({ title, body, actions, size })`, `UI.drawer({ title, body, actions })`, `UI.confirm({ title, message, confirmLabel, danger })` → `Promise<boolean>`, `UI.toast(message, tone)`, `UI.tooltip(el, text)`, `UI.noPermission()` |

Mọi component có đủ trạng thái trong 9.12: default, hover, focus (vòng focus thấy rõ), disabled, loading, lỗi. Tương tác bàn phím: Esc đóng modal / drawer, Tab không thoát khỏi modal, Enter gửi form.

## 6. `components.html` — style guide cho đội frontend

Trang dùng `AppShell` đơn giản với mục lục bên trái, gồm:
1. **Tokens:** bảng màu (mọi sắc độ, kèm tên token và HEX — đọc từ CSS variables bằng JS, không gõ tay), typography scale, radius, shadow, breakpoints, layout tokens, density.
2. **Icon:** lưới toàn bộ `window.ICONS` kèm tên.
3. **Từng component:** tiêu đề + mô tả ngắn, demo **tất cả biến thể và trạng thái** (ví dụ nút: 5 variant × default / hover giả lập / focus / disabled / loading), và khối **"HTML mẫu"** (`<pre><code>`) với nút **Sao chép**. Component tương tác (bảng, modal, kanban, biểu đồ) có demo chạy được với dữ liệu nhỏ.
4. **Badge trạng thái chứng từ:** mọi trạng thái của mọi `documents` trong registry với đúng tone.
5. **Mẫu bố cục trang:** danh sách, chi tiết, form, dashboard — thu nhỏ, để frontend thấy cách ghép.

## 7. Dữ liệu giả và xử lý giả

- Nội dung chân thực theo ngành, tiếng Việt, tiền VNĐ, tên người / địa chỉ Việt Nam. Danh sách chính 30–100 dòng để thấy phân trang.
- Dữ liệu nằm trong biến toàn cục (`window.MOCK.sales = {...}`) — không `fetch`.
- Trạng thái thay đổi (tạo, sửa, duyệt…) lưu `localStorage`, **luôn bọc try/catch** (fallback biến trong bộ nhớ).
- Đủ trạng thái loading (skeleton ~400ms) / rỗng / lỗi / thành công như đặc tả; nút chưa mô phỏng → toast "Tính năng sẽ có ở bản chính thức".
- Luôn có dải "Bản demo — dữ liệu giả".

## 8. Chất lượng

- Responsive theo đặc tả mỗi màn hình: không tràn ngang ở 375px; sidebar thành drawer dưới `lg`; bảng thành thẻ dưới `md`.
- Accessibility: label cho mọi input, `alt` cho ảnh, `aria-label` cho nút chỉ có icon, tương phản đạt AA, focus thấy rõ.
- Code sạch, comment ngắn đầu mỗi file / hàm quan trọng; tên hàm, class dễ hiểu để chuyển sang framework.
