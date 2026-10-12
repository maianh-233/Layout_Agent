---
name: layout-agent-skill
description: Đọc và phân tích file SRS (đặc tả yêu cầu phần mềm) do skill khác tạo ra, hỏi lại những điểm chưa rõ, áp dụng bộ rule thiết kế giao diện, rồi sinh file `srs_design` tự đủ để Claude Design chỉ cần đọc file đó là thiết kế được. Có bước xác nhận trước khi gửi sang Claude Design (/design) và quy trình xử lý yêu cầu sửa của khách hàng kèm lịch sử thay đổi. Dùng khi người dùng muốn chuyển SRS thành đặc tả thiết kế, tạo/cập nhật srs_design, gửi đặc tả cho Claude Design, hoặc khi khách hàng yêu cầu sửa thiết kế đã làm từ srs_design.
---

# Layout Agent Skill

Skill này biến một file SRS thành file `srs_design`, tức là đặc tả giao diện **tự đủ** dành riêng cho Claude Design, rồi (khi được cho phép rõ ràng) chuyển nó sang Claude Design.

## Nguyên tắc bắt buộc (áp dụng cho mọi bước)

1. **Luôn dùng tiếng Việt** khi trả lời, đặt câu hỏi và viết các file đầu ra.
2. **Không bịa, không tự suy diễn.** Thông tin nào SRS, người dùng hoặc bộ rule không cung cấp thì phải hỏi lại. Không tự điền giả định, kể cả giả định "hợp lý".
3. **Hỏi theo lô, đánh số.** Khi cần hỏi, gom tất cả câu hỏi thành một danh sách đánh số trong một tin nhắn, rồi **dừng lại chờ trả lời**. Không làm tiếp bước sau khi chưa có câu trả lời.
4. **Chỉ ghi nhận đúng lời người dùng.** Nếu người dùng trả lời "không biết", "để sau" hoặc "để Claude Design tự quyết", ghi đúng như vậy và đánh dấu rõ. Không thay bằng giá trị tự chọn.
5. **Không ghi đè khi chưa hỏi.** Nếu file đầu ra đã tồn tại, hỏi người dùng muốn ghi đè, chuyển sang chế độ sửa (bước 05) hay lưu với tên khác.
6. **Không tự kết nối Claude Design.** Chỉ kết nối khi người dùng nói rõ "thực hiện" (bước 04), hoặc đồng ý rõ ràng việc sửa dự án cũ (bước 05).
7. Ghi ngày tháng theo định dạng `YYYY-MM-DD`, lấy theo ngày hiện tại của phiên làm việc.

## Xác định chế độ chạy

Khi được gọi, xác định người dùng đang yêu cầu việc nào:

- **Tạo mới**: có file SRS và cần tạo `srs_design`. Chạy lần lượt bước 01 → 02 → 03 → 04.
- **Sửa theo yêu cầu khách hàng**: đã có `srs_design` và có phản hồi hoặc yêu cầu sửa. Chuyển thẳng đến bước 05.
- **Chỉ gửi sang Claude Design**: đã có `srs_design` hoàn chỉnh. Chuyển đến bước 04.

Nếu không rõ người dùng muốn chế độ nào, hỏi lại. Không tự đoán.

## Luồng làm việc

Đọc và làm theo từng file dưới đây **đúng thứ tự**. Chỉ mở file của bước tiếp theo sau khi bước hiện tại đã hoàn tất.

| Bước | File | Kết quả của bước |
|---|---|---|
| 1 | [01-analyze-srs.md](01-analyze-srs.md) | Có đường dẫn đầu vào/đầu ra, file `srs_analysis.md`, và mọi câu hỏi chưa rõ đã được người dùng trả lời |
| 2 | [02-design-rules.md](02-design-rules.md) | Bộ rule thiết kế đã được người dùng xác nhận |
| 3 | [03-generate-srs-design.md](03-generate-srs-design.md) | File `srs_design` hoàn chỉnh, đúng định dạng |
| 4 | [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md) | Người dùng chọn liên kết ngay với Claude Design (chỉ khi nói rõ "thực hiện") hoặc tự làm |
| 5 | [05-handle-revisions.md](05-handle-revisions.md) | Phân tích và `srs_design` được cập nhật, có lịch sử thay đổi, và sửa dự án cũ nếu được đồng ý |

## Điểm dừng bắt buộc (checkpoint)

Skill **phải dừng và chờ người dùng** tại các điểm sau:

1. Khi chưa có đường dẫn file SRS hoặc đường dẫn file `srs_design`.
2. Khi phân tích SRS còn câu hỏi chưa rõ (bước 01).
3. Khi bộ rule thiết kế chưa có hoặc chưa đầy đủ (bước 02).
4. Trước khi kết nối Claude Design (bước 04).
5. Khi yêu cầu sửa còn điểm chưa rõ, và trước khi sửa dự án cũ trên Claude Design (bước 05).
