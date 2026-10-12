# Bước 01 — Phân tích file SRS

Quay lại: [SKILL.md](SKILL.md) · Bước tiếp theo: [02-design-rules.md](02-design-rules.md)

## 1.1. Hỏi đường dẫn (mỗi lần chạy)

Vị trí file không cố định, nên **luôn hỏi** người dùng hai thông tin sau trong cùng một tin nhắn, rồi dừng chờ trả lời:

1. Đường dẫn đầy đủ tới **file SRS đầu vào**.
2. Đường dẫn đầy đủ tới **file `srs_design` đầu ra** (thường nằm trong thư mục `docs` của dự án). Nếu người dùng chỉ đưa thư mục mà không có tên file, hỏi lại tên file. Không tự đặt tên.

Thông báo luôn cho người dùng: kết quả phân tích sẽ được lưu thành `srs_analysis.md` **cùng thư mục** với file `srs_design`, trừ khi họ muốn tên hoặc vị trí khác.

Nếu người dùng đã ghi sẵn các đường dẫn này trong yêu cầu thì không cần hỏi lại.

## 1.2. Kiểm tra file đầu vào

- Đọc file SRS. Nếu file không tồn tại hoặc không đọc được, báo lỗi cụ thể và hỏi lại đường dẫn.
- `.md`, `.txt`, `.pdf`: đọc trực tiếp.
- `.docx`: dùng skill đọc Word nếu có trong phiên. Nếu không có, đề nghị người dùng xuất file sang `.md` hoặc `.pdf`.
- Định dạng khác: hỏi người dùng cách đọc, không đoán nội dung.
- Nếu nội dung không giống một tài liệu SRS (ví dụ không có yêu cầu chức năng nào), báo cho người dùng và hỏi có tiếp tục không.
- Nếu file đầu ra `srs_design` đã tồn tại, áp dụng nguyên tắc số 5 trong [SKILL.md](SKILL.md).

## 1.3. Trích xuất thông tin

Đọc **toàn bộ** SRS và trích xuất các nhóm dưới đây. Mỗi mục phải ghi **nguồn** (số mục, tiêu đề hoặc mã yêu cầu trong SRS) để truy ngược được.

| Nhóm | Nội dung cần lấy |
|---|---|
| Thông tin dự án | Tên, mục tiêu, phạm vi, đối tượng sử dụng, nền tảng (nếu SRS có nêu) |
| Vai trò người dùng | Tên vai trò, quyền, những gì mỗi vai trò được xem và làm |
| Yêu cầu chức năng | Giữ nguyên mã gốc (ví dụ FR-001). Nếu SRS không đánh mã, gán mã tạm `YC-01`, `YC-02`… và ghi rõ là mã tạm |
| Yêu cầu phi chức năng liên quan giao diện | Hiệu năng hiển thị, đa ngôn ngữ, khả năng truy cập, thiết bị hỗ trợ… |
| Quy tắc nghiệp vụ | Điều kiện, ràng buộc, validation ảnh hưởng tới form hoặc màn hình |
| Thực thể dữ liệu | Tên thực thể, các trường, kiểu dữ liệu, bắt buộc hay không, ràng buộc |
| Màn hình | Màn hình SRS nêu tên **rõ ràng**, và màn hình **suy ra** từ chức năng (phải ghi lý do suy ra và yêu cầu nguồn) |
| Luồng người dùng | Các bước thao tác, điều kiện rẽ nhánh, kết quả thành công hoặc thất bại |
| Yêu cầu giao diện cụ thể | Bố cục, màu, thương hiệu, tham chiếu… mà SRS có nêu |
| Ngoài phạm vi | Những gì SRS ghi rõ là không làm |

Màn hình "suy ra" chỉ được dùng khi một chức năng trong SRS bắt buộc phải có màn hình đó (ví dụ: "người dùng sửa hồ sơ" thì phải có màn hình sửa hồ sơ). Không thêm màn hình hoặc tính năng mà SRS không đòi hỏi.

## 1.4. Phát hiện điểm chưa rõ

Đánh dấu một mục là **cần hỏi** khi rơi vào một trong các trường hợp sau:

- **Thiếu**: chức năng có nhắc tới nhưng không mô tả đủ để vẽ giao diện (thiếu trường dữ liệu, thiếu kết quả sau thao tác, không rõ vai trò nào dùng).
- **Mơ hồ**: câu chữ hiểu được theo nhiều cách (ví dụ "quản lý đơn hàng" mà không rõ gồm xem, sửa, xóa hay duyệt).
- **Mâu thuẫn**: hai phần trong SRS nói khác nhau.
- **Phụ thuộc chưa xác định**: nhắc tới hệ thống, tài liệu hoặc màn hình khác nhưng không mô tả.

**Không** hỏi về thẩm mỹ (màu, font, khoảng cách…). Những thứ này thuộc bộ rule ở bước 02.

## 1.5. Hỏi người dùng và dừng lại

Nếu có điểm chưa rõ, gửi **một tin nhắn duy nhất** theo mẫu sau, rồi **dừng hẳn**. Không tạo `srs_design`, không điền giả định.

```
Tôi đã đọc SRS: <đường dẫn>. Còn <N> điểm chưa rõ cần bạn trả lời trước khi tiếp tục:

Q1. [Thiếu | Mơ hồ | Mâu thuẫn | Phụ thuộc] <câu hỏi cụ thể>
    - Vị trí trong SRS: <mục / mã yêu cầu>
    - Trích dẫn: "<đoạn liên quan>"
    - Ảnh hưởng tới: <màn hình / trường / luồng nào>
Q2. ...

Bạn có thể trả lời theo số (Q1: ..., Q2: ...). Nếu chưa có câu trả lời cho câu nào,
hãy ghi "để sau". Phần đó sẽ được đánh dấu CHƯA XÁC ĐỊNH và sẽ không được thiết kế.
```

Khi nhận được câu trả lời:

- Ghi từng câu trả lời vào `srs_analysis.md`, kèm ngày và ghi chú "người dùng xác nhận".
- Câu nào chưa được trả lời hoặc trả lời mơ hồ thì hỏi lại **chỉ những câu đó**.
- Câu trả lời làm phát sinh điểm chưa rõ mới thì hỏi tiếp theo cùng mẫu (đánh số tiếp, ví dụ Q7, Q8…).
- Câu trả lời "để sau" thì ghi trạng thái `CHƯA XÁC ĐỊNH (người dùng hoãn)`.

Chỉ sang bước 02 khi **không còn câu hỏi nào đang chờ**.

## 1.6. Định dạng file `srs_analysis.md`

```markdown
# Phân tích SRS — <Tên dự án>

- Nguồn SRS: <đường dẫn>
- Ngày phân tích: YYYY-MM-DD
- Phiên bản phân tích: v1.0

## 1. Thông tin dự án
## 2. Vai trò người dùng
| Mã | Vai trò | Quyền / phạm vi | Nguồn |
## 3. Yêu cầu chức năng
| Mã | Mô tả | Vai trò | Màn hình liên quan | Nguồn |
## 4. Yêu cầu phi chức năng liên quan giao diện
## 5. Quy tắc nghiệp vụ
## 6. Thực thể dữ liệu
| Thực thể | Trường | Kiểu | Bắt buộc | Ràng buộc | Nguồn |
## 7. Danh sách màn hình
| Mã (SCR-xx) | Tên | Loại (rõ ràng / suy ra) | Lý do / yêu cầu nguồn |
## 8. Luồng người dùng
## 9. Ngoài phạm vi
## 10. Câu hỏi và trả lời
| Mã | Câu hỏi | Trả lời của người dùng | Trạng thái | Ngày |
## 11. Lịch sử cập nhật phân tích
| Phiên bản | Ngày | Nội dung thay đổi | Lý do |
```

Mục nào SRS không có thông tin thì ghi `Không có trong SRS`. Không để trống, không tự điền.
