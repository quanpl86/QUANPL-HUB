import { supabase } from '../supabase-client.js';

async function main() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Lỗi:', error.message);
    return;
  }

  console.log('--- DANH SÁCH BÀI VIẾT MỚI NHẤT ---');
  console.table(data);
}

main();
