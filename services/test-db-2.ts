import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function run() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('id, result_post_id')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (error) console.error(error);
  else {
    console.log("LAST 3 TASKS:", data);
  }
}
run();
