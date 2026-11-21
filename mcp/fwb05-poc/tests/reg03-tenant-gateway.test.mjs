import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { readGatewayConfig, authenticateGateway, gatewayMetadata, handleGatewayMcp } from '../reg03/gateway.mjs';

const keys = generateKeyPairSync('rsa',{modulusLength:2048});
const pub = {...keys.publicKey.export({format:'jwk'}),kid:'reg03-test',alg:'RS256',use:'sig'};
const now = Date.parse('2026-11-21T12:00:00Z');
const sites = [
  {site_id:'site_alpha',subject:'principal-a',wordpress_url:'https://wp-a.example.org/',
   wordpress_host:'wp-a.example.org',wordpress_user:'wp-author-a',
   wordpress_app_password:'fictional-only-pass-alpha',wordpress_user_id:101},
  {site_id:'site_beta',subject:'principal-b',wordpress_url:'https://wp-b.example.org/',
   wordpress_host:'wp-b.example.org',wordpress_user:'wp-author-b',
   wordpress_app_password:'fictional-only-pass-beta',wordpress_user_id:202},
  {site_id:'site_shared',subject:'principal-a',wordpress_url:'https://wp-b.example.org/',
   wordpress_host:'wp-b.example.org',wordpress_user:'wp-author-shared',
   wordpress_app_password:'fictional-only-pass-shared',wordpress_user_id:303}
];
const env={
  FWB_REG03_STAGING:'enabled',
  FWB_OAUTH_ISSUER:'https://login.example.org',
  FWB_OAUTH_JWKS_URL:'https://login.example.org/jwks.json',
  FWB_REG03_MCP_RESOURCE:'https://mcp.example.org/api/gateway-mcp',
  FWB_REG03_TENANTS_JSON:JSON.stringify(sites)
};
const gateway=readGatewayConfig(env);

function jwt({sub='principal-a',site_id='site_alpha',scope='posts:read',...overrides}={},privateKey=keys.privateKey) {
  const claims={iss:gateway.issuer,aud:gateway.resource,sub,site_id,scope,
    iat:Math.floor(now/1000)-30,exp:Math.floor(now/1000)+180,...overrides};
  const header={alg:'RS256',typ:'at+jwt',kid:pub.kid};
  const input=[header,claims].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return input+'.'+sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
}
const bearer = t => 'Bearer '+t;
const auth = t => authenticateGateway(bearer(t),gateway,{keys:[pub],now});
const reply = (data,status=200) => ({ok:status >= 200 && status < 300,status,text:async()=>JSON.stringify(data)});

test('disabled by default; only HTTPS and pinned staging tenant endpoints',()=>{
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_STAGING:''}),/NOT_ENABLED/);
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_MCP_RESOURCE:'http://mcp.example.org/api/gateway-mcp'}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_MCP_RESOURCE:'https://mcp.example.org/api/secure-mcp'}));
  assert.throws(()=>readGatewayConfig({...env,FWB_OAUTH_JWKS_URL:'https://evil.example.org/jwks.json'}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_TENANTS_JSON:'{}'}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_TENANTS_JSON:JSON.stringify([
    {...sites[0],wordpress_url:'https://forjamineirad20.com.br/',wordpress_host:'forjamineirad20.com.br'}
  ])}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_TENANTS_JSON:JSON.stringify([
    {...sites[0],wordpress_url:'http://wp-a.example.org/'}
  ])}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_TENANTS_JSON:JSON.stringify([sites[0],sites[0]])}));
  assert.throws(()=>readGatewayConfig({...env,FWB_REG03_TENANTS_JSON:JSON.stringify([
    {...sites[0],wordpress_url:'https://wp-a.example.org/',untrusted_api_url:'https://evil.example.org'}
  ])}));
});
test('OAuth discovery points to exact public HTTPS gateway resource',()=>{
  assert.deepEqual(gatewayMetadata(gateway),{
    resource:'https://mcp.example.org/api/gateway-mcp',
    authorization_servers:['https://login.example.org'],
    scopes_supported:['posts:read']
  });
  assert.equal(gateway.metadataUrl,'https://mcp.example.org/.well-known/oauth-protected-resource/api/gateway-mcp');
});
test('only signed subject+site pair with correct issuer, audience, scope and time is accepted',async()=>{
  const {identity,config}=await auth(jwt());
  assert.equal(identity.sub,'principal-a');
  assert.equal(identity.siteId,'site_alpha');
  assert.equal(config.wpBase,'https://wp-a.example.org');
  assert.equal(config.ownPostsOnly,true);
  assert.equal(config.wpUserId,101);
  assert.equal(Object.hasOwn(config,'tenants'),false);
  assert.equal(config.enableWrites,false);
  const second=await auth(jwt({sub:'principal-b',site_id:'site_beta'}));
  assert.equal(second.config.wpUser,'wp-author-b');
  const shared=await auth(jwt({sub:'principal-a',site_id:'site_shared'}));
  assert.equal(shared.config.wpUserId,303);
  for(const claims of [
    {sub:'principal-b',site_id:'site_alpha'},
    {sub:'principal-a',site_id:'site_beta'},
    {sub:'principal-unknown',site_id:'site_shared'},
    {site_id:'arbitrary-site'},
    {iss:'https://wrong.example.org'},{aud:'https://wrong.example.org'},
    {exp:Math.floor(now/1000)-1},{iat:Math.floor(now/1000)+100},
    {scope:'drafts:write'}
  ]) await assert.rejects(()=>auth(jwt(claims)));
  const modified=jwt().split('.');
  const tampered=JSON.parse(Buffer.from(modified[1],'base64url').toString());
  tampered.site_id='site_shared';
  modified[1]=Buffer.from(JSON.stringify(tampered)).toString('base64url');
  await assert.rejects(()=>auth(modified.join('.')));
  await assert.rejects(()=>auth(jwt({},generateKeyPairSync('rsa',{modulusLength:2048}).privateKey)));
  await assert.rejects(()=>authenticateGateway('Bearer a.b.c',gateway,{keys:[pub],now}));
});
test('no configured tenant yields a non-revealing 401 and never contacts WordPress',async()=>{
  let calls=0;
  const options={env,keys:[pub],now,fetcher:async()=>{calls++;throw Error('unexpected');}};
  for(const value of [null,bearer(jwt({sub:'unknown'})),bearer(jwt({site_id:'site_beta'}))]){
    const request=new Request(gateway.resource,{method:'POST',headers:value?{'Authorization':value}:{}});
    const response=await handleGatewayMcp(request,options);
    assert.equal(response.status,401);
    assert.match(response.headers.get('www-authenticate'),/oauth-protected-resource\/api\/gateway-mcp/);
    const body=await response.text();
    assert.ok(!body.includes('wp-a.example.org') && !body.includes('fictional-only'));
  }
  assert.equal(calls,0);
});
test('real MCP transport routes two identities only to their registered WordPress credentials',async()=>{
  const seen=[];
  async function session(claims, expected, id) {
    const transport=new StreamableHTTPClientTransport(new URL(gateway.resource),{
      fetch:async(url,init)=>{
        const request=new Request(url,init);
        request.headers.set('authorization',bearer(jwt(claims)));
        return handleGatewayMcp(request,{env,keys:[pub],now,fetcher:async(endpoint,opt)=>{
          seen.push({endpoint,auth:opt.headers.Authorization});
          assert.ok(endpoint.startsWith(expected.wordpress_url.slice(0,-1)+'/wp-json/'));
          assert.equal(opt.redirect,'error');
          assert.equal(opt.method,'GET');
          assert.equal(opt.headers.Authorization,'Basic '+Buffer.from(expected.wordpress_user+':'+expected.wordpress_app_password).toString('base64'));
          const u=new URL(endpoint);
          if(u.pathname.endsWith('/posts')) {
            assert.equal(u.searchParams.get('author'),String(expected.wordpress_user_id));
            return reply([{id,author:expected.wordpress_user_id,status:'draft',title:{raw:'Only this author'}}]);
          }
          return reply({id,author:expected.wordpress_user_id,status:'draft',title:{raw:'Only this author'},content:{raw:'Private draft'}});
        }});
      }
    });
    const client=new Client({name:'reg03-identity-test',version:'0.1.0'},{versionNegotiation:{mode:'auto'}});
    try {
      await client.connect(transport);
      const list=await client.listTools();
      assert.ok(list.tools.some(t=>t.name==='forja_posts_list'));
      const posts=await client.callTool({name:'forja_posts_list',arguments:{limit:1}});
      assert.equal(posts.structuredContent.site,expected.site_id);
      assert.equal(posts.structuredContent.posts[0].id,id);
      const get=await client.callTool({name:'forja_post_get',arguments:{id}});
      assert.equal(get.structuredContent.post.content,'Private draft');
      assert.equal(list.tools.some(t=>t.name==='forja_draft_create'),false);
      assert.equal(list.tools.some(t=>t.name==='forja_draft_update'),false);
    } finally {await client.close();}
  }
  await session({sub:'principal-a',site_id:'site_alpha'},sites[0],14);
  await session({sub:'principal-b',site_id:'site_beta'},sites[1],27);
  assert.equal(seen.length,4);
  assert.ok(seen.every(s=>!s.endpoint.includes('api/gateway-mcp')));
});
test('same WordPress host cannot return another authors posts even when API ignores author filter',async()=>{
  let calls=0;
  const principal=await auth(jwt({sub:'principal-a',site_id:'site_shared'}));
  const { makeEditorial }=await import('../reg02/editorial.mjs');
  const api=makeEditorial({...principal,fetcher:async()=>{
    calls++;
    return reply([{id:88,author:202,status:'draft',title:{raw:'other user'}}]);
  }});
  await assert.rejects(()=>api.listPosts(5),/post_owner_mismatch/);
  const own=makeEditorial({...principal,fetcher:async()=>reply({
    id:88,author:202,status:'draft',title:{raw:'other user'}
  })});
  await assert.rejects(()=>own.getPost(88),/post_owner_mismatch/);
  assert.equal(calls,1);
});
test('staging env never permits drafting even if signed token asserts drafts:write',async()=>{
  const principal=await auth(jwt({scope:'posts:read drafts:write'}));
  assert.equal(principal.config.enableWrites,false);
  const { makeEditorial }=await import('../reg02/editorial.mjs');
  const api=makeEditorial({...principal,fetcher:async()=>{throw Error('unexpected network');}});
  await assert.rejects(()=>api.createDraft({title:'blocked'},'operationId_123456'),/staging_writes_disabled/);
});
