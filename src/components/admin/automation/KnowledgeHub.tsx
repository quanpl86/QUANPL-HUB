'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, FileText, CheckCircle2, Circle, RefreshCw, Cloud, Globe, ExternalLink } from 'lucide-react';
import { syncVectorKnowledge, syncDriveKnowledge, getDriveKnowledgeFiles } from '@/app/actions/automation';
import { toast } from 'sonner';

export function KnowledgeHub({ files = [], selectedFiles = [], onToggleFile }: { 
  files: string[], 
  selectedFiles: string[],
  onToggleFile: (file: string) => void
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [sourceType, setSourceType] = useState<'local' | 'cloud'>('local');
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  React.useEffect(() => {
    if (sourceType === 'cloud' && driveFiles.length === 0) {
      fetchDriveFiles();
    }
  }, [sourceType]);

  const fetchDriveFiles = async () => {
    setIsLoadingDrive(true);
    try {
      const result = await getDriveKnowledgeFiles();
      if (result.success) {
        setDriveFiles(result.files || []);
      } else {
        toast.error(`LỖI_TẢI_DRIVE: ${result.error}`);
      }
    } catch (error) {
      toast.error('LỖI_KẾT_NỐI_DRIVE');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info(sourceType === 'local' ? 'ĐANG_ĐỒNG_BỘ_HÓA_VÉC_TƠ_CỤC_BỘ...' : 'ĐANG_KÉO_TRI_THỨC_TỪ_DRIVE...');
    try {
      const result = sourceType === 'local' 
        ? await syncVectorKnowledge() 
        : await syncDriveKnowledge();

      if (result.success) {
        toast.success(`ĐÃ_ĐỒNG_BỘ: ${result.count} TÀI LIỆU ĐÃ VÀO VECTOR_HUB`);
        if (sourceType === 'cloud') fetchDriveFiles();
      } else {
        toast.error(`LỖI_ĐỒNG_BỘ: ${result.error}`);
      }
    } catch (error) {
      toast.error('LỖI_KẾT_NỐI_SERVER');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="brutalist-card brutalist-card-hover">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b-2 border-[var(--card-border)] pb-6 gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-[var(--foreground)] font-orbitron">
              <Database size={24} className="text-brand-orange" />
              KNOWLEDGE_HUB
            </h2>
            <div className="flex bg-[var(--background)] border-2 border-[var(--card-border)] p-1">
              <button 
                onClick={() => setSourceType('local')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all ${sourceType === 'local' ? 'bg-brand-orange text-white' : 'text-[var(--muted)] hover:text-brand-orange'}`}
              >
                Local MCP
              </button>
              <button 
                onClick={() => setSourceType('cloud')}
                className={`px-4 py-1.5 text-[10px] font-black uppercase transition-all ${sourceType === 'cloud' ? 'bg-blue-500 text-white' : 'text-[var(--muted)] hover:text-blue-500'}`}
              >
                Cloud Drive
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-brand-orange text-brand-orange font-black text-[10px] uppercase transition-all active:scale-95 disabled:opacity-50 ${isSyncing ? 'bg-brand-orange/10' : 'hover:bg-brand-orange hover:text-white shadow-[4px_4px_0px_rgba(249,115,22,0.3)]'}`}
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'ĐANG_ĐỒNG_BỘ...' : 'SYNC_VECTOR_HUB'}
          </button>
        </div>

        {sourceType === 'local' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.length === 0 ? (
              <div className="col-span-2 py-10 text-center border-2 border-dashed border-[var(--card-border)] text-[var(--muted)] font-mono text-xs uppercase">
                Chưa có tài liệu nào trong thư mục kiến thức.
              </div>
            ) : (
              files.map((file) => (
                <div 
                  key={file}
                  onClick={() => onToggleFile(file)}
                  className={`p-4 border-2 transition-all cursor-pointer flex items-center justify-between group ${
                    selectedFiles.includes(file) 
                    ? 'border-brand-orange bg-brand-orange/5' 
                    : 'border-[var(--card-border)] bg-[var(--background)] hover:border-brand-orange/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 ${selectedFiles.includes(file) ? 'bg-brand-orange text-white' : 'bg-[var(--card-border)] text-[var(--muted)] group-hover:text-brand-orange'} transition-all`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--foreground)] uppercase truncate max-w-[200px]">{file}</p>
                      <p className="text-[9px] font-mono text-[var(--muted)] mt-1 uppercase">Định dạng: {file.split('.').pop()}</p>
                    </div>
                  </div>
                  {selectedFiles.includes(file) ? (
                    <CheckCircle2 size={18} className="text-brand-orange" />
                  ) : (
                    <Circle size={18} className="text-[var(--card-border)] group-hover:text-brand-orange/50" />
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-8 border-2 border-dashed border-blue-500/30 bg-blue-500/5 flex flex-col items-center text-center">
              <Cloud size={48} className="text-blue-500 mb-4 opacity-50" />
              <h4 className="font-orbitron font-black text-sm mb-2 text-blue-500">NOTEBOOKLM_BRIDGE_ACTIVE</h4>
              <p className="text-xs text-[var(--muted)] max-w-md font-mono uppercase tracking-tight">
                Hệ thống đang kết nối với Google Drive MCP. AI sẽ tự động truy xuất tri thức từ thư mục nguồn mà bạn đã cấu hình.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 font-mono text-[9px] font-bold border border-green-500/20">
                  <Globe size={10} /> BRIDGE_ONLINE
                </div>
                <button 
                  onClick={fetchDriveFiles}
                  className="text-[10px] font-black text-blue-500 hover:underline uppercase tracking-widest flex items-center gap-1"
                >
                  <RefreshCw size={10} className={isLoadingDrive ? 'animate-spin' : ''} />
                  QUÉT LẠI THƯ MỤC
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingDrive ? (
                <div className="col-span-full py-10 flex flex-col items-center justify-center font-mono text-[10px] text-blue-500 animate-pulse">
                  <RefreshCw size={24} className="animate-spin mb-2" />
                  ĐANG QUÉT THƯ MỤC DRIVE...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-blue-500/20 text-[var(--muted)] font-mono text-xs uppercase">
                  Không tìm thấy tài liệu nào trong thư mục Drive đã cấu hình.
                </div>
              ) : (
                driveFiles.map((file, i) => {
                  const fileKey = `DRIVE:${file.name}`;
                  const isSelected = selectedFiles.includes(fileKey);
                  
                  return (
                    <div 
                      key={file.id || i} 
                      onClick={() => onToggleFile(fileKey)}
                      className={`p-4 border-2 transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected 
                        ? 'border-blue-500 bg-blue-500/5' 
                        : 'border-[var(--card-border)] bg-[var(--background)] hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 ${isSelected ? 'bg-blue-500 text-white' : 'bg-[var(--card-border)] text-blue-500'} transition-all`}>
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <p className="text-[10px] font-black truncate uppercase text-[var(--foreground)]" title={file.name}>{file.name}</p>
                          <p className="text-[8px] font-mono opacity-50 uppercase">{file.mimeType.split('/').pop()} // CLOUD</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckCircle2 size={16} className="text-blue-500" />
                        ) : (
                          <Circle size={16} className="text-[var(--card-border)] group-hover:text-blue-500/50" />
                        )}
                        <a 
                          href={`https://drive.google.com/file/d/${file.id}/view`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-500/10"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-500/10 border-l-4 border-blue-500 text-[var(--foreground)]">
          <p className="text-[10px] font-black uppercase tracking-tight mb-2">Hướng dẫn vận hành:</p>
          <p className="text-[10px] opacity-70 leading-relaxed font-medium">
            Chọn nguồn tri thức phù hợp. Hệ thống sẽ kết hợp dữ liệu <b>Local</b> và <b>Cloud (NotebookLM)</b> để tạo ra nội dung có chiều sâu nhất.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
