'use client';

import React, { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface UserRoleButtonProps {
  userId: string;
  currentRole: 'admin' | 'user';
  updateRole: (userId: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
}

export function UserRoleButton({ userId, currentRole, updateRole }: UserRoleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const confirmTitle = newRole === 'admin' ? 'CẤP QUYỀN QUẢN TRỊ' : 'THU HỒI QUYỀN QUẢN TRỊ';
  const confirmDescription = newRole === 'admin'
    ? 'Bạn có chắc chắn muốn cấp quyền quản trị viên cho người dùng này không?'
    : 'Bạn có chắc chắn muốn thu hồi quyền quản trị viên của người dùng này không?';

  const handleConfirmRoleChange = async () => {
    startTransition(async () => {
      try {
        const result = await updateRole(userId, newRole);
        if (result.success) {
          toast.success(newRole === 'admin' ? 'Đã cấp quyền quản trị.' : 'Đã thu hồi quyền quản trị.');
          setIsOpen(false);
        } else {
          toast.error(`Không thể cập nhật vai trò: ${result.error}`);
        }
      } catch {
        toast.error('Không thể cập nhật vai trò. Vui lòng thử lại.');
      }
    });
  };

  return (
    <>
      <button
        className="admin-button min-w-[132px]"
        disabled={isPending}
        onClick={() => setIsOpen(true)}
      >
        {isPending ? 'Đang cập nhật...' : currentRole === 'admin' ? 'Thu hồi quyền' : 'Cấp quyền quản trị'}
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmRoleChange}
        isPending={isPending}
        title={confirmTitle}
        description={confirmDescription}
        confirmText="XÁC NHẬN"
        cancelText="HỦY BỎ"
        variant={newRole === 'admin' ? 'warning' : 'danger'}
      />
    </>
  );
}
