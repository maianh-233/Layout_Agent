# SRS & Prototype Builder (BA_Tool)

Web app chạy local giúp BA đi từ một yêu cầu ngắn của khách hàng tới **prototype giao diện để show khách** (và **tài liệu SRS** khi cần). Khi tạo dự án, chọn một trong hai chế độ:

**Nhanh — Landing page** (ít lượt AI nhất)
① Mô tả landing page bằng lời, (tùy chọn) chọn **phong cách**, **mức chuyển động**, section, mood → AI dựng ngay HTML + Tailwind + JS thuần vào `workspace/<slug>/prototype/`, không hỏi, không viết SRS.
② Xem trước theo cỡ điện thoại / máy tính bảng / máy tính / màn 1920px, ghi góp ý của khách để AI sửa (cả trang hoặc **chỉ một section**), tải `.zip`.

**Design preset** (`server/src/presets.ts`): Dreamy / Anime / Cinematic · Nature / Organic · Minimal / Premium / Editorial · Vintage / Film · Futuristic · Bold / Experimental. Mỗi preset là bộ quy tắc (màu, font, bố cục, ảnh, khoảng trắng, chuyển động, section nên dùng). Để "Tự động" thì tool nhận diện preset từ mô tả. Server ghi `concept.md` cho AI và sinh `references/presets.md` khi khởi động; thêm preset = thêm một phần tử trong `PRESETS`. Section ghép từ thư viện biến thể `references/sections.md`. Mẫu: `examples/dreamy-last-summer-train/`.

**Đầy đủ — SRS + prototype**
① **Câu hỏi** — AI soạn tối đa 10 câu then chốt (gộp nghiệp vụ + giao diện); câu khách bỏ qua được AI tự đề xuất, gắn `[ĐỀ XUẤT]`.
② **SRS** — AI viết một bộ SRS gộp (Phần 0–13, gồm đặc tả giao diện và design tokens) trong một lượt; kiểm tra bằng code, rà soát bằng AI chỉ khi bấm.
③ **Dựng prototype** — chọn folder → AI dựng prototype có vai trò, dữ liệu giả, xử lý giả theo vòng đời chứng từ.
④ **Hoàn tất** — xem trước, QA tự động, HANDOFF.md.

Dự án tạo trước khi có hai chế độ vẫn đi theo luồng cũ hai giai đoạn (nghiệp vụ → giao diện).

Mọi prototype theo `references/layout-guide.md`: dùng hết bề ngang (không dồn cục vào giữa), đẹp trên cả máy tính và điện thoại, tránh kiểu "trông như AI". QA (Playwright) đo ở 1920px và báo "Bố cục dồn giữa" khi nội dung chiếm dưới 72% bề ngang.

**Chuyển động & tương tác:** tool chép sẵn `assets/js/motion.js` (`server/assets/motion.js`) vào mọi prototype — hiện dần khi cuộn, chữ tiêu đề trượt lên, parallax, số đếm, dải logo chạy ngang, nghiêng 3D / nút hút theo chuột, vầng sáng theo chuột, con trỏ tùy biến, gợn sóng khi bấm. AI chỉ gắn thuộc tính `data-*` theo mức Level 1 Basic / 2 Atmospheric / 3 Advanced (`references/motion-guide.md`). Landing page có thêm `assets/js/atmos.js` (`server/assets/atmos.js`): hạt sáng (bụi nắng, đom đóm, sao, tuyết, cánh hoa, mưa), mây trôi nhiều lớp, gradient chuyển động, bầu trời đổi màu theo tiến độ cuộn, cảnh nhiều lớp, cảnh ghim kể chuyện. Mỗi hiệu ứng cô lập lỗi (QA vẫn báo), canvas tự dừng khi ra khỏi màn hình. Hiệu ứng chuột tự tắt trên điện thoại; tôn trọng `prefers-reduced-motion`.

**Ảnh thật, đúng chủ đề:** khi dựng / sửa prototype, AI có hai công cụ của tool (`server/src/images.ts`): `search_images` tìm ảnh chụp thật theo từ khóa, `use_image` tải ảnh về `assets/img/` và ghi nguồn vào `assets/img/CREDITS.md`. AI phải mở xem ảnh để xác nhận đúng chủ đề; cấm link tự nghĩ, picsum / placeholder, ảnh AI tạo, hình vẽ giả ảnh (`references/image-guide.md`). QA báo lỗi "Ảnh không đúng nguồn", "Ảnh tự tạo", "Ảnh hỏng". Nguồn ảnh: Openverse (mặc định, không cần key); đặt `PEXELS_API_KEY` hoặc `UNSPLASH_ACCESS_KEY` trong `.env` để có ảnh đẹp hơn.

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
│   ├── SKILL.md                  # Điều phối các chế độ
│   ├── references/               # quick-guide, standard-guide, layout-guide, prototype-guide, design-guide…
│   └── templates/                # Mẫu markdown cho từng file SRS
├── server/                       # Express + TypeScript + Claude Agent SDK
├── web/                          # React + Vite + TypeScript + Tailwind
├── workspace/<project-slug>/     # Dữ liệu từng dự án
│   ├── project.json              # Bước hiện tại, câu hỏi, câu trả lời
│   ├── request.md, answers-*.md  # Đầu vào cho skill
│   ├── srs/                      # Các file SRS (chế độ đầy đủ)
│   └── prototype/                # Landing page (chế độ nhanh)
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
| `quick-prototype` | `prototype/` (landing page), sau đó QA tự động |
| `quick-revise` | Sửa `prototype/` theo `feedback.md` (góp ý hoặc lỗi QA) |
| `questions` | `questions-business.json` — tối đa 10 câu (kiểm tra bằng zod) |
| `srs` | Toàn bộ `srs/` Phần 0–13 (trừ Phần 12 do code sinh) + `_design-tokens.json`, `_registry.json`, `_permissions.json` |
| `business-questions` (luồng cũ) | `questions-business.json` (kiểm tra bằng zod, sai định dạng thì AI sửa lại 1 lần) |
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
