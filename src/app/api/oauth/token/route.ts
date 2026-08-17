import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/oauth-utils';

export async function POST(req: NextRequest) {
  let body: URLSearchParams;
  
  try {
    const text = await req.text();
    body = new URLSearchParams(text);
  } catch (e) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const grant_type = body.get('grant_type');
  const client_id = body.get('client_id');
  
  if (grant_type === 'authorization_code') {
    const code = body.get('code');
    if (!code || !client_id) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const decoded = verifyToken(code);
    if (!decoded || decoded.type !== 'code' || decoded.client_id !== client_id) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 401 });
    }

    // Generate tokens
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const refresh_token = signToken({ type: 'refresh', client_id, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000); // 1 year

    return NextResponse.json({
      access_token,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token,
      scope: decoded.scope
    });

  } else if (grant_type === 'refresh_token') {
    const refresh_token_req = body.get('refresh_token');
    if (!refresh_token_req || !client_id) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const decoded = verifyToken(refresh_token_req);
    if (!decoded || decoded.type !== 'refresh' || decoded.client_id !== client_id) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 401 });
    }

    // Issue a new access token
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const new_refresh_token = signToken({ type: 'refresh', client_id, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000); // Optional: rotate refresh token

    return NextResponse.json({
      access_token,
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: new_refresh_token,
      scope: decoded.scope
    });

  } else {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }
}
