'use client';

import React, { useTransition } from 'react';
import { toast } from 'sonner';

interface DeleteButtonProps {
  id: string | number;
  onDelete: (id: any) => Promise<void>;
  label?: string;
}

export function DeleteButton({ id, onDelete, label = 'item' }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm(`Hệ thống yêu cầu xác nhận: Bạn có chắc chắn muốn XÓA ${label.toUpperCase()} này không?`)) return;

    startTransition(async () => {
      try {
        await onDelete(id);
        toast.success(`XÓA THÀNH CÔNG: ${label.toUpperCase()} đã được loại bỏ khỏi hệ thống`);
      } catch (error) {
        toast.error(`LỖI HỆ THỐNG: Không thể thực hiện lệnh xóa ${label}`);
      }
    });
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`text-red-500/40 hover:text-red-500 transition-colors disabled:opacity-30 ${isPending ? 'animate-pulse' : ''}`}
      title={`Delete ${label}`}
    >
      {isPending ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      )}
    </button>
  );
}
