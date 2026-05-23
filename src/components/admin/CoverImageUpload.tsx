'use client';

import React, { useRef, useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadEditorAsset } from '@/app/actions/editor-assets';
import { toast } from 'sonner';

interface CoverImageUploadProps {
  defaultValue?: string;
  onChange?: (url: string) => void;
}

export function CoverImageUpload({ defaultValue = '', onChange }: CoverImageUploadProps) {
  const [url, setUrl] = useState(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Giống với cấu hình Editor, ưu tiên upload lên github nếu có thể
      formData.append('provider', 'github'); 

      const result = await uploadEditorAsset(formData);

      if (!result.success || !('url' in result) || !result.url) {
        toast.error('error' in result ? result.error : 'Không thể tải ảnh bìa lên.');
        return;
      }

      setUrl(result.url as string);
      if (onChange) onChange(result.url as string);
      toast.success(`Đã tải ảnh bìa lên hệ thống thành công.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh bìa lên.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[10px] text-muted uppercase">URL Ảnh đại diện</label>
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 font-mono text-[9px] text-brand-orange hover:text-white transition-colors"
        >
          {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {isUploading ? 'ĐANG TẢI...' : 'TẢI ẢNH LÊN (GITHUB)'}
        </button>
      </div>
      
      <div className="relative flex items-center">
        <div className="absolute left-3 text-brand-orange/40">
          <ImageIcon size={14} />
        </div>
        <input 
          name="image_url" 
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          placeholder="https://..."
          className="w-full bg-cyber-gray border border-brand-orange/20 py-2 pl-9 pr-3 font-mono text-[10px] outline-none focus:border-brand-orange text-foreground transition-colors placeholder:text-muted/30" 
        />
      </div>
      
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
