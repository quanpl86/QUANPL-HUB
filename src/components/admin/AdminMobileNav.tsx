'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Database, BookOpen, Layers, FileText, Users, MessageSquare } from 'lucide-react';

const navItems = [
  { label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard },
  { label: 'Lĩnh vực', href: '/admin/fields', icon: Database },
  { label: 'Chủ đề', href: '/admin/subjects', icon: BookOpen },
  { label: 'Danh mục', href: '/admin/categories', icon: Layers },
  { label: 'Bài viết', href: '/admin/posts', icon: FileText },
  { label: 'Bình luận', href: '/admin/comments', icon: MessageSquare },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
];

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-orbitron text-[10px] text-brand-orange border border-brand-orange/30 px-4 py-2 uppercase tracking-widest bg-cyber-black/40"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        Danh mục Quản trị
      </button>

      {isOpen && (
        <div className="absolute left-4 right-4 mt-2 bg-cyber-black border border-brand-orange/30 z-50 p-2 shadow-[0_0_30px_rgba(255,87,34,0.2)] animate-in fade-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-orbitron text-[10px] uppercase tracking-wider ${isActive ? 'text-brand-orange bg-white/5' : 'text-muted'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
