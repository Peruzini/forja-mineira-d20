import assert from 'node:assert/strict';
import { readScopedServiceConfig, requestScopedServiceToken, makeScopedBindingAdmin }
  from '../../mcp/fwb05-poc/reg04d-r1/scoped-service.mjs';

const issuer='https://auth-lab.example.org/realms/fwb-reg04b-lab';
const realm='fwb-reg04b-lab';
const origin='https://auth-lab.example.org';
const secret='r1-disposable-only-scoped-ci-secret-20261121';

async function api(url,{token,method='GET',data}={}){
 const res=await fetch(url,{method,redirect:'error',
   headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{}),
     ...(data?{'Content-Type':'application/json'}:{})},
   ...(data?{body:JSON.stringify(data)}:{})});
 if(!res.ok && ![401,403,404].includes(res.status))
   throw Error('KEYCLOAK_ADMIN_API_FAILED_'+method+'_'+res.status+'_at_'+new URL(url).pathname.slice(-50));
 return res;
}
async function json(r){
 if(!r.ok)throw Error('KEYCLOAK_RESPONSE_'+r.status);
 return r.json();
}
const master=new URLSearchParams({client_id:'admin-cli',grant_type:'password',
 username:'lab-admin',password:'only-temporary-ci-admin'});
const adminLogin=await fetch(origin+'/realms/master/protocol/openid-connect/token',{
 method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},
 body:master.toString()});
assert.equal(adminLogin.status,200);
const admin=(await adminLogin.json()).access_token;
assert.ok(admin?.length>100);
const prefix=origin+'/admin/realms/'+realm;
const adminCall=(path,method='GET',data)=>api(prefix+path,{token:admin,method,data});
const eligible=(await json(await adminCall('/users?username=fwb-lab-user&exact=true')))[0];
const foreign=(await json(await adminCall('/users?username=fwb-foreign-user&exact=true')))[0];
assert.ok(eligible?.id && foreign?.id && eligible.id!==foreign.id);

const conf=readScopedServiceConfig({
 FWB_REG04D_R1_SERVICE:'enabled',FWB_REG04C_FEDERATION:'enabled',
 FWB_REG04_PROVIDER:'keycloak',FWB_REG04_ISSUER:issuer,
 FWB_REG04D_R1_CLIENT_ID:'fwb-onboarding',FWB_REG04D_R1_CLIENT_SECRET:secret,
 FWB_REG04D_R1_ALLOWED_SUBJECTS:eligible.id
});
const svcToken=await requestScopedServiceToken(conf);
const before=await api(prefix+'/users/'+eligible.id,{token:svcToken});
assert.ok([401,403].includes(before.status),'scoped service unexpectedly able to read users before FGAP');
console.log('REG04D_R1_SERVICE_NO_GLOBAL_ADMIN_PASS');

const serviceClient=(await json(await adminCall('/clients?clientId=fwb-onboarding')))[0];
assert.ok(serviceClient?.id);
const serviceAccount=await json(await adminCall('/clients/'+serviceClient.id+'/service-account-user'));
assert.ok(serviceAccount?.id);
let result=await adminCall('','PUT',{adminPermissionsEnabled:true});
assert.equal(result.status,204,'enable FGAP v2 admin permissions');
const adminPermissions=(await json(await adminCall('/clients?clientId=admin-permissions')))[0];
assert.ok(adminPermissions?.id);
const authz='/clients/'+adminPermissions.id+'/authz/resource-server';
result=await adminCall(authz+'/policy/user','POST',{
 name:'fwb-r1-scoped-service-user',logic:'POSITIVE',users:[serviceAccount.id]
});
assert.equal(result.status,201,'create user-specific FGAP admin policy');
result=await adminCall(authz+'/permission/scope','POST',{
 name:'fwb-r1-only-authorized-user',resourceType:'Users',
 scopes:['view','manage'],resources:[eligible.id],
 policies:['fwb-r1-scoped-service-user']
});
assert.equal(result.status,201,'create strictly resource-scoped FGAP admin permission');
console.log('REG04D_R1_KEYCLOAK_FGAP_V2_RESOURCE_PERMISSION_CREATED');
// This is Keycloak's limited discovery role, not view-users or manage-users.
// FGAP controls which user can actually be viewed and updated.
const mgmt=(await json(await adminCall('/clients?clientId=realm-management')))[0];
assert.ok(mgmt?.id);
const queryRole=await json(await adminCall('/clients/'+mgmt.id+'/roles/query-users'));
assert.equal(queryRole.name,'query-users');
const roleGrant=await adminCall('/users/'+serviceAccount.id+'/role-mappings/clients/'+mgmt.id,
  'POST',[queryRole]);
assert.equal(roleGrant.status,204);

const token=await requestScopedServiceToken(conf);
const visible=await api(prefix+'/users/'+eligible.id,{token});
if(visible.status!==200){
  // Only generic response header and boolean claim properties; never emit bearer.
  const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
  const challenge=(visible.headers.get('www-authenticate')||'none').slice(0,200);
  console.log('REG04D_R1_FGAP_DIAG',JSON.stringify({
    status:visible.status,challenge,aud:claims.aud||null,
    hasRealmManagement:!!claims.resource_access?.['realm-management'],
    hasScope:typeof claims.scope==='string',
    azp:claims.azp
  }));
}
assert.equal(visible.status,200,'scoped user read should be allowed');
const prohibited=await api(prefix+'/users/'+foreign.id,{token});
assert.ok([403,404].includes(prohibited.status),'foreign user read unexpectedly allowed');
const clients=await api(prefix+'/clients',{token});
assert.ok([401,403].includes(clients.status),'scoped service can enumerate clients');
const realmWrite=await api(prefix,{token,method:'PUT',data:{displayName:'UNSAFE-NEVER-APPLY'}});
assert.ok([401,403].includes(realmWrite.status),'scoped service can modify realm settings');

const scoped=makeScopedBindingAdmin({config:conf});
const binding='fwb-r1-connection-20261121';
const attached=await scoped.attach(eligible.id,'site_lab',binding);
assert.equal(attached.status,'federated');
const updated=await json(await adminCall('/users/'+eligible.id));
assert.equal(updated.attributes.fwb_site_id?.[0],'site_lab');
assert.equal(updated.attributes.fwb_connection_id?.[0],binding);
assert.equal((await scoped.detach(eligible.id,'site_lab',binding)).status,'federation_revoked');
assert.equal((await json(await adminCall('/users/'+eligible.id))).attributes.fwb_site_id,undefined);
await assert.rejects(()=>scoped.attach(foreign.id,'site_lab',binding),/scoped_subject_not_approved/);
console.log('REG04D_R1_FGAP_SCOPED_ATTACH_DETACH_PASS');
console.log('REG04D_R1_FGAP_FOREIGN_USER_AND_CLIENTS_DENIED_PASS');
