'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ui/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { getSiteSettings } from '@/app/actions/settings';

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [siteTitle, setSiteTitle] = useState('KING DRAGON HUB');
  const router = useRouter();

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
    <header className="sticky top-0 z-50 w-full border-b-2 border-brand-orange/20 bg-cyber-gray/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex items-center group">
          <div className="flex items-center font-orbitron font-bold text-lg tracking-tighter overflow-hidden cyber-cut-sm">
            {renderLogo()}
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 tech-mono">
          <Link href="/blog" className="relative py-2 transition-colors group overflow-hidden" style={{ color: 'var(--muted)' }}>
            <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">BÀI VIẾT</span>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
          </Link>
          <Link href="/utility-hub" className="relative py-2 transition-colors group overflow-hidden" style={{ color: 'var(--muted)' }}>
            <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">TIỆN ÍCH</span>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
          </Link>
          <Link href="/about" className="relative py-2 transition-colors group overflow-hidden" style={{ color: 'var(--muted)' }}>
            <span className="relative z-10 group-hover:text-brand-orange transition-colors duration-300">GIỚI THIỆU</span>
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-orange transition-all duration-300 group-hover:w-full"></div>
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
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

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-slate-50 p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>
    </header>
  );
};
