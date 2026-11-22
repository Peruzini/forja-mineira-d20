import { createPublicKey, verify } from 'node:crypto';
import { isIP } from 'node:net';
import { AccessDenied, getJwks } from '../reg02/auth.mjs';
import { readGatewayConfig } from '../reg03/gateway.mjs';
import { draftConfig, WRITE_SCOPE } from './drafts.mjs';

const AUTH0_HOST = /^[a-z0-9](?:[a-z0-9-]{0,62})(?:\.[a-z0-9-]{1,24})?\.auth0\.com$/;
const USER_SUBJECT = /^[A-Za-z0-9_-]{1,50}\|[A-Za-z0-9_.:|+-]{1,149}$/;
const CLIENT_ID = /^[A-Za-z0-9._~:/-]{1,250}$/;
const KID = /^[A-Za-z0-9._~-]{1,200}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
export const READ_SCOPE = 'posts:read';
const invalid = () => new AccessDenied('invalid_token');

function configuredUrl(raw) {
  const url = new URL(raw);
  if (url.href !== raw || url.protocol !== 'https:' || url.username || url.password ||
      url.port || url.search || url.hash || !url.hostname.includes('.') ||
      isIP(url.hostname) || /(?:^|\.)(?:forjamineirad20\.com\.br|local|internal|localhost)$/.test(url.hostname)) {
    throw Error('auth0_alternative_url_invalid');
  }
  return url;
}

function configuredList(raw, validator) {
  if (typeof raw !== 'string' || raw.length > 4096) throw Error('auth0_alternative_list_invalid');
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length < 1 || list.length > 8 ||
      !list.every(value => typeof value === 'string' && validator.test(value)) ||
      new Set(list).size !== list.length) {
    throw Error('auth0_alternative_list_invalid');
  }
  return Object.freeze(list);
}

export function readAltAuth0Config(env = process.env) {
  if (env.FWB_ALT_AUTH0_STAGING !== 'enabled' ||
      env.FWB_REG03_STAGING === 'enabled' || env.FWB_REG04_STAGING === 'enabled') {
    throw Error('auth0_alternative_requires_exclusive_staging');
  }
  const issuer = configuredUrl(env.FWB_ALT_AUTH0_ISSUER);
  const resource = configuredUrl(env.FWB_ALT_AUTH0_RESOURCE);
  if (!AUTH0_HOST.test(issuer.hostname) || issuer.pathname !== '/' ||
      resource.pathname !== '/api/gateway-mcp' || issuer.origin === resource.origin) {
    throw Error('auth0_alternative_profile_invalid');
  }
  const registration = env.FWB_ALT_AUTH0_REGISTRATION;
  if (registration !== 'cimd' && registration !== 'dcr') throw Error('auth0_alternative_registration_invalid');
  const subjects = configuredList(env.FWB_ALT_AUTH0_SUBJECTS_JSON, USER_SUBJECT);
  const clientIds = configuredList(env.FWB_ALT_AUTH0_CLIENT_IDS_JSON, CLIENT_ID);
  const jwks = new URL('/.well-known/jwks.json', issuer).href;
  let tenants = Object.freeze([]);
  if (env.FWB_ALT_AUTH0_TENANTS_JSON !== undefined) {
    tenants = readGatewayConfig({
      FWB_REG03_STAGING: 'enabled',
      FWB_OAUTH_ISSUER: issuer.href,
      FWB_OAUTH_JWKS_URL: jwks,
      FWB_REG03_MCP_RESOURCE: resource.href,
      FWB_REG03_TENANTS_JSON: env.FWB_ALT_AUTH0_TENANTS_JSON
    }).tenants;
    // A signed subject has at most one binding in this staging profile.
    if (tenants.some(t => !subjects.includes(t.sub) ||
        configuredUrl(t.wpBase + '/').hostname === issuer.hostname) ||
        new Set(tenants.map(t => t.sub)).size !== tenants.length) {
      throw Error('auth0_alternative_tenant_binding_invalid');
    }
  }
  return Object.freeze({
    issuer: issuer.href,
    resource: resource.href,
    metadataUrl: new URL('/.well-known/oauth-protected-resource/api/gateway-mcp', resource).href,
    jwks, registration, subjects, clientIds, tenants,
    publicPosts: env.FWB_ALT_AUTH0_PUBLIC_POSTS === 'enabled',
    draftPreviewSubject: env.FWB_ALT02_DRAFT_PREVIEW === 'enabled' && subjects.length === 1 ? subjects[0] : null,
    drafts: draftConfig(env, subjects)
  });
}

function decode(part, maximum) {
  if (!BASE64URL.test(part) || part.length > maximum) throw invalid();
  const bytes = Buffer.from(part, 'base64url');
  if (bytes.toString('base64url') !== part) throw invalid();
  return bytes;
}

function objectPart(part, maximum) {
  try {
    const parsed = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(decode(part, maximum)));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw invalid();
    return parsed;
  } catch { throw invalid(); }
}

function validKey(key, kid) {
  return key?.kid === kid && key.kty === 'RSA' &&
    (key.use === undefined || key.use === 'sig') &&
    (key.alg === undefined || key.alg === 'RS256') &&
    (key.key_ops === undefined || (Array.isArray(key.key_ops) && key.key_ops.includes('verify'))) &&
    typeof key.n === 'string' && typeof key.e === 'string' && key.d === undefined;
}

function validAudience(aud, config) {
  if (typeof aud === 'string') return aud === config.resource;
  const userinfo = new URL('/userinfo', config.issuer).href;
  return Array.isArray(aud) && aud.length > 0 && aud.length <= 2 &&
    new Set(aud).size === aud.length && aud.includes(config.resource) &&
    aud.every(value => value === config.resource || value === userinfo);
}

export async function verifyAltAuth0Access(authorization, config, {
  fetcher = globalThis.fetch, keySource = () => getJwks(config, fetcher), now = Date.now()
} = {}) {
  if (typeof authorization !== 'string' || authorization.length > 12000 ||
      !/^Bearer [A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){2}$/i.test(authorization)) throw invalid();

  const [head, body, signature] = authorization.slice(7).split('.');
  const header = objectPart(head, 2048);
  const claims = objectPart(body, 8192);
  const seconds = Math.floor(now / 1000);
  if (header.alg !== 'RS256' || !['at+jwt', 'application/at+jwt'].includes(header.typ) ||
      typeof header.kid !== 'string' || !KID.test(header.kid) ||
      Object.keys(header).some(name => !['alg', 'typ', 'kid'].includes(name)) ||
      claims.iss !== config.issuer || !validAudience(claims.aud, config) ||
      !config.subjects.includes(claims.sub) || !config.clientIds.includes(claims.client_id) ||
      claims.gty === 'client-credentials' ||
      typeof claims.jti !== 'string' || claims.jti.length < 1 || claims.jti.length > 200 ||
      !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) ||
      claims.iat > seconds + 30 || claims.exp <= seconds ||
      claims.exp <= claims.iat || claims.exp - claims.iat > 600 ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) ||
        claims.nbf > seconds + 30 || claims.nbf >= claims.exp))) throw invalid();

  // Unverified claims only reject requests early. They cannot authorize a lookup or dispatch.
  const sig = decode(signature, 1536);
  const keys = await keySource();
  const matches = keys.filter(key => validKey(key, header.kid));
  if (matches.length !== 1) throw invalid();
  try {
    const key = createPublicKey({key: matches[0], format: 'jwk'});
    if (!(key.asymmetricKeyDetails?.modulusLength >= 2048) ||
        !verify('RSA-SHA256', Buffer.from(head + '.' + body), key, sig)) throw invalid();
  } catch { throw invalid(); }

  const scopes = new Set(typeof claims.scope === 'string' ? claims.scope.split(' ').filter(Boolean) : []);
  if (!scopes.has(READ_SCOPE)) throw new AccessDenied('insufficient_scope');
  return Object.freeze({sub: claims.sub, scopes});
}

export function altAuth0Metadata(config) {
  return {
    resource: config.resource,
    authorization_servers: [config.issuer],
    scopes_supported: config.drafts ? [READ_SCOPE, WRITE_SCOPE] : [READ_SCOPE],
    bearer_methods_supported: ['header']
  };
}
