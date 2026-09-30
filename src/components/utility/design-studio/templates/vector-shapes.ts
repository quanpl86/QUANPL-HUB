import { VectorShapeItem } from '@/types/design-studio';

export const QUICK_VECTOR_SHAPES: VectorShapeItem[] = [
  // 1. SƠ ĐỒ & QUY TRÌNH (FLOWCHART & DIAGRAMS)
  {
    id: 'fc-start-end',
    name: 'Khối Bắt đầu / Kết thúc',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="160" height="80"><rect x="10" y="15" width="180" height="70" rx="35" ry="35" fill="#10b981" stroke="#ffffff" stroke-width="4"/><text x="100" y="58" font-family="Inter, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">START / END</text></svg>`,
  },
  {
    id: 'fc-process',
    name: 'Khối Xử Lý (Process)',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="160" height="80"><rect x="10" y="15" width="180" height="70" rx="6" ry="6" fill="#3b82f6" stroke="#ffffff" stroke-width="4"/><text x="100" y="58" font-family="Inter, sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">XỬ LÝ</text></svg>`,
  },
  {
    id: 'fc-decision',
    name: 'Khối Điều Kiện (Decision)',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="160" height="96"><polygon points="100,10 190,60 100,110 10,60" fill="#f59e0b" stroke="#ffffff" stroke-width="4"/><text x="100" y="65" font-family="Inter, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">ĐIỀU KIỆN?</text></svg>`,
  },
  {
    id: 'fc-data',
    name: 'Khối Nhập / Xuất (I/O)',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="160" height="80"><polygon points="40,15 190,15 160,85 10,85" fill="#8b5cf6" stroke="#ffffff" stroke-width="4"/><text x="100" y="58" font-family="Inter, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">DỮ LIỆU I/O</text></svg>`,
  },
  {
    id: 'fc-database',
    name: 'Cơ Sở Dữ Liệu (Database)',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="120" height="120" fill="none" stroke="#06b6d4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="80" cy="40" rx="60" ry="20" fill="#0891b2"/><path d="M20 40v80c0 11 27 20 60 20s60-9 60-20V40" fill="#0e7490"/><path d="M20 80c0 11 27 20 60 20s60-9 60-20"/><path d="M20 120c0 11 27 20 60 20s60-9 60-20"/></svg>`,
  },
  {
    id: 'fc-document',
    name: 'Tài Liệu / Báo Cáo',
    category: 'flowchart',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="140" height="105"><path d="M15 15 H145 V85 C115 70 85 105 45 90 C30 85 20 90 15 88 Z" fill="#ec4899" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/><text x="80" y="58" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">REPORT</text></svg>`,
  },

  // 2. STEM, KHOA HỌC & CÔNG NGHỆ (STEM & TECH VECTORS)
  {
    id: 'stem-gear',
    name: 'Bánh Răng Kỹ Thuật',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="140" height="140"><path d="M90 15 h20 v20 h-20 z M145 35 l14 14 l-14 14 l-14-14 z M165 90 h20 v20 h-20 z M145 145 l14 14 l-14 14 l-14-14 z M90 165 h20 v20 h-20 z M35 145 l14 14 l-14 14 l-14-14 z M15 90 h20 v20 h-20 z M35 35 l14 14 l-14 14 l-14-14 z" fill="#10b981"/><circle cx="100" cy="100" r="65" fill="#059669" stroke="#ffffff" stroke-width="6"/><circle cx="100" cy="100" r="28" fill="#0f172a" stroke="#ffffff" stroke-width="4"/></svg>`,
  },
  {
    id: 'stem-molecule',
    name: 'Cấu Trúc Phân Tử (Benzene)',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="140" height="140" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="#0284c7" fill-opacity="0.25"/><circle cx="100" cy="20" r="14" fill="#38bdf8"/><circle cx="170" cy="60" r="14" fill="#38bdf8"/><circle cx="170" cy="140" r="14" fill="#38bdf8"/><circle cx="100" cy="180" r="14" fill="#38bdf8"/><circle cx="30" cy="140" r="14" fill="#38bdf8"/><circle cx="30" cy="60" r="14" fill="#38bdf8"/><circle cx="100" cy="100" r="30" stroke="#f59e0b" stroke-width="5" stroke-dasharray="8 6"/></svg>`,
  },
  {
    id: 'stem-flask',
    name: 'Bình Hóa Chất Thí Nghiệm',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="120" height="150" fill="none"><path d="M65 20 h30 v40 l45 90 a15 15 0 0 1 -13 22 h-94 a15 15 0 0 1 -13 -22 l45 -90 z" fill="#8b5cf6" fill-opacity="0.3" stroke="#a855f7" stroke-width="6" stroke-linejoin="round"/><path d="M45 125 q35 -20 70 0 l15 30 a10 10 0 0 1 -9 15 h-82 a10 10 0 0 1 -9 -15 z" fill="#a855f7"/><circle cx="70" cy="145" r="5" fill="#ffffff"/><circle cx="95" cy="135" r="7" fill="#ffffff"/><circle cx="85" cy="155" r="4" fill="#ffffff"/></svg>`,
  },
  {
    id: 'stem-chip',
    name: 'Vi Mạch Điện Tử AI',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="130" height="130" fill="none" stroke="#10b981" stroke-width="4"><rect x="40" y="40" width="100" height="100" rx="12" fill="#064e3b" stroke="#34d399" stroke-width="5"/><circle cx="90" cy="90" r="22" fill="#10b981"/><path d="M90 10 v30 M65 10 v30 M115 10 v30 M90 140 v30 M65 140 v30 M115 140 v30 M10 90 h30 M10 65 h30 M10 115 h30 M140 90 h30 M140 65 h30 M140 115 h30" stroke="#34d399" stroke-width="5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'stem-lightbulb',
    name: 'Bóng Đèn Sáng Tạo STEM',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="120" height="150" fill="none"><path d="M40 70 a45 45 0 1 1 80 0 c0 20 -15 35 -15 50 h-50 c0 -15 -15 -30 -15 -50 z" fill="#facc15" stroke="#eab308" stroke-width="6"/><rect x="60" y="130" width="40" height="25" rx="4" fill="#64748b" stroke="#475569" stroke-width="3"/><rect x="68" y="160" width="24" height="10" rx="5" fill="#334155"/><path d="M80 10 v-10 M140 30 l15 -15 M155 70 h20 M140 110 l15 15 M20 30 l-15 -15 M5 70 h-20 M20 110 l-15 15" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'stem-code',
    name: 'Thẻ Lập Trình (Code Bracket)',
    category: 'stem',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="150" height="90"><rect x="10" y="10" width="180" height="100" rx="14" fill="#090d16" stroke="#38bdf8" stroke-width="4"/><circle cx="35" cy="30" r="5" fill="#ef4444"/><circle cx="50" cy="30" r="5" fill="#f59e0b"/><circle cx="65" cy="30" r="5" fill="#10b981"/><path d="M60 70 l-20 15 l20 15 M140 70 l20 15 l-20 15 M110 65 l-20 35" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
  },

  // 3. MŨI TÊN & ĐIỀU HƯỚNG VẼ NHANH (FAST ARROWS)
  {
    id: 'arrow-curve-right',
    name: 'Mũi Tên Uốn Cong Phải',
    category: 'arrows',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 140" width="130" height="114" fill="none"><path d="M30 110 C 30 50, 60 30, 110 30" stroke="#10b981" stroke-width="12" stroke-linecap="round"/><polygon points="105,10 145,30 105,50" fill="#10b981"/></svg>`,
  },
  {
    id: 'arrow-s-curve',
    name: 'Mũi Tên Uốn Lượn S',
    category: 'arrows',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="160" height="96" fill="none"><path d="M20 90 C 70 90, 70 30, 130 30 L 160 30" stroke="#f59e0b" stroke-width="10" stroke-linecap="round"/><polygon points="155,15 190,30 155,45" fill="#f59e0b"/></svg>`,
  },
  {
    id: 'arrow-loop',
    name: 'Mũi Tên Vòng Tuần Hoàn',
    category: 'arrows',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="120" height="120" fill="none"><path d="M130 80 A 50 50 0 1 1 80 30 L 90 30" stroke="#06b6d4" stroke-width="10" stroke-linecap="round"/><polygon points="80,10 115,30 80,50" fill="#06b6d4"/></svg>`,
  },
  {
    id: 'arrow-chevron-step',
    name: 'Khối Bước Tiến (Chevron)',
    category: 'arrows',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="160" height="80"><polygon points="20,15 150,15 185,50 150,85 20,85 55,50" fill="#6366f1" stroke="#ffffff" stroke-width="4"/><text x="105" y="58" font-family="Inter, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC TIẾP</text></svg>`,
  },
  {
    id: 'arrow-split-fork',
    name: 'Mũi Tên Phân Nhánh (Fork)',
    category: 'arrows',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" width="140" height="108" fill="none"><path d="M20 70 H 80 C 100 70, 110 30, 140 30 M 80 70 C 100 70, 110 110, 140 110" stroke="#ec4899" stroke-width="10" stroke-linecap="round"/><polygon points="135,15 165,30 135,45" fill="#ec4899"/><polygon points="135,95 165,110 135,125" fill="#ec4899"/></svg>`,
  },

  // 4. HUY HIỆU, KHUNG VIỀN & NHÃN DÁN (BADGES & FRAMES)
  {
    id: 'badge-seal-12',
    name: 'Con Dấu Sao 12 Cánh',
    category: 'badges',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="120" height="120"><path d="M80 10 L95 30 L120 20 L125 45 L150 50 L140 75 L155 95 L135 110 L140 135 L115 135 L105 155 L80 145 L55 155 L45 135 L20 135 L25 110 L5 95 L20 75 L10 50 L35 45 L40 20 L65 30 Z" fill="#f59e0b" stroke="#ffffff" stroke-width="3"/><circle cx="80" cy="80" r="45" fill="#d97706"/><circle cx="80" cy="80" r="38" fill="none" stroke="#fef3c7" stroke-width="2" stroke-dasharray="4 3"/><text x="80" y="85" font-family="Inter, sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">TOP 1</text></svg>`,
  },
  {
    id: 'badge-banner-ribbon',
    name: 'Ruy Băng Vinh Danh (Banner)',
    category: 'badges',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" width="180" height="65"><polygon points="10,25 35,50 10,75 40,75 50,55 50,25" fill="#b91c1c"/><polygon points="210,25 185,50 210,75 180,75 170,55 170,25" fill="#b91c1c"/><rect x="35" y="10" width="150" height="48" rx="6" fill="#ef4444" stroke="#ffffff" stroke-width="3"/><text x="110" y="40" font-family="Inter, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">XUẤT SẮC</text></svg>`,
  },
  {
    id: 'badge-verified-tag',
    name: 'Nhãn Chứng Nhận (Verified Tag)',
    category: 'badges',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="120" height="120"><polygon points="80,10 100,25 125,25 135,50 155,65 150,90 160,115 140,130 135,155 110,150 90,160 70,150 45,155 40,130 20,115 30,90 25,65 45,50 55,25 80,25" fill="#10b981"/><path d="M55 82 l20 20 l35 -40" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'badge-cyber-target',
    name: 'Mục Tiêu Công Nghệ (Tech Target)',
    category: 'badges',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="120" height="120" fill="none" stroke="#06b6d4" stroke-width="4"><circle cx="80" cy="80" r="65" stroke-dasharray="25 15"/><circle cx="80" cy="80" r="45" stroke="#3b82f6" stroke-width="5"/><circle cx="80" cy="80" r="15" fill="#06b6d4"/><path d="M80 5 v30 M80 125 v30 M5 80 h30 M125 80 h30" stroke="#38bdf8" stroke-width="5" stroke-linecap="round"/></svg>`,
  },
];
