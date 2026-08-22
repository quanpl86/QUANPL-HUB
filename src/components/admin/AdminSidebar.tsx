'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, BookOpen, Layers, FileText, Users, Settings, Cpu, MessageSquare, CalendarClock, ArrowUpRight, ClipboardCheck } from 'lucide-react';

export const navItems = [
  { label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard },
  { label: 'Lĩnh vực', href: '/admin/fields', icon: Database },
  { label: 'Chủ đề', href: '/admin/subjects', icon: BookOpen },
  { label: 'Danh mục', href: '/admin/categories', icon: Layers },
  { label: 'Bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Duyệt lịch tuần', href: '/admin/editorial', icon: ClipboardCheck },
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
    <aside className="admin-sidebar">
      <div className="admin-sidebar__heading">
        <span className="admin-eyebrow">Khu vực quản trị</span>
        <strong>Quản lý nội dung</strong>
        <p>Điều hành taxonomy, bài viết và quy trình biên tập.</p>
      </div>
      <nav className="admin-sidebar__nav" aria-label="Điều hướng quản trị">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
        
        return (
          <Link 
            key={item.href} 
            href={item.href}
            prefetch={true}
            className={`admin-sidebar__link ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      </nav>
      <Link href="/" className="admin-sidebar__public-link">
        Xem trang công khai <ArrowUpRight aria-hidden="true" />
      </Link>
    </aside>
  );
});
