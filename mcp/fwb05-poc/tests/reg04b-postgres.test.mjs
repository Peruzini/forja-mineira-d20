import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {PostgresSiteStore,createPostgresSiteStore} from '../reg04b/postgres-store.mjs';
import {readCentralConfig,makeOnboardingService} from '../reg04/onboarding.mjs';

const enabled=process.env.FWB_REG04B_REAL_POSTGRES_TEST==='enabled';
const skip = enabled ? undefined : 'requires disposable PostgreSQL CI service';

test('durable storage remains explicitly disabled and never defaults to local insecure DB',()=>{
  assert.throws(()=>createPostgresSiteStore({}),/postgres_storage_disabled/);
  const e={FWB_REG04B_PG_STORAGE:'enabled',
    FWB_REG04B_DATABASE_URL:'postgresql://user:pw@127.0.0.1:5432/fwb'};
  assert.throws(()=>createPostgresSiteStore(e),/postgres_local_connection_prohibited/);
  assert.throws(()=>createPostgresSiteStore({...e,FWB_REG04B_DATABASE_URL:'file:///tmp/fake'}));
  assert.throws(()=>createPostgresSiteStore({...e,FWB_REG04B_DATABASE_URL:'postgresql://user:pw@127.0.0.1:5432/fwb?sslmode=disable'}));
});
test('real PostgreSQL atomically stores isolated encrypted bindings, rejects duplicate and revokes', {skip}, async()=>{
  const store=createPostgresSiteStore(process.env);
  try{
    await store.migrateForDisposableTest();
    const key='f'.repeat(64), secondKey='e'.repeat(64);
    await store.delete(key);await store.delete(secondKey);
    const envelope={version:1,iv:'1234567890ab',tag:'1234567890123456',
      data:'fictional-ciphertext-no-real-token'};
    const concurrent=await Promise.all(
      Array.from({length:12},()=>store.createIfAbsent(key,envelope)));
    assert.equal(concurrent.filter(Boolean).length,1);
    assert.deepEqual(await store.get(key),envelope);
    assert.equal(await store.get(secondKey),null);
    assert.equal(await store.delete(secondKey),false);
    assert.equal(await store.delete(key),true);
    assert.equal(await store.get(key),null);

    const config=readCentralConfig({
      FWB_REG04_STAGING:'enabled',
      FWB_REG04_ISSUER:'https://issuer.example.org/',
      FWB_REG04_JWKS_URL:'https://issuer.example.org/oauth/jwks.json',
      FWB_REG04_RESOURCE:'https://mcp.example.org/api/gateway-mcp',
      FWB_REG04_ALLOWED_WP_HOSTS:'wp-lab.example.org',
      FWB_REG04_ENCRYPTION_KEY_B64URL:randomBytes(32).toString('base64url')
    });
    const username='lab-writer',password='fictional-editorial-password';
    const admin='lab-admin',adminPassword='fictional-admin-password';
    const fetcher=async(_url,opt)=>{
      assert.equal(opt.redirect,'error');
      const token=Buffer.from(opt.headers.Authorization.slice(6),'base64').toString('utf8');
      if(token===admin+':'+adminPassword) return {
        ok:true,text:async()=>JSON.stringify({id:1,capabilities:{manage_options:true}})
      };
      assert.equal(token,username+':'+password);
      return {ok:true,text:async()=>JSON.stringify({id:22,capabilities:{edit_posts:true}})};
    };
    const service=makeOnboardingService({config,store,fetcher});
    const adminIdentity={sub:'principal-alpha',scopes:new Set(['posts:read','sites:connect'])};
    const bound=await service.connect(adminIdentity,{
      site_id:'site_lab',wordpress_url:'https://wp-lab.example.org/',
      admin_user:admin,admin_app_password:adminPassword,
      author_user:username,author_app_password:password
    });
    const records=await store.pool.query('SELECT envelope::text AS body FROM fwb_site_connections');
    const raw=records.rows.map(x=>x.body).join('');
    assert.equal(raw.includes(adminPassword),false);
    assert.equal(raw.includes(password),false);
    const identity={...adminIdentity,connectionId:bound.connection_id};
    const connection=await service.resolve(identity,'site_lab');
    assert.equal(connection.wpUserId,22);
    await assert.rejects(()=>service.resolve({...identity,sub:'principal-beta'},'site_lab'));
    assert.equal((await service.disconnect(adminIdentity,'site_lab')).status,'disconnected');
    await assert.rejects(()=>service.resolve(identity,'site_lab'));
  } finally{
    await store.pool.query("DELETE FROM fwb_site_connections WHERE binding_key IN ($1,$2)",
      ['f'.repeat(64),'e'.repeat(64)]);
    await store.close();
  }
});
