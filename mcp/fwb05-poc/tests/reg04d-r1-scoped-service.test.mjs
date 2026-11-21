import test from 'node:test';
import assert from 'node:assert/strict';
import {readScopedServiceConfig,requestScopedServiceToken,makeScopedBindingAdmin}
 from '../reg04d-r1/scoped-service.mjs';
const sub='a12833fe-aabc-4eda-84cd-a78900ed0a33';
const foreign='bdc415c9-6ef3-4c45-83fd-12847a4cfbe1';
const issuer='https://auth-lab.example.org/realms/fwb-reg04b-lab';
const secret='very-long-disposable-ci-test-client-secret-1';
const env={
 FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
 FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
 FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',FWB_REG04D_R1_CLIENT_SECRET:secret,
 FWB_REG04D_R1_ALLOWED_SUBJECTS:sub
};
const cfg=readScopedServiceConfig(env);
const token=(overrides={})=>{
 const h=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
 const p=Buffer.from(JSON.stringify({iss:issuer,azp:cfg.clientId,
   sub:'service-account-ephemeral',aud:cfg.adminEndpoint,scope:'kc-admin-api',exp:Math.floor(Date.now()/1000)+240,...overrides})).toString('base64url');
 return h+'.'+p+'.'+('x'.repeat(80));
};
test('service account starts disabled and refuses legacy bearer, master realm, arbitrary clients, no trusted subjects',()=>{
 assert.throws(()=>readScopedServiceConfig({}),/scoped_service_disabled/);
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04C_ADMIN_BEARER:'legacy'}),/legacy_admin_bearer_prohibited/);
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04_ISSUER:'http://issuer.example.org/realms/lab'}));
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04_ISSUER:'https://issuer.example.org/realms/master',FWB_REG04D_R1_CLIENT_ID:'admin-cli'}));
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04D_R1_CLIENT_SECRET:'short'}));
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04D_R1_ALLOWED_SUBJECTS:''}));
 assert.throws(()=>readScopedServiceConfig({...env,FWB_REG04D_R1_ALLOWED_SUBJECTS:sub+','+sub}));
 assert.deepEqual(cfg.allowedSubjects,[sub]);
});
test('service client_credentials never uses password grant and keeps token/secret outside errors',async()=>{
 let calls=0;
 const t=token();
 const fetcher=async(url,options)=>{
   calls++;
   assert.equal(url,issuer+'/protocol/openid-connect/token');
   assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
   const p=new URLSearchParams(options.body);
   assert.equal(p.get('grant_type'),'client_credentials');
   assert.equal(p.get('client_id'),'fwb-onboarding');
   assert.equal(p.get('client_secret'),secret);
   assert.equal(p.get('username'),null);
   return {ok:true,text:async()=>JSON.stringify({access_token:t,token_type:'Bearer',expires_in:240})};
 };
 assert.equal(await requestScopedServiceToken(cfg,fetcher),t);
 assert.equal(calls,1);
 for(const bad of [
   {access_token:t,token_type:'Bearer',expires_in:3601},
   {access_token:t,token_type:'Bearer',expires_in:240,refresh_token:'unexpected'},
   {access_token:t,token_type:'mac',expires_in:240},
   {access_token:token({resource_access:{'realm-management':{roles:['manage-users']}}}),token_type:'Bearer',expires_in:240},
   {access_token:token({realm_access:{roles:['realm-admin']}}),token_type:'Bearer',expires_in:240},
   {access_token:token({iss:'https://attacker.example.org'}),token_type:'Bearer',expires_in:240},
   {access_token:token({azp:'other-client'}),token_type:'Bearer',expires_in:240},
   {access_token:token({aud:'unrelated'}),token_type:'Bearer',expires_in:240},
   {access_token:token({scope:'openid'}),token_type:'Bearer',expires_in:240}
 ]) {
   await assert.rejects(()=>requestScopedServiceToken(cfg,async()=>({
      ok:true,text:async()=>JSON.stringify(bad)
   })));
 }
 await assert.rejects(()=>requestScopedServiceToken(cfg,async()=>({
   ok:false,status:403,text:async()=>secret+' SHOULD NOT LEAK'
 })),e=>{
   assert.equal(e.code,'scoped_token_rejected');
   assert.equal(String(e).includes(secret),false);
   return true;
 });
});
test('service only calls admin for allowlisted verified subject; no override to another user or admin roles',async()=>{
 const site='site_lab',connection='xy'.repeat(12);
 let attrs={},calls=[];
 const fetcher=async(url,o)=>{
   calls.push({url,method:o.method});
   if(url===cfg.tokenEndpoint){
     return {ok:true,text:async()=>JSON.stringify({access_token:token(),token_type:'Bearer',expires_in:240})};
   }
   assert.equal(url,cfg.adminEndpoint+'/users/'+sub);
   assert.equal(o.headers.Authorization,'Bearer '+tokenCache());
   if(o.method==='PUT'){
     attrs=JSON.parse(o.body).attributes;
     return {ok:true};
   }
   return {ok:true,text:async()=>JSON.stringify({id:sub,attributes:attrs})};
 };
 // The test token needs to remain stable for the expected Authorization header.
 const signed=token();
 const tokenCache=()=>signed;
 const stableFetcher=async(url,o)=>{
   if(url===cfg.tokenEndpoint)return {ok:true,text:async()=>JSON.stringify({access_token:signed,token_type:'Bearer',expires_in:240})};
   return fetcher(url,o);
 };
 const admin=makeScopedBindingAdmin({config:cfg,fetcher:stableFetcher});
 await assert.rejects(()=>admin.attach(foreign,site,connection),/scoped_subject_not_approved/);
 assert.equal(calls.length,0);
 assert.equal((await admin.attach(sub,site,connection)).status,'federated');
 assert.deepEqual(attrs.fwb_site_id,[site]);
 assert.equal((await admin.detach(sub,site,connection)).status,'federation_revoked');
 assert.equal(Object.hasOwn(attrs,'fwb_site_id'),false);
 assert.equal(calls.filter(x=>x.url===cfg.adminEndpoint+'/users/'+sub).length,6);
});
