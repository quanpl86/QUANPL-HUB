import { supabase } from '../supabase-client.js';

async function main() {
  const ids = ['robot-h-ng-d-n-vi-n-b-o-t-ng-t', 'gi-o-n-stem-robotics-l-p-tr-nh'];
  const { data, error } = await supabase
    .from('automation_notebooks')
    .select('*')
    .in('id', ids);

  if (error) {
    console.error('❌ Lỗi:', error.message);
    return;
  }

  console.log('--- LEGACY SLUGS CHECK ---');
  console.table(data);
}

main();
