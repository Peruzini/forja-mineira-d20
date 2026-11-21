import { OnboardingDenied } from '../reg04/onboarding.mjs';

// Authoritative client metadata is hosted by the client itself, NOT by this app.
// Never mirror its JWKS, change redirect_uri, invent a client ID or register
// "chatgpt.com" from unverified, caller-supplied data.
export const CHATGPT_CIMD='https://chatgpt.com/oauth/client.json';
export const CHATGPT_CALLBACK='https://chatgpt.com/connector_platform_oauth_redirect';
export const CHATGPT_ALLOWED_METADATA_HOSTS=Object.freeze(['chatgpt.com','persistent.oaistatic.com']);

function strictHttps(value) {
  let u;
  try {u=new URL(value);}catch{throw new OnboardingDenied('cimd_url_invalid');}
  if(typeof value!=='string'||value!==u.href||u.protocol!=='https:'||
    u.username||u.password||u.hash||u.search||u.port) throw new OnboardingDenied('cimd_url_invalid');
  return u;
}
export function validateChatGptCimd(data) {
  if(!data||typeof data!=='object'||Array.isArray(data)||
    data.client_id!==CHATGPT_CIMD||
    !Array.isArray(data.redirect_uris)||!data.redirect_uris.includes(CHATGPT_CALLBACK)||
    data.redirect_uris.some(x=>typeof x!=='string'||strictHttps(x).hostname!=='chatgpt.com')||
    data.token_endpoint_auth_method!=='private_key_jwt'||
    data.token_endpoint_auth_signing_alg!=='RS256'||
    data.jwks_uri!=='https://chatgpt.com/oauth/jwks.json'||
    !Array.isArray(data.response_types)||!data.response_types.includes('code')||
    !Array.isArray(data.grant_types)||!data.grant_types.includes('authorization_code')) {
    throw new OnboardingDenied('chatgpt_cimd_profile_incompatible');
  }
  for(const f of ['client_uri','logo_uri','jwks_uri']){
    if(data[f]!==undefined && !CHATGPT_ALLOWED_METADATA_HOSTS.includes(strictHttps(data[f]).hostname)) {
      throw new OnboardingDenied('cimd_unapproved_metadata_host');
    }
  }
  return Object.freeze({
    clientId:data.client_id,callback:CHATGPT_CALLBACK,auth:'private_key_jwt',
    signingAlg:'RS256',jwks:data.jwks_uri
  });
}
export async function verifyChatGptCimdDocument(fetcher=globalThis.fetch) {
  let response,raw;
  try {
    response=await fetcher(CHATGPT_CIMD,{method:'GET',redirect:'error',
      headers:{Accept:'application/json'},signal:AbortSignal.timeout(7000)});
    if(!response?.ok)throw Error();
    raw=await response.text();
    if(raw.length>6000)throw Error();
  }catch{throw new OnboardingDenied('chatgpt_cimd_unavailable');}
  let metadata;
  try{metadata=JSON.parse(raw);}catch{throw new OnboardingDenied('chatgpt_cimd_invalid_json');}
  return validateChatGptCimd(metadata);
}

// Keycloak CIMD client-policy review: explicitly separate the *document*
// from server admission policy. No fallback to accepting all https URL clients.
export function assertKeycloakCimdPolicy(profile,policy,resource){
  if(!profile||!policy||profile.name!=='fwb-chatgpt-cimd'||
    policy.name!=='fwb-chatgpt-cimd-only'||
    !Array.isArray(profile.executors)||!Array.isArray(policy.conditions)||
    !Array.isArray(policy.profiles)||!policy.profiles.includes(profile.name)) {
    throw new OnboardingDenied('cimd_client_policy_missing');
  }
  const executor=profile.executors.find(e=>e.executor==='client-id-metadata-document');
  const uri=policy.conditions.find(c=>c.condition==='client-id-uri');
  if(!executor||!uri)throw new OnboardingDenied('cimd_client_policy_missing');
  const exec=executor.configuration||{},cond=uri.configuration||{};
  const strictDomains=Array.isArray(exec['trusted-domains'])&&
    exec['trusted-domains'].length===CHATGPT_ALLOWED_METADATA_HOSTS.length&&
    CHATGPT_ALLOWED_METADATA_HOSTS.every(x=>exec['trusted-domains'].includes(x));
  if(!strictDomains||JSON.stringify(cond['trusted-domains'])!==JSON.stringify(['chatgpt.com'])||
    JSON.stringify(cond['uri-scheme'])!==JSON.stringify(['https'])||
    exec['allow-http-scheme']!==false||
    exec['restrict-same-domain']!==false||
    exec['only-allow-confidential-client']!==false||
    exec['accept-public-client-with-confidential-only-grant-types']!==true||
    !Array.isArray(exec['resource-indicator-allow-list'])||
    exec['resource-indicator-allow-list'].length!==1||
    exec['resource-indicator-allow-list'][0]!==resource) {
    throw new OnboardingDenied('cimd_client_policy_not_restricted');
  }
  return true;
}
