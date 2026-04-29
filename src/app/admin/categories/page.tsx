import React from 'react';
import { supabase } from '@/lib/supabase';
import { CategoryForm } from '@/components/admin/HierarchyForms';
import { StaticCyberCard } from '@/components/ui/StaticCyberCard';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { addCategory, deleteCategory } from '@/app/actions/categories';

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
      <div className="mb-10">
        <h1 className="cyber-h1 text-3xl mb-2">MA TRẬN <span className="cyber-text-gradient">DANH MỤC</span></h1>
        <p className="font-mono text-muted text-xs uppercase tracking-widest">// MÔ-ĐUN_ĐỊNH_NGHĨA_KIẾN_TRÚC //</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form thêm mới */}
        <StaticCyberCard className="p-6 h-fit">
          <h2 className="font-orbitron font-bold text-sm mb-6 border-b border-brand-orange/20 pb-2 uppercase tracking-widest">Đăng Ký Danh Mục Mới</h2>
          <CategoryForm action={addCategory} subjects={subjects || []} />
        </StaticCyberCard>

        {/* Danh sách hiện có */}
        <div className="flex flex-col gap-4">
          <h2 className="font-orbitron font-bold text-sm mb-2 uppercase tracking-widest">Mô-đun Đang Hoạt Động</h2>
          {categories?.map((cat: any) => (
            <div key={cat.id} className="group relative bg-cyber-black/40 border border-brand-orange/10 p-4 hover:border-brand-orange/40 transition-all flex justify-between items-start">
              <div>
                {cat.subjects && (
                  <span className="font-mono text-[9px] text-brand-orange/60 uppercase tracking-tighter mb-1 block">
                    [{cat.subjects.name}]
                  </span>
                )}
                <h3 className="font-orbitron font-bold text-brand-orange text-sm mb-1">{cat.name}</h3>
                <p className="font-mono text-[10px] text-muted line-clamp-2 uppercase">{cat.description || 'Chưa có mô tả'}</p>
                <code className="mt-2 block font-mono text-[9px] text-brand-orange/40">ĐƯỜNG DẪN: {cat.slug}</code>
              </div>
              <DeleteButton id={cat.id} onDelete={deleteCategory} label="danh mục" />
            </div>
          ))}
          {categories?.length === 0 && (
            <p className="font-mono text-muted text-xs text-center py-10 border border-dashed border-brand-orange/20">
              // KHÔNG_TÌM_THẤY_MÔ-ĐUN //
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
