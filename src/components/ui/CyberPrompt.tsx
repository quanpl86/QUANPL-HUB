'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal } from 'lucide-react';
import { CyberButton } from './CyberButton';

interface CyberPromptProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const CyberPrompt = ({ 
  isOpen, 
  title, 
  placeholder = 'Yêu cầu nhập dữ liệu...', 
  defaultValue = '', 
  onConfirm, 
  onCancel 
}: CyberPromptProps) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-cyber-black border border-brand-orange/30 shadow-[0_0_50px_rgba(255,87,34,0.15)] overflow-hidden"
          >
            {/* Decorative Header */}
            <div className="bg-brand-orange/10 px-4 py-2 border-b border-brand-orange/20 flex justify-between items-center">
              <div className="flex items-center gap-2 text-brand-orange">
                <Terminal size={14} />
                <span className="font-orbitron text-[10px] font-bold tracking-[0.2em] uppercase">{title}</span>
              </div>
              <button onClick={onCancel} className="text-muted-foreground hover:text-brand-orange transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-[2px] bg-brand-orange/40" />
                <input 
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onConfirm(value);
                    }
                  }}
                  placeholder={placeholder}
                  className="w-full bg-cyber-black border-b border-brand-orange/10 py-3 px-2 font-mono text-sm text-foreground outline-none focus:border-brand-orange transition-all placeholder:text-brand-orange/20"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={onCancel}
                  className="px-6 py-2 font-mono text-[10px] text-red-500/80 hover:text-red-700 uppercase tracking-widest transition-colors font-bold border border-transparent hover:border-red-500/20"
                >
                  [ HỦY BỎ ]
                </button>
                <CyberButton 
                  type="button" 
                  onClick={() => onConfirm(value)}
                  variant="primary" 
                  className="px-8 h-10 text-[10px]"
                >
                  XÁC NHẬN KẾT NỐI
                </CyberButton>
              </div>
            </div>

            {/* Matrix Decorative Elements */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-brand-orange/20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-brand-orange/20 pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
