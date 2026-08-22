'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { BinaryRain } from '@/components/ui/BinaryRain';

export function HeroSection() {
  return (
    <section className="knowledge-hero dragon-grid">
      <div className="knowledge-hero-glow" aria-hidden="true" />
      <div className="container relative z-10 mx-auto grid min-h-[650px] items-center gap-10 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-orange/25 bg-brand-orange/[0.07] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-brand-orange shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-orange">Kho tri thức KingDragonHub</span>
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">King Dragon Hub</p>
          <h1 className="mt-4 max-w-[920px] text-[clamp(2.8rem,5.6vw,4.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.055em] text-foreground">
            Làm chủ công nghệ <span className="mt-2 block text-brand-orange">— Gìn giữ bản sắc</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-7 text-foreground/65">
            KingDragonHub là hệ sinh thái tri thức thực hành về AI, STEM, Robot và Công nghệ Giáo dục — tập hợp bài viết chuyên sâu, phương pháp, học liệu và công cụ giúp bạn biến kiến thức thành năng lực thực tế.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="#explore" className="primary-editorial-cta"><BookOpen size={18} />Khám phá kho tri thức<ArrowRight size={17} /></Link>
            <Link href="#knowledge-fields" className="secondary-editorial-cta"><Search size={18} />Xem bản đồ tri thức</Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-foreground/10 pt-6 text-xs text-foreground/45">
            <span><strong className="text-foreground">4</strong> lĩnh vực</span>
            <span><strong className="text-foreground">10</strong> chủ đề</span>
            <span><strong className="text-foreground">17</strong> danh mục</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="hero-mascot-scene relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center">
          <div className="hero-mascot-aura absolute inset-[26%] rounded-full bg-brand-orange/15 blur-3xl" />
          <div className="hero-tech-ring hero-tech-ring-outer absolute inset-[8%] rounded-full border border-brand-orange/20" aria-hidden="true" />
          <div className="hero-tech-ring hero-tech-ring-inner absolute inset-[18%] rounded-full border border-dashed border-foreground/10" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-one" aria-hidden="true"><span className="hero-planet hero-planet-large" /></div>
          <div className="hero-orbit hero-orbit-two" aria-hidden="true"><span className="hero-planet hero-planet-small" /></div>
          <div className="hero-mascot relative z-10 h-[78%] w-[78%]">
            <Image src="/images/mascot.png" alt="Linh vật rồng của King Dragon Hub" fill priority sizes="(max-width: 1024px) 80vw, 520px" className="object-contain drop-shadow-[0_22px_45px_rgba(249,115,22,0.24)]" />
          </div>
          <BinaryRain />
        </motion.div>
      </div>
    </section>
  );
}
