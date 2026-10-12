# Bước 02 — Rule thiết kế giao diện

Quay lại: [01-analyze-srs.md](01-analyze-srs.md) · Bước tiếp theo: [03-generate-srs-design.md](03-generate-srs-design.md)

File này vừa là **hướng dẫn** vừa là **nơi lưu** bộ rule thiết kế. Phần "Bộ rule hiện hành" ở cuối file được skill tự cập nhật từ câu trả lời của người dùng. Không có rule nào được tự bịa ra.

## 2.1. Kiểm tra bộ rule hiện hành

Xem bảng "Bộ rule hiện hành" ở cuối file:

- **Tất cả mục đều `CHƯA CÓ`**: gửi toàn bộ danh sách câu hỏi ở mục 2.2, rồi dừng chờ trả lời.
- **Đã có nội dung**: tóm tắt ngắn cho người dùng và hỏi:
  1. Giữ nguyên bộ rule này cho dự án hiện tại.
  2. Cập nhật một số mục (người dùng ghi mã mục, ví dụ R5, R11).
  3. Làm lại toàn bộ (gửi lại cả danh sách câu hỏi).

  Dừng chờ người dùng chọn. Không tự giả định là giữ nguyên.
- **Một số mục còn `CHƯA CÓ`**: chỉ hỏi những mục đó.

## 2.2. Danh sách câu hỏi (gửi trong một tin nhắn)

Gửi nguyên danh sách dưới đây. Mở đầu bằng hướng dẫn trả lời:

> Hãy trả lời theo mã (ví dụ `R1: ...`). Bạn có thể dán tất cả câu trả lời trong một lần.
> Với mục chưa có thông tin, ghi một trong các cách sau:
> - `Không có`: không áp dụng rule cho mục này.
> - `Để Claude Design tự quyết`: cho phép Claude Design tự chọn.
> - `Theo SRS`: lấy theo nội dung SRS (chỉ dùng khi SRS có nêu).

**A. Thông tin chung**
- R1. Nền tảng mục tiêu: web desktop, web responsive, mobile app (iOS/Android) hay tablet?
- R2. Ngôn ngữ hiển thị trên giao diện?
- R3. Có sẵn design system hoặc brand guideline không? (tên, đường dẫn, file)
- R4. Phong cách mong muốn và sản phẩm/website tham khảo (nếu có)?

**B. Grid và bố cục**
- R5. Các breakpoint và hệ lưới cho từng breakpoint (số cột, gutter, margin)?
- R6. Chiều rộng tối đa của nội dung? Khung bố cục chính (sidebar, top navigation, kết hợp…)?

**C. Khoảng cách và hình khối**
- R7. Thang khoảng cách (đơn vị cơ sở và các bước, ví dụ 4/8/16…)?
- R8. Bo góc, đổ bóng, độ dày viền?

**D. Typography**
- R9. Font chữ cho tiêu đề, nội dung và mã (kèm nguồn font)?
- R10. Thang cỡ chữ, line-height và font-weight cho từng cấp (H1, H2, body, caption…)?

**E. Màu sắc**
- R11. Màu thương hiệu (primary, secondary, accent), kèm mã HEX?
- R12. Màu trung tính (nền, bề mặt, viền, chữ chính, chữ phụ)?
- R13. Màu trạng thái (thành công, cảnh báo, lỗi, thông tin)?
- R14. Có cần dark mode không? Nếu có, bảng màu dark mode là gì?

**F. Responsive**
- R15. Thiết kế ưu tiên mobile-first hay desktop-first? Kích thước màn hình ưu tiên?
- R16. Hành vi khi thu nhỏ màn hình: menu, bảng dữ liệu, form, ảnh?

**G. Accessibility**
- R17. Mức chuẩn WCAG cần đạt (A, AA, AAA)?
- R18. Yêu cầu khác: vùng chạm tối thiểu, hiển thị focus, điều hướng bằng bàn phím, hỗ trợ screen reader…?

**H. Component**
- R19. Thư viện component bắt buộc (ví dụ MUI, Ant Design, shadcn/ui, tự xây) hay không ràng buộc?
- R20. Quy ước cho nút, form, bảng, modal, thông báo (toast/alert)?
- R21. Cách thể hiện các trạng thái: rỗng (empty), đang tải (loading), lỗi (error), thành công?
- R22. Bộ icon sử dụng?

**I. Tài nguyên và rule khác**
- R23. Logo, hình ảnh, asset có sẵn (đường dẫn)?
- R24. Rule bổ sung khác (nếu có)?

Gửi xong thì **dừng lại** chờ người dùng trả lời.

## 2.3. Xử lý câu trả lời

1. Tách câu trả lời theo mã R1…R24.
2. Ghi **nguyên văn ý** của người dùng vào cột "Nội dung đã xác nhận" trong bảng bên dưới (sửa file này bằng công cụ chỉnh sửa file), cập nhật cột "Ngày".
3. Mục người dùng chưa trả lời: giữ `CHƯA CÓ` và hỏi lại **chỉ những mục đó**, rồi dừng chờ.
4. Câu trả lời mơ hồ hoặc mâu thuẫn (ví dụ màu không có mã, hai mã màu cho cùng một vai trò): hỏi lại mục đó, không tự chọn.
5. Rule mâu thuẫn với yêu cầu giao diện trong SRS: nêu rõ mâu thuẫn và hỏi người dùng ưu tiên bên nào.
6. Khi không còn mục `CHƯA CÓ` và không còn câu hỏi đang chờ: **tự động chuyển sang bước 03**, không cần hỏi thêm.

## 2.4. Bộ rule hiện hành

> Phần này do skill cập nhật. Giá trị `CHƯA CÓ` nghĩa là người dùng chưa cung cấp.

| Mã | Nhóm | Mục | Nội dung đã xác nhận | Ngày |
|---|---|---|---|---|
| R1 | Chung | Nền tảng mục tiêu | CHƯA CÓ | |
| R2 | Chung | Ngôn ngữ giao diện | CHƯA CÓ | |
| R3 | Chung | Design system / brand guideline | CHƯA CÓ | |
| R4 | Chung | Phong cách và tham khảo | CHƯA CÓ | |
| R5 | Grid | Breakpoint và hệ lưới | CHƯA CÓ | |
| R6 | Grid | Chiều rộng tối đa và khung bố cục | CHƯA CÓ | |
| R7 | Khoảng cách | Thang khoảng cách | CHƯA CÓ | |
| R8 | Khoảng cách | Bo góc, đổ bóng, viền | CHƯA CÓ | |
| R9 | Typography | Font chữ | CHƯA CÓ | |
| R10 | Typography | Thang cỡ chữ, line-height, weight | CHƯA CÓ | |
| R11 | Màu sắc | Màu thương hiệu | CHƯA CÓ | |
| R12 | Màu sắc | Màu trung tính | CHƯA CÓ | |
| R13 | Màu sắc | Màu trạng thái | CHƯA CÓ | |
| R14 | Màu sắc | Dark mode | CHƯA CÓ | |
| R15 | Responsive | Mobile-first / desktop-first | CHƯA CÓ | |
| R16 | Responsive | Hành vi khi thu nhỏ | CHƯA CÓ | |
| R17 | Accessibility | Mức WCAG | CHƯA CÓ | |
| R18 | Accessibility | Yêu cầu khác | CHƯA CÓ | |
| R19 | Component | Thư viện component | CHƯA CÓ | |
| R20 | Component | Quy ước nút, form, bảng, modal, thông báo | CHƯA CÓ | |
| R21 | Component | Trạng thái empty/loading/error/success | CHƯA CÓ | |
| R22 | Component | Bộ icon | CHƯA CÓ | |
| R23 | Tài nguyên | Logo, hình ảnh, asset | CHƯA CÓ | |
| R24 | Khác | Rule bổ sung | CHƯA CÓ | |
