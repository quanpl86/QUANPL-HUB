import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Layers, BookOpen, GraduationCap, Compass, Brain, Cpu, ShieldCheck } from 'lucide-react';
import { STRATEGIC_AI_CLUSTER_POSTS } from '@/components/blog/AiEducationClusterNav';

const renderIcon = (name: string) => {
  switch (name) {
    case 'compass':
      return <Compass size={18} className="text-orange-400" />;
    case 'brain':
      return <Brain size={18} className="text-purple-400" />;
    case 'school':
      return <BookOpen size={18} className="text-sky-400" />;
    case 'teacher':
      return <GraduationCap size={18} className="text-emerald-400" />;
    case 'interaction':
      return <ShieldCheck size={18} className="text-amber-400" />;
    case 'future':
      return <Cpu size={18} className="text-cyan-400" />;
    default:
      return <Layers size={18} className="text-brand-orange" />;
  }
};

export function AiEducationPillarSection() {
  return (
    <section className="border-t border-foreground/10 bg-foreground/[0.015] py-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={13} className="text-brand-orange" />
              <span>Chuyên Đề Trọng Tâm</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-inter)] tracking-tight text-foreground">
              AI trong Giáo dục & Đào tạo <span className="text-brand-orange">Thế hệ Tương lai</span>
            </h2>
            <p className="mt-4 text-base text-foreground/65 leading-relaxed">
              Tập hợp 6 công trình phân tích chiến lược, khung năng lực và phương pháp luận 5C giúp nhà trường và giáo viên chủ động làm chủ trí tuệ nhân tạo.
            </p>
          </div>

          <Link
            href="/ai-in-education"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-orange/90 transition shadow-lg shadow-brand-orange/20 self-start md:self-auto shrink-0"
          >
            <span>Khám phá Hub AI Giáo dục</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STRATEGIC_AI_CLUSTER_POSTS.map((post, idx) => (
            <article
              key={post.slug}
              className="group relative flex flex-col justify-between rounded-2xl border border-foreground/10 bg-background p-6 hover:border-brand-orange/40 hover:shadow-xl hover:shadow-brand-orange/[0.04] transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-foreground/[0.03] border border-foreground/10">
                      {renderIcon(post.iconName)}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      {post.pillar}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-foreground/30">0{idx + 1}</span>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-brand-orange transition-colors leading-snug">
                  <Link href={`/posts/${post.slug}`} className="focus:outline-none">
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2.5 text-xs text-foreground/60 leading-relaxed line-clamp-2">
                  {post.tagline}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-foreground/5 flex items-center justify-between text-xs">
                <Link
                  href={`/posts/${post.slug}`}
                  className="inline-flex items-center gap-1 font-semibold text-brand-orange group-hover:translate-x-1 transition-transform"
                >
                  <span>Đọc bài phân tích</span>
                  <ArrowRight size={13} />
                </Link>
                <span className="text-[10px] text-foreground/40 font-mono">Bản chuẩn</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
