import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('content_tasks')
    .select('*')
    .limit(1);
  console.log("SCHEMA SAMPLE:", JSON.stringify(data?.[0], null, 2));
  process.exit(0);
}
run();
