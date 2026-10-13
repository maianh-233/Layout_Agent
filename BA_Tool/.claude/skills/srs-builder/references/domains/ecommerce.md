# Domain: Thương mại điện tử

> Chỉ dùng để gợi ý câu hỏi cho đủ ý. Xem quy tắc ở [README.md](README.md).

**Số câu hỏi nghiệp vụ:** 35–55. **Số câu hỏi giao diện:** 15–25.

## 1. Module điển hình

| Mã | Module (cách nói với khách) | Thường có | Câu hỏi "cổng" |
|---|---|---|---|
| `CAT` | Danh mục & sản phẩm | Danh mục nhiều cấp, biến thể (size/màu), ảnh, thuộc tính lọc | Sản phẩm có biến thể không? |
| `CART` | Giỏ hàng & thanh toán | Giỏ, mã giảm giá, phí ship, chọn địa chỉ, chọn cách trả tiền | Khách có phải đăng nhập mới mua được không? |
| `ORDER` | Đơn hàng | Danh sách đơn, chi tiết, cập nhật trạng thái, in phiếu | Ai xử lý đơn? |
| `PAY` | Thanh toán | COD, chuyển khoản, ví điện tử, cổng thẻ | Nhận tiền qua những cách nào? |
| `SHIP` | Giao hàng | Tính phí, đơn vị vận chuyển, mã vận đơn | Tự giao hay qua hãng vận chuyển? |
| `INV` | Tồn kho | Số lượng tồn, cảnh báo hết hàng, nhập hàng | Có quản lý tồn kho trên web không? |
| `CUST` | Khách hàng & tài khoản | Đăng ký, đăng nhập, sổ địa chỉ, lịch sử mua | Có tích điểm / hạng thành viên không? |
| `PROMO` | Khuyến mãi | Mã giảm giá, flash sale, combo, quà tặng | Những loại khuyến mãi nào? |
| `RET` | Đổi trả & hoàn tiền | Yêu cầu đổi trả, duyệt, hoàn tiền | Có chính sách đổi trả không? |
| `REVIEW` | Đánh giá sản phẩm | Sao, bình luận, ảnh, duyệt | Chỉ người đã mua mới được đánh giá? |
| `CMS` | Nội dung | Banner, trang tĩnh, blog | Ai cập nhật nội dung? |
| `RPT` | Báo cáo | Doanh thu, sản phẩm bán chạy, tồn kho | Cần xem những số liệu nào? |
| `ADMIN` | Quản trị & phân quyền | Tài khoản nhân viên, vai trò | Mấy người quản trị, chia việc thế nào? |

## 2. Luồng nghiệp vụ chính

- Xem → thêm giỏ → thanh toán → tạo đơn → xác nhận → đóng gói → giao → hoàn thành.
- Thanh toán online: tạo đơn → chuyển cổng thanh toán → kết quả → cập nhật đơn (thành công / thất bại / hết hạn).
- Đổi trả: yêu cầu → duyệt → nhận hàng trả → kiểm tra → hoàn tiền / đổi hàng → cộng lại tồn kho.

## 3. Chứng từ & vòng đời

| Đối tượng | Trạng thái điển hình | Cần hỏi |
|---|---|---|
| Đơn hàng | Chờ xác nhận → Đã xác nhận → Đang đóng gói → Đang giao → Đã giao / Giao thất bại / Đã hủy | Khách hủy được đến bước nào? Giao thất bại xử lý ra sao? |
| Thanh toán | Chờ thanh toán → Đã thanh toán / Thất bại / Hết hạn → Đã hoàn tiền | Đơn chưa thanh toán giữ bao lâu? |
| Yêu cầu đổi trả | Mới → Đã duyệt / Từ chối → Đã nhận hàng → Đã hoàn tiền | Thời hạn đổi trả? Ai duyệt? |
| Mã giảm giá | Nháp → Đang chạy → Hết hạn / Hết lượt | Giới hạn mỗi khách? Có cộng dồn không? |

## 4. Chủ đề phải hỏi

- Quy tắc giá: giá gốc, giá khuyến mãi, VAT đã gồm chưa, làm tròn.
- Tồn kho trừ lúc nào (đặt hàng / xác nhận / giao), giữ hàng bao lâu.
- Quy tắc đánh mã đơn (ví dụ `DH-2026-00001`).
- Phí ship: theo khu vực / cân nặng / miễn phí từ mức nào.
- Phân quyền nhân viên; ai được hủy đơn, hoàn tiền.
- Thông báo cho khách (email, SMS, Zalo) ở từng trạng thái.
- Import/export sản phẩm, đơn hàng bằng Excel.
- Tích hợp: cổng thanh toán, hãng vận chuyển, sàn TMĐT, phần mềm kế toán / bán hàng đang dùng.
- Lượng sản phẩm, lượng đơn mỗi ngày (ảnh hưởng hiệu năng).

## 5. Mâu thuẫn hay gặp

- Cho mua không cần tài khoản nhưng lại muốn khách xem lịch sử đơn.
- Có tồn kho nhưng không nói trừ lúc nào → bán vượt tồn.
- Khuyến mãi cộng dồn với mã giảm giá không rõ.
