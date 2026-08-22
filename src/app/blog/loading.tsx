import { ArticleCardSkeleton } from '@/components/blog/ArticleCard';

export default function BlogLoading() {
  return (
    <main className="border-t border-foreground/10 bg-background py-20 md:py-24" aria-label="Đang tải thư viện tri thức">
      <div className="container mx-auto px-6">
        <div className="mb-10 max-w-2xl">
          <div className="h-3 w-28 rounded skeleton-pulse" />
          <div className="mt-5 h-12 w-72 max-w-full rounded skeleton-pulse" />
          <div className="mt-4 h-4 w-96 max-w-full rounded skeleton-pulse" />
        </div>
        <div className="mb-10 h-16 rounded-2xl skeleton-pulse" />
        <div className="article-card-grid">
          {Array.from({ length: 6 }, (_, index) => <ArticleCardSkeleton key={index} />)}
        </div>
      </div>
    </main>
  );
}
