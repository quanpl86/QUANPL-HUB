'use client';

import React, { useTransition } from 'react';
import { toast } from 'sonner';

interface FormProps {
  action: (formData: FormData) => Promise<void>;
}

type HierarchyOption = {
  id: string;
  name: string;
};

export function FieldForm({ action }: FormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('Đã thêm lĩnh vực.');
        (document.getElementById('field-form') as HTMLFormElement)?.reset();
      } catch {
        toast.error('Không thể thêm lĩnh vực. Vui lòng thử lại.');
      }
    });
  };

  return (
    <form id="field-form" action={handleSubmit} className="admin-form">
      <div className="admin-field">
        <label>Tên lĩnh vực</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          placeholder="VD: Kỹ thuật & Công nghệ"
        />
      </div>
      <div className="admin-field">
        <label>Mô tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          placeholder="Phạm vi rộng của lĩnh vực này..."
        />
      </div>
      <button className="admin-button admin-button--primary w-full" disabled={isPending}>
        {isPending ? 'Đang thêm...' : 'Thêm lĩnh vực'}
      </button>
    </form>
  );
}

export function SubjectForm({ action, fields }: FormProps & { fields: HierarchyOption[] }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('Đã thêm chủ đề.');
        (document.getElementById('subject-form') as HTMLFormElement)?.reset();
      } catch {
        toast.error('Không thể thêm chủ đề. Vui lòng thử lại.');
      }
    });
  };

  return (
    <form id="subject-form" action={handleSubmit} className="admin-form">
      <div className="admin-field">
        <label>Lĩnh vực</label>
        <select 
          name="field_id" 
          disabled={isPending}
        >
          <option value="">-- Không có lĩnh vực --</option>
          {fields?.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div className="admin-field">
        <label>Tên chủ đề</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          placeholder="VD: Robot"
        />
      </div>
      <div className="admin-field">
        <label>Mô tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          placeholder="Trọng tâm của chủ đề..."
        />
      </div>
      <button className="admin-button admin-button--primary w-full" disabled={isPending}>
        {isPending ? 'Đang thêm...' : 'Thêm chủ đề'}
      </button>
    </form>
  );
}

export function CategoryForm({ action, subjects }: FormProps & { subjects: HierarchyOption[] }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await action(formData);
        toast.success('Đã thêm danh mục.');
        (document.getElementById('category-form') as HTMLFormElement)?.reset();
      } catch {
        toast.error('Không thể thêm danh mục. Vui lòng thử lại.');
      }
    });
  };

  return (
    <form id="category-form" action={handleSubmit} className="admin-form">
      <div className="admin-field">
        <label>Chủ đề</label>
        <select 
          name="subject_id" 
          disabled={isPending}
        >
          <option value="">-- Không có chủ đề --</option>
          {subjects?.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="admin-field">
        <label>Tên danh mục</label>
        <input 
          name="name" 
          required 
          disabled={isPending}
          placeholder="VD: Lập trình Arduino"
        />
      </div>
      <div className="admin-field">
        <label>Mô tả</label>
        <textarea 
          name="description" 
          rows={3}
          disabled={isPending}
          placeholder="Mục đích ngắn gọn của danh mục này..."
        />
      </div>
      <button className="admin-button admin-button--primary w-full" disabled={isPending}>
        {isPending ? 'Đang thêm...' : 'Thêm danh mục'}
      </button>
    </form>
  );
}
