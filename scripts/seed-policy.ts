import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_EDITORIAL_POLICY } from '../src/lib/editorial/editorial-policy.defaults';
import crypto from 'crypto';

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedPolicy() {
  console.log("Seeding ACTIVE Editorial Policy to database...");

  const payload = DEFAULT_EDITORIAL_POLICY;
  const policyHash = 'sha256:' + crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  // Xoá các policy cũ nếu có (tránh duplicate ACTIVE status do single_active_editorial_policy constraint)
  await supabase.from('content_instructions').delete().eq('instruction_type', 'EDITORIAL_POLICY').eq('status', 'ACTIVE');

  const { data, error } = await supabase.from('content_instructions').insert([{
    name: 'KingDragonHub Editorial Guidelines 2026.08',
    description: 'Bản quy định biên tập nội dung chính thức.',
    content: 'Xem payload JSON',
    instruction_type: 'EDITORIAL_POLICY',
    policy_version: '2026.08',
    status: 'ACTIVE',
    payload: payload,
    policy_hash: policyHash,
    effective_from: new Date().toISOString()
  }]).select('id').single();

  if (error) {
    console.error("Failed to seed policy:", error.message);
    process.exit(1);
  }

  console.log("✅ Successfully seeded ACTIVE Editorial Policy with ID:", data.id);
  console.log("Policy Hash:", policyHash);
  process.exit(0);
}

seedPolicy().catch(err => {
  console.error("Error seeding policy:", err);
  process.exit(1);
});
