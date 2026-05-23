'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [showFab, setShowFab] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const inlineTocRef = useRef<HTMLElement>(null);

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

  // Scroll progress + content zone detection + FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);

      const contentEl = document.querySelector('.king-dragon-content');
      if (contentEl) {
        const rect = contentEl.getBoundingClientRect();
        setIsInContentZone(rect.top < window.innerHeight * 0.6 && rect.bottom > 100);
      }

      // Touch/Tablet: show FAB when inline TOC has scrolled out of view
      if (inlineTocRef.current) {
        const tocRect = inlineTocRef.current.getBoundingClientRect();
        setShowFab(tocRect.bottom < 0 && contentEl ? contentEl.getBoundingClientRect().bottom > 100 : false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsSheetOpen(false);
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

  // Shared TOC list renderer
  const renderTocList = (compact = false) => (
    <ol className="space-y-[2px] list-none m-0 p-0">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <li key={item.id} className={item.level === 3 ? (compact ? 'ml-4' : 'ml-0') : ''}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`
                group relative flex items-start no-underline rounded-md transition-all duration-200
                ${compact ? 'gap-2.5 py-1.5' : 'px-2.5 py-1.5'}
                ${item.level === 3 && !compact ? 'pl-6' : ''}
                ${isActive 
                  ? compact ? 'text-brand-orange' : 'text-brand-orange bg-brand-orange/[0.06]'
                  : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.03]'}
              `}
            >
              {compact && (
                <span className={`tech-mono text-[9px] mt-[3px] shrink-0 ${isActive ? 'text-brand-orange' : 'text-foreground/25'}`}>
                  {item.level === 2 ? `${String(h2Items.findIndex(h => h.id === item.id) + 1).padStart(2, '0')}` : '·'}
                </span>
              )}
              {!compact && isActive && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-brand-orange" />
              )}
              <span className={`leading-snug ${compact ? 'text-[13px]' : 'text-[11px]'} ${item.level === 2 ? 'font-medium' : compact ? '' : 'text-[10px]'}`}>
                {item.text}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════ */}
      {/* MOBILE/TABLET: Inline collapsible TOC      */}
      {/* ═══════════════════════════════════════════ */}
      <nav
        ref={inlineTocRef}
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
            <span className="tech-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">Mục lục</span>
            <span className="tech-mono text-[9px] text-foreground/30 uppercase">{h2Items.length} mục</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-foreground/40 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isCollapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
          <div className="px-5 py-3 border-t border-brand-orange/10">
            {renderTocList(true)}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════ */}
      {/* TOUCH FAB: Floating button for tablet/mobile   */}
      {/* Shows when inline TOC scrolls out of viewport  */}
      {/* ═══════════════════════════════════════════════ */}
      <div className={`
        lg:hidden fixed bottom-6 right-5 z-50
        transition-all duration-400 ease-out
        ${showFab && !isSheetOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}
      `}>
        <button
          onClick={() => setIsSheetOpen(true)}
          className="relative w-12 h-12 rounded-full bg-brand-orange text-white shadow-lg shadow-brand-orange/30 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Mở mục lục"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="22" fill="none" stroke="white" strokeWidth="2" opacity="0.15" />
            <circle 
              cx="24" cy="24" r="22" fill="none" stroke="white" strokeWidth="2" opacity="0.6"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet Overlay */}
      {isSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" onClick={() => setIsSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <nav
            aria-label="Mục lục bài viết (Overlay)"
            className="absolute bottom-0 left-0 right-0 bg-background border-t border-brand-orange/20 rounded-t-2xl max-h-[70vh] overflow-hidden"
            style={{ animation: 'slideUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-4 bg-brand-orange/60 rounded-full" />
                <span className="tech-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">Mục lục bài viết</span>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-foreground/[0.05] flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors"
                aria-label="Đóng mục lục"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 pt-2">
              <div className="h-[2px] bg-foreground/[0.05] rounded-full overflow-hidden">
                <div className="h-full bg-brand-orange/50 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[55vh] scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {renderTocList(true)}
            </div>
          </nav>
        </div>
      )}

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
        <div className={`
          transition-all duration-400 ease-out origin-right
          ${isHovered ? 'opacity-0 scale-95 pointer-events-none absolute right-0' : 'opacity-100 scale-100'}
        `}>
          <div className="flex flex-col items-center gap-[3px] p-2 rounded-full bg-background/80 backdrop-blur-md border border-foreground/[0.08] shadow-sm">
            <div className="w-[3px] h-8 bg-foreground/[0.06] rounded-full overflow-hidden mb-1">
              <div className="w-full bg-brand-orange/70 rounded-full transition-all duration-300" style={{ height: `${progress}%` }} />
            </div>
            {h2Items.map((item, idx) => {
              const isActive = activeId === item.id;
              return (
                <div key={item.id} className={`
                  w-[6px] h-[6px] rounded-full transition-all duration-300
                  ${isActive ? 'bg-brand-orange scale-150 shadow-[0_0_6px_rgba(249,115,22,0.5)]' 
                    : idx <= (h2Items.findIndex(h => h.id === activeId)) ? 'bg-brand-orange/40' : 'bg-foreground/15'}
                `} />
              );
            })}
          </div>
        </div>

        <nav
          aria-label="Mục lục bài viết (Sidebar)"
          className={`
            transition-all duration-400 ease-out origin-right
            bg-background/95 backdrop-blur-xl border border-foreground/[0.08] shadow-lg rounded-lg overflow-hidden
            ${isHovered ? 'opacity-100 scale-100 w-[280px]' : 'opacity-0 scale-95 w-0 pointer-events-none absolute right-0'}
          `}
        >
          <div className="px-4 pt-3 pb-2 border-b border-foreground/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-brand-orange/60 rounded-full" />
                <span className="tech-mono text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/50">Trong bài viết</span>
              </div>
              <span className="tech-mono text-[9px] text-foreground/25">{Math.round(progress)}%</span>
            </div>
            <div className="h-[2px] bg-foreground/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-brand-orange/50 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="px-3 py-2 max-h-[60vh] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {renderTocList(false)}
          </div>
        </nav>
      </div>
    </>
  );
}
