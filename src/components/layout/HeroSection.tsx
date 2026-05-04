'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { CyberButton } from '../ui/CyberButton';
import Link from 'next/link';
import Image from 'next/image';
import { BinaryRain } from '../ui/BinaryRain';
import { 
  Code, 
  MessageCircle, 
  UserCircle, 
  PlayCircle,
  Settings as SettingsIcon 
} from 'lucide-react';
import { getSiteSettings } from '@/app/actions/settings';

export const HeroSection = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<any>({
    site_tagline: 'LÀM CHỦ \nCÔNG NGHỆ',
    site_description: 'Chào mừng bạn đến với hệ sinh thái KING DRAGON HUB. Tại đây, bạn sẽ tìm thấy sức mạnh của công nghệ hiện đại nhất nhưng vẫn đậm chất cá nhân và chiều sâu bản sắc. Đây là nơi hội tụ của tương lai và những giá trị cốt lõi.'
  });

  useEffect(() => {
    setIsMounted(true);

    const loadSettings = async () => {
      const result = await getSiteSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      }
    };
    loadSettings();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative w-full min-h-[90vh] flex items-center bg-cyber-gray dragon-grid overflow-hidden">
      {/* Matrix Binary Rain */}
      <BinaryRain />

      {/* Floating Social Bar (Desktop Only) */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-20">
        <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-brand-orange/40 to-brand-orange/40 mx-auto"></div>
        {settings?.github_url && (
          <a href={settings.github_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-orange transition-all hover:scale-110">
            <Code size={18} />
          </a>
        )}
        {settings?.facebook_url && (
          <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-orange transition-all hover:scale-110">
            <MessageCircle size={18} />
          </a>
        )}
        {settings?.linkedin_url && (
          <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-orange transition-all hover:scale-110">
            <UserCircle size={18} />
          </a>
        )}
        {settings?.youtube_url && (
          <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-orange transition-all hover:scale-110">
            <PlayCircle size={18} />
          </a>
        )}
        <div className="w-[1px] h-20 bg-gradient-to-t from-transparent via-brand-orange/40 to-brand-orange/40 mx-auto"></div>
      </div>
      {/* Background Glow Effects */}
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none"
      ></motion.div>
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>

      <motion.div
        key="hero-main-container"
        variants={containerVariants}
        initial={isMounted ? "hidden" : "visible"}
        animate="visible"
        className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        {/* Left Content Area */}
        <div className="flex flex-col gap-8 max-w-2xl">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-3 bg-cyber-black/50 border-2 border-brand-orange shadow-[2px_2px_0px_#f97316] px-4 py-2 cyber-cut-sm w-fit">
            <span className="w-2 h-2 bg-brand-orange animate-pulse"></span>
            <span className="tech-mono text-brand-orange">Hệ thống Trực tuyến</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="cyber-h1">
            <span className="whitespace-pre-line leading-tight block">
              {settings.site_tagline}
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="body-lg text-muted max-w-lg">
            {settings.site_description}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-6 pt-4">
            <Link href="#explore">
              <CyberButton variant="primary">
                Khởi động Hệ thống
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </CyberButton>
            </Link>
            <Link href="/blog">
              <CyberButton variant="outline" className="border-2 border-brand-orange text-brand-orange hover:bg-brand-orange/10 dark:text-brand-orange dark:border-brand-orange">
                Xem Sơ đồ Ma trận
              </CyberButton>
            </Link>
          </motion.div>
        </div>

        {/* Right Mascot Area (Cân đối lại) */}
        <motion.div
          initial={isMounted ? { opacity: 0, x: 50 } : { opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
          className="relative h-[450px] w-full flex items-center justify-center lg:justify-end group [perspective:1000px] lg:-mt-10"
        >
          {/* Background Aura */}
          <div className="absolute w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[60px] group-hover:bg-brand-orange/10 transition-all duration-700"></div>

          <div className="relative w-96 h-96 md:w-[480px] md:h-[480px] flex items-center justify-center [transform-style:preserve-3d]">

            {/* 1. Static Orbital Path 1 */}
            <div className="absolute inset-0 border-4 border-brand-orange/70 dark:border-brand-orange/50 rounded-full [transform:rotateX(75deg)_rotateY(10deg)] shadow-[0_0_25px_rgba(249,115,22,0.3)]"></div>

            {/* Planets for Path 1 */}
            <div className="absolute inset-0 [transform:rotateX(75deg)_rotateY(10deg)]">
              <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-orange rounded-full shadow-[0_0_30px_rgba(249,115,22,1)] [transform:rotateX(-75deg)] border-2 border-white/20"></div>
              </div>
              <div className="absolute inset-0 animate-[spin_12s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-brand-orange/90 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)] [transform:rotateX(-75deg)] border-2 border-white/10"></div>
              </div>
            </div>

            {/* 2. Static Orbital Path 2 */}
            <div className="absolute inset-0 border-4 border-brand-orange/50 dark:border-brand-orange/40 rounded-full [transform:rotateX(75deg)_rotateY(-15deg)] shadow-[0_0_25px_rgba(249,115,22,0.2)]"></div>

            {/* Planets for Path 2 */}
            <div className="absolute inset-0 [transform:rotateX(75deg)_rotateY(-15deg)]">
              <div className="absolute inset-0 animate-[spin_15s_linear_infinite]">
                {/* Hành tinh trắng chuyển sang Midnight Blue ở Light Mode để tăng tương phản */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-midnight-blue dark:bg-white rounded-full shadow-[0_0_25px_rgba(15,23,42,0.5)] dark:shadow-[0_0_25px_rgba(255,255,255,1)] [transform:rotateX(-75deg)] border-2 border-brand-orange/20"></div>
              </div>
              <div className="absolute inset-0 animate-[spin_20s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-orange/70 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)] [transform:rotateX(-75deg)] border-2 border-white/10"></div>
              </div>
            </div>

            {/* 3. Central Mascot Core (Replaced Gears) */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Core Glow */}
              <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-[60px] animate-pulse"></div>

              {/* Mascot Image with Floating Animation */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="relative w-full h-full z-10"
              >
                <Image
                  src="/images/mascot.png"
                  alt="King Dragon Mascot Core"
                  fill
                  sizes="(max-width: 768px) 320px, (max-width: 1024px) 480px, 480px"
                  className="object-contain drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  priority
                />
              </motion.div>

              {/* Decorative Tech Rings */}
              <div className="absolute w-full h-full border border-brand-orange/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute w-[110%] h-[110%] border border-brand-orange/10 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
            </div>

            {/* Labels (Vị trí sát Mascot hơn) */}
            <motion.div
              initial={isMounted ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="absolute -top-4 right-0 bg-brand-orange text-cyber-black tech-mono px-3 py-1 cyber-cut-sm shadow-[0_0_15px_rgba(249,115,22,0.5)]"
            >
              TRI THỨC
            </motion.div>
          </div>

          {/* Project Message (Căn chỉnh lại độ cao) */}
          <motion.div
            initial={isMounted ? { opacity: 0 } : { opacity: 0.8 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute -bottom-4 w-full text-center lg:text-right pr-4"
          >
            <p className="tech-mono text-brand-orange !tracking-[0.4em]">
              // KHÁM PHÁ VÀ NÂNG CẤP TRI THỨC: STEM | AI | CÔNG NGHỆ | KHOA HỌC
            </p>
            <div className="h-[1px] w-32 ml-auto bg-gradient-to-r from-transparent to-brand-orange/40 mt-1"></div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
