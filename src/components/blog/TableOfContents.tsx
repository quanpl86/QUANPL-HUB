'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInContentZone, setIsInContentZone] = useState(false);

  // Track which heading is currently in view
  useEffect(() => {
    if (!items || items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(e => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  // Scroll progress + content zone detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);

      // Only show sidebar when user is within article content area
      const contentEl = document.querySelector('.king-dragon-content');
      if (contentEl) {
        const rect = contentEl.getBoundingClientRect();
        setIsInContentZone(rect.top < window.innerHeight * 0.6 && rect.bottom > 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const offset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  }, []);

  if (!items || items.length < 2) return null;

  const h2Items = items.filter(t => t.level === 2);
  const activeIndex = items.findIndex(t => t.id === activeId);

  return (
    <>
      {/* ═══════════════════════════════════════════ */}
      {/* MOBILE: Inline collapsible TOC             */}
      {/* ═══════════════════════════════════════════ */}
      <nav
        aria-label="Mục lục bài viết"
        className="lg:hidden my-10 border border-brand-orange/15 bg-gradient-to-br from-brand-orange/[0.03] to-transparent backdrop-blur-sm overflow-hidden"
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-brand-orange/[0.04] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-sm bg-brand-orange/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-orange">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
            </div>
            <span className="tech-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
              Mục lục
            </span>
            <span className="tech-mono text-[9px] text-foreground/30 uppercase">
              {h2Items.length} mục
            </span>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-foreground/40 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isCollapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
          <div className="px-5 py-3 border-t border-brand-orange/10">
            <ol className="space-y-0.5 list-none m-0 p-0">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id} className={item.level === 3 ? 'ml-4' : ''}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={`
                        group flex items-start gap-2.5 py-1.5 no-underline transition-all duration-200
                        ${isActive ? 'text-brand-orange' : 'text-foreground/60 hover:text-foreground/90'}
                      `}
                    >
                      <span className={`tech-mono text-[9px] mt-[3px] shrink-0 transition-colors ${isActive ? 'text-brand-orange' : 'text-foreground/25'}`}>
                        {item.level === 2 ? `${String(h2Items.findIndex(h => h.id === item.id) + 1).padStart(2, '0')}` : '·'}
                      </span>
                      <span className={`text-[13px] leading-snug ${item.level === 2 ? 'font-medium' : ''}`}>{item.text}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════ */}
      {/* DESKTOP: Minimal rail → expand on hover     */}
      {/* ═══════════════════════════════════════════ */}
      <div
        className={`
          hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 z-50
          transition-all duration-500 ease-out
          ${isInContentZone ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed: Minimal dot rail */}
        <div className={`
          transition-all duration-400 ease-out origin-right
          ${isHovered ? 'opacity-0 scale-95 pointer-events-none absolute right-0' : 'opacity-100 scale-100'}
        `}>
          <div className="flex flex-col items-center gap-[3px] p-2 rounded-full bg-background/80 backdrop-blur-md border border-foreground/[0.08] shadow-sm">
            {/* Progress mini */}
            <div className="w-[3px] h-8 bg-foreground/[0.06] rounded-full overflow-hidden mb-1">
              <div 
                className="w-full bg-brand-orange/70 rounded-full transition-all duration-300"
                style={{ height: `${progress}%` }}
              />
            </div>
            {/* Dot indicators for each H2 */}
            {h2Items.map((item, idx) => {
              const isActive = activeId === item.id;
              return (
                <div 
                  key={item.id}
                  className={`
                    w-[6px] h-[6px] rounded-full transition-all duration-300
                    ${isActive 
                      ? 'bg-brand-orange scale-150 shadow-[0_0_6px_rgba(249,115,22,0.5)]' 
                      : idx <= (h2Items.findIndex(h => h.id === activeId)) 
                        ? 'bg-brand-orange/40' 
                        : 'bg-foreground/15'}
                  `}
                />
              );
            })}
          </div>
        </div>

        {/* Expanded: Full TOC panel */}
        <nav
          aria-label="Mục lục bài viết (Sidebar)"
          className={`
            transition-all duration-400 ease-out origin-right
            bg-background/95 backdrop-blur-xl border border-foreground/[0.08] shadow-lg
            rounded-lg overflow-hidden
            ${isHovered 
              ? 'opacity-100 scale-100 w-[280px]' 
              : 'opacity-0 scale-95 w-0 pointer-events-none absolute right-0'}
          `}
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-foreground/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-brand-orange/60 rounded-full" />
                <span className="tech-mono text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/50">
                  Trong bài viết
                </span>
              </div>
              <span className="tech-mono text-[9px] text-foreground/25">{Math.round(progress)}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-[2px] bg-foreground/[0.05] rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-orange/50 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* TOC Items */}
          <div className="px-3 py-2 max-h-[60vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <ol className="space-y-[2px] list-none m-0 p-0">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={`
                        group relative flex items-start no-underline rounded-md px-2.5 py-1.5 transition-all duration-200
                        ${item.level === 3 ? 'pl-6' : ''}
                        ${isActive 
                          ? 'text-brand-orange bg-brand-orange/[0.06]' 
                          : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.03]'}
                      `}
                    >
                      {/* Active dot */}
                      {isActive && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-orange" />
                      )}
                      <span className={`
                        text-[11px] leading-snug
                        ${item.level === 2 ? 'font-medium' : 'text-[10px]'}
                      `}>
                        {item.text}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
      </div>
    </>
  );
}
