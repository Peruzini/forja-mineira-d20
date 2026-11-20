import { createPublicKey, verify as verifySignature } from 'node:crypto';

export class AccessDenied extends Error {
  constructor(code = 'unauthorized') {
    super(code);
    this.name = 'AccessDenied';
    this.code = code;
  }
}
function httpsUrl(value, label) {
  if (typeof value !== 'string' || !value || value.trim() !== value) throw Error(label + '_missing');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw Error(label + '_invalid');
  }
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error(label + '_invalid');
  return url;
}
export function readConfig(env = process.env) {
  if (env.FWB_REG02_STAGING !== 'enabled') throw Error('REG02_NOT_ENABLED');
  const issuer = httpsUrl(env.FWB_OAUTH_ISSUER, 'issuer').href.replace(/\/$/, '');
  const resource = httpsUrl(env.FWB_MCP_RESOURCE, 'resource').href;
  const jwks = httpsUrl(env.FWB_OAUTH_JWKS_URL, 'jwks').href;
  if (new URL(jwks).origin !== new URL(issuer).origin) throw Error('jwks_origin_mismatch');
  if (new URL(resource).pathname !== '/api/secure-mcp') throw Error('resource_path_invalid');
  const wp = httpsUrl(env.FWB_WP_STAGING_URL, 'wp_staging');
  const host = env.FWB_WP_STAGING_HOST;
  if (!host || wp.hostname !== host || wp.pathname !== '/' || wp.port) throw Error('wp_host_not_pinned');
  if (wp.hostname === 'forjamineirad20.com.br' || wp.hostname === 'www.forjamineirad20.com.br') {
    throw Error('wp_production_prohibited');
  }
  if (!env.FWB_OAUTH_ALLOWED_SUB || env.FWB_OAUTH_ALLOWED_SUB.length > 200) throw Error('sub_missing');
  if (!env.FWB_WP_SERVICE_USER || !env.FWB_WP_SERVICE_APP_PASSWORD) throw Error('wp_service_missing');
  return {
    issuer, resource, jwks, wpBase:wp.origin, wpUser:env.FWB_WP_SERVICE_USER,
    wpPassword:env.FWB_WP_SERVICE_APP_PASSWORD, sub:env.FWB_OAUTH_ALLOWED_SUB,
    enableWrites: env.FWB_REG02_DRAFT_WRITES === 'enabled',
    metadataUrl:new URL('/.well-known/oauth-protected-resource',resource).href
  };
}
function decodeBase64Url(value, limit = 8192) {
  if (typeof value !== 'string' || value.length > limit || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new AccessDenied('invalid_token');
  }
  return Buffer.from(value, 'base64url');
}
function parseJsonPart(value) {
  try { return JSON.parse(decodeBase64Url(value).toString('utf8')); }
  catch { throw new AccessDenied('invalid_token'); }
}
function usableKey(jwk, kid) {
  return jwk && jwk.kty === 'RSA' && jwk.kid === kid && jwk.use !== 'enc'
    && (!jwk.key_ops || jwk.key_ops.includes('verify'))
    && (!jwk.alg || jwk.alg === 'RS256') && typeof jwk.n === 'string'
    && typeof jwk.e === 'string';
}
export async function getJwks(config, fetcher = globalThis.fetch) {
  let response;
  try {
    response = await fetcher(config.jwks, {
      method:'GET',redirect:'error',headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000)
    });
    if (!response.ok) throw Error('JWK_HTTP');
    const body = await response.text();
    if (body.length > 65536) throw Error('JWK_TOO_LARGE');
    const payload = JSON.parse(body);
    if (!Array.isArray(payload.keys) || payload.keys.length > 12) throw Error('JWK_FORMAT');
    return payload.keys;
  } catch {
    throw new AccessDenied('identity_provider_unavailable');
  }
}
export async function verifyAccessToken(authorization, config, { fetcher = globalThis.fetch, keys, now = Date.now() } = {}) {
  if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)
      || authorization.length > 12000) throw new AccessDenied('missing_or_invalid_bearer');
  const token = authorization.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) throw new AccessDenied('invalid_token');
  const header = parseJsonPart(parts[0]);
  const claims = parseJsonPart(parts[1]);
  if (header.alg !== 'RS256' || header.typ !== 'at+jwt' ||
      typeof header.kid !== 'string' || header.kid.length > 200 ||
      !claims || typeof claims !== 'object') throw new AccessDenied('invalid_token');
  const availableKeys = keys || await getJwks(config, fetcher);
  const matches = availableKeys.filter(key => usableKey(key, header.kid));
  if (matches.length !== 1) throw new AccessDenied('invalid_token');
  let verified = false;
  try {
    const key = createPublicKey({key:matches[0],format:'jwk'});
    if (key.asymmetricKeyDetails?.modulusLength >= 2048) {
      verified = verifySignature('RSA-SHA256', Buffer.from(parts[0]+'.'+parts[1]),
        key, decodeBase64Url(parts[2]));
    }
  } catch { throw new AccessDenied('invalid_token'); }
  if (!verified) throw new AccessDenied('invalid_token');
  const time = Math.floor(now/1000);
  if (claims.iss !== config.issuer || claims.aud !== config.resource ||
      typeof claims.sub !== 'string' || claims.sub !== config.sub ||
      !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) ||
      claims.iat > time+30 || claims.exp <= time ||
      claims.exp - claims.iat > 600 ||
      (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > time+30))) {
    throw new AccessDenied('token_claims_rejected');
  }
  const scopes = typeof claims.scope === 'string' ? claims.scope.split(' ').filter(Boolean) : [];
  if (!scopes.includes('posts:read')) throw new AccessDenied('insufficient_scope');
  return { sub:claims.sub, scopes:new Set(scopes) };
}
export function requireScope(identity, scope) {
  if (!identity?.scopes?.has(scope)) throw new AccessDenied('insufficient_scope');
}
export function unauthorized(config, error = 'invalid_token') {
  const url = config?.metadataUrl || '';
  const challenge = 'Bearer resource_metadata="' + url + '", scope="posts:read"';
  return new Response(JSON.stringify({error}), {
    status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store',
      'WWW-Authenticate':challenge}
  });
}
export function metadata(config) {
  return {
    resource:config.resource,
    authorization_servers:[config.issuer],
    scopes_supported:['posts:read','drafts:write'],
  };
}
