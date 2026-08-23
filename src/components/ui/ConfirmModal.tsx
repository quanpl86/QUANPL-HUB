'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isPending?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = 'Hành động này không thể hoàn tác.',
  confirmText,
  cancelText = 'HỦY BỎ',
  variant = 'danger',
  isPending = false,
}: ConfirmModalProps) {
  const getHeaderIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} className="text-red-500 animate-pulse shrink-0" />;
      case 'warning':
        return <ShieldAlert size={24} className="text-brand-orange animate-pulse shrink-0" />;
      default:
        return <CheckCircle2 size={24} className="text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'danger':
        return 'border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.25)]';
      case 'warning':
        return 'border-brand-orange/40 shadow-[0_0_40px_rgba(249,115,22,0.25)]';
      default:
        return 'border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.25)]';
    }
  };

  const getConfirmButtonStyle = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500/50';
      case 'warning':
        return 'bg-brand-orange hover:bg-brand-orange/90 text-cyber-black font-bold shadow-[0_0_15px_rgba(249,115,22,0.5)] border-brand-orange';
      default:
        return 'bg-cyan-500 hover:bg-cyan-400 text-cyber-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] border-cyan-400';
    }
  };

  const defaultTitle = variant === 'danger' ? 'XÁC NHẬN XÓA' : 'XÁC NHẬN THAO TÁC';
  const defaultConfirmText = variant === 'danger' ? 'XÁC NHẬN XÓA' : 'XÁC NHẬN';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isPending ? undefined : onClose}
            className="absolute inset-0 bg-cyber-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full max-w-md bg-cyber-black border ${getBorderColor()} rounded-lg overflow-hidden z-10 p-6`}
          >
            {/* Top Glowing Neon Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              variant === 'danger' 
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-red-600' 
                : 'bg-gradient-to-r from-brand-orange via-yellow-400 to-brand-orange'
            }`} />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyber-gray/80 border border-white/10">
                  {getHeaderIcon()}
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-sm tracking-wider uppercase text-foreground">
                    {title || defaultTitle}
                  </h3>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/70">
                    System_Safety_Prompt
                  </span>
                </div>
              </div>

              {!isPending && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content Message */}
            <div className="mb-6 bg-cyber-gray/40 border border-white/5 p-3.5 rounded">
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 bg-cyber-gray/80 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white font-mono text-xs uppercase tracking-wider rounded transition-all disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={`px-5 py-2 font-orbitron font-bold text-xs uppercase tracking-wider rounded border transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 ${getConfirmButtonStyle()}`}
              >
                {isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>ĐANG_XỬ_LÝ...</span>
                  </>
                ) : (
                  <span>{confirmText || defaultConfirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
