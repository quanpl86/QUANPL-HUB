import React from 'react';
import { supabase } from '@/lib/supabase';
import { CyberCard } from '@/components/ui/CyberCard';
import Link from 'next/link';

export default async function AdminDashboard() {
  const startTime = performance.now();
  
  // Lấy dữ liệu thực tế từ hệ thống
  const [fieldsRes, subjectsRes, categoriesRes, postsRes, commentsCountRes, likesCountRes] = await Promise.all([
    supabase.from('fields').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('title, meta_title, meta_description, excerpt, image_url'),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase.from('likes').select('*', { count: 'exact', head: true }),
  ]);

  const dbLatency = Math.round(performance.now() - startTime);

  // Tính toán SEO Score khoa học
  // Các tiêu chí: Title (bắt buộc), Meta Title, Meta Desc, Excerpt, Image URL
  const allPosts = postsRes.data || [];
  const totalPosts = allPosts.length;
  
  let seoPoints = 0;
  const maxPointsPerPost = 4; // Meta Title, Meta Desc, Excerpt, Image

  allPosts.forEach(post => {
    // 1. Meta Title (Chuẩn 50-70 chars)
    if (post.meta_title && post.meta_title.length >= 50 && post.meta_title.length <= 70) {
      seoPoints++;
    } else if (post.meta_title) {
      seoPoints += 0.5; // Có nhưng chưa chuẩn độ dài
    }

    // 2. Meta Description (Chuẩn 120-160 chars)
    if (post.meta_description && post.meta_description.length >= 120 && post.meta_description.length <= 160) {
      seoPoints++;
    } else if (post.meta_description) {
      seoPoints += 0.5;
    }

    // 3. Excerpt (Dẫn nhập > 50 chars)
    if (post.excerpt && post.excerpt.length >= 50) {
      seoPoints++;
    }

    // 4. Image URL (Hợp lệ)
    if (post.image_url) {
      seoPoints++;
    }
  });

  const totalPossiblePoints = totalPosts * maxPointsPerPost;
  const seoScore = totalPossiblePoints > 0 
    ? Math.round((seoPoints / totalPossiblePoints) * 100) 
    : 100;

  // Lấy 5 bài viết mới nhất cho phần hoạt động
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, is_published, created_at, categories(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Lấy 5 bình luận mới nhất
  const { data: recentComments } = await supabase
    .from('comments')
    .select('*, posts(title)')
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    { label: 'Bài viết', count: totalPosts, href: '/admin/posts', color: 'text-green-400' },
    { label: 'Bình luận', count: commentsCountRes.count || 0, href: '/admin/comments', color: 'text-yellow-400' },
    { label: 'Lượt thích', count: likesCountRes.count || 0, href: '#', color: 'text-pink-400' },
    { label: 'Lĩnh vực', count: fieldsRes.count || 0, href: '/admin/fields', color: 'text-brand-orange' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-10">
        <h1 className="cyber-h1 text-3xl mb-2">TRUNG TÂM <span className="cyber-text-gradient">ĐIỀU HÀNH</span></h1>
        <p className="font-mono text-muted text-xs uppercase tracking-widest">// HỆ_THỐNG_ỔN_ĐỊNH //</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* CỘT 1, 2, 3: NỘI DUNG CHÍNH */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <CyberCard className="p-6 hover:border-brand-orange/50 transition-all group cursor-pointer border-brand-orange/10 bg-cyber-black/20">
                  <p className="font-mono text-[11px] text-brand-orange font-bold uppercase mb-2 tracking-wider">{stat.label}</p>
                  <h2 className={`font-orbitron font-bold text-4xl ${stat.color}`}>{stat.count}</h2>
                </CyberCard>
              </Link>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Posts */}
            <CyberCard className="p-8">
              <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-brand-orange/20 pb-4 uppercase tracking-widest text-brand-orange">Truyền tải gần đây</h2>
              
              <div className="space-y-4">
                {recentPosts && recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link key={post.id} href={`/admin/posts/edit/${post.id}`}>
                      <div className="flex items-center justify-between p-4 bg-cyber-black/40 border border-brand-orange/5 hover:border-brand-orange/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-8 ${post.is_published ? 'bg-green-500' : 'bg-brand-orange'}`}></div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-orbitron font-bold text-[10px] text-foreground group-hover:text-brand-orange transition-colors truncate">{post.title}</h3>
                            <div className="flex gap-3 mt-1">
                              <span className="font-mono text-[8px] text-brand-orange/60 uppercase">[{
                                (Array.isArray(post.categories) 
                                  ? (post.categories as any)[0]?.name 
                                  : (post.categories as any)?.name) || 'Chưa phân loại'
                              }]</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="font-mono text-xs text-muted font-bold py-10 text-center border border-dashed border-brand-orange/20 uppercase">
                    // TRỐNG //
                  </div>
                )}
              </div>
            </CyberCard>

            {/* Recent Comments */}
            <CyberCard className="p-8 border-yellow-500/20">
              <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-yellow-500/20 pb-4 uppercase tracking-widest text-yellow-400">Tương tác cộng đồng</h2>
              
              <div className="space-y-4">
                {recentComments && recentComments.length > 0 ? (
                  recentComments.map((comment: any) => (
                    <div key={comment.id} className="p-4 bg-cyber-black/40 border border-yellow-500/10 hover:border-yellow-500/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-orbitron font-bold text-[10px] text-yellow-400 uppercase tracking-tighter">{comment.user_name}</span>
                        <span className="font-mono text-[8px] text-muted uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="font-mono text-[10px] text-foreground/70 line-clamp-2 leading-relaxed mb-2 italic">
                        "{comment.content}"
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[8px] text-muted uppercase">BÀI VIẾT:</span>
                        <span className="font-orbitron font-bold text-[8px] text-brand-orange/60 truncate uppercase">
                          {comment.posts?.title}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="font-mono text-xs text-muted font-bold py-10 text-center border border-dashed border-yellow-500/20 uppercase">
                    // TRỐNG //
                  </div>
                )}
              </div>
            </CyberCard>
          </div>
        </div>

        {/* CỘT 4: HỆ THỐNG GIÁM SÁT (BÊN PHẢI) */}
        <div className="flex flex-col gap-6">
          {/* Widget 1: SEO & AI Health */}
          <CyberCard className="p-6 border-blue-500/30">
            <h2 className="font-orbitron font-bold text-xs mb-5 uppercase tracking-[0.2em] text-blue-400">Chỉ_số_vận_hành</h2>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[11px] text-foreground font-bold uppercase">Điểm SEO</span>
                <span className={`font-orbitron font-bold text-xl ${seoScore > 80 ? 'text-green-400' : 'text-brand-orange'}`}>{seoScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-cyber-black overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${seoScore > 80 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-brand-orange shadow-[0_0_10px_#f97316]'}`}
                  style={{ width: `${seoScore}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-end mt-2">
                <span className="font-mono text-[11px] text-foreground font-bold uppercase">Độ trễ DB</span>
                <span className="font-orbitron font-bold text-sm text-blue-400">{dbLatency}ms</span>
              </div>
            </div>
          </CyberCard>

          {/* Widget 2: Terminal Log */}
          <CyberCard className="p-6 bg-cyber-black/80">
            <h2 className="font-orbitron font-bold text-xs mb-5 uppercase tracking-[0.2em] text-brand-orange">Nhật_ký_hệ_thống</h2>
            <div className="font-mono text-[11px] space-y-3 text-foreground/80 font-medium uppercase">
              <p className="leading-relaxed"><span className="text-brand-orange font-bold">[20:55:01]</span> <span className="text-green-400">Đăng_nhập:</span> Quản trị viên KING DRAGON đã kết nối</p>
              <p className="leading-relaxed"><span className="text-brand-orange font-bold">[20:54:12]</span> Đồng_bộ: Đã triển khai Ma trận Cấp bậc V2</p>
              <p className="leading-relaxed"><span className="text-brand-orange font-bold">[20:50:33]</span> Ổn_định: Mọi mô-đun đang hoạt động</p>
            </div>
          </CyberCard>

          {/* Widget 3: Quick Scratchpad */}
          <CyberCard className="p-6">
            <h2 className="font-orbitron font-bold text-xs mb-5 uppercase tracking-[0.2em] text-purple-400">Ghi_chú_nhanh</h2>
            <textarea 
              className="w-full bg-cyber-black border border-brand-orange/20 p-4 font-mono text-[11px] text-foreground font-medium outline-none focus:border-purple-500 transition-all resize-none"
              rows={6}
              placeholder="Nhập ý tưởng hoặc từ khóa SEO tại đây..."
            />
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
