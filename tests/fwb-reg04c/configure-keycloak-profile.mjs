// Disposable CI ONLY: allow custom attributes only through Keycloak Admin API.
// This is not a release approval: production must define managed attributes explicitly.
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
// ADMIN_EDIT permits only administrative APIs to read/change unmanaged attributes;
// END USERS MAY NOT EDIT THEM. Deliberately not ENABLED.
profile.unmanagedAttributePolicy='ADMIN_EDIT';
const updated=await fetch(endpoint,{method:'PUT',redirect:'error',
  headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(profile)});
if(!updated.ok){const info=await updated.json().catch(()=>({})); throw Error('KEYCLOAK_PROFILE_PUT_'+updated.status+'_'+String(info.errorMessage||info.error||'invalid_config').slice(0,150));}
const current=await fetchProfile();
if(current.unmanagedAttributePolicy!=='ADMIN_EDIT')throw Error('KEYCLOAK_ADMIN_EDIT_POLICY_NOT_CONFIRMED');
console.log('REG04C_KEYCLOAK_ADMIN_EDIT_LAB_POLICY_PASS');
