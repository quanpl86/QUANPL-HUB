import { createClient } from "@supabase/supabase-js";
import {
  generateAuthorizationCode,
  hashAuthorizationCode,
  OAUTH_CODE_TTL_MS,
} from "@/lib/oauth-security";

export type AuthorizationCodeGrant = {
  clientId: string;
  redirectUri: string;
  scope: string;
  resource: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
};

function getOAuthStoreClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service-role configuration is required for OAuth code storage");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function issueAuthorizationCode(grant: AuthorizationCodeGrant): Promise<string> {
  const code = generateAuthorizationCode();
  const expiresAt = new Date(Date.now() + OAUTH_CODE_TTL_MS).toISOString();
  const supabase = getOAuthStoreClient();
  const { error } = await supabase.from("oauth_authorization_codes").insert({
    code_hash: hashAuthorizationCode(code),
    client_id: grant.clientId,
    redirect_uri: grant.redirectUri,
    scope: grant.scope,
    resource: grant.resource,
    code_challenge: grant.codeChallenge,
    code_challenge_method: grant.codeChallengeMethod,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to persist OAuth authorization code: ${error.message}`);
  }

  return code;
}

export async function consumeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  resource: string,
): Promise<AuthorizationCodeGrant | null> {
  const supabase = getOAuthStoreClient();
  const { data, error } = await supabase.rpc("consume_oauth_authorization_code", {
    p_code_hash: hashAuthorizationCode(code),
    p_client_id: clientId,
    p_redirect_uri: redirectUri,
    p_resource: resource,
  });

  if (error) {
    throw new Error(`Failed to consume OAuth authorization code: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    clientId: row.client_id,
    redirectUri: row.redirect_uri,
    scope: row.scope,
    resource: row.resource,
    codeChallenge: row.code_challenge,
    codeChallengeMethod: row.code_challenge_method,
  };
}
