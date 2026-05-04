'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, SlidersHorizontal, X } from 'lucide-react';
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

export function ExploreContent({ initialPosts, categories, title, subtitle = 'TÌM_KIẾM_LỌC_SẮP_XẾP_SẴN_SÀNG' }: ExploreContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  
  const [searchValue, setSearchValue] = useState(currentSearch);

  // Sorting Logic
  const sortedPosts = [...initialPosts].sort((a, b) => {
    if (currentSort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (currentSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (currentSort === 'az') return a.title.localeCompare(b.title);
    return 0;
  });

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'newest') {
        params.set(key, value);
      } else if (value === 'all' || value === 'newest') {
        params.delete(key);
      }
    });
    router.push(`${window.location.pathname}?${params.toString()}#explore`, { scroll: false });
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
            <p className="tech-mono text-muted !text-[9px] mt-2 tracking-[0.4em]">// {subtitle} //</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="group">
                <StaticCyberCard className="h-full border-brand-orange/5 hover:border-brand-orange/20 transition-all duration-500">
                  <div className="aspect-[16/9] overflow-hidden bg-brand-orange/5 relative">
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
                       <span className="text-[8px] font-mono bg-brand-orange/20 text-brand-orange px-2 py-0.5">CÔNG KHAI</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="tech-mono text-brand-orange/60 block mb-2 !text-[9px]">[{post.categories?.name || 'BẢN GHI'}]</span>
                    <h3 className="cyber-h3 mb-4 group-hover:text-brand-orange transition-colors line-clamp-2 !tracking-tight">{post.title}</h3>
                    <div className="flex items-center gap-2 tech-mono text-muted !text-[9px]">
                      <Calendar size={12} />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </StaticCyberCard>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border border-dashed border-brand-orange/20 bg-cyber-black/10">
              <p className="tech-mono text-muted !tracking-[0.5em]">// KHÔNG_CÓ_DỮ_LIỆU_PHÙ_HỢP //</p>
              <button 
                onClick={() => { setSearchValue(''); updateParams({ category: 'all' }); }}
                className="mt-6 tech-mono text-brand-orange hover:glow-orange underline"
              >
                Khởi tạo lại ma trận
              </button>
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
