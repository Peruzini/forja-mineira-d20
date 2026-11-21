import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { AccessDenied, requireScope, verifyAccessToken } from '../reg02/auth.mjs';

const SITE_ID = /^[a-z][a-z0-9_-]{2,63}$/;
const PRODUCTION = new Set(['forjamineirad20.com.br','www.forjamineirad20.com.br']);

export class OnboardingDenied extends Error {
  constructor(code='connection_denied') { super(code); this.name='OnboardingDenied'; this.code=code; }
}
function httpsUrl(raw, label, path='/') {
  let u;
  try { u = new URL(raw); } catch { throw new OnboardingDenied(label+'_invalid'); }
  if (typeof raw !== 'string' || raw !== u.href || u.protocol !== 'https:'
    || u.username || u.password || u.search || u.hash || u.port || u.pathname !== path
    || !u.hostname.includes('.') || u.hostname === 'localhost'
    || isIP(u.hostname) !== 0 || u.hostname.includes(':')
    || /\.(local|internal|localhost)$/.test(u.hostname)) {
    throw new OnboardingDenied(label+'_invalid');
  }
  return u;
}
function basic(user,password) {
  return 'Basic '+Buffer.from(user+':'+password,'utf8').toString('base64');
}
function strictString(value, limit=200) {
  return typeof value === 'string' && value.length > 0 && value.length <= limit &&
    value.trim() === value && !/[\x00-\x1f\x7f]/.test(value);
}
function shaKey(sub,siteId) {
  return createHash('sha256').update(JSON.stringify([sub,siteId])).digest('hex');
}
function aad(sub,siteId) {
  return Buffer.from('FWB-REG04-site-connection-v1\0'+JSON.stringify([sub,siteId]),'utf8');
}
function seal(record, key, sub, siteId) {
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(aad(sub,siteId));
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(record),'utf8'),cipher.final()]);
  return Object.freeze({version:1,iv:iv.toString('base64url'),
    tag:cipher.getAuthTag().toString('base64url'),data:ciphertext.toString('base64url')});
}
function unseal(packet,key,sub,siteId) {
  try {
    if (!packet || packet.version!==1 || typeof packet.iv!=='string' ||
      typeof packet.tag!=='string' || typeof packet.data!=='string') throw Error();
    const iv=Buffer.from(packet.iv,'base64url'),tag=Buffer.from(packet.tag,'base64url');
    if(iv.length!==12 || tag.length!==16 || packet.data.length>8192) throw Error();
    const decipher=createDecipheriv('aes-256-gcm',key,iv);
    decipher.setAAD(aad(sub,siteId));
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(packet.data,'base64url')),
      decipher.final()]).toString('utf8'));
  } catch { throw new OnboardingDenied('encrypted_connection_invalid'); }
}

// Production requires a persistent transactional implementation of this interface.
// Do not configure this in a serverless request handler: it intentionally evaporates.
export class EphemeralSiteStore {
  #records=new Map();
  async createIfAbsent(key, envelope) {
    if (this.#records.has(key)) return false;
    this.#records.set(key,envelope); return true;
  }
  async get(key) { return this.#records.get(key) || null; }
  async delete(key) { return this.#records.delete(key); }
  async count() { return this.#records.size; }
}

export function readCentralConfig(env=process.env) {
  if (env.FWB_REG04_STAGING!=='enabled') throw new OnboardingDenied('REG04_NOT_ENABLED');
  const provider=env.FWB_REG04_PROVIDER==='keycloak'?'keycloak':'legacy';
  let issuer,jwks;
  if(provider==='keycloak') {
    const raw=env.FWB_REG04_ISSUER;
    let u;
    try {u=new URL(raw);} catch {throw new OnboardingDenied('issuer_invalid');}
    if(typeof raw!=='string' || raw!==u.href || u.protocol!=='https:' || u.port ||
      u.username || u.password || u.search || u.hash || isIP(u.hostname)!==0 ||
      !u.hostname.includes('.') || !/^\/realms\/[a-z][a-z0-9_-]{2,63}$/.test(u.pathname)) {
      throw new OnboardingDenied('issuer_invalid');
    }
    issuer=u.href;
    const expected=issuer+'/protocol/openid-connect/certs';
    if(env.FWB_REG04_JWKS_URL!==expected) throw new OnboardingDenied('keycloak_jwks_invalid');
    jwks=expected;
  } else {
    issuer=httpsUrl(env.FWB_REG04_ISSUER,'issuer').href.replace(/\/$/,'');
    jwks=httpsUrl(env.FWB_REG04_JWKS_URL,'jwks','/oauth/jwks.json').href;
  }
  const resource=httpsUrl(env.FWB_REG04_RESOURCE,'resource','/api/gateway-mcp').href;
  if(new URL(jwks).origin!==new URL(issuer).origin) throw new OnboardingDenied('jwks_origin_mismatch');
  const rawHosts=env.FWB_REG04_ALLOWED_WP_HOSTS;
  if (!strictString(rawHosts,1024)) throw new OnboardingDenied('allowed_hosts_missing');
  const hosts=rawHosts.split(',').map(h=>h.trim());
  if (hosts.some(h=>!h || h!==h.toLowerCase() || h.includes('/') || isIP(h)!==0 ||
      PRODUCTION.has(h) || h==='localhost' || !h.includes('.') ||
      /\.(local|internal|localhost)$/.test(h)) || new Set(hosts).size!==hosts.length) {
    throw new OnboardingDenied('allowed_hosts_invalid');
  }
  const keyText=env.FWB_REG04_ENCRYPTION_KEY_B64URL;
  if(typeof keyText!=='string' || !/^[a-zA-Z0-9_-]{43}$/.test(keyText)) {
    throw new OnboardingDenied('encryption_key_missing');
  }
  const key=Buffer.from(keyText,'base64url');
  if (key.length!==32) throw new OnboardingDenied('encryption_key_invalid');
  return {issuer, resource, jwks, provider, hosts:Object.freeze(hosts), key};
}

function parseUnverifiedSubject(authorization) {
  if(typeof authorization!=='string' || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization) ||
     authorization.length > 12000) throw new AccessDenied('invalid_token');
  const parts=authorization.slice(7).split('.');
  if(parts.length!==3 || parts[1].length>8192 || !/^[A-Za-z0-9_-]+$/.test(parts[1])) {
    throw new AccessDenied('invalid_token');
  }
  let claims;
  try { claims=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8')); }
  catch { throw new AccessDenied('invalid_token'); }
  if (!strictString(claims?.sub,200) || (claims.site_id!==undefined &&
       (typeof claims.site_id!=='string' || !SITE_ID.test(claims.site_id) ||
        typeof claims.connection_id!=='string' ||
        !/^[A-Za-z0-9_-]{22,64}$/.test(claims.connection_id))) ||
      (claims.site_id===undefined && claims.connection_id!==undefined)) {
    throw new AccessDenied('invalid_token');
  }
  // Hint is NOT authorization. Signature, audience, issuer and scope are verified below.
  return claims;
}

export async function verifyCentralIdentity(authorization,config,
  {keys,fetcher=globalThis.fetch,now=Date.now(),scope='sites:connect'}={}) {
  const claims=parseUnverifiedSubject(authorization);
  const identity=await verifyAccessToken(authorization,{issuer:config.issuer,resource:config.resource,
    jwks:config.jwks,sub:claims.sub},{keys,fetcher,now});
  requireScope(identity,scope);
  return Object.freeze({sub:identity.sub,siteId:claims.site_id||null,
    connectionId:claims.connection_id||null,scopes:identity.scopes});
}

async function wordpressUser(base, user, password, fetcher) {
  let response;
  try {
    response=await fetcher(base+'/wp-json/wp/v2/users/me?context=edit',{
      method:'GET',redirect:'error',headers:{Accept:'application/json',Authorization:basic(user,password)},
      signal:AbortSignal.timeout(8000)
    });
  } catch { throw new OnboardingDenied('wordpress_identity_unavailable'); }
  if(!response || !response.ok) throw new OnboardingDenied('wordpress_identity_rejected');
  let data;
  try {
    const raw=await response.text();
    if(raw.length>20000) throw Error();
    data=JSON.parse(raw);
  } catch { throw new OnboardingDenied('wordpress_identity_invalid'); }
  if (!Number.isSafeInteger(data?.id) || data.id<1 ||
    typeof data?.capabilities!=='object' || !data.capabilities ||
    Array.isArray(data.capabilities)) throw new OnboardingDenied('wordpress_identity_invalid');
  return {id:data.id,capabilities:data.capabilities};
}
function ensureStore(store) {
  if(!store || typeof store.createIfAbsent!=='function' ||
    typeof store.get!=='function' || typeof store.delete!=='function') {
    throw new OnboardingDenied('durable_storage_not_configured');
  }
}
export function makeOnboardingService({config,store,fetcher=globalThis.fetch}) {
  ensureStore(store);
  if(!config?.key || !Buffer.isBuffer(config.key) || config.key.length!==32 ||
    !Array.isArray(config.hosts)) throw new OnboardingDenied('staging_config_invalid');
  async function connect(identity,payload) {
    requireScope(identity,'sites:connect');
    if(!strictString(identity?.sub,200) || !payload || typeof payload!=='object' || Array.isArray(payload)) {
      throw new OnboardingDenied('connection_invalid');
    }
    const expected=['site_id','wordpress_url','admin_user','admin_app_password','author_user','author_app_password'];
    if(Object.keys(payload).sort().join(',')!==expected.sort().join(',') ||
      !SITE_ID.test(payload.site_id||'') || !strictString(payload.admin_user,120) ||
      !strictString(payload.author_user,120) ||
      !strictString(payload.admin_app_password,256) ||
      !strictString(payload.author_app_password,256) ||
      payload.admin_app_password.length<12 || payload.author_app_password.length<12 ||
      payload.admin_user===payload.author_user ||
      payload.admin_app_password===payload.author_app_password) {
      throw new OnboardingDenied('connection_invalid');
    }
    const wp=httpsUrl(payload.wordpress_url,'wordpress_url');
    if(!config.hosts.includes(wp.hostname) || PRODUCTION.has(wp.hostname)) {
      throw new OnboardingDenied('site_not_preapproved');
    }
    // TLS + strict host approval + WP administrator permission are the staging proof.
    // Caller-provided URLs outside the explicitly configured allowlist are rejected.
    const admin=await wordpressUser(wp.origin,payload.admin_user,payload.admin_app_password,fetcher);
    if(admin.capabilities.manage_options!==true) throw new OnboardingDenied('site_owner_permission_required');
    const author=await wordpressUser(wp.origin,payload.author_user,payload.author_app_password,fetcher);
    if(author.capabilities.edit_posts!==true || author.capabilities.manage_options===true ||
       author.id===admin.id) throw new OnboardingDenied('least_privilege_author_required');
    const record={wpBase:wp.origin,wpUser:payload.author_user,
      wpPassword:payload.author_app_password,wpUserId:author.id,
      connectionId:randomBytes(16).toString('base64url')};
    const stored=await store.createIfAbsent(shaKey(identity.sub,payload.site_id),
      seal(record,config.key,identity.sub,payload.site_id));
    if(stored!==true) throw new OnboardingDenied('site_already_connected');
    return Object.freeze({site_id:payload.site_id,host:wp.hostname,status:'connected',
      role:'author',read_only:true,connection_id:record.connectionId});
  }
  async function resolve(identity,siteId) {
    requireScope(identity,'posts:read');
    if(!strictString(identity?.sub,200) || typeof siteId!=='string' || !SITE_ID.test(siteId)) {
      throw new OnboardingDenied('site_not_connected');
    }
    const packet=await store.get(shaKey(identity.sub,siteId));
    if(!packet) throw new OnboardingDenied('site_not_connected');
    const r=unseal(packet,config.key,identity.sub,siteId);
    if(typeof r?.wpBase!=='string' || !strictString(r.wpUser,120) ||
      !strictString(r.wpPassword,256) || !Number.isSafeInteger(r.wpUserId) || r.wpUserId<1 ||
      !config.hosts.includes(httpsUrl(r.wpBase+'/','wordpress_url').hostname) ||
      typeof r.connectionId!=='string' || identity.connectionId!==r.connectionId) {
      throw new OnboardingDenied('encrypted_connection_invalid');
    }
    return Object.freeze({sub:identity.sub,siteId,wpBase:r.wpBase,wpUser:r.wpUser,
      wpPassword:r.wpPassword,wpUserId:r.wpUserId,ownPostsOnly:true,
      enableWrites:false,registerWriteTools:false});
  }
  async function disconnect(identity,siteId) {
    requireScope(identity,'sites:connect');
    if(!strictString(identity?.sub,200) || typeof siteId!=='string' || !SITE_ID.test(siteId)) {
      throw new OnboardingDenied('site_not_connected');
    }
    if(await store.delete(shaKey(identity.sub,siteId))!==true) {
      throw new OnboardingDenied('site_not_connected');
    }
    return Object.freeze({site_id:siteId,status:'disconnected'});
  }
  return {connect,resolve,disconnect};
}
