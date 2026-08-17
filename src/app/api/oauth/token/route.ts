import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/oauth-utils';

export async function POST(req: NextRequest) {
  let grant_type: string | null = null;
  let client_id: string | null = null;
  let code: string | null = null;
  let refresh_token_req: string | null = null;

  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await req.json();
      grant_type = json.grant_type;
      client_id = json.client_id;
      code = json.code;
      refresh_token_req = json.refresh_token;
    } else {
      const text = await req.text();
      const body = new URLSearchParams(text);
      grant_type = body.get('grant_type');
      client_id = body.get('client_id');
      code = body.get('code');
      refresh_token_req = body.get('refresh_token');
    }
  } catch (e) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Allow client_id to be missing if auth method is "none", just fallback to a generic string
  const clientIdFinal = client_id || 'unknown_client';

  if (grant_type === 'authorization_code') {
    if (!code) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing code' }, { status: 400 });
    }

    const decoded = verifyToken(code);
    if (!decoded || decoded.type !== 'code') {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid code' }, { status: 400 });
    }

    // Generate tokens
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const refresh_token = signToken({ type: 'refresh', client_id: clientIdFinal, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000); // 1 year

    return NextResponse.json({
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token,
      scope: decoded.scope
    });

  } else if (grant_type === 'refresh_token') {
    if (!refresh_token_req) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing refresh_token' }, { status: 400 });
    }

    const decoded = verifyToken(refresh_token_req);
    if (!decoded || decoded.type !== 'refresh') {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid refresh_token' }, { status: 400 });
    }

    // Issue a new access token
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const new_refresh_token = signToken({ type: 'refresh', client_id: clientIdFinal, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: new_refresh_token,
      scope: decoded.scope
    });

  } else {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
  }
}
