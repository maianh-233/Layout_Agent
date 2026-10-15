# Luồng chuẩn — 10 câu hỏi → một SRS gộp (nghiệp vụ + giao diện) → prototype

Dùng cho MODE `questions` và `srs` (dự án `flow: standard`, luôn `SRS_MODE: registry`). Mục tiêu: **prototype đúng ý khách để show ngay, tốn ít lượt AI**. Hỏi ít, AI tự bổ sung phần còn lại và đánh dấu `[ĐỀ XUẤT]` để BA xác nhận sau.

**Tiết kiệm token (bắt buộc):** chỉ đọc đúng các file liệt kê; đọc mỗi file **một lần**; mỗi file SRS ghi **một lần bằng Write** (không đọc lại file vừa ghi, không sửa vụn); không mở `templates/` ngoài 2 mẫu được nêu; không đọc file domain ở MODE `srs`.

## MODE `questions` — tối đa 10 câu

1. Đọc `PROJECT_DIR/request.md`, mục "Chọn `type`" và "Định dạng JSON" trong [question-guide.md](question-guide.md), và **chỉ bảng module (mục 1)** của `references/domains/<PROJECT_TYPE>.md` (đọc ~25 dòng đầu) để làm phương án chọn.
2. Ghi `PROJECT_DIR/questions-business.json` (đúng định dạng JSON của question-guide): **tối đa 10 câu** (nên 8–10), 2–4 nhóm.
   - Chỉ hỏi điều **làm prototype khác đi** và AI không tự đoán được. Không hỏi điều `request.md` đã rõ.
   - **Được gộp nhiều ý cùng chủ đề vào một câu** (khác question-guide nguyên tắc 3); liệt kê các ý cần nói trong `hint`. Ví dụ: "Những ai sẽ dùng hệ thống, và mỗi người cần xem / làm được gì?" — hint: "Ví dụ: giám đốc xem báo cáo toàn công ty; nhân viên bán hàng chỉ thấy khách của mình…".
   - Ưu tiên `single` / `multi` có sẵn phương án (khách trả lời nhanh); `text` chỉ khi buộc phải mô tả.
   - Ngôn ngữ đời thường như question-guide (không "module", "role", "workflow"…). `srsSections` vẫn bắt buộc.
3. Chủ đề gợi ý (chọn và gộp cho vừa 10 câu, bám ngành trong `request.md`):

   | Hệ thống quản lý (`crm`, `erp`, `management-generic`) | Website / thương mại điện tử (`website`, `ecommerce`) |
   |---|---|
   | Ai dùng, mỗi người xem / làm được gì (2.6, 4.2) | Doanh nghiệp, sản phẩm / dịch vụ, khách mục tiêu (1.2, 3.1) |
   | Cần những phần nào — `multi` theo bảng module (1.5, 5.x) | Mục tiêu chính của web: khách gọi / đặt lịch / mua / đăng ký (1.3) |
   | Giấy tờ chính (đơn, phiếu, hợp đồng…) đi qua những bước nào, ai duyệt, điều kiện duyệt (3.5, 5.6) | Các trang / phần cần có — `multi` (9.8) |
   | Thông tin quan trọng nhất cần xem trong danh sách chính (cột, lọc) (7.4, 9.13) | Cách khách mua / đặt / thanh toán, ai xử lý đơn phía cửa hàng (3.3, 5.x) |
   | Vào hệ thống thấy gì đầu tiên, con số nào cần thấy ngay (9.6, 9.11) | Giá, khuyến mãi, giao hàng — quy định chính (3.5) |
   | Quy tắc đặc thù: đánh mã, giá / chiết khấu, tồn kho, công nợ… (3.5) | Phong cách, màu, logo, web tham khảo thích / không thích (9.1–9.4) |
   | Phong cách: gọn nhiều dữ liệu hay thoáng; màu, logo; phần mềm từng dùng thích / ghét gì (9.1–9.5) | Hình ảnh / nội dung đã có sẵn chưa (9.1) |
   | Dùng trên máy tính, máy tính bảng hay điện thoại (9.16) | Kênh liên hệ: hotline, Zalo, Messenger, bản đồ (8.7) |
   | Xuất Excel, in, kết nối phần mềm khác (8.3) | Khách dùng điện thoại hay máy tính nhiều hơn (9.16) |

4. Chỉ ghi file này.

## MODE `srs` — viết toàn bộ SRS trong một lượt

### Đọc (theo thứ tự, mỗi file một lần)

`PROJECT_DIR/request.md`, `PROJECT_DIR/answers-business.md`, [srs-structure.md](srs-structure.md) (số mục), [registry-guide.md](registry-guide.md), [design-guide.md](design-guide.md), [layout-guide.md](layout-guide.md) mục 1–2, `templates/05-functional/module.md`, `templates/09-ui-ux/screens/screen.md`.

### Nguyên tắc nội dung

1. **Câu khách đã trả lời** → viết như yêu cầu đã chốt. **Câu bỏ qua / chưa hỏi** → AI tự chọn phương án hợp lý theo ngành, gắn `[ĐỀ XUẤT]` ở đầu dòng / ô, và gom vào 13.9 theo chủ đề (bảng `OI-xxx | Vấn đề | Cần hỏi khách điều gì | Liên quan | Trạng thái`, tối đa ~15 dòng). `[CẦN XÁC NHẬN]` chỉ dùng cho điều không thể tự đề xuất (tên pháp nhân, giá cụ thể của khách, số liệu nội bộ…).
2. **Giữ đủ tiêu đề mục 0–13** theo srs-structure; mục không áp dụng ghi `Không áp dụng — <lý do>`.
3. **Nghiệp vụ gọn:** Phần 1–8, 10, 11, 13 mỗi mục 1–6 dòng, ưu tiên bảng / gạch đầu dòng, dẫn chiếu (`xem 5.6`) thay vì chép lại. Giữ chi tiết ở: vai trò & phân quyền, chứng từ & trạng thái, thực thể & trường (7.4), quy tắc ảnh hưởng màn hình (validation, đánh mã, điều kiện duyệt), công thức KPI.
4. **Giao diện chi tiết (Phần 9):** theo design-guide — đây là phần quan trọng nhất.
5. **Giới hạn để vừa một lượt:** chỉ các màn hình cần cho buổi demo — mỗi module tối đa 3–4 màn hình (danh sách, chi tiết, form tạo / sửa; dashboard nếu có); website: các trang khách chọn. 5.3 chỉ luồng chính; 5.5 chỉ luồng liên module (còn lại `Không áp dụng — xem 5.3`); 5.8 mỗi FR 1–2 test case.
6. **Mermaid:** nhãn có dấu ngoặc, hai chấm, `/` thì bọc `"..."`. Context / use case `flowchart LR`, quy trình / activity `flowchart TD`, sequence `sequenceDiagram`, trạng thái `stateDiagram-v2`, ERD `erDiagram`, sitemap `flowchart TD`.
7. Mã, registry, phân quyền theo registry-guide (mã `<LOẠI>-<MODULE>-<3 số>`; module tự đặt mã 2–8 chữ in hoa nếu cần).

### Ghi file (thứ tự)

1. `00-document-control.md` — 0.3 `Nháp — chưa chốt phiên bản`; 0.5 chỉ bảng trống `| Phiên bản | Ngày | Người soạn | Nội dung |`; 0.7 `Nháp`.
2. `01-introduction.md`, `02-overall-description.md`, `03-business-requirements.md`, `04-user-requirements.md` (4.2: mô tả vai trò bằng lời + đúng một dòng `<!-- AUTO:RBAC --><!-- /AUTO:RBAC -->`).
3. `05-functional/README.md`, mỗi module `05-functional/<mã module viết thường>.md` theo mẫu module (5.1–5.8; 5.6 có `stateDiagram-v2` + bảng chuyển trạng thái cho mỗi chứng từ), `05-functional/_integration.md` (một module thì ghi ngắn `Không áp dụng`).
4. `06-non-functional.md` (6.8, 6.9, 6.11 lấy theo Phần 9), `07-data-requirements.md`, `08-external-interfaces.md` (8.1 dẫn chiếu Phần 9).
5. Phần 9 trong `09-ui-ux/`: `README.md` (mục lục Phần 9), `01-design-system.md` (9.1–9.5), `02-navigation-sitemap.md` (9.6–9.8), `03-screen-inventory.md` (9.9, bảng `SCR | Tên | slug | Vai trò | Module | FR | File đặc tả | File prototype`), `04-states-responsive.md` (9.12 thư viện component, 9.14–9.18), `screens/<slug>.md` cho từng màn hình đủ 9 mục của design-guide mục 3. Responsive trong đặc tả theo layout-guide (khung rộng, lưới thêm cột ở `xl/2xl`, bảng thành thẻ dưới `md`).
6. `_design-tokens.json` theo design-guide mục 1; `layout.contentMaxWidth` ≥ `1600px` để màn rộng không bị dồn giữa.
7. `10-system-design-constraints.md`, `11-verification-validation.md`, `13-appendices.md` (13.9 như nguyên tắc 1). **Không viết `12-traceability.md`** (code sinh).
8. `_registry.json` (đủ mọi mã đã dùng, **kể cả `screens`**) và `_permissions.json` (**kể cả `defaultScreen` cho mọi vai trò**) — ghi một lần sau khi viết xong các file trên.
9. `README.md` (mục lục): bảng `File | Tóm tắt 1 dòng | Trạng thái (Nháp) | Số chỗ CẦN XÁC NHẬN` + dòng tổng số FR, US, UC, màn hình, vấn đề mở (đếm từ registry).
10. Trả lời một dòng: số module, số màn hình, số `[ĐỀ XUẤT]` đáng chú ý.
