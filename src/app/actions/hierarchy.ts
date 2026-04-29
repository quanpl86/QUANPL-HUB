'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';

// --- FIELD ACTIONS ---
export async function addField(formData: FormData) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const { error } = await supabase
    .from('fields')
    .insert([{ name, slug, description }]);

  if (error) {
    console.error('Error adding field:', error);
    return;
  }
  revalidatePath('/admin/fields');
}

export async function deleteField(id: number) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('fields').delete().eq('id', id);
  if (error) {
    console.error('Error deleting field:', error);
    return;
  }
  revalidatePath('/admin/fields');
}

// --- SUBJECT ACTIONS ---
export async function addSubject(formData: FormData) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const fieldId = formData.get('field_id') as string;
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const { error } = await supabase
    .from('subjects')
    .insert([{ 
      name, 
      slug, 
      description,
      field_id: fieldId ? parseInt(fieldId) : null
    }]);

  if (error) {
    console.error('Error adding subject:', error);
    return;
  }
  revalidatePath('/admin/subjects');
}

export async function deleteSubject(id: number) {
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) {
    console.error('Error deleting subject:', error);
    return;
  }
  revalidatePath('/admin/subjects');
}
