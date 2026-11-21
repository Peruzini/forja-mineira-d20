import dns from 'node:dns';
import ipaddr from 'ipaddr.js';
import { Agent } from 'undici';
import { OnboardingDenied } from '../reg04/onboarding.mjs';

const DISALLOWED_V4=[
 '0.0.0.0/8','10.0.0.0/8','100.64.0.0/10','127.0.0.0/8',
 '169.254.0.0/16','172.16.0.0/12','192.0.0.0/24','192.0.2.0/24',
 '192.168.0.0/16','198.18.0.0/15','198.51.100.0/24',
 '203.0.113.0/24','224.0.0.0/4','240.0.0.0/4'
].map(s=>ipaddr.parseCIDR(s));
const DISALLOWED_V6=['2001:db8::/32','2001::/32','2002::/16','64:ff9b::/96']
  .map(s=>ipaddr.parseCIDR(s));

export function isGlobalRoutableIP(input) {
  try{
    const addr=ipaddr.parse(input);
    if(addr.kind()==='ipv6'){
      if(addr.isIPv4MappedAddress())return false;
      if(!addr.match(ipaddr.parseCIDR('2000::/3')))return false;
      if(addr.range()!=='unicast')return false;
      return !DISALLOWED_V6.some(net=>addr.match(net));
    }
    if(addr.range()!=='unicast')return false;
    return !DISALLOWED_V4.some(net=>addr.match(net));
  }catch{return false;}
}
export function requirePublicAnswers(answers){
  if(!Array.isArray(answers)||answers.length<1||answers.length>40||
    answers.some(a=>!a||typeof a.address!=='string'||
      ![4,6].includes(a.family)||!isGlobalRoutableIP(a.address))){
    throw new OnboardingDenied('egress_nonpublic_dns_rejected');
  }
  return answers[0];
}
function normalizedHost(host){
  if(typeof host!=='string'||!/^[a-z0-9.-]{4,253}$/.test(host)||
    host.includes('..')||!host.includes('.'))throw new OnboardingDenied('egress_host_invalid');
  return host;
}
// The resource issuer is used ONLY for JWKS. WordPress hosts are permitted
// ONLY for the two narrow REST APIs used by this readonly gateway.
export function makeStrictEgressPolicy({wpHosts,issuer}){
  const auth=new URL(issuer);
  if(auth.protocol!=='https:'||auth.port||auth.username||auth.password)
    throw new OnboardingDenied('egress_issuer_invalid');
  const allowed=new Set(wpHosts.map(normalizedHost));
  allowed.delete(auth.hostname);
  const validUrl=raw=>{
    let u;
    try{u=new URL(raw);}catch{throw new OnboardingDenied('egress_url_invalid');}
    if(u.protocol!=='https:'||u.port||u.username||u.password||u.hash)
      throw new OnboardingDenied('egress_url_invalid');
    if(u.hostname===auth.hostname){
      if(u.search||u.pathname!==auth.pathname+'/protocol/openid-connect/certs')
        throw new OnboardingDenied('egress_keycloak_path_denied');
      return u.hostname;
    }
    if(!allowed.has(u.hostname))throw new OnboardingDenied('egress_host_denied');
    if(!/^\/wp-json\/wp\/v2\/(users\/me|posts(?:\/[1-9]\d*)?)$/.test(u.pathname))
      throw new OnboardingDenied('egress_wordpress_path_denied');
    if(u.pathname.endsWith('/users/me') && u.search!=='?context=edit')
      throw new OnboardingDenied('egress_wordpress_query_denied');
    if(u.pathname.includes('/posts') && u.searchParams.has('per_page')&&
      Number(u.searchParams.get('per_page'))>20)
      throw new OnboardingDenied('egress_wordpress_query_denied');
    return u.hostname;
  };
  return {assertUrl:validUrl,wpHosts:Object.freeze([...allowed]),issuerHost:auth.hostname};
}
export function makePinnedEgressFetcher({policy,fetcher=globalThis.fetch,
  resolver=(hostname)=>dns.promises.lookup(hostname,{all:true,verbatim:true})}){
  if(typeof policy?.assertUrl!=='function'||typeof resolver!=='function')
    throw new OnboardingDenied('egress_config_missing');
  const agent=new Agent({connections:2,connect:{
    lookup(hostname,opts,callback){
      Promise.resolve().then(()=>resolver(hostname))
        .then(requirePublicAnswers).then(addr=>callback(null,addr.address,addr.family))
        .catch(()=>callback(new Error('egress_nonpublic_dns_rejected')));
    }
  }});
  const secured=async(url,options={})=>{
    policy.assertUrl(typeof url==='string'?url:String(url));
    if(options.redirect && options.redirect!=='error')
      throw new OnboardingDenied('egress_redirect_denied');
    return fetcher(url,{...options,redirect:'error',dispatcher:agent});
  };
  return {fetcher:secured,close:()=>agent.close()};
}
