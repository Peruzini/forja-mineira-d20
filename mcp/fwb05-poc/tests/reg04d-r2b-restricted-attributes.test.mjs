import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync,sign } from 'node:crypto';
import { makeFieldRestrictedKeycloakAdmin,makeVerifiedFieldRestrictedOnboarding }
  from '../reg04d-r2b/restricted-attributes.mjs';
import { readScopedServiceConfig } from '../reg04d-r1/scoped-service.mjs';
import { readCentralConfig } from '../reg04/onboarding.mjs';

const id='a12833fe-aabc-4eda-84cd-a78900ed0a33';
const other='bdc415c9-6ef3-4c45-83fd-12847a4cfbe1';
const issuer='https://auth.stage.example.org/realms/fwb_lab';
const secret='ci-only-field-restricted-service-secret-20261121';
const env={
 FWB_REG04_STAGING:'enabled',FWB_REG04_PROVIDER:'keycloak',
 FWB_REG04_ISSUER:issuer,FWB_REG04_JWKS_URL:issuer+'/protocol/openid-connect/certs',
 FWB_REG04_RESOURCE:'https://mcp.stage.example.org/api/gateway-mcp',
 FWB_REG04_ALLOWED_WP_HOSTS:'wp.stage.example.org',
 FWB_REG04_ENCRYPTION_KEY_B64URL:Buffer.alloc(32,1).toString('base64url'),
 FWB_REG04C_FEDERATION:'enabled',FWB_REG04D_R1_SERVICE:'enabled',
 FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',FWB_REG04D_R1_CLIENT_SECRET:secret,
 FWB_REG04D_R1_ALLOWED_SUBJECTS:id
};
const cfg=readScopedServiceConfig(env);
const token=()=>{
 const head=Buffer.from(JSON.stringify({alg:'RS256'})).toString('base64url');
 const claims=Buffer.from(JSON.stringify({
   iss:issuer,azp:'fwb-onboarding',aud:cfg.adminEndpoint,
   scope:'kc-admin-api',exp:Math.floor(Date.now()/1000)+120,
   resource_access:{'realm-management':{roles:['query-users']}}
 })).toString('base64url');
 return head+'.'+claims+'.'+('x'.repeat(90));
};
const t=token();
function mock(initial={},opts={}){
 const records=new Map([[id,{id,username:'alice',email:'alice@example.invalid',
   emailVerified:true,enabled:true,attributes:structuredClone(initial)}]]);
 const calls=[];
 const fetcher=async(url,options)=>{
   if(url===cfg.tokenEndpoint){
     calls.push({type:'token',url});
     return {ok:true,text:async()=>JSON.stringify({
       access_token:t,token_type:'Bearer',expires_in:120
     })};
   }
   const parsed=new URL(url);
   assert.equal(parsed.origin,new URL(issuer).origin);
   assert.equal(url,cfg.adminEndpoint+'/users/'+id);
   assert.equal(options.redirect,'error');
   assert.equal(options.headers.Authorization,'Bearer '+t);
   if(options.method==='GET'){
     calls.push({type:'read'});
     return {ok:true,text:async()=>JSON.stringify(records.get(id))};
   }
   if(options.method==='PUT'){
     const body=JSON.parse(options.body);
     calls.push({type:'write',body});
     assert.deepEqual(Object.keys(body),['attributes']);
     assert.deepEqual(Object.keys(body.attributes).sort(),
       Object.keys(body.attributes).filter(x=>['fwb_site_id','fwb_connection_id'].includes(x)).sort());
     const u=records.get(id);
     u.attributes={...body.attributes};
     if(opts.changeProfile)u.enabled=false;
     if(opts.dropConnection)delete u.attributes.fwb_connection_id;
     return {ok:true};
   }
   throw new Error('unexpected admin method');
 };
 return {fetcher,records,calls,client:makeFieldRestrictedKeycloakAdmin({config:cfg,fetcher})};
}
const site='site_lab',conn='abcDEF0123456789xyzABCDE';

test('restricted facade exports only attach/detach and writes only the two owned attributes',async()=>{
 const m=mock();
 assert.deepEqual(Object.keys(m.client),['attach','detach']);
 assert.equal((await m.client.attach(id,site,conn)).status,'federated');
 assert.deepEqual(m.records.get(id).attributes,{fwb_site_id:[site],fwb_connection_id:[conn]});
 assert.equal(m.records.get(id).email,'alice@example.invalid');
 assert.equal(m.records.get(id).enabled,true);
 await assert.rejects(()=>m.client.attach(id,site,conn),/r2b_already_bound/);
 assert.equal((await m.client.detach(id,site,conn)).status,'federation_revoked');
 assert.deepEqual(m.records.get(id).attributes,{});
 assert.equal(m.calls.filter(x=>x.type==='write').length,2);
 assert.equal(m.calls.filter(x=>x.type==='write').every(x=>
  Object.keys(x.body).join(',')==='attributes'),true);
});
test('no foreign subject, invalid values, mismatches or partially bound state can reach Keycloak PUT',async()=>{
 const m=mock();
 await assert.rejects(()=>m.client.attach(other,site,conn),/r2b_subject_not_approved/);
 await assert.rejects(()=>m.client.attach(id,'bad site',conn),/r2b_binding_invalid/);
 await assert.rejects(()=>m.client.attach(id,site,'too-short'),/r2b_binding_invalid/);
 await assert.rejects(()=>m.client.detach(id,site,conn),/r2b_binding_mismatch/);
 assert.equal(m.calls.some(x=>x.type==='write'),false);
 const n=mock({fwb_site_id:[site]});
 await assert.rejects(()=>n.client.attach(id,site,conn),/r2b_partial_binding_denied/);
 assert.equal(n.calls.some(x=>x.type==='write'),false);
});
test('non-FWB custom user attributes are never replaced or deleted, even for eligible subject',async()=>{
 const m=mock({favorite_color:['red'],email_verified:['true']});
 await assert.rejects(()=>m.client.attach(id,site,conn),/r2b_subject_not_dedicated/);
 assert.deepEqual(m.records.get(id).attributes,{favorite_color:['red'],email_verified:['true']});
 assert.equal(m.calls.some(x=>x.type==='write'),false);
});
test('profile modification or failed binding readback triggers manual review without leaking secrets',async()=>{
 const m=mock({}, {changeProfile:true});
 await assert.rejects(()=>m.client.attach(id,site,conn),e=>{
   assert.equal(e.code,'r2b_profile_changed_manual_review');
   assert.equal(String(e).includes(secret),false);return true;
 });
 const n=mock({}, {dropConnection:true});
 await assert.rejects(()=>n.client.attach(id,site,conn),/r2b_partial_binding_denied/);
});
test('arbitrary realm endpoint, hostile admin destination or missing allowlist rejected before any fetch',()=>{
 assert.throws(()=>makeFieldRestrictedKeycloakAdmin({config:{...cfg,
   adminEndpoint:'https://evil.example.org/admin/realms/fwb_lab'},fetcher:async()=>{throw Error();}}),
 /r2b_admin_unconfigured/);
 assert.throws(()=>makeFieldRestrictedKeycloakAdmin({config:{...cfg,
   allowedSubjects:[]}}),/r2b_admin_unconfigured/);
});
test('verified onboarding rejects forged caller subject and uses only signed sub for federated attach',async()=>{
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk={...publicKey.export({format:'jwk'}),kid:'r2b-test',use:'sig',alg:'RS256'};
 const central=readCentralConfig(env);
 const now=Date.now();
 const makeUserBearer=(sub,overrides={})=>{
   const h=Buffer.from(JSON.stringify({typ:'at+jwt',alg:'RS256',kid:'r2b-test'})).toString('base64url');
   const p=Buffer.from(JSON.stringify({
     iss:issuer,aud:central.resource,sub,scope:'posts:read sites:connect',
     iat:Math.floor(now/1000),exp:Math.floor(now/1000)+300,...overrides
   })).toString('base64url');
   return 'Bearer '+h+'.'+p+'.'+sign('RSA-SHA256',Buffer.from(h+'.'+p),privateKey).toString('base64url');
 };
 const m=mock();
 let attachedSub,deleted=false;
 const service={
   connect:async(identity,payload)=>{
     assert.equal(identity.sub,id);
     assert.equal(payload.admin_user,'wordpress-lab-admin');
     attachedSub=identity.sub;
     return {site_id:site,connection_id:conn,status:'connected'};
   },
   resolve:async(identity,x)=>{assert.equal(identity.sub,id);assert.equal(x,site);return {};},
   disconnect:async(identity,x)=>{assert.equal(identity.sub,id);assert.equal(x,site);deleted=true;return {site_id:site,status:'disconnected'};}
 };
 const wrapper=makeVerifiedFieldRestrictedOnboarding({centralConfig:central,
   scopedConfig:cfg,service,keys:[jwk],fetcher:m.fetcher,now});
 await assert.rejects(()=>wrapper.connect('Bearer forged.token.value',{admin_user:'wordpress-lab-admin'}));
 await assert.rejects(()=>wrapper.connect(makeUserBearer(other),{admin_user:'wordpress-lab-admin'}));
 assert.equal(m.calls.length,0);
 const result=await wrapper.connect(makeUserBearer(id),{admin_user:'wordpress-lab-admin',
   sub:other,attributes:{email:['evil']},site_id:'other_site'});
 assert.equal(result.federated,true);
 assert.equal(attachedSub,id);
 assert.deepEqual(m.records.get(id).attributes,{fwb_site_id:[site],fwb_connection_id:[conn]});
 await assert.rejects(()=>wrapper.disconnect(makeUserBearer(id,{site_id:site,connection_id:'wrong-connection-id'}),site),
   /r2b_binding_mismatch|binding_revoked_idp_cleanup_pending/);
 // The existing federated-onboarding disconnect removes DB before Keycloak cleanup:
 // use a fresh isolated mock for the successful disconnect proof.
 const fresh=mock({fwb_site_id:[site],fwb_connection_id:[conn]});
 const safe=makeVerifiedFieldRestrictedOnboarding({centralConfig:central,scopedConfig:cfg,
   service,keys:[jwk],fetcher:fresh.fetcher,now});
 assert.equal((await safe.disconnect(makeUserBearer(id,{site_id:site,connection_id:conn}),site)).status,'disconnected');
 assert.equal(deleted,true);
 assert.deepEqual(fresh.records.get(id).attributes,{});
});
