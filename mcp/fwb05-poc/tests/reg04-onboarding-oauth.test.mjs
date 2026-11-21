import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { readCentralConfig, verifyCentralIdentity, makeOnboardingService, EphemeralSiteStore } from '../reg04/onboarding.mjs';
import { verifyCentralOAuthMetadata } from '../reg04/oauth-profile.mjs';
import { handleCentralMcp, centralMetadata } from '../reg04/central-gateway.mjs';

const kp=generateKeyPairSync('rsa',{modulusLength:2048});
const pub={...kp.publicKey.export({format:'jwk'}),kid:'central-stage-test',alg:'RS256',use:'sig'};
const now=Date.parse('2026-11-21T14:00:00Z');
const env={
  FWB_REG04_STAGING:'enabled',
  FWB_REG04_ISSUER:'https://login.example.org/',
  FWB_REG04_JWKS_URL:'https://login.example.org/oauth/jwks.json',
  FWB_REG04_RESOURCE:'https://mcp.example.org/api/gateway-mcp',
  FWB_REG04_ALLOWED_WP_HOSTS:'wp-one.example.org,wp-two.example.org',
  FWB_REG04_ENCRYPTION_KEY_B64URL:randomBytes(32).toString('base64url')
};
const config=readCentralConfig(env);
const onboarding={
  site_id:'site_one',wordpress_url:'https://wp-one.example.org/',
  admin_user:'administrator-test',admin_app_password:'not-a-real-admin-secret',
  author_user:'author-test',author_app_password:'not-a-real-author-secret'
};
function jwt(claims={},key=kp.privateKey) {
  const h={alg:'RS256',typ:'at+jwt',kid:pub.kid};
  const p={iss:config.issuer,aud:config.resource,sub:'subject-owner',
    scope:'posts:read sites:connect',iat:Math.floor(now/1000)-30,
    exp:Math.floor(now/1000)+180,...claims};
  const data=[h,p].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return data+'.'+sign('RSA-SHA256',Buffer.from(data),key).toString('base64url');
}
const verify = (raw,scope='sites:connect') => verifyCentralIdentity('Bearer '+raw,config,{now,keys:[pub],scope});
const response=(data,status=200)=>({ok:status>=200&&status<300,status,
  text:async()=>JSON.stringify(data)});
const authAdmin='Basic '+Buffer.from(onboarding.admin_user+':'+onboarding.admin_app_password).toString('base64');
const authAuthor='Basic '+Buffer.from(onboarding.author_user+':'+onboarding.author_app_password).toString('base64');

function wpFetcher(calls,adminCaps={manage_options:true,edit_posts:true},authorCaps={edit_posts:true}) {
  return async(url,options)=>{
    calls.push({url,options});
    assert.ok(url.startsWith('https://wp-one.example.org/wp-json/'));
    assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization===authAdmin ||
      options.headers.Authorization===authAuthor,true);
    if(options.headers.Authorization===authAdmin) return response({id:1,capabilities:adminCaps});
    if(url.includes('/users/me')) return response({id:23,capabilities:authorCaps});
    if(url.includes('/wp/v2/posts?')) {
      const query=new URL(url).searchParams;
      assert.equal(query.get('author'),'23');
      return response([{id:19,author:23,status:'draft',title:{raw:'Private Draft'}}]);
    }
    return response({id:19,author:23,status:'draft',title:{raw:'Private Draft'},
      content:{raw:'From site one'}});
  };
}

test('REG-04 remains disabled, refuses production and private IP targets, untrusted hosts, weak encryption keys',()=>{
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_STAGING:''}),/REG04_NOT_ENABLED/);
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_RESOURCE:'http://mcp.example.org/api/gateway-mcp'}));
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_JWKS_URL:'https://evil.example.org/oauth/jwks.json'}));
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_ALLOWED_WP_HOSTS:'forjamineirad20.com.br'}));
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_ALLOWED_WP_HOSTS:'127.0.0.1'}));
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_ALLOWED_WP_HOSTS:'wp-one.example.org,wp-one.example.org'}));
  assert.throws(()=>readCentralConfig({...env,FWB_REG04_ENCRYPTION_KEY_B64URL:'too-short'}));
});
test('central metadata supports PKCE S256 CIMD auth-code and pinned JWKS',async()=>{
  const profile=await verifyCentralOAuthMetadata(config,async(url,options)=>{
    assert.equal(url,'https://login.example.org/.well-known/oauth-authorization-server');
    assert.equal(options.redirect,'error');
    return response({
      issuer:config.issuer, authorization_endpoint:config.issuer+'/oauth/authorize',
      token_endpoint:config.issuer+'/oauth/token',jwks_uri:config.jwks,
      response_types_supported:['code'],grant_types_supported:['authorization_code'],
      code_challenge_methods_supported:['S256'],
      client_id_metadata_document_supported:true,
      token_endpoint_auth_methods_supported:['none','private_key_jwt']
    });
  });
  assert.equal(profile.cimd,true);
  assert.equal(profile.pkce,'S256');
  assert.deepEqual(centralMetadata(config),{
    resource:config.resource,authorization_servers:[config.issuer],scopes_supported:['posts:read']
  });
});
test('central metadata rejects mismatched issuer, unsupported PKCE or no CIMD',async()=>{
  const good={
    issuer:config.issuer,authorization_endpoint:config.issuer+'/oauth/authorize',
    token_endpoint:config.issuer+'/oauth/token',jwks_uri:config.jwks,
    response_types_supported:['code'],grant_types_supported:['authorization_code'],
    code_challenge_methods_supported:['S256'],client_id_metadata_document_supported:true,
    token_endpoint_auth_methods_supported:['none']
  };
  for(const delta of [
    {issuer:'https://malicious.example.org'},
    {code_challenge_methods_supported:['plain']},
    {client_id_metadata_document_supported:false},
    {token_endpoint:'https://malicious.example.org/oauth/token'},
    {token_endpoint_auth_methods_supported:['client_secret_post']}
  ]) {
    await assert.rejects(()=>verifyCentralOAuthMetadata(config,async()=>response({...good,...delta})));
  }
});
test('RS256 issuer, aud, scope, token lifetime and signature required for central principal',async()=>{
  const id=await verify(jwt());
  assert.equal(id.sub,'subject-owner');
  assert.equal(id.siteId,null);
  for(const p of [
    {iss:'https://attacker.example.org'},
    {aud:'https://other.example.org'},
    {scope:'posts:read'},
    {exp:Math.floor(now/1000)-1},
    {iat:Math.floor(now/1000)+100}
  ]) await assert.rejects(()=>verify(jwt(p)));
  const evil=generateKeyPairSync('rsa',{modulusLength:2048});
  await assert.rejects(()=>verify(jwt({},evil.privateKey)));
});
test('admin proves ownership, least privilege author is stored encrypted, no admin password persisted',async()=>{
  const calls=[],store=new EphemeralSiteStore();
  const service=makeOnboardingService({config,store,fetcher:wpFetcher(calls)});
  const id=await verify(jwt());
  const connected=await service.connect(id,onboarding);
  assert.equal(connected.status,'connected');
  assert.match(connected.connection_id,/^[A-Za-z0-9_-]{22,64}$/);
  assert.equal(await store.count(),1);
  assert.equal(calls.length,2);
  const saved=await store.get('wrong-key');
  assert.equal(saved,null);
  const signed=await verify(jwt({site_id:connected.site_id,connection_id:connected.connection_id}),
    'posts:read');
  const site=await service.resolve(signed,connected.site_id);
  assert.equal(site.wpBase,'https://wp-one.example.org');
  assert.equal(site.wpUserId,23);
  assert.equal(site.wpPassword,onboarding.author_app_password);
  assert.equal(site.enableWrites,false);
  assert.equal(site.registerWriteTools,false);
  assert.equal(JSON.stringify(connected).includes(onboarding.author_app_password),false);
  assert.equal(JSON.stringify(connected).includes(onboarding.admin_app_password),false);
  await assert.rejects(()=>service.connect(id,onboarding),/site_already_connected/);
  const other=await verify(jwt({sub:'another-principal',site_id:connected.site_id,
    connection_id:connected.connection_id}),'posts:read');
  await assert.rejects(()=>service.resolve(other,connected.site_id),/site_not_connected/);
});
test('malicious payloads are rejected before making outbound network requests',async()=>{
  let calls=0;
  const service=makeOnboardingService({config,store:new EphemeralSiteStore(),
    fetcher:async()=>{calls++;throw Error('network unexpectedly used');}});
  const id=await verify(jwt());
  const invalid=[
    {...onboarding,wordpress_url:'https://forjamineirad20.com.br/'},
    {...onboarding,wordpress_url:'http://wp-one.example.org/'},
    {...onboarding,wordpress_url:'https://127.0.0.1/'},
    {...onboarding,wordpress_url:'https://wp-two.example.org.evil.com/'},
    {...onboarding,wordpress_url:'https://wp-one.example.org/wp-json/'},
    {...onboarding,wordpress_url:'https://wp-one.example.org/',wordpress_user:'attacker'},
    {...onboarding,author_user:onboarding.admin_user},
    {...onboarding,author_app_password:onboarding.admin_app_password}
  ];
  for(const p of invalid) await assert.rejects(()=>service.connect(id,p));
  assert.equal(calls,0);
});
test('admin permission and author privilege failures reject without persisting a connection',async()=>{
  const id=await verify(jwt());
  for(const [adminCaps,authorCaps] of [
    [{edit_posts:true},{edit_posts:true}],
    [{manage_options:true},{edit_posts:true,manage_options:true}],
    [{manage_options:true},{edit_posts:false}]
  ]) {
    const store=new EphemeralSiteStore();
    const service=makeOnboardingService({
      config,store,fetcher:wpFetcher([],adminCaps,authorCaps)
    });
    await assert.rejects(()=>service.connect(id,onboarding));
    assert.equal(await store.count(),0);
  }
});
test('disconnect revokes site immediately and reconnect invalidates old signed binding tokens',async()=>{
  const store=new EphemeralSiteStore();
  const service=makeOnboardingService({config,store,fetcher:wpFetcher([])});
  const owner=await verify(jwt());
  const first=await service.connect(owner,onboarding);
  const old=await verify(jwt({site_id:onboarding.site_id,connection_id:first.connection_id}),'posts:read');
  assert.equal((await service.resolve(old,onboarding.site_id)).wpUserId,23);
  assert.equal((await service.disconnect(owner,onboarding.site_id)).status,'disconnected');
  await assert.rejects(()=>service.resolve(old,onboarding.site_id),/site_not_connected/);
  const second=await service.connect(owner,onboarding);
  assert.notEqual(second.connection_id,first.connection_id);
  await assert.rejects(()=>service.resolve(old,onboarding.site_id),/encrypted_connection_invalid/);
  const fresh=await verify(jwt({site_id:onboarding.site_id,connection_id:second.connection_id}),'posts:read');
  assert.equal((await service.resolve(fresh,onboarding.site_id)).wpUserId,23);
});
test('central gateway is unavailable without durable store, invalid token is 401 without WordPress request',async()=>{
  const req=new Request(config.resource,{method:'POST'});
  const noStore=await handleCentralMcp(req,{env,now,keys:[pub]});
  assert.equal(noStore.status,503);
  let calls=0;
  const r=await handleCentralMcp(req,{env,now,keys:[pub],store:new EphemeralSiteStore(),
    fetcher:async()=>{calls++;throw Error('network should not be used');}});
  assert.equal(r.status,401);
  assert.match(r.headers.get('www-authenticate'),/resource_metadata/);
  assert.equal(calls,0);
});
test('signed central OAuth client exercises MCP read-only against connected WordPress and revocation',async()=>{
  const calls=[],store=new EphemeralSiteStore();
  const fetcher=wpFetcher(calls);
  const service=makeOnboardingService({config,store,fetcher});
  const owner=await verify(jwt());
  const {connection_id}=await service.connect(owner,onboarding);
  const access=jwt({site_id:onboarding.site_id,connection_id,scope:'posts:read'});
  const transport=new StreamableHTTPClientTransport(new URL(config.resource),{
    fetch:async(url,init)=>{
      const request=new Request(url,init);
      request.headers.set('authorization','Bearer '+access);
      return handleCentralMcp(request,{env,now,keys:[pub],store,fetcher});
    }
  });
  const client=new Client({name:'reg04-mcp-integration',version:'0.1.0'},
    {versionNegotiation:{mode:'auto'}});
  try {
    await client.connect(transport);
    const tools=await client.listTools();
    assert.ok(tools.tools.some(t=>t.name==='forja_posts_list'));
    assert.equal(tools.tools.some(t=>t.name==='forja_draft_create'),false);
    const list=await client.callTool({name:'forja_posts_list',arguments:{limit:2}});
    assert.equal(list.structuredContent.site,onboarding.site_id);
    assert.equal(list.structuredContent.posts[0].title,'Private Draft');
    const get=await client.callTool({name:'forja_post_get',arguments:{id:19}});
    assert.equal(get.structuredContent.post.content,'From site one');
    assert.equal(calls.filter(x=>x.url.includes('/wp/v2/posts')).length,2);
    await service.disconnect(owner,onboarding.site_id);
    const revoked=await handleCentralMcp(new Request(config.resource,{method:'POST',
      headers:{Authorization:'Bearer '+access}}),{env,now,keys:[pub],store,fetcher});
    assert.equal(revoked.status,401);
  } finally {await client.close();}
});

test('two different principals onboard separate sites without sharing credentials or binding envelopes',async()=>{
  const alt={
    site_id:'site_two',wordpress_url:'https://wp-two.example.org/',
    admin_user:'admin-other',admin_app_password:'another-fake-admin-secret',
    author_user:'writer-other',author_app_password:'another-fake-writer-secret'
  };
  const expected={
    [onboarding.wordpress_url]:{admin:onboarding.admin_user+':'+onboarding.admin_app_password,
      author:onboarding.author_user+':'+onboarding.author_app_password,id:23},
    [alt.wordpress_url]:{admin:alt.admin_user+':'+alt.admin_app_password,
      author:alt.author_user+':'+alt.author_app_password,id:55}
  };
  const calls=[],store=new EphemeralSiteStore();
  const service=makeOnboardingService({config,store,fetcher:async(url,opts)=>{
    calls.push(url);
    const site=expected[new URL(url).origin+'/'];
    assert.ok(site);
    const value=Buffer.from(opts.headers.Authorization.slice(6),'base64').toString('utf8');
    if(value===site.admin)return response({id:1,capabilities:{manage_options:true}});
    if(value===site.author)return response({id:site.id,capabilities:{edit_posts:true}});
    return response({error:'wrong credentials'},401);
  }});
  const ownerA=await verify(jwt());
  const ownerB=await verify(jwt({sub:'subject-b'}));
  const a=await service.connect(ownerA,onboarding);
  const b=await service.connect(ownerB,alt);
  assert.equal(await store.count(),2);
  const aIdentity=await verify(jwt({site_id:a.site_id,connection_id:a.connection_id}),'posts:read');
  const bIdentity=await verify(jwt({sub:'subject-b',site_id:b.site_id,
    connection_id:b.connection_id}),'posts:read');
  const aRecord=await service.resolve(aIdentity,a.site_id);
  const bRecord=await service.resolve(bIdentity,b.site_id);
  assert.equal(aRecord.wpUserId,23);
  assert.equal(bRecord.wpUserId,55);
  assert.notEqual(aRecord.wpPassword,bRecord.wpPassword);
  await assert.rejects(()=>service.resolve(aIdentity,b.site_id),/site_not_connected/);
  await assert.rejects(()=>service.resolve(bIdentity,a.site_id),/site_not_connected/);
  const storageKey=(sub,site)=>createHash('sha256')
    .update(JSON.stringify([sub,site])).digest('hex');
  const envelope=await store.get(storageKey(ownerA.sub,a.site_id));
  assert.ok(envelope);
  const blob=JSON.stringify(envelope);
  for(const secret of [onboarding.admin_app_password,onboarding.author_app_password,
    alt.admin_app_password,alt.author_app_password]) assert.equal(blob.includes(secret),false);
  const otherStore=new EphemeralSiteStore();
  await otherStore.createIfAbsent(storageKey(ownerB.sub,b.site_id),envelope);
  const otherService=makeOnboardingService({config,store:otherStore,fetcher:async()=>{
    throw Error('no network expected');
  }});
  await assert.rejects(()=>otherService.resolve(bIdentity,b.site_id),
    /encrypted_connection_invalid/);
  assert.equal(calls.length,4);
});
