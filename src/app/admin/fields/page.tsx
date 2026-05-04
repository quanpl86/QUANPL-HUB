import React from 'react';
import { supabase } from '@/lib/supabase';
import { FieldForm } from '@/components/admin/HierarchyForms';
import { CyberCard } from '@/components/ui/CyberCard';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addField, deleteField } from '@/app/actions/hierarchy';

export default async function FieldsPage() {
  const { data: fields } = await supabase
    .from('fields')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <h1 className="cyber-h1 text-3xl mb-2">MA TRẬN <span className="cyber-text-gradient">LĨNH VỰC</span></h1>
        <p className="font-mono text-muted text-xs uppercase tracking-widest">// MÔ-ĐUN_ĐỊNH_NGHĨA_MIỀN_TOÀN_CẦU //</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StaticCyberCard className="p-6 h-fit">
          <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-brand-orange/20 pb-2 uppercase tracking-widest">Định Nghĩa Lĩnh Vực Mới</h2>
          <FieldForm action={addField} />
        </StaticCyberCard>

        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2 uppercase tracking-widest">Miền Đang Hoạt Động</h2>
          {fields?.map((field) => (
            <div key={field.id} className="group relative bg-cyber-black/5 dark:bg-cyber-black/40 border border-brand-orange/20 dark:border-brand-orange/10 p-4 hover:border-brand-orange/40 transition-all flex justify-between items-start cyber-cut-sm">
              <div>
                <h3 className="font-orbitron font-bold text-brand-orange text-base mb-1">{field.name}</h3>
                <p className="tech-mono text-[11px] text-foreground dark:text-muted line-clamp-2 uppercase font-bold">{field.description || 'Không có mô tả'}</p>
              </div>
              <DeleteButton id={field.id} onDelete={deleteField} label="lĩnh vực" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
