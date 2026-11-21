import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {readCentralConfig,verifyCentralIdentity,makeOnboardingService}
  from '../reg04/onboarding.mjs';
import {createPostgresSiteStore} from '../reg04b/postgres-store.mjs';
import {makeFederatedOnboarding,makeKeycloakBindingAdmin,readKeycloakAdminConfig}
  from '../reg04c/federated-onboarding.mjs';
import {handleCentralMcp} from '../reg04/central-gateway.mjs';

const enabled=process.env.FWB_REG04C_REAL_INTEGRATION==='enabled';
test('real Keycloak login + real WordPress owner/author + PostgreSQL + MCP and revocation', {
  skip:enabled?undefined:'only run in disposable integrated staging CI'
},async()=>{
  const env={...process.env,
    FWB_REG04_STAGING:'enabled',FWB_REG04_PROVIDER:'keycloak',
    FWB_REG04_ISSUER:'https://auth-lab.example.org/realms/fwb-reg04b-lab',
    FWB_REG04_JWKS_URL:'https://auth-lab.example.org/realms/fwb-reg04b-lab/protocol/openid-connect/certs',
    FWB_REG04_RESOURCE:'https://mcp.example.org/api/gateway-mcp',
    FWB_REG04_ALLOWED_WP_HOSTS:'wp-lab.example.org',
    FWB_REG04_ENCRYPTION_KEY_B64URL:randomBytes(32).toString('base64url'),
    FWB_REG04C_FEDERATION:'enabled'};
  const config=readCentralConfig(env);
  const tokens=JSON.parse(readFileSync('/tmp/fwb-reg04c-before-binding.json','utf8'));
  const wp=JSON.parse(readFileSync('/tmp/fwb-reg04c-wp-credentials.json','utf8'));
  const identity=await verifyCentralIdentity('Bearer '+tokens.access_token,config,{scope:'sites:connect'});
  assert.ok(identity.sub);
  assert.equal(identity.siteId,null);
  assert.equal(identity.connectionId,null);
  const master=new URLSearchParams({
    client_id:'admin-cli',grant_type:'password',username:'lab-admin',
    password:'only-temporary-ci-admin'
  });
  const login=await fetch('https://auth-lab.example.org/realms/master/protocol/openid-connect/token',{
    method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:master.toString()
  });
  assert.equal(login.status,200,'Keycloak disposable admin API login');
  const adminToken=(await login.json()).access_token;
  assert.ok(adminToken?.length>100);
  const adminConfig=readKeycloakAdminConfig({...env,FWB_REG04C_ADMIN_BEARER:adminToken});
  const admin=makeKeycloakBindingAdmin({config:adminConfig});
  const store=createPostgresSiteStore(env);
  try{
    await store.migrateForDisposableTest();
    const service=makeOnboardingService({config,store});
    const federation=makeFederatedOnboarding({service,keycloak:admin,
      onDiagnostic:code=>console.log('REG04C_KEYCLOAK_SYNC_DIAG',code)});
    const result=await federation.connect(identity,{
      site_id:'site_lab',wordpress_url:'https://wp-lab.example.org/',
      admin_user:wp.admin_user,admin_app_password:wp.admin_password,
      author_user:wp.author_user,author_app_password:wp.author_password
    });
    assert.equal(result.status,'connected');
    assert.equal(result.federated,true);
    assert.match(result.connection_id,/^[A-Za-z0-9_-]{22,64}$/);
    assert.ok(!JSON.stringify(result).includes(wp.author_password));
    assert.ok(!JSON.stringify(result).includes(wp.admin_password));
    console.log('REG04C_REAL_WORDPRESS_OWNER_AUTHOR_ONBOARDED');

    const refresh=await fetch(config.issuer+'/protocol/openid-connect/token',{
      method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',client_id:'fwb-reg04b-lab-client',
        refresh_token:tokens.refresh_token,resource:config.resource}).toString()
    });
    assert.equal(refresh.status,200,'refresh signed subject after Keycloak binding');
    const signed=(await refresh.json()).access_token;
    const bound=await verifyCentralIdentity('Bearer '+signed,config,{scope:'posts:read'});
    assert.equal(bound.sub,identity.sub);
    assert.equal(bound.siteId,result.site_id);
    assert.equal(bound.connectionId,result.connection_id);
    console.log('REG04C_REAL_KEYCLOAK_UPDATED_SIGNED_BINDING');

    const transport=new StreamableHTTPClientTransport(new URL(config.resource),{
      fetch:async(url,options)=>{
        const request=new Request(url,options);
        request.headers.set('Authorization','Bearer '+signed);
        return handleCentralMcp(request,{env,store});
      }
    });
    const client=new Client({name:'fwb-reg04c-real-integrated-ci',version:'1.0.0'},
      {versionNegotiation:{mode:'auto'}});
    try{
      await client.connect(transport);
      const discovered=await client.listTools();
      assert.ok(discovered.tools.some(t=>t.name==='forja_posts_list'));
      assert.equal(discovered.tools.some(t=>t.name==='forja_draft_create'),false);
      const result=await client.callTool({name:'forja_posts_list',arguments:{limit:10}});
      assert.equal(result.structuredContent.site,'site_lab');
      const post=result.structuredContent.posts.find(p=>p.title==='REG04C Verified Draft');
      assert.ok(post,'expected author WordPress draft was not returned');
      const read=await client.callTool({name:'forja_post_get',arguments:{id:post.id}});
      assert.equal(read.structuredContent.post.title,'REG04C Verified Draft');
      console.log('REG04C_REAL_WORDPRESS_POSTS_VIA_KEYCLOAK_MCP_PASS');
    }finally{await client.close();}

    const gone=await federation.disconnect(bound,'site_lab');
    assert.equal(gone.status,'disconnected');
    const revoked=await handleCentralMcp(new Request(config.resource,{
      method:'POST',headers:{Authorization:'Bearer '+signed}
    }),{env,store});
    assert.equal(revoked.status,401);
    console.log('REG04C_REAL_CROSS_SERVICE_REVOCATION_PASS');
  }finally{
    await store.close();
  }
});
