import React from 'react';
import { supabase } from '@/lib/supabase';
import { AdminEmptyState, AdminPageHeader } from '@/components/admin/AdminUi';
import { UserRoleButton } from '@/components/admin/UserRoleButton';
import { updateUserRole } from '@/app/actions/users';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Quyền truy cập" title="Quản lý" accent="người dùng" description="Kiểm tra tài khoản và phân quyền truy cập khu vực quản trị." />

      <div className="grid grid-cols-1 gap-4">
        {users?.map((user) => (
          <article key={user.id} className="admin-list-card flex-col md:flex-row md:items-center">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-brand-orange/20 bg-brand-orange/10 text-lg font-bold text-brand-orange">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3>{user.full_name || 'Người dùng chưa đặt tên'}</h3>
                <code className="admin-code">{user.id}</code>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {/* Hiển thị Role hiện tại */}
              <div className="flex flex-col items-end">
                <span className="mb-1 text-xs text-muted">Vai trò hiện tại</span>
                <span className={`admin-badge ${user.role === 'admin' ? 'admin-badge--warning' : ''}`}>
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
          </article>
        ))}

        {!users?.length && <AdminEmptyState title={error ? 'Không thể tải người dùng' : 'Chưa có hồ sơ người dùng'} description={error ? 'Kết nối dữ liệu gặp sự cố. Hãy tải lại trang hoặc kiểm tra cấu hình Supabase.' : 'Hồ sơ sẽ xuất hiện tại đây sau khi người dùng đăng nhập lần đầu.'} />}
      </div>
    </div>
  );
}
