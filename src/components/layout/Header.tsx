'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { knowledgeFields } from '@/config/knowledge-taxonomy';
import { navItems as adminNavItems } from '@/components/admin/AdminSidebar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { BrandLogo } from './BrandLogo';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchInput = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isAdminArea = pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileOpen(false);
      setSearchOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => searchInput.current?.focus());
  }, [searchOpen]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/blog?q=${encodeURIComponent(value)}` : '/blog');
    setSearchOpen(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/88 backdrop-blur-xl">
        <div className="container mx-auto flex h-[72px] items-center justify-between px-6">
          <Link href="/" className="group flex shrink-0 items-center" aria-label="King Dragon Hub — Trang chủ">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Điều hướng chính">
            <div className="group relative">
              <button className="nav-link flex items-center gap-1.5" aria-haspopup="true">Khám phá <ChevronDown size={14} /></button>
              <div className="invisible fixed left-1/2 top-[64px] z-[70] w-[min(900px,calc(100vw-32px))] -translate-x-1/2 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-foreground/15 bg-[var(--card-bg)] p-4 shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
                  {knowledgeFields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <Link key={field.slug} href={`/blog?field=${field.slug}`} className="mega-menu-item">
                        <span className="mt-0.5 text-brand-orange"><Icon size={18} /></span>
                        <span><strong>{field.label}</strong><small>{field.subjects.join(' · ')}</small></span>
                      </Link>
                    );
                  })}
                  <Link href="/blog" className="col-span-2 flex items-center justify-between rounded-xl border border-brand-orange/15 bg-brand-orange/[0.05] px-4 py-3 text-sm font-semibold text-foreground hover:text-brand-orange">
                    Xem toàn bộ bản đồ tri thức <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/blog?q=AI" className="nav-link">AI</Link>
            <Link href="/blog?q=STEM" className="nav-link">STEM & Robot</Link>
            <Link href="/blog?q=giáo dục" className="nav-link">Dạy & Học</Link>
            <Link href="/utility-hub" className="nav-link">Tiện ích</Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <button onClick={() => setSearchOpen(true)} className="header-icon-button inline-grid place-items-center" aria-label="Mở tìm kiếm"><Search size={18} /></button>
            <span className="hidden sm:inline-flex"><ThemeToggle /></span>
            <div className="ml-2 hidden items-center lg:flex">
              {user ? (
                <><Link href="/admin" className="header-login">Quản lý</Link><button onClick={logout} className="header-icon-button ml-1 inline-grid place-items-center" aria-label="Đăng xuất"><LogOut size={17} /></button></>
              ) : <Link href="/login" className="header-login">Đăng nhập</Link>}
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="header-icon-button inline-grid place-items-center lg:hidden" aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mobile-drawer border-t border-foreground/10 bg-background px-6 py-6 lg:hidden" aria-label="Điều hướng di động">
            {/* Admin navigation — only when inside /admin */}
            {isAdminArea && user && (
              <div className="mb-5">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-brand-orange/70">Quản trị</p>
                <div className="admin-header-nav-grid">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`admin-header-nav-link ${isActive ? 'is-active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Public navigation */}
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">Khám phá theo lĩnh vực</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {knowledgeFields.map((field) => <Link key={field.slug} href={`/blog?field=${field.slug}`} className="mobile-nav-card"><span>{field.label}</span><small>{field.subjects.join(' · ')}</small></Link>)}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-foreground/10 pt-5 text-sm font-semibold">
              <Link href="/blog">Bài viết</Link><Link href="/utility-hub">Tiện ích</Link><Link href="/about">Giới thiệu</Link><Link href={user ? '/admin' : '/login'}>{user ? 'Quản lý' : 'Đăng nhập'}</Link>
            </div>
          </nav>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/50 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Tìm kiếm King Dragon Hub" onMouseDown={() => setSearchOpen(false)}>
          <div className="mx-auto mt-[12vh] max-w-2xl rounded-2xl border border-foreground/15 bg-[var(--card-bg)] p-6 text-[var(--foreground)] shadow-[0_28px_90px_rgba(15,23,42,0.32)] md:p-8" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-foreground">Bạn muốn tìm hiểu điều gì?</p><button onClick={() => setSearchOpen(false)} className="header-icon-button inline-grid place-items-center" aria-label="Đóng tìm kiếm"><X size={18} /></button></div>
            <form onSubmit={submitSearch} className="site-search-field mt-5 flex items-center rounded-xl border border-foreground/20 bg-[var(--background)] px-4 shadow-sm">
              <Search size={20} className="text-brand-orange" />
              <input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài viết hoặc chủ đề..." className="site-search-field__input w-full bg-transparent px-4 py-4 text-base text-[var(--foreground)] caret-brand-orange placeholder:text-foreground/45" />
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {['AI trong giáo dục', '5E', 'Rubric STEM', 'Scratch', 'WRO', 'CSTA'].map((topic) => <button key={topic} onClick={() => { setQuery(topic); router.push(`/blog?q=${encodeURIComponent(topic)}`); }} className="rounded-full border border-foreground/15 bg-[var(--background)] px-3 py-2 text-xs text-foreground/70 transition hover:border-brand-orange/55 hover:bg-brand-orange/[0.06] hover:text-brand-orange">{topic}</button>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
