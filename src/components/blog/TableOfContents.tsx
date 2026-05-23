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
  const [isCollapsed, setIsCollapsed] = useState(true); // Mobile: collapsed by default
  const [progress, setProgress] = useState(0);

  // Intersection Observer: track which heading is currently in view
  useEffect(() => {
    if (!items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting heading
        const visibleEntry = entries.find(e => e.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px', // Trigger when heading is in top 30% of viewport
        threshold: 0,
      }
    );

    // Observe all heading elements
    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  // Scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const offset = 90; // Account for fixed header
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.pushState(null, '', `#${id}`);
    }
  }, []);

  if (!items || items.length < 2) return null;

  const h2Items = items.filter(t => t.level === 2);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════ */}
      {/* MOBILE / TABLET: Inline collapsible TOC (below lg)    */}
      {/* ═══════════════════════════════════════════════════════ */}
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
              {items.map((item, idx) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id} className={item.level === 3 ? 'ml-4' : ''}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={`
                        group flex items-start gap-2.5 py-1.5 no-underline transition-all duration-200
                        ${isActive 
                          ? 'text-brand-orange' 
                          : 'text-foreground/60 hover:text-foreground/90'}
                      `}
                    >
                      <span className={`
                        tech-mono text-[9px] mt-[3px] shrink-0 transition-colors
                        ${isActive ? 'text-brand-orange' : 'text-foreground/25'}
                      `}>
                        {item.level === 2
                          ? `${String(h2Items.findIndex(h => h.id === item.id) + 1).padStart(2, '0')}`
                          : '·'}
                      </span>
                      <span className={`text-[13px] leading-snug ${item.level === 2 ? 'font-medium' : ''}`}>
                        {item.text}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DESKTOP: Sticky sidebar TOC (lg and above)            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block fixed right-0 top-0 h-screen z-40 pointer-events-none" style={{ width: 'calc((100vw - 56rem) / 2)' }}>
        <nav
          aria-label="Mục lục bài viết (Sidebar)"
          className="pointer-events-auto sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-8 pl-4 pt-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] flex-1 bg-foreground/[0.06] rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-orange/60 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="tech-mono text-[9px] text-foreground/30 shrink-0">{Math.round(progress)}%</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3 bg-brand-orange/50 rounded-full" />
            <span className="tech-mono text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40">
              Trong bài viết
            </span>
          </div>

          {/* TOC Links */}
          <ol className="space-y-0.5 list-none m-0 p-0 border-l border-foreground/[0.06] ml-0.5">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleClick(e, item.id)}
                    className={`
                      group relative flex items-start no-underline transition-all duration-200 py-1
                      ${item.level === 3 ? 'pl-6' : 'pl-4'}
                      ${isActive 
                        ? 'text-brand-orange' 
                        : 'text-foreground/40 hover:text-foreground/70'}
                    `}
                  >
                    {/* Active indicator bar */}
                    <div className={`
                      absolute left-0 top-0 bottom-0 w-[2px] rounded-full transition-all duration-300
                      ${isActive ? 'bg-brand-orange scale-y-100' : 'bg-transparent scale-y-0'}
                    `} />
                    
                    <span className={`
                      text-[12px] leading-snug transition-all duration-200
                      ${item.level === 2 ? 'font-medium' : 'text-[11px]'}
                      ${isActive ? 'translate-x-1' : ''}
                    `}>
                      {item.text}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </>
  );
}
