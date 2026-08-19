import crypto from "node:crypto";

export const OAUTH_CODE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_OAUTH_ISSUER = "https://kingdragonhub.com";
export const DEFAULT_OAUTH_RESOURCE = "https://kingdragonhub.com/api/mcp";
export const DEFAULT_OAUTH_CLIENT_ID = "kingdragonhub_mcp";
export const SUPPORTED_OAUTH_SCOPES = [
  "blog:read",
  "policy:read",
  "draft:create",
  "media:write",
  "offline_access",
] as const;

export const OAUTH_SCOPE_LABELS: Record<(typeof SUPPORTED_OAUTH_SCOPES)[number], string> = {
  "blog:read": "Đọc inventory, taxonomy, lịch tuần, related posts",
  "policy:read": "Đọc editorial policy",
  "draft:create": "Tạo/sửa nháp, đề xuất/sửa lịch tuần, comment",
  "media:write": "Upload ảnh gốc lên GitHub (quanpl86/imgBlog)",
  "offline_access": "Truy cập nền (Scheduled Tasks)",
};

export function getOAuthIssuer(): string {
  return (process.env.MCP_OAUTH_ISSUER || DEFAULT_OAUTH_ISSUER).replace(/\/$/, "");
}

export function getOAuthResource(): string {
  return process.env.MCP_OAUTH_RESOURCE || DEFAULT_OAUTH_RESOURCE;
}

export function getOAuthClientId(): string {
  return process.env.MCP_OAUTH_CLIENT_ID || DEFAULT_OAUTH_CLIENT_ID;
}

function getOAuthClientSecret(): string {
  const secret = process.env.MCP_OAUTH_CLIENT_SECRET;
  if (!secret) {
    throw new Error("MCP_OAUTH_CLIENT_SECRET is required");
  }
  return secret;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftDigest = crypto.createHash("sha256").update(left).digest();
  const rightDigest = crypto.createHash("sha256").update(right).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

export function verifyOAuthClient(clientId: string | null, clientSecret: string | null): boolean {
  if (!clientId || !clientSecret) return false;
  return constantTimeEqual(clientId, getOAuthClientId())
    && constantTimeEqual(clientSecret, getOAuthClientSecret());
}

export function normalizeOAuthScope(rawScope: string | null): string | null {
  const requested = (rawScope || SUPPORTED_OAUTH_SCOPES.join(" "))
    .split(/\s+/)
    .filter(Boolean);
  const supported = new Set<string>(SUPPORTED_OAUTH_SCOPES);

  if (requested.length === 0 || requested.some((scope) => !supported.has(scope))) {
    return null;
  }

  return [...new Set(requested)].join(" ");
}

/** ChatGPT connector always receives the full allowlist, including GitHub image upload. */
export function grantConnectorOAuthScope(rawScope: string | null): string | null {
  if (!normalizeOAuthScope(rawScope)) return null;
  return [...SUPPORTED_OAUTH_SCOPES].join(" ");
}

export function isAllowedOAuthRedirectUri(rawUri: string | null): boolean {
  if (!rawUri) return false;

  const configuredUris = (process.env.MCP_OAUTH_REDIRECT_URIS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredUris.length > 0) {
    return configuredUris.includes(rawUri);
  }

  try {
    const uri = new URL(rawUri);
    if (uri.origin !== "https://chatgpt.com" || uri.search || uri.hash) return false;
    return /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(uri.pathname)
      || uri.pathname === "/connector_platform_oauth_redirect";
  } catch {
    return false;
  }
}

export function isValidPkceRequest(
  codeChallenge: string | null,
  codeChallengeMethod: string | null,
): boolean {
  if (!codeChallenge && !codeChallengeMethod) return true;
  if (!codeChallenge || codeChallengeMethod !== "S256") return false;
  return /^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge);
}

export function verifyPkceChallenge(codeChallenge: string, codeVerifier: string | null): boolean {
  if (!codeVerifier || !/^[A-Za-z0-9._~-]{43,128}$/.test(codeVerifier)) return false;
  const calculated = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  return constantTimeEqual(calculated, codeChallenge);
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAuthorizationCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
