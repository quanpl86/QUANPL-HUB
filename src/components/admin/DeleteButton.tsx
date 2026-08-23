'use client';

import React, { useTransition, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface DeleteButtonProps<T extends string | number> {
  id: T;
  onDelete: (id: T) => Promise<void>;
  label?: string;
}

export function DeleteButton<T extends string | number>({ id, onDelete, label = 'mục' }: DeleteButtonProps<T>) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      try {
        await onDelete(id);
        toast.success(`Đã xóa ${label}.`);
        setIsOpen(false);
      } catch {
        toast.error(`Không thể xóa ${label}. Vui lòng thử lại.`);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
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

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirmDelete}
        isPending={isPending}
        title={`XÁC NHẬN XÓA ${label.toUpperCase()}`}
        description={`Bạn có chắc chắn muốn xóa ${label} này không? Hành động này sẽ loại bỏ hoàn toàn dữ liệu và không thể hoàn tác.`}
        confirmText="XÁC NHẬN XÓA"
        cancelText="HỦY BỎ"
        variant="danger"
      />
    </>
  );
}
