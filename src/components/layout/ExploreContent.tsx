'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Compass, RotateCcw, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  created_at: string;
  categories: { name: string } | null;
}

interface ExploreContentProps {
  initialPosts: Post[];
  categories: Category[];
  title?: React.ReactNode;
  subtitle?: string;
}

const suggestedTopics = ['AI', 'STEM', 'Robotics', 'Second Brain'];

export function ExploreContent({ initialPosts, categories, title, subtitle = 'TÌM_KIẾM_LỌC_SẮP_XẾP_SẴN_SÀNG' }: ExploreContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const selectedCategory = categories.find((cat) => cat.slug === currentCategory);
  const hasActiveFilters = Boolean(currentSearch) || currentCategory !== 'all';
  
  const [searchValue, setSearchValue] = useState(currentSearch);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'newest') {
        params.set(key, value);
      } else if (!value || value === 'all' || value === 'newest') {
        params.delete(key);
      }
    });
    router.push(`${window.location.pathname}?${params.toString()}#explore`, { scroll: false });
  }, [router, searchParams]);

  // Sorting Logic
  const sortedPosts = [...initialPosts].sort((a, b) => {
    if (currentSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (currentSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (currentSort === 'az') return a.title.localeCompare(b.title);
    return 0;
  });

  // Debounced search update
  useEffect(() => {
    if (searchValue === currentSearch) return;

    const timer = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 500);
    return () => clearTimeout(timer);
  }, [currentSearch, searchValue, updateParams]);

  const resetDiscovery = () => {
    setSearchValue('');
    updateParams({ q: '', category: 'all', sort: 'newest' });
  };

  const exploreTopic = (topic: string) => {
    setSearchValue(topic);
    updateParams({ q: topic, category: 'all', sort: 'newest' });
  };

  return (
    <section id="explore" className="pt-12 pb-24 bg-cyber-black/20 border-t border-brand-orange/10 scroll-mt-20">
      <div className="container mx-auto px-6">
        {/* Header & Search Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 border-l-4 border-brand-orange pl-6">
          <div className="flex-1">
            {title || (
              <h2 key="default-explore-title" className="cyber-h2">Khám phá <span className="text-brand-orange">TRI THỨC</span></h2>
            )}
            <p className="tech-mono text-muted !text-[9px] mt-2 tracking-[0.4em]">{`// ${subtitle} //`}</p>
          </div>
          
          <div className="w-full lg:w-96 relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-orange/50 group-focus-within:text-brand-orange transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="TÌM KIẾM TRONG KHO LƯU TRỮ..."
              className="w-full bg-cyber-black/40 border border-brand-orange/20 focus:border-brand-orange py-4 pl-12 pr-4 tech-mono text-foreground outline-none transition-all placeholder:text-muted/40"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <button 
                onClick={() => setSearchValue('')}
                className="absolute inset-y-0 right-4 flex items-center text-muted hover:text-brand-orange"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters Matrix & Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => updateParams({ category: 'all' })}
              className={`px-6 py-2 tech-mono transition-all ${
                currentCategory === 'all' 
                  ? 'bg-brand-orange text-white shadow-[0_0_15px_rgba(255,87,34,0.4)]' 
                  : 'bg-white/5 text-muted hover:bg-white/10 border border-white/5'
              }`}
            >
              TẤT CẢ
            </button>
            
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateParams({ category: cat.slug })}
                className={`px-6 py-2 tech-mono transition-all ${
                  currentCategory === cat.slug 
                    ? 'bg-brand-orange text-white shadow-[0_0_15px_rgba(255,87,34,0.4)]' 
                    : 'bg-white/5 text-muted hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat.name.replace(' ', '_')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-cyber-black/40 border border-brand-orange/10 px-4 py-2">
            <SlidersHorizontal size={14} className="text-brand-orange" />
            <select 
              value={currentSort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-transparent border-none outline-none tech-mono text-muted hover:text-brand-orange cursor-pointer"
            >
              <option value="newest">MỚI NHẤT</option>
              <option value="oldest">CŨ NHẤT</option>
              <option value="az">TIÊU ĐỀ A-Z</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-12 max-w-6xl mx-auto">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="group h-full">
                <StaticCyberCard className="h-full flex flex-col md:flex-row border-brand-orange/5 hover:border-brand-orange/20 transition-all duration-500 overflow-hidden">
                  {/* Image Area - Thư viện ảnh bên trái ở màn hình lớn hơn mobile */}
                  <div className="w-full md:w-2/5 aspect-[16/9] md:aspect-auto overflow-hidden bg-brand-orange/5 relative">
                    {post.image_url && (
                      <Image 
                        src={post.image_url} 
                        alt={post.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                      />
                    )}
                    <div className="absolute top-0 right-0 p-2">
                       <span className="text-[8px] tech-mono bg-brand-orange/20 text-brand-orange px-2 py-0.5">CÔNG KHAI</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <span className="tech-mono text-brand-orange/60 block mb-2 !text-[9px]">[{post.categories?.name || 'BẢN GHI'}]</span>
                    <h3 className="cyber-h3 mb-4 group-hover:text-brand-orange transition-colors line-clamp-2 !tracking-tight">{post.title}</h3>
                    
                    {/* Excerpt */}
                    <p className="body-base text-foreground/90 line-clamp-3 mb-4 font-medium italic border-l-2 border-brand-orange/30 pl-4">
                      {post.excerpt}
                    </p>

                    {/* Content Snippet - Hiển thị thêm nội dung thô */}
                    <p className="body-sm text-muted line-clamp-3 mb-6 opacity-60">
                      {post.content?.replace(/<[^>]*>/g, '').slice(0, 300)}...
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-brand-orange/5 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 tech-mono text-muted !text-[9px]">
                          <Calendar size={12} />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 tech-mono text-brand-orange/40 !text-[8px]">
                          <span className="w-1 h-1 bg-brand-orange/40 rounded-full"></span>
                          EST_READ: {Math.ceil((post.content?.length || 0) / 1000)} MIN
                        </div>
                      </div>
                      <div className="flex items-center gap-2 group/btn">
                        <span className="tech-mono text-[10px] text-brand-orange font-bold tracking-wider">
                          TRUY_CẬP_DỮ_LIỆU
                        </span>
                        <div className="w-8 h-[1px] bg-brand-orange/30 group-hover/btn:w-12 transition-all duration-300"></div>
                        <span className="text-brand-orange transform group-hover/btn:translate-x-1 transition-transform duration-300 text-xs">
                          {">"}
                        </span>
                      </div>
                    </div>
                  </div>
                </StaticCyberCard>
              </Link>
            ))
          ) : (
            <div className="col-span-full border border-dashed border-brand-orange/25 bg-cyber-black/20 p-6 md:p-10 cyber-cut">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-brand-orange/30 bg-brand-orange/10 text-brand-orange cyber-cut-sm">
                  <Compass size={26} aria-hidden="true" />
                </div>

                <p className="tech-mono text-brand-orange/70 !tracking-[0.25em]">NO_MATCH_FOUND</p>
                <h3 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground mt-4">
                  Chưa tìm thấy node tri thức phù hợp
                </h3>
                <p className="body-base text-muted mt-4">
                  {hasActiveFilters ? (
                    <>
                      Bộ lọc hiện tại
                      {currentSearch && <span className="text-brand-orange">{` "${currentSearch}"`}</span>}
                      {selectedCategory && (
                        <span>
                          {' '}trong chủ đề <span className="text-brand-orange">{selectedCategory.name}</span>
                        </span>
                      )}
                      {' '}chưa có bài viết khớp. Hãy thử một chủ đề rộng hơn hoặc quay về điểm bắt đầu.
                    </>
                  ) : (
                    'Kho nội dung đang chờ dữ liệu xuất bản. Bạn có thể bắt đầu bằng các chủ đề nền tảng bên dưới.'
                  )}
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {suggestedTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => exploreTopic(topic)}
                      className="inline-flex items-center gap-2 border border-brand-orange/20 bg-brand-orange/5 px-4 py-2 tech-mono text-brand-orange transition-all hover:border-brand-orange/50 hover:bg-brand-orange/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                    >
                      <Sparkles size={14} aria-hidden="true" />
                      {topic}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={resetDiscovery}
                    className="inline-flex items-center justify-center gap-2 border border-brand-orange bg-brand-orange px-5 py-3 font-orbitron text-sm font-bold uppercase text-cyber-black transition-all hover:glow-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background cyber-cut-sm"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Xóa bộ lọc
                  </button>
                  <Link
                    href="/#start-here"
                    className="inline-flex items-center justify-center gap-2 border border-brand-orange/30 px-5 py-3 font-orbitron text-sm font-bold uppercase text-brand-orange transition-all hover:bg-brand-orange/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background cyber-cut-sm"
                  >
                    Về Start Here
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {initialPosts.length > 0 && (
          <div className="mt-16 text-center">
             <Link href="/blog" className="tech-mono text-brand-orange hover:glow-orange transition-all border border-brand-orange/30 px-10 py-4 inline-block">
                Xem toàn bộ kho lưu trữ
             </Link>
          </div>
        )}
      </div>
    </section>
  );
}
