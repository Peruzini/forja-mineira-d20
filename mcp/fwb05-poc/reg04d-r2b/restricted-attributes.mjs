import { OnboardingDenied, verifyCentralIdentity } from '../reg04/onboarding.mjs';
import { makeFederatedOnboarding } from '../reg04c/federated-onboarding.mjs';
import { requestScopedServiceToken } from '../reg04d-r1/scoped-service.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE=/^[a-z][a-z0-9_-]{2,63}$/;
const CONNECTION=/^[A-Za-z0-9_-]{22,64}$/;
const FIELDS=Object.freeze(['fwb_site_id','fwb_connection_id']);
const PROFILE=Object.freeze(['id','username','email','firstName','lastName',
  'emailVerified','enabled','totp','requiredActions']);

function denied(code) {throw new OnboardingDenied(code);}
function exactObject(value,keys) {
  return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
    Object.keys(value).length===keys.length&&
    Object.keys(value).every(key=>keys.includes(key));
}
function validSubject(config,sub){
  if(typeof sub!=='string'||!UUID.test(sub)||
    !Array.isArray(config?.allowedSubjects)||
    !config.allowedSubjects.includes(sub.toLowerCase()))denied('r2b_subject_not_approved');
}
function bound(attributes,key){
  const value=attributes[key];
  if(value===undefined)return null;
  if(!Array.isArray(value)||value.length!==1||typeof value[0]!=='string')
    denied('r2b_binding_format_invalid');
  return value[0];
}
function validateUser(raw,sub){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.id!==sub)
    denied('r2b_subject_mismatch');
  const attrs=raw.attributes===undefined?{}:raw.attributes;
  if(!attrs||typeof attrs!=='object'||Array.isArray(attrs)||
    Object.getPrototypeOf(attrs)!==Object.prototype||
    Object.keys(attrs).some(key=>!FIELDS.includes(key))) {
    // The Keycloak Admin API applies full attribute replacement on PUT.
    // Only dedicated identities without unrelated custom attributes qualify.
    denied('r2b_subject_not_dedicated');
  }
  const site=bound(attrs,'fwb_site_id'),connection=bound(attrs,'fwb_connection_id');
  if((site===null)!==(connection===null))denied('r2b_partial_binding_denied');
  if(site!==null&&(!SITE.test(site)||!CONNECTION.test(connection)))
    denied('r2b_binding_format_invalid');
  const safeProfile=Object.fromEntries(PROFILE.filter(key=>
    Object.prototype.hasOwnProperty.call(raw,key)).map(key=>[key,raw[key]]));
  return {attrs:Object.freeze({...attrs}),site,connection,
    profile:JSON.stringify(safeProfile),preserved:Object.freeze(safeProfile)};
}
function verifyConfig(config) {
  if(!config?.issuer||!config?.adminEndpoint||!config?.tokenEndpoint||
    !Array.isArray(config?.allowedSubjects)||
    !config.allowedSubjects.length||!config.allowedSubjects.every(v=>UUID.test(v)))
    denied('r2b_admin_unconfigured');
  let issuer,admin,token;
  try{
    issuer=new URL(config.issuer);
    admin=new URL(config.adminEndpoint);
    token=new URL(config.tokenEndpoint);
  }catch{denied('r2b_admin_unconfigured');}
  if(issuer.protocol!=='https:'||issuer.search||issuer.hash||
    admin.origin!==issuer.origin||token.origin!==issuer.origin||
    admin.href!==issuer.origin+'/admin'+issuer.pathname||
    token.href!==config.issuer+'/protocol/openid-connect/token')
    denied('r2b_admin_unconfigured');
}
function profileUnchanged(before,after) {
  if(before.profile!==after.profile)denied('r2b_profile_changed_manual_review');
}
function audit(onAudit,event){
  if(typeof onAudit==='function'){
    // Never include token, user details, site, connection, or HTTP bodies.
    onAudit(event);
  }
}

// PRIVATE SERVER-SIDE ADAPTER ONLY; do not add a public HTTP route that passes
// arbitrary user IDs or attributes. There are precisely two permitted methods.
// This prevents this application's requests from changing anything but the
// pair of FWB binding attributes; FGAP is still a *user-level* authorization.
export function makeFieldRestrictedKeycloakAdmin({config,fetcher=globalThis.fetch,onAudit}={}){
  verifyConfig(config);
  async function request(url,token,method='GET',data){
    if(!['GET','PUT'].includes(method)||
      !url.startsWith(config.adminEndpoint+'/users/'))denied('r2b_admin_operation_denied');
    let response;
    try {
      response=await fetcher(url,{
        method,redirect:'error',signal:AbortSignal.timeout(8000),
        headers:{Authorization:'Bearer '+token,Accept:'application/json',
          ...(data?{'Content-Type':'application/json'}:{})},
        ...(data?{body:JSON.stringify(data)}:{})
      });
    }catch{denied('r2b_admin_unavailable');}
    if(!response?.ok)denied('r2b_admin_permission_denied');
    if(method==='PUT')return null;
    try{
      const text=await response.text();
      if(text.length>20000)denied('r2b_admin_response_invalid');
      return JSON.parse(text);
    }catch{denied('r2b_admin_response_invalid');}
  }
  function siteAndConnection(siteId,connectionId){
    if(typeof siteId!=='string'||!SITE.test(siteId)||
      typeof connectionId!=='string'||!CONNECTION.test(connectionId))
      denied('r2b_binding_invalid');
  }
  async function mutate(action,sub,siteId,connectionId){
    validSubject(config,sub);
    siteAndConnection(siteId,connectionId);
    const token=await requestScopedServiceToken(config,fetcher);
    const endpoint=config.adminEndpoint+'/users/'+encodeURIComponent(sub);
    const before=validateUser(await request(endpoint,token),sub);
    let attributes;
    if(action==='attach'){
      if(before.site!==null)denied('r2b_already_bound');
      attributes={fwb_site_id:[siteId],fwb_connection_id:[connectionId]};
    }else if(action==='detach'){
      if(before.site!==siteId||before.connection!==connectionId)
        denied('r2b_binding_mismatch');
      attributes={};
    }else denied('r2b_admin_operation_denied');
    // Keycloak native validation requires core user fields to survive a PUT.
    // Preserve only the whitelisted profile from the verified Admin API GET.
    // Never forward caller-supplied fields, groups, role mappings or arbitrary
    // properties. After writing, the full core snapshot must still match.
    await request(endpoint,token,'PUT',{...before.preserved,attributes});
    const after=validateUser(await request(endpoint,token),sub);
    profileUnchanged(before,after);
    if(action==='attach'?(after.site!==siteId||after.connection!==connectionId):
      (after.site!==null||after.connection!==null)) {
      denied('r2b_binding_not_confirmed_manual_review');
    }
    audit(onAudit,action==='attach'?'binding_attach_verified':'binding_detach_verified');
    return Object.freeze({site_id:siteId,
      status:action==='attach'?'federated':'federation_revoked'});
  }
  return Object.freeze({
    attach:(sub,siteId,connectionId)=>mutate('attach',sub,siteId,connectionId),
    detach:(sub,siteId,connectionId)=>mutate('detach',sub,siteId,connectionId)
  });
}

// The sole orchestration entrypoint authenticates the untrusted caller using
// the real Keycloak JWT/JWKS verifier. The subject is NEVER taken from payload.
// Connection IDs originate from service.connect and are checked by service
// persistence before disconnect (inherited REG-04C rollback/revocation).
export function makeVerifiedFieldRestrictedOnboarding({
  centralConfig,scopedConfig,service,keys,fetcher=globalThis.fetch,now,onAudit
}={}){
  verifyConfig(scopedConfig);
  if(!centralConfig||centralConfig.provider!=='keycloak'||
    centralConfig.issuer!==scopedConfig.issuer||
    typeof service?.connect!=='function'||typeof service?.disconnect!=='function'||
    typeof service?.resolve!=='function')
    denied('r2b_federation_unconfigured');
  const admin=makeFieldRestrictedKeycloakAdmin({config:scopedConfig,fetcher,onAudit});
  const federation=makeFederatedOnboarding({service,keycloak:admin,
    onDiagnostic:code=>audit(onAudit,['r2b_subject_not_approved','r2b_admin_permission_denied',
      'r2b_admin_unavailable','r2b_binding_not_confirmed_manual_review',
      'r2b_subject_not_dedicated'].includes(code)?code:'federation_failed')});
  const verify=async authorization=>{
    const identity=await verifyCentralIdentity(authorization,centralConfig,
      {keys,fetcher,now:now??Date.now(),scope:'sites:connect'});
    validSubject(scopedConfig,identity.sub);
    return identity;
  };
  return Object.freeze({
    connect:async(authorization,payload)=>federation.connect(await verify(authorization),payload),
    disconnect:async(authorization,siteId)=>federation.disconnect(await verify(authorization),siteId)
  });
}
