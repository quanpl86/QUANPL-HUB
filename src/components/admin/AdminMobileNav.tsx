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
    <div className="lg:hidden mb-6 relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 font-orbitron text-[11px] text-brand-orange border-2 border-brand-orange/40 px-5 py-3 uppercase tracking-widest bg-white dark:bg-cyber-black shadow-lg font-black z-[101] relative"
      >
        <span className="flex items-center gap-3">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          Danh mục Quản trị
        </span>
        <span className="text-[10px] bg-brand-orange/10 px-2 py-0.5 cyber-cut-sm">
          {navItems.find(i => i.href === pathname)?.label || 'Menu'}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Circuit Style Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-cyber-black/95 border-b-2 border-brand-orange shadow-[0_25px_60px_rgba(0,0,0,0.4)] z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
          <nav className="flex flex-col p-6 tech-mono gap-0 relative">
            {/* Connecting Vertical Line */}
            <div className="absolute left-8 top-10 bottom-20 w-[2px] bg-gradient-to-b from-brand-orange via-brand-orange/30 to-transparent"></div>
            
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    relative py-5 pl-12 flex items-center gap-5 transition-all group
                    ${isActive ? 'bg-brand-orange/[0.05]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'}
                  `}
                >
                  {/* Connecting Dot */}
                  <div className={`
                    absolute left-[25px] w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 z-10
                    ${isActive 
                      ? 'border-brand-orange bg-brand-orange shadow-[0_0_12px_rgba(249,115,22,0.6)]' 
                      : 'border-brand-orange/40 bg-white dark:bg-cyber-black group-hover:border-brand-orange'
                    }
                  `}></div>
                  
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-orange' : 'text-muted'}`} />
                  <span className={`text-[11px] font-orbitron font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-brand-orange' : 'text-foreground dark:text-muted'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            
            <div className="mt-6 pt-6 border-t border-brand-orange/10 px-4">
               <p className="tech-mono text-[9px] text-brand-orange/40 uppercase tracking-[0.3em] text-center italic">
                  // CORE_SYSTEM_HIERARCHY //
               </p>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
