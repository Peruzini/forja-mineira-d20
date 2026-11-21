import assert from 'node:assert/strict';

const host='https://auth-lab.example.org';
const prefix=host+'/admin/realms/fwb-reg04b-lab/users/profile';
const login=await fetch(host+'/realms/master/protocol/openid-connect/token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({
    client_id:'admin-cli',grant_type:'password',
    username:'lab-admin',password:'only-temporary-ci-admin'
  }).toString()
});
assert.equal(login.status,200);
const admin=(await login.json()).access_token;
const headers={Authorization:'Bearer '+admin,
  Accept:'application/json','Content-Type':'application/json'};
const read=async()=>{
  const r=await fetch(prefix,{headers,redirect:'error'});
  assert.equal(r.status,200);
  return r.json();
};
const write=async(label,config)=>{
  const r=await fetch(prefix,{method:'PUT',redirect:'error',headers,
    body:JSON.stringify(config)});
  const fresh=await read();
  console.log('R2B1_PROBE',label,r.status,fresh.unmanagedAttributePolicy,
    fresh.attributes?.length);
  return r.status;
};
const original=await read();
console.log('R2B1_BEFORE',original.unmanagedAttributePolicy,
  original.attributes?.map(a=>a.name));
await write('roundtrip',original);
await write('disabled_complete',{...await read(),unmanagedAttributePolicy:'DISABLED'});
await write('policy_only',{unmanagedAttributePolicy:'DISABLED'});
for(const extra of [
 [{name:'fwb_site_id'},{name:'fwb_connection_id'}],
 [{name:'fwb_site_id',permissions:{view:['admin'],edit:['admin']}},
  {name:'fwb_connection_id',permissions:{view:['admin'],edit:['admin']}}]
]){
 const state=await read();
 if(state.attributes.some(a=>a.name==='fwb_site_id'))continue;
 await write('new_fields',{...state,
   unmanagedAttributePolicy:'ADMIN_EDIT',
   attributes:[...state.attributes,...extra]});
}
console.log('R2B1_PROFILE_PROBES_COMPLETED');
