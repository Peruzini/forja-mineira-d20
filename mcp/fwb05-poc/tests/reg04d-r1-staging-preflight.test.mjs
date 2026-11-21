import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyStageConfiguration} from '../reg04d-r1/staging-preflight.mjs';
const issuer='https://auth.r1-sandbox.net/realms/fwb_staging';
const env={
  FWB_REG04D_R1_PUBLIC_STAGING:'candidate',
  FWB_REG04_STAGING:'enabled',FWB_REG04_PROVIDER:'keycloak',
  FWB_REG04_ISSUER:issuer,
  FWB_REG04_JWKS_URL:issuer+'/protocol/openid-connect/certs',
  FWB_REG04_RESOURCE:'https://mcp.r1-sandbox.net/api/gateway-mcp',
  FWB_REG04_ALLOWED_WP_HOSTS:'wordpress.r1-sandbox.net',
  FWB_REG04_ENCRYPTION_KEY_B64URL:Buffer.alloc(32,3).toString('base64url'),
  FWB_REG04B_PG_STORAGE:'enabled',
  FWB_REG04B_DATABASE_URL:'postgresql://fwb:fictional-strong-secret@postgres.db.r1-sandbox.net:5432/fwb_stage',
  FWB_REG04C_FEDERATION:'enabled',
  FWB_REG04D_R1_SERVICE:'enabled',
  FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',
  FWB_REG04D_R1_CLIENT_SECRET:'fictional-test-only-service-secret-more-than-32-characters',
  FWB_REG04D_R1_ALLOWED_SUBJECTS:'a12833fe-aabc-4eda-84cd-a78900ed0a33',
  FWB_REG04D_R1_EGRESS:'enabled',
  FWB_REG04D_R1_TLS_REVIEWED:'yes',
  FWB_REG04D_R1_EGRESS_REVIEWED:'yes',
  FWB_REG04D_R1_SECRETS_REVIEWED:'yes'
};
test('staging preflight verifies configuration only and never claims deployment or leaks a secret',()=>{
 const r=verifyStageConfiguration(env);
 assert.equal(r.status,'CONFIGURATION_REVIEWED_NOT_DEPLOYED');
 assert.equal(r.subjectCount,1);
 assert.equal(JSON.stringify(r).includes('fictional-test'),false);
 assert.equal(r.mcpHost,'mcp.r1-sandbox.net');
});
test('stage gate fails closed without actual reviews, separate hosts, TLS or locked configuration',()=>{
 for(const delta of [
  {FWB_REG04D_R1_PUBLIC_STAGING:''},
  {FWB_REG04D_R1_TLS_REVIEWED:''},
  {FWB_REG04D_R1_EGRESS:''},
  {FWB_REG04B_PG_STORAGE:''},
  {FWB_REG04_ISSUER:'https://forjamineirad20.com.br/realms/fwb_staging',
    FWB_REG04_JWKS_URL:'https://forjamineirad20.com.br/realms/fwb_staging/protocol/openid-connect/certs'},
  {FWB_REG04_RESOURCE:'https://mcp.example.org/api/gateway-mcp'},
  {FWB_REG04_RESOURCE:issuer+'/api/gateway-mcp'},
  {FWB_REG04_ALLOWED_WP_HOSTS:'mcp.r1-sandbox.net'},
  {FWB_REG04B_DATABASE_URL:'postgresql://fwb:secret@127.0.0.1:5432/fwb_stage'},
  {FWB_REG04D_R1_CLIENT_SECRET:'too-short'},
  {FWB_REG04B_INSECURE_DB_TEST_ONLY:'enabled'},
  {FWB_REG04D_R1_PRIVATE_EGRESS_TEST:'enabled'},
  {FWB_REG04C_ADMIN_BEARER:'forbidden-legacy-token'}
 ]) assert.throws(()=>verifyStageConfiguration({...env,...delta}));
});
