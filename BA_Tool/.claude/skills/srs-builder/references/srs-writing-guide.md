# Hướng dẫn viết SRS

## 1. Nguyên tắc nội dung

1. **Không bịa thông tin.** Chỉ viết điều có trong yêu cầu ban đầu và câu trả lời của khách.
2. **`[CẦN XÁC NHẬN]`**: chỗ nào khách chưa trả lời, trả lời "Chưa rõ", hoặc câu bị bỏ qua thì ghi `[CẦN XÁC NHẬN]` ngay tại chỗ, kèm một câu ngắn nói thiếu gì. Đồng thời thêm một dòng vào **13.9 Open Issues and Pending Decisions** ghi rõ cần hỏi lại khách điều gì.
3. **`[ĐỀ XUẤT]`**: mọi nội dung AI tự đề xuất (yêu cầu phi chức năng chuẩn ngành, trường dữ liệu thường gặp, quy tắc hợp lý…) phải gắn `[ĐỀ XUẤT]` ở đầu dòng/ô để BA xác nhận với khách. Không trình bày đề xuất như sự thật.
4. Mục không áp dụng cho dự án: ghi `Không áp dụng` kèm lý do ngắn. Không xóa tiêu đề mục.
5. Viết tiếng Việt, câu ngắn, rõ. Giữ thuật ngữ tiếng Anh trong ngoặc khi cần, ví dụ "Ca sử dụng (Use Case)".
6. Ưu tiên bảng cho danh sách có nhiều thuộc tính.

### Mức độ chi tiết — giao diện kỹ, nghiệp vụ gọn

**Phần 9 (giao diện) là phần quan trọng nhất**: prototype phải đúng ý khách và đội frontend dựng tiếp từ đó → viết theo [design-guide.md](design-guide.md), chi tiết đến từng cột, trường, nút, quyền, trạng thái.

**Phần nghiệp vụ (0–8, 10–13) viết gọn nhưng đủ ý:**
- Dùng bảng và gạch đầu dòng; không viết đoạn văn dài, không lặp lại cùng nội dung ở nhiều nơi (dẫn chiếu `xem 5.6` thay vì chép lại).
- **Giữ chi tiết** ở những gì prototype và frontend cần: vai trò & phân quyền, chứng từ & trạng thái, thực thể & trường dữ liệu (7.4), quy tắc ảnh hưởng tới màn hình (validation, đánh mã, làm tròn, điều kiện duyệt), công thức KPI của dashboard.
- **Viết ngắn**: 5.3 chỉ luồng chính của module; 5.5 chỉ cho luồng liên module / tích hợp ngoài (còn lại ghi `Không áp dụng — xem 5.3`); 5.8 mỗi FR 1–2 test case (thành công + lỗi chính); Phần 10, 11 ở mức tóm tắt; 13.1–13.5 dẫn chiếu tới sơ đồ đã có thay vì vẽ lại.

## 2. Quy ước mã (ghi lại ở 12.1)

> **`SRS_MODE: registry`** (dự án mới): dùng quy ước `<LOẠI>-<MODULE>-<3 số>` và sổ đăng ký mã theo [registry-guide.md](registry-guide.md); bảng dưới chỉ áp dụng cho `SRS_MODE: legacy` (dự án cũ).

| Tiền tố | Ý nghĩa | Ví dụ | Nơi định nghĩa |
|---|---|---|---|
| `BR-` | Quy tắc / yêu cầu nghiệp vụ | BR-001 | 03 (3.2, 3.5) |
| `US-` | User Story | US-001 | 04 (4.4) |
| `UC-` | Use Case | UC-001 | 02 (2.9), chi tiết ở 05 |
| `FR-` | Yêu cầu chức năng | FR-001 | 05 (5.4) |
| `NFR-` | Yêu cầu phi chức năng | NFR-001 | 06 |
| `TC-` | Test case | TC-001 | 05 (5.8), 11 (11.4) |
| `SCR-` | Màn hình | SCR-001 | 09-ui-ux (9.9) |
| `OI-` | Vấn đề mở | OI-001 | 13 (13.9) |

- Đánh số 3 chữ số, liên tục trong toàn bộ SRS. **Không trùng, không đổi mã** đã cấp.
- Mỗi FR phải truy ngược được về ít nhất một US hoặc BR, và có ít nhất một TC (Phần 12).

## 3. Sơ đồ — dùng Mermaid

Mọi sơ đồ viết bằng khối ```` ```mermaid ````. Giữ sơ đồ gọn, nhãn tiếng Việt, **không dùng ký tự đặc biệt chưa đặt trong ngoặc kép** trong nhãn (bọc nhãn bằng `"..."` khi có dấu ngoặc, dấu hai chấm, dấu `/`).

| Sơ đồ | Mermaid | Nơi đặt |
|---|---|---|
| Context (2.4) | `flowchart LR` | 02 |
| Use Case (2.8, 13.1) | `flowchart LR` (actor là nút tròn `(("Khách hàng"))`, use case là nút bo `(["Đặt hàng"])`) | 02, 13 |
| Business Process (3.4) | `flowchart TD` | 03 |
| Activity (5.3) | `flowchart TD` với `subgraph` làm swimlane | 05 |
| Sequence (5.5) | `sequenceDiagram` | 05 |
| State (5.6, 13.4) | `stateDiagram-v2` | 05, 13 |
| ERD (7.3, 13.5) | `erDiagram` | 07, 13 |
| Sitemap (9.8) | `flowchart TD` | 09-ui-ux |

## 4. Cách viết từng file

- **README.md (mục lục)**: bảng gồm `File`, `Tóm tắt 1 dòng`, `Trạng thái` (`Nháp` / `Đã xác nhận`), `Số chỗ CẦN XÁC NHẬN`. File mới tạo luôn ở trạng thái `Nháp`. Thêm dòng tổng: số FR, US, UC, màn hình, vấn đề mở.
- **00**: 0.3 bắt đầu `v0.1`; bước giao diện tăng lên `v0.2`. 0.5 mỗi lần chạy thêm 1 dòng (phiên bản, ngày, người soạn "SRS Builder (AI) – BA review", nội dung). 0.6 để trống ô ký. 0.7 = `Nháp`.
- **01**: 1.5/1.6 dạng danh sách gạch đầu dòng, mỗi dòng gắn BR/FR liên quan khi có.
- **02**: 2.6 bảng vai trò; 2.9 bảng UC (mã, tên, tác nhân, module).
- **03**: 3.5 bảng `BR-xxx | Quy tắc | Nguồn (câu hỏi qN)`. 3.8 kịch bản dạng câu chuyện ngắn.
- **04**: 4.4 dạng "Là <vai trò>, tôi muốn <mục tiêu> để <lợi ích>". 4.7 Given/When/Then. 4.8 MoSCoW.
- **05-functional/README.md**: bảng module: `slug`, tên, tóm tắt 1 dòng, các UC/FR.
- **05-functional/<module>.md**: đủ 5.1 → 5.8 theo mẫu. 5.6 chỉ viết khi có đối tượng có vòng đời trạng thái; nếu không ghi `Không áp dụng`.
- **06**: mỗi yêu cầu một mã NFR. Hầu hết NFR không đến từ khách thì gắn `[ĐỀ XUẤT]`.
- **07**: 7.4 từ điển dữ liệu dạng bảng `Thực thể | Trường | Kiểu | Bắt buộc | Ràng buộc | Mô tả`.
- **08**: prototype dùng dữ liệu giả, nên 8.4–8.6 mô tả ở mức khái quát và gắn `[ĐỀ XUẤT]` nếu khách chưa nêu.
- **12**: 12.2 ma trận BR → US → UC → FR → TC (→ SCR sau bước giao diện). 12.8 nêu tỉ lệ bao phủ và các mục còn thiếu.
- **13.9**: bảng `OI-xxx | Vấn đề | Cần hỏi khách điều gì | Liên quan (mục/mã) | Trạng thái (Mở)`.

## 5. Bước giao diện (ui-srs)

> **`SRS_MODE: registry`**: làm theo [design-guide.md](design-guide.md) (design tokens `_design-tokens.json`, thư viện component, đặc tả màn hình đầy đủ 9 mục). Các gạch đầu dòng dưới đây là tối thiểu cho `SRS_MODE: legacy`.

- `09-ui-ux/03-screen-inventory.md`: bảng `SCR-xxx | Tên màn hình | slug | Vai trò | Module | FR liên quan | File đặc tả`.
- Mỗi `screens/<screen-slug>.md`: 9.10 wireframe (khối ASCII hoặc mô tả theo vùng), 9.11 đặc tả (mục đích, thành phần, dữ liệu hiển thị, hành động → kết quả), 9.13 form/bảng (trường, kiểu, bắt buộc, validation, thông báo lỗi).
- Design system (9.2–9.5) lấy từ câu trả lời giao diện; nếu khách không có, đề xuất bảng màu/font phù hợp ngành và gắn `[ĐỀ XUẤT]`. Mã màu ghi HEX.
- Khi cập nhật các file cũ: dùng thao tác sửa đúng mục, không ghi đè cả file. Thêm `(cập nhật v0.2)` sau tiêu đề mục đã sửa.

## 6. Chế độ registry (`SRS_MODE: registry`)

- Đọc [registry-guide.md](registry-guide.md) trước khi viết. Ghi `srs/_registry.json`, `srs/_permissions.json` **song song** với các file SRS (thêm mã nào vào file nào thì thêm vào registry ngay).
- **Không viết `12-traceability.md`** và **không viết bảng ma trận ở 4.2** — code sinh (xem registry-guide mục 5).
- Tạo thêm `05-functional/_integration.md` theo mẫu `templates/05-functional/_integration.md`. Hệ thống chỉ có một module thì ghi ngắn "Không áp dụng — chỉ có một module".
- Mỗi file module tên theo mã module viết thường: `05-functional/sales.md`, `05-functional/inv.md`…

## 7. Nội dung bắt buộc cho CRM / ERP / hệ thống quản lý

Chỉ viết khi **có dữ liệu từ câu trả lời** (kể cả câu hỏi bổ sung). Thiếu dữ liệu → ghi `[CẦN XÁC NHẬN]` tại chỗ + một dòng 13.9. Không lấy nội dung từ file domain để điền (xem `domains/README.md`).

| Nội dung | Đặt ở đâu | Cách viết |
|---|---|---|
| Ma trận phân quyền (RBAC) | 4.2 + `_permissions.json` | 4.2: mô tả từng vai trò, phạm vi dữ liệu, nguyên tắc phân quyền bằng lời + dòng `<!-- AUTO:RBAC --><!-- /AUTO:RBAC -->`. Ma trận chi tiết ghi trong `_permissions.json`. 6.4 chỉ dẫn chiếu tới 4.2. |
| Luồng phê duyệt | 3.5 (mục con "Ma trận phê duyệt") + 5.6 của module | Bảng `Chứng từ \| Cấp \| Người duyệt (ROLE) \| Điều kiện \| Duyệt thay khi vắng \| Khi từ chối \| BR`. Mỗi dòng có một mã BR. Bước duyệt phải xuất hiện thành chuyển trạng thái trong 5.6. |
| Vòng đời chứng từ | 5.6 của module + `documents` trong registry + 13.4 | Mỗi chứng từ: một khối `stateDiagram-v2` **và** bảng `Trạng thái hiện tại \| Sự kiện \| Điều kiện \| Trạng thái mới \| Ai thực hiện (ROLE) \| Quyền`. Mọi trạng thái không phải trạng thái cuối phải có đường ra. Nội dung bảng phải trùng `documents[].transitions`. |
| Liên kết giữa các module | `05-functional/_integration.md` | Sơ đồ tổng thể `flowchart LR` + bảng `Sự kiện nguồn (module · chứng từ · trạng thái) \| Tác động (module đích · dữ liệu thay đổi) \| Thời điểm \| Đồng bộ/không \| BR \| FR`. Ví dụ: duyệt đơn bán → giữ tồn kho; xuất kho → tạo công nợ phải thu. |
| Quy tắc đánh mã chứng từ | 3.5 (mục con "Quy tắc đánh mã") + `documents[].numbering` | Bảng `Chứng từ \| Mẫu mã \| Reset theo \| Ví dụ`, ví dụ `DH-{YYYY}-{00000}` → `DH-2026-00001`. |
| Tiền tệ, làm tròn, múi giờ | 3.5 (BR) + 6.12 | Đơn vị tiền, số lẻ, cách làm tròn từng loại số (đơn giá, thành tiền, thuế), định dạng ngày, múi giờ. |
| Báo cáo & dashboard | Module `RPT` (`05-functional/rpt.md`) | Bảng `Báo cáo / KPI \| Công thức \| Nguồn dữ liệu (ENT) \| Bộ lọc \| Vai trò được xem \| Kỳ cập nhật \| FR`. Công thức ghi rõ phép tính, ví dụ `Tỉ lệ thắng = số cơ hội Thắng / (Thắng + Thua) trong kỳ`. |
| Import / Export | 8.3 (mục con "Nhập / xuất file") + FR của module liên quan | Bảng `Đối tượng \| Chiều (nhập/xuất) \| Định dạng \| Cột bắt buộc \| Kiểm tra \| Xử lý dòng lỗi \| Giới hạn số dòng \| FR`. |
| Dữ liệu | 7.2–7.6, 13.5 | 7.3: **một ERD tổng** (thực thể + quan hệ); thêm `erDiagram` riêng cho module nào có từ 5 thực thể trở lên. 7.4 Data Dictionary cột `Thực thể \| Trường \| Kiểu \| Bắt buộc \| Ràng buộc \| Ví dụ \| Mô tả` cho mọi thực thể trong registry. |
| Audit | 6.15 + 7.13 | Bảng `Đối tượng \| Thao tác cần ghi \| Thông tin ghi (ai, lúc nào, giá trị cũ → mới, IP) \| Thời gian lưu \| Ai xem được`. |

Yêu cầu kiểm thử được: không viết "nhanh", "dễ dùng", "nhiều" — luôn có con số hoặc điều kiện cụ thể; khách chưa nêu thì `[ĐỀ XUẤT]` kèm con số đề xuất.
