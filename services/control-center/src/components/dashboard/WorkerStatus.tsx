'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Database, Wifi } from 'lucide-react';

interface Props {
  online: boolean;
  lastSeen: string | null;
  tasksCount: number;
}

export function WorkerStatus({ online, lastSeen, tasksCount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-4 border-2 border-brand-orange/20 bg-cyber-gray/50 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Wifi size={14} className={online ? 'text-green-500' : 'text-red-500'} />
          <span className="font-orbitron text-[10px] uppercase tracking-widest text-muted">Trạng thái kết nối</span>
        </div>
        <div className="flex items-end gap-2">
          <span className={`font-mono text-xl font-black ${online ? 'text-green-500' : 'text-red-500'}`}>
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className="font-mono text-[8px] text-muted mb-1">// {online ? 'Neural Link Active' : 'Link Severed'}</span>
        </div>
      </div>

      <div className="p-4 border-2 border-brand-orange/20 bg-cyber-gray/50 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={14} className="text-brand-orange" />
          <span className="font-orbitron text-[10px] uppercase tracking-widest text-muted">Tác vụ đang chờ</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-black text-brand-orange">{tasksCount}</span>
          <span className="font-mono text-[8px] text-muted mb-1">// Queue Depth</span>
        </div>
      </div>

      <div className="p-4 border-2 border-brand-orange/20 bg-cyber-gray/50 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Cpu size={14} className="text-blue-500" />
          <span className="font-orbitron text-[10px] uppercase tracking-widest text-muted">CPU Load</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-2xl font-black text-blue-500">12%</span>
          <span className="font-mono text-[8px] text-muted mb-1">// Local Node</span>
        </div>
      </div>

      <div className="p-4 border-2 border-brand-orange/20 bg-cyber-gray/50 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Database size={14} className="text-purple-500" />
          <span className="font-orbitron text-[10px] uppercase tracking-widest text-muted">Last Heartbeat</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-mono text-xs font-bold text-purple-500 truncate">
            {lastSeen ? new Date(lastSeen).toLocaleTimeString() : 'N/A'}
          </span>
          <span className="font-mono text-[8px] text-muted mb-1">// Sync Time</span>
        </div>
      </div>
    </div>
  );
}
