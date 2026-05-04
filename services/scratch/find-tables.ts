import { supabase } from '../supabase-client.js';

async function main() {
  const { data, error } = await supabase.rpc('get_tables'); // Giả định có rpc này hoặc dùng cách khác
  
  // Cách chuẩn để lấy schema nếu không có RPC:
  const { data: tables, error: err } = await supabase
    .from('content_tasks')
    .select('id')
    .limit(1);
    
  console.log('--- KIỂM TRA SCHEMA ---');
  // Thử query một số bảng phổ biến
  const tablesToTry = ['posts', 'draft_posts', 'content_posts', 'automation_posts'];
  for (const table of tablesToTry) {
    const { error } = await supabase.from(table).select('count').limit(1);
    if (!error) console.log(`✅ Tìm thấy bảng: ${table}`);
  }
}

main();
