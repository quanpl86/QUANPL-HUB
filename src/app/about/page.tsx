'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="relative min-h-[90vh] overflow-hidden bg-background font-[family-name:var(--font-inter)] dragon-grid">
      {/* Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container relative z-10 mx-auto px-6 py-20 md:py-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          
          {/* Left Side: Mascot as Guide */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-72 h-72 md:w-[450px] md:h-[450px] group">
              {/* Orbital Circles */}
              <div className="absolute inset-0 border-2 border-brand-orange/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-brand-orange/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              
              <div className="relative w-full h-full p-8 transition-transform duration-500 group-hover:scale-105">
                <Image
                  src="/images/mascot.png"
                  alt="Linh vật King Dragon của KingDragonHub"
                  fill
                  sizes="(max-width: 768px) 288px, 450px"
                  className="object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                  priority
                />
              </div>

              {/* Tag */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-orange text-cyber-black tech-mono px-4 py-1.5 cyber-cut-sm shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                KING DRAGON · NGƯỜI ĐỒNG HÀNH
              </div>
            </div>
          </motion.div>

          {/* Right Side: Narrative Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-7"
          >
            <div>
              <p className="editorial-kicker"><span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />Về KingDragonHub</p>
              <h1 className="mt-4 max-w-3xl text-[clamp(2.75rem,4.4vw,4.25rem)] font-semibold uppercase leading-[1.01] tracking-[-0.05em] text-foreground">
                <span className="block xl:whitespace-nowrap">CHÀO MỪNG ĐẾN VỚI</span>
                <span className="block text-brand-orange xl:whitespace-nowrap">KING DRAGON HUB</span>
              </h1>
            </div>

            <div className="space-y-5 text-base leading-7 text-foreground/68 md:text-lg md:leading-8">
              <p>
                <strong className="text-foreground">KingDragonHub</strong> là một hệ sinh thái tri thức tập trung vào AI, STEM, Robot và Công nghệ Giáo dục.
              </p>
              <p>
                Nền tảng được xây dựng cho giáo viên, người phát triển chương trình, học sinh, đội Robot và những người muốn ứng dụng công nghệ vào học tập và sáng tạo.
              </p>
              <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/[0.05] p-5 text-base leading-7 text-foreground/70">
                <strong className="text-brand-orange">King Dragon</strong> là người đồng hành giúp bạn khám phá hệ thống, trong khi nội dung luôn giữ giọng điệu chuyên môn, trực diện và có thể áp dụng.
              </div>
              <div className="border-l-2 border-brand-orange/60 pl-5">
                <h2 className="text-sm font-semibold text-foreground">Triết lý thiết kế</h2>
                <p className="mt-2 text-base leading-7 text-foreground/65">Ngôn ngữ Neo-Brutalist tạo nên bản sắc thị giác dứt khoát; phần đọc và tương tác được ưu tiên sự rõ ràng, khả năng tiếp cận và chiều sâu nội dung.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/blog" className="primary-editorial-cta">
                Khám phá kho tri thức <ArrowRight size={17} />
              </Link>
              <Link href="/" className="secondary-editorial-cta">
                Về trang chủ
              </Link>
            </div>

            {/* Stats / Tech Info */}
            <div className="mt-8 grid grid-cols-1 gap-5 border-t border-brand-orange/10 pt-8 sm:grid-cols-3 sm:gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-brand-orange">AI</span>
                <span className="mt-1 text-xs leading-5 text-foreground/55">Hỗ trợ nghiên cứu & biên tập</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-brand-orange">STEM</span>
                <span className="mt-1 text-xs leading-5 text-foreground/55">Tham chiếu chuẩn giáo dục</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-brand-orange">4 · 10 · 17</span>
                <span className="mt-1 text-xs leading-5 text-foreground/55">Lĩnh vực · Chủ đề · Danh mục</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
