# Rà soát chất lượng SRS (`srs-review`) và sửa một lỗi (`srs-fix`)

## 1. `srs-review` — chỉ đọc, không sửa SRS

Code đã kiểm những gì máy kiểm được (mã chưa đăng ký / không dùng, FR thiếu UC / TC, màn hình thiếu FR, vai trò thiếu quyền, trạng thái không có đường ra, Mermaid lỗi, định dạng registry / tokens). Kết quả ở `srs/_review.json` — **đọc trước để không báo trùng**.

Lượt AI tìm những gì máy **không** kiểm được. Thứ tự đọc để tiết kiệm token: `srs/_registry.json` → `srs/_permissions.json` → `srs/README.md` → chỉ mở file / mục cần đối chiếu.

| Nhóm (`category`) | Tìm gì | Mức thường gặp |
|---|---|---|
| `Mâu thuẫn` | Hai phần nói khác nhau: BR nói A, use case / FR / màn hình làm B; ma trận phân quyền cho phép điều mà quy tắc cấm; trạng thái trong 5.6 khác `documents` trong registry | critical |
| `Thiếu nhánh` | Luồng thiếu nhánh ngoại lệ: từ chối duyệt, hủy, hết hạn, dữ liệu không hợp lệ, mất kết nối tích hợp | major |
| `Vòng đời` | Trạng thái không rõ ai được chuyển; chuyển trạng thái thiếu điều kiện; chứng từ có duyệt nhưng thiếu bước từ chối | major |
| `Mơ hồ` | Yêu cầu không kiểm thử được: "nhanh", "dễ dùng", "nhiều", "phù hợp", "khi cần" | major / minor |
| `Giao diện` (khi có Phần 9) | Màn hình thiếu mục bắt buộc của design-guide (bảng không gắn trường dữ liệu, form thiếu thông báo lỗi, nút không có mã quyền, thiếu trạng thái rỗng / lỗi / không quyền, thiếu responsive); dùng component ngoài thư viện 9.12; màn hình mặc định của vai trò chưa có; nút đổi trạng thái không khớp `documents[].transitions` | major |
| `Liên module` | `_integration.md` thiếu tác động khi chứng từ đổi trạng thái (ví dụ duyệt đơn bán nhưng không nói tồn kho / công nợ thay đổi) | major |
| `Cần xác nhận` | Chỗ quan trọng đang `[CẦN XÁC NHẬN]` nhưng chưa có dòng 13.9 tương ứng | minor |

Mức: `critical` (Nghiêm trọng — sai lệch sẽ làm dựng sai hệ thống), `major` (Cần sửa), `minor` (Gợi ý).

Ghi **chỉ** `srs/_review-ai.json` (tối đa 40 mục, quan trọng trước; không có gì thì `{ "findings": [] }`):

```json
{
  "findings": [
    {
      "severity": "critical",
      "category": "Mâu thuẫn",
      "message": "BR-SALES-001 yêu cầu đơn trên 50 triệu phải giám đốc duyệt, nhưng UC-SALES-002 cho trưởng nhóm duyệt mọi đơn.",
      "file": "05-functional/sales.md",
      "section": "5.2",
      "codes": ["BR-SALES-001", "UC-SALES-002"],
      "suggestion": "Thêm điều kiện giá trị vào luồng chính của UC-SALES-002 hoặc tách bước duyệt cấp 2."
    }
  ]
}
```

`file` là đường dẫn trong `srs/` (không có `srs/` ở đầu); `section` là số mục.

## 2. `srs-fix` — sửa đúng một lỗi

`PROJECT_DIR` lúc này là **bản nháp**: sửa thoải mái, BA sẽ xem diff trước khi lưu. Prompt có `LỖI CẦN SỬA` (JSON của lỗi).

1. Đọc `srs/_registry.json`, rồi file / mục trong lỗi và các file liên quan tới `codes`.
2. Sửa **đúng lỗi đó**, thay đổi nhỏ nhất có thể. Giữ nguyên các phần khác, không viết lại cả file.
3. Giữ nhất quán: thêm / đổi mã thì cập nhật `_registry.json` (và `_permissions.json`, `documents[]` nếu liên quan). Không sửa `12-traceability.md` hay bảng giữa `<!-- AUTO:RBAC` … `<!-- /AUTO:RBAC -->` (code sinh lại).
4. Không bịa nghiệp vụ: nếu cách sửa cần thông tin khách chưa nói, dùng `[ĐỀ XUẤT]` cho phương án hợp lý nhất và thêm một dòng 13.9.
5. Không ghi `_review*.json` / `_review.md`.
6. Trả lời một dòng: đã sửa gì, ở file nào.
