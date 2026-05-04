'use client';

import React, { useState } from 'react';
import { seedInitialUsers } from '@/app/actions/auth-seed';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard } from '@/components/ui/CyberCard';

export default function SetupPage() {
  const [status, setStatus] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    const res = await seedInitialUsers();
    setStatus(res);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cyber-gray flex items-center justify-center p-6">
      <CyberCard className="max-w-md w-full p-8 text-center">
        <h1 className="cyber-h1 text-2xl mb-4">SYSTEM <span className="cyber-text-gradient">INITIALIZATION</span></h1>
        <p className="font-mono text-xs text-muted mb-8 uppercase tracking-widest">// AUTH_MODULE_SETUP_REQUIRED //</p>
        
        <div className="bg-cyber-black/40 border border-brand-orange/20 p-4 mb-8 text-left">
          <p className="font-mono text-[10px] text-brand-orange uppercase mb-2">Tài khoản sẽ khởi tạo:</p>
          <ul className="font-mono text-[9px] text-muted space-y-1">
            <li>- admin@kingdragon.hub (ADMIN)</li>
            <li>- user1@kingdragon.hub (USER)</li>
          </ul>
        </div>

        <CyberButton 
          variant="primary" 
          onClick={handleSeed}
          disabled={loading || status !== null}
          className="w-full"
        >
          {loading ? 'INITIALIZING...' : status ? 'INITIALIZATION COMPLETE' : 'ACTIVATE CORE ACCOUNTS'}
        </CyberButton>

        {status && (
          <div className="mt-6 text-left">
            {status.map((s, i) => (
              <p key={i} className={`font-mono text-[10px] ${s.success ? 'text-green-500' : 'text-red-500'}`}>
                {s.email}: {s.success ? 'SUCCESS' : `FAILED (${s.error})`}
              </p>
            ))}
            <p className="mt-4 font-mono text-[10px] text-brand-orange animate-pulse">
              Hệ thống đã sẵn sàng. Hãy truy cập /login để đăng nhập.
            </p>
          </div>
        )}
      </CyberCard>
    </div>
  );
}
