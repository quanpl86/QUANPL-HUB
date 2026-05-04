'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-[90vh] dragon-grid bg-cyber-gray overflow-hidden">
      {/* Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
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
                  alt="King Dragon Mascot"
                  fill
                  className="object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                  priority
                />
              </div>

              {/* Tag */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-orange text-cyber-black font-orbitron text-[10px] font-bold px-4 py-1.5 cyber-cut-sm shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
                PROTOCOL: KD-GUIDE_V1
              </div>
            </div>
          </motion.div>

          {/* Right Side: Narrative Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-orbitron text-[10px] font-bold tracking-widest uppercase mb-4">
                <span className="w-1.5 h-1.5 bg-brand-orange animate-pulse"></span>
                Về Chúng Tôi
              </div>
              <h1 className="cyber-h1 mb-6">
                CHÀO MỪNG ĐẾN VỚI <br />
                <span className="cyber-text-gradient">KING DRAGON HUB</span>
              </h1>
            </div>

            <div className="space-y-6 font-sans text-lg text-muted leading-relaxed">
              <p>
                Xin chào! Tôi là <strong className="text-brand-orange">King Dragon</strong> — người dẫn đường của bạn trong không gian ma trận tri thức này. 
              </p>
              <p>
                <strong className="text-foreground">KING DRAGON HUB</strong> không chỉ là một blog công nghệ thông thường. Đây là một hệ sinh thái được xây dựng để kết nối những nhà khai phá, những người luôn khao khát chinh phục đỉnh cao của Lập trình, AI, Robotics và Phát triển bản thân.
              </p>
              <p>
                Với triết lý <strong className="text-foreground">Neo-Brutalist</strong> — thô mộc nhưng dứt khoát, chúng tôi tin rằng kiến thức cần được trình bày một cách trực diện, sâu sắc và có bản sắc riêng. Mỗi bài viết tại đây là một node dữ liệu quan trọng trong hành trình nâng cấp tư duy của bạn.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/blog">
                <CyberButton variant="primary">
                  Khám phá Ma trận ngay
                </CyberButton>
              </Link>
              <Link href="/">
                <CyberButton variant="outline">
                  Quay lại Trung tâm
                </CyberButton>
              </Link>
            </div>

            {/* Stats / Tech Info */}
            <div className="mt-8 pt-8 border-t border-brand-orange/10 grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="font-orbitron text-2xl font-bold text-brand-orange">99+</span>
                <span className="font-mono text-[9px] text-muted uppercase tracking-widest">Dữ liệu bài viết</span>
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron text-2xl font-bold text-brand-orange">AI</span>
                <span className="font-mono text-[9px] text-muted uppercase tracking-widest">Tối ưu hóa</span>
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron text-2xl font-bold text-brand-orange">STEM</span>
                <span className="font-mono text-[9px] text-muted uppercase tracking-widest">Tiêu chuẩn quốc tế</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
