'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';

export async function addCategory(formData: FormData) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const subjectId = formData.get('subject_id') as string;
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const { error } = await supabase
    .from('categories')
    .insert([{ 
      name, 
      slug, 
      description,
      subject_id: subjectId ? parseInt(subjectId) : null 
    }]);

  if (error) {
    console.error('Error adding category:', error);
    return;
  }

  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: number) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting category:', error);
    return;
  }

  revalidatePath('/admin/categories');
}
