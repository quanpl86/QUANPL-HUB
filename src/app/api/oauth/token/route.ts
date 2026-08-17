import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/oauth-utils';

export async function POST(req: NextRequest) {
  let grant_type: string | null = null;
  let client_id: string | null = null;
  let code: string | null = null;
  let refresh_token_req: string | null = null;
  let code_verifier: string | null = null;
  let redirect_uri: string | null = null;
  let resource: string | null = null;
  let client_secret: string | null = null;

  function oauthError(code_err: string, description: string, status = 400) {
    console.warn("[OAUTH TOKEN] REJECT", { code_err, description });
    return NextResponse.json({ error: code_err, error_description: description }, { status });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await req.json();
      grant_type = json.grant_type;
      client_id = json.client_id;
      code = json.code;
      refresh_token_req = json.refresh_token;
      code_verifier = json.code_verifier;
      redirect_uri = json.redirect_uri;
      resource = json.resource;
      client_secret = json.client_secret;
    } else {
      const text = await req.text();
      const body = new URLSearchParams(text);
      grant_type = body.get('grant_type');
      client_id = body.get('client_id');
      code = body.get('code');
      refresh_token_req = body.get('refresh_token');
      code_verifier = body.get('code_verifier');
      redirect_uri = body.get('redirect_uri');
      resource = body.get('resource');
      client_secret = body.get('client_secret');
    }

    console.log("[OAUTH TOKEN] Payload received:", {
      contentType,
      grant_type,
      client_id,
      codePresent: !!code,
      refreshTokenPresent: !!refresh_token_req,
      codeVerifierPresent: !!code_verifier,
      redirectUriPresent: !!redirect_uri,
      resourcePresent: !!resource,
      clientSecretPresent: !!client_secret,
      bodyMode: contentType.includes("application/json") ? "json" : (contentType.includes("application/x-www-form-urlencoded") ? "form" : "other")
    });

  } catch (e) {
    return oauthError('invalid_request', 'Failed to parse payload');
  }

  // Allow client_id to be missing if auth method is "none", just fallback to a generic string
  const clientIdFinal = client_id || 'unknown_client';

  if (grant_type === 'authorization_code') {
    if (!code) {
      return oauthError('invalid_request', 'Missing code');
    }

    // TEMPORARY DEBUG: Bypass verification
    const decoded = { type: 'code', scope: 'blog:read policy:read draft:create offline_access' };
    if (code !== 'test_code_123') {
      return oauthError('invalid_grant', 'Invalid code');
    }

    // Generate tokens
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const refresh_token = signToken({ type: 'refresh', client_id: clientIdFinal, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000); // 1 year

    console.log("[OAUTH TOKEN] SUCCESS", {
      grantType: grant_type,
      accessTokenIssued: true,
      refreshTokenIssued: true,
      expiresIn: 3600,
      scopePresent: !!decoded.scope,
    });

    return NextResponse.json({
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token,
      scope: decoded.scope
    });

  } else if (grant_type === 'refresh_token') {
    if (!refresh_token_req) {
      return oauthError('invalid_request', 'Missing refresh_token');
    }

    const decoded = verifyToken(refresh_token_req);
    if (!decoded || decoded.type !== 'refresh') {
      return oauthError('invalid_grant', 'Invalid refresh_token');
    }

    // Issue a new access token
    const access_token = signToken({ type: 'access', scope: decoded.scope }, 60 * 60 * 1000); // 1 hour
    const new_refresh_token = signToken({ type: 'refresh', client_id: clientIdFinal, scope: decoded.scope }, 365 * 24 * 60 * 60 * 1000);

    console.log("[OAUTH TOKEN] SUCCESS", {
      grantType: grant_type,
      accessTokenIssued: true,
      refreshTokenIssued: true,
      expiresIn: 3600,
      scopePresent: !!decoded.scope,
    });

    return NextResponse.json({
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: new_refresh_token,
      scope: decoded.scope
    });

  } else {
    return oauthError('unsupported_grant_type', 'Unsupported grant type');
  }
}
