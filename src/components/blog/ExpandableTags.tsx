'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ExpandableTagsProps {
  categoryName: string;
  categorySlug: string;
  tags?: string[];
}

export function ExpandableTags({ categoryName, categorySlug, tags = [] }: ExpandableTagsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Maximum number of tags to show before truncating (not counting the Category)
  const MAX_VISIBLE_TAGS = 2; 

  const visibleTags = isExpanded ? tags : tags.slice(0, MAX_VISIBLE_TAGS);
  const hasMore = tags.length > MAX_VISIBLE_TAGS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category is always visible */}
      <Link 
        href={`/blog?category=${categorySlug}`}
        className="px-3 py-1 text-[0.65rem] tech-mono font-bold uppercase tracking-wider border border-foreground/30 rounded-full text-foreground/80 hover:border-brand-orange hover:text-brand-orange transition-colors"
      >
        {categoryName}
      </Link>

      {/* Tags */}
      {visibleTags.map((tag, idx) => (
        <Link 
          key={idx}
          href={`/blog?tag=${encodeURIComponent(tag)}`}
          className="px-3 py-1 text-[0.65rem] tech-mono font-bold uppercase tracking-wider border border-foreground/30 rounded-full text-foreground/80 hover:border-brand-orange hover:text-brand-orange transition-colors"
        >
          {tag}
        </Link>
      ))}

      {/* Expand/Collapse Button */}
      {hasMore && !isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="px-2.5 py-1 text-[0.65rem] tech-mono font-bold uppercase tracking-wider border border-foreground/30 rounded-full text-foreground/80 hover:bg-foreground/10 transition-colors flex items-center justify-center"
          aria-label="Xem thêm Tags"
        >
          •••
        </button>
      )}

      {isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="w-6 h-6 flex items-center justify-center text-[0.65rem] font-bold border border-foreground/30 rounded-full text-foreground/80 hover:bg-foreground/10 transition-colors"
          aria-label="Thu gọn"
        >
          ✕
        </button>
      )}
    </div>
  );
}
