import React from 'react';
import { supabase } from '@/lib/supabase';
import { CategoryForm } from '@/components/admin/HierarchyForms';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addCategory, deleteCategory } from '@/app/actions/categories';

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
    <div className="max-w-4xl">
      <div className="mb-12">
        <h1 className="cyber-h1 !text-4xl md:!text-5xl mb-3">MA TRẬN <span className="cyber-text-gradient">DANH MỤC</span></h1>
        <p className="tech-mono text-brand-orange text-[11px] uppercase tracking-[0.3em] font-bold">
          {'// MÔ-ĐUN_ĐỊNH_NGHĨA_KIẾN_TRÚC //'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form thêm mới */}
        <StaticCyberCard className="p-6 h-fit border-brand-orange/25">
          <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-brand-orange/35 pb-2 uppercase tracking-widest">Đăng Ký Danh Mục Mới</h2>
          <CategoryForm action={addCategory} subjects={subjects || []} />
        </StaticCyberCard>

        {/* Danh sách hiện có */}
        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2 uppercase tracking-widest">Mô-đun Đang Hoạt Động</h2>
          {(categories as CategoryRow[] | null)?.map((cat) => (
            <div key={cat.id} className="group relative bg-cyber-black/40 border border-brand-orange/25 p-4 hover:border-brand-orange/60 transition-all flex justify-between items-start">
              <div>
                {cat.subjects && (
                  <span className="tech-mono text-[10px] text-brand-orange uppercase tracking-tight mb-2 block font-black">
                    [{cat.subjects.name}]
                  </span>
                )}
                <h3 className="font-orbitron font-bold text-brand-orange text-base mb-2">{cat.name}</h3>
                <p className="tech-mono text-[11px] text-foreground dark:text-muted line-clamp-2 uppercase tracking-wide leading-relaxed font-bold">{cat.description || 'Chưa có mô tả'}</p>
                <code className="mt-3 block tech-mono text-[10px] text-brand-orange bg-brand-orange/[0.08] dark:bg-brand-orange/5 p-1 px-2 cyber-cut-sm border border-brand-orange/30">SLUG: {cat.slug}</code>
              </div>
              <DeleteButton id={cat.id} onDelete={deleteCategory} label="danh mục" />
            </div>
          ))}
          {categories?.length === 0 && (
            <p className="font-mono text-muted text-xs text-center py-10 border border-dashed border-brand-orange/35">
              {'// KHÔNG_TÌM_THẤY_MÔ-ĐUN //'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
