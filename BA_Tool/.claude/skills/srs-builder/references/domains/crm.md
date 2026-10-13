# Domain: CRM (Quản lý quan hệ khách hàng)

> Chỉ dùng để gợi ý câu hỏi cho đủ ý. Xem quy tắc ở [README.md](README.md).

**Số câu hỏi nghiệp vụ:** 35–55 (gọn, đủ ý). **Số câu hỏi giao diện:** 25–38 (kỹ — phần quan trọng nhất).

## 1. Module điển hình

| Mã | Module (cách nói với khách) | Thường có | Câu hỏi "cổng" |
|---|---|---|---|
| `LEAD` | Khách hàng tiềm năng | Thu thập từ form web / Facebook / Zalo / nhập tay, phân loại nguồn, chấm điểm, giao cho nhân viên, chuyển đổi | Anh/chị có theo dõi người mới quan tâm (chưa mua) không? |
| `CONT` | Người liên hệ | Thông tin cá nhân, chức vụ, kênh liên lạc, thuộc công ty nào | Khách của anh/chị là cá nhân hay công ty, hay cả hai? |
| `ACCT` | Công ty khách hàng | Thông tin pháp nhân, MST, nhiều người liên hệ, phân hạng | (Chỉ hỏi khi có khách là công ty) |
| `OPP` | Cơ hội bán hàng / Pipeline | Giai đoạn, giá trị dự kiến, xác suất, ngày dự kiến chốt, lý do thắng/thua | Một thương vụ thường đi qua những bước nào? |
| `ACT` | Hoạt động chăm sóc | Cuộc gọi, cuộc hẹn, email, ghi chú, công việc, nhắc lịch | Nhân viên có cần ghi lại mỗi lần gọi / gặp khách không? |
| `QUOT` | Báo giá | Sản phẩm, chiết khấu, VAT, phiên bản báo giá, in PDF, gửi email, duyệt | Có làm báo giá cho khách không? Có cần duyệt trước khi gửi? |
| `ORDER` | Đơn hàng / Hợp đồng | Chuyển từ báo giá, điều khoản thanh toán, theo dõi thanh toán | Có quản lý đơn / hợp đồng trong hệ thống này không? |
| `PROD` | Sản phẩm / dịch vụ & bảng giá | Danh mục, nhiều bảng giá, chiết khấu theo nhóm khách | Giá có khác nhau theo nhóm khách không? |
| `CAMP` | Chiến dịch marketing | Danh sách khách mục tiêu, gửi email/SMS/Zalo hàng loạt, đo kết quả | Có chạy chiến dịch gửi tin hàng loạt không? |
| `TICK` | Hỗ trợ / khiếu nại | Tiếp nhận, phân loại, mức ưu tiên, SLA, giao xử lý, đóng | Có tiếp nhận khiếu nại / yêu cầu hỗ trợ không? |
| `RPT` | Báo cáo & dashboard | Phễu bán hàng, doanh số theo nhân viên, tỉ lệ chuyển đổi, KPI | Quản lý muốn xem những con số nào hằng ngày / hằng tháng? |
| `SYS` | Quản trị hệ thống | Người dùng, vai trò, phân quyền, chi nhánh / đội nhóm, cấu hình | Có chia nhân viên theo đội / chi nhánh không? |

## 2. Luồng nghiệp vụ chính

1. **Lead → Cơ hội:** Nguồn (web, quảng cáo, giới thiệu) → tạo lead → phân công nhân viên → liên hệ, đánh giá → đủ điều kiện → chuyển thành Người liên hệ (+ Công ty) + Cơ hội. Không đủ điều kiện → đánh dấu loại, ghi lý do.
2. **Cơ hội → Báo giá → Đơn:** Cơ hội qua các giai đoạn → lập báo giá → (duyệt nếu vượt mức chiết khấu) → gửi khách → khách đồng ý → tạo đơn / hợp đồng → cơ hội "Thắng". Khách từ chối → sửa báo giá (phiên bản mới) hoặc "Thua" kèm lý do.
3. **Chăm sóc:** Lịch hẹn / công việc → nhắc việc → ghi kết quả → lên lịch bước tiếp theo.
4. **Hỗ trợ:** Tiếp nhận ticket → phân loại, mức ưu tiên → giao người xử lý → xử lý → khách xác nhận → đóng. Quá SLA → báo quản lý (escalation).
5. **Chiến dịch:** Chọn tập khách → soạn nội dung → gửi → theo dõi phản hồi → tạo lead / hoạt động.

## 3. Chứng từ & vòng đời

| Đối tượng | Trạng thái điển hình | Cần hỏi |
|---|---|---|
| Lead | Mới → Đang liên hệ → Đủ điều kiện (đã chuyển đổi) / Không đủ điều kiện | Lead không ai xử lý bao lâu thì thu hồi giao người khác? |
| Cơ hội | Các giai đoạn pipeline (khách tự đặt tên) → Thắng / Thua | Tên và thứ tự các giai đoạn? Xác suất mỗi giai đoạn? |
| Báo giá | Nháp → Chờ duyệt → Đã duyệt → Đã gửi → Khách đồng ý / Khách từ chối / Hết hạn | Ai duyệt, điều kiện nào cần duyệt? Báo giá hiệu lực bao lâu? |
| Đơn / hợp đồng | Mới → Đang thực hiện → Hoàn thành / Đã hủy | Có theo dõi thanh toán nhiều đợt không? |
| Ticket | Mới → Đã tiếp nhận → Đang xử lý → Chờ khách phản hồi → Đã giải quyết → Đã đóng / Mở lại | SLA theo mức ưu tiên? |
| Chiến dịch | Nháp → Đã lên lịch → Đang chạy → Đã kết thúc | Có cần duyệt nội dung trước khi gửi không? |

## 4. Chủ đề phải hỏi

- **Người dùng & vai trò:** giám đốc, trưởng nhóm kinh doanh, nhân viên kinh doanh, CSKH, marketing, kế toán. Nhân viên có được xem khách của người khác không (phạm vi dữ liệu: của mình / của đội / toàn công ty).
- **Phê duyệt nhiều cấp:** chiết khấu vượt mức, báo giá giá trị lớn, hủy đơn. Bao nhiêu cấp, ai duyệt, từ chối thì sao.
- **Đa chi nhánh / đội nhóm:** dữ liệu có tách theo chi nhánh không; quản lý vùng xem được những gì.
- **Phân bổ lead:** chia đều, theo khu vực, theo sản phẩm, hay quản lý tự giao.
- **Trùng dữ liệu:** nhận diện khách trùng bằng số điện thoại / email / MST; xử lý gộp.
- **Quy tắc đánh mã:** mã khách, mã báo giá, mã đơn, mã ticket (ví dụ `BG-2026-00001`).
- **Tiền tệ, thuế, làm tròn:** VNĐ / ngoại tệ, VAT, làm tròn đến đơn vị nào. Múi giờ.
- **Import/Export Excel:** nhập danh sách khách cũ, xuất báo cáo; cột bắt buộc; xử lý dòng lỗi.
- **Báo cáo & KPI:** doanh số, số cơ hội mới, tỉ lệ thắng, giá trị pipeline, thời gian phản hồi; ai xem báo cáo nào; mục tiêu (quota) theo nhân viên.
- **Thông báo:** nhắc lịch, lead mới được giao, báo giá chờ duyệt, ticket quá hạn; kênh (trong app, email, Zalo).
- **Tích hợp:** form web, Facebook Lead Ads, Zalo OA, tổng đài (click-to-call, ghi âm), email, phần mềm kế toán / hóa đơn điện tử.
- **Lịch sử thay đổi (audit):** ai sửa giá trị cơ hội, ai đổi người phụ trách, ai xóa khách.
- **Dữ liệu cũ:** đang lưu ở Excel / phần mềm khác? Có cần chuyển sang không?
- **Thiết bị:** nhân viên đi thị trường có dùng điện thoại không.

## 5. Mâu thuẫn hay gặp (dùng cho vòng câu hỏi bổ sung)

- Nhân viên chỉ xem khách của mình, nhưng CSKH lại cần xem mọi khách để hỗ trợ.
- Có báo giá cần duyệt nhưng không nói ngưỡng duyệt / người duyệt khi vắng mặt.
- Pipeline có giai đoạn nhưng không định nghĩa khi nào được chuyển giai đoạn.
- Muốn báo cáo doanh số nhưng không nói doanh số tính theo ngày ký, ngày giao hay ngày thu tiền.
- Lead "thu hồi" khi quá hạn nhưng không nói ai nhận lại.
