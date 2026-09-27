import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, GraduationCap, Compass, Brain, Cpu, ShieldCheck } from 'lucide-react';

export interface StrategicPostItem {
  slug: string;
  title: string;
  tagline: string;
  pillar: string;
  iconName: 'compass' | 'brain' | 'school' | 'teacher' | 'interaction' | 'future';
}

export const STRATEGIC_AI_CLUSTER_POSTS: StrategicPostItem[] = [
  {
    slug: 'ai-trong-giao-duc-toan-cau-vi-sao-moi-nuoc-di-mot-huong',
    title: 'AI trong giáo dục toàn cầu: Vì sao mỗi nước đi một hướng?',
    tagline: 'Phân tích chiến lược các cường quốc và định hình hướng đi giáo dục Việt Nam',
    pillar: 'Chiến lược toàn cầu',
    iconName: 'compass',
  },
  {
    slug: 'giao-duc-trong-thoi-dai-ai-dieu-gi-phai-thay-doi',
    title: 'Giáo dục trong thời đại AI: Điều gì phải thay đổi?',
    tagline: 'Định vị lại mục tiêu học tập, phương pháp giảng dạy và đánh giá thời AI',
    pillar: 'Đổi mới căn bản',
    iconName: 'brain',
  },
  {
    slug: 'ai-trong-giao-duc-pho-thong-trien-khai-tu-2026-2027',
    title: 'AI trong giáo dục phổ thông: Triển khai từ 2026–2027',
    tagline: 'Lộ trình tích hợp AI theo chuẩn GDPT 2018 và hướng dẫn theo từng cấp học',
    pillar: 'Phổ thông K-12',
    iconName: 'school',
  },
  {
    slug: 'khung-nang-luc-ai-cho-giao-vien-viet-nam-lo-trinh-24-tuan',
    title: 'Khung năng lực AI cho giáo viên Việt Nam: Lộ trình 24 tuần',
    tagline: 'Chuẩn hóa năng lực sư phạm số và giáo án thực hành cho giáo viên',
    pillar: 'Năng lực giáo viên',
    iconName: 'teacher',
  },
  {
    slug: 'khung-5c-giao-tiep-voi-ai',
    title: 'Khung 5C giao tiếp với AI: Từ prompt engineering đến tư duy phản biện',
    tagline: 'Phương pháp luận 5C giúp tương tác với mô hình AI mà không lệ thuộc',
    pillar: 'Kỹ năng tương tác',
    iconName: 'interaction',
  },
  {
    slug: 'agi-la-gi-nang-luc-ung-dung-va-tuong-lai-con-nguoi',
    title: 'AGI là gì? Năng lực, ứng dụng và tương lai con người',
    tagline: 'Tầm nhìn đón đầu kỷ nguyên siêu trí tuệ nhân tạo tổng quát',
    pillar: 'Tầm nhìn tương lai',
    iconName: 'future',
  },
];

const renderIcon = (name: StrategicPostItem['iconName']) => {
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
  }
};

export function AiEducationClusterNav({ currentSlug }: { currentSlug?: string }) {
  return (
    <aside
      aria-label="Cụm chuyên đề AI trong Giáo dục"
      className="my-12 rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/[0.06] via-background to-brand-orange/[0.02] p-6 sm:p-8 shadow-xl shadow-brand-orange/[0.03]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-orange/15">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-brand-orange animate-pulse" />
            Cụm Chuyên Đề Chiến Lược
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            AI trong Giáo dục & Đào tạo Thế hệ Tương lai
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Hệ thống 6 bài viết nền tảng định hình chiến lược, phương pháp và khung năng lực AI thực chiến.
          </p>
        </div>

        <Link
          href="/ai-in-education"
          className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-semibold tracking-wide hover:bg-brand-orange/90 transition shadow-md shadow-brand-orange/20 shrink-0"
        >
          <span>Xem AI Education Hub</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        {STRATEGIC_AI_CLUSTER_POSTS.map((item, idx) => {
          const isCurrent = item.slug === currentSlug;
          return (
            <div
              key={item.slug}
              className={`group relative flex flex-col justify-between rounded-xl p-4 transition-all duration-200 border ${
                isCurrent
                  ? 'border-brand-orange bg-brand-orange/[0.12] ring-1 ring-brand-orange/40'
                  : 'border-foreground/10 bg-foreground/[0.02] hover:border-brand-orange/40 hover:bg-foreground/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-7 w-7 rounded-lg bg-background/80 border border-foreground/10 shadow-sm">
                      {renderIcon(item.iconName)}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                      {item.pillar}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-foreground/40">0{idx + 1}</span>
                </div>

                {isCurrent ? (
                  <div className="text-sm font-bold text-brand-orange leading-snug">
                    {item.title}
                    <span className="ml-2 inline-block rounded-md bg-brand-orange/20 px-1.5 py-0.5 text-[9px] uppercase font-bold text-brand-orange tracking-wider">
                      Đang đọc
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/posts/${item.slug}`}
                    className="text-sm font-semibold text-foreground group-hover:text-brand-orange transition-colors leading-snug line-clamp-2"
                  >
                    {item.title}
                  </Link>
                )}

                <p className="mt-2 text-xs leading-relaxed text-foreground/60 line-clamp-2">
                  {item.tagline}
                </p>
              </div>

              {!isCurrent && (
                <div className="mt-3 pt-3 border-t border-foreground/5 flex items-center text-[11px] font-medium text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Đọc bài phân tích</span>
                  <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
