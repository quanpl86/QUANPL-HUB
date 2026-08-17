import { createClient } from "@supabase/supabase-js";
import { EditorialPolicySchema } from './editorial-policy.schema';
import { DEFAULT_EDITORIAL_POLICY } from './editorial-policy.defaults';
import crypto from 'crypto';

// Helper to get an admin Supabase client for backend operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables for backend operations.");
  }
  return createClient(url, key);
}

export class EditorialPolicyRepository {
  static async getActivePolicy() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('content_instructions')
      .select('payload')
      .eq('instruction_type', 'EDITORIAL_POLICY')
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();

    let policyData = null;

    if (error) {
      // If it's a "no rows" error or "column does not exist" error, we gracefully fallback to default
      if (error.code !== 'PGRST116' && !error.message?.includes('does not exist')) {
        console.error("Error fetching policy from DB:", error.message);
        throw new Error(`DATABASE_ERROR: Failed to fetch active policy.`);
      }
    } else if (data && data.payload) {
      policyData = data.payload;
    }

    if (!policyData) {
      const allowDefault = process.env.NODE_ENV !== "production" || process.env.EDITORIAL_POLICY_ALLOW_DEFAULT === "true";
      if (!allowDefault) {
        throw new Error("POLICY_NOT_CONFIGURED");
      }
      console.log("DB schema not migrated or no active policy found. Falling back to default policy.");
      policyData = DEFAULT_EDITORIAL_POLICY;
    }

    // Validate the policy using Zod
    const parsed = EditorialPolicySchema.safeParse(policyData);
    if (!parsed.success) {
      throw new Error(`INVALID_POLICY: ${parsed.error.message}`);
    }

    const validPolicy = parsed.data;

    // Calculate policy_hash
    const hash = crypto.createHash('sha256').update(JSON.stringify(validPolicy)).digest('hex');

    return {
      ...validPolicy,
      policy_hash: `sha256:${hash}`
    };
  }
}
