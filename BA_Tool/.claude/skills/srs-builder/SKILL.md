---
name: srs-builder
description: Hỗ trợ BA thu thập yêu cầu khách hàng và tạo tài liệu SRS tiếng Việt chia nhiều file (Phần 0–13), sinh bộ câu hỏi nghiệp vụ/giao diện bằng ngôn ngữ đời thường, và dựng prototype HTML + Tailwind + JS thuần với dữ liệu giả. Dùng khi tool "SRS & Prototype Builder" gọi với MODE business-questions, business-followup, business-srs, ui-questions, ui-followup, ui-srs hoặc prototype.
---

# SRS Builder

Skill được backend gọi bằng `/srs-builder` kèm các tham số dạng `KHÓA: giá trị`:

```
MODE: <business-questions | business-followup | business-srs | ui-questions | ui-followup | ui-srs | prototype>
PROJECT_TYPE: <website | ecommerce | crm | erp | management-generic>
SRS_MODE: <registry | legacy>
PROJECT_DIR: <đường dẫn tuyệt đối tới workspace/<slug>>
TARGET_DIR: <chỉ có ở MODE prototype — folder đích>
```

Tham số nhận được: $ARGUMENTS

## Quy tắc chung (mọi chế độ)

- Viết tiếng Việt. Giữ thuật ngữ tiếng Anh trong ngoặc khi cần.
- **Không bịa thông tin.** Chỉ dùng yêu cầu ban đầu, câu trả lời của khách và các file SRS đã có.
- Chỉ đọc file **khi cần** (để tiết kiệm token). Luôn đọc `srs/README.md` (mục lục) trước khi mở file SRS chi tiết.
- Chỉ ghi file vào `PROJECT_DIR` (và `TARGET_DIR` ở chế độ prototype). Không xóa file nào.
- Không hỏi lại người dùng: tool chạy không tương tác. Thiếu thông tin thì ghi `[CẦN XÁC NHẬN]` theo hướng dẫn viết SRS.
- Khi xong, trả lời một dòng ngắn tóm tắt những gì đã tạo.
- **File domain** `references/domains/<PROJECT_TYPE>.md` (thiếu `PROJECT_TYPE` thì coi là `website`) chỉ để **gợi ý câu hỏi cho đủ ý**. Không lấy nội dung từ file domain đưa vào SRS như yêu cầu đã chốt — xem quy tắc trong [references/domains/README.md](references/domains/README.md).

- **`SRS_MODE`** (thiếu thì coi là `legacy`):
  - `registry` — dự án mới: mọi mã theo `<LOẠI>-<MODULE>-<3 số>` và được đăng ký trong `srs/_registry.json`; phân quyền ở `srs/_permissions.json`. Đọc [references/registry-guide.md](references/registry-guide.md). Tra mã / file bằng registry thay vì mở hết các file SRS. `12-traceability.md` và bảng 4.2 do code sinh.
  - `legacy` — dự án cũ: giữ cách viết cũ (mã `FR-001`…, tự viết Phần 12).
- Có phần `SỬA REGISTRY` trong prompt → chỉ làm theo mục 6 của registry-guide, bỏ qua các bước bình thường của chế độ.

## Dữ liệu trong `PROJECT_DIR`

| File | Nội dung |
|---|---|
| `request.md` | Yêu cầu ban đầu của BA |
| `answers-business.md` | Câu hỏi nghiệp vụ + câu trả lời + ghi chú BA (do backend tạo trước khi gọi `business-followup` / `business-srs`) |
| `answers-ui.md` | Câu hỏi giao diện + câu trả lời + ghi chú BA (do backend tạo trước khi gọi `ui-followup` / `ui-srs`) |
| `srs/` | Các file SRS |
| `srs/_registry.json`, `srs/_permissions.json` | Sổ đăng ký mã, ma trận phân quyền (`SRS_MODE: registry`) |

## Các chế độ — đọc file nào, ghi file nào

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
   - Thứ tự: `00` → `01` → `02` → `03` → `04` → `05-functional/` (README, từng module, `_integration.md`) → `06` → `07` → `08` → `09-ui-ux/README.md` → `10` → `11` → `13` → `_permissions.json` → kiểm lại `_registry.json` đủ mọi mã đã dùng → `README.md`.

### `ui-questions`
1. Chỉ đọc: `srs/README.md`, `srs/01-introduction.md`, `srs/02-overall-description.md`, `srs/04-user-requirements.md`, `srs/05-functional/README.md`.
2. Đọc [references/question-guide.md](references/question-guide.md).
3. Ghi câu hỏi giao diện ra `PROJECT_DIR/questions-ui.json`, số câu theo dòng "Số câu hỏi giao diện" trong `references/domains/<PROJECT_TYPE>.md` (chỉ đọc dòng đầu file đó). Không hỏi lại điều SRS đã có.

### `ui-srs`
1. Đọc `answers-ui.md`, `srs/README.md`, [references/srs-writing-guide.md](references/srs-writing-guide.md), mục Phần 9 trong [references/srs-structure.md](references/srs-structure.md), các mẫu trong `templates/09-ui-ux/`.
2. Mở `05-functional/<module>.md` chỉ khi cần biết luồng của một màn hình.
3. Tạo toàn bộ `srs/09-ui-ux/` (README ghi đè bản giữ chỗ, 01–04, `screens/<screen-slug>.md` theo mẫu `templates/09-ui-ux/screens/screen.md` cho từng màn hình).
4. Cập nhật (sửa đúng mục, không viết lại cả file): 6.8, 6.9, 6.11 trong `06-non-functional.md`; 8.1 trong `08-external-interfaces.md`; truy vết màn hình ↔ yêu cầu trong `12-traceability.md`; 13.9 trong `13-appendices.md`; thêm dòng phiên bản mới ở 0.5 trong `00-document-control.md`.
5. Cập nhật `srs/README.md`.
6. **`SRS_MODE: registry`**, khác với trên:
   - Đọc `srs/_registry.json` và `srs/_permissions.json` **thay cho** việc mở các file module: lấy danh sách FR, vai trò, chứng từ từ đây. Chỉ mở file module khi cần chi tiết luồng.
   - Mã màn hình dạng `SCR-<MODULE>-<3 số>`. Thêm mọi màn hình vào `screens` của registry (kèm `functional`, `roles`, `file`); 03-screen-inventory dùng đúng các mã này.
   - Điền `defaultScreen` trong `_permissions.json` cho **mọi vai trò** (theo câu trả lời "màn hình đầu tiên sau đăng nhập"; chưa rõ thì chọn hợp lý, đặt `"proposed": true` và ghi 13.9).
   - **Không sửa `12-traceability.md`** (code sinh lại, có thêm cột màn hình).

### `prototype`
1. **Bắt buộc gọi skill `design-taste-frontend`** (taste skill) trước khi viết bất kỳ HTML nào, và tuân theo nó trong suốt quá trình dựng giao diện.
2. Đọc [references/prototype-guide.md](references/prototype-guide.md).
3. Đọc `srs/README.md` và toàn bộ `srs/09-ui-ux/`. Mở `05-functional/<module>.md` chỉ khi cần biết luồng xử lý của màn hình.
4. Dựng prototype vào `TARGET_DIR`. Thứ tự: `assets/js/mock-data.js` → `assets/js/layout.js` → `assets/js/app.js` → từng trang HTML → `README.md`.
