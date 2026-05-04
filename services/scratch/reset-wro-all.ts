import { supabase } from '../supabase-client.js';

async function main() {
  console.log('🔄 Đang Reset toàn bộ Task WRO...');
  
  const { error } = await supabase
    .from('content_tasks')
    .update({ 
      status: 'pending',
      logs: 'Tự động Reset với Timeout 10 phút mới.',
      updated_at: new Date().toISOString()
    })
    .ilike('topic_name', '%WRO%');

  if (error) {
    console.error('❌ Lỗi Reset:', error.message);
  } else {
    console.log('✅ Đã Reset xong. Hệ thống sẽ bắt đầu viết lại bài Blog dài.');
  }
}

main();
