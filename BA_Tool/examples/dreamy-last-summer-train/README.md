# The Last Summer Train — landing page mẫu (chế độ nhanh)

Trang mẫu chứng minh chế độ nhanh sau cải tiến. Dựng theo đúng quy trình của skill (quick-guide → sections.md → motion-guide), dùng **chỉ** các asset tool sinh sẵn.

- **Preset:** `dreamy` (Dreamy / Anime / Cinematic) — Shippori Mincho + Zen Kaku Gothic New, bảng màu bầu trời. Ý tưởng thị giác: *một ngày hè trôi từ trưa tới đêm sao khi cuộn trang*.
- **Chuyển động:** Level 3 — `data-sky` trên `<body>` (trời đổi màu theo cuộn), hero nhiều lớp (`data-layers`), mây (`data-clouds`), bụi nắng / đom đóm / sao (`data-particles`), cảnh ghim kể chuyện (`data-scene` + `data-step`), dải phim kéo ngang, chữ trượt (`data-split`).
- **Section:** `#hero` hero-scene → `#story` story-letter → `#journey` story-pinned → `#scenes` gallery-filmstrip → `#quote` quote-full → `#tickets` contact-split → `#night` cta-sky → `#footer` footer-minimal.
- **Tương tác (ui.js):** menu mobile, scrollspy, lightbox dải phim, form giữ chỗ có kiểm lỗi, sao chép email, nút về đầu trang.
- **Ảnh:** 9 ảnh chụp thật lấy qua công cụ ảnh của tool (Openverse), nguồn ở `assets/img/CREDITS.md`. Tông "phim hoạt hình" tạo bằng CSS (`.anime-grade`, mask hòa ảnh vào bầu trời) — không có ảnh AI, không có nhân vật hoạt hình giả.
- **Mở:** mở thẳng `index.html` bằng trình duyệt (chạy được với `file://`).
