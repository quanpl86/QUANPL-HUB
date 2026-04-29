'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Server } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function AutomationStats() {
  return (
    <div className="lg:col-span-1 space-y-8 font-sans">
      {/* Vital Signs Card */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="brutalist-card brutalist-card-hover"
      >
        <h3 className="text-[10px] font-black text-[var(--muted)] mb-6 tracking-[0.2em] uppercase flex items-center font-orbitron">
          <Activity size={16} className="mr-3 text-brand-orange" />
          CHỈ_SỐ_SINH_TỒN
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
              <span className="font-mono text-[var(--muted)]">Tìm kiếm AI</span>
              <span className="text-green-600 font-mono">98%</span>
            </div>
            <div className="w-full bg-[var(--background)] border border-[var(--card-border)] h-2 rounded-none overflow-hidden">
              <div className="bg-green-500 h-full w-[98%] shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
              <span className="font-mono text-[var(--muted)]">Nội dung AI</span>
              <span className="text-brand-orange font-mono">Chờ</span>
            </div>
            <div className="w-full bg-[var(--background)] border border-[var(--card-border)] h-2 rounded-none overflow-hidden">
              <div className="bg-brand-orange h-full w-[20%] shadow-[0_0_10px_rgba(255,87,34,0.3)]"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
              <span className="font-mono text-[var(--muted)]">Hình ảnh AI</span>
              <span className="text-blue-500 font-mono">Đang chạy</span>
            </div>
            <div className="w-full bg-[var(--background)] border border-[var(--card-border)] h-2 rounded-none overflow-hidden">
              <div className="bg-blue-500 h-full w-[65%] shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Core Stats Card */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="brutalist-card brutalist-card-hover"
      >
        <h3 className="text-[10px] font-black text-[var(--muted)] mb-6 tracking-[0.2em] uppercase flex items-center font-orbitron">
          <Server size={16} className="mr-3 text-blue-500" />
          THỐNG_KÊ_HỆ_THỐNG
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-[var(--background)] border-2 border-[var(--card-border)] rounded-none">
            <p className="text-[9px] text-[var(--muted)] font-black mb-2 uppercase tracking-widest">HOẠT ĐỘNG</p>
            <p className="text-xl font-black text-[var(--foreground)] font-orbitron tracking-tight">142H</p>
          </div>
          <div className="text-center p-4 bg-[var(--background)] border-2 border-[var(--card-border)] rounded-none">
            <p className="text-[9px] text-[var(--muted)] font-black mb-2 uppercase tracking-widest">YÊU CẦU</p>
            <p className="text-xl font-black text-[var(--foreground)] font-orbitron tracking-tight">1.2K</p>
          </div>
          <div className="text-center p-4 bg-[var(--background)] border-2 border-[var(--card-border)] rounded-none col-span-2">
            <p className="text-[9px] text-[var(--muted)] font-black mb-2 uppercase tracking-widest">MEDIA ĐÃ TẠO</p>
            <p className="text-xl font-black text-brand-orange font-orbitron tracking-tight text-center">42 FILE</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
