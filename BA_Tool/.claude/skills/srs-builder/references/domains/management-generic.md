# Domain: Hệ thống quản lý khác

> Chỉ dùng để gợi ý câu hỏi cho đủ ý. Xem quy tắc ở [README.md](README.md).

**Số câu hỏi nghiệp vụ:** 30–50 (gọn, đủ ý). **Số câu hỏi giao diện:** 25–38 (kỹ — phần quan trọng nhất).

Áp dụng cho phần mềm quản lý nội bộ không phải CRM / ERP chuẩn: quản lý trường học, phòng khám, khách sạn, dự án, tài sản, bảo trì, nhân sự, văn bản… Vì không có danh sách module cố định, hãy **xác định module từ yêu cầu ban đầu** rồi dùng các khung dưới đây để hỏi cho đủ.

## 1. Khung nhận diện module

Với mỗi "thứ" khách cần quản lý (học viên, bệnh nhân, phòng, hợp đồng, thiết bị…), hỏi đủ 6 ý:

| Ý | Câu hỏi đời thường |
|---|---|
| Thông tin | Cần lưu những thông tin gì về …? Thông tin nào bắt buộc? |
| Vòng đời | Một … đi qua những tình trạng nào từ lúc tạo đến lúc kết thúc? |
| Người làm | Ai tạo, ai sửa, ai duyệt, ai chỉ được xem? |
| Liên kết | … gắn với những thứ nào khác (ví dụ học viên ↔ lớp ↔ học phí)? |
| Số lượng | Khoảng bao nhiêu … mỗi tháng / tổng cộng? |
| Báo cáo | Cần thống kê gì về …? |

Mã module tự đặt 2–6 chữ in hoa, không dấu (ví dụ `STUD` học viên, `CLASS` lớp, `FEE` học phí). Các module gần như luôn có:

| Mã | Module | Câu hỏi "cổng" |
|---|---|---|
| `MD` | Danh mục dùng chung | Luôn có |
| `RPT` | Báo cáo & dashboard | Quản lý cần xem những con số nào? |
| `NOTI` | Thông báo & nhắc việc | Có cần nhắc hạn / gửi thông báo không? |
| `SYS` | Quản trị hệ thống | Luôn có |

## 2. Luồng nghiệp vụ

Với mỗi module, hỏi luồng chính theo kiểu: "Kể lại từ đầu đến cuối, khi có một … mới thì ai làm gì, rồi tiếp theo là gì?" và hỏi riêng **trường hợp ngoại lệ** (hủy, trả lại, quá hạn, sai sót).

## 3. Chứng từ & vòng đời

Mẫu vòng đời thường gặp: Nháp → Chờ duyệt → Đã duyệt / Từ chối → Đang thực hiện → Hoàn thành / Đã hủy. Luôn hỏi: trạng thái nào được sửa, ai được chuyển trạng thái, bị từ chối thì quay về đâu.

## 4. Chủ đề phải hỏi

- Vai trò & phạm vi dữ liệu (của mình / phòng ban / chi nhánh / toàn bộ).
- Phê duyệt nhiều cấp: chứng từ nào, mấy cấp, điều kiện, người duyệt thay.
- Đa chi nhánh / cơ sở.
- Quy tắc đánh mã (ví dụ `HV-2026-0001`).
- Tiền tệ, làm tròn, múi giờ (nếu có tiền).
- Import/Export Excel; chuyển dữ liệu cũ.
- Báo cáo, KPI, công thức, ai xem.
- Thông báo, nhắc hạn, kênh gửi.
- Tích hợp bên ngoài (thanh toán, email, Zalo, phần mềm đang dùng).
- Audit: thao tác nào cần lưu lịch sử.
- Thiết bị, dùng khi mất mạng, số người dùng cùng lúc.
- Quy định pháp lý riêng của ngành (bảo mật hồ sơ bệnh nhân, dữ liệu học sinh…).

## 5. Mâu thuẫn hay gặp

- Một đối tượng có nhiều người "phụ trách" nhưng không rõ ai chịu trách nhiệm chính.
- Có duyệt nhưng không nói duyệt xong có sửa được nữa không.
- Báo cáo cần số liệu mà không có module nào thu thập.
