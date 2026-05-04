import { supabase } from '../supabase-client.js';

async function main() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('*')
    .ilike('topic_name', '%WRO%')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Lỗi:', error.message);
    return;
  }

  console.log('--- DANH SÁCH TASK WRO ---');
  console.table(data.map(t => ({
    id: t.id,
    topic: t.topic_name,
    status: t.status,
    notebook: t.notebook_id,
    updated: t.updated_at
  })));
  
  if (data[0]) {
    console.log('\n--- LOG CỦA TASK MỚI NHẤT ---');
    console.log(data[0].logs);
  }
}

main();
