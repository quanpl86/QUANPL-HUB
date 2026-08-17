export async function GET(req: Request) {
  const host = req.headers.get('host');
  // For tunneling like ngrok/cloudflared, it usually passes the original host.
  // However, x-forwarded-proto might be https
  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const issuer = `${proto}://${host}`;

  return Response.json({
    issuer,
    authorization_endpoint: `${issuer}/api/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    scopes_supported: ["blog:read", "policy:read", "draft:create", "offline_access"]
  });
}
