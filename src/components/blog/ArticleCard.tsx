'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, ImageOff } from 'lucide-react';
import { getVietnameseTaxonomyLabel } from '@/config/knowledge-taxonomy';
import {
  formatCardDate,
  getArticleCardExcerpt,
  getArticleCardKeywords,
  getArticleCardTitle,
} from '@/lib/content/article-card';
import type { PublicPostCard } from '@/lib/content/public-content';

type ArticleCardProps = {
  post: PublicPostCard;
  showKeywords?: boolean;
};

export function ArticleCard({ post, showKeywords = true }: ArticleCardProps) {
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>(post.image_url ? 'loading' : 'error');
  const category = getVietnameseTaxonomyLabel(post.categories?.name, post.categories?.slug);
  const title = getArticleCardTitle(post.slug, post.title);
  const excerpt = getArticleCardExcerpt(post.slug, post.excerpt);
  const keywords = getArticleCardKeywords(post.tags, getVietnameseTaxonomyLabel);

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="article-card-v2 group"
      aria-label={`Đọc bài: ${title}`}
    >
      <div className="article-card-v2__media">
        {imageState !== 'error' && post.image_url ? (
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
            className={`article-card-v2__image ${imageState === 'ready' ? 'is-ready' : ''}`}
            onLoad={() => setImageState('ready')}
            onError={() => setImageState('error')}
          />
        ) : null}

        {imageState === 'loading' ? <div className="article-card-v2__image-skeleton" aria-hidden="true" /> : null}

        {imageState === 'error' ? (
          <div className="article-card-v2__fallback" role="img" aria-label={`Chưa có ảnh đại diện cho bài ${title}`}>
            <ImageOff size={30} aria-hidden="true" />
            <span>{category}</span>
          </div>
        ) : null}

        <span className="article-card-v2__category">{category}</span>
      </div>

      <div className="article-card-v2__content">
        <h3 className="article-card-v2__title">{title}</h3>
        <p className="article-card-v2__excerpt">{excerpt}</p>

        {showKeywords && keywords.length ? (
          <p className="article-card-v2__keywords" aria-label={`Từ khóa: ${keywords.join(', ')}`}>
            {keywords.map((keyword, index) => (
              <span key={keyword}>{index > 0 ? <span aria-hidden="true"> · </span> : null}{keyword}</span>
            ))}
          </p>
        ) : null}

        <div className="article-card-v2__meta">
          <div className="article-card-v2__facts">
            <span><CalendarDays size={13} aria-hidden="true" />{formatCardDate(post.created_at)}</span>
            <span><Clock3 size={13} aria-hidden="true" />{post.reading_minutes} phút đọc</span>
          </div>
          <ArrowRight className="article-card-v2__arrow" size={19} aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="article-card-v2 article-card-v2--skeleton" aria-hidden="true">
      <div className="article-card-v2__media skeleton-pulse" />
      <div className="article-card-v2__content">
        <div className="h-5 w-5/6 rounded skeleton-pulse" />
        <div className="h-5 w-2/3 rounded skeleton-pulse" />
        <div className="mt-2 h-3.5 w-full rounded skeleton-pulse" />
        <div className="h-3.5 w-11/12 rounded skeleton-pulse" />
        <div className="h-3.5 w-3/4 rounded skeleton-pulse" />
        <div className="mt-auto border-t border-foreground/[0.06] pt-4">
          <div className="h-3 w-1/2 rounded skeleton-pulse" />
        </div>
      </div>
    </div>
  );
}
