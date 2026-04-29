'use server';

import { getSupabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/auth-utils';

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
  // Chỉ admin mới được quyền đổi quyền của người khác
  if (!await checkAdmin()) throw new Error('Unauthorized');
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    console.error('Error updating role:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  // Logic xóa user (Cần dùng Supabase Admin SDK vì auth.users được bảo vệ)
  // Tạm thời ta sẽ block hoặc disable profile
  if (!await checkAdmin()) throw new Error('Unauthorized');
  
  // Lưu ý: Để xóa hẳn user khỏi Auth, cần dùng getSupabaseAdmin()
}
