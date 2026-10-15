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

// ---------- Concept do người dùng chọn (mọi trường đều không bắt buộc) ----------

export const SECTION_KINDS = ['hero', 'story', 'features', 'gallery', 'editorial', 'pricing', 'testimonials', 'faq', 'cta', 'contact'] as const;

export const ConceptSchema = z.object({
  /** 'auto' = tự đoán theo mô tả */
  preset: z.string().max(40).default('auto'),
  motion: z.enum(['auto', '1', '2', '3']).default('auto'),
  sections: z.array(z.enum(SECTION_KINDS)).max(12).default([]),
  /** Màu / mood / cảm xúc */
  mood: z.string().trim().max(500).default(''),
  /** Link tham khảo, ghi chú về ảnh / tài liệu */
  reference: z.string().trim().max(1000).default(''),
});
export type Concept = z.infer<typeof ConceptSchema>;

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

/**
 * concept.md — bản tóm tắt định hướng thiết kế cho AI: mô tả của BA + preset + mức chuyển động + section.
 * Preset "auto" mà không nhận diện được → ghi danh mục rút gọn để AI tự chọn một preset.
 */
export function renderConcept(request: string, c: Concept | undefined): string {
  const concept = ConceptSchema.parse(c ?? {});
  const chosen = concept.preset !== 'auto' ? presetById(concept.preset) : undefined;
  const detected = chosen ? undefined : detectPreset(`${request} ${concept.mood}`);
  const preset = chosen ?? detected;
  const motion = concept.motion === 'auto' ? preset?.motion : (Number(concept.motion) as 1 | 2 | 3);

  const L = ['# Concept landing page', '', '## Mô tả của BA', '', request.trim(), ''];
  L.push('## Định hướng đã chốt', '');
  if (chosen) L.push(`- Preset: **${chosen.name}** — BA chọn.`);
  else if (detected) L.push(`- Preset: **${detected.name}** — tool nhận diện từ mô tả (BA để "Tự động"). Mô tả khác hẳn preset thì theo mô tả.`);
  else L.push('- Preset: **chưa chọn** — chọn MỘT preset trong danh mục dưới hợp nhất với ngành / cảm xúc, ghi tên vào README.md.');
  L.push(`- Mức chuyển động: ${motion ? `**${MOTION_LABEL[motion]}**${concept.motion === 'auto' ? ' (mặc định của preset)' : ' — BA chọn'}` : 'theo preset đã chọn'}. Bảng thuộc tính theo mức ở motion-guide mục 1.`);
  if (concept.sections.length) L.push(`- Section BA muốn (theo thứ tự, thêm header + footer): ${concept.sections.join(', ')}. Chọn biến thể trong sections.md hợp preset.`);
  else L.push('- Section: theo "Section gợi ý" của preset, thêm / bớt cho hợp ngành (6–9 section).');
  if (concept.mood) L.push(`- Màu / mood BA mô tả: ${concept.mood} — ưu tiên hơn bảng màu preset khi khác nhau.`);
  if (concept.reference) L.push(`- Tham khảo của BA: ${concept.reference} (không tải được link thì chỉ dùng phần mô tả).`);
  L.push('');

  if (preset) L.push(...renderPreset(preset));
  else {
    L.push('## Danh mục preset', '');
    for (const p of PRESETS) L.push(...renderPreset(p));
  }
  return L.join('\n');
}
