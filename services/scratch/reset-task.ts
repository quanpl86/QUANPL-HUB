import { supabase } from '../supabase-client.js';

async function main() {
  const taskId = '2a10272e-0754-48d1-a308-5ae93c89bcb7'; // Task WRO bị lỗi
  console.log(`🔄 Đang Reset Task: ${taskId}`);
  
  const { error } = await supabase
    .from('content_tasks')
    .update({ 
      status: 'pending',
      logs: 'Reset sau khi Re-Auth thành công.',
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('❌ Lỗi Reset:', error.message);
  } else {
    console.log('✅ Đã Reset Task. Worker sẽ xử lý lại trong giây lát...');
  }
}

main();
