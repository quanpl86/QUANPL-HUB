
import { supabase } from '../supabase-client.js';

async function checkTasks() {
  const targetId = '2a10272e-0754-48d1-a308-5ae93c89bcb7';
  const { data: task, error } = await supabase
    .from('content_tasks')
    .select('*')
    .eq('id', targetId)
    .single();

  if (error) {
    console.error('❌ Lỗi lấy task:', error);
    // Nếu không thấy ID cũ, liệt kê 5 task gần nhất
    const { data: recent } = await supabase.from('content_tasks').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('📊 Danh sách task gần nhất:');
    recent?.forEach(t => console.log(`- [${t.type}] ID: ${t.id} | Status: ${t.status}`));
    return;
  }

  console.log('✅ Thông tin Task Audio:');
  console.log(JSON.stringify(task, null, 2));
}

checkTasks();
checkTasks();
