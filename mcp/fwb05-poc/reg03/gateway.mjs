import { AccessDenied, verifyAccessToken } from '../reg02/auth.mjs';
import { isIP } from 'node:net';
import { makeEditorialMcp } from '../reg02/secure-server.mjs';
import { createMcpHandler } from '@modelcontextprotocol/server';

const ID = /^[a-z][a-z0-9_-]{2,63}$/;
const PROD = new Set(['forjamineirad20.com.br', 'www.forjamineirad20.com.br']);

function secureUrl(value, label) {
  if (typeof value !== 'string' || !value || value.trim() !== value) throw Error(label + '_missing');
  let url;
  try { url = new URL(value); } catch { throw Error(label + '_invalid'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port
      || !url.hostname.includes('.') || isIP(url.hostname) !== 0 || url.hostname === 'localhost'
      || /\.(local|internal|localhost)$/.test(url.hostname) || url.hostname.includes(':')) {
    throw Error(label + '_invalid');
  }
  return url;
}

function failResponse(status, code, extra = {}) {
  return Response.json({error:code}, {status, headers:{
    'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...extra
  }});
}

// REG-03 is a separate staging-only gateway; REG-02 and REG-02C remain unchanged.
export function readGatewayConfig(env = process.env) {
  if (env.FWB_REG03_STAGING !== 'enabled') throw Error('REG03_NOT_ENABLED');
  const issuerUrl = secureUrl(env.FWB_OAUTH_ISSUER, 'issuer');
  const jwksUrl = secureUrl(env.FWB_OAUTH_JWKS_URL, 'jwks');
  const resourceUrl = secureUrl(env.FWB_REG03_MCP_RESOURCE, 'resource');
  if (jwksUrl.origin !== issuerUrl.origin) throw Error('jwks_origin_mismatch');
  if (resourceUrl.pathname !== '/api/gateway-mcp') throw Error('resource_path_invalid');
  const raw = env.FWB_REG03_TENANTS_JSON;
  if (typeof raw !== 'string' || raw.length < 3 || raw.length > 32768) throw Error('tenant_registry_invalid');
  let rows;
  try { rows = JSON.parse(raw); } catch { throw Error('tenant_registry_invalid'); }
  if (!Array.isArray(rows) || !rows.length || rows.length > 8) throw Error('tenant_registry_invalid');
  const seen = new Set();
  const tenants = rows.map((r) => {
    const expected = ['site_id','subject','wordpress_url','wordpress_host','wordpress_user','wordpress_app_password','wordpress_user_id'];
    if (!r || typeof r !== 'object' || Array.isArray(r)
        || Object.keys(r).sort().join(',') !== expected.sort().join(',')) throw Error('tenant_entry_invalid');
    if (!ID.test(r.site_id) || typeof r.subject !== 'string' || !r.subject.trim()
        || r.subject.length > 200 || /[\x00-\x1f]/.test(r.subject)
        || typeof r.wordpress_user !== 'string' || !r.wordpress_user
        || r.wordpress_user.length > 120 || typeof r.wordpress_app_password !== 'string'
        || r.wordpress_app_password.length < 12 || r.wordpress_app_password.length > 256
        || !Number.isSafeInteger(r.wordpress_user_id) || r.wordpress_user_id < 1) {
      throw Error('tenant_entry_invalid');
    }
    const wp = secureUrl(r.wordpress_url, 'wordpress_url');
    if (wp.pathname !== '/' || wp.hostname !== r.wordpress_host || PROD.has(wp.hostname)) {
      throw Error('wordpress_host_not_allowed');
    }
    const pair = JSON.stringify([r.subject, r.site_id]);
    if (seen.has(pair)) throw Error('duplicate_tenant_binding');
    seen.add(pair);
    return Object.freeze({sub:r.subject, siteId:r.site_id, wpBase:wp.origin,
      wpUser:r.wordpress_user, wpPassword:r.wordpress_app_password,
      wpUserId:r.wordpress_user_id, ownPostsOnly:true, enableWrites:false,
      registerWriteTools:false});
  });
  const issuer = issuerUrl.href.replace(/\/$/, '');
  return Object.freeze({
    issuer, jwks:jwksUrl.href, resource:resourceUrl.href,
    metadataUrl:new URL('/.well-known/oauth-protected-resource/api/gateway-mcp',resourceUrl).href,
    tenants:Object.freeze(tenants)
  });
}

function tenantHint(header, gateway) {
  if (typeof header !== 'string' || !/^Bearer [A-Za-z0-9._~-]+$/.test(header) || header.length > 12000) {
    throw new AccessDenied('invalid_token');
  }
  const parts = header.slice(7).split('.');
  if (parts.length !== 3 || parts[1].length > 8192 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    throw new AccessDenied('invalid_token');
  }
  let claims;
  try { claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); }
  catch { throw new AccessDenied('invalid_token'); }
  if (typeof claims?.sub !== 'string' || typeof claims?.site_id !== 'string' || !ID.test(claims.site_id)) {
    throw new AccessDenied('invalid_token');
  }
  // Unverified claims select ONLY a static binding. NEVER contact a site until
  // RS256, issuer, audience, subject, timestamps and scope have been verified.
  const tenant = gateway.tenants.find(t => t.sub === claims.sub && t.siteId === claims.site_id);
  if (!tenant) throw new AccessDenied('invalid_token');
  return tenant;
}

export async function authenticateGateway(authorization, gateway, {fetcher=globalThis.fetch,keys,now=Date.now()}={}) {
  const binding = tenantHint(authorization,gateway);
  const config = {...gateway,...binding};
  const identity = await verifyAccessToken(authorization, config, {fetcher,keys,now});
  return {identity:Object.freeze({...identity,siteId:binding.siteId}),config};
}

export function gatewayMetadata(gateway) {
  return {resource:gateway.resource, authorization_servers:[gateway.issuer],
    scopes_supported:['posts:read']};
}

export async function handleGatewayMcp(request, {env=process.env,fetcher=globalThis.fetch,keys,now=Date.now()}={}) {
  let gateway;
  try { gateway = readGatewayConfig(env); }
  catch { return failResponse(503,'gateway_not_configured'); }
  let context;
  try { context = await authenticateGateway(request.headers.get('authorization'),gateway,{fetcher,keys,now}); }
  catch {
    return failResponse(401,'invalid_token',{'WWW-Authenticate':
      'Bearer resource_metadata="' + gateway.metadataUrl + '", scope="posts:read"'});
  }
  try {
    const handler=createMcpHandler(()=>makeEditorialMcp({...context,fetcher}));
    return await handler.fetch(request);
  } catch {
    return failResponse(502,'gateway_dispatch_failed');
  }
}
