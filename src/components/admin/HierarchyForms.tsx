'use client';

import React, { useTransition } from 'react';
import { CyberButton } from '@/components/ui/CyberButton';
import { toast } from 'sonner';

interface FormProps {
  action: (formData: FormData) => Promise<void>;
}

export function FieldForm({ action }: FormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('MA_TRẬN_ỔN_ĐỊNH: Lĩnh vực đã được triển khai thành công');
        // Reset form
        (document.getElementById('field-form') as HTMLFormElement)?.reset();
      } catch (error) {
        toast.error('LỖI_HỆ_THỐNG: Triển khai thất bại');
      }
    });
  };

  return (
    <form id="field-form" action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Tên Lĩnh Vực</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="VD: Kỹ thuật & Công nghệ"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Mô Tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="Phạm vi rộng của lĩnh vực này..."
        />
      </div>
      <CyberButton variant="primary" className="mt-2 w-full" disabled={isPending}>
        {isPending ? 'ĐANG TRIỂN KHAI...' : 'Triển Khai Lĩnh Vực'}
      </CyberButton>
    </form>
  );
}

export function SubjectForm({ action, fields }: FormProps & { fields: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('MA_TRẬN_ỔN_ĐỊNH: Chủ đề đã được đăng ký');
        (document.getElementById('subject-form') as HTMLFormElement)?.reset();
      } catch (error) {
        toast.error('LỖI_HỆ_THỐNG: Đăng ký thất bại');
      }
    });
  };

  return (
    <form id="subject-form" action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Lĩnh Vực Cha</label>
        <select 
          name="field_id" 
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
        >
          <option value="">-- Không có lĩnh vực --</option>
          {fields?.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Tên Chủ Đề</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="VD: Robot"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Mô Tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="Trọng tâm của chủ đề..."
        />
      </div>
      <CyberButton variant="primary" className="mt-2 w-full" disabled={isPending}>
        {isPending ? 'ĐANG TRIỂN KHAI...' : 'Triển Khai Chủ Đề'}
      </CyberButton>
    </form>
  );
}

export function CategoryForm({ action, subjects }: FormProps & { subjects: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('MA_TRẬN_ỔN_ĐỊNH: Danh mục đã được đăng ký');
        (document.getElementById('category-form') as HTMLFormElement)?.reset();
      } catch (error) {
        toast.error('LỖI_HỆ_THỐNG: Đăng ký thất bại');
      }
    });
  };

  return (
    <form id="category-form" action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Chủ Đề Cha</label>
        <select 
          name="subject_id" 
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
        >
          <option value="">-- Không có chủ đề --</option>
          {subjects?.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Tên Danh Mục</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="VD: Lập trình Arduino"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] text-brand-orange font-bold uppercase">Mô Tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          className="bg-cyber-gray border border-brand-orange/30 p-2 font-mono text-sm focus:border-brand-orange outline-none transition-all text-foreground disabled:opacity-50"
          placeholder="Mục đích ngắn gọn của danh mục này..."
        />
      </div>
      <CyberButton variant="primary" className="mt-2 w-full" disabled={isPending}>
        {isPending ? 'ĐANG TRIỂN KHAI...' : 'Triển Khai Danh Mục'}
      </CyberButton>
    </form>
  );
}
