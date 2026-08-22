import React from 'react';
import { supabase } from '@/lib/supabase';
import { FieldForm } from '@/components/admin/HierarchyForms';
import { AdminEmptyState, AdminPageHeader, AdminPanel } from '@/components/admin/AdminUi';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addField, deleteField } from '@/app/actions/hierarchy';

export const dynamic = 'force-dynamic';

export default async function FieldsPage() {
  const { data: fields } = await supabase
    .from('fields')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="admin-page">
      <AdminPageHeader eyebrow="Taxonomy · Cấp 1" title="Quản lý" accent="lĩnh vực" description="Tạo và quản lý các miền tri thức lớn của KingDragonHub." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AdminPanel title="Thêm lĩnh vực" className="h-fit">
          <FieldForm action={addField} />
        </AdminPanel>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold">Lĩnh vực hiện có</h2>
          {fields?.map((field) => (
            <div key={field.id} className="admin-list-card">
              <div>
                <h3>{field.name}</h3><p>{field.description || 'Không có mô tả'}</p>
              </div>
              <DeleteButton id={field.id} onDelete={deleteField} label="lĩnh vực" />
            </div>
          ))}
          {!fields?.length && <AdminEmptyState title="Chưa có lĩnh vực" description="Tạo lĩnh vực đầu tiên để bắt đầu tổ chức hệ thống tri thức." />}
        </div>
      </div>
    </div>
  );
}
