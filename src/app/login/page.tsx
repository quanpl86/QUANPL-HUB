'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

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
    <main className="admin-login">
      <section className="admin-login__card" aria-labelledby="login-title">
          <div className="text-center mb-10">
            <div className="admin-login__icon">
              <ShieldCheck className="text-brand-orange w-8 h-8" />
            </div>
            <span className="admin-eyebrow">King Dragon Hub</span>
            <h1 id="login-title">Đăng nhập quản trị</h1>
            <p>Truy cập khu vực quản lý nội dung và quy trình biên tập.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="admin-email">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="email" 
                  id="admin-email"
                  required
                  autoComplete="email"
                  placeholder="email@kingdragonhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-orange transition-colors" />
                <input 
                  type="password" 
                  id="admin-password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="admin-login__error" role="alert">
                {error === 'Invalid login credentials' ? 'Email hoặc mật khẩu chưa chính xác.' : error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="admin-login__submit"
            >
              <span>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...</> : <>Đăng nhập <ArrowRight className="w-4 h-4" /></>}
              </span>
            </button>
          </form>

          <div className="admin-login__help">
            <p>
              Quên thông tin đăng nhập? Liên hệ <span>quản trị viên</span>.
            </p>
          </div>
      </section>
    </main>
  );
}
