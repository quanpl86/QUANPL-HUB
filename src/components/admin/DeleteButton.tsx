'use client';

import React, { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteButtonProps<T extends string | number> {
  id: T;
  onDelete: (id: T) => Promise<void>;
  label?: string;
}

export function DeleteButton<T extends string | number>({ id, onDelete, label = 'mục' }: DeleteButtonProps<T>) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${label} này không? Hành động này không thể hoàn tác.`)) return;

    startTransition(async () => {
      try {
        await onDelete(id);
        toast.success(`Đã xóa ${label}.`);
      } catch {
        toast.error(`Không thể xóa ${label}. Vui lòng thử lại.`);
      }
    });
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="admin-button admin-button--danger !min-h-9 !w-9 !p-0"
      title={`Xóa ${label}`}
      aria-label={`Xóa ${label}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
