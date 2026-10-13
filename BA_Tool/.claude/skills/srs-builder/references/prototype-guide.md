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
│   ├── js/permissions.js      # (CÓ SẴN — vai trò, quyền, màn hình được vào: window.Perm, window.APP_META)
│   ├── js/workflows.js        # (CÓ SẴN — vòng đời chứng từ: window.Workflow)
│   ├── js/demo-store.js       # (CÓ SẴN — lưu thay đổi demo: window.DemoStore)
│   ├── js/components.js       # Thư viện component (window.UI)
│   ├── js/layout.js           # Khung ứng dụng: sidebar, topbar, breadcrumb, dải "Bản demo"
│   ├── js/mock-data/<module>.js
│   └── js/app.js              # Khởi động trang, trạng thái demo dùng chung
├── HANDOFF.md                 # (tool sinh sau QA — không viết)
├── _qa-report.md, _qa/        # (tool sinh — báo cáo QA + ảnh chụp)
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
  <script src="../../assets/js/permissions.js"></script>
  <script src="../../assets/js/workflows.js"></script>
  <script src="../../assets/js/mock-data/master.js"></script>
  <script src="../../assets/js/mock-data/sales.js"></script>
  <script src="../../assets/js/demo-store.js"></script>
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
- Thứ tự script cố định: `icons` → `permissions` → `workflows` → `mock-data/*` → `demo-store` → `components` → `layout` → `app` → script trang.
- **Đường dẫn mỗi màn hình lấy đúng `APP_META.screens[].path`** (đã đọc từ "File prototype" trong đặc tả). Liên kết giữa các trang dùng `Perm.url('pages/sales/orders.html')`.

## 4. Thứ tự dựng

1. **Đọc** `srs/_design-tokens.json`, `srs/09-ui-ux/01-design-system.md`, `04-states-responsive.md` (9.12), `02-navigation-sitemap.md`, `03-screen-inventory.md`, `srs/_registry.json` (screens, documents, roles), `srs/_permissions.json`. Mở `screens/<slug>.md` khi dựng màn hình đó.
2. **`assets/js/components.js`** — thư viện component (mục 5).
3. **`components.html`** — style guide (mục 6). Mở được độc lập, dùng chính `components.js`.
4. **`assets/js/layout.js`** — `AppShell` theo menu 9.6 (sidebar thu gọn được + drawer trên mobile, topbar, breadcrumb, `RoleSwitcher`, `UserMenu`, `DemoBanner` "Bản demo — dữ liệu giả").
5. **`assets/js/mock-data/<module>.js`** + **`assets/js/app.js`** (mục 7).
6. **`index.html`** (đăng nhập giả + chọn vai trò, mục 7.1), rồi **từng màn hình** theo thứ tự module trong 03-screen-inventory.
7. **`README.md`** (danh sách trang: `File | Mã SCR | Tên | Vai trò`; cách chạy; giới hạn của bản demo). `HANDOFF.md` do tool sinh, không viết.

Sau khi bạn xong, tool chạy QA bằng Playwright (mở mọi trang ở 375 / 768 / 1440px qua `file://`, bắt lỗi console, file không tải được, link hỏng, tràn ngang, `data-screen` sai, đăng nhập từng vai trò để kiểm menu và trang "Không có quyền truy cập"). Menu sidebar phải là thẻ `<a href>` nằm trong `<aside>` / `<nav>` để QA đọc được.

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

## 7. Vai trò, dữ liệu giả và xử lý giả

`permissions.js`, `workflows.js`, `demo-store.js` **do tool sinh từ SRS** — dùng API của chúng, không tự viết lại logic phân quyền / chuyển trạng thái.

### 7.1. Đăng nhập giả và đổi vai trò (hệ thống quản trị)

- `index.html`: màn hình đăng nhập theo đặc tả; dưới form có danh sách **chọn vai trò** từ `APP_META.roles` (thẻ: tên vai trò + người dùng demo + mô tả ngắn quyền). Chọn → `Perm.setRole(id)` → `location.href = Perm.home()` (màn hình mặc định của vai trò, đúng `defaultScreen`). Đã có vai trò thì hiện nút "Tiếp tục với <vai trò>".
- `layout.js`:
  - Đầu `Layout.mount`: `if (!Perm.guard())` → chưa có vai trò thì đã tự chuyển về `index.html`; có vai trò nhưng không được vào → render khung + `UI.noPermission()` (tiêu đề "Không có quyền truy cập", mô tả vai trò hiện tại, nút "Về trang của tôi" → `Perm.home()`).
  - **Menu sidebar** chỉ hiện mục mà `Perm.canOpen(screenId)` đúng; nhóm menu rỗng thì ẩn.
  - **Topbar** có `RoleSwitcher` (dropdown vai trò, hiển thị tên + người dùng demo): đổi → `Perm.setRole(id)`; nếu trang hiện tại không được vào → `location.href = Perm.home()`, ngược lại `location.reload()`. `UserMenu` có "Đặt lại dữ liệu demo" (`UI.confirm` → `DemoStore.reset()` → reload) và "Đăng xuất" (`Perm.logout()`).
  - `DemoBanner` "Bản demo — dữ liệu giả" luôn hiện.
- **Nút / cột / mục theo quyền:** gắn `data-permission="SALES.ORDER.APPROVE"` (mã quyền = `<resource>.<ACTION>` trong đặc tả màn hình). `Perm` tự gỡ phần tử không có quyền, kể cả phần tử render sau. Muốn hiện nhưng làm mờ: thêm `data-permission-mode="disable"`. Logic JS thì dùng `Perm.can(code)`.
- **Phạm vi dữ liệu:** danh sách lọc theo `Perm.scope('SALES.ORDER')`: `own` → chỉ bản ghi có `ownerId` = người dùng demo của vai trò; `team` / `branch` → cùng `teamId` / `branchId`; `all` → tất cả. Ghi rõ phạm vi đang xem trên `PageHeader` (ví dụ "Đơn của tôi").

### 7.2. Dữ liệu giả

- `mock-data/master.js`: danh mục dùng chung — `MOCK.users` (**mỗi vai trò ít nhất 1 người dùng demo**: `{ id, name, roleId, teamId, branchId, email, phone }`), chi nhánh, khách hàng, nhà cung cấp, sản phẩm…
- `mock-data/<module>.js`: chứng từ của module. Mỗi chứng từ có vòng đời: `{ id, code, state, history: [...], ownerId, ... }` — `code` đúng quy tắc đánh mã (`WORKFLOWS[docId].numbering`), `state` là mã trạng thái trong `WORKFLOWS`, `history` có các bước hợp lệ dẫn tới trạng thái hiện tại.
- **Khớp giữa các module:** khóa ngoại trỏ tới bản ghi có thật (`customerId` ∈ `MOCK.customers`, dòng hàng `productId` ∈ `MOCK.products`; tổng tiền = Σ dòng hàng; tồn kho / công nợ khớp chứng từ đã duyệt theo `_integration.md`).
- Đủ nhiều để thấy phân trang: 30–100 dòng cho danh sách chính; trạng thái chứng từ phân bố đều để thấy mọi badge.
- Chân thực theo ngành, tiếng Việt, VNĐ, tên / địa chỉ Việt Nam; ngày trong 3 tháng gần nhất.
- Trang đọc / ghi qua `DemoStore` (không sửa thẳng `MOCK`): `DemoStore.list('salesOrders')`, `DemoStore.update('salesOrders', id, patch)`, `DemoStore.insert(...)`.

### 7.3. Xử lý giả theo vòng đời chứng từ

- Badge: `const s = Workflow.state('DOC-SALES-ORDER', row.state)` → `UI.statusBadge(s.name, s.tone)`.
- Nút thao tác trên trang chi tiết / dòng bảng: **chỉ từ** `Workflow.actions(docId, row.state)` (đã lọc theo vai trò + quyền). Mỗi nút: `UI.confirm` (với Từ chối / Hủy: bắt nhập lý do) → `const next = Workflow.apply(docId, row, t.event, { note })` → `DemoStore.update(name, row.id, next)` → toast thành công → render lại (badge đổi màu, nút đổi theo trạng thái mới, `UI.timeline` thêm dòng từ `history`, `UI.approvalFlow` cập nhật cấp duyệt).
- Chuyển trạng thái có `condition` (ví dụ "Tổng tiền > 50 triệu"): trang tự kiểm điều kiện trên dữ liệu trước khi cho bấm; không đạt thì nút làm mờ kèm tooltip nêu điều kiện (đúng BR trong SRS).
- Tạo chứng từ mới: `code = Workflow.nextCode(docId, codes hiện có)`, `state = Workflow.initial(docId)`, `history` có dòng "Tạo mới".
- Tác động liên module khi chuyển trạng thái (theo `_integration.md`), ví dụ duyệt đơn bán → giảm tồn kho khả dụng: cập nhật bản ghi liên quan qua `DemoStore` và toast nêu rõ tác động.
- Loading giả (skeleton ~400ms), trạng thái rỗng / lỗi / thành công đúng như đặc tả. Nút chưa mô phỏng → toast "Tính năng sẽ có ở bản chính thức".
- Luôn có dải "Bản demo — dữ liệu giả".

### 7.4. Website / thương mại điện tử

Không có đăng nhập chọn vai trò trừ khi SRS có khu quản trị (khi đó khu quản trị theo 7.1, trang công khai không cần vai trò). Giỏ hàng, form, bộ lọc… vẫn lưu qua `DemoStore`.

## 8. Chất lượng

- Responsive theo đặc tả mỗi màn hình: không tràn ngang ở 375px; sidebar thành drawer dưới `lg`; bảng thành thẻ dưới `md`.
- Accessibility: label cho mọi input, `alt` cho ảnh, `aria-label` cho nút chỉ có icon, tương phản đạt AA, focus thấy rõ.
- Code sạch, comment ngắn đầu mỗi file / hàm quan trọng; tên hàm, class dễ hiểu để chuyển sang framework.
