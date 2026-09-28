'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyShortLinkButtonProps {
  urlPath: string; // e.g. "/lop/control"
  label?: string;
  className?: string;
}

export function CopyShortLinkButton({ urlPath, label, className = '' }: CopyShortLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = `https://kingdragonhub.com${urlPath}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success(`Đã sao chép liên kết: ${fullUrl}`, {
        description: 'Bạn có thể gửi ngay link này qua Zalo, Messenger hoặc Email.',
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Sao chép link: ${fullUrl}`}
      className={`group inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-2.5 py-1 text-xs font-mono text-foreground/80 hover:bg-foreground/[0.08] hover:border-brand-orange/50 hover:text-brand-orange transition-all cursor-pointer select-none ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-emerald-500 font-sans font-semibold text-[11px]">Đã chép link!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-foreground/45 group-hover:text-brand-orange shrink-0 transition-colors" />
          <span>{label || fullUrl.replace('https://', '')}</span>
        </>
      )}
    </button>
  );
}
