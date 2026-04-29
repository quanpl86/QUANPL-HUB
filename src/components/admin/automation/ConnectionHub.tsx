'use client';

import { motion } from 'framer-motion';
import { Key, Workflow, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionHub({ settings, onUpdate, mcpNodes = [] }: { 
  settings: any[], 
  onUpdate: (key: string, value: string) => void,
  mcpNodes: any[]
}) {
  const getSetting = (key: string) => settings.find(s => s.key_name === key)?.key_value || '';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans"
    >
      {/* API Keys Card */}
      <div className="brutalist-card brutalist-card-hover">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black flex items-center gap-3 uppercase tracking-tighter text-[var(--foreground)] font-orbitron">
            <Key size={20} className="text-brand-orange" />
            KHÓA_KẾT_NỐI
          </h2>
          <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange text-[10px] font-black border border-brand-orange/20 font-mono">ĐÃ MÃ HÓA</span>
        </div>
        
        <div className="space-y-6">
          {[
            { label: 'GEMINI API KEY (Google AI)', key: 'GEMINI_API_KEY', type: 'password', placeholder: 'Dán API Key từ AI Studio...' },
            { label: 'GOOGLE CLOUD CONSOLE (Drive/Docs)', key: 'GOOGLE_CLOUD_API_KEY', type: 'password' },
            { label: 'PERPLEXITY SEARCH (DeepSearch)', key: 'PERPLEXITY_API_KEY', type: 'password' },
            { label: 'GEMINI AI ENDPOINT', key: 'GEMINI_AI_ENDPOINT', type: 'text', placeholder: 'https://...' },
            { label: 'DRIVE FOLDER ID (NotebookLM Sources)', key: 'NOTEBOOK_OUTPUT_FOLDER_ID', type: 'text', placeholder: 'ID thư mục tri thức...' },
            { label: 'GOOGLE CALENDAR ID (Posting Schedule)', key: 'GOOGLE_CALENDAR_ID', type: 'text', placeholder: 'primary hoặc ID lịch...' },
            { label: 'MCP AUTH TOKEN (Secure Bridge)', key: 'MCP_AUTH_TOKEN', type: 'password', placeholder: 'Token bảo mật kết nối...' },
          ].map((field) => {
            const isMCPToken = field.key === 'MCP_AUTH_TOKEN';
            
            return (
              <div key={field.key} className="relative">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest block mb-2">
                  {field.label}
                </label>
                <div className="flex gap-2">
                  <input 
                    type={field.type} 
                    id={`input-${field.key}`}
                    defaultValue={getSetting(field.key)}
                    onBlur={(e) => onUpdate(field.key, e.target.value)}
                    placeholder={field.placeholder || '••••••••••••••••••••••••'}
                    className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] px-4 py-3 text-sm rounded-none focus:border-brand-orange outline-none transition-all font-mono text-[var(--foreground)] placeholder:opacity-30"
                  />
                  {isMCPToken && (
                    <div className="flex gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          const randomToken = 'KD-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                          const input = document.getElementById('input-MCP_AUTH_TOKEN') as HTMLInputElement;
                          if (input) {
                            input.value = randomToken;
                            onUpdate('MCP_AUTH_TOKEN', randomToken);
                            toast.success('Đã tạo mã bảo mật mới!');
                          }
                        }}
                        className="px-3 bg-slate-900 text-white text-[9px] font-black uppercase hover:bg-brand-orange transition-all whitespace-nowrap"
                      >
                        GEN
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('input-MCP_AUTH_TOKEN') as HTMLInputElement;
                          if (input && input.value) {
                            navigator.clipboard.writeText(input.value);
                            toast.success('Đã sao chép mã bảo mật!');
                          }
                        }}
                        className="px-3 bg-slate-100 dark:bg-white/10 text-[var(--foreground)] hover:text-brand-orange transition-all border-2 border-[var(--card-border)] flex items-center justify-center"
                        title="Sao chép mã"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-6 border-t-2 border-[var(--card-border)]">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest block mb-4">Mẫu Trích dẫn Nguồn (Citation Template)</label>
          <input 
            type="text" 
            defaultValue={getSetting('CITATION_TEMPLATE') || '[Tên file] - Cập nhật ngày [Ngày]'}
            onBlur={(e) => onUpdate('CITATION_TEMPLATE', e.target.value)}
            className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] px-4 py-3 text-xs rounded-none focus:border-brand-orange outline-none transition-all font-mono text-[var(--foreground)]"
          />
        </div>
      </div>

      {/* MCP Nodes Card */}
      <div className="brutalist-card brutalist-card-hover">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black flex items-center gap-3 uppercase tracking-tighter text-[var(--foreground)] font-orbitron">
            <Workflow size={20} className="text-blue-500" />
            CÁC_NÚT_MCP
          </h2>
          <button className="text-[10px] font-black text-brand-orange hover:underline font-mono uppercase tracking-widest">+ THÊM NÚT</button>
        </div>
        
        <div className="space-y-4">
          {mcpNodes.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-[var(--card-border)] text-[var(--muted)] font-mono text-[10px] uppercase">
              Chưa có nút MCP nào được cấu hình.
            </div>
          ) : (
            mcpNodes.map((node, i) => (
              <div key={node.id || i} className="p-4 bg-[var(--background)] border-2 border-[var(--card-border)] rounded-none flex justify-between items-center group hover:border-brand-orange transition-all">
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-[var(--foreground)]">{node.name}</p>
                  <p className="text-[10px] font-mono text-[var(--muted)] mt-1">{node.url}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-none ${node.status === 'Trực tuyến' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`}></span>
                  <span className="text-[10px] font-black font-mono uppercase tracking-tighter text-[var(--muted)]">{node.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
