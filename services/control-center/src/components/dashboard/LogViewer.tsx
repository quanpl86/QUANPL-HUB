'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface Log {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warn';
  timestamp: string;
}

interface Props {
  logs: Log[];
}

export function LogViewer({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-[500px] border-2 border-brand-orange/20 bg-cyber-black overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-4 py-2 border-b-2 border-brand-orange/10 bg-cyber-gray/50">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-brand-orange" />
          <h3 className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-brand-orange">System Neural Log</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/50" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
          <div className="w-2 h-2 rounded-full bg-green-500/50" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scroll-smooth"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 group">
            <span className="text-brand-orange/40 shrink-0 select-none">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span className={`
              ${log.type === 'error' ? 'text-red-500' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'warn' ? 'text-yellow-400' : ''}
              ${log.type === 'info' ? 'text-blue-400' : ''}
              leading-relaxed
            `}>
              <span className="opacity-40 mr-2">❯</span>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 animate-pulse">
            <Terminal size={40} className="mb-4" />
            <p className="font-orbitron uppercase text-[10px] tracking-widest text-center">Awaiting neural link signals...</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-1.5 border-t border-brand-orange/5 bg-brand-orange/5 flex justify-between">
        <span className="font-mono text-[8px] text-brand-orange/40 uppercase tracking-widest italic">Encrypted Session: v2.4.8-active</span>
        <span className="font-mono text-[8px] text-brand-orange/40 uppercase tracking-widest">Port: 3001</span>
      </div>
    </div>
  );
}
