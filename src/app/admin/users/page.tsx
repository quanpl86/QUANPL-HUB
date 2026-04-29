import React from 'react';
import { supabase } from '@/lib/supabase';
import { CyberCard } from '@/components/ui/CyberCard';
import { UserRoleButton } from '@/components/admin/UserRoleButton';
import { updateUserRole } from '@/app/actions/users';

export default async function UsersPage() {
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl">
      <div className="mb-10">
        <h1 className="cyber-h1 text-3xl mb-2">QUYỀN HẠN <span className="cyber-text-gradient">NGƯỜI DÙNG</span></h1>
        <p className="font-mono text-muted text-xs uppercase tracking-widest">// CẤP_ĐỘ_KIỂM_SOÁT_TRUY_CẬP_4 //</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users?.map((user) => (
          <CyberCard key={user.id} className="p-6 border-brand-orange/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-orbitron font-bold text-brand-orange text-lg">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-foreground">{user.full_name || 'Người dùng ẩn danh'}</h3>
                <p className="font-mono text-[10px] text-muted uppercase tracking-widest">{user.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {/* Hiển thị Role hiện tại */}
              <div className="flex flex-col items-end">
                <span className="font-mono text-[8px] text-muted uppercase mb-1">Cấp Độ Bảo Mật</span>
                <span className={`font-orbitron font-bold text-xs uppercase px-2 py-1 ${user.role === 'admin' ? 'bg-brand-orange text-cyber-black' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </span>
              </div>

              {/* Action: Thay đổi Role */}
              <UserRoleButton 
                userId={user.id} 
                currentRole={user.role} 
                updateRole={updateUserRole} 
              />
            </div>
          </CyberCard>
        ))}

        {users?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-brand-orange/20 font-mono text-xs text-muted uppercase">
            // KHÔNG_TÌM_THẤY_HỒ_SƠ_NGƯỜI_DÙNG //
          </div>
        )}
      </div>
    </div>
  );
}
