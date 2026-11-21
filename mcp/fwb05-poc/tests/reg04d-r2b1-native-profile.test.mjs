import test from 'node:test';
import assert from 'node:assert/strict';
import {makeNativeFwbProfile,verifyNativeFwbProfile}
 from '../reg04d-r2b1/native-profile.mjs';
const original={
 unmanagedAttributePolicy:'ADMIN_EDIT',
 attributes:[
  {name:'username',permissions:{view:['admin','user'],edit:['user']}},
  {name:'email',validations:{email:{}}},
  {name:'firstName'}, {name:'lastName'}
 ],groups:[{name:'default'}]
};
test('migration preserves the entire core schema and drops explicit policy for Keycloak 26.8.2',()=>{
 const safe=makeNativeFwbProfile(original);
 assert.equal(Object.hasOwn(safe,'unmanagedAttributePolicy'),false);
 assert.deepEqual(safe.attributes.slice(0,4),original.attributes);
 assert.deepEqual(safe.groups,original.groups);
 assert.equal(original.unmanagedAttributePolicy,'ADMIN_EDIT');
 assert.deepEqual(verifyNativeFwbProfile(safe),{
  status:'SCHEMA_VALID_REQUIRES_NEGATIVE_WRITE_PROOF',
  policy:'default_implicit',
  managedFields:['fwb_site_id','fwb_connection_id']
 });
});
test('no end-user permission, duplicate FWB key, partial schema or explicit ADMIN_EDIT accepted',()=>{
 const safe=makeNativeFwbProfile(original);
 assert.throws(()=>verifyNativeFwbProfile({...safe,unmanagedAttributePolicy:'ADMIN_EDIT'}));
 const altered=structuredClone(safe);
 altered.attributes[4].permissions.edit.push('user');
 assert.throws(()=>verifyNativeFwbProfile(altered));
 assert.throws(()=>makeNativeFwbProfile(safe),/native_profile_existing_field_review/);
 assert.throws(()=>makeNativeFwbProfile({attributes:[{name:'username'}]}));
 const miss=structuredClone(safe);
 miss.attributes.pop();
 assert.throws(()=>verifyNativeFwbProfile(miss));
});
