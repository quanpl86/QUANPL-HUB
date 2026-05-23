'use client';

import * as React from 'react';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getBgClass = () => {
    if (theme === 'dark') return 'bg-slate-800';
    if (theme === 'sepia') return 'bg-[#dcdbd7]'; // Muted Kindle frame
    return 'bg-slate-200';
  };

  const getThumbClass = () => {
    if (theme === 'dark') return 'left-9 bg-cyber-black';
    if (theme === 'sepia') return 'left-5 bg-[#eae9e5]'; // Neutral Kindle background
    return 'left-1 bg-white';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full p-1 transition-colors duration-500 flex items-center border-2 border-brand-orange shadow-inner group ${getBgClass()}`}
      aria-label="Toggle theme"
    >
      <div className={`
        absolute w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg
        ${getThumbClass()}
      `}>
        {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-brand-orange" />}
        {theme === 'sepia' && <BookOpen className="w-3.5 h-3.5 text-brand-orange" />}
        {theme === 'light' && <Sun className="w-3.5 h-3.5 text-brand-orange" />}
      </div>
      
      {/* Decorative scanner line */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-40">
        <div className={`w-full h-[1px] bg-brand-orange animate-[slide_3s_linear_infinite] ${theme === 'dark' ? 'opacity-100' : 'opacity-40'}`} />
      </div>
    </button>
  );
}
