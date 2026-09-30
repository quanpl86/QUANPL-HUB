export interface BackgroundItem {
  id: string;
  name: string;
  type: 'solid' | 'transparent' | 'gradient';
  value: string;
  gradientStops?: [string, string];
  description?: string;
}

export const QUICK_BACKGROUNDS: BackgroundItem[] = [
  {
    id: 'transparent',
    name: 'Nền Trong Suốt',
    type: 'transparent',
    value: 'transparent',
    description: 'Xuất file PNG trong suốt, không có màu nền',
  },
  {
    id: 'white',
    name: 'Nền Trắng Sáng',
    type: 'solid',
    value: '#ffffff',
    description: 'Trắng tinh khôi, phong cách thanh lịch',
  },
  {
    id: 'slate-light',
    name: 'Nền Xám Mềm',
    type: 'solid',
    value: '#f8fafc',
    description: 'Xám hiện đại chuẩn tài liệu giáo dục',
  },
  {
    id: 'cyber-dark',
    name: 'Nền Đen Cyber',
    type: 'solid',
    value: '#090d16',
    description: 'Đen công nghệ cao phong cách Robotics AI',
  },
  {
    id: 'midnight-blue',
    name: 'Nền Xanh Đêm',
    type: 'solid',
    value: '#0f172a',
    description: 'Xanh đậm hiện đại chiều sâu',
  },
];

export const SOLID_PALETTES = [
  {
    group: 'Màu Cơ Bản & Trung Tính',
    colors: ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#1e293b', '#0f172a', '#090d16', '#000000'],
  },
  {
    group: 'Màu STEM & Công Nghệ',
    colors: ['#10b981', '#059669', '#06b6d4', '#0284c7', '#3b82f6', '#2563eb', '#6366f1', '#4f46e5'],
  },
  {
    group: 'Màu Sáng Tạo & Nổi Bật',
    colors: ['#a855f7', '#7c3aed', '#ec4899', '#db2777', '#f43f5e', '#ef4444', '#f97316', '#f59e0b'],
  },
  {
    group: 'Màu Nhạt Pastel',
    colors: ['#f0fdf4', '#ecfdf5', '#f0f9ff', '#eff6ff', '#faf5ff', '#fdf2f8', '#fff7ed', '#fefce8'],
  },
];

export const GRADIENT_PRESETS: BackgroundItem[] = [
  {
    id: 'grad-cyber-emerald',
    name: 'Cyberpunk Emerald',
    type: 'gradient',
    value: 'gradient:#0f172a:#064e3b',
    gradientStops: ['#0f172a', '#064e3b'],
  },
  {
    id: 'grad-ocean-depth',
    name: 'Biển Sâu Công Nghệ',
    type: 'gradient',
    value: 'gradient:#0f172a:#1e3a8a',
    gradientStops: ['#0f172a', '#1e3a8a'],
  },
  {
    id: 'grad-aurora',
    name: 'Cực Quang Aurora',
    type: 'gradient',
    value: 'gradient:#059669:#0284c7',
    gradientStops: ['#059669', '#0284c7'],
  },
  {
    id: 'grad-sunset',
    name: 'Hoàng Hôn Sáng Tạo',
    type: 'gradient',
    value: 'gradient:#f97316:#db2777',
    gradientStops: ['#f97316', '#db2777'],
  },
  {
    id: 'grad-electric-indigo',
    name: 'Lam Điện Tử',
    type: 'gradient',
    value: 'gradient:#3b82f6:#8b5cf6',
    gradientStops: ['#3b82f6', '#8b5cf6'],
  },
  {
    id: 'grad-neon-horizon',
    name: 'Chân Trời Neon',
    type: 'gradient',
    value: 'gradient:#ec4899:#06b6d4',
    gradientStops: ['#ec4899', '#06b6d4'],
  },
  {
    id: 'grad-golden-trophy',
    name: 'Huy Chương Vàng',
    type: 'gradient',
    value: 'gradient:#78350f:#f59e0b',
    gradientStops: ['#78350f', '#f59e0b'],
  },
  {
    id: 'grad-silver-clean',
    name: 'Bạc Tinh Khôi (Theme Sáng)',
    type: 'gradient',
    value: 'gradient:#ffffff:#cbd5e1',
    gradientStops: ['#ffffff', '#cbd5e1'],
  },
  {
    id: 'grad-soft-spring',
    name: 'Xuân Dịu Dàng (Pastel)',
    type: 'gradient',
    value: 'gradient:#ecfdf5:#eff6ff',
    gradientStops: ['#ecfdf5', '#eff6ff'],
  },
  {
    id: 'grad-deep-space',
    name: 'Vũ Trụ Vô Tận',
    type: 'gradient',
    value: 'gradient:#020617:#1e1b4b',
    gradientStops: ['#020617', '#1e1b4b'],
  },
];
