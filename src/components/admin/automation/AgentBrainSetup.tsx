'use client';

import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export function AgentBrainSetup({ settings, onUpdate }: { settings: any[], onUpdate: (key: string, value: string) => void }) {
  const getSetting = (key: string) => settings.find(s => s.key_name === key)?.key_value || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="col-span-1 md:col-span-2 space-y-8 font-sans"
    >
      <div className="brutalist-card brutalist-card-hover">
        <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter text-[var(--foreground)] font-orbitron">
          <Cpu size={24} className="text-brand-orange drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
          THIẾT_LẬP_CẤU_HÌNH_AI
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest block mb-4">Phong cách viết & Giọng văn</label>
              <select 
                value={getSetting('WRITING_STYLE') || 'Senior Robotics Engineer (Standard)'}
                onChange={(e) => onUpdate('WRITING_STYLE', e.target.value)}
                className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] p-4 rounded-none text-sm outline-none focus:border-brand-orange text-[var(--foreground)] font-black transition-all appearance-none cursor-pointer"
              >
                <option>Kỹ sư Robot cao cấp (Mặc định)</option>
                <option>Cyberpunk Futurist (Sáng tạo)</option>
                <option>Nhà nghiên cứu học thuật (Kỹ thuật)</option>
                <option>King Dragon (Quyền lực)</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest block mb-4">Mô hình AI ưu tiên</label>
              <select 
                value={getSetting('AI_MODEL_PREFERENCE') || 'Gemini Pro'}
                onChange={(e) => onUpdate('AI_MODEL_PREFERENCE', e.target.value)}
                className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] p-4 rounded-none text-sm outline-none focus:border-brand-orange text-[var(--foreground)] font-black transition-all appearance-none cursor-pointer"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (Thinking HIGH)</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite (Thinking MINIMAL)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Khuyên dùng)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Tốc độ cao)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
              </select>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest block mb-4">Kho tri thức AI</label>
              <div className="space-y-3">
                {[
                  { name: 'Tài liệu NotebookLM', type: 'Ưu tiên 1' },
                  { name: 'DeepSearch Engine', type: 'Ưu tiên 2' },
                  { name: 'Dữ liệu Google Drive', type: 'Ưu tiên 3' },
                ].map((source, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[var(--background)] border-2 border-[var(--card-border)] rounded-none group hover:border-brand-orange transition-all">
                    <span className="text-xs font-black uppercase tracking-tight text-[var(--foreground)]">{source.name}</span>
                    <span className="text-[10px] font-black font-mono text-brand-orange uppercase">{source.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
