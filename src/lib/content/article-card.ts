export const ARTICLE_CARD_EXCERPT_MIN = 110;
export const ARTICLE_CARD_EXCERPT_MAX = 128;

const DISPLAY_TITLE_OVERRIDES: Record<string, string> = {
  'khung-5c-giao-tiep-voi-ai': 'Khung 5C giao tiếp với AI: Từ câu lệnh đến tư duy phản biện',
  'sprint-based-pbl-6-tuan-lich-trinh-milestones-rubrics-chi-tiet-6ppuv': 'PBL theo Sprint trong 6 tuần: Lịch trình, mốc tiến độ và bảng tiêu chí',
  'template-rubric-stem-map-bloom-ngss-iste-csta-csv-json-tai-ve-55s5u': 'Mẫu bảng tiêu chí STEM: Đối chiếu Bloom → NGSS → ISTE → CSTA',
};

const EXCERPT_OVERRIDES: Record<string, string> = {
  'khung-5c-giao-tiep-voi-ai': 'Khung 5C giúp bạn giao tiếp với AI có cấu trúc, kiểm chứng đầu ra và giữ quyền chủ động trong mọi quyết định.',
  'giao-tiep-voi-ai-dung-ai-ma-khong-phu-thuoc-vao-ai': 'Một cách thực hành để giao việc, chất vấn và kiểm chứng đầu ra AI mà không đánh mất tư duy độc lập của chính bạn.',
  'sprint-based-pbl-6-tuan-lich-trinh-milestones-rubrics-chi-tiet-6ppuv': 'Lộ trình PBL sáu tuần với từng mốc Sprint, hoạt động lớp học và bảng tiêu chí có thể áp dụng ngay trong dự án STEM.',
  'template-rubric-stem-map-bloom-ngss-iste-csta-csv-json-tai-ve-55s5u': 'Mẫu bảng tiêu chí STEM đối chiếu Bloom, NGSS, ISTE và CSTA, kèm dữ liệu CSV/JSON để giáo viên triển khai thuận tiện.',
};

const LEGACY_READING_MINUTES: Record<string, number> = {
  'khung-5c-giao-tiep-voi-ai': 28,
  'giao-tiep-voi-ai-dung-ai-ma-khong-phu-thuoc-vao-ai': 17,
  'nang-luc-ai-cho-giao-vien-tu-chuan-den-hanh-dong': 19,
  'ai-trong-giao-duc-pho-thong-trien-khai-tu-2026-2027': 19,
  'cong-nghe-giao-duc-tuong-lai-7-xu-huong-lon-den-2035': 21,
  'giao-duc-trong-thoi-dai-ai-dieu-gi-phai-thay-doi': 16,
  'lich-su-va-tuong-lai-ai-70-nam-tu-dartmouth-den-agent': 23,
  'sprint-based-pbl-6-tuan-lich-trinh-milestones-rubrics-chi-tiet-6ppuv': 7,
  'template-rubric-stem-map-bloom-ngss-iste-csta-csv-json-tai-ve-55s5u': 7,
  '5e-hay-pbl-cach-thiet-ke-bai-hoc-stem-khong-bien-thanh-lam-san-pham-cho-vui-wgqe8': 6,
  'he-thong-automation-giao-trinh-giao-an-nen-hay-khong-va-cach-thiet-ke-thuc-te-cho-day-hoc-bao-cao-aqt2f': 7,
  'ai-tieu-hoc-lo-trinh-trien-khai-chuong-trinh-chinh-khoa-hieu-qua-g7p7l': 5,
  'chien-thuat-dot-pha-bang-du-an-sang-tao-wro-innovation-project-3n6l3': 7,
  'model-context-protocol-tu-dong-hoa-van-hanh-blog-hub-bang-mcp-mqvji': 7,
  'second-brain-stem-vai-tro-khong-the-thay-the-cua-con-nguoi-trong-kiem-chung-tri-thuc-kii9v': 4,
  'co-nen-day-ai-cho-hoc-sinh-tieu-hoc-goc-nhin-thuc-chien-n4d0d': 6,
  'phat-trien-tu-duy-may-tinh-cho-hoc-sinh-tieu-hoc-bang-scratch-vtv23': 6,
  'notebooklm-xay-dung-bo-nao-thu-hai-cho-giao-duc-stem-po4ow': 5,
  'toi-da-bien-dragonmind-thanh-bai-rac-tri-thuc-nhu-the-nao-bai-hoc-sau-10-tuan-xay-second-brain-ikkk9': 4,
  'hanh-trinh-xay-wikix-second-brain-stem-steam-ca-nhan-hoa-voi-obsidian-antigravity-ngay-02-khoi-dong-he-thong-u9zzx': 3,
  'giai-ma-cuoc-thi-world-greenmech-2026-r4m-vuon-thuc-vat-thong-minh-ai-gc0l2': 9,
  'robot-huong-dan-vien-bao-tang-thong-minh-giao-thoa-giua-tri-tue-nhan-tao-va-di-san-van-hoa-ai-btsyf': 5,
  'vibe-coding-ai-3jl7s': 7,
  'robotics-2026-industrial-to-personal': 3,
  'future-of-generative-ai-creative-industries': 3,
  'cyber-security-protecting-digital-dna': 3,
  'nextjs-16-react-19-new-era': 3,
  'unlocking-3d-worlds-sketchfab-web': 3,
  'mastering-logic-with-scratch-first-game': 3,
};

export function getArticleCardTitle(slug: string, title: string) {
  return DISPLAY_TITLE_OVERRIDES[slug] || title.trim();
}

function cleanExcerpt(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

export function getArticleCardExcerpt(slug: string, excerpt: string) {
  const override = EXCERPT_OVERRIDES[slug];
  if (override) return override;

  const cleaned = cleanExcerpt(excerpt);
  if (cleaned.length <= ARTICLE_CARD_EXCERPT_MAX) return cleaned;

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  let result = '';
  for (const sentence of sentences) {
    const candidate = `${result} ${sentence.trim()}`.trim();
    if (candidate.length > ARTICLE_CARD_EXCERPT_MAX) break;
    result = candidate;
  }

  if (result.length >= ARTICLE_CARD_EXCERPT_MIN) return result;

  const cleanBoundary = Math.max(
    cleaned.lastIndexOf(';', ARTICLE_CARD_EXCERPT_MAX),
    cleaned.lastIndexOf(',', ARTICLE_CARD_EXCERPT_MAX),
    cleaned.lastIndexOf('—', ARTICLE_CARD_EXCERPT_MAX),
  );
  if (cleanBoundary >= ARTICLE_CARD_EXCERPT_MIN) {
    return `${cleaned.slice(0, cleanBoundary).trim()}.`;
  }

  const words = cleaned.slice(0, ARTICLE_CARD_EXCERPT_MAX + 1).split(' ');
  words.pop();
  return `${words.join(' ').replace(/[,:;—-]+$/, '').trim()}.`;
}

export function getArticleCardKeywords(tags: string[] | undefined, label: (value: string) => string) {
  if (!tags?.length) return [];

  return Array.from(new Set(tags.map((tag) => label(tag).replace(/^#+/, '').trim()).filter(Boolean))).slice(0, 2);
}

export function formatCardDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function calculateReadingMinutes(value: string) {
  const plainText = cleanExcerpt(value);
  return Math.max(3, Math.ceil(plainText.length / 1200));
}

export function getCardReadingMinutes(slug: string, storedValue: unknown) {
  const parsed = typeof storedValue === 'number' ? storedValue : Number(storedValue);
  if (Number.isFinite(parsed) && parsed >= 1) return Math.round(parsed);
  return LEGACY_READING_MINUTES[slug] || 3;
}
