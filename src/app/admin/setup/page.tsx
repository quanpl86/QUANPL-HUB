'use client';

import React, { useState, useEffect } from 'react';
import { CyberButton } from '@/components/ui/CyberButton';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { seedCategories } from '@/app/actions/seed';
import { seedDemoPosts } from '@/app/actions/post-seed';
import { toast } from 'sonner';
import { 
  Database, 
  Zap, 
  Globe, 
  Share2, 
  Image as ImageIcon, 
  Save, 
  RefreshCw,
  Code,
  MessageCircle,
  UserCircle,
  PlayCircle
} from 'lucide-react';
import { getSiteSettings, updateSiteSettings } from '@/app/actions/settings';

export default function AdminSetupPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State cho các cài đặt
  const [settings, setSettings] = useState({
    site_title: 'QUAN-PL HUB',
    site_tagline: 'LÀM CHỦ CÔNG NGHỆ - GÌN GIỮ BẢN SẮC',
    site_description: 'Hệ sinh thái tri thức cá nhân về STEM, AI và Công nghệ.',
    favicon_url: '',
    logo_url: '',
    facebook_url: '',
    github_url: '',
    linkedin_url: '',
    youtube_url: ''
  });

  // Load dữ liệu thực tế từ Supabase
  useEffect(() => {
    const loadSettings = async () => {
      const result = await getSiteSettings();
      if (result.success && result.data) {
        setSettings(prev => ({ ...prev, ...result.data }));
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const toastId = toast.loading('ĐANG_LƯU_CẤU_HÌNH_HỆ_THỐNG...');
    try {
      const result = await updateSiteSettings(settings);
      
      if (!result.success) {
        if (result.error?.includes('relation "site_settings" does not exist')) {
          toast.error('LỖI: Bảng "site_settings" chưa được tạo trên Supabase.', { id: toastId });
          return;
        }
        throw new Error(result.error);
      }
      
      toast.success('CẬP NHẬT THÀNH CÔNG: Cấu hình hệ thống đã được đồng bộ.', { id: toastId });
    } catch (error: any) {
      toast.error(`LỖI_HỆ_THỐNG: ${error.message}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeed = async () => {
    setIsPending(true);
    try {
      toast.loading('ĐANG_KHỞI_TẠO_DÒNG_DỮ_LIỆU...');
      
      const catResult = await seedCategories();
      if (!catResult.success) throw new Error('Khởi tạo danh mục thất bại');
      
      const postResult = await seedDemoPosts();
      if (!postResult.success) throw new Error(postResult.error as string);

      toast.success(`TRUYỀN TẢI HOÀN TẤT: ${postResult.count} bài viết đã được đồng bộ.`);
    } catch (error: any) {
      toast.error(`LỖI_NGHIÊM_TRỌNG: ${error.message}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-brand-orange/20 pb-6 gap-6">
        <div>
          <h1 className="cyber-h1 text-3xl mb-2 uppercase tracking-tight">CÀI ĐẶT <span className="cyber-text-gradient">HỆ THỐNG</span></h1>
          <p className="font-mono text-muted text-xs uppercase tracking-widest">// CẤU_HÌNH_TRUNG_TÂM_ĐIỀU_HÀNH //</p>
        </div>
        <CyberButton 
          variant="primary" 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="h-12 px-8"
        >
          <Save size={18} className={isSaving ? 'animate-spin' : ''} />
          {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
        </CyberButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cấu hình chung */}
        <div className="md:col-span-2 space-y-8">
          <StaticCyberCard className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-brand-orange/10 pb-4">
              <Globe className="text-brand-orange" size={20} />
              <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider">Thông tin Cơ bản</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-[10px] text-brand-orange uppercase mb-2 tracking-widest">Tiêu đề Website</label>
                <input 
                  type="text"
                  name="site_title"
                  value={settings.site_title}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 font-sans text-sm focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
              
              <div>
                <label className="block font-mono text-[10px] text-brand-orange uppercase mb-2 tracking-widest">Khẩu hiệu (Tagline)</label>
                <input 
                  type="text"
                  name="site_tagline"
                  value={settings.site_tagline}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 font-sans text-sm focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-brand-orange uppercase mb-2 tracking-widest">Mô tả SEO</label>
                <textarea 
                  name="site_description"
                  value={settings.site_description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 font-sans text-sm focus:border-brand-orange outline-none transition-all resize-none text-foreground"
                />
              </div>
            </div>
          </StaticCyberCard>

          <StaticCyberCard className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-brand-orange/10 pb-4">
              <Share2 className="text-brand-orange" size={20} />
              <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider">Mạng xã hội</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative">
                <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  name="github_url"
                  placeholder="GitHub URL"
                  value={settings.github_url}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 pl-10 font-mono text-xs focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  name="facebook_url"
                  placeholder="Facebook URL"
                  value={settings.facebook_url}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 pl-10 font-mono text-xs focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  name="linkedin_url"
                  placeholder="LinkedIn URL"
                  value={settings.linkedin_url}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 pl-10 font-mono text-xs focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
              <div className="relative">
                <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                <input 
                  type="text"
                  name="youtube_url"
                  placeholder="YouTube URL"
                  value={settings.youtube_url}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 pl-10 font-mono text-xs focus:border-brand-orange outline-none transition-all text-foreground"
                />
              </div>
            </div>
          </StaticCyberCard>
        </div>

        {/* Sidebar Cài đặt */}
        <div className="space-y-8">
          <StaticCyberCard className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-brand-orange/10 pb-4">
              <ImageIcon className="text-brand-orange" size={20} />
              <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider">Định danh</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center p-6 border border-dashed border-brand-orange/30 bg-cyber-black/40 cyber-cut-sm">
                <div className="w-16 h-16 bg-brand-orange/10 flex items-center justify-center mb-3">
                  <Globe size={32} className="text-brand-orange/40" />
                </div>
                <p className="font-mono text-[9px] text-muted uppercase tracking-widest text-center">Bản xem trước Favicon</p>
              </div>
              
              <div>
                <label className="block font-mono text-[10px] text-brand-orange uppercase mb-2 tracking-widest">Favicon URL</label>
                <input 
                  type="text"
                  name="favicon_url"
                  value={settings.favicon_url}
                  onChange={handleInputChange}
                  className="w-full bg-cyber-black/40 border border-brand-orange/20 p-3 font-mono text-[10px] focus:border-brand-orange outline-none text-foreground"
                />
              </div>
            </div>
          </StaticCyberCard>

          <StaticCyberCard className="p-6 border-brand-orange/20">
            <div className="flex items-center gap-3 mb-4">
              <Database className="text-brand-orange/60" size={18} />
              <h3 className="font-orbitron font-bold text-[10px] uppercase tracking-widest text-muted">Dữ liệu mẫu</h3>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mb-6 leading-relaxed uppercase">
              Tạo bài viết và danh mục mẫu cho môi trường lab.
            </p>
            <CyberButton 
              variant="outline" 
              className="w-full py-2 text-[10px]" 
              onClick={handleSeed}
              disabled={isPending}
            >
              <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'ĐANG ĐỒNG BỘ...' : 'SEED_DEMO_DATA'}
            </CyberButton>
          </StaticCyberCard>
        </div>
      </div>
    </div>
  );
}
