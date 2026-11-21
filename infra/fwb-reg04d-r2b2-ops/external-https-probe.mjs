#!/usr/bin/env node
// Run ONLY from a machine outside the staging private network.
// No credentials are sent, no config is changed, no insecure TLS bypass.
import {lookup} from 'node:dns/promises';
import assert from 'node:assert/strict';

const originText=process.env.FWB_OPS_AUTH_HTTPS_ORIGIN;
const realm=process.env.FWB_OPS_REALM;
assert.ok(typeof realm==='string' && /^[a-z][a-z0-9_-]{2,63}$/.test(realm));
assert.ok(typeof originText==='string');
const origin=new URL(originText);
assert.equal(origin.protocol,'https:');
assert.equal(origin.username,'');
assert.equal(origin.password,'');
assert.equal(origin.port,'');
assert.equal(origin.pathname,'/');
assert.equal(origin.search,'');
assert.equal(origin.hash,'');
assert.equal(originText,origin.origin+'/');
assert.ok(origin.hostname.includes('.') &&
  !/\.invalid$|\.example$|\.test$|\.localhost$/.test(origin.hostname) &&
  !['forjamineirad20.com.br','www.forjamineirad20.com.br'].includes(origin.hostname));
const ips=await lookup(origin.hostname,{all:true});
assert.ok(ips.length>0,'no hostname resolution');
for(const entry of ips){
 const ip=entry.address.toLowerCase();
 if(entry.family===4){
  const octets=ip.split('.').map(Number);
  assert.ok(!(
   octets[0]===0 || octets[0]===10 || octets[0]===127 ||
   (octets[0]===169&&octets[1]===254) ||
   (octets[0]===172&&octets[1]>=16&&octets[1]<=31) ||
   (octets[0]===192&&octets[1]===168) ||
   octets[0]>=224
  ),'non-public DNS address');
 }else{
  assert.ok(!(
   ip==='::1'||ip==='::'||ip.startsWith('fc')||ip.startsWith('fd')||
   /^fe[89ab]/.test(ip)||ip.startsWith('::ffff:127.')||
   ip.startsWith('::ffff:10.')
  ),'non-public IPv6 DNS address');
 }
}

async function checked(path){
 const response=await fetch(new URL(path,origin),{
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(10000),
  headers:{'Accept':'application/json'}
 });
 return response;
}
const discovery=await checked('/realms/'+realm+'/.well-known/openid-configuration');
assert.equal(discovery.status,200,'staging discovery must return HTTP 200');
assert.equal(discovery.headers.get('content-type')?.includes('application/json'),true);
const body=await discovery.json();
assert.equal(body.issuer,origin.origin+'/realms/'+realm,'issuer exact match');
console.log('REG04D_R2B2_OPS_EXTERNAL_HTTPS_TLS_ISSUER_PASS');

for(const path of [
 '/','/admin/','/admin/realms/master',
 '/realms/master/.well-known/openid-configuration',
 '/realms/another-realm/.well-known/openid-configuration',
 '/metrics','/health/ready','/q/health/ready'
]){
 const response=await checked(path);
 assert.equal(response.status,404,'unexpected externally reachable Keycloak path: '+path);
}
console.log('REG04D_R2B2_OPS_EXTERNAL_ADMIN_MASTER_DENY_PASS');
console.log('REG04D_R2B2_OPS_EXTERNAL_INGRESS_PASS');
