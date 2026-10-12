# Bước 03 — Sinh file `srs_design`

Quay lại: [02-design-rules.md](02-design-rules.md) · Bước tiếp theo: [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md)

## 3.1. Điều kiện trước khi sinh

Chỉ sinh file khi **cả ba** điều kiện sau đều đúng:

1. `srs_analysis.md` đã có và không còn câu hỏi nào đang chờ trả lời (xem [01-analyze-srs.md](01-analyze-srs.md)).
2. Bộ rule ở [02-design-rules.md](02-design-rules.md) không còn mục `CHƯA CÓ`.
3. Đã có đường dẫn file `srs_design` đầu ra do người dùng cung cấp.

Nếu thiếu điều kiện nào, quay lại bước tương ứng. Không sinh file dở dang.

## 3.2. Nguyên tắc nội dung

- **Tự đủ**: Claude Design chỉ đọc file này. Không viết kiểu "xem file SRS" hay "xem 02-design-rules.md". Mọi thông tin cần thiết phải được chép vào đây.
- **Chỉ dùng dữ liệu đã xác nhận**: lấy từ `srs_analysis.md` (SRS và câu trả lời của người dùng) và bộ rule. Không thêm màn hình, trường, nút hay tính năng mới.
- **Đánh dấu rõ phần chưa xác định**: mục có trạng thái `CHƯA XÁC ĐỊNH (người dùng hoãn)` phải ghi đúng `CHƯA XÁC ĐỊNH`, kèm chỉ dẫn cho Claude Design: chỉ vẽ khung placeholder có nhãn "Chưa xác định", không tự thiết kế chi tiết.
- **Truy vết được**: mỗi màn hình và mỗi hành động ghi mã yêu cầu nguồn (FR-xxx hoặc mã tạm YC-xx).
- **Dữ liệu minh họa**: chỉ dùng các trường đã có trong phân tích. Nếu SRS có ví dụ giá trị thì dùng ví dụ đó. Nếu không có, ghi "Claude Design tạo dữ liệu minh họa phù hợp kiểu dữ liệu", không tự liệt kê giá trị.
- **Mã định danh ổn định**: màn hình `SCR-01`, component dùng chung `CMP-01`, luồng `FLOW-01`. Không đổi mã giữa các phiên bản (bước 05 cần dựa vào đó).
- Viết bằng tiếng Việt, câu ngắn, dùng bảng khi liệt kê.

## 3.3. Định dạng bắt buộc của `srs_design`

Dùng đúng thứ tự và tiêu đề các phần dưới đây. Phần nào không có dữ liệu thì ghi `Không có`, không xóa tiêu đề.

````markdown
# SRS Design — <Tên dự án>

| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | v1.0 |
| Ngày tạo / cập nhật | YYYY-MM-DD |
| Nguồn SRS | <đường dẫn file SRS> |
| File phân tích | <đường dẫn srs_analysis.md> |
| Liên kết dự án Claude Design | Chưa có |
| Trạng thái | Sẵn sàng thiết kế |

## 0. Hướng dẫn dành cho Claude Design
1. Đọc toàn bộ file này trước khi thiết kế. File này là nguồn yêu cầu duy nhất.
2. Thiết kế đúng và đủ các màn hình ở mục 5. Không thêm màn hình, chức năng hoặc trường dữ liệu ngoài file.
3. Tuân thủ bộ rule ở mục 3. Mục ghi "Để Claude Design tự quyết" thì được tự chọn, nhưng phải thống nhất trên mọi màn hình.
4. Phần ghi CHƯA XÁC ĐỊNH: chỉ vẽ khung placeholder có nhãn "Chưa xác định", không tự thiết kế chi tiết.
5. Mỗi màn hình phải có đủ các trạng thái được liệt kê (rỗng, đang tải, lỗi, thành công) nếu mục đó có yêu cầu.
6. Đặt tên artboard theo mã và tên màn hình, ví dụ "SCR-01 — Đăng nhập".
7. Khi cập nhật theo phiên bản mới, chỉ sửa các mục ghi ở "Thay đổi trong phiên bản này" (mục 11), giữ nguyên phần còn lại.

## 1. Tổng quan sản phẩm
- Mục tiêu:
- Đối tượng người dùng:
- Nền tảng:
- Ngôn ngữ giao diện:
- Phạm vi thiết kế:

## 2. Vai trò người dùng
| Mã | Vai trò | Được truy cập màn hình | Ghi chú quyền |

## 3. Bộ rule thiết kế
(Chép đầy đủ bảng "Bộ rule hiện hành" R1–R24 từ bước 02, gồm cột Mã, Mục, Nội dung đã xác nhận.)

## 4. Sitemap và điều hướng
- Cây điều hướng (dạng danh sách lồng nhau)
| Mã màn hình | Tên | Route / vị trí | Vào từ đâu | Đi tới đâu |

## 5. Đặc tả từng màn hình
### SCR-01 — <Tên màn hình>
- Vai trò sử dụng:
- Mục đích:
- Yêu cầu nguồn: FR-xxx, ...
- Bố cục (theo vùng): Header / Sidebar / Nội dung chính / Footer — mô tả nội dung từng vùng
- Thành phần:
  | Thành phần | Loại | Mô tả / nội dung | Component dùng chung (CMP-xx) |
- Trường dữ liệu:
  | Trường | Nhãn hiển thị | Kiểu | Bắt buộc | Validation / thông báo lỗi | Ví dụ |
- Hành động:
  | Hành động | Điều kiện | Kết quả / điều hướng | Yêu cầu nguồn |
- Trạng thái cần thể hiện: rỗng / đang tải / lỗi / thành công / khác
- Ghi chú responsive:
- Mục CHƯA XÁC ĐỊNH (nếu có):

(Lặp lại cho từng màn hình.)

## 6. Luồng người dùng
### FLOW-01 — <Tên luồng>
1. <Bước> (SCR-xx)
2. ...
- Nhánh lỗi / ngoại lệ:

## 7. Component dùng chung
| Mã | Tên | Dùng ở màn hình | Biến thể | Mô tả hành vi |

## 8. Dữ liệu hiển thị
| Thực thể | Trường | Kiểu | Hiển thị ở màn hình | Ghi chú dữ liệu minh họa |

## 9. Ngoài phạm vi thiết kế
- ...

## 10. Tiêu chí nghiệm thu thiết kế
- [ ] Đủ toàn bộ màn hình ở mục 5, đúng mã và tên
- [ ] Mỗi màn hình có đủ thành phần, trường và hành động đã liệt kê
- [ ] Điều hướng khớp mục 4, không có liên kết tới màn hình không tồn tại
- [ ] Tuân thủ bộ rule ở mục 3 và thống nhất giữa các màn hình
- [ ] Thể hiện đủ các trạng thái yêu cầu
- [ ] Không có tính năng ngoài phạm vi
- [ ] Phần CHƯA XÁC ĐỊNH chỉ là placeholder có nhãn

## 11. Thay đổi trong phiên bản này
Không có (phiên bản đầu tiên).

## 12. Lịch sử thay đổi
| Phiên bản | Ngày | Người yêu cầu | Nội dung thay đổi | Mục bị ảnh hưởng |
|---|---|---|---|---|
| v1.0 | YYYY-MM-DD | — | Tạo mới từ SRS | Toàn bộ |
````

## 3.4. Kiểm tra trước khi lưu

Rà lại trước khi ghi file:

- Mọi yêu cầu chức năng trong `srs_analysis.md` đều xuất hiện ở ít nhất một màn hình, hoặc nằm trong mục "Ngoài phạm vi".
- Không có màn hình, trường hay hành động nào thiếu yêu cầu nguồn.
- Mục 3 khớp đúng với bộ rule hiện hành.
- Không còn chỗ trống chưa điền. Mọi chỗ thiếu dữ liệu đều ghi `Không có` hoặc `CHƯA XÁC ĐỊNH`.

Nếu phát hiện yêu cầu bị sót mà không thể đặt vào màn hình nào khi chưa suy diễn, **hỏi người dùng** trước khi lưu.

## 3.5. Lưu và báo cáo

1. Ghi file vào đường dẫn người dùng đã cung cấp.
2. Báo cho người dùng: đường dẫn file, số màn hình, số luồng, số mục `CHƯA XÁC ĐỊNH` (nếu có).
3. Chuyển sang [04-confirm-send-to-claude-design.md](04-confirm-send-to-claude-design.md).
