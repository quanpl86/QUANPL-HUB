-- ============================================================
-- KingDragonHub
-- MCP-03 Editorial Policy + MCP-04 Write Governance
-- 2026-08-17
-- ============================================================


-- ============================================================
-- 1. MCP-04 — Draft Idempotency
-- ============================================================

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS idempotency_key text;


CREATE UNIQUE INDEX IF NOT EXISTS posts_idempotency_key_unique
ON posts (idempotency_key)
WHERE idempotency_key IS NOT NULL;


COMMENT ON COLUMN posts.idempotency_key IS
'Unique request key used to prevent duplicate AI-generated draft creation.';


-- ============================================================
-- 2. MCP-03 — Hybrid Editorial Policy Registry
-- ============================================================

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS instruction_type text;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS policy_version text;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS policy_hash text;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS effective_from timestamptz;

ALTER TABLE content_instructions
ADD COLUMN IF NOT EXISTS effective_until timestamptz;


-- ============================================================
-- 3. Validation constraints
-- ============================================================

ALTER TABLE content_instructions
DROP CONSTRAINT IF EXISTS content_instructions_policy_status_check;

ALTER TABLE content_instructions
ADD CONSTRAINT content_instructions_policy_status_check
CHECK (
  status IS NULL
  OR status IN (
    'DRAFT',
    'REVIEW',
    'APPROVED',
    'ACTIVE',
    'RETIRED'
  )
);


-- ============================================================
-- 4. Policy version uniqueness
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
content_instructions_editorial_policy_version_unique
ON content_instructions (
  instruction_type,
  policy_version
)
WHERE
  instruction_type = 'EDITORIAL_POLICY'
  AND policy_version IS NOT NULL;


-- ============================================================
-- 5. Only one ACTIVE Editorial Policy
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
content_instructions_single_active_editorial_policy
ON content_instructions ((instruction_type))
WHERE
  instruction_type = 'EDITORIAL_POLICY'
  AND status = 'ACTIVE';


-- ============================================================
-- 6. Lookup optimization
-- ============================================================

CREATE INDEX IF NOT EXISTS
content_instructions_policy_lookup_idx
ON content_instructions (
  instruction_type,
  status,
  effective_from
);


-- ============================================================
-- 7. Documentation
-- ============================================================

COMMENT ON COLUMN content_instructions.instruction_type IS
'Instruction category. EDITORIAL_POLICY identifies KingDragonHub editorial governance policies.';

COMMENT ON COLUMN content_instructions.policy_version IS
'Human-readable immutable editorial policy version, e.g. 2026.08.';

COMMENT ON COLUMN content_instructions.status IS
'Policy lifecycle state: DRAFT, REVIEW, APPROVED, ACTIVE, or RETIRED.';

COMMENT ON COLUMN content_instructions.payload IS
'Validated structured editorial policy contract stored as JSONB.';

COMMENT ON COLUMN content_instructions.policy_hash IS
'SHA-256 hash of the normalized editorial policy used for audit and integrity verification.';

COMMENT ON COLUMN content_instructions.effective_from IS
'Timestamp from which the policy becomes effective.';

COMMENT ON COLUMN content_instructions.effective_until IS
'Optional timestamp after which the policy is no longer effective.';
