import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  generateAuthorizationCode,
  hashAuthorizationCode,
  isAllowedOAuthRedirectUri,
  isValidPkceRequest,
  normalizeOAuthScope,
  verifyOAuthClient,
  verifyPkceChallenge,
} from '../src/lib/oauth-security.ts';
import { signToken, verifyToken } from '../src/lib/oauth-utils.ts';

test('authorization codes are short, opaque, and random', () => {
  const first = generateAuthorizationCode();
  const second = generateAuthorizationCode();
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first, second);
  assert.match(hashAuthorizationCode(first), /^[a-f0-9]{64}$/);
});

test('scope normalization rejects unadvertised scopes', () => {
  assert.equal(normalizeOAuthScope('blog:read blog:read policy:read'), 'blog:read policy:read');
  assert.equal(normalizeOAuthScope('admin:all'), null);
});

test('default redirect policy only accepts ChatGPT OAuth callback paths', () => {
  const previous = process.env.MCP_OAUTH_REDIRECT_URIS;
  delete process.env.MCP_OAUTH_REDIRECT_URIS;
  try {
    assert.equal(isAllowedOAuthRedirectUri('https://chatgpt.com/connector/oauth/callback_123'), true);
    assert.equal(isAllowedOAuthRedirectUri('https://chatgpt.com.evil.example/connector/oauth/callback_123'), false);
    assert.equal(isAllowedOAuthRedirectUri('https://chatgpt.com/connector/oauth/callback_123?next=evil'), false);
  } finally {
    if (previous === undefined) delete process.env.MCP_OAUTH_REDIRECT_URIS;
    else process.env.MCP_OAUTH_REDIRECT_URIS = previous;
  }
});

test('PKCE supports only complete S256 requests', () => {
  const verifier = 'a'.repeat(43);
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  assert.equal(isValidPkceRequest(challenge, 'S256'), true);
  assert.equal(isValidPkceRequest(challenge, null), false);
  assert.equal(verifyPkceChallenge(challenge, verifier), true);
  assert.equal(verifyPkceChallenge(challenge, 'b'.repeat(43)), false);
});

test('confidential client credentials must both match', () => {
  const previousId = process.env.MCP_OAUTH_CLIENT_ID;
  const previousSecret = process.env.MCP_OAUTH_CLIENT_SECRET;
  process.env.MCP_OAUTH_CLIENT_ID = 'test-client';
  process.env.MCP_OAUTH_CLIENT_SECRET = 'test-secret';
  try {
    assert.equal(verifyOAuthClient('test-client', 'test-secret'), true);
    assert.equal(verifyOAuthClient('test-client', 'wrong-secret'), false);
    assert.equal(verifyOAuthClient('wrong-client', 'test-secret'), false);
  } finally {
    if (previousId === undefined) delete process.env.MCP_OAUTH_CLIENT_ID;
    else process.env.MCP_OAUTH_CLIENT_ID = previousId;
    if (previousSecret === undefined) delete process.env.MCP_OAUTH_CLIENT_SECRET;
    else process.env.MCP_OAUTH_CLIENT_SECRET = previousSecret;
  }
});

test('token verification accepts current and legacy signed formats', () => {
  const previous = process.env.MCP_SECRET_KEY;
  process.env.MCP_SECRET_KEY = 'test-signing-secret';
  try {
    const current = signToken({ type: 'access', scope: 'blog:read' }, 60_000);
    assert.equal(verifyToken(current)?.type, 'access');

    const data = JSON.stringify({ type: 'refresh', exp: Date.now() + 60_000 });
    const signature = crypto.createHmac('sha256', 'test-signing-secret').update(data).digest('hex');
    const legacy = Buffer.from(`${data}.${signature}`).toString('base64url');
    assert.equal(verifyToken(legacy)?.type, 'refresh');
  } finally {
    if (previous === undefined) delete process.env.MCP_SECRET_KEY;
    else process.env.MCP_SECRET_KEY = previous;
  }
});
