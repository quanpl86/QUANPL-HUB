'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, BookOpen, Layers, FileText, Users, Settings, Cpu, MessageSquare } from 'lucide-react';

const navItems = [
  { label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard },
  { label: 'Lĩnh vực', href: '/admin/fields', icon: Database },
  { label: 'Chủ đề', href: '/admin/subjects', icon: BookOpen },
  { label: 'Danh mục', href: '/admin/categories', icon: Layers },
  { label: 'Bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Bình luận', href: '/admin/comments', icon: MessageSquare },
  { label: 'Tự động hóa', href: '/admin/automation', icon: Cpu },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cài đặt hệ thống', href: '/admin/setup', icon: Settings },
];

// Sử dụng memo để tránh re-render Sidebar nếu không cần thiết
export const AdminSidebar = memo(function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="min-w-[256px] w-[256px] border-r border-brand-orange/10 bg-cyber-black/20 h-full hidden lg:flex flex-col p-4 gap-1">
      <div className="mb-8 px-4 border-b border-brand-orange/10 pb-4">
        <p className="font-mono text-[10px] text-brand-orange font-bold uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(255,87,34,0.3)]">
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
              flex items-center gap-3 px-4 py-3 font-orbitron text-[11px] uppercase tracking-wider transition-all duration-200
              ${isActive 
                ? 'bg-brand-orange/10 text-brand-orange border-l-2 border-brand-orange translate-x-1' 
                : 'text-muted hover:text-foreground hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1'
              }
            `}
          >
            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-orange' : 'text-muted/60'}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Footer info or empty space */}
    </aside>
  );
});
