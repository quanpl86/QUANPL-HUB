# MCP–ChatGPT OAuth Deployment Specification

Status: production baseline  
Owner: KingDragonHub  
Last updated: 2026-08-17

## 1. Purpose

This specification defines the minimum security, compatibility, testing, and
rollout requirements for connecting a remote KingDragonHub MCP server to
ChatGPT with OAuth. It also records the 2026-08-17 callback incident so the
same failure is caught before future deployments.

Normative words such as MUST, MUST NOT, SHOULD, and MAY are requirements.

Primary OpenAI reference:
https://developers.openai.com/plugins/build/auth

## 2. Incident record and permanent regression rule

The authorization consent form submitted `POST /api/oauth/authorize`. The
handler used `NextResponse.redirect()` without an explicit status, so Next.js
returned `307 Temporary Redirect`. A 307 preserves the POST method. The browser
therefore sent POST to `https://chatgpt.com/connector/oauth/{callback_id}`, and
ChatGPT rejected the callback with HTTP 400 before calling the token endpoint.

Permanent rule:

- A POST-based consent handler MUST redirect to the OAuth callback with
  `303 See Other`.
- A test or Network trace MUST prove the callback request is GET.
- Seeing a correct `code` and `state` in the callback URL is not sufficient;
  the HTTP method is part of the acceptance criteria.
- No authorization-code length hypothesis may be accepted until redirect
  status/method, state correlation, and token endpoint logs have been checked.

## 3. Supported client profile

The current ChatGPT connector is a predefined confidential OAuth client:

- Client ID: configured by `MCP_OAUTH_CLIENT_ID` (default
  `kingdragonhub_mcp`).
- Token authentication: `client_secret_post` or `client_secret_basic`.
- Client secret: `MCP_OAUTH_CLIENT_SECRET`; it MUST be an independently
  generated secret and MUST NOT reuse `MCP_SECRET_KEY`.
- PKCE: the server supports `S256`. The current predefined client was observed
  not to send PKCE, so confidential-client authentication remains mandatory.

Future connectors SHOULD prefer OpenAI's documented OAuth 2.1/CIMD or DCR
profiles with PKCE. Do not infer one client profile's behavior from another.

## 4. Discovery metadata

The following HTTPS documents MUST be reachable without authentication:

1. `/.well-known/oauth-protected-resource`
2. `/.well-known/oauth-authorization-server`

The resource metadata MUST advertise the exact MCP resource and authorization
server. The authorization-server metadata MUST advertise the exact issuer,
authorization endpoint, token endpoint, supported grants, scopes, token client
authentication methods, and `S256` when PKCE is supported.

The same canonical `resource` value MUST be carried through authorization,
code storage, token exchange, token audience, and MCP token verification.

## 5. Authorization endpoint

`GET /api/oauth/authorize` MUST:

- require `response_type=code`;
- validate `client_id`;
- require `state` and return it byte-for-byte;
- validate the requested scopes against an allowlist;
- validate the exact `resource` identifier;
- validate `redirect_uri` against `MCP_OAUTH_REDIRECT_URIS` when configured;
- otherwise accept only the documented ChatGPT production callback shape;
- accept either no PKCE parameters or a complete `S256` pair;
- authenticate the KingDragonHub admin before displaying consent;
- HTML-escape all values rendered into the consent form.

`POST /api/oauth/authorize` MUST repeat all security validation. It MUST NOT
trust hidden form fields merely because GET previously rendered them.

After consent it MUST issue an opaque authorization code and return `303` to
the callback URL with only `code` and `state` added.

## 6. Authorization-code lifecycle

Authorization codes MUST:

- contain 256 bits of cryptographically secure randomness;
- use base64url without padding (43 characters for 32 random bytes);
- be stored only by SHA-256 hash;
- expire after five minutes;
- be bound to `client_id`, `redirect_uri`, `scope`, `resource`, and PKCE data;
- be consumed atomically at most once;
- never appear in application logs.

Shared database storage is mandatory on Netlify because individual serverless
instances cannot provide a reliable in-memory replay cache.

## 7. Token endpoint

`POST /api/oauth/token` MUST:

- accept `application/x-www-form-urlencoded`;
- authenticate the confidential client in constant time;
- support both advertised secret transport methods;
- reject missing or mismatched code, redirect URI, client, resource, or PKCE;
- atomically consume the code;
- return OAuth-shaped error responses without secrets;
- return successful token responses with `Cache-Control: no-store`;
- bind tokens to issuer, audience/resource, client ID, scope, and expiry.

Refresh-token requests MUST authenticate the client and verify token type,
issuer, audience, client ID, scope, and expiry before issuing replacements.

## 8. MCP resource-server enforcement

Every MCP request MUST verify access-token signature, type, issuer, audience,
expiry, and scope. Invalid or absent tokens MUST receive HTTP 401 with a
`WWW-Authenticate` header pointing to protected-resource metadata.

The static `MCP_SECRET_KEY` bearer bypass is disabled by default. It MAY be
enabled only for a controlled diagnostic window with
`MCP_ALLOW_STATIC_BEARER=true`, then disabled again.

Write-capable tools MUST additionally enforce their specific write scopes and
application policy. OAuth authentication does not replace tool-level
authorization or user confirmation.

## 9. Required production configuration

Required Netlify environment variables:

```text
MCP_SECRET_KEY=<token-signing secret>
MCP_OAUTH_CLIENT_SECRET=<independent OAuth client secret>
SUPABASE_SERVICE_ROLE_KEY=<server-only key>
NEXT_PUBLIC_SUPABASE_URL=<project URL>
```

Recommended explicit configuration:

```text
MCP_OAUTH_CLIENT_ID=kingdragonhub_mcp
MCP_OAUTH_ISSUER=https://kingdragonhub.com
MCP_OAUTH_RESOURCE=https://kingdragonhub.com/api/mcp
MCP_OAUTH_REDIRECT_URIS=https://chatgpt.com/connector/oauth/<callback_id>
MCP_ALLOW_STATIC_BEARER=false
```

Secrets MUST be stored in the hosting provider's secret manager, never in Git,
logs, screenshots, issue trackers, or plugin documentation.

## 10. Deployment order

The order is a release gate:

1. Apply the Supabase migration creating `oauth_authorization_codes` and the
   atomic consume function.
2. Create a new independent OAuth client secret.
3. Set all required Netlify environment variables.
4. Update the ChatGPT connector with the same OAuth client secret.
5. Deploy application code.
6. Start a fresh Connect flow so a new authorization state and tokens are
   issued.
7. Disable any diagnostic/static bearer bypass.
8. Remove debug tokens, codes, and temporary logging.

Application code MUST NOT be deployed before the database and secrets are
ready; otherwise linking and token refresh will fail closed.

## 11. Acceptance test matrix

Required automated checks:

- generated code is 43-character base64url and differs per issuance;
- unknown scopes are rejected;
- non-ChatGPT and query-bearing callback URLs are rejected;
- incomplete or non-S256 PKCE is rejected;
- wrong client ID or secret is rejected;
- signed-token verification uses a safe separator and constant-time signature
  comparison.

Required integration checks:

1. Discovery documents return HTTP 200 and mutually consistent values.
2. Authorization GET contains resource, state, scopes, and callback.
3. Consent POST returns 303 with a Location header.
4. Callback request method is GET.
5. Token request reaches `/api/oauth/token` as form data.
6. First valid code exchange succeeds.
7. Reusing the same code returns `invalid_grant`.
8. Wrong redirect URI, resource, client secret, or PKCE verifier fails.
9. An access token with wrong audience or scope receives MCP HTTP 401.
10. A valid access token can list and call the intended MCP tools.
11. Refresh succeeds, while a wrong client or resource fails.

## 12. Observability and incident triage

Safe structured events:

```text
[OAUTH AUTHORIZE] request
[OAUTH AUTHORIZE] redirect
[OAUTH TOKEN] Payload received
[OAUTH TOKEN] SUCCESS
[OAUTH TOKEN] REJECT
```

Logs MAY include presence flags, grant type, auth mode, status, code length, and
validated audience. Logs MUST NOT include authorization codes, state values,
client secrets, access tokens, refresh tokens, cookies, or full request bodies.

Triage order when ChatGPT shows callback HTTP 400:

1. Inspect callback HTTP method and redirect status.
2. Confirm exact state round trip.
3. Confirm callback URI matches the active connector.
4. Check whether `[OAUTH TOKEN] Payload received` exists.
5. Only then investigate code format/length or token response shape.

## 13. Rollback

If the secure release fails before token exchange:

- do not restore a fixed authorization code;
- do not bypass client-secret validation;
- roll back application code only if the previous version does not expose a
  known credential or replay vulnerability;
- otherwise disable the connector while repairing the release;
- preserve sanitized logs and the exact redirect status/method for analysis.
