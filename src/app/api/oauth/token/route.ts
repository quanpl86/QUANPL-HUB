import { NextRequest, NextResponse } from 'next/server';
import { consumeAuthorizationCode } from '@/lib/oauth-code-store';
import {
  getOAuthIssuer,
  getOAuthResource,
  verifyOAuthClient,
  verifyPkceChallenge,
} from '@/lib/oauth-security';
import { verifyToken, signToken } from '@/lib/oauth-utils';

type TokenRequestPayload = {
  grant_type: string | null;
  client_id: string | null;
  client_secret: string | null;
  code: string | null;
  refresh_token: string | null;
  code_verifier: string | null;
  redirect_uri: string | null;
  resource: string | null;
};

function oauthError(code: string, description: string, status = 400) {
  console.warn('[OAUTH TOKEN] REJECT', { code, description });
  const headers = status === 401 ? { 'WWW-Authenticate': 'Basic realm="oauth-token"' } : undefined;
  return NextResponse.json({ error: code, error_description: description }, { status, headers });
}

function parseBasicCredentials(req: NextRequest): { clientId: string; clientSecret: string } | null {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) return null;

  try {
    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 1) return null;
    return {
      clientId: decodeURIComponent(decoded.slice(0, separator)),
      clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
    };
  } catch {
    return null;
  }
}

async function parseTokenRequest(req: NextRequest): Promise<TokenRequestPayload> {
  const contentType = req.headers.get('content-type') || '';
  let values: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    values = await req.json();
  } else {
    const body = new URLSearchParams(await req.text());
    values = Object.fromEntries(body.entries());
  }

  const basic = parseBasicCredentials(req);
  const stringValue = (key: string) => typeof values[key] === 'string' ? values[key] as string : null;
  const payload = {
    grant_type: stringValue('grant_type'),
    client_id: basic?.clientId || stringValue('client_id'),
    client_secret: basic?.clientSecret || stringValue('client_secret'),
    code: stringValue('code'),
    refresh_token: stringValue('refresh_token'),
    code_verifier: stringValue('code_verifier'),
    redirect_uri: stringValue('redirect_uri'),
    resource: stringValue('resource'),
  };

  console.log('[OAUTH TOKEN] Payload received:', {
    contentType,
    grantType: payload.grant_type,
    clientIdPresent: !!payload.client_id,
    codePresent: !!payload.code,
    refreshTokenPresent: !!payload.refresh_token,
    codeVerifierPresent: !!payload.code_verifier,
    redirectUriPresent: !!payload.redirect_uri,
    resourcePresent: !!payload.resource,
    clientSecretPresent: !!payload.client_secret,
    clientAuthMode: basic ? 'client_secret_basic' : 'client_secret_post',
    bodyMode: contentType.includes('application/json')
      ? 'json'
      : contentType.includes('application/x-www-form-urlencoded') ? 'form' : 'other',
  });

  return payload;
}

export async function POST(req: NextRequest) {
  let payload: TokenRequestPayload;
  try {
    payload = await parseTokenRequest(req);
  } catch {
    return oauthError('invalid_request', 'Failed to parse payload');
  }

  try {
    if (!verifyOAuthClient(payload.client_id, payload.client_secret)) {
      return oauthError('invalid_client', 'Invalid client credentials', 401);
    }
  } catch (error) {
    console.error('[OAUTH TOKEN] client configuration failed', error);
    return oauthError('server_error', 'OAuth server configuration error', 500);
  }

  const clientId = payload.client_id!;
  const issuer = getOAuthIssuer();
  const expectedResource = getOAuthResource();

  if (payload.grant_type === 'authorization_code') {
    if (!payload.code || !payload.redirect_uri || !payload.resource) {
      return oauthError('invalid_request', 'Missing code, redirect_uri, or resource');
    }
    if (payload.resource !== expectedResource) {
      return oauthError('invalid_target', 'Invalid resource');
    }

    let grant;
    try {
      grant = await consumeAuthorizationCode(
        payload.code,
        clientId,
        payload.redirect_uri,
        payload.resource,
      );
    } catch (error) {
      console.error('[OAUTH TOKEN] code consumption failed', error);
      return oauthError('server_error', 'OAuth server storage error', 500);
    }

    if (!grant) {
      return oauthError('invalid_grant', 'Authorization code is invalid, expired, reused, or mismatched');
    }
    if (grant.codeChallenge) {
      if (grant.codeChallengeMethod !== 'S256'
        || !verifyPkceChallenge(grant.codeChallenge, payload.code_verifier)) {
        return oauthError('invalid_grant', 'PKCE verification failed');
      }
    }

    const accessToken = signToken({
      type: 'access',
      iss: issuer,
      aud: grant.resource,
      client_id: clientId,
      scope: grant.scope,
    }, 60 * 60 * 1000);
    const refreshToken = signToken({
      type: 'refresh',
      iss: issuer,
      aud: grant.resource,
      client_id: clientId,
      scope: grant.scope,
    }, 365 * 24 * 60 * 60 * 1000);

    console.log('[OAUTH TOKEN] SUCCESS', {
      grantType: payload.grant_type,
      accessTokenIssued: true,
      refreshTokenIssued: true,
      expiresIn: 3600,
      scopePresent: true,
      audienceValidated: true,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: grant.scope,
    }, { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } });
  }

  if (payload.grant_type === 'refresh_token') {
    if (!payload.refresh_token) {
      return oauthError('invalid_request', 'Missing refresh_token');
    }

    const decoded = verifyToken(payload.refresh_token);
    if (!decoded
      || decoded.type !== 'refresh'
      || decoded.iss !== issuer
      || decoded.aud !== expectedResource
      || decoded.client_id !== clientId
      || (payload.resource && payload.resource !== decoded.aud)) {
      return oauthError('invalid_grant', 'Invalid refresh_token');
    }

    const accessToken = signToken({
      type: 'access',
      iss: issuer,
      aud: decoded.aud,
      client_id: clientId,
      scope: decoded.scope,
    }, 60 * 60 * 1000);
    const newRefreshToken = signToken({
      type: 'refresh',
      iss: issuer,
      aud: decoded.aud,
      client_id: clientId,
      scope: decoded.scope,
    }, 365 * 24 * 60 * 60 * 1000);

    console.log('[OAUTH TOKEN] SUCCESS', {
      grantType: payload.grant_type,
      accessTokenIssued: true,
      refreshTokenIssued: true,
      expiresIn: 3600,
      scopePresent: !!decoded.scope,
      audienceValidated: true,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: decoded.scope,
    }, { headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' } });
  }

  return oauthError('unsupported_grant_type', 'Unsupported grant type');
}
