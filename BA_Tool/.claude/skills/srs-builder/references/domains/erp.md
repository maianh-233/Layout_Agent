# Domain: ERP (Hoạch định nguồn lực doanh nghiệp)

> Chỉ dùng để gợi ý câu hỏi cho đủ ý. Xem quy tắc ở [README.md](README.md).

**Số câu hỏi nghiệp vụ:** 70–120. **Số câu hỏi giao diện:** 20–35.

ERP thường chỉ triển khai **một phần** các module. Luôn hỏi câu "cổng" của từng module trước, rồi mới hỏi chi tiết module đó (chi tiết module chỉ hiện khi khách xác nhận có module).

## 1. Module điển hình

| Mã | Module (cách nói với khách) | Thường có | Câu hỏi "cổng" |
|---|---|---|---|
| `MD` | Danh mục dùng chung | Hàng hóa (mã, ĐVT, quy đổi ĐVT, nhóm), khách hàng, nhà cung cấp, kho, nhân viên, chi nhánh | Luôn có — hỏi hàng hóa có nhiều đơn vị tính / quy cách không |
| `PUR` | Mua hàng | Đề nghị mua, báo giá NCC, đơn mua, nhận hàng, trả hàng NCC | Công ty có nhập hàng từ nhà cung cấp không? |
| `SALES` | Bán hàng | Báo giá, đơn bán, giao hàng, trả hàng, chính sách giá / chiết khấu, hạn mức công nợ | Luôn hỏi — bán cho khách lẻ, đại lý hay công trình? |
| `INV` | Kho | Nhập, xuất, chuyển kho, kiểm kê, tồn kho, lô / hạn dùng, vị trí kệ, tồn tối thiểu | Có quản lý nhiều kho không? Có theo dõi lô / hạn dùng không? |
| `AR` | Công nợ phải thu | Công nợ theo khách, tuổi nợ, thu tiền, đối trừ, nhắc nợ | Có bán chịu cho khách không? |
| `AP` | Công nợ phải trả | Công nợ theo NCC, lịch trả, chi tiền | Có mua chịu của nhà cung cấp không? |
| `CASH` | Quỹ & ngân hàng | Phiếu thu, phiếu chi, ủy nhiệm chi, đối chiếu ngân hàng | Có quản lý thu chi tiền mặt / ngân hàng trong hệ thống không? |
| `ACC` | Kế toán tổng hợp | Hệ thống tài khoản, bút toán, sổ cái, báo cáo tài chính, thuế | Kế toán làm trên hệ thống này hay phần mềm kế toán riêng (MISA, Fast…)? |
| `HR` | Nhân sự | Hồ sơ nhân viên, hợp đồng, phòng ban | Có quản lý hồ sơ nhân sự không? |
| `PAY` | Chấm công & lương | Ca làm, chấm công, nghỉ phép, tính lương, bảo hiểm | Có tính lương trên hệ thống không? |
| `MFG` | Sản xuất | Định mức nguyên vật liệu (BOM), lệnh sản xuất, xuất NVL, nhập thành phẩm, công đoạn | Công ty có tự sản xuất / gia công không? |
| `ASSET` | Tài sản & công cụ | Danh sách tài sản, khấu hao, bàn giao | Có cần theo dõi tài sản cố định không? |
| `DELIV` | Giao vận | Lập chuyến, xe, tài xế, phí vận chuyển, xác nhận giao | Công ty có đội xe giao hàng riêng không? |
| `RPT` | Báo cáo & dashboard | Doanh thu, lãi gộp, tồn kho, công nợ, xuất nhập tồn, KPI | Ban giám đốc cần xem những con số nào? |
| `SYS` | Quản trị hệ thống | Người dùng, vai trò, phân quyền, chi nhánh, tham số, nhật ký | Luôn có |

## 2. Luồng nghiệp vụ chính

1. **Mua hàng (Procure-to-Pay):** Đề nghị mua → duyệt → đơn mua → (duyệt nếu vượt ngưỡng) → NCC giao → nhập kho (kiểm số lượng / chất lượng) → hóa đơn NCC → ghi nhận công nợ phải trả → thanh toán → đối trừ công nợ.
2. **Bán hàng (Order-to-Cash):** Báo giá → đơn bán → kiểm tra tồn kho + hạn mức công nợ → duyệt → xuất kho / giao hàng → hóa đơn → ghi nhận công nợ phải thu → thu tiền → đối trừ công nợ.
3. **Kho:** Nhập (từ mua, từ trả hàng, từ sản xuất) / xuất (bán, trả NCC, cho sản xuất, hủy) / chuyển kho (xuất kho A → đang vận chuyển → nhập kho B) / kiểm kê → điều chỉnh chênh lệch (cần duyệt).
4. **Sản xuất:** Kế hoạch → lệnh sản xuất → xuất NVL theo BOM → sản xuất → nhập thành phẩm → tính giá thành.
5. **Trả hàng:** Khách trả → kiểm tra → nhập lại kho → giảm công nợ / hoàn tiền. Trả NCC → xuất kho → giảm công nợ phải trả.
6. **Liên kết giữa các module (phải hỏi rõ):** duyệt đơn bán thì giữ hàng hay trừ tồn ngay? Xuất kho thì tự sinh công nợ hay chờ hóa đơn? Thu tiền đối trừ vào đơn nào (cũ nhất trước hay chọn tay)?

## 3. Chứng từ & vòng đời

| Chứng từ | Trạng thái điển hình | Cần hỏi |
|---|---|---|
| Đề nghị mua | Nháp → Chờ duyệt → Đã duyệt / Từ chối → Đã tạo đơn mua | Ai được đề nghị? Ai duyệt? |
| Đơn mua | Nháp → Chờ duyệt → Đã duyệt → Đã gửi NCC → Nhận một phần → Đã nhận đủ → Đã đóng / Đã hủy | Nhận thiếu / thừa xử lý sao? Ngưỡng cần giám đốc duyệt? |
| Phiếu nhập kho | Nháp → Đã nhập (ghi sổ) / Đã hủy | Sửa phiếu đã ghi sổ thế nào (hủy + lập lại?) |
| Báo giá bán | Nháp → Đã gửi → Đã chấp nhận / Từ chối / Hết hạn | Hiệu lực mấy ngày? |
| Đơn bán | Nháp → Chờ duyệt → Đã duyệt → Đang giao (một phần) → Đã giao → Đã xuất hóa đơn → Hoàn tất / Đã hủy | Vượt hạn mức nợ có chặn không? Ai được hủy đơn đã duyệt? |
| Phiếu xuất kho / giao hàng | Nháp → Đã xuất → Đã giao / Giao thất bại | Khách ký nhận thế nào? |
| Phiếu chuyển kho | Nháp → Đã xuất kho đi → Đã nhận tại kho đến | Hàng đang đi đường tính tồn kho nào? |
| Phiếu kiểm kê | Nháp → Đang đếm → Chờ duyệt chênh lệch → Đã điều chỉnh | Ai duyệt chênh lệch? |
| Phiếu thu / chi | Nháp → Chờ duyệt → Đã duyệt → Đã ghi sổ / Đã hủy | Chi trên bao nhiêu cần giám đốc duyệt? |
| Lệnh sản xuất | Nháp → Đã phát lệnh → Đang sản xuất → Hoàn thành → Đã đóng | Có theo dõi hao hụt không? |

## 4. Chủ đề phải hỏi

- **Cơ cấu tổ chức:** số chi nhánh / kho / cửa hàng; dữ liệu có tách theo chi nhánh; có công ty con hạch toán riêng không.
- **Người dùng & vai trò:** giám đốc, kế toán trưởng, kế toán, thủ kho, nhân viên mua hàng, nhân viên bán hàng, trưởng bộ phận, tài xế… Mỗi vai trò làm gì, xem được gì (phạm vi: của mình / chi nhánh / toàn công ty).
- **Phê duyệt nhiều cấp:** chứng từ nào cần duyệt, mấy cấp, điều kiện theo giá trị (ví dụ đơn mua trên 50 triệu cần giám đốc), người duyệt thay khi vắng, xử lý khi từ chối (trả về nháp / hủy).
- **Quy tắc đánh mã chứng từ:** tiền tố, năm, chi nhánh, số tự tăng, có reset theo năm không (ví dụ `DH-HN-2026-00001`).
- **Đơn vị tính & quy đổi:** ví dụ thép mua theo tấn, bán theo cây; xi măng theo bao / tấn.
- **Giá & chiết khấu:** bảng giá theo khách / khu vực / số lượng; chiết khấu dòng / tổng đơn; ai được sửa giá.
- **Phương pháp tính giá vốn xuất kho:** bình quân gia quyền, FIFO, đích danh.
- **Tiền tệ, thuế, làm tròn, múi giờ:** VNĐ / ngoại tệ, tỉ giá; VAT 0/5/8/10%; làm tròn đến đồng / nghìn đồng.
- **Khóa sổ:** khóa dữ liệu theo kỳ (tháng); sửa chứng từ kỳ đã khóa.
- **Báo cáo & dashboard:** danh sách báo cáo, công thức KPI, bộ lọc, ai được xem, xuất Excel/PDF.
- **Import/Export Excel:** danh mục hàng hóa, khách, NCC, tồn đầu kỳ, công nợ đầu kỳ; cột bắt buộc; xử lý dòng lỗi.
- **Số dư đầu kỳ / chuyển đổi dữ liệu** từ phần mềm cũ.
- **In ấn:** mẫu phiếu in (phiếu xuất, hóa đơn, phiếu thu) theo mẫu riêng của công ty.
- **Tích hợp:** hóa đơn điện tử, phần mềm kế toán, ngân hàng, cân điện tử, máy quét mã vạch, sàn TMĐT.
- **Audit:** thao tác nào phải lưu lịch sử (sửa giá, xóa chứng từ, đổi trạng thái, đăng nhập).
- **Thiết bị:** thủ kho dùng máy tính bảng / điện thoại / máy quét; có cần dùng khi mất mạng không.
- **Khối lượng dữ liệu:** số mặt hàng, số chứng từ mỗi ngày, số người dùng cùng lúc.

## 5. Mâu thuẫn hay gặp (dùng cho vòng câu hỏi bổ sung)

- Có hạn mức công nợ nhưng không nói vượt hạn mức thì **chặn** hay chỉ **cảnh báo**, ai được duyệt vượt.
- Trừ tồn kho lúc duyệt đơn hay lúc xuất kho — hai câu trả lời khác nhau ở hai nhóm câu hỏi.
- Kế toán làm ở phần mềm riêng nhưng lại muốn báo cáo lãi lỗ trên ERP → cần nguồn số liệu giá vốn.
- Chuyển kho giữa chi nhánh nhưng không nói hàng đang đi đường thuộc kho nào.
- Nhân viên chỉ xem dữ liệu chi nhánh mình nhưng phải bán hàng từ kho chi nhánh khác.
- Chứng từ "đã ghi sổ" nhưng khách muốn "sửa được" — cần quy tắc hủy / điều chỉnh.
