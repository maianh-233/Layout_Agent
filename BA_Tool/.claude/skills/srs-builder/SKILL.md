---
name: srs-builder
description: Hỗ trợ BA thu thập yêu cầu khách hàng và tạo tài liệu SRS tiếng Việt chia nhiều file (Phần 0–13), sinh câu hỏi bằng ngôn ngữ đời thường, và dựng prototype HTML + Tailwind + JS thuần với dữ liệu giả. Dùng khi tool "SRS & Prototype Builder" gọi với MODE quick-prototype, quick-revise, questions, srs, prototype (và các MODE của luồng cũ hai giai đoạn).
---

# SRS Builder

Skill được backend gọi bằng `/srs-builder` kèm các tham số dạng `KHÓA: giá trị`:

```
MODE: <quick-prototype | quick-revise | questions | srs | srs-review | srs-fix | prototype | prototype-fix
       | business-questions | business-followup | business-srs | ui-questions | ui-followup | ui-srs>
PROJECT_TYPE: <website | ecommerce | crm | erp | management-generic>
SRS_MODE: <registry | legacy>
PROJECT_DIR: <đường dẫn tuyệt đối tới workspace/<slug>>
TARGET_DIR: <chỉ có ở MODE prototype*, quick-* — folder đích>
```

Ba luồng làm việc:

| Luồng | MODE | Hướng dẫn |
|---|---|---|
| **Nhanh** — website nhiều trang từ cấu hình Quick Create, không SRS | `quick-prototype`, `quick-revise` | [references/quick-guide.md](references/quick-guide.md) |
| **Chuẩn** — tối đa 10 câu hỏi → một SRS gộp → prototype | `questions`, `srs`, rồi `prototype`, `prototype-fix`, `srs-review`, `srs-fix` | [references/standard-guide.md](references/standard-guide.md) |
| Cũ — hai giai đoạn (chỉ dự án tạo trước đây) | `business-*`, `ui-*` | các mục bên dưới |

Mọi MODE dựng / sửa prototype đều theo [references/layout-guide.md](references/layout-guide.md): dùng hết bề ngang (không dồn giữa), đẹp trên cả máy tính và điện thoại, tránh kiểu "trông như AI"; và [references/motion-guide.md](references/motion-guide.md): chuyển động + tương tác (hover, theo chuột, theo cuộn) hợp phong cách, dùng `assets/js/motion.js` do tool sinh sẵn; và [references/image-guide.md](references/image-guide.md): **ảnh chụp thật, đúng chủ đề, chỉ lấy qua công cụ `search_images` / `use_image`** — cấm link tự nghĩ, picsum / placeholder, ảnh AI tạo, hình vẽ giả ảnh.

Tham số nhận được: $ARGUMENTS

## Quy tắc chung (mọi chế độ)

- Viết tiếng Việt. Giữ thuật ngữ tiếng Anh trong ngoặc khi cần.
- **Chế độ nhanh (`quick-*`): chữ hiển thị trên website theo ngôn ngữ BA chọn trong `concept.md`** (en / vi / zh / ja), `<html lang>` tương ứng, font có đủ ký tự theo kết quả tool kiểm tra.
- **Ngoại lệ cho prototype có SRS — mọi chữ hiển thị trên prototype viết tiếng Anh** (tránh lỗi phông tiếng Việt), `<html lang="en">`: dữ liệu giả (tên người, công ty, sản phẩm, địa chỉ, mô tả, ghi chú, đánh giá khách), nội dung landing page, và cả nhãn giao diện (menu, nút, tiêu đề cột, trạng thái, toast, thông báo lỗi). SRS vẫn viết tiếng Việt; khi dựng prototype thì dịch nhãn / thông báo trong SRS sang tiếng Anh tương đương. Số dạng `1,284`, tiền `1,250,000 ₫`.
- **Không bịa thông tin.** Chỉ dùng yêu cầu ban đầu, câu trả lời của khách và các file SRS đã có. Ngoại lệ: luồng nhanh và luồng chuẩn được **tự bổ sung hợp lý theo ngành** — luồng chuẩn phải gắn `[ĐỀ XUẤT]` cho phần tự bổ sung.
- Chỉ đọc file **khi cần** (để tiết kiệm token). Luôn đọc `srs/README.md` (mục lục) trước khi mở file SRS chi tiết.
- Chỉ ghi file vào `PROJECT_DIR` (và `TARGET_DIR` ở chế độ prototype). Không xóa file nào.
- Không hỏi lại người dùng: tool chạy không tương tác. Thiếu thông tin thì ghi `[CẦN XÁC NHẬN]` theo hướng dẫn viết SRS.
- Khi xong, trả lời một dòng ngắn tóm tắt những gì đã tạo.
- **File domain** `references/domains/<PROJECT_TYPE>.md` (thiếu `PROJECT_TYPE` thì coi là `website`) chỉ để **gợi ý câu hỏi cho đủ ý**. Không lấy nội dung từ file domain đưa vào SRS như yêu cầu đã chốt — xem quy tắc trong [references/domains/README.md](references/domains/README.md).

- **`SRS_MODE`** (thiếu thì coi là `legacy`):
  - `registry` — dự án mới: mọi mã theo `<LOẠI>-<MODULE>-<3 số>` và được đăng ký trong `srs/_registry.json`; phân quyền ở `srs/_permissions.json`. Đọc [references/registry-guide.md](references/registry-guide.md). Tra mã / file bằng registry thay vì mở hết các file SRS. `12-traceability.md` và bảng 4.2 do code sinh.
  - `legacy` — dự án cũ: giữ cách viết cũ (mã `FR-001`…, tự viết Phần 12).
- Có phần `SỬA REGISTRY` trong prompt → chỉ làm theo mục 6 của registry-guide, bỏ qua các bước bình thường của chế độ.

- `prototype-fix` chỉ dùng cho dự án `SRS_MODE: registry`.

## Dữ liệu trong `PROJECT_DIR`

| File | Nội dung |
|---|---|
| `request.md` | Yêu cầu ban đầu của BA |
| `concept.md` | Luồng nhanh: brief website — chủ đề, thương hiệu, mục đích, ngôn ngữ, preset, mức chuyển động, màu, font, section + mô tả, trạng thái công cụ ảnh, chú thích nguyên văn (backend sinh từ `server/src/presets.ts`) |
| `answers-business.md` | Câu hỏi + câu trả lời + ghi chú BA (do backend tạo trước khi gọi `srs` ở luồng chuẩn, hoặc `business-followup` / `business-srs` ở luồng cũ) |
| `feedback.md` | Luồng nhanh: góp ý / lỗi QA cần sửa (do backend tạo trước khi gọi `quick-revise`) |
| `answers-ui.md` | Câu hỏi giao diện + câu trả lời + ghi chú BA (do backend tạo trước khi gọi `ui-followup` / `ui-srs`) |
| `srs/` | Các file SRS |
| `srs/_registry.json`, `srs/_permissions.json` | Sổ đăng ký mã, ma trận phân quyền (`SRS_MODE: registry`) |

## Các chế độ — đọc file nào, ghi file nào

### `quick-prototype` / `quick-revise` (luồng nhanh)
Làm đúng theo [references/quick-guide.md](references/quick-guide.md): đọc hết `concept.md`, lập sitemap (`TARGET_DIR/_build/sitemap.json`) rồi dựng **nhiều trang** có điều hướng thật, ghép section từ [references/sections.md](references/sections.md), ảnh theo từng trang, hiệu ứng bằng `motion.js` + `atmos.js`, tương tác bằng `ui.js` ([references/ui-guide.md](references/ui-guide.md)); tự xem trang bằng công cụ `view_page` / `check_page`. Danh mục preset: [references/presets.md](references/presets.md) (tool sinh). Không đọc / ghi SRS, không viết README.md (tool sinh). Chỉ ghi vào `TARGET_DIR` (và không ghi gì khác trong `PROJECT_DIR`).

### `questions` (luồng chuẩn)
Theo mục "MODE `questions`" trong [references/standard-guide.md](references/standard-guide.md). Chỉ ghi `PROJECT_DIR/questions-business.json`, tối đa 10 câu.

### `srs` (luồng chuẩn) — SRS nghiệp vụ + giao diện trong một lượt
Theo mục "MODE `srs`" trong [references/standard-guide.md](references/standard-guide.md) (`SRS_MODE: registry`). **Không** đọc `srs-writing-guide.md`, các mẫu khác trong `templates/`, hay file domain — mọi quy tắc cần thiết đã có trong standard-guide. Ghi toàn bộ `srs/` kể cả Phần 9, `_design-tokens.json`, `_registry.json` (có `screens`), `_permissions.json` (có `defaultScreen`); không viết `12-traceability.md`.

### `business-questions`
1. Đọc `PROJECT_DIR/request.md`.
2. Đọc [references/question-guide.md](references/question-guide.md) và [references/domains/README.md](references/domains/README.md), rồi đọc **đúng một** file `references/domains/<PROJECT_TYPE>.md`.
3. Ghi bộ câu hỏi nghiệp vụ ra `PROJECT_DIR/questions-business.json` đúng định dạng JSON trong question-guide, **số câu theo file domain**. Dùng mục 1–4 của file domain làm danh sách kiểm tra để không sót chủ đề. Chỉ ghi file này.

### `business-followup` / `ui-followup` — vòng câu hỏi bổ sung
1. Đọc `answers-<phase>.md` (`business` hoặc `ui`) và mục "Vòng câu hỏi bổ sung" trong [references/question-guide.md](references/question-guide.md).
2. `business-followup`: đọc thêm `request.md` và mục 4–5 của `references/domains/<PROJECT_TYPE>.md`.
   `ui-followup`: đọc thêm `srs/README.md`, `srs/02-overall-description.md`, `srs/05-functional/README.md` để đối chiếu câu trả lời giao diện với vai trò / module đã có.
3. Ghi **chỉ** `PROJECT_DIR/followup-<phase>.json` (ít câu nhất có thể, gộp các ý cùng chủ đề vào một câu, tối đa 15; mỗi câu có `reason`; không có gì cần hỏi thì `{ "groups": [] }`). Không sửa file nào khác.

### `business-srs`
1. Đọc `request.md`, `answers-business.md`. Có thể đọc `references/domains/<PROJECT_TYPE>.md` **chỉ để phát hiện chủ đề khách chưa trả lời** → ghi vào 13.9 (hoặc `[ĐỀ XUẤT]`). Module khách không xác nhận thì không đưa vào SRS.
2. Đọc [references/srs-structure.md](references/srs-structure.md) và [references/srs-writing-guide.md](references/srs-writing-guide.md).
3. Với mỗi file cần tạo, đọc mẫu cùng tên trong [templates/](templates/) rồi ghi vào `PROJECT_DIR/srs/`. Mỗi module dùng mẫu `templates/05-functional/module.md`.
4. Tạo Phần 0–8 và 10–13. Phần 9: chỉ tạo `09-ui-ux/README.md` với nội dung mẫu `templates/09-ui-ux/README-placeholder.md`.
5. Thứ tự ghi: `00` → `01` → `02` → `03` → `04` → `05-functional/` → `06` → `07` → `08` → `09-ui-ux/README.md` → `10` → `11` → `12` → `13` → cuối cùng `README.md` (mục lục).
6. **`SRS_MODE: registry`**, khác với trên:
   - Đọc thêm [references/registry-guide.md](references/registry-guide.md) và mục 6–7 của srs-writing-guide.
   - Ghi `srs/_registry.json` + `srs/_permissions.json` (cập nhật dần trong lúc viết; `screens: []`, `defaultScreen: {}`), và `05-functional/_integration.md`.
   - **Bỏ qua `12-traceability.md`** (code sinh). Ở 4.2 để dòng `<!-- AUTO:RBAC --><!-- /AUTO:RBAC -->` thay cho bảng ma trận.
   - `00-document-control.md`: 0.3 ghi `Nháp — chưa chốt phiên bản`; 0.5 chỉ để bảng `| Phiên bản | Ngày | Người soạn | Nội dung |` trống — tool thêm dòng khi BA bấm "Chốt phiên bản".
   - Thứ tự: `00` → `01` → `02` → `03` → `04` → `05-functional/` (README, từng module, `_integration.md`) → `06` → `07` → `08` → `09-ui-ux/README.md` → `10` → `11` → `13` → `_permissions.json` → kiểm lại `_registry.json` đủ mọi mã đã dùng → `README.md`.

### `ui-questions`
1. Chỉ đọc: `srs/README.md`, `srs/01-introduction.md`, `srs/02-overall-description.md`, `srs/04-user-requirements.md`, `srs/05-functional/README.md`.
2. Đọc [references/question-guide.md](references/question-guide.md).
3. Ghi câu hỏi giao diện ra `PROJECT_DIR/questions-ui.json`, số câu theo dòng "Số câu hỏi giao diện" trong `references/domains/<PROJECT_TYPE>.md` (chỉ đọc 5 dòng đầu file đó). Không hỏi lại điều SRS đã có.
4. Đây là **bộ câu hỏi quan trọng nhất** (prototype phải đúng ý khách). `SRS_MODE: registry`: đọc thêm `srs/_registry.json` và `srs/_permissions.json` để hỏi đúng từng vai trò (màn hình đầu tiên), từng bảng dữ liệu / form chứng từ chính (cột, trường), theo nhóm "CRM / ERP / hệ thống quản lý" trong question-guide.

### `ui-srs`
1. Đọc `answers-ui.md` (kể cả câu hỏi bổ sung và ghi chú BA), `srs/README.md`, [references/srs-writing-guide.md](references/srs-writing-guide.md), mục Phần 9 trong [references/srs-structure.md](references/srs-structure.md), các mẫu trong `templates/09-ui-ux/`.
2. Mở `05-functional/<module>.md` chỉ khi cần biết luồng của một màn hình.
3. Tạo toàn bộ `srs/09-ui-ux/` (README ghi đè bản giữ chỗ, 01–04, `screens/<screen-slug>.md` theo mẫu `templates/09-ui-ux/screens/screen.md` cho từng màn hình).
4. Cập nhật (sửa đúng mục, không viết lại cả file): 6.8, 6.9, 6.11 trong `06-non-functional.md`; 8.1 trong `08-external-interfaces.md`; truy vết màn hình ↔ yêu cầu trong `12-traceability.md`; 13.9 trong `13-appendices.md`; thêm dòng phiên bản mới ở 0.5 trong `00-document-control.md`.
5. Cập nhật `srs/README.md`.
6. **`SRS_MODE: registry`**, khác với trên:
   - Đọc `srs/_registry.json` và `srs/_permissions.json` **thay cho** việc mở các file module: lấy danh sách FR, vai trò, chứng từ từ đây. Chỉ mở file module khi cần chi tiết luồng.
   - Đọc [references/design-guide.md](references/design-guide.md) — **Phần 9 là phần quan trọng nhất**, viết đủ chi tiết cho frontend dựng tiếp.
   - Ghi `srs/_design-tokens.json` (design tokens, đúng định dạng design-guide mục 1) cùng giá trị với 9.2–9.5.
   - 9.12 (`04-states-responsive.md`): thư viện component theo design-guide mục 2; màn hình chỉ dùng component trong thư viện.
   - Mỗi `screens/<slug>.md` đủ 9 mục của design-guide mục 3 (bảng: cột ↔ trường dữ liệu; form: trường, validation, thông báo lỗi nguyên văn; hành động ↔ quyền ↔ chuyển trạng thái; trạng thái; responsive; dữ liệu giả).
   - Mã màn hình dạng `SCR-<MODULE>-<3 số>`. Thêm mọi màn hình vào `screens` của registry (kèm `functional`, `roles`, `file`); 03-screen-inventory dùng đúng các mã này.
   - Điền `defaultScreen` trong `_permissions.json` cho **mọi vai trò** (theo câu trả lời "màn hình đầu tiên sau đăng nhập"; chưa rõ thì chọn hợp lý, đặt `"proposed": true` và ghi 13.9).
   - **Không sửa `12-traceability.md`** (code sinh lại, có thêm cột màn hình). Không thêm dòng 0.5 (tool ghi khi chốt phiên bản).

### `srs-review` — rà soát chất lượng (chỉ đọc)
1. Đọc [references/review-guide.md](references/review-guide.md) mục 1 và `srs/_review.json` (kết quả kiểm bằng code — không báo trùng).
2. Đọc registry / phân quyền trước, chỉ mở file SRS cần đối chiếu. Có Phần 9 thì kiểm thêm theo [references/design-guide.md](references/design-guide.md).
3. Ghi **chỉ** `srs/_review-ai.json`. Không sửa file SRS nào.

### `srs-fix` — sửa một lỗi rà soát trên bản nháp
1. Làm theo [references/review-guide.md](references/review-guide.md) mục 2. Lỗi cần sửa nằm trong phần `LỖI CẦN SỬA` của prompt.
2. `PROJECT_DIR` là bản nháp; chỉ sửa trong `PROJECT_DIR/srs/`.

### `prototype`
1. **Bắt buộc gọi skill `design-taste-frontend`** (taste skill) trước khi viết bất kỳ HTML nào, và tuân theo nó trong suốt quá trình dựng giao diện. Khi taste skill và SRS khác nhau, **SRS thắng**; về độ rộng khung / responsive, [references/layout-guide.md](references/layout-guide.md) thắng taste skill.
2. **`SRS_MODE: registry`:** làm theo [references/prototype-guide.md](references/prototype-guide.md).
   - `assets/js/tailwind.tokens.js`, `assets/css/tokens.css`, `assets/js/icons.js`, `assets/js/permissions.js`, `assets/js/workflows.js`, `assets/js/demo-store.js`, `assets/js/motion.js` **đã có sẵn** trong `TARGET_DIR` (tool sinh từ SRS) — dùng API của chúng, không sửa, không viết lại.
   - Đăng nhập giả + chọn vai trò, đổi vai trò nhanh, ẩn / hiện theo `data-permission`, trang "Không có quyền truy cập", chuyển trạng thái chứng từ qua `Workflow`: theo mục 7 của prototype-guide.
   - Thứ tự: `components.js` → `components.html` → `layout.js` → mock data + `app.js` → `index.html` → từng màn hình → `README.md`.
   - Màn hình chỉ ghép từ component; không hardcode màu / cỡ chữ / khoảng cách.
   - **Không viết `HANDOFF.md`** — tool sinh sau khi QA. Sau khi dựng xong, tool tự chạy QA (Playwright).
3. **`SRS_MODE: legacy`:** làm theo [references/prototype-guide-legacy.md](references/prototype-guide-legacy.md): đọc `srs/README.md` và toàn bộ `srs/09-ui-ux/` (mở `05-functional/<module>.md` chỉ khi cần luồng); thứ tự `assets/js/mock-data.js` → `assets/js/layout.js` → `assets/js/app.js` → từng trang HTML → `README.md`.

### `prototype-fix` — sửa lỗi QA của prototype
1. **Bắt buộc gọi skill `design-taste-frontend`** trước khi sửa giao diện.
2. Đọc `TARGET_DIR/_qa/report.json` (danh sách `issues`: mức, nhóm, trang, kích thước màn hình, mô tả), [references/prototype-guide.md](references/prototype-guide.md) và [references/layout-guide.md](references/layout-guide.md).
3. Sửa theo thứ tự mức: `critical` → `major` → `minor`. Cách xử lý từng nhóm:
   - *Lỗi JavaScript / console*, *Không tải được file*: sửa script / đường dẫn tương đối; kiểm thứ tự nạp script (prototype-guide mục 3).
   - *Link hỏng*: trỏ đúng `APP_META.screens[].path` hoặc tạo trang còn thiếu.
   - *Ảnh không đúng nguồn / Ảnh hỏng*: thay bằng ảnh lấy qua `search_images` + `use_image` ([references/image-guide.md](references/image-guide.md)).
   - *Bố cục dồn giữa* (đo ở 1920px): bỏ `max-w-*` hẹp bọc trang / section, vùng nội dung `min-w-0 flex-1` tới `max-w-content`, lưới thêm cột ở `xl/2xl` (layout-guide mục 1).
   - *Tràn ngang* (ở kích thước ghi trong lỗi): bọc bảng trong vùng cuộn ngang / chuyển thành thẻ dưới `md`, `min-w-0` cho cột flex, xuống dòng cho chuỗi dài.
   - *Phân quyền*, *Đăng nhập / vai trò*: menu lọc bằng `Perm.canOpen`, trang gọi `Perm.guard()` → `UI.noPermission()`; trang đăng nhập liệt kê đủ vai trò.
   - *Thiếu màn hình*: dựng trang theo `srs/09-ui-ux/screens/<slug>.md`, đúng đường dẫn trong lỗi.
   - *Hardcode*: thay bằng class token / CSS variable.
   - *Truy vết*: sửa `body[data-screen]`.
4. Không sửa file tool sinh (`tailwind.tokens.js`, `tokens.css`, `icons.js`, `permissions.js`, `workflows.js`, `demo-store.js`, `motion.js`, `HANDOFF.md`, `_qa*`). Lỗi do SRS (ví dụ phân quyền sai trong SRS) → không sửa prototype để "lách", ghi lại trong câu trả lời cuối.
5. Sửa trong `TARGET_DIR`; tool tự chạy lại QA sau khi bạn xong.
