import React from 'react';
import { supabase } from '@/lib/supabase';
import { SubjectForm } from '@/components/admin/HierarchyForms';
import { AdminEmptyState, AdminPageHeader, AdminPanel } from '@/components/admin/AdminUi';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addSubject, deleteSubject } from '@/app/actions/hierarchy';

export const dynamic = 'force-dynamic';

type SubjectRow = {
  id: string;
  name: string;
  description: string | null;
  fields: { name: string } | null;
};

export default async function SubjectsPage() {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*, fields(name)')
    .order('created_at', { ascending: false });

  const { data: fields } = await supabase
    .from('fields')
    .select('id, name')
    .order('name');

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Taxonomy · Cấp 2" title="Quản lý" accent="chủ đề" description="Tổ chức chủ đề bên trong từng lĩnh vực tri thức." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminPanel title="Thêm chủ đề" className="h-fit">
          <SubjectForm action={addSubject} fields={fields || []} />
        </AdminPanel>

        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2">Chủ đề hiện có</h2>
          {(subjects as SubjectRow[] | null)?.map((sub) => (
            <div key={sub.id} className="admin-list-card">
              <div>
                {sub.fields && (
                  <span className="admin-meta">{sub.fields.name}</span>
                )}
                <h3>{sub.name}</h3><p>{sub.description || 'Không có mô tả'}</p>
              </div>
              <DeleteButton id={Number(sub.id)} onDelete={deleteSubject} label="chủ đề" />
            </div>
          ))}
          {!subjects?.length && <AdminEmptyState title="Chưa có chủ đề" description="Chọn một lĩnh vực và tạo chủ đề đầu tiên." />}
        </div>
      </div>
    </div>
  );
}
