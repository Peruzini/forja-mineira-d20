import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Pool} from 'pg';
import {makeR2B2PrivateAdmin} from '../../mcp/fwb05-poc/reg04d-r2b2/isolated-admin.mjs';
import {readScopedServiceConfig} from '../../mcp/fwb05-poc/reg04d-r1/scoped-service.mjs';

// Isolated GHA runner: real PostgreSQL + real disposable Keycloak 26.8.2.
// Run AFTER native-profile-e2e: that step provisions narrowly scoped FGAP.
const origin='https://auth-lab.example.org';
const realm='fwb-reg04b-lab';
const issuer=origin+'/realms/'+realm;
const prefix=origin+'/admin/realms/'+realm;
const adminPool=new Pool({
 host:'127.0.0.1',port:55432,database:'fwb_r2b2_lab',
 user:'fwb_ci_admin',password:'only-r2b2-ci-postgres-admin',
 max:3,connectionTimeoutMillis:3000
});
const runtimeConfig={
 host:'127.0.0.1',port:55432,database:'fwb_r2b2_lab',
 user:'fwb_r2b2_runtime',password:'only-r2b2-ci-runtime',
 connectionTimeoutMillis:3000,max:4
};
const firstPool=new Pool(runtimeConfig);
const secondPool=new Pool(runtimeConfig);
const auditKey=Buffer.alloc(32,43);
const siteId='site_lab';
const connectionId='r2b2_isolated_binding_20261121';

async function adminToken(){
 const r=await fetch(origin+'/realms/master/protocol/openid-connect/token',{
  method:'POST',redirect:'error',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',
   username:'lab-admin',password:'only-temporary-ci-admin'}).toString()
 });
 assert.equal(r.status,200);
 return (await r.json()).access_token;
}
async function keycloak(token,path){
 const result=await fetch(prefix+path,{method:'GET',redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
 assert.equal(result.status,200);
 return result.json();
}
try{
 await adminPool.query(readFileSync(
  new URL('../../mcp/fwb05-poc/reg04d-r2b2/schema.sql',import.meta.url),'utf8'));
 await adminPool.query("CREATE ROLE fwb_r2b2_runtime LOGIN PASSWORD 'only-r2b2-ci-runtime'");
 await adminPool.query('GRANT CONNECT ON DATABASE fwb_r2b2_lab TO fwb_r2b2_runtime');
 await adminPool.query('GRANT USAGE ON SCHEMA public TO fwb_r2b2_runtime');
 await adminPool.query(
  'GRANT SELECT,INSERT ON fwb_admin_operation_log TO fwb_r2b2_runtime');
 await adminPool.query('GRANT UPDATE(state,code,finished_at) ON fwb_admin_operation_log TO fwb_r2b2_runtime');
 await adminPool.query('GRANT SELECT,INSERT ON fwb_admin_key_epoch TO fwb_r2b2_runtime');
 const master=await adminToken();
 const entries=await keycloak(master,'/users?username=fwb-lab-user&exact=true');
 assert.equal(entries.length,1);
 const subject=entries[0].id;
 const foreign=(await keycloak(master,'/users?username=fwb-foreign-user&exact=true'))[0].id;
 const config=readScopedServiceConfig({
  FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
  FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
  FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',
  FWB_REG04D_R1_CLIENT_SECRET:'r1-disposable-only-scoped-ci-secret-20261121',
  FWB_REG04D_R1_ALLOWED_SUBJECTS:subject
 });
 const userUri=prefix+'/users/'+subject;
 let releaseRead;
 const readGate=new Promise(resolve=>{releaseRead=resolve;});
 let notifyEntered;
 const entered=new Promise(resolve=>{notifyEntered=resolve;});
 let heldOnce=false;
 let auditCodes=[];
 const delayingFetcher=async(url,options)=>{
  if(url===userUri&&options?.method==='GET'&&!heldOnce){
   heldOnce=true;
   notifyEntered();
   await readGate;
  }
  return fetch(url,options);
 };
 const first=makeR2B2PrivateAdmin({scopedConfig:config,pool:firstPool,
   auditHmacKey:auditKey,fetcher:delayingFetcher,
   onAudit:code=>auditCodes.push(code)});
 const second=makeR2B2PrivateAdmin({scopedConfig:config,pool:secondPool,
   auditHmacKey:auditKey,onAudit:code=>auditCodes.push(code)});
 await assert.rejects(()=>second.attach(foreign,siteId,connectionId),
  /r2b2_unapproved_operation/);
 const begin=first.attach(subject,siteId,connectionId);
 await entered;
 await assert.rejects(()=>second.attach(subject,siteId,connectionId),
  /r2b2_subject_busy/);
 releaseRead();
 assert.equal((await begin).status,'federated');
 let user=await keycloak(master,'/users/'+subject);
 assert.equal(user.attributes?.fwb_site_id?.[0],siteId);
 assert.equal(user.attributes?.fwb_connection_id?.[0],connectionId);
 console.log('REG04D_R2B2_REAL_CROSS_INSTANCE_CONCURRENT_ATTACH_SERIALIZED_PASS');

 assert.equal((await second.detach(subject,siteId,connectionId)).status,
  'federation_revoked');
 user=await keycloak(master,'/users/'+subject);
 assert.equal(user.attributes?.fwb_site_id,undefined);
 assert.equal(user.attributes?.fwb_connection_id,undefined);
 console.log('REG04D_R2B2_REAL_SCOPED_ADMIN_ATTACH_DETACH_PASS');

 const completed=await adminPool.query(
  "SELECT state,code,subject_digest FROM fwb_admin_operation_log ORDER BY started_at");
 assert.equal(completed.rows.length,2);
 assert.equal(completed.rows.every(r=>r.state==='confirmed'&&
  r.code==='readback_verified'&&/^[a-f0-9]{64}$/.test(r.subject_digest)),true);
 assert.equal(completed.rows[0].subject_digest,completed.rows[1].subject_digest);
 assert.ok(!JSON.stringify(completed.rows).includes(subject));
 assert.ok(!JSON.stringify(completed.rows).includes(siteId));
 assert.ok(!JSON.stringify(completed.rows).includes(connectionId));
 assert.equal(auditCodes.every(code=>['r2b2_operation_started',
   'r2b2_operation_confirmed','r2b2_manual_review_required'].includes(code)),true);
 console.log('REG04D_R2B2_DURABLE_PSEUDONYMOUS_AUDIT_PASS');

 // Even after an actual external PUT succeeds, connection loss may hide its
 // result. No automatic retry or detachment is permitted: manual review.
 let throwAfterPut=true;
 const uncertainFetcher=async(url,options)=>{
  const response=await fetch(url,options);
  if(url===userUri&&options?.method==='PUT'&&throwAfterPut){
   throwAfterPut=false;
   throw Error('synthetic_network_disconnected_after_put');
  }
  return response;
 };
 const uncertain=makeR2B2PrivateAdmin({scopedConfig:config,pool:firstPool,
   auditHmacKey:auditKey,fetcher:uncertainFetcher});
 await assert.rejects(()=>uncertain.attach(subject,siteId,connectionId),
  /r2b2_manual_review_required/);
 user=await keycloak(master,'/users/'+subject);
 assert.equal(user.attributes?.fwb_site_id?.[0],siteId,
  'synthetic failure must be after real Keycloak PUT');
 const all=await adminPool.query(
  "SELECT state,code FROM fwb_admin_operation_log ORDER BY started_at");
 assert.deepEqual(all.rows.map(r=>r.state),['confirmed','confirmed','manual_review']);
 assert.equal(all.rows[2].code,'uncertain_external_write');
 await assert.rejects(()=>second.detach(subject,siteId,connectionId),
  /r2b2_reconciliation_required/);
 console.log('REG04D_R2B2_REAL_UNKNOWN_PUT_OUTCOME_BLOCKS_RETRY_PASS');
 await assert.rejects(()=>secondPool.query(
  "DELETE FROM fwb_admin_operation_log WHERE state='manual_review'"),
  /permission denied/i);
 console.log('REG04D_R2B2_PG_ROLE_CANNOT_DELETE_AUDIT_PASS');
 console.log('REG04D_R2B2_INTERNAL_ADMIN_ISOLATION_LAB_PASS');
}finally{
 await Promise.allSettled([firstPool.end(),secondPool.end(),adminPool.end()]);
}
