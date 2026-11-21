-- R2B2: apply with a dedicated DBA/migration identity, never via the
-- runtime keycloak service account. No Keycloak tokens or subject IDs stored.
-- The schema intentionally has no administrative API and no DELETE support.
CREATE TABLE IF NOT EXISTS fwb_admin_operation_log (
  op_id uuid PRIMARY KEY,
  subject_digest char(64) NOT NULL CHECK (subject_digest ~ '^[a-f0-9]{64}$'),
  action text NOT NULL CHECK (action IN ('attach','detach')),
  state text NOT NULL CHECK (state IN ('started','confirmed','manual_review')),
  code text NOT NULL CHECK (code IN
    ('pending_verification','readback_verified','uncertain_external_write')),
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  finished_at timestamptz,
  CONSTRAINT fwb_r2b2_state_code CHECK (
    (state='started' AND code='pending_verification' AND finished_at IS NULL)
    OR (state='confirmed' AND code='readback_verified' AND finished_at IS NOT NULL)
    OR (state='manual_review' AND code='uncertain_external_write' AND finished_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS fwb_admin_operation_unresolved_idx
  ON fwb_admin_operation_log(subject_digest)
  WHERE state IN ('started','manual_review');

-- Roles and grants must be provisioned out-of-band by infrastructure:
-- dedicated runtime role -> USAGE on schema, SELECT/INSERT/UPDATE on this
-- single table. Explicitly NO DELETE, DDL, BYPASSRLS or superuser.
-- Do not grant any browser, WordPress or gateway identity direct SQL access.
