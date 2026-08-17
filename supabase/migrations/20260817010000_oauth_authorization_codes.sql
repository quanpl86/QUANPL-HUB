-- Secure, shared authorization-code storage for the ChatGPT MCP OAuth flow.
-- Codes are stored only as SHA-256 hashes, expire after a short TTL, and are
-- consumed atomically so a successful code exchange cannot be replayed.

CREATE TABLE IF NOT EXISTS public.oauth_authorization_codes (
  code_hash TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT NOT NULL,
  resource TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CONSTRAINT oauth_authorization_codes_pkce_check CHECK (
    (code_challenge IS NULL AND code_challenge_method IS NULL)
    OR (code_challenge IS NOT NULL AND code_challenge_method = 'S256')
  )
);

CREATE INDEX IF NOT EXISTS oauth_authorization_codes_expiry_idx
ON public.oauth_authorization_codes (expires_at);

ALTER TABLE public.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.oauth_authorization_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.oauth_authorization_codes TO service_role;

CREATE OR REPLACE FUNCTION public.consume_oauth_authorization_code(
  p_code_hash TEXT,
  p_client_id TEXT,
  p_redirect_uri TEXT,
  p_resource TEXT
)
RETURNS SETOF public.oauth_authorization_codes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_authorization_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';

  RETURN QUERY
  UPDATE public.oauth_authorization_codes
  SET consumed_at = NOW()
  WHERE code_hash = p_code_hash
    AND client_id = p_client_id
    AND redirect_uri = p_redirect_uri
    AND resource = p_resource
    AND consumed_at IS NULL
    AND expires_at > NOW()
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_oauth_authorization_code(TEXT, TEXT, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_authorization_code(TEXT, TEXT, TEXT, TEXT)
TO service_role;

COMMENT ON TABLE public.oauth_authorization_codes IS
'Short-lived, single-use OAuth authorization codes stored only by SHA-256 hash.';
