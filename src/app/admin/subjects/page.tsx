import React from 'react';
import { supabase } from '@/lib/supabase';
import { SubjectForm } from '@/components/admin/HierarchyForms';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addSubject, deleteSubject } from '@/app/actions/hierarchy';

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
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="cyber-h1 text-3xl mb-2">MA TRẬN <span className="cyber-text-gradient">CHỦ ĐỀ</span></h1>
        <p className="font-mono text-brand-orange text-xs uppercase tracking-widest font-bold">
          {'// MÔ-ĐUN_ĐỊNH_NGHĨA_KỶ_LUẬT //'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StaticCyberCard className="p-6 h-fit border-brand-orange/25">
          <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-brand-orange/35 pb-2 uppercase tracking-widest">Đăng Ký Chủ Đề Mới</h2>
          <SubjectForm action={addSubject} fields={fields || []} />
        </StaticCyberCard>

        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2 uppercase tracking-widest">Chủ Đề Đang Hoạt Động</h2>
          {(subjects as SubjectRow[] | null)?.map((sub) => (
            <div key={sub.id} className="group relative bg-cyber-black/5 dark:bg-cyber-black/40 border border-brand-orange/25 p-4 hover:border-brand-orange/60 transition-all flex justify-between items-start cyber-cut-sm">
              <div>
                {sub.fields && (
                  <span className="tech-mono text-[10px] text-brand-orange uppercase tracking-tight mb-2 block font-black">
                    [{sub.fields.name}]
                  </span>
                )}
                <h3 className="font-orbitron font-bold text-brand-orange text-base mb-1">{sub.name}</h3>
                <p className="tech-mono text-[11px] text-foreground dark:text-muted line-clamp-2 uppercase font-bold">{sub.description || 'Không có mô tả'}</p>
              </div>
              <DeleteButton id={sub.id} onDelete={deleteSubject} label="chủ đề" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
