import crypto from 'crypto';

export type OAuthTokenPayload = {
  type?: string;
  exp: number;
  iss?: string;
  aud?: string;
  client_id?: string;
  scope?: string;
  [key: string]: unknown;
};

function getSecret() {
  if (!process.env.MCP_SECRET_KEY) throw new Error("MCP_SECRET_KEY is required");
  return process.env.MCP_SECRET_KEY;
}

export function signToken(payload: object, expiresInMs: number): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + expiresInMs });
  const b64 = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', getSecret()).update(b64).digest('hex');
  return `${b64}_${signature}`;
}

export function verifyToken(token: string): OAuthTokenPayload | null {
  try {
    if (!token) return null;
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    
    const currentFormat = token.match(/^(.+)_([a-f0-9]{64})$/);

    // Check if it's the old base64url(json + . + hmac) format.
    if (!currentFormat) {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const lastDotIdx = decoded.lastIndexOf('.');
      if (lastDotIdx === -1) return null;
      const data = decoded.slice(0, lastDotIdx);
      const hmac = decoded.slice(lastDotIdx + 1);
      const expectedHmac = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
      if (!safeEqual(hmac, expectedHmac)) return null;
      const parsed = JSON.parse(data) as OAuthTokenPayload;
      if (parsed.exp < Date.now()) return null;
      return parsed;
    }

    // Current base64url(json) + _ + hmac format. Base64url itself may contain
    // underscores, so the separator must be located from the right.
    const [, b64, signature] = currentFormat;
    const expectedHmac = crypto.createHmac('sha256', getSecret()).update(b64).digest('hex');
    if (!safeEqual(signature, expectedHmac)) return null;

    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as OAuthTokenPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
