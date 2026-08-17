import { NextResponse } from 'next/server';
import { getOAuthIssuer, getOAuthResource } from '@/lib/oauth-security';

export async function GET() {
  return NextResponse.json({
    resource: getOAuthResource(),
    authorization_servers: [
      getOAuthIssuer()
    ],
    scopes_supported: [
      "blog:read",
      "policy:read",
      "draft:create",
      "offline_access"
    ]
  });
}
