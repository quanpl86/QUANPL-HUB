import { StickerItem, DesignLayout } from '@/types/design-studio';

/**
 * Helper to build standard Lucide SVG markup
 */
export function buildLucideSvg(
  pathMarkup: string,
  color = '#10b981',
  fill = 'none',
  strokeWidth = 2,
  size = 96
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">${pathMarkup}</svg>`;
}

export const LUCIDE_ICONS: StickerItem[] = [
  // --- STEM & ROBOTICS ---
  {
    id: 'bot',
    name: 'Robot STEM',
    category: 'stem',
    tags: ['robot', 'bot', 'ai', 'tri tue nhan tao', 'stem', 'co khi'],
    paths: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    svg: buildLucideSvg('<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>', '#06b6d4'),
  },
  {
    id: 'cpu',
    name: 'Vi Xử Lý Chip',
    category: 'stem',
    tags: ['cpu', 'chip', 'vi xu ly', 'phan cung', 'mach', 'hardware'],
    paths: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    svg: buildLucideSvg('<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>', '#a855f7'),
  },
  {
    id: 'rocket',
    name: 'Tên Lửa Khởi Nghiệp',
    category: 'stem',
    tags: ['rocket', 'ten lua', 'khoi nghiep', 'startup', 'vu tru', 'bay'],
    paths: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    svg: buildLucideSvg('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>', '#f43f5e'),
  },
  {
    id: 'atom',
    name: 'Nguyên Tử Khoa Học',
    category: 'stem',
    tags: ['atom', 'nguyen tu', 'vat ly', 'khoa hoc', 'science', 'nang luong'],
    paths: '<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 8.3c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>',
    svg: buildLucideSvg('<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 8.3c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/>', '#3b82f6'),
  },
  {
    id: 'circuit-board',
    name: 'Bo Mạch Điện Tử',
    category: 'stem',
    tags: ['mach', 'board', 'circuit', 'dien tu', 'stem', 'arduino'],
    paths: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3"/><circle cx="9" cy="9" r="2"/><path d="M7 21v-4a2 2 0 0 1 2-2h4"/><circle cx="15" cy="15" r="2"/>',
    svg: buildLucideSvg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M11 9h4a2 2 0 0 0 2-2V3"/><circle cx="9" cy="9" r="2"/><path d="M7 21v-4a2 2 0 0 1 2-2h4"/><circle cx="15" cy="15" r="2"/>', '#10b981'),
  },
  {
    id: 'code',
    name: 'Lập Trình Code',
    category: 'stem',
    tags: ['code', 'lap trinh', 'developer', 'it', 'software', 'tin hoc'],
    paths: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    svg: buildLucideSvg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', '#38bdf8'),
  },
  {
    id: 'terminal',
    name: 'Dòng Lệnh Terminal',
    category: 'stem',
    tags: ['terminal', 'console', 'lenh', 'command', 'cli', 'it'],
    paths: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
    svg: buildLucideSvg('<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>', '#f59e0b'),
  },
  {
    id: 'binary',
    name: 'Mã Nhị Phân 0-1',
    category: 'stem',
    tags: ['binary', 'nhi phan', 'du lieu', 'data', 'so hoa'],
    paths: '<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>',
    svg: buildLucideSvg('<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>', '#06b6d4'),
  },
  {
    id: 'database',
    name: 'Cơ Sở Dữ Liệu',
    category: 'stem',
    tags: ['database', 'csdl', 'du lieu', 'sql', 'luu tru', 'server'],
    paths: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
    svg: buildLucideSvg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>', '#ec4899'),
  },
  {
    id: 'wrench',
    name: 'Cờ Lê Kỹ Thuật',
    category: 'stem',
    tags: ['wrench', 'co le', 'sua chua', 'ky thuat', 'lap rap', 'co khi'],
    paths: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    svg: buildLucideSvg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', '#f97316'),
  },
  {
    id: 'cog',
    name: 'Bánh Răng Động Cơ',
    category: 'stem',
    tags: ['cog', 'banh rang', 'dong co', 'co khi', 'gear', 'chuyen dong'],
    paths: '<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/>',
    svg: buildLucideSvg('<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/>', '#64748b'),
  },
  {
    id: 'battery-charging',
    name: 'Pin Sạc Năng Lượng',
    category: 'stem',
    tags: ['battery', 'pin', 'sac', 'nang luong', 'power', 'dien'],
    paths: '<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><line x1="22" x2="22" y1="11" y2="13"/><path d="m11 7-3 5h4l-3 5"/>',
    svg: buildLucideSvg('<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><path d="M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><line x1="22" x2="22" y1="11" y2="13"/><path d="m11 7-3 5h4l-3 5"/>', '#10b981'),
  },
  {
    id: 'microscope',
    name: 'Kính Hiển Vi',
    category: 'stem',
    tags: ['microscope', 'kinh hien vi', 'sinh hoc', 'vi sinh', 'y hoc', 'lab'],
    paths: '<path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 1-4H9l1 4"/>',
    svg: buildLucideSvg('<path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 1-4H9l1 4"/>', '#0ea5e9'),
  },
  {
    id: 'telescope',
    name: 'Kính Thiên Văn',
    category: 'stem',
    tags: ['telescope', 'thien van', 'vu tru', 'sao', 'kinh vien vong', 'space'],
    paths: '<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>',
    svg: buildLucideSvg('<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/>', '#6366f1'),
  },
  {
    id: 'dna',
    name: 'Chuỗi Gen DNA',
    category: 'stem',
    tags: ['dna', 'gen', 'sinh hoc', 'y hoc', 'di truyen', 'science'],
    paths: '<path d="m2 15 3.34-3.34a2.12 2.12 0 0 1 3 0L12 15"/><path d="m9 18 3-3"/><path d="m14 22 3-3"/><path d="M2 22h.01"/><path d="M22 2h-.01"/><path d="m15 2-3.34 3.34a2.12 2.12 0 0 0 0 3L15 12"/><path d="m12 9-3 3"/><path d="m7 4-3 3"/><path d="m22 9-3.34 3.34a2.12 2.12 0 0 1-3 0L12 9"/>',
    svg: buildLucideSvg('<path d="m2 15 3.34-3.34a2.12 2.12 0 0 1 3 0L12 15"/><path d="m9 18 3-3"/><path d="m14 22 3-3"/><path d="M2 22h.01"/><path d="M22 2h-.01"/><path d="m15 2-3.34 3.34a2.12 2.12 0 0 0 0 3L15 12"/><path d="m12 9-3 3"/><path d="m7 4-3 3"/><path d="m22 9-3.34 3.34a2.12 2.12 0 0 1-3 0L12 9"/>', '#ec4899'),
  },

  // --- EDUCATION & SCIENCE ---
  {
    id: 'graduation-cap',
    name: 'Mũ Cử Nhân',
    category: 'education',
    tags: ['mu', 'tot nghiep', 'dai hoc', 'cu nhan', 'education', 'hoc'],
    paths: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    svg: buildLucideSvg('<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>', '#3b82f6'),
  },
  {
    id: 'book-open',
    name: 'Sách Mở Tri Thức',
    category: 'education',
    tags: ['book', 'sach', 'doc', 'hoc tap', 'thu vien', 'tri thuc'],
    paths: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    svg: buildLucideSvg('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>', '#10b981'),
  },
  {
    id: 'lightbulb',
    name: 'Ý Tưởng Sáng Tạo',
    category: 'education',
    tags: ['lightbulb', 'y tuong', 'idea', 'sang tao', 'phat minh', 'den'],
    paths: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    svg: buildLucideSvg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>', '#eab308'),
  },
  {
    id: 'flask-conical',
    name: 'Bình Thí Nghiệm',
    category: 'education',
    tags: ['flask', 'thi nghiem', 'hoa hoc', 'lab', 'nghien cuu'],
    paths: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
    svg: buildLucideSvg('<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>', '#06b6d4'),
  },
  {
    id: 'compass',
    name: 'La Bàn Định Hướng',
    category: 'education',
    tags: ['compass', 'la ban', 'dinh huong', 'dia ly', 'kham pha'],
    paths: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    svg: buildLucideSvg('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', '#f59e0b'),
  },
  {
    id: 'puzzle',
    name: 'Mảnh Ghép Tư Duy',
    category: 'education',
    tags: ['puzzle', 'manh ghep', 'tu duy', 'logic', 'giai do', 'brain'],
    paths: '<path d="M19.439 7.85c0-1.572-.944-2.85-2.109-2.85s-2.11 1.278-2.11 2.85a4 4 0 0 1-4 4c-1.572 0-2.85-.944-2.85-2.109s1.278-2.11 2.85-2.11c1.572 0 2.85-.944 2.85-2.109S12.798 2.772 11.226 2.772a4 4 0 0 0-4 4c0 1.572-.944 2.85-2.109 2.85s-2.11-1.278-2.11-2.85c0-1.572-1.278-2.85-2.85-2.85S-2.693 5.2-2.693 6.772a4 4 0 0 0 4 4c1.572 0 2.85.944 2.85 2.109s-1.278 2.11-2.85 2.11c-1.572 0-2.85.944-2.85 2.109s1.278 2.85 2.85 2.85a4 4 0 0 0 4-4c0-1.572.944-2.85 2.109-2.85s2.11 1.278 2.11 2.85c0 1.572 1.278 2.85 2.85 2.85s2.85-.944 2.85-2.109a4 4 0 0 0-4-4c-1.572 0-2.85-.944-2.85-2.109s1.278-2.11 2.85-2.11c1.572 0 2.85-.944 2.85-2.109s-1.278-2.85-2.85-2.85z"/>',
    svg: buildLucideSvg('<path d="M19.439 7.85c0-1.572-.944-2.85-2.109-2.85s-2.11 1.278-2.11 2.85a4 4 0 0 1-4 4c-1.572 0-2.85-.944-2.85-2.109s1.278-2.11 2.85-2.11c1.572 0 2.85-.944 2.85-2.109S12.798 2.772 11.226 2.772a4 4 0 0 0-4 4c0 1.572-.944 2.85-2.109 2.85s-2.11-1.278-2.11-2.85c0-1.572-1.278-2.85-2.85-2.85S-2.693 5.2-2.693 6.772a4 4 0 0 0 4 4c1.572 0 2.85.944 2.85 2.109s-1.278 2.11-2.85 2.11c-1.572 0-2.85.944-2.85 2.109s1.278 2.85 2.85 2.85a4 4 0 0 0 4-4c0-1.572.944-2.85 2.109-2.85s2.11 1.278 2.11 2.85c0 1.572 1.278 2.85 2.85 2.85s2.85-.944 2.85-2.109a4 4 0 0 0-4-4c-1.572 0-2.85-.944-2.85-2.109s1.278-2.11 2.85-2.11c1.572 0 2.85-.944 2.85-2.109s-1.278-2.85-2.85-2.85z"/>', '#a855f7'),
  },
  {
    id: 'pencil',
    name: 'Bút Vẽ Thiết Kế',
    category: 'education',
    tags: ['pencil', 'but', 've', 'viet', 'thiet ke', 'draw'],
    paths: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    svg: buildLucideSvg('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>', '#10b981'),
  },

  // --- BADGES & ACHIEVEMENTS ---
  {
    id: 'trophy',
    name: 'Cúp Vô Địch',
    category: 'badge',
    tags: ['trophy', 'cup', 'vo dich', 'nhat', 'top 1', 'giai nhat', 'thuong'],
    paths: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    svg: buildLucideSvg('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>', '#f59e0b'),
  },
  {
    id: 'medal',
    name: 'Huy Chương Vàng',
    category: 'badge',
    tags: ['medal', 'huy chuong', 'vang', 'giai thuong', 'danh hieu'],
    paths: '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><circle cx="12" cy="17" r="5"/>',
    svg: buildLucideSvg('<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><circle cx="12" cy="17" r="5"/>', '#eab308'),
  },
  {
    id: 'award',
    name: 'Bằng Khen Danh Dự',
    category: 'badge',
    tags: ['award', 'bang khen', 'chung nhan', 'khen thuong', 'giai'],
    paths: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    svg: buildLucideSvg('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>', '#38bdf8'),
  },
  {
    id: 'shield-check',
    name: 'Khiên Bảo Hộ An Toàn',
    category: 'badge',
    tags: ['shield', 'khien', 'bao ve', 'an toan', 'security', 'verified'],
    paths: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    svg: buildLucideSvg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', '#10b981'),
  },
  {
    id: 'crown',
    name: 'Vương Miện Hoàng Gia',
    category: 'badge',
    tags: ['crown', 'vuong mien', 'vua', 'hoang gia', 'top', 'vip'],
    paths: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
    svg: buildLucideSvg('<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>', '#f59e0b'),
  },
  {
    id: 'star',
    name: 'Ngôi Sao Sáng',
    category: 'badge',
    tags: ['star', 'sao', 'danh gia', '5 sao', 'xuat sac'],
    paths: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    svg: buildLucideSvg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', '#eab308', '#facc15'),
  },
  {
    id: 'sparkles',
    name: 'Phát Sáng AI',
    category: 'badge',
    tags: ['sparkles', 'ai', 'phat sang', 'lap lanh', 'magic', 'phep thuat'],
    paths: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    svg: buildLucideSvg('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>', '#ec4899', '#f472b6'),
  },
  {
    id: 'flame',
    name: 'Ngọn Lửa Nhiệt Huyết',
    category: 'badge',
    tags: ['flame', 'lua', 'hot', 'nhiet huyet', 'chay', 'trending'],
    paths: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    svg: buildLucideSvg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', '#ef4444', '#f87171'),
  },
  {
    id: 'heart',
    name: 'Trái Tim Yêu Thích',
    category: 'badge',
    tags: ['heart', 'trai tim', 'like', 'yeu thich', 'love'],
    paths: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    svg: buildLucideSvg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', '#e11d48', '#f43f5e'),
  },
  {
    id: 'badge-check',
    name: 'Tích Xác Nhận Chuẩn',
    category: 'badge',
    tags: ['check', 'badge', 'xac nhan', 'chinh hang', 'verified'],
    paths: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    svg: buildLucideSvg('<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>', '#10b981'),
  },

  // --- ARROWS & NAVIGATION ---
  {
    id: 'arrow-right',
    name: 'Mũi Tên Phải',
    category: 'arrow',
    tags: ['arrow', 'phai', 'right', 'huong', 'tiep theo'],
    paths: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    svg: buildLucideSvg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', '#10b981'),
  },
  {
    id: 'arrow-left',
    name: 'Mũi Tên Trái',
    category: 'arrow',
    tags: ['arrow', 'trai', 'left', 'quay lai', 'truoc'],
    paths: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    svg: buildLucideSvg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', '#38bdf8'),
  },
  {
    id: 'arrow-up',
    name: 'Mũi Tên Lên',
    category: 'arrow',
    tags: ['arrow', 'len', 'up', 'tang', 'top'],
    paths: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    svg: buildLucideSvg('<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>', '#f59e0b'),
  },
  {
    id: 'arrow-down',
    name: 'Mũi Tên Xuống',
    category: 'arrow',
    tags: ['arrow', 'xuong', 'down', 'giam', 'bottom'],
    paths: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    svg: buildLucideSvg('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>', '#ec4899'),
  },
  {
    id: 'rotate-cw',
    name: 'Xoay Tròn Chu Trình',
    category: 'arrow',
    tags: ['rotate', 'xoay', 'chu trinh', 'vong lap', 'refresh', 'loop'],
    paths: '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
    svg: buildLucideSvg('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>', '#10b981'),
  },

  // --- UI & TOOLS ---
  {
    id: 'palette',
    name: 'Bảng Màu Nghệ Thuật',
    category: 'ui',
    tags: ['palette', 'mau', 've', 'color', 'art', 'hoi hoa'],
    paths: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    svg: buildLucideSvg('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>', '#a855f7'),
  },
  {
    id: 'camera',
    name: 'Máy Ảnh Chụp Hình',
    category: 'ui',
    tags: ['camera', 'may anh', 'chup hinh', 'photo'],
    paths: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    svg: buildLucideSvg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>', '#06b6d4'),
  },
  {
    id: 'globe',
    name: 'Quả Địa Cầu Toàn Cầu',
    category: 'ui',
    tags: ['globe', 'dia cau', 'the gioi', 'internet', 'toan cau', 'world'],
    paths: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    svg: buildLucideSvg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', '#3b82f6'),
  },
  {
    id: 'layers',
    name: 'Các Lớp Layer',
    category: 'ui',
    tags: ['layers', 'lop', 'xep tang', 'do hoa', 'design'],
    paths: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    svg: buildLucideSvg('<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>', '#6366f1'),
  },
  {
    id: 'bell',
    name: 'Chuông Thông Báo',
    category: 'ui',
    tags: ['bell', 'chuong', 'thong bao', 'nhac nho', 'alert'],
    paths: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    svg: buildLucideSvg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', '#f59e0b'),
  },
];

export const STEM_BADGES: StickerItem[] = [
  {
    id: 'badge-gold-champion',
    name: 'Huy Hiệu Quán Quân',
    category: 'badge',
    tags: ['champion', 'quan quan', 'giai nhat', 'vang', 'cup', 'huy chuong'],
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
    tags: ['innovator', 'doi moi', 'stem', 'sang tao', 'khieu vu'],
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
    tags: ['robotics', 'top 1', 'challenge', 'vo dich', 'robot'],
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
    tags: ['verified', 'chuan', 'dat chuan', 'kiem dinh', 'chinh hang'],
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
    tags: ['hot', 'noi bat', 'trending', 'tag', 'nhan'],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 46" width="140" height="46">
      <rect x="5" y="5" width="130" height="36" rx="18" fill="#ef4444" stroke="#fca5a5" stroke-width="2"/>
      <text x="70" y="28" font-family="Inter, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">🔥 HOT STEM</text>
    </svg>`,
  },
  {
    id: 'ribbon-new',
    name: 'Tag Bài Học MỚI',
    category: 'ribbon',
    tags: ['new', 'moi', 'bai hoc', 'tag', 'nhan', '2026'],
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
