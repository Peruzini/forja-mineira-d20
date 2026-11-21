import { OnboardingDenied } from '../reg04/onboarding.mjs';

// REG-04C: privileged credentials belong to an internal backend service,
// never to the MCP caller, browser, plugin, or WordPress application password.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE=/^[a-z][a-z0-9_-]{2,63}$/;
const CONNECTION=/^[A-Za-z0-9_-]{22,64}$/;
const bound=(attributes,name)=>{
  const value=attributes?.[name];
  return Array.isArray(value)&&value.length===1&&typeof value[0]==='string'?value[0]:null;
};
export function readKeycloakAdminConfig(env=process.env){
  if(env.FWB_REG04C_FEDERATION!=='enabled') throw new OnboardingDenied('federation_disabled');
  const issuer=env.FWB_REG04_ISSUER;
  let url;
  try{url=new URL(issuer);}catch{throw new OnboardingDenied('issuer_invalid');}
  if(typeof issuer!=='string'||issuer!==url.href||url.protocol!=='https:'||
    url.port||url.username||url.password||url.hash||url.search||
    !/^\/realms\/[a-z][a-z0-9_-]{2,63}$/.test(url.pathname)) {
    throw new OnboardingDenied('issuer_invalid');
  }
  // Admin credentials must be provisioned via a separate, scoped client-credentials
  // flow; a raw admin bearer is an injectable test primitive ONLY, not a deployment contract.
  const token=env.FWB_REG04C_ADMIN_BEARER;
  if(typeof token!=='string'||token.length<40||token.length>12000||
    !/^[A-Za-z0-9._~-]+$/.test(token)) throw new OnboardingDenied('admin_service_not_configured');
  const realm=url.pathname.split('/')[2];
  return Object.freeze({issuer,endpoint:url.origin+'/admin/realms/'+realm,
    adminBearer:token});
}

export function makeKeycloakBindingAdmin({config,fetcher=globalThis.fetch}){
  if(!config?.endpoint||!config?.adminBearer||
    new URL(config.endpoint).origin!==new URL(config.issuer).origin) {
    throw new OnboardingDenied('admin_service_not_configured');
  }
  async function request(url,method='GET',body){
    let response;
    try {
      response=await fetcher(url,{
        method,redirect:'error',signal:AbortSignal.timeout(8000),
        headers:{Authorization:'Bearer '+config.adminBearer,
          Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},
        ...(body?{body:JSON.stringify(body)}:{})
      });
    }catch{throw new OnboardingDenied('keycloak_admin_unavailable');}
    if(!response || !response.ok) throw new OnboardingDenied('keycloak_admin_rejected');
    if(method==='PUT')return null;
    let data;
    try {
      const raw=await response.text();
      if(raw.length>20000)throw Error();
      data=JSON.parse(raw);
    }catch{throw new OnboardingDenied('keycloak_admin_invalid');}
    if(!data||typeof data!=='object'||Array.isArray(data))throw new OnboardingDenied('keycloak_admin_invalid');
    return data;
  }
  async function user(sub){
    if(typeof sub!=='string'||!UUID.test(sub))throw new OnboardingDenied('keycloak_subject_invalid');
    const result=await request(config.endpoint+'/users/'+encodeURIComponent(sub));
    if(result.id!==sub)throw new OnboardingDenied('keycloak_subject_mismatch');
    if(result.attributes!==undefined &&
       (!result.attributes||typeof result.attributes!=='object'||Array.isArray(result.attributes))) {
      throw new OnboardingDenied('keycloak_attributes_invalid');
    }
    return result;
  }
  async function putAndVerify(sub,attrs,expectedSite,expectedConnection){
    const path=config.endpoint+'/users/'+encodeURIComponent(sub);
    await request(path,'PUT',{attributes:attrs});
    const updated=await user(sub);
    if(bound(updated.attributes,'fwb_site_id')!==expectedSite||
       bound(updated.attributes,'fwb_connection_id')!==expectedConnection) {
      throw new OnboardingDenied('keycloak_binding_not_confirmed');
    }
  }
  async function attach(sub,siteId,connectionId){
    if(!SITE.test(siteId)||!CONNECTION.test(connectionId))throw new OnboardingDenied('binding_invalid');
    const existing=await user(sub);
    if(bound(existing.attributes,'fwb_site_id')||bound(existing.attributes,'fwb_connection_id')) {
      throw new OnboardingDenied('user_already_has_binding');
    }
    const attrs={...existing.attributes,fwb_site_id:[siteId],fwb_connection_id:[connectionId]};
    await putAndVerify(sub,attrs,siteId,connectionId);
    return {site_id:siteId,status:'federated'};
  }
  async function detach(sub,siteId,connectionId){
    if(!SITE.test(siteId)||!CONNECTION.test(connectionId))throw new OnboardingDenied('binding_invalid');
    const existing=await user(sub);
    if(bound(existing.attributes,'fwb_site_id')!==siteId||
       bound(existing.attributes,'fwb_connection_id')!==connectionId) {
      throw new OnboardingDenied('binding_mismatch');
    }
    const attrs={...existing.attributes};
    delete attrs.fwb_site_id;
    delete attrs.fwb_connection_id;
    await putAndVerify(sub,attrs,null,null);
    return {site_id:siteId,status:'federation_revoked'};
  }
  return {attach,detach};
}

// One caller identity / one Keycloak subject: no bearer from the request may
// override the admin API token or select a different Keycloak account.
export function makeFederatedOnboarding({service,keycloak,onDiagnostic}){
  if(typeof service?.connect!=='function'||typeof service?.disconnect!=='function'||
    typeof service?.resolve!=='function'||typeof keycloak?.attach!=='function'||
    typeof keycloak?.detach!=='function') {
    throw new OnboardingDenied('federation_dependencies_missing');
  }
  async function connect(identity,payload){
    const connected=await service.connect(identity,payload);
    try{
      await keycloak.attach(identity.sub,connected.site_id,connected.connection_id);
    }catch(error){
      // Only a fixed internal error code, never upstream payload, IDs or tokens.
      if(typeof onDiagnostic==='function'){
        onDiagnostic(error instanceof OnboardingDenied ? error.code : 'unknown_idp_error');
      }
      // Do not leave an active MCP binding after a failed/uncertain IdP update.
      try{await service.disconnect(identity,connected.site_id);}catch{
        throw new OnboardingDenied('federation_rollback_failed_manual_review');
      }
      throw new OnboardingDenied('federation_failed_rolled_back');
    }
    return Object.freeze({...connected,federated:true,reauthorization_required:true});
  }
  async function disconnect(identity,siteId){
    // Existing short-lived JWT may still carry claims, but deletion of the
    // persisted connection immediately prevents their use at the gateway.
    const record=await service.resolve(identity,siteId);
    const result=await service.disconnect(identity,siteId);
    try{
      await keycloak.detach(identity.sub,siteId,identity.connectionId);
    }catch{
      throw new OnboardingDenied('binding_revoked_idp_cleanup_pending');
    }
    return Object.freeze({...result,federated:false});
  }
  return {connect,disconnect};
}
