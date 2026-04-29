'use client';

import React from 'react';
import { Power, RefreshCw, HardDrive, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function ControlPanel() {
  const handleAction = (name: string) => {
    toast.info(`Executing: ${name}`, {
      description: 'Sending encrypted command to Local Worker...',
      className: 'font-mono uppercase text-[10px]',
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-1 bg-brand-orange/10 border border-brand-orange/30">
        <h3 className="font-orbitron text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 text-brand-orange border-b border-brand-orange/10">
          Neural Command Center
        </h3>
        
        <div className="grid grid-cols-2 gap-2 p-2">
          <button 
            onClick={() => handleAction('RESTART_WORKER')}
            className="flex items-center gap-3 p-4 bg-cyber-black border border-brand-orange/20 hover:border-brand-orange transition-all group"
          >
            <div className="p-2 bg-brand-orange/10 text-brand-orange group-hover:scale-110 transition-transform">
              <Power size={16} />
            </div>
            <div className="text-left">
              <span className="block font-orbitron text-[9px] font-bold uppercase tracking-widest text-foreground">Restart Worker</span>
              <span className="block font-mono text-[7px] text-muted uppercase">Reload neural links</span>
            </div>
          </button>

          <button 
            onClick={() => handleAction('FORCE_SYNC')}
            className="flex items-center gap-3 p-4 bg-cyber-black border border-brand-orange/20 hover:border-brand-orange transition-all group"
          >
            <div className="p-2 bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <RefreshCw size={16} />
            </div>
            <div className="text-left">
              <span className="block font-orbitron text-[9px] font-bold uppercase tracking-widest text-foreground">Force Sync</span>
              <span className="block font-mono text-[7px] text-muted uppercase">Sync local file system</span>
            </div>
          </button>

          <button 
            onClick={() => handleAction('PURGE_CACHE')}
            className="flex items-center gap-3 p-4 bg-cyber-black border border-brand-orange/20 hover:border-brand-orange transition-all group"
          >
            <div className="p-2 bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <HardDrive size={16} />
            </div>
            <div className="text-left">
              <span className="block font-orbitron text-[9px] font-bold uppercase tracking-widest text-foreground">Purge Cache</span>
              <span className="block font-mono text-[7px] text-muted uppercase">Clear temporary data</span>
            </div>
          </button>

          <button 
            onClick={() => handleAction('EMERGENCY_STOP')}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all group"
          >
            <div className="p-2 bg-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
              <ShieldAlert size={16} />
            </div>
            <div className="text-left">
              <span className="block font-orbitron text-[9px] font-bold uppercase tracking-widest text-red-500">Kill Session</span>
              <span className="block font-mono text-[7px] text-red-400/60 uppercase">Emergency Protocol</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 bg-cyber-gray/30 border border-brand-orange/10">
        <h4 className="font-orbitron text-[8px] font-bold uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-brand-orange" />
          Local Storage Metrics
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[7px] text-muted uppercase">
              <span>Cloud Sync Progress</span>
              <span className="text-brand-orange">84%</span>
            </div>
            <div className="h-1 bg-cyber-black border border-brand-orange/10">
              <div className="h-full bg-brand-orange w-[84%] shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[7px] text-muted uppercase">
              <span>AI Worker Load</span>
              <span className="text-blue-500">12%</span>
            </div>
            <div className="h-1 bg-cyber-black border border-blue-500/10">
              <div className="h-full bg-blue-500 w-[12%] shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
