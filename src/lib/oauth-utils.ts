import crypto from 'crypto';

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

export function verifyToken(token: string): any | null {
  try {
    if (!token) return null;
    if (token.toLowerCase().startsWith('bearer ')) {
      token = token.slice(7).trim();
    }
    
    // Check if it's the old base64url(json + . + hmac) format
    if (token.includes('.') && !token.includes('_')) {
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
    }
    
    // New base64url(json) + _ + hmac format
    const parts = token.split('_');
    if (parts.length !== 2) return null;
    const [b64, signature] = parts;
    const expectedHmac = crypto.createHmac('sha256', getSecret()).update(b64).digest('hex');
    if (signature !== expectedHmac) return null;
    
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
