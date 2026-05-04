import { supabase } from '../supabase-client.js';

async function main() {
  console.log('🔄 Đang chuyển đổi ID trong danh sách Task...');
  
  // 1. Chuyển đổi robot-h-ng-d-n-vi-n-b-o-t-ng-t -> 4ae8fe58-b432-416f-8f9d-8b8b601fa6bd
  const { data, error } = await supabase
    .from('content_tasks')
    .update({ notebook_id: '4ae8fe58-b432-416f-8f9d-8b8b601fa6bd' })
    .eq('notebook_id', 'robot-h-ng-d-n-vi-n-b-o-t-ng-t')
    .eq('status', 'pending');

  if (error) {
    console.error('❌ Lỗi cập nhật Task:', error.message);
  } else {
    console.log('✅ Đã cập nhật xong các Task đang chờ sang UUID mới.');
  }
  
  // 2. Chuyển đổi gi-o-n-stem-robotics-l-p-tr-nh -> eee0e1ce-5506-4110-bead-b11b91fbf8fe
  await supabase
    .from('content_tasks')
    .update({ notebook_id: 'eee0e1ce-5506-4110-bead-b11b91fbf8fe' })
    .eq('notebook_id', 'gi-o-n-stem-robotics-l-p-tr-nh')
    .eq('status', 'pending');

}

main();
