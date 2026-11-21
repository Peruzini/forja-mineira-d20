import { createHmac, randomUUID } from 'node:crypto';
import { OnboardingDenied, verifyCentralIdentity } from '../reg04/onboarding.mjs';
import { makeFederatedOnboarding } from '../reg04c/federated-onboarding.mjs';
import { makeFieldRestrictedKeycloakAdmin } from '../reg04d-r2b/restricted-attributes.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE=/^[a-z][a-z0-9_-]{2,63}$/;
const CONNECTION=/^[A-Za-z0-9_-]{22,64}$/;
const ACTIONS=Object.freeze(['attach','detach']);

// This module must ONLY execute in an isolated server process. The API below
// is not an HTTP handler and never returns credentials, SQL clients or a token.
// Actual network ACLs, vault and TLS are deployment controls, not flags here.
function fail(code){ throw new OnboardingDenied(code); }
function ensureBoundary({scopedConfig,pool,auditHmacKey}){
  if(scopedConfig?.clientId!=='fwb-onboarding'||
    !Array.isArray(scopedConfig.allowedSubjects)||!scopedConfig.allowedSubjects.length||
    typeof scopedConfig.clientSecret!=='string'||scopedConfig.clientSecret.length<32||
    !pool||typeof pool.connect!=='function'||
    !Buffer.isBuffer(auditHmacKey)||auditHmacKey.length!==32)
    fail('r2b2_private_boundary_unconfigured');
}
function digestSubject(key,sub){
  return createHmac('sha256',key).update('fwb-r2b2-subject-v1\0'+sub.toLowerCase()).digest('hex');
}
function lockNumber(key,sub){
  // 64-bit signed advisory key. The full keyed digest is used for audit
  // reconciliation; do not store a raw sub, site or connection in SQL.
  return createHmac('sha256',key).update('fwb-r2b2-lock-v1\0'+sub.toLowerCase())
    .digest().readBigInt64BE(0).toString();
}
function verifyInputs(config,action,sub,siteId,connectionId){
  if(!ACTIONS.includes(action)||typeof sub!=='string'||!UUID.test(sub)||
    !config.allowedSubjects.includes(sub.toLowerCase())||
    typeof siteId!=='string'||!SITE.test(siteId)||
    typeof connectionId!=='string'||!CONNECTION.test(connectionId))
    fail('r2b2_unapproved_operation');
}
async function query(client,sql,params){
  const result=await client.query(sql,params);
  if(!result||!Array.isArray(result.rows))fail('r2b2_audit_storage_unavailable');
  return result;
}
function fixedAudit(callback,code){
  if(typeof callback==='function'){
    try{callback(code);}catch{/* Auditing is in PostgreSQL, not this callback. */}
  }
}

// Database-backed, process-independent serialization for all writers using
// this facade. A committed STARTED row survives an executor crash and blocks
// subsequent operations until an independent reconciliation.
// A session-level advisory lock must use a dedicated PostgreSQL connection;
// transaction-pooled PgBouncer is not supported.
export function makeR2B2PrivateAdmin({scopedConfig,pool,auditHmacKey,
  fetcher=globalThis.fetch,onAudit}={}){
  ensureBoundary({scopedConfig,pool,auditHmacKey});
  const admin=makeFieldRestrictedKeycloakAdmin({config:scopedConfig,fetcher});
  async function mutate(action,sub,siteId,connectionId){
    verifyInputs(scopedConfig,action,sub,siteId,connectionId);
    const digest=digestSubject(auditHmacKey,sub);
    const advisoryKey=lockNumber(auditHmacKey,sub);
    let client;
    try {client=await pool.connect();}
    catch {fail('r2b2_audit_storage_unavailable');}
    let locked=false, discard=false, operationId=null;
    try {
      const lock=await query(client,
        'SELECT pg_try_advisory_lock($1::bigint) AS acquired',[advisoryKey]);
      locked=lock.rows[0]?.acquired===true;
      if(!locked)fail('r2b2_subject_busy');
      const unresolved=await query(client,
        "SELECT op_id FROM fwb_admin_operation_log WHERE subject_digest=$1 AND state IN ('started','manual_review') LIMIT 1",
        [digest]);
      if(unresolved.rows.length)fail('r2b2_reconciliation_required');
      operationId=randomUUID();
      await query(client,
        "INSERT INTO fwb_admin_operation_log(op_id,subject_digest,action,state,code) VALUES($1,$2,$3,'started','pending_verification')",
        [operationId,digest,action]);
      fixedAudit(onAudit,'r2b2_operation_started');
      let result;
      try{
        result=await admin[action](sub,siteId,connectionId);
      }catch{
        // HTTP timeout or readback mismatch may mean a PUT happened.
        // Mark manual review; do NOT retry or assume rollback.
        try {
          const saved=await query(client,
            "UPDATE fwb_admin_operation_log SET state='manual_review',code='uncertain_external_write',finished_at=NOW() WHERE op_id=$1 AND state='started' RETURNING op_id",
            [operationId]);
          if(saved.rowCount!==1)discard=true;
        }catch{discard=true;}
        fixedAudit(onAudit,'r2b2_manual_review_required');
        fail('r2b2_manual_review_required');
      }
      // A confirmed write without a committed audit is NOT successful.
      const confirmed=await query(client,
        "UPDATE fwb_admin_operation_log SET state='confirmed',code='readback_verified',finished_at=NOW() WHERE op_id=$1 AND state='started' RETURNING op_id",
        [operationId]);
      if(confirmed.rowCount!==1)fail('r2b2_audit_commit_uncertain');
      fixedAudit(onAudit,'r2b2_operation_confirmed');
      return result;
    }catch(err){
      if(!(err instanceof OnboardingDenied)) {
        discard=true;
        fail('r2b2_audit_storage_unavailable');
      }
      throw err;
    }finally{
      if(locked){
        try{
          const unlocked=await query(client,
            'SELECT pg_advisory_unlock($1::bigint) AS released',[advisoryKey]);
          if(unlocked.rows[0]?.released!==true)discard=true;
        }catch{discard=true;}
      }
      try{client.release(discard);}catch{/* Dead connection is never reused. */}
    }
  }
  return Object.freeze({
    attach:(sub,siteId,connectionId)=>mutate('attach',sub,siteId,connectionId),
    detach:(sub,siteId,connectionId)=>mutate('detach',sub,siteId,connectionId)
  });
}

// This is the only caller-facing orchestration for the R2B2 service.
// User IDs originate solely in validated Keycloak JWTs, and the application
// is never given a direct Admin REST token or unrestricted operation.
export function makeR2B2VerifiedOnboarding({centralConfig,scopedConfig,service,
  keys,pool,auditHmacKey,fetcher=globalThis.fetch,now,onAudit}={}){
  if(!centralConfig||centralConfig.provider!=='keycloak'||
    centralConfig.issuer!==scopedConfig?.issuer||
    typeof service?.connect!=='function'||
    typeof service?.disconnect!=='function'||
    typeof service?.resolve!=='function')
    fail('r2b2_verified_onboarding_unconfigured');
  const isolated=makeR2B2PrivateAdmin({scopedConfig,pool,auditHmacKey,fetcher,onAudit});
  const federation=makeFederatedOnboarding({
    service,keycloak:isolated,
    onDiagnostic:()=>fixedAudit(onAudit,'r2b2_federation_denied')
  });
  async function verified(authorization){
    const identity=await verifyCentralIdentity(authorization,centralConfig,{
      keys,fetcher,now:now??Date.now(),scope:'sites:connect'
    });
    if(!scopedConfig.allowedSubjects.includes(identity.sub.toLowerCase()))
      fail('r2b2_subject_not_approved');
    return identity;
  }
  return Object.freeze({
    connect:async(authorization,payload)=>federation.connect(await verified(authorization),payload),
    disconnect:async(authorization,siteId)=>federation.disconnect(await verified(authorization),siteId)
  });
}
