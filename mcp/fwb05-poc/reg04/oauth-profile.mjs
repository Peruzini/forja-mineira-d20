import { OnboardingDenied } from './onboarding.mjs';

function httpsAbsolute(value, origin) {
  let u;
  try { u=new URL(value); } catch { throw new OnboardingDenied('oauth_metadata_invalid'); }
  if(typeof value!=='string' || u.href!==value || u.protocol!=='https:' ||
    u.origin!==origin || u.username || u.password || u.hash || u.search || u.port) {
    throw new OnboardingDenied('oauth_metadata_invalid');
  }
  return u.href;
}

// This is an interoperability contract for an EXISTING OAuth authorization
// server. It is not an authorization server or a replacement for actual login.
export async function verifyCentralOAuthMetadata(config,fetcher=globalThis.fetch) {
  const metadataUrl=config.issuer+'/.well-known/oauth-authorization-server';
  let response,data;
  try {
    response=await fetcher(metadataUrl,{method:'GET',redirect:'error',
      headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000)});
    if(!response?.ok) throw Error('unavailable');
    const raw=await response.text();
    if(raw.length>32768) throw Error('too large');
    data=JSON.parse(raw);
  } catch { throw new OnboardingDenied('oauth_metadata_unavailable'); }
  const origin=new URL(config.issuer).origin;
  if(data?.issuer!==config.issuer ||
    httpsAbsolute(data.authorization_endpoint,origin)!==config.issuer+'/oauth/authorize' ||
    httpsAbsolute(data.token_endpoint,origin)!==config.issuer+'/oauth/token' ||
    httpsAbsolute(data.jwks_uri,origin)!==config.jwks ||
    !Array.isArray(data.response_types_supported) ||
    !data.response_types_supported.includes('code') ||
    !Array.isArray(data.grant_types_supported) ||
    !data.grant_types_supported.includes('authorization_code') ||
    !Array.isArray(data.code_challenge_methods_supported) ||
    !data.code_challenge_methods_supported.includes('S256') ||
    data.client_id_metadata_document_supported!==true ||
    !Array.isArray(data.token_endpoint_auth_methods_supported) ||
    !data.token_endpoint_auth_methods_supported.includes('none')) {
    throw new OnboardingDenied('central_oauth_not_interoperable');
  }
  return Object.freeze({issuer:config.issuer,authorizationEndpoint:data.authorization_endpoint,
    tokenEndpoint:data.token_endpoint,jwks:config.jwks,cimd:true,pkce:'S256',
    supportedResource:config.resource});
}
