import test from 'node:test';
import assert from 'node:assert/strict';
import { makeR2B2PrivateAdmin,makeR2B2VerifiedOnboarding }
  from '../reg04d-r2b2/isolated-admin.mjs';
import { readScopedServiceConfig } from '../reg04d-r1/scoped-service.mjs';

const id='a12833fe-aabc-4eda-84cd-a78900ed0a33';
const issuer='https://auth.stage.example.org/realms/fwb_lab';
const config=readScopedServiceConfig({
 FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
 FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
 FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',
 FWB_REG04D_R1_CLIENT_SECRET:'r2b2-test-only-secret-is-not-real',
 FWB_REG04D_R1_ALLOWED_SUBJECTS:id
});
const site='site_lab',connection='r2b2_a_unique_connection_20261121';
const key=Buffer.alloc(32,17);

test('R2B2 constructor requires dedicated PostgreSQL session pool and independent HMAC key',()=>{
 assert.throws(()=>makeR2B2PrivateAdmin({scopedConfig:config,pool:null,auditHmacKey:key}),
   /r2b2_private_boundary_unconfigured/);
 assert.throws(()=>makeR2B2PrivateAdmin({scopedConfig:config,
   pool:{connect:()=>{}},auditHmacKey:Buffer.alloc(16)}),
   /r2b2_private_boundary_unconfigured/);
 assert.throws(()=>makeR2B2PrivateAdmin({scopedConfig:{...config,clientId:'admin-cli'},
   pool:{connect:()=>{}},auditHmacKey:key}),/r2b2_private_boundary_unconfigured/);
});
test('private boundary exposes only attach/detach and refuses foreign IDs before database and token calls',async()=>{
 let called=false;
 const pool={connect:async()=>{called=true;throw Error('must not connect');}};
 const isolated=makeR2B2PrivateAdmin({scopedConfig:config,pool,auditHmacKey:key,
   fetcher:async()=>{called=true;throw Error('must not fetch');}});
 assert.deepEqual(Object.keys(isolated),['attach','detach']);
 await assert.rejects(()=>isolated.attach('bdc415c9-6ef3-4c45-83fd-12847a4cfbe1',site,connection),
   /r2b2_unapproved_operation/);
 await assert.rejects(()=>isolated.attach(id,'bad host',connection),/r2b2_unapproved_operation/);
 await assert.rejects(()=>isolated.detach(id,site,'wrong'),/r2b2_unapproved_operation/);
 assert.equal(called,false);
 await assert.rejects(()=>isolated.attach(id,site,connection),/r2b2_audit_storage_unavailable/);
});
test('verified onboarding requires Keycloak context and trusted service, never caller-selected admin surface',()=>{
 const pool={connect:async()=>{throw Error()}};
 assert.throws(()=>makeR2B2VerifiedOnboarding({
   centralConfig:{provider:'legacy',issuer},scopedConfig:config,
   service:{connect:async()=>{},disconnect:async()=>{},resolve:async()=>{}},
   pool,auditHmacKey:key
 }),/r2b2_verified_onboarding_unconfigured/);
});
