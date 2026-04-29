'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight, Eye, X } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function LiveSystemLog({ logs = [] }: { logs: any[] }) {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-none overflow-hidden shadow-[8px_8px_0px_var(--card-shadow)] transition-all font-sans relative"
    >
      <div className="bg-[var(--background)] px-4 py-3 border-b-2 border-[var(--card-border)] flex justify-between items-center">
        <span className="text-[10px] font-black font-mono text-[var(--foreground)] flex items-center uppercase tracking-[0.2em] font-orbitron">
          <Terminal size={14} className="mr-3 text-brand-orange" />
          NHẬT_KÝ_HỆ_THỐNG :: TRUY_VẾT_CHI_TIẾT
        </span>
        <div className="flex gap-2">
          <span className="text-[9px] font-mono opacity-40 uppercase mr-4">Nhấp vào dòng log để xem chi tiết</span>
          <div className="w-2.5 h-2.5 rounded-none bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-none bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-none bg-green-500/50"></div>
        </div>
      </div>

      <div className="p-5 font-mono text-[11px] h-80 overflow-y-auto space-y-2 bg-[var(--card-bg)] custom-scrollbar">
        {logs.length === 0 ? (
          <p className="text-[var(--muted)] italic uppercase tracking-tighter">
            [ĐANG CHỜ] :: King Dragon đang quan sát sự tĩnh lặng...
          </p>
        ) : (
          logs.map((log, i) => (
            <div 
              key={log.id || i} 
              onClick={() => log.metadata && setSelectedLog(log)}
              className={`p-2 border border-transparent hover:border-brand-orange/30 hover:bg-brand-orange/5 cursor-pointer transition-all flex items-start gap-3 group`}
            >
              <span className="text-[10px] opacity-30 mt-0.5 shrink-0">
                [{new Date(log.created_at).toLocaleTimeString()}]
              </span>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-black uppercase tracking-tighter ${
                    log.status === 'SUCCESS' ? 'text-green-500' : 
                    log.status === 'ERROR' ? 'text-red-500' : 
                    log.status === 'GEN' ? 'text-brand-orange' : 'text-blue-500'
                  }`}>
                    {log.status === 'SUCCESS' ? '✓' : 
                     log.status === 'ERROR' ? '✗' : 
                     log.status === 'GEN' ? '✦' : '•'} {log.status}
                  </span>
                  <span className="text-[var(--muted)] font-black uppercase">[{log.node_name}]</span>
                  <span className="text-[var(--foreground)] opacity-80">{log.message}</span>
                  {log.metadata && <Eye size={12} className="text-brand-orange opacity-0 group-hover:opacity-100 ml-auto" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 bg-[var(--background)] z-10 border-l-4 border-brand-orange p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6 border-b border-[var(--card-border)] pb-4">
              <div>
                <h4 className="font-orbitron font-black text-brand-orange text-sm uppercase tracking-widest flex items-center gap-2">
                  <ChevronRight size={16} />
                  CHI TIẾT HOẠT ĐỘNG: {selectedLog.node_name}
                </h4>
                <p className="text-[9px] font-mono text-[var(--muted)] mt-1 uppercase">Thời gian: {new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-red-500 hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-950 text-green-400 border border-slate-800 rounded-none overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
              <p className="text-[var(--muted)] text-[10px] leading-relaxed italic">
                * Đây là dữ liệu thô được ghi nhận trong quá trình thực thi Automation Node.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
