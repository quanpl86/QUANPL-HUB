import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/auth-utils';
import { signToken } from '@/lib/oauth-utils';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const client_id = url.searchParams.get('client_id');
  const redirect_uri = url.searchParams.get('redirect_uri');
  const state = url.searchParams.get('state');
  const scope = url.searchParams.get('scope') || 'blog:read policy:read draft:create offline_access';
  const response_type = url.searchParams.get('response_type');
  const code_challenge = url.searchParams.get('code_challenge');
  const code_challenge_method = url.searchParams.get('code_challenge_method');
  const resource = url.searchParams.get('resource');

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

  if (!client_id || !redirect_uri || !state) {
    return new NextResponse('Missing required OAuth parameters', { status: 400 });
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

  // Parse scopes to display friendly names
  const scopes = scope.split(' ');
  const scopeDescriptions = scopes.map(s => {
    switch(s) {
      case 'blog:read': return '✓ Đọc inventory và related posts';
      case 'policy:read': return '✓ Đọc editorial policy';
      case 'draft:create': return '✓ Tạo bài viết DRAFT mới';
      case 'offline_access': return '✓ Truy cập nền (Scheduled Tasks)';
      default: return `✓ ${s}`;
    }
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cấp quyền ChatGPT</title>
      <style>
        body { font-family: monospace; background: #0a0a0a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { background: #111; padding: 2rem; border: 1px solid #ff4500; border-radius: 8px; text-align: left; max-width: 450px; width: 100%; }
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
        <p>Ứng dụng có thể thực hiện:</p>
        <ul>
          ${scopeDescriptions.map(d => `<li>${d}</li>`).join('')}
          <li class="danger">✗ KHÔNG PUBLISH BÀI</li>
          <li class="danger">✗ KHÔNG XÓA DỮ LIỆU</li>
        </ul>
        <form method="POST" action="/api/oauth/authorize">
          <input type="hidden" name="client_id" value="${client_id}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
          <input type="hidden" name="state" value="${state}" />
          <input type="hidden" name="scope" value="${scope}" />
          ${code_challenge ? `<input type="hidden" name="code_challenge" value="${code_challenge}" />` : ''}
          ${code_challenge_method ? `<input type="hidden" name="code_challenge_method" value="${code_challenge_method}" />` : ''}
          ${resource ? `<input type="hidden" name="resource" value="${resource}" />` : ''}
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
  const client_id = formData.get('client_id') as string;
  const redirect_uri = formData.get('redirect_uri') as string;
  const state = formData.get('state') as string;
  const scope = formData.get('scope') as string;
  const code_challenge = formData.get('code_challenge') as string | null;
  const code_challenge_method = formData.get('code_challenge_method') as string | null;
  const resource = formData.get('resource') as string | null;

  if (!client_id || !redirect_uri || !state) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // TEMPORARY DEBUG: Use a tiny code to test if ChatGPT is rejecting long strings
  const code = "test_code_123";
  
  const redirectUrl = new URL(redirect_uri);
  const storedRedirectUri = formData.get('redirect_uri') as string;
  const storedState = formData.get('state') as string;

  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', storedState);

  console.log("[OAUTH AUTHORIZE] redirect", {
    redirectUriPresent: !!redirect_uri,
    redirectUriExact: redirect_uri === storedRedirectUri,
    stateReturned: !!storedState,
    stateRoundTripExact: state === storedState,
    codeCreated: true,
  });

  return NextResponse.redirect(redirectUrl.toString());
}
