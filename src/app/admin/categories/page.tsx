import React from 'react';
import { supabase } from '@/lib/supabase';
import { CategoryForm } from '@/components/admin/HierarchyForms';
import { AdminEmptyState, AdminPageHeader, AdminPanel } from '@/components/admin/AdminUi';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addCategory, deleteCategory } from '@/app/actions/categories';

export const dynamic = 'force-dynamic';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subjects: { name: string } | null;
};

export default async function CategoriesPage() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*, subjects(name)')
    .order('created_at', { ascending: false });

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .order('name');

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Taxonomy · Cấp 3" title="Quản lý" accent="danh mục" description="Quản lý lớp phân loại trực tiếp cho bài viết." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form thêm mới */}
        <AdminPanel title="Thêm danh mục" className="h-fit">
          <CategoryForm action={addCategory} subjects={subjects || []} />
        </AdminPanel>

        {/* Danh sách hiện có */}
        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2">Danh mục hiện có</h2>
          {(categories as CategoryRow[] | null)?.map((cat) => (
            <div key={cat.id} className="admin-list-card">
              <div>
                {cat.subjects && (
                  <span className="admin-meta">{cat.subjects.name}</span>
                )}
                <h3>{cat.name}</h3><p>{cat.description || 'Chưa có mô tả'}</p>
                <code className="admin-code">Slug: {cat.slug}</code>
              </div>
              <DeleteButton id={Number(cat.id)} onDelete={deleteCategory} label="danh mục" />
            </div>
          ))}
          {categories?.length === 0 && <AdminEmptyState title="Chưa có danh mục" description="Chọn một chủ đề và tạo danh mục đầu tiên." />}
        </div>
      </div>
    </div>
  );
}
