'use server';

import { getSupabaseAdmin } from '@/lib/supabase';

export async function seedInitialUsers() {
  const supabase = getSupabaseAdmin();

  const users = [
    {
      email: 'quanpl@quanpl.hub',
      password: 'quan12345678900',
      data: { full_name: 'Quân PL Admin', role: 'admin' }
    },
    {
      email: 'user1@quanpl.hub',
      password: '123456',
      data: { full_name: 'User One', role: 'user' }
    }
  ];

  const results = [];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      user_metadata: user.data,
      email_confirm: true
    });

    if (error) {
      results.push({ email: user.email, success: false, error: error.message });
    } else {
      results.push({ email: user.email, success: true });
    }
  }

  return results;
}
