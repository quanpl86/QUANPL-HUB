import crypto from 'crypto';

function getSecret() {
  if (!process.env.MCP_SECRET_KEY) throw new Error("MCP_SECRET_KEY is required");
  return process.env.MCP_SECRET_KEY;
}

export function signToken(payload: object, expiresInMs: number): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + expiresInMs });
  const hmac = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
  return Buffer.from(`${data}.${hmac}`).toString('base64url');
}

export function verifyToken(token: string): any | null {
  try {
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastDotIdx = decoded.lastIndexOf('.');
    if (lastDotIdx === -1) return null;
    
    const data = decoded.slice(0, lastDotIdx);
    const hmac = decoded.slice(lastDotIdx + 1);
    
    const expectedHmac = crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
    if (hmac !== expectedHmac) return null;
    
    const parsed = JSON.parse(data);
    if (parsed.exp < Date.now()) return null;
    
    return parsed;
  } catch {
    return null;
  }
}
