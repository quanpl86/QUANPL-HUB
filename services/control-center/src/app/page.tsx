'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Radio, HardDrive, Settings, Zap } from 'lucide-react';
import { WorkerStatus } from '@/components/dashboard/WorkerStatus';
import { LogViewer } from '@/components/dashboard/LogViewer';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo client Supabase ngay tại local app
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [workerState, setWorkerState] = useState({
    online: false,
    lastSeen: null,
    tasksCount: 0
  });
  
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. Theo dõi Heartbeat và Tasks
    const fetchData = async () => {
      const [{ data: heartbeat }, { count: pendingTasks }] = await Promise.all([
        supabase.from('automation_settings').select('key_value').eq('key_name', 'MCP_WORKER_HEARTBEAT').single(),
        supabase.from('content_tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      if (heartbeat?.key_value) {
        const lastTs = new Date(heartbeat.key_value);
        const diff = Date.now() - lastTs.getTime();
        setWorkerState({
          online: diff < 120000,
          lastSeen: heartbeat.key_value,
          tasksCount: pendingTasks || 0
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    // 2. Mock some initial logs for premium feel
    setLogs([
      { id: '1', message: 'Neural link established with Supabase Cloud', type: 'success', timestamp: new Date().toISOString() },
      { id: '2', message: 'Scanning local file system for knowledge nodes...', type: 'info', timestamp: new Date().toISOString() },
      { id: '3', message: 'Worker 2.4.0 (Multi-tasking) ready on port 3000', type: 'info', timestamp: new Date().toISOString() },
    ]);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Sidebar - Industrial Minimal */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 border-r-2 border-brand-orange/10 bg-cyber-black flex flex-col items-center py-8 gap-10">
        <div className="w-10 h-10 bg-brand-orange/10 flex items-center justify-center border-2 border-brand-orange shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          <Zap size={20} className="text-brand-orange" />
        </div>
        
        <nav className="flex flex-col gap-8">
          <button className="text-brand-orange p-2 hover:bg-brand-orange/5 transition-colors">
            <LayoutDashboard size={20} />
          </button>
          <button className="text-muted p-2 hover:text-brand-orange transition-colors">
            <Radio size={20} />
          </button>
          <button className="text-muted p-2 hover:text-brand-orange transition-colors">
            <HardDrive size={20} />
          </button>
          <button className="text-muted p-2 hover:text-brand-orange transition-colors">
            <Settings size={20} />
          </button>
        </nav>
      </aside>

      {/* Main Panel */}
      <div className="pl-20 pr-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-end border-b-2 border-brand-orange/10 pb-6">
          <div>
            <h1 className="font-orbitron text-3xl font-black cyber-text-gradient tracking-tighter">CONTROL CENTER</h1>
            <p className="font-mono text-[9px] text-muted uppercase tracking-[0.4em] mt-1">// QUAN-PL AUTONOMOUS CONTENT OS v2.4 //</p>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px] text-muted uppercase">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span>System Stabilised</span>
            </div>
            <div className="w-[1px] h-4 bg-brand-orange/20" />
            <span>Encrypted Session: Active</span>
          </div>
        </div>

        {/* Stats Row */}
        <WorkerStatus 
          online={workerState.online} 
          lastSeen={workerState.lastSeen} 
          tasksCount={workerState.tasksCount} 
        />

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <LogViewer logs={logs} />
          </div>
          <div>
            <ControlPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
