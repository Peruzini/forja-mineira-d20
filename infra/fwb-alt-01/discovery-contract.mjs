// FWB-ALT-01: offline *shape-only* check of discovery JSON.
// Never fetches a URL, executes OAuth, creates clients or accepts a token.
// Passing is NOT proof of an Auth0 tenant or ChatGPT interoperability.
const METHODS = Object.freeze(['none', 'private_key_jwt', 'client_secret_post', 'client_secret_basic']);
export class ContractRejected extends Error {
  constructor(code) { super(code); this.code = code; }
}
const fail = code => { throw new ContractRejected(code); };
function httpsUrl(s, label) {
  let u;
  try { u = new URL(s); } catch { fail(label+'_invalid'); }
  if (typeof s !== 'string' || u.href !== s || u.protocol !== 'https:' ||
      !u.hostname.includes('.') || u.username || u.password || u.hash || u.search ||
      u.port || u.hostname === 'localhost' || u.hostname.endsWith('.local')) {
    fail(label+'_invalid');
  }
  return u;
}
function sameIssuerEndpoint(url, issuer, label) {
  const u = httpsUrl(url, label);
  if (u.origin !== new URL(issuer).origin) fail(label+'_origin_mismatch');
  return u;
}
function exactArrayOfStrings(xs) {
  return Array.isArray(xs) && xs.length > 0 && xs.every(x => typeof x === 'string' && x.length > 0);
}
export function checkOAuthDiscovery({resource, issuer, protectedResource, authorizationServer, mode='cimd', stableCallback=false}) {
  if (!['cimd','dcr'].includes(mode)) fail('mode_invalid');
  const resourceURL = httpsUrl(resource, 'resource');
  const issuerURL = httpsUrl(issuer, 'issuer');
  if (resourceURL.pathname !== '/api/gateway-mcp') fail('resource_path_invalid');
  if (!protectedResource || typeof protectedResource !== 'object' || Array.isArray(protectedResource) ||
      protectedResource.resource !== resource ||
      !exactArrayOfStrings(protectedResource.authorization_servers) ||
      !protectedResource.authorization_servers.includes(issuer)) fail('protected_resource_mismatch');
  if (!authorizationServer || typeof authorizationServer !== 'object' ||
      Array.isArray(authorizationServer) || authorizationServer.issuer !== issuer) {
    fail('issuer_mismatch');
  }
  sameIssuerEndpoint(authorizationServer.authorization_endpoint, issuer, 'authorization_endpoint');
  sameIssuerEndpoint(authorizationServer.token_endpoint, issuer, 'token_endpoint');
  if (!exactArrayOfStrings(authorizationServer.code_challenge_methods_supported) ||
      !authorizationServer.code_challenge_methods_supported.includes('S256')) fail('pkce_s256_missing');
  if (authorizationServer.response_types_supported !== undefined &&
      !authorizationServer.response_types_supported.includes('code')) fail('code_response_unsupported');
  if (authorizationServer.grant_types_supported !== undefined &&
      !authorizationServer.grant_types_supported.includes('authorization_code')) {
    fail('authorization_code_unsupported');
  }
  if (!exactArrayOfStrings(authorizationServer.token_endpoint_auth_methods_supported) ||
      !authorizationServer.token_endpoint_auth_methods_supported.some(m => METHODS.includes(m))) {
    fail('token_auth_methods_unsupported');
  }
  if (stableCallback && authorizationServer.authorization_response_iss_parameter_supported !== true) {
    fail('stable_callback_issuer_identification_missing');
  }
  if (mode === 'cimd') {
    if (authorizationServer.client_id_metadata_document_supported !== true) {
      fail('cimd_not_advertised');
    }
    if (!authorizationServer.token_endpoint_auth_methods_supported.some(
      m => m === 'none' || m === 'private_key_jwt')) fail('cimd_token_method_unsupported');
  }
  if (mode === 'dcr') {
    sameIssuerEndpoint(authorizationServer.registration_endpoint, issuer, 'registration_endpoint');
  }
  return Object.freeze({
    status:'METADATA_SHAPE_PASS_LIVE_AUTH_REQUIRED',
    mode,
    resource: resourceURL.href,
    issuer: issuerURL.href,
    liveClientRegistration:false,
    liveAuthCodePkce:false,
    jwtClaimsValidated:false,
    wordpressIsolationTested:false
  });
}
