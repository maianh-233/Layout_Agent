# Sổ đăng ký mã (`srs/_registry.json`) và ma trận phân quyền (`srs/_permissions.json`)

Chỉ áp dụng khi `SRS_MODE: registry`. Backend kiểm tra hai file này bằng code; sai là bị trả về sửa.

## 1. Vai trò của registry

- `_registry.json` là **nguồn sự thật duy nhất** cho mọi mã trong SRS. File SRS chỉ được dùng mã đã có trong registry. Tạo mã mới ở file nào thì **thêm vào registry cùng lúc**.
- **Tiết kiệm token:** cần tra mã, tên, file chứa một mục → đọc registry, không mở hết các file SRS.
- **Phần 12 (`12-traceability.md`) và bảng phân quyền ở 4.2 do code sinh từ hai file này.** Không viết tay các phần đó (xem mục 5).

## 2. Quy ước mã

| Loại | Dạng | Ví dụ |
|---|---|---|
| Vai trò | `ROLE-<2 số>` | `ROLE-01` |
| Module | `MOD-<MÃ>` (2–8 chữ in hoa/số, lấy từ cột **Mã** của file domain) | `MOD-SALES` |
| BR, US, UC, FR, SCR, TC | `<LOẠI>-<MÃ MODULE>-<3 số>` | `FR-SALES-001`, `SCR-INV-004` |
| NFR | `NFR-<NHÓM>-<3 số>`, nhóm: `PERF SEC AUTH AVAIL SCAL USAB ACCS MAINT COMP LOC BAK LOG AUDIT` | `NFR-PERF-001` |
| Thực thể | `ENT-<TÊN>` | `ENT-SALES_ORDER` |
| Chứng từ | `DOC-<MÃ MODULE>-<TÊN>` | `DOC-SALES-ORDER` |
| Vấn đề mở | `OI-<3 số>` (chỉ trong 13.9, không đưa vào registry) | `OI-001` |

- Số đếm riêng cho từng cặp loại + module, bắt đầu `001`. **Không đổi, không dùng lại** mã đã cấp.
- Quy tắc / màn hình dùng chung (đăng nhập, phân quyền, cấu hình) thuộc module `SYS`.
- Mọi phần `<MÃ MODULE>` phải là module đã có trong `modules`.

## 3. `_registry.json`

`file` là đường dẫn **tương đối trong `srs/`**, có thể kèm `#mục` (ví dụ `05-functional/sales.md#5.4`). File phải tồn tại. Mục khách chưa xác nhận (`[ĐỀ XUẤT]`) thêm `"proposed": true`.

```json
{
  "roles": [
    { "id": "ROLE-01", "name": "Giám đốc", "file": "02-overall-description.md#2.6" },
    { "id": "ROLE-02", "name": "Nhân viên bán hàng", "file": "02-overall-description.md#2.6" }
  ],
  "modules": [
    { "id": "MOD-SALES", "name": "Bán hàng", "file": "05-functional/sales.md" },
    { "id": "MOD-SYS", "name": "Quản trị hệ thống", "file": "05-functional/sys.md" }
  ],
  "businessRules": [
    { "id": "BR-SALES-001", "summary": "Đơn bán trên 50 triệu cần giám đốc duyệt", "file": "03-business-requirements.md#3.5" }
  ],
  "userStories": [
    { "id": "US-SALES-001", "summary": "NVBH tạo đơn bán cho khách", "file": "04-user-requirements.md#4.4", "role": "ROLE-02", "businessRules": [] }
  ],
  "useCases": [
    { "id": "UC-SALES-001", "summary": "Tạo đơn bán", "file": "05-functional/sales.md#5.2", "actors": ["ROLE-02"], "userStories": ["US-SALES-001"] },
    { "id": "UC-SALES-002", "summary": "Duyệt đơn bán", "file": "05-functional/sales.md#5.2", "actors": ["ROLE-01"], "userStories": [] }
  ],
  "functional": [
    { "id": "FR-SALES-001", "summary": "Tạo đơn bán nhiều dòng hàng", "file": "05-functional/sales.md#5.4", "useCases": ["UC-SALES-001"], "businessRules": [], "priority": "Must" },
    { "id": "FR-SALES-002", "summary": "Duyệt / từ chối đơn bán", "file": "05-functional/sales.md#5.4", "useCases": ["UC-SALES-002"], "businessRules": ["BR-SALES-001"], "priority": "Must" }
  ],
  "nonFunctional": [
    { "id": "NFR-PERF-001", "summary": "Danh sách 10.000 đơn hiển thị dưới 2 giây", "file": "06-non-functional.md#6.1", "proposed": true }
  ],
  "entities": [
    { "id": "ENT-SALES_ORDER", "name": "Đơn bán", "file": "07-data-requirements.md#7.2", "module": "MOD-SALES" }
  ],
  "documents": [
    {
      "id": "DOC-SALES-ORDER",
      "name": "Đơn bán",
      "file": "05-functional/sales.md#5.6",
      "entity": "ENT-SALES_ORDER",
      "numbering": "DH-{YYYY}-{00000}",
      "states": [
        { "id": "DRAFT", "name": "Nháp", "tone": "neutral", "initial": true },
        { "id": "PENDING_APPROVAL", "name": "Chờ duyệt", "tone": "warning" },
        { "id": "APPROVED", "name": "Đã duyệt", "tone": "success", "final": true },
        { "id": "REJECTED", "name": "Bị từ chối", "tone": "danger" },
        { "id": "CANCELLED", "name": "Đã hủy", "tone": "neutral", "final": true }
      ],
      "transitions": [
        { "from": "DRAFT", "event": "Gửi duyệt", "to": "PENDING_APPROVAL", "roles": ["ROLE-02"], "permission": "SALES.ORDER.UPDATE" },
        { "from": "PENDING_APPROVAL", "event": "Duyệt", "to": "APPROVED", "roles": ["ROLE-01"], "condition": "Tổng tiền > 50 triệu (BR-SALES-001)", "permission": "SALES.ORDER.APPROVE" },
        { "from": "PENDING_APPROVAL", "event": "Từ chối", "to": "REJECTED", "roles": ["ROLE-01"], "permission": "SALES.ORDER.APPROVE" },
        { "from": "REJECTED", "event": "Sửa lại", "to": "DRAFT", "roles": ["ROLE-02"], "permission": "SALES.ORDER.UPDATE" },
        { "from": "DRAFT", "event": "Hủy", "to": "CANCELLED", "roles": ["ROLE-02"], "permission": "SALES.ORDER.DELETE" }
      ]
    }
  ],
  "screens": [],
  "testCases": [
    { "id": "TC-SALES-001", "summary": "Tạo đơn hợp lệ", "file": "05-functional/sales.md#5.8", "functional": ["FR-SALES-001"] },
    { "id": "TC-SALES-002", "summary": "Đơn 60 triệu phải chờ giám đốc duyệt", "file": "05-functional/sales.md#5.8", "functional": ["FR-SALES-002"] }
  ]
}
```

Quy tắc tham chiếu (backend kiểm tra):
- `userStories[].role`, `useCases[].actors`, `screens[].roles`, `transitions[].roles` → mã trong `roles`.
- `useCases[].userStories` → `userStories`; `functional[].useCases` → `useCases`; `functional[].businessRules`, `userStories[].businessRules` → `businessRules`.
- `screens[].functional`, `testCases[].functional` → `functional`.
- `documents[]`: có đúng một trạng thái `initial: true`; `from` / `to` là `id` trong `states`; `tone` dùng cho màu badge ở prototype (`neutral info warning success danger`).
- Mỗi FR nên có ít nhất 1 UC và 1 TC; mỗi màn hình gắn ít nhất 1 FR (thiếu không bị chặn nhưng sẽ bị báo ở bước rà soát).

Bước `business-srs`: `screens` để `[]`. Bước `ui-srs`: thêm toàn bộ màn hình vào `screens`, không đổi các mục khác trừ khi cần sửa sai.

## 4. `_permissions.json`

```json
{
  "resources": [
    { "id": "SALES.ORDER", "name": "Đơn bán", "module": "MOD-SALES" },
    { "id": "SALES.REPORT", "name": "Báo cáo bán hàng", "module": "MOD-SALES" },
    { "id": "SYS.USER", "name": "Người dùng", "module": "MOD-SYS" }
  ],
  "matrix": {
    "ROLE-01": { "SALES.ORDER": ["VIEW", "APPROVE", "EXPORT"], "SALES.REPORT": ["VIEW", "EXPORT"], "SYS.USER": ["VIEW", "CREATE", "UPDATE", "DELETE"] },
    "ROLE-02": { "SALES.ORDER": ["VIEW", "CREATE", "UPDATE", "DELETE"] }
  },
  "scope": {
    "ROLE-02": { "SALES.ORDER": "own" }
  },
  "defaultScreen": {}
}
```

- Hành động: `VIEW` Xem, `CREATE` Tạo, `UPDATE` Sửa, `DELETE` Xóa, `APPROVE` Duyệt, `EXPORT` Xuất. Mã quyền dùng ở prototype là `<resource>.<ACTION>`, ví dụ `SALES.ORDER.APPROVE`.
- `matrix`: **mọi vai trò** trong registry phải có một dòng (vai trò không có quyền nào thì `{}`). Ô không ghi = không có quyền.
- `scope` (phạm vi dữ liệu): `own` của mình, `team` nhóm, `branch` chi nhánh, `all` toàn bộ (mặc định). Chỉ ghi khi khác `all`.
- `defaultScreen`: màn hình đầu tiên sau đăng nhập của từng vai trò, ví dụ `{ "ROLE-01": "SCR-RPT-001" }`. **Chỉ điền ở bước `ui-srs`.**
- Phân quyền suy ra từ câu trả lời; chỗ AI tự suy luận thêm thì đặt `"proposed": true` ở gốc file và ghi vào 13.9.

## 5. Phần do code sinh — không viết tay

| Phần | Cách làm |
|---|---|
| `12-traceability.md` | **Không tạo, không sửa.** Code sinh toàn bộ 12.1–12.8 từ registry sau khi bạn xong. |
| Bảng ma trận ở 4.2 | Trong `04-user-requirements.md`, mục 4.2 chỉ viết phần mô tả vai trò và quy tắc phân quyền bằng lời, rồi để **đúng một dòng** `<!-- AUTO:RBAC -->` `<!-- /AUTO:RBAC -->` (hai thẻ trên cùng một dòng). Code thay dòng này bằng bảng. |
| Số liệu tổng hợp trong `README.md` | Vẫn tự ghi, nhưng **đếm từ registry**. |

## 6. Khi được yêu cầu "SỬA REGISTRY"

Prompt có phần `SỬA REGISTRY` kèm danh sách lỗi → chỉ sửa đúng các lỗi đó trong `_registry.json` / `_permissions.json` (thêm mã còn thiếu, sửa tham chiếu sai, sửa đường dẫn file). Nếu lỗi là "file không có trong srs/" thì sửa đường dẫn cho đúng file đã có; chỉ tạo file mới khi SRS thật sự thiếu file đó. Không viết lại các file SRS khác.
