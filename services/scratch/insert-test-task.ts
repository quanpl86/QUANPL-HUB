import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://jlffnasmgzfligxdrfiy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmZuYXNtZ3pmbGlneGRyZml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI5NjQyOCwiZXhwIjoyMDkyODcyNDI4fQ.011xWfLM1b3iDUs3-D2OtR2ZegDcF7ndov0ts0-hfOo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTask() {
  const { data, error } = await supabase
    .from('content_tasks')
    .insert([
      {
        topic_name: 'TEST AUDIO BYPASS',
        type: 'AUDIO',
        status: 'pending',
        notebook_id: '5883084c-c349-4e8f-9c85-4eb77727a9e9', // URL ID
        metadata: { info: 'Testing URL bypass' }
      }
    ])
    .select();

  if (error) {
    console.error('Error inserting task:', error);
  } else {
    console.log('Task inserted successfully:', data);
  }
}

insertTask();
