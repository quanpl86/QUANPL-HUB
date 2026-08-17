import { getOAuthIssuer } from '@/lib/oauth-security';

export async function GET() {
  const issuer = getOAuthIssuer();

  return Response.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["blog:read", "policy:read", "draft:create", "offline_access"]
  });
}
