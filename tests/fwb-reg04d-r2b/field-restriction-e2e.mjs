import assert from 'node:assert/strict';
import {makeFieldRestrictedKeycloakAdmin}
  from '../../mcp/fwb05-poc/reg04d-r2b/restricted-attributes.mjs';
import {readScopedServiceConfig}
  from '../../mcp/fwb05-poc/reg04d-r1/scoped-service.mjs';

// The R1 lab provisioning must run first to create real FGAP policies,
// map kc-admin-api, grant query-users and prove it does NOT grant global admin.
await import('../fwb-reg04d-r1/fgap-service-e2e.mjs');
const issuer='https://auth-lab.example.org/realms/fwb-reg04b-lab';
const origin='https://auth-lab.example.org';
const prefix=origin+'/admin/realms/fwb-reg04b-lab';
const login=await fetch(origin+'/realms/master/protocol/openid-connect/token',{
  method:'POST',redirect:'error',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',
    username:'lab-admin',password:'only-temporary-ci-admin'}).toString()
});
assert.equal(login.status,200);
const token=(await login.json()).access_token;
const admin=async(path,method='GET',data)=>{
  const response=await fetch(prefix+path,{method,redirect:'error',
    headers:{Authorization:'Bearer '+token,Accept:'application/json',
      ...(data?{'Content-Type':'application/json'}:{})},
    ...(data?{body:JSON.stringify(data)}:{})});
  assert.ok(response.ok,'lab-admin setup: '+method+' HTTP '+response.status);
  if(method==='GET')return response.json();
};
const eligible=(await admin('/users?username=fwb-lab-user&exact=true'))[0];
const foreign=(await admin('/users?username=fwb-foreign-user&exact=true'))[0];
assert.ok(eligible?.id&&foreign?.id);
const conf=readScopedServiceConfig({
  FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
  FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
  FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',
  FWB_REG04D_R1_CLIENT_SECRET:'r1-disposable-only-scoped-ci-secret-20261121',
  FWB_REG04D_R1_ALLOWED_SUBJECTS:eligible.id
});
const uri=prefix+'/users/'+eligible.id;
let writes=0;
const fetcher=(url,options)=>{
  if(options?.method==='PUT'){
    writes++;
    assert.equal(url,uri,'R2B must never update another user or admin endpoint');
    const body=JSON.parse(options.body);
    assert.ok(Object.keys(body).every(k=>['id','username','email','firstName',
       'lastName','emailVerified','enabled','totp','requiredActions',
       'attributes'].includes(k)));
     assert.equal(typeof body.username,'string');
    assert.deepEqual(Object.keys(body.attributes).sort(),
      Object.keys(body.attributes).filter(k=>['fwb_site_id','fwb_connection_id'].includes(k)).sort());
  }
  return fetch(url,options);
};
const restricted=makeFieldRestrictedKeycloakAdmin({config:conf,fetcher,
  onAudit:code=>console.log('REG04D_R2B_AUDIT',code)});
const site='site_lab',connection='r2b_test_verified_binding_2026';
const original=await admin('/users/'+eligible.id);
const snapshot=Object.fromEntries(
  ['username','email','enabled','emailVerified','firstName','lastName']
    .map(key=>[key,original[key]])
);
assert.equal(writes,0);
await assert.rejects(()=>restricted.attach(foreign.id,site,connection),
  /r2b_subject_not_approved/);
assert.equal(writes,0);
console.log('REG04D_R2B_REAL_FOREIGN_USER_REFUSED_BEFORE_ADMIN_IO_PASS');

// Demonstrate that the strict adapter will never accidentally replace/delete
// another Keycloak attribute, since PUT /users is a full attributes replacement.
await admin('/users/'+eligible.id,'PUT',{attributes:{unrelated_custom_attribute:['keep-me']}});
const before=await admin('/users/'+eligible.id);
assert.deepEqual(before.attributes?.unrelated_custom_attribute,['keep-me']);
await assert.rejects(()=>restricted.attach(eligible.id,site,connection),
  /r2b_subject_not_dedicated/);
assert.equal(writes,0,'no facade PUT allowed when non-FWB attrs exist');
assert.deepEqual((await admin('/users/'+eligible.id)).attributes?.unrelated_custom_attribute,['keep-me']);
console.log('REG04D_R2B_REAL_UNRELATED_ATTRIBUTE_NOT_OVERWRITTEN_PASS');
await admin('/users/'+eligible.id,'PUT',{attributes:{}});
const clear=await admin('/users/'+eligible.id);
assert.equal(clear.attributes?.unrelated_custom_attribute,undefined);
const attached=await restricted.attach(eligible.id,site,connection);
assert.equal(attached.status,'federated');
const linked=await admin('/users/'+eligible.id);
assert.equal(linked.attributes?.fwb_site_id?.[0],site);
assert.equal(linked.attributes?.fwb_connection_id?.[0],connection);
const profile=x=>Object.fromEntries(Object.keys(snapshot).map(k=>[k,x[k]]));
assert.deepEqual(profile(linked),snapshot);
await assert.rejects(()=>restricted.attach(eligible.id,site,connection),/r2b_already_bound/);
await assert.rejects(()=>restricted.detach(eligible.id,site,'wrongConnection000000000000'),
  /r2b_binding_mismatch/);
assert.equal((await restricted.detach(eligible.id,site,connection)).status,'federation_revoked');
const final=await admin('/users/'+eligible.id);
assert.deepEqual(profile(final),snapshot);
assert.equal(final.attributes?.fwb_site_id,undefined);
assert.equal(final.attributes?.fwb_connection_id,undefined);
assert.equal(writes,2,'exactly two PUTs from restricted facade');
console.log('REG04D_R2B_REAL_FIELD_ONLY_WRITES_AND_CORE_PROFILE_UNCHANGED_PASS');
console.log('REG04D_R2B_REAL_ATTACH_DETACH_READBACK_PASS');
