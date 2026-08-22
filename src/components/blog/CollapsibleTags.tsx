'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getVietnameseTaxonomyLabel } from '@/config/knowledge-taxonomy';

interface CollapsibleTagsProps {
  tags: string[];
  maxVisible?: number;
  baseClassName?: string;
  asLinks?: boolean;
}

export function CollapsibleTags({ 
  tags, 
  maxVisible = 5, 
  baseClassName = "px-4 py-2 bg-foreground/5 border border-foreground/20 rounded-full text-xs tech-mono uppercase tracking-widest text-foreground/80 hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/40 transition-colors",
  asLinks = true
}: CollapsibleTagsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tags || tags.length === 0) return null;

  const visibleTags = isExpanded ? tags : tags.slice(0, maxVisible);
  const hasMore = tags.length > maxVisible;

  const handleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(true);
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      {visibleTags.map((tag, idx) => (
        asLinks ? (
          <Link 
            key={idx}
            href={`/blog?tag=${encodeURIComponent(tag)}`}
            className={baseClassName}
          >
            {getVietnameseTaxonomyLabel(tag)}
          </Link>
        ) : (
          <span key={idx} className={baseClassName}>{getVietnameseTaxonomyLabel(tag)}</span>
        )
      ))}

      {hasMore && !isExpanded && (
        <button 
          onClick={handleExpand}
          className={`${baseClassName} cursor-pointer flex items-center justify-center font-bold px-3 hover:bg-foreground/10`}
          aria-label="Xem thêm thẻ chủ đề"
        >
          •••
        </button>
      )}

      {isExpanded && (
        <button 
          onClick={handleCollapse}
          className={`${baseClassName} cursor-pointer flex items-center justify-center font-bold px-3 hover:bg-foreground/10`}
          aria-label="Thu gọn"
        >
          ✕
        </button>
      )}
    </>
  );
}
