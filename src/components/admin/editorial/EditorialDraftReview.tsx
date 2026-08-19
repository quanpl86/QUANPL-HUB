'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { getEditorialSlotByPostId, rejectEditorialDraft } from '@/app/actions/editorial-calendar';
import type { EditorialSlot } from '@/lib/content/editorial-calendar';
import { DraftRejectForm } from '@/components/admin/editorial/DraftRejectForm';

export function EditorialDraftReview({ postId }: { postId: string }) {
  const [slot, setSlot] = useState<EditorialSlot | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getEditorialSlotByPostId(postId).then(setSlot).catch(() => setSlot(null));
  }, [postId]);

  if (!slot) return null;

  const labels: Record<string, string> = {
    drafted: 'Chờ bạn đọc bài',
    revision_requested: 'Đã trả ChatGPT sửa',
    published: 'Đã đăng — task xong',
    writing: 'ChatGPT đang gửi draft',
  };

  return (
    <div className="border border-brand-orange/30 p-4 mb-6 space-y-3 bg-cyber-black/5">
      <p className="font-semibold">Bài từ lịch tuần ChatGPT</p>
      <p className="text-sm">{slot.title}</p>
      <p className="text-sm text-muted">{labels[slot.status] || slot.status}</p>
      {slot.status === 'drafted' && (
        <>
          <DraftRejectForm
            pending={pending}
            onSubmit={(request) => startTransition(async () => {
              try {
                setSlot(await rejectEditorialDraft(slot.id, request));
                toast.success('Đã trả bài. Bảo ChatGPT: kiểm tra bài bị trả rồi sửa draft.');
              } catch (error: any) {
                toast.error(error.message);
              }
            })}
          />
          <p className="text-xs text-muted">Muốn hoàn thành task: bật Công khai bài viết rồi lưu. Bài đã đăng ChatGPT không sửa được.</p>
        </>
      )}
      {slot.status === 'revision_requested' && (
        <p className="text-sm text-brand-orange">
          Đã trả ChatGPT. Nói: kiểm tra bài bị trả — đọc get_editorial_draft rồi update_blog_draft.
        </p>
      )}
    </div>
  );
}
