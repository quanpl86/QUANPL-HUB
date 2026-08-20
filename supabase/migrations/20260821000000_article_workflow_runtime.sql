-- ============================================================
-- KingDragonHub — Article Workflow Runtime V2
-- Run manually in Supabase SQL Editor before deploying the V2 app code.
--
-- Goals:
--   1. Persist resumable ChatGPT article workflows outside content_instructions.
--   2. Track all four required image slots, retries, failures, and placeholders.
--   3. Keep an auditable event/email-delivery log.
--   4. Allow only the server-side Supabase service role to access runtime data.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------
-- 1. Workflow run
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.article_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_version text NOT NULL DEFAULT 'article-workflow/2.0',
  topic text NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'AWAITING_IMAGE_UPLOAD',
  media_status text NOT NULL DEFAULT 'PENDING',
  current_index integer NOT NULL DEFAULT 0,
  article_package jsonb NOT NULL DEFAULT '{}'::jsonb,
  draft_result jsonb,
  draft_post_id text,
  last_error text,
  notification_status text NOT NULL DEFAULT 'NOT_REQUIRED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  CONSTRAINT article_workflow_runs_topic_not_blank
    CHECK (btrim(topic) <> ''),
  CONSTRAINT article_workflow_runs_idempotency_key_not_blank
    CHECK (btrim(idempotency_key) <> ''),
  CONSTRAINT article_workflow_runs_status_check
    CHECK (status IN (
      'AWAITING_IMAGE_UPLOAD',
      'READY_TO_DRAFT',
      'READY_TO_DRAFT_INCOMPLETE',
      'COMPLETED',
      'CANCELLED',
      'FAILED'
    )),
  CONSTRAINT article_workflow_runs_media_status_check
    CHECK (media_status IN ('PENDING', 'COMPLETE', 'INCOMPLETE')),
  CONSTRAINT article_workflow_runs_current_index_check
    CHECK (current_index BETWEEN 0 AND 4),
  CONSTRAINT article_workflow_runs_article_package_object
    CHECK (jsonb_typeof(article_package) = 'object'),
  CONSTRAINT article_workflow_runs_draft_result_object
    CHECK (draft_result IS NULL OR jsonb_typeof(draft_result) = 'object'),
  CONSTRAINT article_workflow_runs_notification_status_check
    CHECK (notification_status IN ('NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS article_workflow_runs_idempotency_key_unique
  ON public.article_workflow_runs (idempotency_key);

-- KingDragonHub currently permits one active admin workflow at a time. This
-- also makes the phrase "Tiếp tục bài đang dở" deterministic.
CREATE UNIQUE INDEX IF NOT EXISTS article_workflow_runs_single_active
  ON public.article_workflow_runs ((true))
  WHERE status IN (
    'AWAITING_IMAGE_UPLOAD',
    'READY_TO_DRAFT',
    'READY_TO_DRAFT_INCOMPLETE'
  );

CREATE INDEX IF NOT EXISTS article_workflow_runs_status_updated_idx
  ON public.article_workflow_runs (status, updated_at DESC);

-- ------------------------------------------------------------
-- 2. Required image slots
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.article_workflow_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL
    REFERENCES public.article_workflow_runs(id) ON DELETE CASCADE,
  image_id text NOT NULL,
  sequence_no integer NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  prompt text NOT NULL,
  alt text NOT NULL,
  aspect text NOT NULL DEFAULT '16:9',
  suggested_filename text,
  raw_url text,
  width integer,
  height integer,
  mime_type text,
  file_bytes bigint,
  sha256 text,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 2,
  failure_code text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  uploaded_at timestamptz,
  missing_at timestamptz,

  CONSTRAINT article_workflow_images_unique_slot
    UNIQUE (workflow_id, image_id),
  CONSTRAINT article_workflow_images_image_id_check
    CHECK (image_id IN ('cover', 'img-01', 'img-02', 'img-03')),
  CONSTRAINT article_workflow_images_sequence_check
    CHECK (sequence_no BETWEEN 0 AND 3),
  CONSTRAINT article_workflow_images_slot_sequence_check
    CHECK (
      (image_id = 'cover'  AND sequence_no = 0) OR
      (image_id = 'img-01' AND sequence_no = 1) OR
      (image_id = 'img-02' AND sequence_no = 2) OR
      (image_id = 'img-03' AND sequence_no = 3)
    ),
  CONSTRAINT article_workflow_images_purpose_check
    CHECK (
      (image_id = 'cover' AND purpose = 'article_cover') OR
      (image_id <> 'cover' AND purpose = 'editorial_illustration')
    ),
  CONSTRAINT article_workflow_images_status_check
    CHECK (status IN ('PENDING', 'UPLOADED', 'MISSING')),
  CONSTRAINT article_workflow_images_prompt_not_blank
    CHECK (btrim(prompt) <> ''),
  CONSTRAINT article_workflow_images_alt_not_blank
    CHECK (btrim(alt) <> ''),
  CONSTRAINT article_workflow_images_aspect_check
    CHECK (aspect = '16:9'),
  CONSTRAINT article_workflow_images_attempts_check
    CHECK (attempt_count >= 0 AND max_attempts BETWEEN 1 AND 10),
  CONSTRAINT article_workflow_images_dimensions_check
    CHECK ((width IS NULL OR width > 0) AND (height IS NULL OR height > 0)),
  CONSTRAINT article_workflow_images_file_bytes_check
    CHECK (file_bytes IS NULL OR file_bytes > 0),
  CONSTRAINT article_workflow_images_sha256_check
    CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT article_workflow_images_uploaded_payload_check
    CHECK (
      status <> 'UPLOADED' OR (
        raw_url IS NOT NULL AND
        raw_url LIKE 'https://raw.githubusercontent.com/quanpl86/imgBlog/%' AND
        width IS NOT NULL AND
        height IS NOT NULL AND
        mime_type = 'image/png' AND
        file_bytes IS NOT NULL AND
        sha256 IS NOT NULL AND
        uploaded_at IS NOT NULL
      )
    ),
  CONSTRAINT article_workflow_images_missing_payload_check
    CHECK (
      status <> 'MISSING' OR (
        failure_code IS NOT NULL AND
        failure_reason IS NOT NULL AND
        missing_at IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS article_workflow_images_next_idx
  ON public.article_workflow_images (workflow_id, status, sequence_no);

-- ------------------------------------------------------------
-- 3. Audit events and email delivery
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.article_workflow_events (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  workflow_id uuid NOT NULL
    REFERENCES public.article_workflow_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  image_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_subject text,
  email_status text NOT NULL DEFAULT 'NOT_REQUIRED',
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  email_sent_at timestamptz,

  CONSTRAINT article_workflow_events_type_check
    CHECK (event_type IN (
      'WORKFLOW_STARTED',
      'IMAGE_UPLOAD_SUCCEEDED',
      'IMAGE_ATTEMPT_FAILED',
      'IMAGE_MARKED_MISSING',
      'MEDIA_COMPLETE',
      'MEDIA_INCOMPLETE',
      'DRAFT_CREATED',
      'DRAFT_CREATE_FAILED',
      'WORKFLOW_CANCELLED'
    )),
  CONSTRAINT article_workflow_events_image_id_check
    CHECK (image_id IS NULL OR image_id IN ('cover', 'img-01', 'img-02', 'img-03')),
  CONSTRAINT article_workflow_events_details_object
    CHECK (jsonb_typeof(details) = 'object'),
  CONSTRAINT article_workflow_events_email_status_check
    CHECK (email_status IN ('NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED')),
  CONSTRAINT article_workflow_events_email_sent_check
    CHECK (email_status <> 'SENT' OR email_sent_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS article_workflow_events_run_created_idx
  ON public.article_workflow_events (workflow_id, created_at DESC);

CREATE INDEX IF NOT EXISTS article_workflow_events_pending_email_idx
  ON public.article_workflow_events (created_at)
  WHERE email_status = 'PENDING';

-- ------------------------------------------------------------
-- 4. updated_at triggers
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_article_workflow_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS article_workflow_runs_set_updated_at
  ON public.article_workflow_runs;
CREATE TRIGGER article_workflow_runs_set_updated_at
BEFORE UPDATE ON public.article_workflow_runs
FOR EACH ROW EXECUTE FUNCTION public.set_article_workflow_updated_at();

DROP TRIGGER IF EXISTS article_workflow_images_set_updated_at
  ON public.article_workflow_images;
CREATE TRIGGER article_workflow_images_set_updated_at
BEFORE UPDATE ON public.article_workflow_images
FOR EACH ROW EXECUTE FUNCTION public.set_article_workflow_updated_at();

-- ------------------------------------------------------------
-- 5. Backfill V1 workflow records (safe to run repeatedly)
-- ------------------------------------------------------------

INSERT INTO public.article_workflow_runs (
  id,
  workflow_version,
  topic,
  idempotency_key,
  status,
  media_status,
  current_index,
  article_package,
  draft_result,
  last_error,
  created_at,
  updated_at,
  completed_at
)
SELECT
  ci.id,
  COALESCE(ci.payload->>'workflow_version', 'article-workflow/1.0'),
  COALESCE(NULLIF(ci.payload->>'topic', ''), ci.name, 'Imported workflow'),
  COALESCE(NULLIF(ci.payload->>'idempotency_key', ''), ci.policy_hash, ci.id::text),
  CASE
    WHEN ci.status = 'RETIRED' AND ci.payload->>'status' <> 'COMPLETED' THEN 'CANCELLED'
    WHEN ci.payload->>'status' IN (
      'AWAITING_IMAGE_UPLOAD', 'READY_TO_DRAFT', 'COMPLETED', 'CANCELLED'
    ) THEN ci.payload->>'status'
    ELSE 'AWAITING_IMAGE_UPLOAD'
  END,
  CASE
    WHEN ci.payload->>'status' = 'COMPLETED' THEN 'COMPLETE'
    ELSE 'PENDING'
  END,
  LEAST(GREATEST(COALESCE((ci.payload->>'current_index')::integer, 0), 0), 4),
  COALESCE(ci.payload->'article_package', '{}'::jsonb),
  ci.payload->'draft_result',
  ci.payload->>'last_error',
  COALESCE(ci.created_at, now()),
  COALESCE(ci.updated_at, now()),
  CASE WHEN ci.payload->>'status' = 'COMPLETED' THEN COALESCE(ci.updated_at, now()) END
FROM public.content_instructions ci
WHERE ci.instruction_type = 'ARTICLE_WORKFLOW'
ON CONFLICT (idempotency_key) DO NOTHING;

INSERT INTO public.article_workflow_images (
  workflow_id,
  image_id,
  sequence_no,
  purpose,
  status,
  prompt,
  alt,
  aspect,
  suggested_filename,
  raw_url,
  width,
  height,
  mime_type,
  file_bytes,
  sha256,
  attempt_count,
  uploaded_at
)
SELECT
  run.id,
  spec.image_id,
  spec.sequence_no,
  CASE WHEN spec.image_id = 'cover' THEN 'article_cover' ELSE 'editorial_illustration' END,
  CASE WHEN asset.raw_url IS NOT NULL THEN 'UPLOADED' ELSE 'PENDING' END,
  COALESCE(NULLIF(spec.item->>'prompt', ''), 'Imported image brief'),
  COALESCE(NULLIF(spec.item->>'alt', ''), 'Ảnh minh họa bài viết'),
  '16:9',
  spec.item->>'filename',
  asset.raw_url,
  asset.width,
  asset.height,
  asset.mime_type,
  asset.file_bytes,
  asset.sha256,
  CASE WHEN asset.raw_url IS NOT NULL THEN 1 ELSE 0 END,
  CASE WHEN asset.raw_url IS NOT NULL THEN run.updated_at END
FROM public.content_instructions ci
JOIN public.article_workflow_runs run
  ON run.id = ci.id
CROSS JOIN LATERAL (
  SELECT
    item,
    item->>'image_id' AS image_id,
    ordinality::integer - 1 AS sequence_no
  FROM jsonb_array_elements(COALESCE(ci.payload->'image_plan', '[]'::jsonb))
       WITH ORDINALITY AS p(item, ordinality)
) spec
LEFT JOIN LATERAL (
  SELECT
    ci.payload->'assets'->spec.image_id->>'raw_url' AS raw_url,
    (ci.payload->'assets'->spec.image_id->>'width')::integer AS width,
    (ci.payload->'assets'->spec.image_id->>'height')::integer AS height,
    ci.payload->'assets'->spec.image_id->>'mime_type' AS mime_type,
    (ci.payload->'assets'->spec.image_id->>'file_bytes')::bigint AS file_bytes,
    ci.payload->'assets'->spec.image_id->>'sha256' AS sha256
) asset ON true
WHERE ci.instruction_type = 'ARTICLE_WORKFLOW'
  AND spec.image_id IN ('cover', 'img-01', 'img-02', 'img-03')
ON CONFLICT (workflow_id, image_id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. Server-only access
-- ------------------------------------------------------------

ALTER TABLE public.article_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_workflow_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_workflow_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.article_workflow_runs FROM anon, authenticated;
REVOKE ALL ON TABLE public.article_workflow_images FROM anon, authenticated;
REVOKE ALL ON TABLE public.article_workflow_events FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.article_workflow_runs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.article_workflow_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.article_workflow_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.article_workflow_events_id_seq TO service_role;

COMMENT ON TABLE public.article_workflow_runs IS
  'Resumable ChatGPT article creation state, including complete/incomplete media outcome.';
COMMENT ON TABLE public.article_workflow_images IS
  'The fixed cover + img-01..03 sequence, upload metadata, retry count, and missing-image holder data.';
COMMENT ON TABLE public.article_workflow_events IS
  'Audit trail for workflow transitions and durable email notification delivery state.';

COMMIT;

-- Verification query (returns three rows after a successful run):
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'article_workflow_runs',
    'article_workflow_images',
    'article_workflow_events'
  )
ORDER BY table_name;
