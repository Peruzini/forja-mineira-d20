import { OnboardingDenied } from '../reg04/onboarding.mjs';
import { makeKeycloakBindingAdmin } from '../reg04c/federated-onboarding.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9._~-]{80,12000}$/;

// An explicit server-owned allowlist is required until group-bound FGAP v2,
// scoped service accounts and audit have been demonstrated in persistent staging.
// Never derive allowlisted subjects from the caller's HTTP request.
export function readScopedServiceConfig(env=process.env) {
  if(env.FWB_REG04D_R1_SERVICE!=='enabled' || env.FWB_REG04C_FEDERATION!=='enabled')
    throw new OnboardingDenied('scoped_service_disabled');
  if(env.FWB_REG04C_ADMIN_BEARER)
    throw new OnboardingDenied('legacy_admin_bearer_prohibited');
  const raw=env.FWB_REG04_ISSUER;
  let issuer;
  try {issuer=new URL(raw);} catch {throw new OnboardingDenied('scoped_issuer_invalid');}
  if(typeof raw!=='string'||raw!==issuer.href||issuer.protocol!=='https:'||
    issuer.username||issuer.password||issuer.search||issuer.hash||issuer.port||
    !/^[a-z0-9.-]+$/.test(issuer.hostname)||!issuer.hostname.includes('.')||
    !/^\/realms\/[a-z][a-z0-9_-]{2,63}$/.test(issuer.pathname)||
    /(^|\.)(localhost|internal|local)$/.test(issuer.hostname)) {
    throw new OnboardingDenied('scoped_issuer_invalid');
  }
  if(env.FWB_REG04_PROVIDER!=='keycloak')throw new OnboardingDenied('scoped_provider_invalid');
  const clientId=env.FWB_REG04D_R1_CLIENT_ID;
  if(clientId!=='fwb-onboarding')throw new OnboardingDenied('scoped_client_invalid');
  const clientSecret=env.FWB_REG04D_R1_CLIENT_SECRET;
  if(typeof clientSecret!=='string'||clientSecret.length<32||clientSecret.length>512||
    /[\x00-\x1f\x7f]/.test(clientSecret)||clientSecret.trim()!==clientSecret) {
    throw new OnboardingDenied('scoped_secret_missing');
  }
  const allowed=env.FWB_REG04D_R1_ALLOWED_SUBJECTS;
  if(typeof allowed!=='string'||allowed.length>2000)
    throw new OnboardingDenied('scoped_subjects_missing');
  const subjects=allowed.split(',');
  if(subjects.length<1||subjects.length>20||subjects.some(x=>!UUID.test(x))||
    new Set(subjects.map(x=>x.toLowerCase())).size!==subjects.length) {
    throw new OnboardingDenied('scoped_subjects_invalid');
  }
  const realm=issuer.pathname.split('/')[2];
  return Object.freeze({
    issuer:issuer.href,
    tokenEndpoint:issuer.href+'/protocol/openid-connect/token',
    adminEndpoint:issuer.origin+'/admin/realms/'+realm,
    clientId,clientSecret,allowedSubjects:Object.freeze(subjects.map(x=>x.toLowerCase()))
  });
}
function rejectBroadRoles(token,config){
  // Defense in depth ONLY. This unverified payload is never treated as a grant;
  // the Keycloak Admin API is still the authoritative signature/FGAP enforcer.
  const p=token.split('.');
  if(p.length!==3||p[1].length>8192)throw new OnboardingDenied('scoped_token_invalid');
  let claims;
  try {claims=JSON.parse(Buffer.from(p[1],'base64url').toString('utf8'));}
  catch {throw new OnboardingDenied('scoped_token_invalid');}
  const audiences=Array.isArray(claims?.aud)?claims.aud:[claims?.aud];
  if(claims?.iss!==config.issuer||claims?.azp!==config.clientId||
    !audiences.includes('realm-management')||
    typeof claims.exp!=='number'||claims.exp<=Math.floor(Date.now()/1000)+5)
    throw new OnboardingDenied('scoped_token_claims_invalid');
  const roles=claims.resource_access?.['realm-management']?.roles||[];
  if(!Array.isArray(roles)||roles.length>0||
    (Array.isArray(claims.realm_access?.roles)&&
    claims.realm_access.roles.some(x=>['admin','realm-admin'].includes(x)))) {
    throw new OnboardingDenied('scoped_privileges_excessive');
  }
}
export async function requestScopedServiceToken(config,fetcher=globalThis.fetch){
  if(!config?.issuer||!config?.clientSecret||!config?.tokenEndpoint)
    throw new OnboardingDenied('scoped_service_not_configured');
  const form=new URLSearchParams({
    grant_type:'client_credentials',client_id:config.clientId,
    client_secret:config.clientSecret
  });
  let response;
  try{
    response=await fetcher(config.tokenEndpoint,{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(7000),
      headers:{Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},
      body:form.toString()
    });
  }catch{throw new OnboardingDenied('scoped_token_unavailable');}
  if(!response?.ok)throw new OnboardingDenied('scoped_token_rejected');
  let body;
  try{
    const raw=await response.text();
    if(raw.length>18000)throw Error();
    body=JSON.parse(raw);
  }catch{throw new OnboardingDenied('scoped_token_invalid');}
  if(body?.token_type?.toLowerCase()!=='bearer'||!TOKEN.test(body?.access_token||'')||
    !Number.isInteger(body.expires_in)||body.expires_in<15||body.expires_in>900||
    body.refresh_token!==undefined) {
    throw new OnboardingDenied('scoped_token_invalid');
  }
  rejectBroadRoles(body.access_token,config);
  return body.access_token;
}

// No master realm, admin-cli password grant, global management roles, shared
// credential cache or user-supplied subject. Every admin call obtains a scoped
// service token; any FGAP denial stops the operation.
export function makeScopedBindingAdmin({config,fetcher=globalThis.fetch}){
  if(!config?.allowedSubjects||!Array.isArray(config.allowedSubjects))
    throw new OnboardingDenied('scoped_service_not_configured');
  const guard=sub=>{
    if(typeof sub!=='string'||!UUID.test(sub)||!config.allowedSubjects.includes(sub.toLowerCase()))
      throw new OnboardingDenied('scoped_subject_not_approved');
  };
  const client=async()=>{
    const bearer=await requestScopedServiceToken(config,fetcher);
    return makeKeycloakBindingAdmin({config:{
      issuer:config.issuer,endpoint:config.adminEndpoint,adminBearer:bearer
    },fetcher});
  };
  return Object.freeze({
    attach:async(sub,site,connection)=>{
      guard(sub);
      return (await client()).attach(sub,site,connection);
    },
    detach:async(sub,site,connection)=>{
      guard(sub);
      return (await client()).detach(sub,site,connection);
    }
  });
}
