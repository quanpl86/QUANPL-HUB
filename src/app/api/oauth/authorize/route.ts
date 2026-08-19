import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth-utils';
import { issueAuthorizationCode } from '@/lib/oauth-code-store';
import {
  getOAuthClientId,
  getOAuthResource,
  isAllowedOAuthRedirectUri,
  isValidPkceRequest,
  grantConnectorOAuthScope,
  OAUTH_SCOPE_LABELS,
  SUPPORTED_OAUTH_SCOPES,
} from '@/lib/oauth-security';
import { CHATGPT_MCP_PERMISSIONS } from '@/lib/content/chatgpt-permissions';

function oauthRequestError(description: string) {
  console.warn('[OAUTH AUTHORIZE] REJECT', { description });
  return new NextResponse(description, { status: 400 });
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const client_id = url.searchParams.get('client_id');
  const redirect_uri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const scope = grantConnectorOAuthScope(url.searchParams.get('scope'));
  const response_type = url.searchParams.get('response_type');
  const code_challenge = url.searchParams.get('code_challenge');
  const code_challenge_method = url.searchParams.get('code_challenge_method');
  const resource = url.searchParams.get('resource') || getOAuthResource();

  console.log("[OAUTH AUTHORIZE] request", {
    responseType: response_type,
    clientId: client_id,
    redirectUriPresent: !!redirect_uri,
    statePresent: !!state,
    scopePresent: !!scope,
    codeChallengePresent: !!code_challenge,
    codeChallengeMethod: code_challenge_method,
    resourcePresent: !!resource,
  });

  if (response_type !== 'code') return oauthRequestError('Unsupported response_type');
  if (client_id !== getOAuthClientId()) return oauthRequestError('Unknown OAuth client');
  if (!redirect_uri || !isAllowedOAuthRedirectUri(redirect_uri)) {
    return oauthRequestError('Invalid redirect_uri');
  }
  if (!state) return oauthRequestError('Missing state');
  if (!scope) return oauthRequestError('Invalid scope');
  if (resource !== getOAuthResource()) return oauthRequestError('Invalid resource');
  if (!isValidPkceRequest(code_challenge, code_challenge_method)) {
    return oauthRequestError('Invalid PKCE parameters');
  }

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    // Return a page telling them to login
    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Login Required</title>
      <style>
        body { font-family: monospace; background: #0a0a0a; color: #fff; padding: 2rem; text-align: center; }
        a { color: #ff4500; text-decoration: none; border: 1px solid #ff4500; padding: 10px 20px; display: inline-block; margin-top: 20px;}
      </style>
      </head>
      <body>
        <h1>Admin Login Required</h1>
        <p>Vui lòng đăng nhập vào hệ thống KingDragonHub trước khi kết nối ứng dụng ChatGPT.</p>
        <a href="/login" target="_blank">Mở trang đăng nhập</a>
        <p style="margin-top:20px; color:#888;">Sau khi đăng nhập xong, hãy tải lại (Refresh) trang này.</p>
      </body>
      </html>
    `;
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }

  const scopeDescriptions = SUPPORTED_OAUTH_SCOPES.map((item) => `✓ ${OAUTH_SCOPE_LABELS[item]}`);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cấp quyền ChatGPT</title>
      <style>
        body { font-family: monospace; background: #0a0a0a; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
        .container { background: #111; padding: 2rem; border: 1px solid #ff4500; border-radius: 8px; text-align: left; max-width: 520px; width: 100%; max-height: 92vh; overflow: auto; }
        h1 { color: #ff4500; font-size: 1.5rem; margin-bottom: 1rem; text-align: center;}
        p { color: #ccc; font-size: 0.9rem; margin-bottom: 1rem; }
        ul { list-style: none; padding: 0; margin-bottom: 2rem; }
        li { color: #00ff00; padding: 5px 0; }
        .danger { color: #ff4500; }
        button { width: 100%; padding: 12px; background: #ff4500; color: #000; font-weight: bold; border: none; cursor: pointer; text-transform: uppercase; }
        button:hover { background: #ff6a00; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authorize KingDragonHub</h1>
        <p>Ứng dụng <strong>ChatGPT Plugin</strong> muốn truy cập hệ thống KingDragonHub của bạn bằng quyền Admin.</p>
        <p>ChatGPT <strong>được phép</strong>:</p>
        <ul>
          ${scopeDescriptions.map(d => `<li>${d}</li>`).join('')}
          ${CHATGPT_MCP_PERMISSIONS.deny.map((item) => `<li class="danger">✗ ${escapeHtmlAttribute(item)}</li>`).join('')}
        </ul>
        <form method="POST" action="/api/oauth/authorize">
          <input type="hidden" name="response_type" value="code" />
          <input type="hidden" name="client_id" value="${escapeHtmlAttribute(client_id)}" />
          <input type="hidden" name="redirect_uri" value="${escapeHtmlAttribute(redirect_uri)}" />
          <input type="hidden" name="state" value="${escapeHtmlAttribute(state)}" />
          <input type="hidden" name="scope" value="${escapeHtmlAttribute(scope)}" />
          ${code_challenge ? `<input type="hidden" name="code_challenge" value="${escapeHtmlAttribute(code_challenge)}" />` : ''}
          ${code_challenge_method ? `<input type="hidden" name="code_challenge_method" value="${escapeHtmlAttribute(code_challenge_method)}" />` : ''}
          <input type="hidden" name="resource" value="${escapeHtmlAttribute(resource)}" />
          <button type="submit">Cho phép kết nối</button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function POST(req: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return new NextResponse('Unauthorized. Session expired.', { status: 401 });
  }

  const formData = await req.formData();
  const response_type = formData.get('response_type') as string | null;
  const client_id = formData.get('client_id') as string;
  const redirect_uri = formData.get('redirect_uri') as string;
  const state = formData.get('state') as string;
  const scope = grantConnectorOAuthScope(formData.get('scope') as string | null);
  const code_challenge = formData.get('code_challenge') as string | null;
  const code_challenge_method = formData.get('code_challenge_method') as string | null;
  const resource = (formData.get('resource') as string | null) || getOAuthResource();

  if (response_type !== 'code') return oauthRequestError('Unsupported response_type');
  if (client_id !== getOAuthClientId()) return oauthRequestError('Unknown OAuth client');
  if (!redirect_uri || !isAllowedOAuthRedirectUri(redirect_uri)) {
    return oauthRequestError('Invalid redirect_uri');
  }
  if (!state) return oauthRequestError('Missing state');
  if (!scope) return oauthRequestError('Invalid scope');
  if (resource !== getOAuthResource()) return oauthRequestError('Invalid resource');
  if (!isValidPkceRequest(code_challenge, code_challenge_method)) {
    return oauthRequestError('Invalid PKCE parameters');
  }

  let code: string;
  try {
    code = await issueAuthorizationCode({
      clientId: client_id,
      redirectUri: redirect_uri,
      scope,
      resource,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
    });
  } catch (error) {
    console.error('[OAUTH AUTHORIZE] code persistence failed', error);
    return new NextResponse('OAuth server configuration error', { status: 500 });
  }

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);

  console.log("[OAUTH AUTHORIZE] redirect", {
    redirectUriValidated: true,
    stateReturned: true,
    resourceValidated: true,
    codeLength: code.length,
    codeCreated: true,
  });

  // The consent form posts to this route. A 303 is required so the browser
  // follows the OAuth callback with GET; NextResponse defaults to 307, which
  // would preserve POST and ChatGPT rejects that callback with HTTP 400.
  return NextResponse.redirect(redirectUrl, 303);
}
