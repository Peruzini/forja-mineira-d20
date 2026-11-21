import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readConfig, metadata, verifyAccessToken, unauthorized } from '../reg02/auth.mjs';

const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const pub={...keys.publicKey.export({format:'jwk'}),kid:'staging-test',alg:'RS256',use:'sig'};
const env={
  FWB_REG02_STAGING:'enabled',
  FWB_OAUTH_ISSUER:'https://login.example.org',
  FWB_MCP_RESOURCE:'https://mcp.example.org/api/secure-mcp',
  FWB_OAUTH_JWKS_URL:'https://login.example.org/jwks.json',
  FWB_OAUTH_ALLOWED_SUB:'owner-123',
  FWB_WP_STAGING_URL:'https://wp-stage.example.org/',
  FWB_WP_STAGING_HOST:'wp-stage.example.org',
  FWB_WP_SERVICE_USER:'wp-test',
  FWB_WP_SERVICE_APP_PASSWORD:'dummy-not-real'
};
const cfg=readConfig(env);
const now=Date.parse('2026-11-20T23:00:00Z');
function token(overrides={},headOverrides={}) {
  const header={alg:'RS256',typ:'at+jwt',kid:pub.kid,...headOverrides};
  const claims={
    iss:cfg.issuer,sub:cfg.sub,aud:cfg.resource,iat:Math.floor(now/1000)-60,
    exp:Math.floor(now/1000)+240,scope:'posts:read drafts:write',...overrides
  };
  const data=[header,claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');
  return data+'.'+sign('RSA-SHA256',Buffer.from(data),keys.privateKey).toString('base64url');
}
async function check(raw) {
  return verifyAccessToken('Bearer '+raw,cfg,{keys:[pub],now});
}
test('staging alone enabled; no production WordPress or unpinned URL',()=>{
  assert.throws(()=>readConfig({...env,FWB_REG02_STAGING:undefined}),/REG02_NOT_ENABLED/);
  assert.throws(()=>readConfig({...env,FWB_WP_STAGING_URL:'https://forjamineirad20.com.br/',
    FWB_WP_STAGING_HOST:'forjamineirad20.com.br'}),/wp_production_prohibited/);
  assert.throws(()=>readConfig({...env,FWB_WP_STAGING_URL:'http://wp-stage.example.org/'}));
  assert.throws(()=>readConfig({...env,FWB_OAUTH_JWKS_URL:'https://attacker.example.org/jwks'}),/jwks_origin_mismatch/);
  assert.equal(cfg.enableWrites,false);
});
test('protected-resource metadata binds issuer and resource',()=>{
  assert.deepEqual(metadata(cfg),{
    resource:'https://mcp.example.org/api/secure-mcp',
    authorization_servers:['https://login.example.org'],
    scopes_supported:['posts:read','drafts:write']
  });
});
test('valid JWT has verified signature, one allowed subject, audience and read scope',async()=>{
  const id=await check(token());
  assert.equal(id.sub,'owner-123');
  assert.ok(id.scopes.has('drafts:write'));
});
test('never accept wrong issuer, audience, sub, exp, future iat, absent scope',async()=>{
  for(const values of [
    {iss:'https://evil.example.org'},{aud:'https://another.example.org'},
    {sub:'other-user'},{exp:Math.floor(now/1000)-1},
    {iat:Math.floor(now/1000)+99},{scope:'drafts:write'},
    {exp:Math.floor(now/1000)+800}
  ]) await assert.rejects(()=>check(token(values)));
});
test('never accept unsigned, changed signature, wrong header algorithm or ID token',async()=>{
  const good=token();
  const changed=good.slice(0,-5)+(good.endsWith('AAAAA')?'BBBBB':'AAAAA');
  for(const raw of [changed,token({}, {alg:'none'}),token({}, {typ:'JWT'}),'a.b.c']) {
    await assert.rejects(()=>check(raw));
  }
  await assert.rejects(()=>verifyAccessToken(null,cfg,{keys:[pub],now}));
});
test('provider key matching and size requirements',async()=>{
  const k={...pub,kid:'other'};
  await assert.rejects(()=>verifyAccessToken('Bearer '+token(),cfg,{keys:[k],now}));
  const {publicKey:weakPublic,privateKey:weakPrivate}=generateKeyPairSync('rsa',{modulusLength:1024});
  const weakJwk={...weakPublic.export({format:'jwk'}),kid:'weak',alg:'RS256'};
  const h=Buffer.from(JSON.stringify({alg:'RS256',typ:'at+jwt',kid:'weak'})).toString('base64url');
  const p=Buffer.from(JSON.stringify({iss:cfg.issuer,aud:cfg.resource,sub:cfg.sub,
    iat:Math.floor(now/1000)-30,exp:Math.floor(now/1000)+60,scope:'posts:read'})).toString('base64url');
  const data=h+'.'+p;
  const weak=data+'.'+sign('RSA-SHA256',Buffer.from(data),weakPrivate).toString('base64url');
  await assert.rejects(()=>verifyAccessToken('Bearer '+weak,cfg,{keys:[weakJwk],now}));
});
test('fetches JWKS only from pinned endpoint, without redirects',async()=>{
  let called=0;
  const fetcher=async (url,options)=>{
    called++;
    assert.equal(url,cfg.jwks);
    assert.equal(options.redirect,'error');
    return {ok:true,text:async()=>JSON.stringify({keys:[pub]})};
  };
  const id=await verifyAccessToken('Bearer '+token(),cfg,{fetcher,now});
  assert.equal(id.sub,cfg.sub);
  assert.equal(called,1);
});
test('401 WWW-Authenticate contains only public metadata path',async()=>{
  const response=unauthorized(cfg);
  assert.equal(response.status,401);
  assert.match(response.headers.get('www-authenticate'),/oauth-protected-resource/);
  assert.ok(!(await response.text()).includes(env.FWB_WP_SERVICE_APP_PASSWORD));
});
