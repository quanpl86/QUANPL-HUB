import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jlffnasmgzfligxdrfiy.supabase.co';
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmZuYXNtZ3pmbGlneGRyZml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyOTY0MjgsImV4cCI6MjA5Mjg3MjQyOH0.AmN9-a8Kc6J7xe1PDM-so3Bjg8tkYqIfxJkot2In02M';

// Client cho phía trình duyệt (Sử dụng @supabase/ssr để đồng bộ Cookie)
export const supabase = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());

// Client cho phía Server (Dùng cho Admin tasks)
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmZuYXNtZ3pmbGlneGRyZml5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI5NjQyOCwiZXhwIjoyMDkyODcyNDI4fQ.011xWfLM1b3iDUs3-D2OtR2ZegDcF7ndov0ts0-hfOo';
  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
