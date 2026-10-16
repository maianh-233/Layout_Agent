// Design preset cho chế độ nhanh (landing page): mỗi preset là một BỘ QUY TẮC thiết kế
// (màu, chữ, bố cục, ảnh, khoảng trắng, chuyển động, section nên dùng) — không chỉ là bảng màu.
// Một nguồn duy nhất: giao diện lấy danh sách qua /api/presets, server ghi preset đã chọn vào
// PROJECT_DIR/concept.md để AI đọc một file thay vì tự đoán phong cách (nhanh, ổn định hơn).
// Thêm preset mới = thêm một phần tử vào PRESETS (id section phải có trong references/sections.md).
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { ROOT_DIR } from './config.js';

export interface Preset {
  id: string;
  name: string;
  /** Một câu mô tả cho người dùng (tiếng Việt) */
  tagline: string;
  /** Từ khóa nhận diện khi người dùng để "Tự động" (chữ thường, có / không dấu đều được) */
  keywords: string[];
  /** Màu theo vai trò — AI đưa vào tailwind.config / CSS variables */
  palette: Record<string, string>;
  /** Google Fonts (tên family:wght) — chữ trên trang là tiếng Anh */
  fonts: { display: string; body: string; label?: string };
  typography: string[];
  layout: string[];
  imagery: string[];
  whitespace: string;
  /** Mức chuyển động mặc định (1 Basic · 2 Atmospheric · 3 Advanced) */
  motion: 1 | 2 | 3;
  motionRules: string[];
  /** Id section trong references/sections.md, theo thứ tự gợi ý */
  sections: string[];
  /** Được phép (ghi đè mục "Không dùng" của layout-guide) */
  allow: string[];
  avoid: string[];
}

export const PRESETS: Preset[] = [
  {
    id: 'dreamy',
    name: 'Dreamy / Anime / Cinematic',
    tagline: 'Bầu trời, ánh chiều, khoảnh khắc lặng — như một khung phim hoạt hình.',
    keywords: ['dreamy', 'anime', 'ghibli', 'shinkai', 'cinematic', 'lofi', 'lo-fi', 'nostalgic', 'mộng mơ', 'mong mo', 'điện ảnh', 'dien anh', 'hoạt hình', 'hoat hinh', 'hoàng hôn', 'hoang hon', 'bầu trời', 'bau troi', 'cô đơn', 'co don', 'lonely'],
    palette: { 'sky-dawn': '#F6D8C8', 'sky-day': '#A9C6E8', dusk: '#2B3566', night: '#0E1430', ink: '#1E2340', paper: '#FBF7F2', glow: '#FFC98B', sakura: '#E8A6B8' },
    fonts: { display: 'Shippori Mincho:wght@500;700;800', body: 'Zen Kaku Gothic New:wght@400;500;700', label: 'Zen Kaku Gothic New' },
    typography: [
      'Tiêu đề Shippori Mincho (serif kiểu poster phim Nhật), cỡ rất lớn ở hero (clamp 3.5rem → 8rem), dòng chặt (leading-[0.95]), chữ thường xen chữ hoa.',
      'Nhãn nhỏ: chữ hoa, tracking-[0.3em], cỡ 11–12px — như phụ đề / số cảnh ("SCENE 02 — THE FIELD").',
      'Thân bài 17–18px, leading-relaxed, màu ink/80; câu ngắn, giàu hình ảnh, giọng tự sự.',
    ],
    layout: [
      'Hero toàn màn hình `min-h-[100dvh]`, tiêu đề đặt góc dưới-trái hoặc căn giữa trên bầu trời — được phép căn giữa.',
      'Mỗi section là một "cảnh": nền chuyển màu theo giờ trong ngày (sáng → chiều → đêm) khi cuộn xuống — dùng `data-sky` trên `<body>` và để section trong suốt.',
      'Xen kẽ cảnh rộng tràn viền với khối chữ hẹp (max-w-prose) đặt lệch trái / phải — nhiều khoảng trống bầu trời.',
      'Ít nhất một cảnh ghim theo cuộn (`story-pinned`) kể chuyện bằng 3 câu ngắn đổi lần lượt.',
    ],
    imagery: [
      'Ảnh chụp thật: cánh đồng / ngọn đồi / ga tàu vắng / mặt hồ / đường quê / bầu trời mây lớn — một chủ thể nhỏ cô độc giữa khung rộng.',
      'Từ khóa gợi ý: "lone tree field clouds", "empty train station countryside", "summer clouds blue sky", "mountain lake dusk", "sunset grass field", "starry night sky".',
      'Xử lý ảnh bằng CSS cho tông phim hoạt hình: `saturate-[1.15] contrast-[1.05]` + lớp phủ gradient màu trời (mix-blend-soft-light), đáy ảnh hòa vào nền bằng gradient.',
    ],
    whitespace: 'Rất nhiều: section `py-28 lg:py-40`, chữ chiếm ≤ 40% khung, để bầu trời "thở".',
    motion: 3,
    motionRules: [
      'Hero: `data-clouds` (2–3 lớp) + `data-particles="dust"` hoặc `"fireflies"` (cảnh chiều / đêm) + tiêu đề `data-split="words"` chậm.',
      'Cảnh đêm: `data-particles="stars"`; cảnh ghim: `data-scene` + `data-step`.',
      'Ảnh lớn: `data-reveal="clip"`; lớp ảnh trong hero: `data-layers` với 2–3 `data-depth`.',
      'Nhịp chậm, êm; không tilt, không magnetic, không con trỏ tùy biến, không ripple.',
    ],
    sections: ['hero-scene', 'story-letter', 'story-pinned', 'gallery-filmstrip', 'quote-full', 'cta-sky', 'footer-minimal'],
    allow: ['gradient bầu trời (cam đào → xanh trời → tím đêm)', 'quầng sáng mềm / hạt sáng', 'hero căn giữa', 'mây vẽ bằng gradient (trang trí trừu tượng, không giả ảnh chụp)'],
    avoid: ['gradient tím–xanh neon', 'thẻ bo góc có bóng đổ kiểu SaaS', 'icon dày đặc', 'phóng to / thu nhỏ ảnh tĩnh để giả nhân vật chuyển động'],
  },
  {
    id: 'nature',
    name: 'Nature / Organic / Atmospheric',
    tagline: 'Rêu, gỗ, sương sớm — chất liệu tự nhiên, nhịp chậm.',
    keywords: ['nature', 'organic', 'forest', 'eco', 'farm', 'herbal', 'tea', 'garden', 'retreat', 'thiên nhiên', 'thien nhien', 'rừng', 'rung', 'hữu cơ', 'huu co', 'trà', 'vườn', 'vuon', 'nông trại', 'nong trai', 'homestay', 'cắm trại', 'cam trai', 'sương', 'suong'],
    palette: { moss: '#3F5A3C', fern: '#6F8B5E', mist: '#F4F1EA', sand: '#E9E1D1', bark: '#5A4636', sky: '#BFD3D6', ochre: '#C98A3D', ink: '#1F271D' },
    fonts: { display: 'Fraunces:opsz,wght@9..144,400;9..144,600', body: 'Manrope:wght@400;500;700' },
    typography: [
      'Tiêu đề Fraunces (serif mềm), một từ in nghiêng màu fern để nhấn ý.',
      'Thân bài Manrope 17px, màu ink/75; số liệu (độ cao, nhiệt độ, mùa) đặt thành nhãn nhỏ.',
    ],
    layout: [
      'Bố cục hữu cơ: ảnh bo góc lớn (rounded-[2rem]) hoặc vòm (rounded-t-full) xen ảnh vuông sắc cạnh.',
      'Lưới lệch nhịp 12 cột: ảnh chiếm 7 cột, chữ 4 cột lệch xuống; dải ảnh ngang kéo được.',
      'Nền mist / sand xen một dải moss đậm cho phần số liệu hoặc trích dẫn.',
    ],
    imagery: ['Ảnh thật: rừng sương, lá cận cảnh, bàn tay làm việc, chất liệu gỗ / đá / vải lanh.', 'Tông ấm hơi phai: `saturate-[.9] sepia-[.08]`.'],
    whitespace: 'Rộng rãi, `py-24 lg:py-32`, khối chữ ngắn.',
    motion: 2,
    motionRules: [
      '`data-reveal="clip"` cho ảnh lớn, `data-reveal-stagger` cho lưới, `data-parallax` 0.1–0.15 cho ảnh hero.',
      'Một section có `data-particles="dust"` (nắng xuyên rừng) hoặc `data-clouds` mỏng (sương) — không hơn.',
      '`data-float` rất nhẹ (6px) cho 1–2 chi tiết trang trí (lá, nhãn).',
    ],
    sections: ['hero-split', 'story-editorial', 'features-numbered', 'gallery-lookbook', 'stats-band', 'quote-full', 'contact-split', 'footer-big'],
    allow: ['sương mỏng bằng gradient', 'hình vòm / bo lớn'],
    avoid: ['xanh lá tươi chói', 'icon lá cây clip-art', 'gradient đa màu'],
  },
  {
    id: 'editorial',
    name: 'Minimal / Premium / Editorial',
    tagline: 'Như tạp chí in: chữ lớn, lưới chặt, rất ít màu.',
    keywords: ['minimal', 'premium', 'luxury', 'editorial', 'magazine', 'fashion', 'jewelry', 'architecture', 'tối giản', 'toi gian', 'sang trọng', 'sang trong', 'cao cấp', 'cao cap', 'thời trang', 'thoi trang', 'trang sức', 'trang suc', 'kiến trúc', 'kien truc', 'nội thất', 'noi that'],
    palette: { paper: '#F5F3EF', ink: '#111111', stone: '#D9D4CB', muted: '#6B6760', bronze: '#8C6A43' },
    fonts: { display: 'Instrument Serif:ital@0;1', body: 'Geist:wght@300;400;500;600' },
    typography: [
      'Tiêu đề Instrument Serif cực lớn (đến 10rem ở 2xl), một phần in nghiêng; tracking-tight.',
      'Thân Geist 16px; nhãn chữ hoa 11px tracking-[0.2em]; số trang / số mục kiểu tạp chí (No. 01).',
    ],
    layout: [
      'Lưới 12 cột với đường kẻ mảnh (border-ink/15) chia khối; căn trái tuyệt đối.',
      'Hero chữ là chính (`hero-type`), ảnh nhỏ đặt lệch; ảnh lớn xuất hiện ở section sau như trang đôi tạp chí.',
      'Không thẻ có bóng đổ; phân tách bằng đường kẻ và khoảng trắng.',
    ],
    imagery: ['Ảnh studio / kiến trúc, nền trơn, nhiều khoảng trống; có thể đen trắng (`grayscale`) với 1 ảnh màu làm điểm nhấn.'],
    whitespace: 'Rất rộng nhưng có kỷ luật: lề cố định, khối căn theo lưới.',
    motion: 1,
    motionRules: [
      'Chỉ `data-reveal="fade"`/`"up"`, `data-reveal="clip"` cho 1–2 ảnh lớn, `data-split="words"` cho 1 tiêu đề.',
      'Hover: gạch chân chạy, ảnh phóng chậm 1.04. Không particles / clouds / tilt / cursor.',
    ],
    sections: ['hero-type', 'story-editorial', 'gallery-lookbook', 'features-numbered', 'quote-full', 'cta-type', 'footer-big'],
    allow: [],
    avoid: ['bo góc lớn', 'bóng đổ', 'nhiều màu', 'icon trang trí'],
  },
  {
    id: 'film',
    name: 'Vintage / Retro / Film',
    tagline: 'Hạt phim, màu phai, nhãn đánh máy — hoài niệm có chủ đích.',
    keywords: ['vintage', 'retro', 'film', 'analog', 'polaroid', '70s', '80s', '90s', 'nostalgia', 'hoài cổ', 'hoai co', 'cổ điển', 'co dien', 'xưa', 'xua', 'phim', 'cafe sách', 'vinyl', 'đĩa than', 'dia than'],
    palette: { cream: '#EFE6D2', ink: '#2A211B', 'faded-red': '#B4442F', mustard: '#D9A441', teal: '#2F6F6A', paper: '#F7F1E3' },
    fonts: { display: 'Young Serif:wght@400', body: 'Work Sans:wght@400;500;700', label: 'Courier Prime:wght@400;700' },
    typography: [
      'Tiêu đề Young Serif, cỡ lớn, có thể đặt trong khung viền kép như nhãn đĩa than.',
      'Nhãn / chú thích Courier Prime (đánh máy): số khung "FR. 24A", ngày tháng, giá.',
    ],
    layout: [
      'Ảnh khung polaroid / dải phim có lỗ (border-dashed), xoay nhẹ ±2° (`rotate-[-2deg]`).',
      'Khối màu phẳng (mustard, teal, faded-red) cắt ngang trang; đường kẻ đôi.',
      'Lớp hạt phim phủ toàn trang: một `<div>` fixed `pointer-events-none` với nhiễu bằng SVG feTurbulence, opacity .08.',
    ],
    imagery: ['Ảnh thật tông ấm, phai: `sepia-[.25] saturate-[.85] contrast-[1.05]`; khung viền trắng dày.'],
    whitespace: 'Vừa phải, nhịp dày hơn editorial; khối xếp chồng như sổ lưu niệm.',
    motion: 2,
    motionRules: [
      '`data-reveal="up"` + `data-reveal-stagger` cho ảnh polaroid, `data-float` rất nhẹ cho 1 ảnh xoay.',
      '`data-marquee` cho dải chữ kiểu băng rôn; `data-drag-scroll` cho dải phim.',
      'Không particles kiểu lấp lánh; không blur.',
    ],
    sections: ['hero-offset', 'story-letter', 'gallery-filmstrip', 'features-alternate', 'stats-band', 'cta-fullbleed', 'footer-minimal'],
    allow: ['hạt nhiễu SVG feTurbulence làm lớp phủ', 'ảnh xoay nhẹ'],
    avoid: ['gradient hiện đại', 'glassmorphism', 'font sans hình học'],
  },
  {
    id: 'futuristic',
    name: 'Futuristic / Digital Art',
    tagline: 'Nền tối, lưới kỹ thuật, ánh neon tiết chế.',
    keywords: ['futuristic', 'tech', 'ai', 'web3', 'crypto', 'digital art', 'game', 'gaming', 'cyber', 'sci-fi', 'saas', 'startup', 'công nghệ', 'cong nghe', 'tương lai', 'tuong lai', 'số hóa', 'so hoa'],
    palette: { void: '#07080C', panel: '#10131B', line: '#232838', ink: '#E8ECF5', muted: '#8A93A6', acid: '#C6FF3D', cyan: '#3DF2E0' },
    fonts: { display: 'Unbounded:wght@400;600;800', body: 'IBM Plex Sans:wght@400;500;600', label: 'JetBrains Mono:wght@400;600' },
    typography: ['Tiêu đề Unbounded, chữ hoa / thường trộn, cỡ lớn; nhãn JetBrains Mono kiểu chỉ số hệ thống `[ 02 / MODULE ]`.'],
    layout: [
      'Nền void, lưới kẻ mảnh (background-image linear-gradient 1px) mờ 6%; khối panel viền line.',
      'Bento không đều cho tính năng; dải số liệu mono; con số lớn.',
    ],
    imagery: ['Ảnh thật: kiến trúc đêm, ánh đèn, phần cứng cận cảnh — xử lý `grayscale contrast-125` + lớp phủ màu acid/cyan mix-blend-color.'],
    whitespace: 'Đặc hơn: `py-20`, mật độ thông tin cao nhưng căn lưới chặt.',
    motion: 3,
    motionRules: [
      '`data-spotlight` cho panel, `data-scrub` cho chữ lớn, `data-particles="stars"` mật độ thấp ở hero, `data-gradient-shift` cho một dải CTA.',
      '`data-cursor="ring"` được phép; `data-tilt` nhẹ (4) cho thẻ.',
    ],
    sections: ['hero-type', 'features-bento', 'stats-band', 'story-pinned', 'gallery-masonry', 'cta-sky', 'footer-big'],
    allow: ['lưới kỹ thuật', 'quầng sáng neon nhỏ'],
    avoid: ['gradient tím–xanh', 'robot / não bộ clip-art', 'glassmorphism tràn lan'],
  },
  {
    id: 'bold',
    name: 'Bold / Experimental / Creative',
    tagline: 'Chữ khổng lồ, khối màu mạnh, phá lưới có kiểm soát.',
    keywords: ['bold', 'experimental', 'creative', 'agency', 'portfolio', 'studio', 'brutal', 'festival', 'event', 'music', 'sáng tạo', 'sang tao', 'phá cách', 'pha cach', 'sự kiện', 'su kien', 'âm nhạc', 'am nhac', 'gen z', 'trẻ trung', 'tre trung'],
    palette: { paper: '#F2EFE6', ink: '#0F0F0F', signal: '#FF4D1F', cobalt: '#2340FF', acid: '#E9FF3B' },
    fonts: { display: 'Bricolage Grotesque:opsz,wght@12..96,400;12..96,800', body: 'Bricolage Grotesque:opsz,wght@12..96,400;12..96,500', label: 'Instrument Serif' },
    typography: ['Một family Bricolage Grotesque: tiêu đề 800 cực lớn (tràn khung, chữ chạm mép), thân 400; điểm nhấn Instrument Serif nghiêng.'],
    layout: [
      'Khối màu phẳng full-bleed đổi liên tục (signal → cobalt → paper); chữ khổng lồ chồng lên ảnh.',
      'Phá lưới có chủ đích: ảnh lệch, chữ xoay 90°, nhãn dán (sticker) bo tròn.',
    ],
    imagery: ['Ảnh thật tương phản mạnh, cắt sát; có thể cắt khung hình tròn / pill.'],
    whitespace: 'Ít hơn, dày đặc năng lượng nhưng mỗi section một ý.',
    motion: 2,
    motionRules: ['`data-marquee` chữ lớn, `data-magnetic` CTA, `data-tilt` thẻ dự án, `data-split="chars"` cho 1 tiêu đề, `data-cursor="dot"` + `data-cursor-label`.'],
    sections: ['hero-offset', 'features-bento', 'gallery-masonry', 'stats-band', 'quote-full', 'cta-type', 'footer-big'],
    allow: ['chữ xoay / chồng ảnh', 'khối màu bão hòa'],
    avoid: ['pastel nhạt nhòa', 'bố cục an toàn đối xứng'],
  },
];

export const presetById = (id?: string) => PRESETS.find((p) => p.id === id);

const fold = (s: string) => s.toLowerCase().normalize('NFC');
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Khớp nguyên từ ("ai" không khớp "said"), hỗ trợ chữ có dấu */
const hasWord = (text: string, kw: string) => new RegExp(`(?<![\\p{L}\\d])${escape(kw)}(?![\\p{L}\\d])`, 'u').test(text);

/** Đoán preset từ mô tả (đếm từ khóa). Không đủ tín hiệu → undefined (AI tự chọn trong danh mục). */
export function detectPreset(text: string): Preset | undefined {
  const t = fold(text);
  let best: Preset | undefined;
  let score = 0;
  for (const p of PRESETS) {
    const s = p.keywords.reduce((n, k) => n + (hasWord(t, k) ? 1 : 0), 0);
    if (s > score) [best, score] = [p, s];
  }
  return best;
}

/** Danh sách cho giao diện (không gửi toàn bộ quy tắc). */
export const presetSummaries = () =>
  PRESETS.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, keywords: p.keywords, motion: p.motion, swatches: Object.values(p.palette).slice(0, 5), sections: p.sections }));

// ---------- Cấu hình website do người dùng nhập (màn hình Quick Create) ----------

/** Ngôn ngữ chính của website — một ngôn ngữ, không tạo bộ chuyển ngôn ngữ */
export const LANGUAGES = [
  { id: 'en', label: 'English — Tiếng Anh', htmlLang: 'en', name: 'tiếng Anh' },
  { id: 'vi', label: 'Vietnamese — Tiếng Việt', htmlLang: 'vi', name: 'tiếng Việt' },
  { id: 'zh', label: 'Chinese — Tiếng Trung (giản thể)', htmlLang: 'zh-CN', name: 'tiếng Trung giản thể' },
  { id: 'ja', label: 'Japanese — Tiếng Nhật', htmlLang: 'ja', name: 'tiếng Nhật' },
] as const;
export type Language = (typeof LANGUAGES)[number]['id'];
const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [Language, ...Language[]];

/**
 * Danh mục section / nhóm nội dung. Id cũ (hero, story, features, gallery, editorial, pricing, testimonials, faq, cta, contact)
 * giữ nguyên để dự án cũ vẫn đọc được. `place` gợi ý chỗ đặt — AI vẫn tự quyết định theo sitemap.
 * `variants`: nhóm biến thể trong references/sections.md.
 */
export const SECTION_CATALOG = [
  { id: 'hero', label: 'Hero / Giới thiệu chính', hint: 'Màn hình đầu: thông điệp chính, hình ảnh chủ đạo, nút hành động.', place: 'Đầu trang chủ (trang con có hero nhỏ riêng)', variants: 'Hero' },
  { id: 'story', label: 'About / Câu chuyện thương hiệu', hint: 'Nguồn gốc, giá trị, con người đứng sau thương hiệu.', place: 'Trang About riêng + đoạn giới thiệu ngắn trên trang chủ', variants: 'Story / About' },
  { id: 'services', label: 'Services / Dịch vụ', hint: 'Các dịch vụ chính, mỗi dịch vụ có mô tả, có thể có trang chi tiết.', place: 'Trang Services + trang chi tiết dịch vụ; tóm tắt trên trang chủ', variants: 'Feature / Service' },
  { id: 'features', label: 'Features / Điểm nổi bật', hint: 'Lý do chọn, điểm khác biệt, con số nổi bật.', place: 'Trang chủ hoặc trang About', variants: 'Feature / Service' },
  { id: 'projects', label: 'Projects / Portfolio', hint: 'Dự án, tác phẩm, case study tiêu biểu.', place: 'Trang Projects + trang chi tiết dự án; vài dự án nổi bật trên trang chủ', variants: 'Gallery / Lookbook' },
  { id: 'gallery', label: 'Gallery / Thư viện hình ảnh', hint: 'Ảnh không gian, sản phẩm, khoảnh khắc — bấm để phóng to.', place: 'Trang Gallery riêng hoặc một khối trên trang chủ', variants: 'Gallery / Lookbook' },
  { id: 'collections', label: 'Collections / Bộ sưu tập', hint: 'Nhóm sản phẩm / tác phẩm theo chủ đề, mùa (giới thiệu, không bán hàng).', place: 'Trang Collections + trang chi tiết bộ sưu tập', variants: 'Gallery / Lookbook' },
  { id: 'testimonials', label: 'Testimonials / Đánh giá', hint: 'Cảm nhận của khách hàng, đối tác.', place: 'Trang chủ hoặc trang Services', variants: 'Pricing, đánh giá, FAQ' },
  { id: 'team', label: 'Team / Đội ngũ', hint: 'Những người chính, vai trò, chân dung.', place: 'Trang About hoặc trang Team riêng', variants: 'Story / About' },
  { id: 'process', label: 'Process / Quy trình', hint: 'Các bước làm việc / trải nghiệm theo mốc.', place: 'Trang Services hoặc About', variants: 'Editorial / nhịp nghỉ (timeline)' },
  { id: 'pricing', label: 'Pricing / Bảng giá', hint: 'Gói dịch vụ, giá tham khảo.', place: 'Trang Services hoặc Pricing riêng', variants: 'Pricing, đánh giá, FAQ' },
  { id: 'faq', label: 'FAQ / Câu hỏi thường gặp', hint: 'Giải đáp thắc mắc phổ biến.', place: 'Trang FAQ riêng hoặc cuối trang Services / Contact', variants: 'Pricing, đánh giá, FAQ' },
  { id: 'blog', label: 'Blog / Tin tức', hint: 'Danh sách bài viết và trang đọc bài.', place: 'Trang Blog (danh sách) + trang bài viết; 2–3 bài mới trên trang chủ', variants: 'Feature / Service' },
  { id: 'editorial', label: 'Editorial / Trích dẫn, nhịp nghỉ', hint: 'Câu trích dẫn lớn, dải số liệu, khoảng nghỉ thị giác.', place: 'Xen giữa các khối trên trang chủ / About', variants: 'Editorial / nhịp nghỉ' },
  { id: 'cta', label: 'CTA / Kêu gọi hành động', hint: 'Khối chốt cuối trang dẫn tới liên hệ / đặt lịch.', place: 'Cuối các trang chính, trước footer', variants: 'CTA' },
  { id: 'contact', label: 'Contact / Liên hệ', hint: 'Thông tin liên hệ, bản đồ, form (bản demo nếu chưa có backend).', place: 'Trang Contact riêng', variants: 'Contact & Footer' },
  { id: 'footer', label: 'Footer / Chân trang', hint: 'Thông tin thương hiệu, liên kết các trang, liên hệ, ©.', place: 'Mọi trang (giống nhau)', variants: 'Contact & Footer' },
] as const;
export type SectionId = (typeof SECTION_CATALOG)[number]['id'];
const SECTION_IDS = SECTION_CATALOG.map((s) => s.id) as [SectionId, ...SectionId[]];

/** Giới hạn độ dài — vượt thì báo lỗi rõ ràng (không cắt ngầm) */
export const LIMITS = { topic: 300, brand: 120, purpose: 3000, colors: 500, font: 200, sectionNote: 3000, notes: 20000 } as const;

const tooLong = (label: string, max: number) => ({ message: `${label} dài quá ${max.toLocaleString('vi-VN')} ký tự — hãy rút gọn (tool không tự cắt bớt).` });

const SectionPickSchema = z.object({
  id: z.enum(SECTION_IDS),
  /** Mô tả riêng của BA cho section; trống = AI tự xây dựng */
  description: z.string().trim().max(LIMITS.sectionNote, tooLong('Mô tả section', LIMITS.sectionNote)).default(''),
});
export type SectionPick = z.infer<typeof SectionPickSchema>;

export const ConceptSchema = z.object({
  /** Chủ đề website (bắt buộc khi bắt đầu tạo) */
  topic: z.string().trim().max(LIMITS.topic, tooLong('Chủ đề', LIMITS.topic)).default(''),
  /** Tên công ty / thương hiệu / dự án / cá nhân (bắt buộc khi bắt đầu tạo) */
  brand: z.string().trim().max(LIMITS.brand, tooLong('Tên thương hiệu', LIMITS.brand)).default(''),
  /** Mục đích website (không bắt buộc — AI suy luận từ chủ đề) */
  purpose: z.string().trim().max(LIMITS.purpose, tooLong('Mục đích', LIMITS.purpose)).default(''),
  /** 'auto' = tự đoán theo mô tả */
  preset: z.string().max(40).default('auto'),
  motion: z.enum(['auto', '1', '2', '3']).default('auto'),
  language: z.enum(LANGUAGE_IDS).default('en'),
  /** Màu mong muốn: HEX, tên màu hoặc mô tả tự nhiên */
  colors: z.string().trim().max(LIMITS.colors, tooLong('Màu sắc', LIMITS.colors)).default(''),
  /** Font mong muốn */
  font: z.string().trim().max(LIMITS.font, tooLong('Font chữ', LIMITS.font)).default(''),
  /** Section BA chọn, theo thứ tự chọn. Dữ liệu cũ (mảng id) được đổi sang { id, description: '' } */
  sections: z
    .preprocess(
      (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? { id: x, description: '' } : x)) : v),
      z.array(SectionPickSchema).max(SECTION_CATALOG.length),
    )
    .default([])
    .transform((list) => list.filter((s, i) => list.findIndex((x) => x.id === s.id) === i)),
  /** Chú thích bổ sung dài — truyền nguyên văn cho AI */
  notes: z.string().max(LIMITS.notes, tooLong('Chú thích bổ sung', LIMITS.notes)).default(''),
  /** Dự án cũ: màu / mood */
  mood: z.string().trim().max(500).default(''),
  /** Dự án cũ: link tham khảo */
  reference: z.string().trim().max(1000).default(''),
});
export type Concept = z.infer<typeof ConceptSchema>;

/** Kiểm tra trước khi bắt đầu tạo website: trường bắt buộc */
export const QuickStartSchema = ConceptSchema.superRefine((c, ctx) => {
  if (c.topic.length < 3) ctx.addIssue({ code: 'custom', path: ['topic'], message: 'Hãy nhập chủ đề website (ít nhất 3 ký tự).' });
  if (!c.brand) ctx.addIssue({ code: 'custom', path: ['brand'], message: 'Hãy nhập tên công ty / thương hiệu / dự án.' });
});

export const languageOf = (id: string | undefined) => LANGUAGES.find((l) => l.id === id) ?? LANGUAGES[0];
export const sectionOf = (id: string) => SECTION_CATALOG.find((s) => s.id === id);

/** Danh mục cho màn hình cấu hình */
export const quickCatalog = () => ({
  presets: presetSummaries(),
  sections: SECTION_CATALOG.map(({ id, label, hint, place }) => ({ id, label, hint, place })),
  languages: LANGUAGES.map(({ id, label }) => ({ id, label })),
  limits: LIMITS,
});

const MOTION_LABEL = { 1: 'Level 1 — Basic', 2: 'Level 2 — Atmospheric', 3: 'Level 3 — Advanced' } as const;

function renderPreset(p: Preset): string[] {
  const L = [
    `### Preset: ${p.name} (\`${p.id}\`)`,
    p.tagline,
    '',
    `**Bảng màu** (đưa vào \`tailwind.config\` dưới đúng các tên này): ${Object.entries(p.palette).map(([k, v]) => `\`${k}\` ${v}`).join(' · ')}`,
    `**Font** (Google Fonts): display \`${p.fonts.display}\` · body \`${p.fonts.body}\`${p.fonts.label ? ` · nhãn \`${p.fonts.label}\`` : ''}`,
    '',
    '**Chữ**',
    ...p.typography.map((x) => `- ${x}`),
    '**Bố cục**',
    ...p.layout.map((x) => `- ${x}`),
    '**Ảnh**',
    ...p.imagery.map((x) => `- ${x}`),
    `**Khoảng trắng:** ${p.whitespace}`,
    `**Chuyển động mặc định:** ${MOTION_LABEL[p.motion]}`,
    ...p.motionRules.map((x) => `- ${x}`),
    `**Section gợi ý (id trong sections.md, theo thứ tự):** ${p.sections.map((s) => `\`${s}\``).join(' → ')}`,
  ];
  if (p.allow.length) L.push(`**Được phép (ghi đè layout-guide mục 3):** ${p.allow.join('; ')}`);
  L.push(`**Tránh:** ${p.avoid.join('; ')}`, '');
  return L;
}

/** Đường dẫn danh mục preset cho AI (sinh từ PRESETS khi server khởi động — không sửa tay) */
export const PRESETS_DOC = path.join(ROOT_DIR, '.claude', 'skills', 'srs-builder', 'references', 'presets.md');

/** Ghi references/presets.md — AI đọc khi phải tự chọn / đổi preset (quick-revise "đổi phong cách"). */
export async function writePresetCatalog(): Promise<void> {
  const body = [
    '<!-- Sinh tự động từ server/src/presets.ts khi server khởi động — không sửa tay. Thêm / sửa preset trong presets.ts. -->',
    '# Danh mục design preset (chế độ nhanh)',
    '',
    'Mỗi preset là một bộ quy tắc thiết kế đầy đủ. `PROJECT_DIR/concept.md` cho biết preset đã chốt; file này dùng khi phải tự chọn hoặc khi BA muốn đổi phong cách.',
    '',
    ...PRESETS.flatMap(renderPreset),
  ].join('\n');
  const old = existsSync(PRESETS_DOC) ? await fs.readFile(PRESETS_DOC, 'utf8') : '';
  if (old !== body) await fs.writeFile(PRESETS_DOC, body, 'utf8');
}

/** Preset sẽ dùng: BA chọn, hoặc nhận diện từ mô tả (chủ đề + mục đích + màu + chú thích). */
export function resolvePreset(request: string, c: Concept | undefined): { preset?: Preset; how: 'chosen' | 'detected' | 'none' } {
  const concept = ConceptSchema.parse(c ?? {});
  const chosen = concept.preset !== 'auto' ? presetById(concept.preset) : undefined;
  if (chosen) return { preset: chosen, how: 'chosen' };
  const detected = detectPreset([request, concept.topic, concept.purpose, concept.colors, concept.mood, concept.notes].join(' '));
  return detected ? { preset: detected, how: 'detected' } : { how: 'none' };
}

/** Kết quả kiểm tra do tool chạy trước khi giao việc cho AI (không tốn lượt AI) */
export interface BriefChecks {
  images?: { ok: boolean; provider?: string; error?: string; skipped?: { provider: string; kind?: string }[] };
  fonts?: { family: string; onGoogleFonts: boolean | null; supports: boolean | null; note?: string }[];
  fallbackFont?: { sans: string; serif: string; system: string };
}

/** Fence markdown dài hơn mọi dãy ~ trong nội dung — chú thích được chép nguyên văn, không bị cắt / vỡ khối */
const fenceFor = (s: string) => '~'.repeat(Math.max(3, ...[...s.matchAll(/~+/g)].map((m) => m[0].length + 1)));

const MOTION_EFFECT: Record<1 | 2 | 3, string> = {
  1: 'chỉ hiện dần khi cuộn (`data-reveal="fade"|"up"`), đếm số, header thu gọn, hover; KHÔNG nạp `atmos.js`, không parallax / mây / hạt / cảnh ghim.',
  2: 'thêm `data-split`, `data-reveal="clip"`, `data-reveal-stagger`, `data-parallax` ≤ 0.2, marquee, kéo ngang; atmos.js: `data-float`, `data-gradient-shift`, `data-clouds` / `data-particles` ở **một** section trên mỗi trang.',
  3: 'thêm `data-sky`, `data-layers` + `data-depth`, cảnh ghim `data-scene` + `data-step`, `data-scrub`; `data-particles` tối đa 3 section không liền nhau; con trỏ / tilt / magnetic chỉ khi preset cho phép. Trang con nhẹ hơn trang chủ.',
};

/**
 * concept.md — brief website cho AI, sinh từ cấu hình màn hình Quick Create (một nguồn duy nhất).
 * Mọi lựa chọn đều có mặt ở đây, kể cả chú thích dài (nguyên văn) — AI đọc file này thay vì tự đoán.
 */
export function renderConcept(request: string, c: Concept | undefined, checks: BriefChecks = {}): string {
  const concept = ConceptSchema.parse(c ?? {});
  const { preset, how } = resolvePreset(request, concept);
  const motion = concept.motion === 'auto' ? preset?.motion : (Number(concept.motion) as 1 | 2 | 3);
  const lang = languageOf(concept.language);
  const colors = concept.colors || concept.mood;
  const legacy = !concept.topic && request.trim();

  const L = [
    `# Brief website — ${concept.brand || '(chưa có tên thương hiệu)'}`,
    '',
    '> Tool sinh file này từ màn hình cấu hình Quick Create. **Đọc hết file, kể cả mục Chú thích bổ sung ở cuối.**',
    '> Thứ tự ưu tiên khi mâu thuẫn: ràng buộc cụ thể, rõ ràng của BA (chú thích, mô tả section, màu, font) → các lựa chọn trong file này → preset → guide → taste skill.',
    '> Mâu thuẫn không tự giải quyết được → chọn phương án an toàn, khả thi và ghi lại trong `_build/sitemap.json` (`adjustments`).',
    '',
    '## 1. Thông tin chính',
    '',
  ];
  if (legacy) L.push('- Mô tả của BA (dự án cũ):', '', request.trim(), '');
  else {
    L.push(`- **Chủ đề:** ${concept.topic}`);
    if (request.trim() && request.trim() !== concept.topic) L.push(`- **Mô tả trước đây:** ${request.trim()}`);
  }
  L.push(
    `- **Tên thương hiệu / dự án:** ${concept.brand ? `**${concept.brand}**` : '(trống — tự đặt tên hợp chủ đề)'} — dùng **đúng nguyên văn** ở \`<title>\`, logo chữ trên header, footer, dòng ©, meta description; website cá nhân thì đây là tên người / tên dự án.`,
    `- **Mục đích:** ${concept.purpose || 'BA không ghi — tự suy ra từ chủ đề và các mục dưới, ghi suy luận vào `_build/sitemap.json` (`purposeInferred`).'}`,
    '- Mục đích quyết định sitemap, nội dung, điều hướng và chức năng. Website chỉ giới thiệu thì **không** thêm giỏ hàng / thanh toán / đăng nhập.',
    '',
    '## 2. Ngôn ngữ',
    '',
    `- Ngôn ngữ chính: **${lang.label}** → \`<html lang="${lang.htmlLang}">\` trên mọi trang.`,
    `- Mọi chữ hiển thị viết bằng ${lang.name}: menu, tiêu đề, đoạn văn, nút, nhãn & placeholder form, thông báo, footer, \`<title>\`, meta description, \`alt\` của ảnh. Không trộn ngôn ngữ (trừ tên riêng / thương hiệu). Không tạo bộ chuyển ngôn ngữ.`,
    '- `ui.js` tự đổi thông báo lỗi form theo `<html lang>` — không viết lại.',
  );
  if (concept.language === 'zh' || concept.language === 'ja')
    L.push('- Chữ CJK: không dùng `tracking` rộng / chữ hoa cho tiêu đề CJK, `leading` thân bài 1.8, `word-break: auto-phrase` hoặc `break-all` hợp lý; cỡ chữ thân ≥ 16px.');
  L.push('');

  L.push('## 3. Phong cách & chuyển động', '');
  if (how === 'chosen') L.push(`- Preset: **${preset!.name}** — BA chọn. Áp dụng thật vào bố cục, chữ, màu, ảnh, khoảng trắng, thành phần giao diện và hiệu ứng.`);
  else if (how === 'detected') L.push(`- Preset: **${preset!.name}** — tool nhận diện từ mô tả (BA để "Tự động"). Mô tả khác hẳn preset thì theo mô tả.`);
  else L.push('- Preset: **chưa chọn** — chọn MỘT preset trong danh mục cuối file hợp nhất với chủ đề / cảm xúc, ghi id vào `_build/sitemap.json` (`preset`).');
  if (motion)
    L.push(
      `- Mức chuyển động: **${MOTION_LABEL[motion]}**${concept.motion === 'auto' ? ' (mặc định của preset)' : ' — BA chọn'}. Được dùng: ${MOTION_EFFECT[motion]}`,
      `- Mức này phải thể hiện trong code (tool đếm thuộc tính \`data-*\` sau khi dựng). \`motion.js\` / \`atmos.js\` / \`ui.js\` đã tôn trọng \`prefers-reduced-motion\`; mọi \`@keyframes\` / \`animation\` tự viết trong \`site.css\` phải có \`@media (prefers-reduced-motion: reduce)\` tắt đi.`,
    );
  else L.push('- Mức chuyển động: theo preset đã chọn (motion-guide mục 1).');
  L.push('');

  L.push('## 4. Màu sắc', '');
  if (colors)
    L.push(
      `- BA yêu cầu: «${colors}» — **ưu tiên tuyệt đối**, thay bảng màu preset. Mã HEX dùng đúng mã; tên / mô tả màu → chọn giá trị HEX cụ thể sát nghĩa nhất.`,
      '- Tự dựng thêm màu bổ trợ (nền, chữ, viền, trạng thái) hài hòa. Chữ trên nền đạt tương phản WCAG AA (≥ 4.5:1 thân bài, ≥ 3:1 chữ lớn).',
    );
  else L.push('- BA để trống → dùng bảng màu preset (hoặc tự chọn theo chủ đề, thương hiệu, đối tượng nếu không có preset). Tương phản đạt WCAG AA.');
  L.push('- Khai báo **một lần** trong `assets/js/tw-config.js` (tên màu theo vai trò) và biến CSS trong `assets/css/site.css` `:root` — mọi trang dùng chung, không mã màu rời rạc.', '');

  L.push('## 5. Font chữ', '');
  const fb = checks.fallbackFont;
  const fontLine = (f: NonNullable<BriefChecks['fonts']>[number]) => {
    if (f.onGoogleFonts === false) return `\`${f.family}\`: **không có trên Google Fonts**${f.note ? ` (${f.note})` : ''}`;
    if (f.supports === true) return `\`${f.family}\`: có trên Google Fonts, **có đủ ký tự ${lang.name}** ✓`;
    if (f.supports === false) return `\`${f.family}\`: có trên Google Fonts nhưng **THIẾU ký tự ${lang.name}** ✗`;
    return `\`${f.family}\`: chưa xác định được độ phủ ký tự${f.note ? ` (${f.note})` : ''}`;
  };
  if (concept.font) {
    L.push(`- BA yêu cầu font: «${concept.font}» — dùng đúng font này, **không tự đổi** nếu font dùng được.`);
    for (const f of checks.fonts ?? []) L.push(`  - Tool kiểm tra: ${fontLine(f)}`);
    L.push(
      `  - Thiếu ký tự / không có trên Google Fonts → vẫn đặt font BA yêu cầu đầu tiên trong \`font-family\`, ngay sau là fallback \`"${fb?.sans ?? 'system-ui'}"\` (nạp từ Google Fonts) rồi \`${fb?.system ?? 'sans-serif'}\` — ký tự thiếu sẽ hiển thị bằng fallback. Ghi quyết định vào \`adjustments\`.`,
    );
  } else {
    L.push(`- BA để trống → dùng font của preset${preset ? ` (display \`${preset.fonts.display}\`, body \`${preset.fonts.body}\`)` : ''} hoặc tự chọn hợp phong cách & ngôn ngữ.`);
    for (const f of checks.fonts ?? []) L.push(`  - Tool kiểm tra font preset: ${fontLine(f)}`);
    L.push(`  - Font nào thiếu ký tự ${lang.name} → thay bằng font cùng tinh thần có đủ ký tự (ví dụ \`${fb?.sans}\` / \`${fb?.serif}\`), hoặc chỉ giữ cho chữ Latin trang trí và thêm fallback.`);
  }
  L.push(`- Mọi \`font-family\` kết thúc bằng fallback hệ thống: \`${fb?.system ?? 'system-ui, sans-serif'}\`. Google Fonts nạp bằng \`<link>\` với \`display=swap\`.`, '');

  L.push('## 6. Section BA chọn', '');
  if (concept.sections.length) {
    L.push(
      '| # | Section (id danh mục) | Gợi ý vị trí | Mô tả của BA (nguyên văn) |',
      '|---|---|---|---|',
      ...concept.sections.map((s, i) => {
        const meta = sectionOf(s.id);
        const note = s.description ? s.description.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>') : '_(trống — AI tự xây dựng nội dung, bố cục, ảnh)_';
        return `| ${i + 1} | ${meta?.label ?? s.id} (\`${s.id}\`) | ${meta?.place ?? ''} | ${note} |`;
      }),
      '',
      '- Đây là định hướng **ưu tiên**: phân bổ vào đúng trang (không dồn hết vào trang chủ); section nào cần trang riêng / trang chi tiết thì tạo route riêng.',
      '- Section có mô tả của BA → làm đúng mô tả đó. Section không hợp mục đích website → điều chỉnh / bỏ và ghi lý do vào `adjustments`.',
      '- Chỉ thêm section BA không chọn khi cần cho trang trọn vẹn (header, footer, CTA cuối trang…); không tạo nội dung trùng lặp giữa các trang.',
    );
  } else L.push('- BA không chọn section → tự đề xuất sitemap và section hợp chủ đề, mục đích, phong cách.');
  L.push('');

  L.push('## 7. Công cụ ảnh (tool kiểm tra trước khi giao việc)', '');
  const img = checks.images;
  if (!img) L.push('- Chưa kiểm tra — dùng `search_images` / `use_image` bình thường.');
  else if (img.ok) {
    L.push(`- Sẵn sàng. Nguồn đang dùng: **${img.provider}**.`);
    if (img.skipped?.length) L.push(`- Nguồn bị bỏ qua (tool tự chuyển nguồn): ${img.skipped.map((s) => `${s.provider} (${s.kind})`).join(', ')}.`);
    L.push('- Tìm ảnh **theo từng trang / section** (image-guide), không dùng một nhóm ảnh chung cho cả website.');
  } else
    L.push(
      `- **KHÔNG khả dụng**: ${img.error ?? 'lỗi không rõ'}.`,
      '- Gọi `search_images` **tối đa 1 lần** để xác nhận; vẫn lỗi thì không gọi nữa. Dựng các vị trí cần ảnh bằng bố cục không ảnh (khối màu, chữ lớn, số liệu, hoa văn trừu tượng) — không link ảnh ngoài, không ảnh giả. Ghi từng vị trí vào `images` của sitemap.json với `"status": "none"` và từ khóa dự kiến.',
    );
  L.push('');

  if (concept.reference) L.push('## Tham khảo (dự án cũ)', '', concept.reference, '');

  L.push('## 8. Chú thích bổ sung của BA', '');
  if (concept.notes.trim()) {
    const notes = concept.notes.replace(/\r\n/g, '\n');
    const fence = fenceFor(notes);
    L.push(
      `> Nguyên văn, ${notes.length.toLocaleString('vi-VN')} ký tự, ${notes.split('\n').length} dòng. Đọc **đến dòng cuối** — yêu cầu ở cuối có giá trị như ở đầu. Kết hợp với các mục trên, không xử lý như prompt tách rời.`,
      '',
      `${fence}text`,
      notes,
      fence,
    );
  } else L.push('- (trống)');
  L.push('');

  if (preset) L.push('## Preset', '', ...renderPreset(preset));
  else {
    L.push('## Danh mục preset', '');
    for (const p of PRESETS) L.push(...renderPreset(p));
  }
  return L.join('\n');
}
