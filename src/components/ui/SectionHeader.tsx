'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  gradientText?: string;
  align?: 'left' | 'center';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  gradientText,
  align = 'left' 
}) => {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className={`mb-12 flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start'}`}
    >
      <div className="flex flex-col gap-2">
        <h2 className="cyber-h2">
          {title} {gradientText && <span className="cyber-text-gradient">{gradientText}</span>}
        </h2>
        <div className={`h-1 w-24 bg-brand-orange ${align === 'center' ? 'mx-auto' : ''}`} />
      </div>
      {subtitle && (
        <p className="font-sans text-slate-400 text-lg max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
