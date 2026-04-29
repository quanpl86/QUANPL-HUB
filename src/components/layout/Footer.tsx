'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Code,
  MessageCircle,
  UserCircle,
  PlayCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { getSiteSettings } from '@/app/actions/settings';

export const Footer = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const result = await getSiteSettings();
      if (result.success && result.data) {
        setSettings(result.data);
      }
    };
    loadSettings();
  }, []);

  const currentYear = new Date().getFullYear();

  const renderLogo = () => {
    const siteTitle = settings?.site_title || 'QUANPL HUB';
    const parts = siteTitle.split(/[\s-]+/);
    if (parts.length >= 2) {
      const firstPart = parts.slice(0, -1).join('-');
      const lastPart = parts[parts.length - 1];
      return (
        <>
          <span className="bg-foreground text-background px-4 py-2 uppercase">{firstPart}</span>
          <span className="bg-brand-orange text-white px-4 py-2 uppercase">{lastPart}</span>
        </>
      );
    }
    return <span className="bg-brand-orange text-white px-5 py-2 uppercase">{siteTitle}</span>;
  };

  return (
    <footer className="relative bg-cyber-gray border-t-2 border-brand-orange/20 pt-16 pb-12 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center font-orbitron font-bold text-xl tracking-tighter overflow-hidden cyber-cut-sm w-fit">
              {renderLogo()}
            </div>
            <p className="font-sans text-sm text-muted leading-relaxed max-w-sm uppercase tracking-wider">
              {settings?.site_description || 'Hệ sinh thái tri thức cá nhân tối thượng. Khám phá sức mạnh của công nghệ hiện đại.'}
            </p>

            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              {settings?.github_url && (
                <a href={settings.github_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-cyber-black/40 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-all cyber-cut-sm">
                  <Code size={18} />
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-cyber-black/40 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-all cyber-cut-sm">
                  <MessageCircle size={18} />
                </a>
              )}
              {settings?.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-cyber-black/40 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-all cyber-cut-sm">
                  <UserCircle size={18} />
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-cyber-black/40 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white transition-all cyber-cut-sm">
                  <PlayCircle size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-orbitron font-bold text-xs text-brand-orange uppercase tracking-widest mb-6">ĐIỀU HƯỚNG</h4>
            <ul className="space-y-4 font-mono text-[11px] text-muted uppercase tracking-wider">
              <li><Link href="/blog" className="hover:text-brand-orange transition-colors duration-300 flex items-center gap-2"> {'>'} THƯ VIỆN TRI THỨC</Link></li>
              <li><Link href="/utility-hub" className="hover:text-brand-orange transition-colors duration-300 flex items-center gap-2"> {'>'} TIỆN ÍCH AI</Link></li>
              <li><Link href="/about" className="hover:text-brand-orange transition-colors duration-300 flex items-center gap-2"> {'>'} GIỚI THIỆU</Link></li>
            </ul>
          </div>

          {/* System Status */}
          <div>
            <h4 className="font-orbitron font-bold text-xs text-brand-orange uppercase tracking-widest mb-6">HỆ THỐNG</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Zap size={14} className="text-green-500 animate-pulse" />
                <span className="font-mono text-[10px] text-muted uppercase">Trạng thái: Ổn định</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={14} className="text-blue-400" />
                <span className="font-mono text-[10px] text-muted uppercase">Bảo mật: Mã hóa 256-bit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-brand-orange/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            © {currentYear} <span className="text-brand-orange font-bold">QUANPL-HUB</span>. TOÀN BỘ BẢN QUYỀN ĐƯỢC BẢO LƯU.
          </p>
          <div className="flex gap-8 font-mono text-[9px] text-muted-foreground uppercase tracking-widest">
            <span className="hover:text-brand-orange cursor-pointer transition-colors">CHÍNH SÁCH BẢO MẬT</span>
            <span className="hover:text-brand-orange cursor-pointer transition-colors">ĐIỀU KHOẢN DỊCH VỤ</span>
          </div>
        </div>
      </div>

      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/40 to-transparent"></div>
    </footer>
  );
};
