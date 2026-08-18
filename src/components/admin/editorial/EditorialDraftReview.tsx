'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { getEditorialSlotByPostId, rejectEditorialDraft } from '@/app/actions/editorial-calendar';
import type { EditorialSlot } from '@/lib/content/editorial-calendar';

export function EditorialDraftReview({ postId }: { postId: string }) {
  const [slot, setSlot] = useState<EditorialSlot | null>(null);
  const [note, setNote] = useState('');
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
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nếu chưa đạt: ghi vì sao và cần sửa gì"
            className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
            rows={3}
          />
          <button
            disabled={pending}
            onClick={() => startTransition(async () => {
              try {
                setSlot(await rejectEditorialDraft(slot.id, note));
                setNote('');
                toast.success('Đã trả bài. Bảo ChatGPT check tuần và sửa bài bị trả.');
              } catch (error: any) {
                toast.error(error.message);
              }
            })}
            className="px-3 py-2 border border-brand-orange text-brand-orange text-xs uppercase"
          >
            Trả bài cho ChatGPT
          </button>
          <p className="text-xs text-muted">Muốn hoàn thành task: bật Công khai bài viết rồi lưu.</p>
        </>
      )}
    </div>
  );
}
