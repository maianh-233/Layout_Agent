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
7. **Số lượng theo loại dự án** (ghi ở đầu file domain):

   | Loại | Nghiệp vụ | Giao diện |
   |---|---|---|
   | `website` | 20–35 | 12–20 |
   | `ecommerce` | 35–55 | 15–25 |
   | `crm` | 50–80 | 18–30 |
   | `erp` | 70–120 | 20–35 |
   | `management-generic` | 45–80 | 18–30 |

   Hỏi đủ để nắm chắc nghiệp vụ; không thêm câu chỉ để đủ số.
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

## Nhóm gợi ý — câu hỏi nghiệp vụ cho CRM / ERP / hệ thống quản lý

Thứ tự nhóm bắt buộc:
1. **Tổng quan:** doanh nghiệp, quy mô, chi nhánh, mục tiêu, phần mềm đang dùng, vấn đề đang gặp (1.x, 2.x, 3.1–3.3).
2. **Người dùng & vai trò:** ai dùng, làm gì, xem được dữ liệu đến đâu (2.5, 2.6, 4.2).
3. **Phạm vi module:** một câu `multi` liệt kê các module trong file domain bằng lời đời thường để khách chọn những phần cần có (1.5, 5.x).
4. **Một nhóm cho mỗi module** (theo thứ tự luồng nghiệp vụ, ví dụ Mua hàng → Kho → Bán hàng → Công nợ): luồng từng bước, chứng từ và trạng thái, ai duyệt và điều kiện duyệt, quy tắc tính toán, ngoại lệ (3.4, 3.5, 5.x, 7.x).
5. **Liên kết giữa các module:** chứng từ này sinh ra chứng từ nào, tồn kho / công nợ thay đổi lúc nào (3.4, 5.x).
6. **Báo cáo & dashboard:** báo cáo nào, chỉ số nào, ai xem (5.x, 3.7).
7. **Quy tắc chung:** đánh mã chứng từ, tiền tệ, làm tròn, import/export Excel, in ấn, lịch sử thay đổi (3.5, 7.x, 8.x).
8. **Tích hợp & dữ liệu cũ** (8.3, 8.7, 7.x).
9. **Yêu cầu phi chức năng:** số người dùng, thiết bị, bảo mật, sao lưu (6.x).

## Nhóm gợi ý — câu hỏi nghiệp vụ cho website / thương mại điện tử

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
- Các trường trên đều bắt buộc. `options` là `[]` khi `type` là `text`.
- `srsSections` có ít nhất 1 phần tử.
- `showIf` không bắt buộc — xem mục dưới.

## Câu hỏi rẽ nhánh (`showIf`)

Dùng để **ẩn câu hỏi chi tiết của phần khách không cần**. Bắt buộc dùng cho CRM / ERP / hệ thống quản lý; website chỉ dùng khi thật sự có nhánh (ví dụ "có bán online không").

```json
{
  "id": "q12",
  "text": "Công ty mình cần quản lý những phần việc nào trên phần mềm?",
  "hint": "Chọn tất cả phần anh/chị muốn có ở giai đoạn này.",
  "type": "multi",
  "options": ["Mua hàng từ nhà cung cấp", "Bán hàng", "Kho hàng", "Công nợ", "Sản xuất"],
  "srsSections": ["1.5", "5.1"]
},
{
  "id": "q40",
  "text": "Một lệnh sản xuất thường đi qua những bước nào?",
  "hint": "...",
  "type": "text",
  "options": [],
  "srsSections": ["3.4", "5.3"],
  "showIf": { "questionId": "q12", "includes": "Sản xuất" }
}
```

Quy tắc (backend kiểm tra, sai là bị trả về sửa):
- `questionId` phải là câu **đứng trước** và có `type` là `single` hoặc `multi`.
- `includes` là **một chuỗi** hoặc **mảng chuỗi**, mỗi chuỗi **trùng nguyên văn** một phần tử trong `options` của câu đó. Câu hiện khi khách chọn ít nhất một giá trị trong `includes`.
- Câu cổng chưa trả lời / "Chưa rõ" → câu con vẫn hiện (chưa rõ thì vẫn hỏi).
- Được rẽ nhánh nhiều tầng (câu con làm cổng cho câu khác).
- Mỗi module: một nhóm riêng, **mọi câu trong nhóm** có `showIf` trỏ về câu chọn module. Có thể thêm câu cổng `single` "Có / Không" bên trong module cho tính năng phụ (ví dụ "Có theo dõi lô / hạn dùng không?").
- Không gắn `showIf` cho các nhóm chung (Tổng quan, Vai trò, Quy tắc chung, Phi chức năng).

## Vòng câu hỏi bổ sung (`business-followup`, `ui-followup`)

Ghi ra `followup-<phase>.json` cùng định dạng, khác ở:
- **Tối đa 15 câu**, có thể ít hơn. Không có gì cần hỏi thì ghi `{ "groups": [] }`.
- Mỗi câu **bắt buộc có `reason`**: một câu ngắn cho BA biết vì sao hỏi và liên quan câu nào, bắt đầu bằng `Thiếu:`, `Mơ hồ:`, `Mâu thuẫn:` hoặc `Ghi chú BA:`. Ví dụ: `"Mâu thuẫn: q23 nói trừ kho khi duyệt đơn, q41 nói trừ kho khi xuất hàng."`
- Không dùng `showIf`. `id` đặt tùy ý (`f1`, `f2`…) — backend tự đánh lại.
- Nhóm theo chủ đề (ví dụ "Bán hàng — làm rõ", "Kho — làm rõ"), sắp theo mức ảnh hưởng tới SRS, quan trọng trước.
- Câu hỏi vẫn bằng ngôn ngữ đời thường, **nhắc lại điều khách đã nói** để khách hiểu ngữ cảnh: "Ở phần trước anh/chị cho biết …, nhưng cũng nói … Vậy thực tế …?"

Chọn câu để hỏi theo thứ tự ưu tiên:
1. **Mâu thuẫn** giữa hai câu trả lời (xem mục "Mâu thuẫn hay gặp" của file domain).
2. **Ghi chú BA** cho thấy khách còn phân vân / cần hỏi người khác.
3. **Thiếu** chủ đề bắt buộc (mục 4 file domain) của phần khách đã chọn, hoặc câu quan trọng bị "Chưa rõ".
4. **Mơ hồ**: câu trả lời không kiểm thử được ("nhanh", "tùy trường hợp", "như bình thường", "nhiều").

Không hỏi lại câu khách đã trả lời rõ. Không hỏi về phần "Không áp dụng".
