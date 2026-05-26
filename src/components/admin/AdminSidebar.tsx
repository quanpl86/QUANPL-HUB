'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, BookOpen, Layers, FileText, Users, Settings, Cpu, MessageSquare, CalendarClock } from 'lucide-react';

export const navItems = [
  { label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard },
  { label: 'Lĩnh vực', href: '/admin/fields', icon: Database },
  { label: 'Chủ đề', href: '/admin/subjects', icon: BookOpen },
  { label: 'Danh mục', href: '/admin/categories', icon: Layers },
  { label: 'Bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Lịch nội dung', href: '/admin/content-schedule', icon: CalendarClock },
  { label: 'Bình luận', href: '/admin/comments', icon: MessageSquare },
  { label: 'Tự động hóa', href: '/admin/automation', icon: Cpu },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cài đặt hệ thống', href: '/admin/setup', icon: Settings },
];

// Sử dụng memo để tránh re-render Sidebar nếu không cần thiết
export const AdminSidebar = memo(function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-w-[256px] w-[256px] border-r border-brand-orange/25 bg-cyber-black/5 dark:bg-cyber-black/20 h-full hidden lg:flex flex-col p-4 gap-1">
      <div className="mb-8 px-4 border-b border-brand-orange/25 pb-4">
        <p className="tech-mono text-brand-orange drop-shadow-[0_0_8px_rgba(255,87,34,0.35)]">
          Trung_tâm_điều_hành
        </p>
      </div>
      
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            prefetch={true}
            className={`
              group flex items-center gap-3 px-4 py-3 font-orbitron text-[11px] uppercase tracking-wider transition-all duration-200 font-bold
              ${isActive 
                ? 'bg-brand-orange/[0.14] text-brand-orange border-l-2 border-brand-orange translate-x-1 shadow-[inset_8px_0_18px_rgba(249,115,22,0.08)]'
                : 'text-foreground/80 hover:text-brand-orange hover:bg-brand-orange/[0.06] dark:hover:bg-white/5 border-l-2 border-transparent hover:border-brand-orange/35 hover:translate-x-1'
              }
            `}
          >
            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-orange' : 'text-foreground/65 group-hover:text-brand-orange'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Footer info or empty space */}
    </aside>
  );
});
