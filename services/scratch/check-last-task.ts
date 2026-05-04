import { supabase } from '../supabase-client.js';

async function main() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Lỗi:', error.message);
    return;
  }

  console.log('--- CHI TIẾT TASK VỪA XỬ LÝ ---');
  console.log(JSON.stringify(data[0], null, 2));
}

main();
