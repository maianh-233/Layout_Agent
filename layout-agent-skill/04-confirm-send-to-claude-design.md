# Bước 04 — Xác nhận và chuyển sang Claude Design

Quay lại: [03-generate-srs-design.md](03-generate-srs-design.md) · Khi có yêu cầu sửa: [05-handle-revisions.md](05-handle-revisions.md)

## 4.1. Hỏi người dùng

Sau khi `srs_design` đã lưu xong, gửi tin nhắn sau rồi **dừng chờ trả lời**:

```
File srs_design đã sẵn sàng: <đường dẫn>.
Bạn muốn chuyển sang Claude Design theo cách nào?

1. Liên kết ngay: tôi gọi /design trong phiên này để Claude Design dựng thiết kế
   từ file srs_design và trả về đường dẫn xem thiết kế.
   → Để bắt đầu, hãy trả lời: "1 - thực hiện"
2. Tự làm: tôi gửi bạn lệnh và prompt soạn sẵn, cùng các bước thủ công,
   để bạn tự đọc lại và tự yêu cầu Claude Design khi sẵn sàng.
   → Trả lời: "2"

Nếu chưa muốn làm gì, bạn cứ bỏ qua.
```

## 4.2. Quy tắc diễn giải câu trả lời

| Câu trả lời của người dùng | Hành động |
|---|---|
| Chọn phương án 1 **và** có từ "thực hiện" (ví dụ "1 - thực hiện", "thực hiện liên kết ngay") | Làm theo mục 4.3 |
| Chọn phương án 2 | Làm theo mục 4.4 |
| Chọn 1 nhưng không có từ "thực hiện" | Không làm gì. Nhắc lại: "Để liên kết ngay, hãy trả lời rõ: 1 - thực hiện" |
| Mơ hồ ("ok", "chắc vậy", "để xem"), từ chối, hoặc nói chuyện khác | **Không làm gì.** Báo rằng srs_design đã lưu tại <đường dẫn>, có thể gọi lại skill để gửi sau |

Không tự hiểu một câu trả lời mơ hồ là đồng ý.

## 4.3. Phương án 1 — Liên kết ngay qua `/design`

Căn cứ (theo tài liệu chính thức của Anthropic, xác minh ngày 2026-10-12, xem mục 4.6): `/design [brief]` là skill có sẵn của Claude Code. Nó dựng thiết kế thành các artboard trên một canvas và publish canvas đó thành một artifact Claude Design trên claude.ai. Người dùng mở link trong trình duyệt desktop để xem, sửa trực tiếp và xuất PNG/PDF.

**Bước 1. Kiểm tra điều kiện.** Skill `design` phải có trong danh sách skill khả dụng của phiên. Nếu không có, báo người dùng các điều kiện cần (không đoán nguyên nhân cụ thể), rồi đề nghị chuyển sang phương án 2:

- Claude Code v2.1.265 trở lên (cập nhật bằng `claude update`).
- Phiên đăng nhập bằng tài khoản claude.ai qua `/login`. Phiên dùng API key không publish được artifact.
- Gói Pro, Max, Team hoặc Enterprise. Tổ chức không tắt template Design hay tính năng Artifacts.
- Không chạy qua Amazon Bedrock, Google Cloud Agent Platform hay Microsoft Foundry.

**Bước 2. Gọi `/design`** (dùng công cụ Skill, skill `design`) với brief sau, thay đường dẫn tuyệt đối thật vào:

```
Đọc toàn bộ file <đường dẫn tuyệt đối tới srs_design> và thiết kế giao diện đúng theo file đó.
File này là nguồn yêu cầu duy nhất. Làm theo mục "0. Hướng dẫn dành cho Claude Design".
Mỗi màn hình SCR-xx là một artboard, đặt tên theo mã và tên màn hình.
Không thêm màn hình, chức năng hay trường dữ liệu ngoài file.
Phần ghi CHƯA XÁC ĐỊNH chỉ vẽ placeholder có nhãn.
```

**Bước 3. Ghi nhận kết quả.**

- Đưa người dùng đường dẫn canvas mà `/design` trả về.
- Ghi đường dẫn đó vào dòng "Liên kết dự án Claude Design" trong `srs_design`. Bước 05 cần đường dẫn này để sửa đúng dự án cũ.
- Đổi "Trạng thái" thành `Đã gửi Claude Design`.

Nếu `/design` báo lỗi, báo nguyên văn lỗi cho người dùng và đề nghị phương án 2. Không thử cách khác khi người dùng chưa đồng ý.

## 4.4. Phương án 2 — Tự làm

Gửi cho người dùng nội dung sau (thay đường dẫn thật vào):

```
Cách A — Trong Claude Code (ở dự án của bạn):
  Gõ lệnh:
  /design Đọc toàn bộ file <đường dẫn tuyệt đối tới srs_design> và thiết kế giao diện
  đúng theo file đó. File này là nguồn yêu cầu duy nhất. Làm theo mục "0. Hướng dẫn
  dành cho Claude Design". Mỗi màn hình SCR-xx là một artboard. Không thêm gì ngoài file.

Cách B — Trên claude.ai (trình duyệt hoặc ứng dụng):
  1. Mở một cuộc trò chuyện mới. Chọn Output > Design trong ô nhập tin nhắn,
     hoặc chọn template Design trong tab Artifacts.
  2. Đính kèm file srs_design: <đường dẫn>.
  3. Dán prompt:
     "Thiết kế giao diện đúng theo file srs_design đính kèm. File này là nguồn yêu cầu
     duy nhất. Làm theo mục 0. Mỗi màn hình SCR-xx là một artboard. Không thêm gì ngoài file."
  4. Xem và chỉnh sửa: dùng chat cho thay đổi lớn, comment cho thay đổi từng phần,
     hoặc sửa trực tiếp trên canvas.
  5. Lưu lại đường dẫn dự án Claude Design và gửi cho tôi khi gọi lại skill,
     để tôi ghi vào srs_design (cần cho việc sửa sau này).

Lưu ý: bản standalone tại claude.ai/design sẽ đóng ngày 2026-12-14.
Không tạo dự án mới ở đó.
```

Sau đó dừng. Không gọi `/design`.

## 4.5. Khi người dùng gửi lại đường dẫn dự án (phương án 2)

Ghi đường dẫn vào dòng "Liên kết dự án Claude Design" của `srs_design` và đổi "Trạng thái" thành `Đã gửi Claude Design`. Chỉ ghi đường dẫn do người dùng đưa, không tự tạo.

## 4.6. Nguồn tham khảo (xác minh ngày 2026-10-12)

- Claude Code — Commands (`/design`, `/design-sync`): https://code.claude.com/docs/en/commands
- Claude Code — Artifacts (Draft a design canvas, Update an artifact, Availability): https://code.claude.com/docs/en/artifacts
- Get started with Claude Design: https://support.claude.com/en/articles/14604416-get-started-with-claude-design
- Claude Design stays on brand for daily work: https://claude.com/blog/claude-design-stays-on-brand-for-daily-work

`/design` đang ở giai đoạn research preview. Nếu lệnh hoặc yêu cầu phiên bản thay đổi, hãy kiểm tra lại các nguồn trên rồi cập nhật file này. Không đoán.
