import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    resource: "https://kingdragonhub.com/api/mcp",
    authorization_servers: [
      "https://kingdragonhub.com"
    ],
    scopes_supported: [
      "blog:read",
      "policy:read",
      "draft:create",
      "offline_access"
    ]
  });
}
