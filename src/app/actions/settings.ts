'use server';

import { getSupabaseAdmin } from '@/lib/supabase';

export async function updateSiteSettings(settings: any) {
  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ 
        id: 1, 
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Lỗi khi cập nhật cài đặt:', error);
    return { success: false, error: error.message || 'Lỗi không xác định' };
  }
}

export async function getSiteSettings() {
  const supabase = getSupabaseAdmin();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error) {
      // Nếu lỗi là do bảng không tồn tại hoặc không tìm thấy bản ghi
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return { success: true, data: null };
      }
      throw error;
    }
    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Lỗi khi tải cài đặt:', error);
    return { success: false, error: error.message || 'Lỗi không xác định' };
  }
}
