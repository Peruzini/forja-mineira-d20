import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeNativeFwbProfile,verifyNativeFwbProfile}
  from '../../mcp/fwb05-poc/reg04d-r2b1/native-profile.mjs';

// A disposable Keycloak realm with no ADM_EDIT preflight; never public staging.
const origin='https://auth-lab.example.org';
const realm='fwb-reg04b-lab';
const realmRoot=origin+'/admin/realms/'+realm;
const auth=await fetch(origin+'/realms/master/protocol/openid-connect/token',{
 method:'POST',redirect:'error',
 headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',
  username:'lab-admin',password:'only-temporary-ci-admin'}).toString()
});
assert.equal(auth.status,200);
const adminToken=(await auth.json()).access_token;
assert.ok(adminToken?.length>100);
async function api(path,method='GET',body,token=adminToken){
 const res=await fetch(realmRoot+path,{method,redirect:'error',
  headers:{Authorization:'Bearer '+token,Accept:'application/json',
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 return res;
}
async function read(path){
 const r=await api(path);
 assert.equal(r.status,200,'ADMIN_GET_'+path);
 return r.json();
}
const initial=await read('/users/profile');
assert.equal(initial.unmanagedAttributePolicy,undefined,
 'only a fresh default-profile realm qualifies for this test');
const configured=makeNativeFwbProfile(initial);
const change=await api('/users/profile','PUT',configured);
assert.equal(change.status,200,'Keycloak accepted complete native managed attributes schema');
const stable=await read('/users/profile');
verifyNativeFwbProfile(stable);
assert.equal(stable.attributes.length,initial.attributes.length+2);
console.log('REG04D_R2B1_NATIVE_DEFAULT_PROFILE_AND_ADMIN_ONLY_SCHEMA_PASS');

const eligible=(await read('/users?username=fwb-lab-user&exact=true'))[0];
const foreign=(await read('/users?username=fwb-foreign-user&exact=true'))[0];
assert.ok(eligible?.id && foreign?.id && eligible.id!==foreign.id);
let before=await read('/users/'+eligible.id);
const baseFields=['username','email','emailVerified','enabled','firstName','lastName'];
const baseBefore=Object.fromEntries(baseFields.map(k=>[k,before[k]]));

// Real negative write with a privileged administrator token.
// The runtime MUST discard undeclared attributes even if the Admin API
// returns 204. If the write is rejected, assert no partial persistence.
const unmanagedName='fwb_r2b1_undeclared_attempt';
const unexpected=await api('/users/'+eligible.id,'PUT',{
 username:before.username,
 attributes:{[unmanagedName]:['should_not_store']}
});
assert.ok([200,204,400,403].includes(unexpected.status),
 'unexpected native-profile unmanaged-write response');
const after=await read('/users/'+eligible.id);
assert.equal(after.attributes?.[unmanagedName],undefined,
 'UNMANAGED ATTRIBUTE PERSISTED: default policy is NOT safe');
console.log('REG04D_R2B1_REAL_UNMANAGED_ATTR_WRITE_NOT_PERSISTED_PASS');

// Prove that the existing least-privilege service still functions under the
// managed profile, and remains unable to see a different subject or clients.
await import('../fwb-reg04d-r1/fgap-service-e2e.mjs');
console.log('REG04D_R2B1_REAL_FGAP_AND_BINDING_REGRESSION_PASS');

// User Profile permissions are independent of FGAP: the ordinary account
// must never be able to mutate the two admin-only FWB attributes.
const lab=JSON.parse(readFileSync(new URL('../fwb-reg04d-r1/keycloak-realm.json',
 import.meta.url),'utf8'));
const user=lab.users.find(u=>u.username==='fwb-lab-user');
const password=user?.credentials?.find(c=>c.type==='password')?.value;
assert.ok(password,'CI-only fixture user missing');
const clientId='fwb-r2b1-account-tests';
const create=await api('/clients','POST',{
 clientId,name:'R2B1 disposable account REST negative test',enabled:true,
 publicClient:true,protocol:'openid-connect',directAccessGrantsEnabled:true,
 standardFlowEnabled:false,implicitFlowEnabled:false
});
assert.equal(create.status,201,'create CI-only public password-grant test client');
const login=await fetch(origin+'/realms/'+realm+'/protocol/openid-connect/token',{
 method:'POST',redirect:'error',
 headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:new URLSearchParams({grant_type:'password',client_id:clientId,
 username:'fwb-lab-user',password}).toString()
});
assert.equal(login.status,200,'authenticate CI-only end user');
const userBearer=(await login.json()).access_token;
assert.ok(userBearer?.length>100);
const adminDenied=await api('/users/'+eligible.id,'GET',undefined,userBearer);
assert.ok([401,403].includes(adminDenied.status),
 'ordinary user can access Keycloak Admin API');
const accountUrl=origin+'/realms/'+realm+'/account';
const userAccount=await fetch(accountUrl,{
 headers:{Authorization:'Bearer '+userBearer,Accept:'application/json'},
 redirect:'error'
});
console.log('REG04D_R2B1_ACCOUNT_ENDPOINT_GET_STATUS',userAccount.status);
if(userAccount.status===200){
 const profile=await userAccount.json();
 const req=await fetch(accountUrl,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+userBearer,Accept:'application/json',
   'Content-Type':'application/json'},
  body:JSON.stringify({...profile,
   attributes:{fwb_site_id:['rogue_site'],fwb_connection_id:['user_edited_binding_123456']}})
 });
 assert.ok([200,204,400,401,403,405].includes(req.status));
 const checked=await read('/users/'+eligible.id);
 assert.equal(checked.attributes?.fwb_site_id,undefined);
 assert.equal(checked.attributes?.fwb_connection_id,undefined);
 console.log('REG04D_R2B1_REAL_END_USER_CANNOT_EDIT_ADMIN_ONLY_FIELDS_PASS');
}else{
 console.log('REG04D_R2B1_ACCOUNT_ENDPOINT_NOT_AVAILABLE_ON_LAB_CLIENT');
}
const finalUser=await read('/users/'+eligible.id);
assert.deepEqual(Object.fromEntries(baseFields.map(k=>[k,finalUser[k]])),baseBefore);
console.log('REG04D_R2B1_REAL_CORE_USER_PROFILE_UNCHANGED_PASS');
