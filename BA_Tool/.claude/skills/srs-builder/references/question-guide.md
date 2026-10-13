# Hướng dẫn đặt câu hỏi cho khách hàng

BA sẽ đọc **nguyên văn** từng câu cho khách hàng nghe. Khách thường không rành kỹ thuật.

## Nguyên tắc

1. **Sinh riêng cho từng dự án**, bám vào ngành nghề trong yêu cầu ban đầu. Thời trang khác nhà hàng, khác trung tâm đào tạo: dùng đúng từ ngữ, đúng tình huống của ngành đó.
2. **Ngôn ngữ đời thường.** Không dùng "use case", "actor", "entity", "module", "workflow", "role", "CRUD", "API"…
   - Sai: "Các actor của hệ thống là ai?"
   - Đúng: "Ngoài chị ra, còn ai sẽ dùng trang web này? (nhân viên, khách mua hàng, người giao hàng...)"
3. **Mỗi câu chỉ hỏi một ý.** Không gộp "và", "hoặc" thành hai câu hỏi trong một.
4. **Mỗi câu có gợi ý / ví dụ trả lời** trong `hint`, để khách dễ hình dung.
5. **Sắp xếp theo nhóm chủ đề, từ tổng quát đến chi tiết.**
6. **Gắn mỗi câu với mục SRS mà nó phục vụ** trong `srsSections` (ví dụ `"1.2"`, `"3.5"`, `"9.3"`), theo số mục trong [srs-structure.md](srs-structure.md).
7. **Số lượng:** nghiệp vụ 20–35 câu; giao diện 12–20 câu.
8. Xưng hô lịch sự, trung tính theo yêu cầu ban đầu (nếu yêu cầu nói "chủ cửa hàng" là nữ/nam thì dùng "chị"/"anh"; không rõ thì dùng "anh/chị").
9. Không hỏi điều yêu cầu ban đầu hoặc SRS đã trả lời rõ.

## Chọn `type`

| `type` | Khi nào dùng | `options` |
|---|---|---|
| `text` | Câu trả lời mở, cần mô tả | `[]` |
| `single` | Chỉ chọn một trong vài phương án rõ ràng | 2–6 phương án |
| `multi` | Có thể chọn nhiều phương án | 3–8 phương án |

- **Không** thêm phương án "Khác" vào `options`. Tool tự thêm "Khác" kèm ô nhập cho mọi câu `single`/`multi`.
- Phương án viết ngắn, đời thường.

## Nhóm gợi ý — câu hỏi nghiệp vụ

Điều chỉnh theo ngành, bỏ nhóm không liên quan:
1. Về doanh nghiệp/cửa hàng và mục tiêu của trang web (1.2, 1.3, 3.1, 3.2)
2. Ai sẽ dùng và mỗi người làm được gì (2.5, 2.6, 4.2)
3. Sản phẩm/dịch vụ và thông tin cần hiển thị (3.1, 7.2)
4. Cách khách mua/đặt/đăng ký — từng bước (3.3, 4.4, 5.x)
5. Quy định kinh doanh: giá, khuyến mãi, đổi trả, giao hàng, thanh toán (3.5, 3.6)
6. Quản lý phía cửa hàng: đơn hàng, kho, báo cáo (5.x, 7.x)
7. Kết nối bên ngoài: thanh toán, vận chuyển, mạng xã hội (8.3, 8.7)
8. Phạm vi, thời gian, ngân sách, điều chưa làm ở giai đoạn này (1.5, 1.6, 2.11)
9. Yêu cầu khác: tốc độ, bảo mật, ngôn ngữ (6.x)

## Nhóm gợi ý — câu hỏi giao diện

1. Phong cách thương hiệu, cảm giác muốn khách nhận được (9.1)
2. Màu sắc, logo, font chữ đã có (9.2, 9.3, 9.4)
3. Website tham khảo khách thích / không thích (9.1)
4. Các trang cần có, nội dung trang chủ (9.8, 9.9, 9.11)
5. Thiết bị khách hàng hay dùng (9.16, 6.11)
6. Người lớn tuổi / cần chữ to / hỗ trợ tiếp cận (9.17, 6.9)
7. Thông báo, phản hồi khi thao tác (9.15, 9.18)

## Định dạng JSON (bắt buộc, backend kiểm tra bằng zod)

Ghi **chỉ JSON hợp lệ**, không kèm chú thích hay markdown:

```json
{
  "groups": [
    {
      "id": "g1",
      "title": "Về cửa hàng của chị",
      "questions": [
        {
          "id": "q1",
          "text": "Cửa hàng của chị đang bán những loại sản phẩm nào?",
          "hint": "Ví dụ: áo, quần, váy, phụ kiện, giày...",
          "type": "text",
          "options": [],
          "srsSections": ["1.2", "3.1"]
        }
      ]
    }
  ]
}
```

- `id` nhóm: `g1`, `g2`…; `id` câu hỏi: `q1`, `q2`… **duy nhất trong cả file**, đánh số liên tục.
- Mọi trường đều bắt buộc. `options` là `[]` khi `type` là `text`.
- `srsSections` có ít nhất 1 phần tử.
