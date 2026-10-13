# SRS & Prototype Builder (BA_Tool)

Web app chạy local giúp BA đi từ một yêu cầu ngắn của khách hàng tới **tài liệu SRS** và **prototype giao diện**:

① **Nghiệp vụ** — nhập yêu cầu → AI sinh bộ câu hỏi dễ hiểu → trả lời từng câu → AI viết SRS nghiệp vụ (Phần 0–8, 10–13).
② **Giao diện** — AI sinh câu hỏi về giao diện dựa trên SRS đã có → trả lời → AI bổ sung `09-ui-ux/` và các mục liên quan.
③ **Dựng prototype** — chọn folder → AI dựng HTML + Tailwind (CDN) + JavaScript thuần, dữ liệu giả, xử lý giả.
④ **Hoàn tất** — xem trước prototype ngay trong tool.

> **Chỉ dùng cho cá nhân.** Tool chạy bằng tài khoản Claude (Pro / Max) mà bạn đã đăng nhập trong Claude Code trên máy của chính mình.
> Mỗi người dùng phải tự cài tool và đăng nhập bằng tài khoản Claude của chính mình — không chia sẻ tài khoản, không triển khai tool thành dịch vụ cho người khác dùng chung.

## Yêu cầu

- Node.js 20 trở lên (đã thử với Node 22)
- Claude Code đã đăng nhập bằng tài khoản Claude (Pro / Max) — xem bên dưới
- Skill thẩm mỹ `design-taste-frontend` đã cài trong `~/.claude/skills/` (bắt buộc cho bước dựng prototype)

## Cài và đăng nhập Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude          # lần đầu chạy sẽ mở trình duyệt để đăng nhập bằng tài khoản Claude
```

Đăng nhập xong có thể thoát Claude Code (gõ `/exit`). Tool dùng lại phiên đăng nhập này, **không cần API key**.

> Nếu bạn đã đăng nhập Claude Code qua extension VS Code thì tool cũng dùng được phiên đó.
> Lúc này màn hình kiểm tra có thể báo "lệnh `claude` chưa có trong PATH" — đó chỉ là thông tin; tool vẫn chạy vì Agent SDK đã kèm sẵn Claude Code.

**Không đặt biến `ANTHROPIC_API_KEY`** (trong hệ thống hay trong `.env`): nếu có, SDK có thể dùng API key (tính tiền riêng) thay cho tài khoản Claude. Tool sẽ hiện cảnh báo khi phát hiện biến này.

## Cài đặt và chạy tool

```bash
cd BA_Tool
npm install
npm run dev
```

Khi khởi động, backend tự kiểm tra Claude Code đã cài và đã đăng nhập chưa. Nếu chưa, giao diện hiện màn hình hướng dẫn kèm nút **Kiểm tra lại**.

`npm run dev` khởi động cùng lúc:

- Backend Express: http://127.0.0.1:8787 (chỉ lắng nghe trên máy local)
- Giao diện: http://localhost:5173 — mở địa chỉ này trên trình duyệt

File `.env` là **tùy chọn** (copy từ `.env.example`), chỉ dùng để đổi `CLAUDE_MODEL` (mặc định `claude-opus-5-5`), `TASTE_SKILL`, `PORT`.

## Cấu trúc

```
BA_Tool/
├── .claude/skills/srs-builder/   # Skill chứa "trí tuệ" của tool
│   ├── SKILL.md                  # Điều phối 5 chế độ
│   ├── references/               # srs-structure, question-guide, srs-writing-guide, prototype-guide
│   └── templates/                # Mẫu markdown cho từng file SRS
├── server/                       # Express + TypeScript + Claude Agent SDK
├── web/                          # React + Vite + TypeScript + Tailwind
├── workspace/<project-slug>/     # Dữ liệu từng dự án
│   ├── project.json              # Bước hiện tại, câu hỏi, câu trả lời
│   ├── request.md, answers-*.md  # Đầu vào cho skill
│   └── srs/                      # Các file SRS
├── .env.example                  # Tùy chọn (model, cổng) — không chứa API key
└── README.md
```

## Cách tool gọi AI

Backend dùng **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) với `cwd` là thư mục `BA_Tool` và `settingSources: ['user', 'project']`. Vì vậy Claude nạp được:

- skill `srs-builder` trong `.claude/skills/` của tool;
- skill `design-taste-frontend` trong `~/.claude/skills/` (chỉ bật ở chế độ prototype).

Mỗi bước gửi một lệnh dạng:

```
/srs-builder MODE: business-questions
PROJECT_DIR: D:\...\workspace\<slug>
```

| Chế độ | Ghi ra |
|---|---|
| `business-questions` | `questions-business.json` (kiểm tra bằng zod, sai định dạng thì AI sửa lại 1 lần) |
| `business-srs` | `srs/` Phần 0–8, 10–13 + `09-ui-ux/README.md` giữ chỗ |
| `ui-questions` | `questions-ui.json` |
| `ui-srs` | `srs/09-ui-ux/` + cập nhật 0.5, 6.8, 6.9, 6.11, 8.1, 12, 13.9 |
| `prototype` | Folder bạn chọn |

**An toàn:** AI chỉ được dùng các công cụ Read/Write/Edit/Glob/Grep/Skill (không có Bash). Mọi lệnh ghi file nằm ngoài folder dự án / folder prototype đều bị chặn, và tool không có thao tác xóa file nào ngoài các file tạm của chính nó.

## Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Màn hình “Cần đăng nhập Claude Code” | Chạy `claude` trong terminal để đăng nhập, rồi bấm **Kiểm tra lại** |
| Cảnh báo “đang có biến ANTHROPIC_API_KEY” | Gỡ biến đó khỏi hệ thống / `.env`, chạy lại `npm run dev` |
| “Đã chạm giới hạn sử dụng của tài khoản” | Chờ tới thời điểm hạn mức được làm mới, rồi bấm **Chạy lại bước này**. Câu trả lời và tiến độ được giữ nguyên |
| “Phiên đăng nhập Claude Code không hợp lệ” | Chạy `claude` để đăng nhập lại, rồi bấm **Chạy lại bước này** |
| “Mất kết nối tới Claude” | Kiểm tra mạng, bấm **Chạy lại bước này** |
| “Bộ câu hỏi sai định dạng sau 2 lần thử” | Bấm **Chạy lại bước này** |
| “Folder không ghi được” | Chọn folder khác hoặc kiểm tra quyền ghi |
| “Không tìm thấy skill design-taste-frontend” | Cài skill vào `~/.claude/skills/` hoặc đặt `TASTE_SKILL` trong `.env` |
| Tác vụ bị gián đoạn khi tắt server | Mở lại dự án và bấm **Chạy lại bước này** |

Đóng trình duyệt hay tắt tool đều không mất dữ liệu: câu trả lời tự lưu vào `project.json` mỗi khi chuyển câu, và **Mở tiếp** sẽ đưa bạn về đúng bước đang làm.
