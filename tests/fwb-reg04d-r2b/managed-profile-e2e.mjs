import assert from 'node:assert/strict';
import {readScopedServiceConfig,requestScopedServiceToken}
  from '../../mcp/fwb05-poc/reg04d-r1/scoped-service.mjs';
import {makeFieldRestrictedKeycloakAdmin}
  from '../../mcp/fwb05-poc/reg04d-r2b/restricted-attributes.mjs';

// Disposable lab only, after the R1 FGAP and R2B real binding tests.
// Configure Keycloak's own User Profile schema as an additional defense.
const issuer='https://auth-lab.example.org/realms/fwb-reg04b-lab';
const origin='https://auth-lab.example.org';
const root=origin+'/admin/realms/fwb-reg04b-lab';
const res=await fetch(origin+'/realms/master/protocol/openid-connect/token',{
  method:'POST',redirect:'error',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',
    username:'lab-admin',password:'only-temporary-ci-admin'}).toString()
});
assert.equal(res.status,200);
const bearer=(await res.json()).access_token;
const call=async(path,method='GET',data,authorization=bearer)=>{
 const r=await fetch(root+path,{
  method,redirect:'error',
  headers:{Authorization:'Bearer '+authorization,Accept:'application/json',
    ...(data?{'Content-Type':'application/json'}:{})},
  ...(data?{body:JSON.stringify(data)}:{})
 });
 if(method==='GET'){assert.equal(r.status,200,'GET '+path);return r.json();}
 return r;
};
const profile=await call('/users/profile');
assert.ok(Array.isArray(profile.attributes));
const names=new Set(profile.attributes.map(x=>x.name));
for(const [name,max] of [['fwb_site_id',64],['fwb_connection_id',64]]){
  assert.equal(names.has(name),false,'existing custom schema collision');
  profile.attributes.push({
    name,displayName:'Forja Bridge '+name,
    permissions:{view:['admin'],edit:['admin']}
  });
}
profile.unmanagedAttributePolicy='DISABLED';
const put=await call('/users/profile','PUT',profile);
if(!put.ok){
  // No upstream body, user details, bearer or credential in logs.
  const data=await put.json().catch(()=>({}));
  console.log('REG04D_R2B_SCHEMA_ERROR_KIND',String(data.errorMessage||data.error||'unknown').slice(0,70));
  throw Error('REG04D_R2B_MANAGED_PROFILE_CONFIGURATION_REJECTED_HTTP_'+put.status);
}
const updated=await call('/users/profile');
assert.equal(updated.unmanagedAttributePolicy,'DISABLED');
for(const field of ['fwb_site_id','fwb_connection_id']){
 const x=updated.attributes.find(v=>v.name===field);
 assert.ok(x);
 assert.deepEqual(x.permissions?.edit,['admin']);
 assert.ok(!x.permissions?.edit?.includes('user'));
}
console.log('REG04D_R2B_KEYCLOAK_NATIVE_MANAGED_PROFILE_PASS');
const eligible=(await call('/users?username=fwb-lab-user&exact=true'))[0];
assert.ok(eligible?.id);
const config=readScopedServiceConfig({
 FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
 FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
 FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',
 FWB_REG04D_R1_CLIENT_SECRET:'r1-disposable-only-scoped-ci-secret-20261121',
 FWB_REG04D_R1_ALLOWED_SUBJECTS:eligible.id
});
const scopedToken=await requestScopedServiceToken(config);
const invalid=await call('/users/'+eligible.id,'PUT',
  {attributes:{attempted_unmanaged_field:['forbidden']}},scopedToken);
if(![200,204,400,403].includes(invalid.status))
  throw Error('unexpected_admin_profile_response_'+invalid.status);
const again=await call('/users/'+eligible.id);
assert.equal(again.attributes?.attempted_unmanaged_field,undefined);
console.log('REG04D_R2B_KEYCLOAK_NATIVE_UNMANAGED_ATTR_NOT_PERSISTED_PASS');
const admin=makeFieldRestrictedKeycloakAdmin({config});
const site='site_lab',conn='r2b_managed_schema_verified_2026';
assert.equal((await admin.attach(eligible.id,site,conn)).status,'federated');
const after=await call('/users/'+eligible.id);
assert.equal(after.attributes?.fwb_site_id?.[0],site);
assert.equal(after.attributes?.fwb_connection_id?.[0],conn);
assert.equal((await admin.detach(eligible.id,site,conn)).status,'federation_revoked');
console.log('REG04D_R2B_KEYCLOAK_NATIVE_SCHEMA_BINDING_PASS');
