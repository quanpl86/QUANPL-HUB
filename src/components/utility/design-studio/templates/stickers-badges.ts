import { StickerItem, DesignLayout } from '@/types/design-studio';

export const LUCIDE_ICONS: StickerItem[] = [
  {
    id: 'trophy',
    name: 'Cúp Vô Địch',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  },
  {
    id: 'medal',
    name: 'Huy Chương',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><circle cx="12" cy="17" r="5"/></svg>`,
  },
  {
    id: 'award',
    name: 'Bằng Khen',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  },
  {
    id: 'shield-check',
    name: 'Khiên Bảo Hộ',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    id: 'star',
    name: 'Ngôi Sao Sáng',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="#facc15" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    id: 'rocket',
    name: 'Tên Lửa Khởi Nghiệp',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  },
  {
    id: 'bot',
    name: 'Robot STEM',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
  },
  {
    id: 'cpu',
    name: 'Vi Xử Lý Chip',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  },
  {
    id: 'atom',
    name: 'Nguyên Tử Khoa Học',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 8.3c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>`,
  },
  {
    id: 'zap',
    name: 'Tia Sét Năng Lượng',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="#f59e0b" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    id: 'sparkles',
    name: 'Phát Sáng AI',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="#ec4899" stroke="#db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  },
  {
    id: 'lightbulb',
    name: 'Ý Tưởng Sáng Tạo',
    category: 'lucide',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  },
];

export const STEM_BADGES: StickerItem[] = [
  {
    id: 'badge-gold-champion',
    name: 'Huy Hiệu Quán Quân',
    category: 'badge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a" />
          <stop offset="50%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#a16207" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#goldGrad)" stroke="#78350f" stroke-width="3"/>
      <circle cx="60" cy="60" r="46" fill="#18181b" stroke="#fef08a" stroke-width="2"/>
      <polygon points="60,28 69,47 89,50 74,65 78,85 60,75 42,85 46,65 31,50 51,47" fill="url(#goldGrad)"/>
      <text x="60" y="102" font-family="Inter, sans-serif" font-size="9" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="1">CHAMPION</text>
    </svg>`,
  },
  {
    id: 'badge-stem-innovator',
    name: 'Huy Hiệu Đổi Mới STEM',
    category: 'badge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
      </defs>
      <polygon points="60,8 105,34 105,86 60,112 15,86 15,34" fill="#0f172a" stroke="url(#cyanGrad)" stroke-width="4"/>
      <polygon points="60,18 97,40 97,80 60,102 23,80 23,40" fill="#0369a122" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="60" y="56" font-family="Inter, sans-serif" font-size="14" font-weight="900" fill="#38bdf8" text-anchor="middle">STEM</text>
      <text x="60" y="74" font-family="Inter, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">INNOVATOR</text>
      <text x="60" y="90" font-family="Inter, sans-serif" font-size="8" fill="#94a3b8" text-anchor="middle">★ 2026 ★</text>
    </svg>`,
  },
  {
    id: 'badge-robotics-top1',
    name: 'Top 1 Robotics',
    category: 'badge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="purpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="100%" stop-color="#7e22ce" />
        </linearGradient>
      </defs>
      <path d="M60 10 L102 24 L102 65 C102 90 60 110 60 110 C60 110 18 90 18 65 L18 24 Z" fill="#18181b" stroke="url(#purpGrad)" stroke-width="4"/>
      <text x="60" y="52" font-family="Inter, sans-serif" font-size="13" font-weight="bold" fill="#c084fc" text-anchor="middle">ROBOTICS</text>
      <text x="60" y="76" font-family="Inter, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">TOP 1</text>
      <text x="60" y="94" font-family="Inter, sans-serif" font-size="8" fill="#e9d5ff" text-anchor="middle">CHALLENGE</text>
    </svg>`,
  },
  {
    id: 'badge-verified-stem',
    name: 'Chứng Nhận Đạt Chuẩn',
    category: 'badge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <circle cx="60" cy="60" r="50" fill="#064e3b" stroke="#10b981" stroke-width="4"/>
      <path d="M40 60 L54 74 L80 44" fill="none" stroke="#34d399" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="60" y="98" font-family="Inter, sans-serif" font-size="9" font-weight="bold" fill="#34d399" text-anchor="middle" letter-spacing="1">VERIFIED STEM</text>
    </svg>`,
  },
  {
    id: 'ribbon-hot',
    name: 'Tag Nổi Bật HOT',
    category: 'ribbon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 46" width="140" height="46">
      <rect x="5" y="5" width="130" height="36" rx="18" fill="#ef4444" stroke="#fca5a5" stroke-width="2"/>
      <text x="70" y="28" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">🔥 HOT STEM</text>
    </svg>`,
  },
  {
    id: 'ribbon-new',
    name: 'Tag Bài Học MỚI',
    category: 'ribbon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 46" width="140" height="46">
      <rect x="5" y="5" width="130" height="36" rx="18" fill="#10b981" stroke="#6ee7b7" stroke-width="2"/>
      <text x="70" y="28" font-family="Inter, sans-serif" font-size="15" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">⚡ MỚI 2026</text>
    </svg>`,
  },
];

export const DESIGN_LAYOUTS: DesignLayout[] = [
  {
    id: 'layout-full-hero',
    name: 'Toàn Màn Hình (Hero Layout)',
    description: '1 khung hình chính toàn cảnh + thẻ thông tin bên dưới',
    icon: '⬛',
    boxes: [
      { left: 40, top: 40, width: 1200, height: 480, label: '📷 Khung ảnh chính (Hero)', fill: '#1e293b', stroke: '#38bdf8' },
      { left: 40, top: 540, width: 1200, height: 140, label: '📝 Thẻ tiêu đề & nội dung bài giảng', fill: '#0f172a', stroke: '#10b981' },
    ],
  },
  {
    id: 'layout-split-vertical',
    name: 'Chia Đôi Dọc (50 / 50)',
    description: '2 cột bằng nhau để so sánh hoặc chia hình và chữ',
    icon: '▥',
    boxes: [
      { left: 40, top: 40, width: 580, height: 640, label: '📷 Ô ảnh / Nội dung Trái', fill: '#1e293b', stroke: '#38bdf8' },
      { left: 660, top: 40, width: 580, height: 640, label: '📷 Ô ảnh / Nội dung Phải', fill: '#1e293b', stroke: '#10b981' },
    ],
  },
  {
    id: 'layout-split-horizontal',
    name: 'Chia Đôi Ngang (2 Hàng)',
    description: '2 hàng trên dưới để đặt hình minh họa và diễn giải',
    icon: '▤',
    boxes: [
      { left: 40, top: 40, width: 1200, height: 300, label: '📷 Khung ảnh trên', fill: '#1e293b', stroke: '#38bdf8' },
      { left: 40, top: 380, width: 1200, height: 300, label: '📷 Khung ảnh dưới', fill: '#1e293b', stroke: '#f59e0b' },
    ],
  },
  {
    id: 'layout-grid-4',
    name: 'Lưới 4 Ô (2x2 Grid)',
    description: '4 ô vuông bằng nhau cho bài học 4 bước hoặc bộ ảnh',
    icon: '⊞',
    boxes: [
      { left: 40, top: 40, width: 580, height: 300, label: '📷 Bước 1 (Hình 1)', fill: '#1e293b', stroke: '#38bdf8' },
      { left: 660, top: 40, width: 580, height: 300, label: '📷 Bước 2 (Hình 2)', fill: '#1e293b', stroke: '#10b981' },
      { left: 40, top: 380, width: 580, height: 300, label: '📷 Bước 3 (Hình 3)', fill: '#1e293b', stroke: '#f59e0b' },
      { left: 660, top: 380, width: 580, height: 300, label: '📷 Bước 4 (Hình 4)', fill: '#1e293b', stroke: '#a855f7' },
    ],
  },
  {
    id: 'layout-feature-left',
    name: '1 Lớn (Trái) + 2 Nhỏ (Phải)',
    description: 'Tập trung vào ảnh nhân vật/robot chính và 2 chi tiết phụ',
    icon: '◧',
    boxes: [
      { left: 40, top: 40, width: 750, height: 640, label: '📷 Ảnh Trọng Tâm Chính (60%)', fill: '#1e293b', stroke: '#38bdf8' },
      { left: 820, top: 40, width: 420, height: 305, label: '📷 Ảnh chi tiết 1', fill: '#0f172a', stroke: '#10b981' },
      { left: 820, top: 375, width: 420, height: 305, label: '📷 Ảnh chi tiết 2', fill: '#0f172a', stroke: '#f59e0b' },
    ],
  },
  {
    id: 'layout-before-after',
    name: 'So Sánh Trước / Sau (Before & After)',
    description: 'Chuyên dụng để so sánh ảnh trước và sau khi tách nền AI',
    icon: '☯',
    boxes: [
      { left: 40, top: 80, width: 580, height: 560, label: '📷 ẢNH GỐC (BEFORE)', fill: '#1e293b', stroke: '#ef4444' },
      { left: 660, top: 80, width: 580, height: 560, label: '✨ ĐÃ TÁCH NỀN (AFTER)', fill: '#064e3b22', stroke: '#10b981' },
    ],
  },
];
