---
name: srs-builder
description: Hỗ trợ BA thu thập yêu cầu khách hàng và tạo tài liệu SRS tiếng Việt chia nhiều file (Phần 0–13), sinh bộ câu hỏi nghiệp vụ/giao diện bằng ngôn ngữ đời thường, và dựng prototype HTML + Tailwind + JS thuần với dữ liệu giả. Dùng khi tool "SRS & Prototype Builder" gọi với MODE business-questions, business-srs, ui-questions, ui-srs hoặc prototype.
---

# SRS Builder

Skill được backend gọi bằng `/srs-builder` kèm các tham số dạng `KHÓA: giá trị`:

```
MODE: <business-questions | business-srs | ui-questions | ui-srs | prototype>
PROJECT_TYPE: <website | ecommerce | crm | erp | management-generic>
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

## Dữ liệu trong `PROJECT_DIR`

| File | Nội dung |
|---|---|
| `request.md` | Yêu cầu ban đầu của BA |
| `answers-business.md` | Câu hỏi nghiệp vụ + câu trả lời (do backend tạo trước khi gọi `business-srs`) |
| `answers-ui.md` | Câu hỏi giao diện + câu trả lời (do backend tạo trước khi gọi `ui-srs`) |
| `srs/` | Các file SRS |

## Các chế độ — đọc file nào, ghi file nào

### `business-questions`
1. Đọc `PROJECT_DIR/request.md`.
2. Đọc [references/question-guide.md](references/question-guide.md) và [references/domains/README.md](references/domains/README.md), rồi đọc **đúng một** file `references/domains/<PROJECT_TYPE>.md`.
3. Ghi bộ câu hỏi nghiệp vụ ra `PROJECT_DIR/questions-business.json` đúng định dạng JSON trong question-guide, **số câu theo file domain**. Dùng mục 1–4 của file domain làm danh sách kiểm tra để không sót chủ đề. Chỉ ghi file này.

### `business-srs`
1. Đọc `request.md`, `answers-business.md`. Có thể đọc `references/domains/<PROJECT_TYPE>.md` **chỉ để phát hiện chủ đề khách chưa trả lời** → ghi vào 13.9 (hoặc `[ĐỀ XUẤT]`). Module khách không xác nhận thì không đưa vào SRS.
2. Đọc [references/srs-structure.md](references/srs-structure.md) và [references/srs-writing-guide.md](references/srs-writing-guide.md).
3. Với mỗi file cần tạo, đọc mẫu cùng tên trong [templates/](templates/) rồi ghi vào `PROJECT_DIR/srs/`. Mỗi module dùng mẫu `templates/05-functional/module.md`.
4. Tạo Phần 0–8 và 10–13. Phần 9: chỉ tạo `09-ui-ux/README.md` với nội dung mẫu `templates/09-ui-ux/README-placeholder.md`.
5. Thứ tự ghi: `00` → `01` → `02` → `03` → `04` → `05-functional/` → `06` → `07` → `08` → `09-ui-ux/README.md` → `10` → `11` → `12` → `13` → cuối cùng `README.md` (mục lục).

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

### `prototype`
1. **Bắt buộc gọi skill `design-taste-frontend`** (taste skill) trước khi viết bất kỳ HTML nào, và tuân theo nó trong suốt quá trình dựng giao diện.
2. Đọc [references/prototype-guide.md](references/prototype-guide.md).
3. Đọc `srs/README.md` và toàn bộ `srs/09-ui-ux/`. Mở `05-functional/<module>.md` chỉ khi cần biết luồng xử lý của màn hình.
4. Dựng prototype vào `TARGET_DIR`. Thứ tự: `assets/js/mock-data.js` → `assets/js/layout.js` → `assets/js/app.js` → từng trang HTML → `README.md`.
