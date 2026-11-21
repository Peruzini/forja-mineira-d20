import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { handleSecureMcp } from '../reg02/secure-server.mjs';

const env={
  FWB_REG02_STAGING:'enabled',
  FWB_OAUTH_ISSUER:'https://login.example.org',
  FWB_MCP_RESOURCE:'https://mcp.example.org/api/secure-mcp',
  FWB_OAUTH_JWKS_URL:'https://login.example.org/jwks.json',
  FWB_OAUTH_ALLOWED_SUB:'owner-123',
  FWB_WP_STAGING_URL:'https://wp-stage.example.org/',
  FWB_WP_STAGING_HOST:'wp-stage.example.org',
  FWB_WP_SERVICE_USER:'service-demo',
  FWB_WP_SERVICE_APP_PASSWORD:'not-a-real-secret'
};
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const pub={...keys.publicKey.export({format:'jwk'}),kid:'mcp-key',alg:'RS256'};
const now=Date.parse('2026-11-20T23:00:00Z');
function token(scope='posts:read') {
  const header={alg:'RS256',typ:'at+jwt',kid:'mcp-key'};
  const claims={iss:env.FWB_OAUTH_ISSUER,aud:env.FWB_MCP_RESOURCE,
    sub:env.FWB_OAUTH_ALLOWED_SUB,scope,
    iat:Math.floor(now/1000)-30,exp:Math.floor(now/1000)+180};
  const input=[header,claims].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
  return input+'.'+sign('RSA-SHA256',Buffer.from(input),keys.privateKey).toString('base64url');
}
test('route closed by default before any identity is configured',async()=>{
  const r=await handleSecureMcp(new Request(env.FWB_MCP_RESOURCE,{method:'GET'}),{
    env:{},now,keys:[pub],fetcher:async()=>{throw Error('no network');}});
  assert.equal(r.status,503);
});
test('unauthenticated requests return RFC 9728 challenge (no WordPress calls)',async()=>{
  const r=await handleSecureMcp(new Request(env.FWB_MCP_RESOURCE,{method:'POST'}),{
    env,now,keys:[pub],fetcher:async()=>{throw Error('no network');}});
  assert.equal(r.status,401);
  assert.match(r.headers.get('www-authenticate'),/resource_metadata/);
});
test('authenticated ChatGPT-style MCP client discovers tools and performs read-only staging request',async()=>{
  let wpCalls=0;
  const transport=new StreamableHTTPClientTransport(new URL(env.FWB_MCP_RESOURCE),{
    fetch:async(url,init)=>{
      const request=new Request(url,init);
      request.headers.set('Authorization','Bearer '+token());
      return handleSecureMcp(request,{
        env,now,keys:[pub],fetcher:async(endpoint,wpInit)=>{
          wpCalls++;
          assert.ok(endpoint.startsWith('https://wp-stage.example.org/wp-json/'));
          assert.equal(wpInit.method,'GET');
          return {ok:true,status:200,text:async()=>JSON.stringify([{id:31,status:'draft',
            title:{raw:'Homologação'},excerpt:{raw:'Exemplo'}}])};
        }
      });
    }
  });
  const client=new Client({name:'fwb-reg02-test',version:'0.1.0'},{versionNegotiation:{mode:'auto'}});
  try {
    await client.connect(transport);
    const tools=await client.listTools();
    const names=tools.tools.map(x=>x.name);
    for(const n of ['forja_posts_list','forja_post_get','forja_draft_validate',
      'forja_draft_create','forja_draft_update'])assert.ok(names.includes(n),n);
    const r=await client.callTool({name:'forja_posts_list',arguments:{limit:1}});
    assert.equal(r.structuredContent.posts[0].title,'Homologação');
    const forbidden=await client.callTool({name:'forja_draft_create',arguments:{
      title:'Sem autorização de escrita',operation_id:'operationId_123456'
    }});
    assert.equal(forbidden.isError,true);
    assert.equal(wpCalls,1);
  } finally {await client.close();}
});
