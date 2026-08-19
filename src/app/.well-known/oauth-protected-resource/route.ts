import { NextResponse } from 'next/server';
import { getOAuthIssuer, getOAuthResource, SUPPORTED_OAUTH_SCOPES } from '@/lib/oauth-security';

export async function GET() {
  return NextResponse.json({
    resource: getOAuthResource(),
    authorization_servers: [
      getOAuthIssuer()
    ],
    scopes_supported: [...SUPPORTED_OAUTH_SCOPES],
  });
}
