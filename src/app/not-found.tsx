'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CyberButton } from '@/components/ui/CyberButton';

export default function NotFound() {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center bg-cyber-gray dragon-grid relative overflow-hidden px-6">
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 bg-brand-orange/5 pointer-events-none mix-blend-overlay"></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Error Code */}
        <div className="font-orbitron text-[150px] md:text-[200px] font-black text-brand-orange/10 absolute -top-32 select-none">
          404
        </div>

        {/* Lost Mascot */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-full h-full relative"
          >
            <Image
              src="/images/mascot.png"
              alt="Lost Mascot"
              fill
              sizes="(max-width: 768px) 256px, 320px"
              className="object-contain grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
              priority
            />
          </motion.div>
          
          {/* Static Effect */}
          <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uWUPr9WvA9RWme/giphy.gif')] opacity-10 pointer-events-none mix-blend-screen"></div>
        </div>

        <h2 className="cyber-h2 mb-4">
          <span className="text-brand-orange">ERROR_CODE:</span> LOST_IN_MATRIX
        </h2>
        
        <p className="tech-mono text-muted max-w-md mb-12 !tracking-widest leading-relaxed">
          // CẢNH BÁO: ĐƯỜNG TRUYỀN DỮ LIỆU BỊ NGẮT KẾT NỐI. <br />
          CHÚ RỒNG CỦA CHÚNG TÔI KHÔNG THỂ TÌM THẤY SECTOR NÀY TRONG HỆ THỐNG.
        </p>

        <div className="flex flex-wrap gap-6 justify-center">
          <Link href="/">
            <CyberButton variant="primary">
              Tái thiết lập kết nối (Home)
            </CyberButton>
          </Link>
          <Link href="/blog">
            <CyberButton variant="outline">
              Truy cập Kho dữ liệu
            </CyberButton>
          </Link>
        </div>
      </motion.div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent"></div>
    </div>
  );
}
