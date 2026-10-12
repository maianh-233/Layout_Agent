# Bước 05 — Xử lý yêu cầu sửa của khách hàng

Quay lại: [SKILL.md](SKILL.md) · Liên quan: [01-analyze-srs.md](01-analyze-srs.md), [03-generate-srs-design.md](03-generate-srs-design.md), [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md)

## 5.1. Thu thập đầu vào

Cần có ba thông tin sau. Thiếu thông tin nào thì hỏi trong **một tin nhắn**, rồi dừng chờ:

1. Đường dẫn file `srs_design` hiện tại. `srs_analysis.md` nằm cùng thư mục; nếu không tìm thấy, hỏi đường dẫn.
2. Nội dung yêu cầu sửa của khách hàng (người dùng dán nguyên văn hoặc tóm tắt).
3. Người yêu cầu và ngày yêu cầu, để ghi lịch sử. Nếu người dùng không nêu, hỏi. Không tự điền.

Đọc lại toàn bộ `srs_design` và `srs_analysis.md` trước khi phân tích.

## 5.2. Phân tích yêu cầu sửa

Tách yêu cầu thành từng mục thay đổi. Gán mã `CR-<số phiên bản mới>-<số thứ tự>`, ví dụ `CR-1.1-01`. Mỗi mục xác định:

| Thuộc tính | Nội dung |
|---|---|
| Loại | Thêm / Sửa / Bỏ |
| Phạm vi | Chỉ giao diện (bố cục, nhãn, thứ tự…) / Thay đổi nghiệp vụ (chức năng, trường, luồng, quyền) / Thay đổi rule thiết kế (R1–R24) |
| Mục bị ảnh hưởng | Mã SCR-xx, FLOW-xx, CMP-xx, Rxx |

Mục nào rơi vào một trong các trường hợp sau là **chưa rõ**:

- Không xác định được màn hình hoặc thành phần nào bị ảnh hưởng.
- Mâu thuẫn với SRS hoặc câu trả lời đã xác nhận trước đó.
- Mâu thuẫn với bộ rule thiết kế (ví dụ khách muốn đổi màu chính khác R11).
- Kéo theo thay đổi ở màn hình khác mà khách chưa nói tới.

Với các mục chưa rõ, hỏi theo mẫu đánh số ở mục 1.5 của [01-analyze-srs.md](01-analyze-srs.md), thêm dòng "Mục thay đổi: CR-x.x-xx", rồi **dừng chờ trả lời**. Không tự chọn cách hiểu.

Nếu khách đổi rule thiết kế, hỏi người dùng: đổi rule **chỉ cho dự án này** (chỉ ghi vào `srs_design`), hay **cập nhật luôn bộ rule chung** trong [02-design-rules.md](02-design-rules.md)? Chỉ sửa file 02 khi người dùng chọn cập nhật bộ rule chung.

## 5.3. Cập nhật `srs_analysis.md`

- Sửa các mục bị ảnh hưởng (yêu cầu, thực thể, màn hình, luồng).
- Ghi câu hỏi và câu trả lời mới vào mục "10. Câu hỏi và trả lời".
- Thêm một dòng vào "11. Lịch sử cập nhật phân tích": phiên bản, ngày, các mã CR, lý do ("Yêu cầu sửa của khách hàng").

## 5.4. Cập nhật `srs_design`

1. **Tăng phiên bản**: sửa nhỏ, chỉ về giao diện thì tăng số phụ (v1.0 → v1.1). Thêm, bỏ màn hình hoặc đổi luồng nghiệp vụ thì tăng số chính (v1.x → v2.0). Nếu không chắc nên tăng số nào, hỏi người dùng.
2. Sửa các mục bị ảnh hưởng theo đúng định dạng ở [03-generate-srs-design.md](03-generate-srs-design.md). **Giữ nguyên mã định danh** của màn hình và component cũ. Màn hình mới thì nhận mã tiếp theo. Màn hình bị bỏ thì chuyển sang mục "9. Ngoài phạm vi thiết kế", ghi "Đã bỏ ở vX.Y", không xóa mất dấu vết.
3. Cập nhật thuộc tính "Phiên bản", "Ngày tạo / cập nhật". Đổi "Trạng thái" thành `Đã cập nhật — chờ thiết kế lại`.
4. **Viết lại mục "11. Thay đổi trong phiên bản này"**, chỉ chứa thay đổi của phiên bản mới:

   ```markdown
   ## 11. Thay đổi trong phiên bản này (vX.Y)
   | Mã | Loại | Mục bị ảnh hưởng | Trước | Sau |
   |---|---|---|---|---|
   | CR-1.1-01 | Sửa | SCR-03 | Nút "Lưu" ở cuối form | Nút "Lưu" cố định ở góc phải trên |
   ```

5. **Thêm một dòng** (không sửa các dòng cũ) vào mục "12. Lịch sử thay đổi": phiên bản, ngày, người yêu cầu, tóm tắt các CR, mục bị ảnh hưởng.
6. Chạy lại phần kiểm tra ở mục 3.4 của file 03 trước khi lưu.

Báo cho người dùng: phiên bản mới, danh sách thay đổi và đường dẫn hai file đã cập nhật.

## 5.5. Hỏi về việc sửa dự án cũ trên Claude Design

Đọc dòng "Liên kết dự án Claude Design" trong `srs_design`.

**Đã có đường dẫn**: gửi tin nhắn sau rồi **dừng chờ**:

```
srs_design đã cập nhật lên vX.Y. Bạn có muốn Claude Design sửa trên dự án cũ không?
Dự án cũ: <đường dẫn>

1. Sửa ngay trên dự án cũ: tôi gọi /design để cập nhật đúng dự án này.
   → Trả lời: "1 - đồng ý sửa dự án cũ"
2. Tự làm: tôi gửi prompt soạn sẵn để bạn tự yêu cầu Claude Design sửa.
   → Trả lời: "2"

Nếu chưa muốn sửa, bạn cứ bỏ qua.
```

**Chưa có đường dẫn**: hỏi người dùng đường dẫn dự án Claude Design cũ. Nếu người dùng không có, báo rằng không thể sửa đúng dự án cũ khi thiếu đường dẫn, và hỏi có muốn tạo thiết kế mới theo [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md) không. Không tự tạo dự án mới.

### Quy tắc diễn giải câu trả lời

| Câu trả lời | Hành động |
|---|---|
| Chọn 1 **và** nói rõ đồng ý sửa dự án cũ | Làm theo mục 5.6 |
| Chọn 2 | Làm theo mục 5.7 |
| Mơ hồ, từ chối, hoặc nói chuyện khác | **Không làm gì.** Báo rằng srs_design vX.Y đã lưu, có thể gọi lại skill khi sẵn sàng |

## 5.6. Phương án 1 — Sửa ngay trên dự án cũ

1. Kiểm tra điều kiện giống bước 1 của mục 4.3 trong [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md).
2. Gọi skill `design` với brief:

   ```
   Cập nhật dự án Claude Design đã có tại <đường dẫn dự án cũ>. Không tạo dự án mới.
   Đọc file <đường dẫn tuyệt đối tới srs_design> (phiên bản vX.Y).
   Chỉ sửa các mục ở "11. Thay đổi trong phiên bản này". Giữ nguyên mọi artboard khác.
   Tuân thủ mục "0. Hướng dẫn dành cho Claude Design".
   ```

3. Theo tài liệu Artifacts, đưa đúng URL của artifact thì Claude cập nhật vào **cùng URL** và mỗi lần publish thành một phiên bản. Nếu kết quả trả về là một **đường dẫn khác** đường dẫn cũ, báo ngay cho người dùng: dự án cũ chưa được sửa và đã phát sinh dự án mới. Hỏi người dùng muốn xử lý thế nào. Không tự ghi đè đường dẫn cũ trong `srs_design`.
4. Nếu thành công trên cùng đường dẫn: đổi "Trạng thái" thành `Đã gửi Claude Design (vX.Y)`, rồi bổ sung "đã áp dụng trên Claude Design" vào dòng lịch sử của phiên bản này.
5. Nếu lỗi: báo nguyên văn lỗi và đề nghị phương án 2.

## 5.7. Phương án 2 — Tự làm

Gửi cho người dùng:

```
Mở dự án Claude Design cũ: <đường dẫn>.
Đính kèm file srs_design mới (<đường dẫn>, vX.Y) hoặc dán mục 11 vào chat, kèm prompt:
"Cập nhật thiết kế hiện tại theo mục '11. Thay đổi trong phiên bản này' của srs_design vX.Y.
Chỉ sửa các mục được liệt kê, giữ nguyên phần còn lại."

Hoặc trong Claude Code, gõ:
/design Cập nhật dự án Claude Design tại <đường dẫn dự án cũ>, không tạo dự án mới.
Đọc <đường dẫn tuyệt đối tới srs_design>, chỉ sửa các mục ở mục 11.
```

Sau đó dừng. Không gọi `/design`.
