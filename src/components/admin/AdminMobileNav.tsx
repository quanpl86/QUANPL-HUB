'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { navItems } from './AdminSidebar';

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Khóa cuộn trang mạnh mẽ hơn
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [isOpen]);

  return (
    <div className="admin-mobile-nav">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="admin-mobile-nav__trigger"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          Menu quản trị
        </span>
        <span className="admin-mobile-nav__current">
          {navItems.find(i => i.href === pathname)?.label || 'Menu'}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="admin-mobile-nav__backdrop"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Circuit Style Menu */}
      {isOpen && (
        <div className="admin-mobile-nav__panel">
          <nav aria-label="Điều hướng quản trị trên thiết bị di động">
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`admin-mobile-nav__link ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon aria-hidden="true" />
                  <span>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
          </nav>
        </div>
      )}
    </div>
  );
}
