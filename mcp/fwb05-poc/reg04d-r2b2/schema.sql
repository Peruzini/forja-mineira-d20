-- R2B2: executed only with a dedicated migration identity.
-- No raw Keycloak subjects, sites, connections or credentials stored.
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
CREATE UNIQUE INDEX IF NOT EXISTS fwb_admin_operation_unresolved_idx
  ON fwb_admin_operation_log(subject_digest)
  WHERE state IN ('started','manual_review');

-- The worker may initialize this identity exactly once and compare it on
-- every operation. It must not have UPDATE or DELETE privileges here.
CREATE TABLE IF NOT EXISTS fwb_admin_key_epoch (
  singleton smallint PRIMARY KEY CHECK (singleton=1),
  key_marker char(64) NOT NULL CHECK (key_marker ~ '^[a-f0-9]{64}$'),
  established_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- DBA provisions a dedicated role out of band:
-- GRANT USAGE ON SCHEMA public
-- GRANT SELECT,INSERT ON fwb_admin_operation_log
-- GRANT UPDATE(state,code,finished_at) ON fwb_admin_operation_log
-- GRANT SELECT,INSERT ON fwb_admin_key_epoch
-- NEVER GRANT DELETE, DDL, superuser or BYPASSRLS.
