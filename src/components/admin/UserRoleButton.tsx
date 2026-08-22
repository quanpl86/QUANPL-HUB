'use client';

import React, { useTransition } from 'react';
import { toast } from 'sonner';

interface UserRoleButtonProps {
  userId: string;
  currentRole: 'admin' | 'user';
  updateRole: (userId: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
}

export function UserRoleButton({ userId, currentRole, updateRole }: UserRoleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = newRole === 'admin'
      ? 'Cấp quyền quản trị cho người dùng này?'
      : 'Thu hồi quyền quản trị của người dùng này?';
    
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        const result = await updateRole(userId, newRole);
        if (result.success) {
          toast.success(newRole === 'admin' ? 'Đã cấp quyền quản trị.' : 'Đã thu hồi quyền quản trị.');
        } else {
          toast.error(`Không thể cập nhật vai trò: ${result.error}`);
        }
      } catch {
        toast.error('Không thể cập nhật vai trò. Vui lòng thử lại.');
      }
    });
  };

  return (
    <button
      className="admin-button min-w-[132px]"
      disabled={isPending}
      onClick={handleToggle}
    >
      {isPending ? 'Đang cập nhật...' : currentRole === 'admin' ? 'Thu hồi quyền' : 'Cấp quyền quản trị'}
    </button>
  );
}
