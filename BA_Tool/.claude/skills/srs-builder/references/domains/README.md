# File tham chiếu theo loại dự án (domain)

| `PROJECT_TYPE` | File |
|---|---|
| `website` | [website.md](website.md) |
| `ecommerce` | [ecommerce.md](ecommerce.md) |
| `crm` | [crm.md](crm.md) |
| `erp` | [erp.md](erp.md) |
| `management-generic` | [management-generic.md](management-generic.md) |

## Quy tắc sử dụng (bắt buộc)

1. File domain là **danh sách kiểm tra để hỏi cho đủ ý**, không phải nguồn nội dung SRS.
2. **Chỉ đọc đúng một file** khớp `PROJECT_TYPE`. Không đọc file của loại khác.
3. Khi sinh câu hỏi: dùng các mục trong file để không bỏ sót chủ đề. Câu hỏi vẫn phải bám ngành nghề cụ thể trong `request.md` và viết bằng ngôn ngữ đời thường.
4. Khi viết SRS: module, luồng, chứng từ, quy tắc **chỉ được đưa vào khi khách đã xác nhận** trong câu trả lời. Nếu thấy cần nhắc tới thứ khách chưa xác nhận thì:
   - hoặc ghi `[ĐỀ XUẤT]` ở đầu dòng/ô và thêm một dòng vào 13.9 để BA hỏi lại,
   - hoặc chỉ ghi vào 13.9 (không đưa vào phần chính).
   Không bao giờ trình bày nội dung lấy từ file domain như yêu cầu đã chốt.
5. Cột **Mã** của bảng module là mã module dùng trong mã yêu cầu (`FR-<MÃ>-001`, `SCR-<MÃ>-001`…). Module khách nêu mà không có trong bảng thì tự đặt mã 2–6 chữ in hoa, không dấu.
