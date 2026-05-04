import { supabase } from '../supabase-client.js';

async function main() {
  const { data, error } = await supabase
    .from('automation_notebooks')
    .select('*');

  if (error) {
    console.error('❌ Lỗi:', error.message);
    return;
  }

  console.log('--- DANH SÁCH NOTEBOOKS TRÊN SUPABASE ---');
  console.table(data);
}

main();
