'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getVietnameseTaxonomyLabel, knowledgeFields } from '@/config/knowledge-taxonomy';
import { ArticleCard, ArticleCardSkeleton } from '@/components/blog/ArticleCard';
import { FilterSelect } from '@/components/ui/FilterSelect';
import type { PublicPostCard } from '@/lib/content/public-content';

interface Category { id: string; name: string; slug: string }
interface ExploreContentProps {
  initialPosts: PublicPostCard[];
  categories: Category[];
  title?: React.ReactNode;
  subtitle?: string;
  variant?: 'homepage' | 'archive';
}

export function ExploreContent({ initialPosts, categories, title, subtitle = 'Bài viết và tài nguyên mới nhất', variant = 'archive' }: ExploreContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentField = searchParams.get('field') || 'all';
  const currentSearch = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'newest') params.set(key, value);
      else params.delete(key);
    });
    startTransition(() => {
      router.push(`${window.location.pathname}?${params.toString()}#explore`, { scroll: false });
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (searchValue === currentSearch) return;
    const timer = setTimeout(() => updateParams({ q: searchValue }), 450);
    return () => clearTimeout(timer);
  }, [currentSearch, searchValue, updateParams]);

  const sortedPosts = [...initialPosts].sort((a, b) => {
    if (currentSort === 'oldest') return +new Date(a.created_at) - +new Date(b.created_at);
    if (currentSort === 'az') return a.title.localeCompare(b.title, 'vi');
    return +new Date(b.created_at) - +new Date(a.created_at);
  });

  const reset = () => {
    setSearchValue('');
    updateParams({ q: '', field: 'all', category: 'all', sort: 'newest' });
  };

  const fieldOptions = [
    { value: 'all', label: 'Tất cả lĩnh vực' },
    ...knowledgeFields.map((field) => ({ value: field.slug, label: field.label })),
  ];
  const categoryOptions = [
    { value: 'all', label: 'Tất cả danh mục' },
    ...categories.map((category) => ({ value: category.slug, label: getVietnameseTaxonomyLabel(category.name, category.slug) })),
  ];
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'az', label: 'Tiêu đề A–Z' },
  ];

  return (
    <section id="explore" className="scroll-mt-20 border-t border-foreground/10 bg-background py-20 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mb-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {title || <><p className="editorial-kicker"><span className="h-1.5 w-1.5 rounded-full bg-brand-orange" /> Nội dung mới</p><h2 className="editorial-title mt-4">Mới xuất bản</h2></>}
            <p className="mt-4 text-sm leading-6 text-foreground/55">{subtitle}</p>
          </div>
          <label className="site-search-field relative block w-full rounded-xl lg:w-[390px]">
            <span className="sr-only">Tìm trong kho tri thức</span>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-orange" size={18} />
            <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Tìm trong bài viết và chủ đề..." className="site-search-field__input w-full rounded-xl border border-foreground/12 bg-foreground/[0.025] py-3.5 pl-12 pr-11 text-sm text-foreground" />
            {searchValue && <button onClick={() => setSearchValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground/40 hover:text-foreground" aria-label="Xóa từ khóa"><X size={15} /></button>}
          </label>
        </div>

        <div className="mb-10 grid gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3 sm:grid-cols-3">
          <FilterSelect label="Lĩnh vực" value={currentField} options={fieldOptions} onChange={(field) => updateParams({ field, category: 'all' })} />
          <FilterSelect label="Danh mục" value={currentCategory} options={categoryOptions} onChange={(category) => updateParams({ category })} />
          <FilterSelect label={<><SlidersHorizontal size={12} /> Sắp xếp</>} value={currentSort} options={sortOptions} onChange={(sort) => updateParams({ sort })} />
        </div>

        {sortedPosts.length ? (
          <div className="article-card-grid" aria-busy={isPending} aria-live="polite">
            {isPending
              ? Array.from({ length: Math.min(sortedPosts.length, 6) }, (_, index) => <ArticleCardSkeleton key={index} />)
              : sortedPosts.map((post) => <ArticleCard key={post.id} post={post} showKeywords={variant === 'archive'} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-foreground/15 px-6 py-16 text-center">
            <Compass className="mx-auto text-brand-orange" size={28} /><h3 className="mt-5 text-2xl font-semibold text-foreground">Chưa tìm thấy nội dung phù hợp</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground/55">Hãy thử từ khóa rộng hơn hoặc xóa các bộ lọc hiện tại.</p><button onClick={reset} className="secondary-editorial-cta mx-auto mt-7"><RotateCcw size={16} />Xóa bộ lọc</button>
          </div>
        )}

        {initialPosts.length > 0 && pathname === '/' && <div className="mt-12 text-center"><Link href="/blog" className="secondary-editorial-cta">Xem toàn bộ bài viết <ArrowRight size={16} /></Link></div>}
      </div>
    </section>
  );
}
