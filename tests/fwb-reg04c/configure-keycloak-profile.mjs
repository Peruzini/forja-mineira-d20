// Disposable CI ONLY: apply Keycloak-managed admin-only attribute policy before
// federating any WordPress credential. Never turn on unmanaged user attributes.
const issuer='https://auth-lab.example.org/realms/fwb-reg04b-lab';
const basic=new URLSearchParams({
  client_id:'admin-cli',grant_type:'password',
  username:'lab-admin',password:'only-temporary-ci-admin'
});
const login=await fetch('https://auth-lab.example.org/realms/master/protocol/openid-connect/token',{
  method:'POST',redirect:'error',
  headers:{'Content-Type':'application/x-www-form-urlencoded'},body:basic.toString()
});
if(login.status!==200)throw Error('LAB_ADMIN_LOGIN_FAILED');
const bearer=(await login.json()).access_token;
if(typeof bearer!=='string'||bearer.length<100)throw Error('LAB_ADMIN_TOKEN_MISSING');
const endpoint=new URL(issuer).origin+'/admin/realms/fwb-reg04b-lab/users/profile';
const headers={Authorization:'Bearer '+bearer,Accept:'application/json'};
const fetchProfile=async()=>{
  const r=await fetch(endpoint,{method:'GET',redirect:'error',headers});
  if(!r.ok)throw Error('KEYCLOAK_PROFILE_GET_'+r.status);
  return r.json();
};
const profile=await fetchProfile();
if(!Array.isArray(profile.attributes)||profile.attributes.length<2)throw Error('NO_DEFAULT_KEYCLOAK_PROFILE');
const attrs=[
  {name:'fwb_site_id',displayName:'FWB site binding (admin only)',permissions:{
    view:['admin'],edit:['admin']},
    validations:{length:{min:3,max:63}}},
  {name:'fwb_connection_id',displayName:'FWB signed connection (admin only)',permissions:{
    view:['admin'],edit:['admin']},
    validations:{length:{min:22,max:64}}}
];
for(const attr of attrs){
  if(profile.attributes.some(x=>x.name===attr.name))throw Error('BINDING_ATTRIBUTE_ALREADY_DEFINED');
  profile.attributes.push(attr);
}
profile.unmanagedAttributePolicy='DISABLED';
const updated=await fetch(endpoint,{method:'PUT',redirect:'error',
  headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(profile)});
if(!updated.ok){const info=await updated.json().catch(()=>({})); throw Error('KEYCLOAK_PROFILE_PUT_'+updated.status+'_'+String(info.errorMessage||info.error||'invalid_config').slice(0,150));}
const current=await fetchProfile();
for(const attr of attrs){
  const got=current.attributes.find(x=>x.name===attr.name);
  if(!got||JSON.stringify(got.permissions?.edit)!=='["admin"]'||
    JSON.stringify(got.permissions?.view)!=='["admin"]') {
    throw Error('KEYCLOAK_PROFILE_NOT_ADMIN_ONLY');
  }
}
if(current.unmanagedAttributePolicy!=='DISABLED')throw Error('KEYCLOAK_UNMANAGED_ATTRIBUTES_ENABLED');
console.log('REG04C_KEYCLOAK_ADMIN_ONLY_USER_PROFILE_PASS');
