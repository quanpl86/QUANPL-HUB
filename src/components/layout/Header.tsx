'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ui/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

import { getSiteSettings } from '@/app/actions/settings';

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [siteTitle, setSiteTitle] = useState('KING DRAGON HUB');
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Load Site Settings
    const loadSettings = async () => {
      const result = await getSiteSettings();
      if (result.success && result.data?.site_title) {
        setSiteTitle(result.data.site_title);
      }
    };
    loadSettings();

    return () => subscription.unsubscribe();
  }, []);

  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Khóa cuộn trang mạnh mẽ hơn cho Header
  useEffect(() => {
    if (isMobileMenuOpen) {
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
  }, [isMobileMenuOpen]);

  // Hàm để tách Logo thành 2 phần màu sắc
  const renderLogo = () => {
    const parts = siteTitle.split(/[\s-]+/);
    if (parts.length >= 2) {
      const firstPart = parts.slice(0, -1).join('-');
      const lastPart = parts[parts.length - 1];
      return (
        <>
          <span className="bg-foreground text-background px-3 py-1.5 transition-colors duration-300 uppercase">{firstPart}</span>
          <span className="bg-brand-orange text-white px-3 py-1.5 uppercase">{lastPart}</span>
        </>
      );
    }
    return <span className="bg-brand-orange text-white px-4 py-1.5 uppercase">{siteTitle}</span>;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-brand-orange/20 bg-cyber-gray/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Area */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center font-orbitron font-bold text-lg tracking-tighter overflow-hidden cyber-cut-sm">
              {renderLogo()}
            </div>
          </Link>

          {/* Navigation - Desktop (Hidden on mobile/tablet) */}
          <nav className="hidden lg:flex items-center tech-mono font-bold">
            <Link href="/blog" className="relative px-6 py-2 transition-colors group overflow-hidden text-muted">
              <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">BÀI VIẾT</span>
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
            </Link>
            <div className="w-[1px] h-4 bg-brand-orange/20"></div>
            <Link href="/utility-hub" className="relative px-6 py-2 transition-colors group overflow-hidden text-muted">
              <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">TIỆN ÍCH</span>
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
            </Link>
            <div className="w-[1px] h-4 bg-brand-orange/20"></div>
            <Link href="/about" className="relative px-6 py-2 transition-colors group overflow-hidden text-muted">
              <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">GIỚI THIỆU</span>
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
            </Link>
          </nav>

          {/* Action Button - Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <ThemeToggle />
            <div className="w-[1px] h-8 bg-brand-orange/10 mr-2"></div>
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/admin">
                  <button className="tech-mono px-6 py-2 bg-brand-orange/10 text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/20 transition-all cyber-cut-sm">
                    TRUNG TÂM ĐIỀU HÀNH
                  </button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="tech-mono text-muted hover:text-red-500 transition-colors"
                >
                  [ ĐĂNG XUẤT ]
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="tech-mono px-6 py-2 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10 transition-all cyber-cut-sm">
                  ĐĂNG NHẬP HỆ THỐNG
                </button>
              </Link>
            )}
          </div>

          {/* Mobile/Tablet Menu Toggle */}
          <div className="flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground p-2 border border-brand-orange/20 cyber-cut-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="square" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="square" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Moved OUTSIDE the header for absolute priority */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 top-20 bg-black/60 backdrop-blur-md z-[60] cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Menu Content */}
          <div className="fixed top-20 left-0 w-full bg-cyber-black/95 backdrop-blur-2xl border-b-2 border-brand-orange shadow-[0_20px_50px_rgba(249,115,22,0.3)] animate-fade-in overflow-hidden z-[70]">
            <nav className="flex flex-col p-8 tech-mono gap-0 relative">
              <div className="absolute left-10 top-12 bottom-32 w-[1px] bg-gradient-to-b from-brand-orange via-brand-orange/20 to-transparent"></div>
              
              {[
                { label: 'BÀI VIẾT', href: '/blog' },
                { label: 'TIỆN ÍCH', href: '/utility-hub' },
                { label: 'GIỚI THIỆU', href: '/about' }
              ].map((item, idx) => (
                <Link key={idx} href={item.href} className="relative py-6 pl-12 group flex items-center gap-4 transition-all hover:bg-white/5">
                  <div className="absolute left-[34px] w-3 h-3 rounded-full border border-brand-orange bg-cyber-black group-hover:bg-brand-orange transition-colors duration-300 z-10 shadow-[0_0_10px_rgba(249,115,22,0.3)]"></div>
                  <span className="text-muted group-hover:text-brand-orange transition-colors text-sm tracking-widest">{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-10 pl-12 border-t border-white/5 mt-4">
                {user ? (
                  <div className="flex flex-col gap-6">
                    <Link href="/admin">
                      <button className="w-full tech-mono py-4 bg-brand-orange/10 text-brand-orange border border-brand-orange/30 cyber-cut-sm">
                        TRUNG TÂM ĐIỀU HÀNH
                      </button>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="tech-mono text-muted py-2 hover:text-red-500 transition-colors text-left"
                    >
                      [ ĐĂNG XUẤT ]
                    </button>
                  </div>
                ) : (
                  <Link href="/login">
                    <button className="w-full tech-mono py-4 bg-brand-orange text-white border border-brand-orange cyber-cut-sm">
                      ĐĂNG NHẬP HỆ THỐNG
                    </button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
