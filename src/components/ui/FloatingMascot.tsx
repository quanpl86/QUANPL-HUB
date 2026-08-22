'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import Image from 'next/image';

export const FloatingMascot = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          className="fixed bottom-8 right-8 z-50 group"
        >
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-brand-orange text-cyber-black font-orbitron text-[10px] font-bold px-4 py-2 cyber-cut-sm shadow-[4px_4px_0px_rgba(0,0,0,0.3)] whitespace-nowrap uppercase tracking-widest">
              Lên đầu trang
            </div>
          </div>

          <button
            onClick={scrollToTop}
            aria-label="Lên đầu trang"
            title="Lên đầu trang"
            className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-brand-orange/20 rounded-full blur-xl group-hover:bg-brand-orange/40 transition-all duration-300"></div>
            
            {/* Mascot Image */}
            <div className="relative w-full h-full p-1.5">
              <Image
                src="/images/mascot.png"
                alt=""
                fill
                sizes="(max-width: 768px) 48px, 56px"
                className="object-contain"
              />
            </div>

            {/* Small Arrow Indicator */}
            <div className="absolute -top-1 -right-1 bg-brand-orange text-cyber-black p-0.5 rounded-full border-2 border-cyber-black shadow-lg">
              <ChevronUp size={12} strokeWidth={3} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
