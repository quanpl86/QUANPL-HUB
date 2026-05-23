'use client';

import React, { useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!items || items.length < 2) return null; // Only show TOC if there are at least 2 headings

  return (
    <nav 
      aria-label="Mục lục bài viết"
      className="my-10 border border-foreground/10 bg-foreground/[0.02] backdrop-blur-sm rounded-sm overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-6 py-4 bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-brand-orange text-sm">📑</span>
          <span className="tech-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand-orange">
            Mục lục / Table of Contents
          </span>
        </div>
        <span className="tech-mono text-[10px] text-foreground/40 uppercase tracking-wider">
          {isCollapsed ? '[ MỞ RỘNG ]' : '[ THU GỌN ]'}
        </span>
      </button>

      {/* TOC Items */}
      {!isCollapsed && (
        <ol className="px-6 py-4 space-y-1 list-none m-0">
          {items.map((item, idx) => (
            <li 
              key={item.id}
              className={`${item.level === 3 ? 'ml-6' : ''}`}
            >
              <a
                href={`#${item.id}`}
                className={`
                  group flex items-start gap-3 py-1.5 text-foreground/70 hover:text-brand-orange transition-colors no-underline
                  ${item.level === 2 ? 'font-medium' : 'text-sm'}
                `}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Update URL hash without jumping
                    window.history.pushState(null, '', `#${item.id}`);
                  }
                }}
              >
                <span className="tech-mono text-[10px] text-foreground/30 group-hover:text-brand-orange/60 transition-colors mt-1 shrink-0">
                  {item.level === 2 
                    ? `${String(items.filter((t, i) => i <= idx && t.level === 2).length).padStart(2, '0')}.`
                    : '—'
                  }
                </span>
                <span className="leading-relaxed">{item.text}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
