import React from 'react';
import { supabase } from '@/lib/supabase';
import { CyberCard } from '@/components/ui/CyberCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
  const allPosts = postsRes.data || [];
  const totalPosts = allPosts.length;
  
  let seoPoints = 0;
  const maxPointsPerPost = 4;

  allPosts.forEach(post => {
    if (post.meta_title && post.meta_title.length >= 50 && post.meta_title.length <= 70) seoPoints++;
    else if (post.meta_title) seoPoints += 0.5;

    if (post.meta_description && post.meta_description.length >= 120 && post.meta_description.length <= 160) seoPoints++;
    else if (post.meta_description) seoPoints += 0.5;

    if (post.excerpt && post.excerpt.length >= 50) seoPoints++;
    if (post.image_url) seoPoints++;
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
    <div className="max-w-[1600px] mx-auto pb-10">
      <div className="mb-12">
        <span className="admin-eyebrow">Tổng quan</span>
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">Bảng <span className="cyber-text-gradient">điều khiển</span></h1>
        <p className="text-muted text-sm">Theo dõi nhanh nội dung, tương tác và chất lượng biên tập.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* CỘT 1, 2, 3: NỘI DUNG CHÍNH */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Link key={stat.label} href={stat.href}>
                <CyberCard className="p-6 hover:border-brand-orange/50 transition-all group cursor-pointer border-brand-orange/10 bg-cyber-black/5 dark:bg-cyber-black/20">
                  <p className="tech-mono text-[13px] text-brand-orange font-bold uppercase mb-3 tracking-widest">{stat.label}</p>
                  <h2 className={`font-orbitron font-bold text-5xl ${stat.color} group-hover:scale-105 transition-transform`}>{stat.count}</h2>
                </CyberCard>
              </Link>
            ))}
          </div>

          {/* Activity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recent Posts */}
            <CyberCard className="p-8">
              <h2 className="cyber-h3 !text-lg mb-8 border-b border-brand-orange/20 pb-4 text-brand-orange">Bài viết gần đây</h2>
              
              <div className="space-y-4">
                {recentPosts && recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <Link key={post.id} href={`/admin/posts/edit/${post.id}`}>
                      <div className="flex items-center gap-5 p-5 min-w-0 bg-cyber-black/5 dark:bg-cyber-black/40 border border-brand-orange/10 hover:border-brand-orange/30 transition-all group cyber-cut-sm">
                          <div className={`w-1.5 shrink-0 h-10 ${post.is_published ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-brand-orange shadow-[0_0_10px_rgba(249,115,22,0.4)]'}`}></div>
                          <div className="min-w-0">
                            <h3 className="font-orbitron font-bold text-sm text-foreground group-hover:text-brand-orange transition-colors truncate">{post.title}</h3>
                            <div className="flex gap-4 mt-2">
                              <span className="tech-mono text-[10px] text-brand-orange font-bold uppercase">[{
                                (Array.isArray(post.categories) 
                                  ? (post.categories as any)[0]?.name 
                                  : (post.categories as any)?.name) || 'Chưa phân loại'
                              }]</span>
                              <span className="tech-mono text-[10px] text-muted font-bold uppercase">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="tech-mono text-sm text-muted font-bold py-12 text-center border border-dashed border-brand-orange/20 uppercase tracking-[0.2em]">
                    Chưa có bài viết nào.
                  </div>
                )}
              </div>
            </CyberCard>

            {/* Recent Comments */}
            <CyberCard className="p-8 border-yellow-500/20">
              <h2 className="cyber-h3 !text-lg mb-8 border-b border-yellow-500/20 pb-4 text-yellow-500 dark:text-yellow-400">Bình luận gần đây</h2>
              
              <div className="space-y-4">
                {recentComments && recentComments.length > 0 ? (
                  recentComments.map((comment: any) => (
                    <div key={comment.id} className="p-5 bg-cyber-black/5 dark:bg-cyber-black/40 border border-yellow-500/20 hover:border-yellow-500/40 transition-all cyber-cut-sm">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-orbitron font-bold text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">{comment.user_name}</span>
                        <span className="tech-mono text-[10px] text-muted font-bold uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="tech-mono text-xs text-foreground line-clamp-2 leading-relaxed mb-3 italic">
                        "{comment.content}"
                      </p>
                      <div className="flex items-center gap-3 pt-3 border-t border-yellow-500/10">
                        <span className="tech-mono text-[9px] text-muted font-bold uppercase">Bài viết:</span>
                        <span className="font-orbitron font-bold text-[10px] text-brand-orange font-bold truncate uppercase tracking-tight">
                          {comment.posts?.title}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="tech-mono text-sm text-muted font-bold py-12 text-center border border-dashed border-yellow-500/20 uppercase tracking-[0.2em]">
                    Chưa có bình luận nào.
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
            <h2 className="cyber-h3 !text-sm mb-6 text-blue-600 dark:text-blue-400">Chất lượng nội dung</h2>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-end">
                <span className="tech-mono text-[13px] text-foreground font-bold uppercase">Điểm SEO</span>
                <span className={`font-orbitron font-bold text-2xl ${seoScore > 80 ? 'text-green-600 dark:text-green-400' : 'text-brand-orange'}`}>{seoScore}%</span>
              </div>
              <div className="w-full h-2 bg-cyber-black/10 dark:bg-cyber-black overflow-hidden cyber-cut-sm">
                <div 
                  className={`h-full transition-all duration-1000 ${seoScore > 80 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.6)]'}`}
                  style={{ width: `${seoScore}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-end mt-4 pt-4 border-t border-blue-500/10">
                <span className="tech-mono text-[13px] text-foreground font-bold uppercase">Độ trễ DB</span>
                <span className="font-orbitron font-bold text-lg text-blue-600 dark:text-blue-400">{dbLatency}ms</span>
              </div>
            </div>
          </CyberCard>

          {/* Widget 2: Terminal Log */}
          <CyberCard className="p-6 bg-cyber-black/5 dark:bg-cyber-black/80 border border-brand-orange/10">
            <h2 className="cyber-h3 !text-sm mb-6 text-brand-orange">Hoạt động gần đây</h2>
            <div className="tech-mono text-[11px] space-y-4 text-foreground font-bold">
              <p className="leading-relaxed"><span className="text-brand-orange font-black">20:55</span> <span className="text-green-600 dark:text-green-400">Đăng nhập:</span> Quản trị viên đã kết nối thành công.</p>
              <p className="leading-relaxed"><span className="text-brand-orange font-black">20:54</span> Đồng bộ: Cấu trúc taxonomy đã được cập nhật.</p>
              <p className="leading-relaxed"><span className="text-brand-orange font-black">20:50</span> Tất cả chức năng đang hoạt động bình thường.</p>
            </div>
          </CyberCard>

          {/* Widget 3: Quick Scratchpad */}
          <CyberCard className="p-6 border-purple-500/20">
            <h2 className="cyber-h3 !text-sm mb-6 text-purple-600 dark:text-purple-400">Ghi chú nhanh</h2>
            <textarea 
              className="w-full bg-cyber-black/5 dark:bg-cyber-black/50 border border-brand-orange/20 p-5 tech-mono text-sm text-foreground font-bold outline-none focus:border-purple-500 transition-all resize-none cyber-cut-sm placeholder:text-muted/50"
              rows={6}
              placeholder="Nhập ý tưởng hoặc từ khóa SEO tại đây..."
            />
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
