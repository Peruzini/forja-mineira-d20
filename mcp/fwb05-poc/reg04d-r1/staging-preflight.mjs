import { isIP } from 'node:net';
import { readCentralConfig, OnboardingDenied } from '../reg04/onboarding.mjs';
import { readScopedServiceConfig } from './scoped-service.mjs';

const PROD=new Set(['forjamineirad20.com.br','www.forjamineirad20.com.br']);
function publicStage(u,label,expectedPath){
  let url;
  try{url=new URL(u);}catch{throw new OnboardingDenied(label+'_invalid');}
  if(typeof u!=='string'||u!==url.href||url.protocol!=='https:'||url.port||
    url.username||url.password||url.hash||url.search||
    (expectedPath&&url.pathname!==expectedPath)||
    !url.hostname.includes('.')||isIP(url.hostname)!==0||
    PROD.has(url.hostname)|| /(^|\.)(example\.(org|net|com)|invalid|test|local|localhost|internal)$/.test(url.hostname)) {
    throw new OnboardingDenied(label+'_invalid');
  }
  return url;
}
// PURE validation. It does not deploy, provision certificates, migrate DB,
// verify that URLs resolve, or claim public HTTP reachability.
export function verifyStageConfiguration(env=process.env){
  if(env.FWB_REG04D_R1_PUBLIC_STAGING!=='candidate')throw new OnboardingDenied('public_stage_not_authorized');
  if(env.FWB_REG04D_R1_EGRESS!=='enabled'||
    env.FWB_REG04B_PG_STORAGE!=='enabled')throw new OnboardingDenied('stage_security_gate_missing');
  const central=readCentralConfig(env);
  if(central.provider!=='keycloak')throw new OnboardingDenied('stage_provider_invalid');
  const scoped=readScopedServiceConfig(env);
  const resource=publicStage(central.resource,'mcp_stage','/api/gateway-mcp');
  const issuer=publicStage(central.issuer,'issuer_stage');
  const wp=central.hosts.map(x=>publicStage('https://'+x+'/','wordpress_stage','/'));
  if(central.hosts.length!==1||new Set([resource.hostname,issuer.hostname,wp[0].hostname]).size!==3) {
    throw new OnboardingDenied('stage_services_not_isolated');
  }
  if(central.jwks!==central.issuer+'/protocol/openid-connect/certs'||
    scoped.issuer!==central.issuer)throw new OnboardingDenied('stage_issuer_mismatch');
  let db;
  try{db=new URL(env.FWB_REG04B_DATABASE_URL);}catch{throw new OnboardingDenied('stage_postgres_invalid');}
  if(!['postgres:','postgresql:'].includes(db.protocol)||!db.username||
    !db.password||db.hash||db.search||!db.pathname||db.pathname==='/'||
    !db.hostname||isIP(db.hostname)!==0||
    ['localhost','127.0.0.1','postgres','db'].includes(db.hostname)){
    throw new OnboardingDenied('stage_postgres_invalid');
  }
  if(env.FWB_REG04B_INSECURE_DB_TEST_ONLY==='enabled'||
    env.FWB_REG04D_R1_PRIVATE_EGRESS_TEST==='enabled'||
    env.NODE_ENV==='test')throw new OnboardingDenied('stage_test_bypass_prohibited');
  if(env.FWB_REG04D_R1_TLS_REVIEWED!=='yes'||env.FWB_REG04D_R1_EGRESS_REVIEWED!=='yes'||
    env.FWB_REG04D_R1_SECRETS_REVIEWED!=='yes') {
    throw new OnboardingDenied('stage_security_review_missing');
  }
  return Object.freeze({
    status:'CONFIGURATION_REVIEWED_NOT_DEPLOYED',
    issuerHost:issuer.hostname,mcpHost:resource.hostname,wordpressHost:wp[0].hostname,
    databaseHost:db.hostname,subjectCount:scoped.allowedSubjects.length,
    noProductionHosts:true,issuerPkiRequired:true,postgresTlsRequired:true
  });
}
