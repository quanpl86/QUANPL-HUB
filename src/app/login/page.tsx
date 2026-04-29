'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black relative overflow-hidden px-6">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-orange blur-[150px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-cyber-gray/40 backdrop-blur-xl border-2 border-brand-orange/20 p-8 md:p-12 cyber-cut relative">
          {/* Decorative Corners */}
          <div className="absolute top-0 right-0 w-12 h-1 bg-brand-orange"></div>
          <div className="absolute bottom-0 left-0 w-12 h-1 bg-brand-orange"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-orange/10 border border-brand-orange/30 cyber-cut-sm mb-6">
              <ShieldCheck className="text-brand-orange w-8 h-8" />
            </div>
            <h1 className="font-orbitron font-bold text-3xl text-foreground uppercase tracking-wider">Xác thực <span className="text-brand-orange">Hệ thống</span></h1>
            <p className="font-mono text-[10px] text-muted uppercase tracking-[0.4em] mt-2">// CHỈ_DÀNH_CHO_NHÂN_SỰ_CÓ_THẨM_QUYỀN //</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-[10px] text-brand-orange uppercase tracking-widest ml-1">Định danh_Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="email" 
                  required
                  placeholder="nhap-email@cua-ban.com"
                  className="w-full bg-cyber-black/60 border border-brand-orange/10 focus:border-brand-orange py-4 pl-12 pr-4 font-mono text-sm text-foreground outline-none transition-all placeholder:opacity-20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] text-brand-orange uppercase tracking-widest ml-1">Mật mã_Truy cập</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-cyber-black/60 border border-brand-orange/10 focus:border-brand-orange py-4 pl-12 pr-4 font-mono text-sm text-foreground outline-none transition-all placeholder:opacity-20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-500 font-mono text-[10px] uppercase tracking-wider text-center">
                Lỗi: {error === 'Invalid login credentials' ? 'Thông tin đăng nhập không chính xác' : error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full relative py-4 group overflow-hidden mt-8"
            >
              <div className="absolute inset-0 bg-brand-orange cyber-cut-sm transition-all group-hover:glow-orange"></div>
              <span className="relative z-10 font-orbitron font-bold text-xs text-cyber-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'KHỞI TẠO ĐĂNG NHẬP'}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-brand-orange/5">
            <p className="font-mono text-[9px] text-muted uppercase tracking-widest">
              Quên thông tin truy cập? Liên hệ <span className="text-brand-orange/60">QUẢN TRỊ VIÊN</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
