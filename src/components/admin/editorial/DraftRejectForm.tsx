'use client';

import React, { useState } from 'react';
import {
  EMPTY_DRAFT_REVISION,
  type DraftRevisionRequest,
} from '@/lib/content/editorial-draft-revision';

const FLAGS: Array<{ key: keyof DraftRevisionRequest; label: string }> = [
  { key: 'fix_content', label: 'Câu chữ / nội dung chưa đạt' },
  { key: 'fix_style', label: 'Văn phong chưa đạt' },
  { key: 'fix_cover', label: 'Ảnh bìa mờ / chưa nêu bật — tạo lại cover' },
  { key: 'fix_inline_images', label: 'Ảnh trong bài chưa đạt — tạo lại ảnh body' },
  { key: 'fix_seo', label: 'Chuẩn hoá SEO' },
  { key: 'fix_aio', label: 'Chuẩn hoá AIO' },
];

export function DraftRejectForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (request: DraftRevisionRequest) => void;
}) {
  const [request, setRequest] = useState<DraftRevisionRequest>(EMPTY_DRAFT_REVISION);
  const [seoInput, setSeoInput] = useState('');

  const toggle = (key: keyof DraftRevisionRequest) => {
    setRequest((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">ChatGPT cần sửa gì?</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {FLAGS.map((item) => (
          <label key={item.key} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(request[item.key])}
              onChange={() => toggle(item.key)}
              disabled={pending}
            />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      <div>
        <p className="text-xs text-muted mb-1">Điểm SEO cần đạt (95–100, để trống = cổng 95)</p>
        <input
          type="number"
          min={95}
          max={100}
          value={seoInput}
          disabled={pending}
          onChange={(event) => {
            setSeoInput(event.target.value);
            const n = Number(event.target.value);
            setRequest((current) => ({
              ...current,
              seo_target: Number.isFinite(n) && n >= 95 && n <= 100 ? Math.round(n) : null,
            }));
          }}
          placeholder="ví dụ 97"
          className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <textarea
        value={request.notes}
        disabled={pending}
        onChange={(event) => setRequest((current) => ({ ...current, notes: event.target.value }))}
        placeholder="Chi tiết: đoạn nào, ảnh nào, giọng văn cần ra sao..."
        className="w-full border border-brand-orange/20 bg-transparent px-3 py-2 text-sm"
        rows={3}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => onSubmit({ ...request, notes: request.notes.trim() })}
        className="px-3 py-2 border border-brand-orange text-brand-orange bg-[var(--card-bg)] font-orbitron text-xs uppercase cursor-pointer transition-colors hover:bg-brand-orange hover:text-white disabled:opacity-50"
      >
        Trả bài cho ChatGPT
      </button>
    </div>
  );
}
