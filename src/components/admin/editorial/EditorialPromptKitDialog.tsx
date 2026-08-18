'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  EDITORIAL_PROMPT_KIT,
  EDITORIAL_PROMPT_KIT_NOTES,
} from '@/lib/content/editorial-prompt-kit';

export function EditorialPromptKitDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã copy. Dán vào ChatGPT.');
    } catch {
      toast.error('Không copy được. Hãy bôi đen rồi copy tay.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:p-8" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl border border-brand-orange/40 bg-white dark:bg-[#171717] p-5 md:p-8 my-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="prompt-kit-title"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="prompt-kit-title" className="font-orbitron font-bold text-xl">
              Prompt AI — KingDragonHub Editorial
            </h2>
            <p className="text-sm text-muted mt-1">Bấm Copy rồi dán một câu vào ChatGPT. Mỗi lần một việc.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-muted hover:text-brand-orange" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <ul className="text-sm text-muted mb-6 space-y-1">
          {EDITORIAL_PROMPT_KIT_NOTES.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {EDITORIAL_PROMPT_KIT.map((section) => (
            <section key={section.title}>
              <h3 className="font-semibold mb-2">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.text} className="border border-brand-orange/20 bg-slate-50 dark:bg-black/40 p-3 flex flex-col md:flex-row gap-2 md:items-start">
                    <div className="flex-1">
                      <p className="text-sm">{item.text}</p>
                      {item.note && <p className="text-xs text-muted mt-1">{item.note}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(item.text)}
                      className="px-3 py-1 border border-brand-orange text-brand-orange bg-white dark:bg-transparent text-xs uppercase shrink-0 cursor-pointer transition-colors hover:bg-brand-orange hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
