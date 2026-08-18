'use client';

import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  approveEditorialSlot,
  cancelEditorialSlot,
  requestEditorialRevision,
} from '@/app/actions/editorial-calendar';
import type { EditorialSlot } from '@/lib/content/editorial-calendar';

const LABELS: Record<string, string> = {
  proposed: 'Chờ duyệt',
  approved: 'Đã duyệt — GPT được viết',
  revision_requested: 'Yêu cầu sửa brief',
  writing: 'Đang viết',
  drafted: 'Đã có bản nháp',
  cancelled: 'Đã hủy',
};

export function EditorialCalendarBoard({ initialSlots }: { initialSlots: EditorialSlot[] }) {
  const [slots, setSlots] = useState(initialSlots);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const refresh = (updated: EditorialSlot) => {
    setSlots((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <section className="mb-16">
      <h2 className="font-orbitron font-bold text-lg uppercase tracking-widest mb-2">
        Lịch <span className="text-brand-orange">ChatGPT</span>
      </h2>
      <p className="tech-mono text-[11px] text-muted mb-6 uppercase">
        GPT đề xuất → admin duyệt hoặc yêu cầu sửa → GPT viết bài theo slot đã duyệt
      </p>
      {slots.length === 0 && (
        <div className="border border-dashed border-brand-orange/30 p-8 text-center tech-mono text-xs text-muted uppercase">
          Chưa có slot. Bảo ChatGPT gọi propose_editorial_calendar.
        </div>
      )}
      <div className="space-y-4">
        {slots.map((slot) => (
          <article key={slot.id} className="border border-brand-orange/20 p-5 bg-cyber-black/5 space-y-3">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold">{slot.title}</h3>
                <p className="tech-mono text-[11px] text-brand-orange uppercase mt-1">
                  {LABELS[slot.status]} {slot.scheduled_date ? `· ${slot.scheduled_date}` : ''}
                </p>
              </div>
              {slot.result_post_id && (
                <a
                  href={`/admin/posts/edit/${slot.result_post_id}`}
                  className="tech-mono text-[11px] text-brand-orange underline uppercase"
                >
                  Mở bản nháp
                </a>
              )}
            </div>
            <p className="text-sm">{slot.angle || slot.notes || 'Chưa có góc viết'}</p>
            <p className="tech-mono text-[11px] text-muted">
              {[slot.field, slot.subject, slot.category].filter(Boolean).join(' / ') || 'Chưa gán taxonomy'}
              {slot.tags.length ? ` · ${slot.tags.join(', ')}` : ''}
            </p>
            {slot.admin_feedback && (
              <p className="text-sm border-l-4 border-brand-orange pl-3">Feedback: {slot.admin_feedback}</p>
            )}
            {(slot.status === 'proposed' || slot.status === 'revision_requested') && (
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    try {
                      refresh(await approveEditorialSlot(slot.id));
                      toast.success('Đã duyệt. ChatGPT có thể viết bài này.');
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  })}
                  className="px-4 py-2 bg-brand-orange text-white font-orbitron text-xs uppercase"
                >
                  Duyệt
                </button>
                <input
                  value={feedback[slot.id] || ''}
                  onChange={(event) => setFeedback((current) => ({ ...current, [slot.id]: event.target.value }))}
                  placeholder="Yêu cầu hiệu chỉnh brief..."
                  className="flex-1 border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
                />
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    try {
                      refresh(await requestEditorialRevision(slot.id, feedback[slot.id] || ''));
                      toast.success('Đã gửi yêu cầu sửa. ChatGPT cần revise_editorial_slot.');
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  })}
                  className="px-4 py-2 border border-brand-orange text-brand-orange font-orbitron text-xs uppercase"
                >
                  Yêu cầu sửa
                </button>
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    try {
                      refresh(await cancelEditorialSlot(slot.id));
                      toast.success('Đã hủy slot.');
                    } catch (error: any) {
                      toast.error(error.message);
                    }
                  })}
                  className="px-4 py-2 text-red-500 font-orbitron text-xs uppercase"
                >
                  Hủy
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
