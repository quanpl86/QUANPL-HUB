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
    .from('posts')
    .select('id, title, content, keywords')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (error) console.error(error);
  else {
    console.log("TITLE:", data[0].title);
    console.log("KEYWORDS:", data[0].keywords);
    console.log("CONTENT LENGTH:", data[0].content.length);
    console.log("CONTENT SNIPPET:\n", data[0].content.substring(0, 500));
  }
}
run();
