import test from 'node:test';
import assert from 'node:assert/strict';
import { makeKeycloakBindingAdmin,makeFederatedOnboarding,readKeycloakAdminConfig } from '../reg04c/federated-onboarding.mjs';

const user='a12833fe-aabc-4eda-84cd-a78900ed0a33';
const issuer='https://login.example.org/realms/fwb-lab';
const cfg={issuer,endpoint:'https://login.example.org/admin/realms/fwb-lab',
  adminBearer:'f'.repeat(64)};
const site='site_lab',connection='A1'.repeat(12);
const identity={sub:user,siteId:site,connectionId:connection,scopes:new Set(['posts:read','sites:connect'])};

function model(initial={}){
  let attributes={...initial};
  const calls=[];
  const fetcher=async(url,opts)=>{
    calls.push({url,opts});
    assert.equal(url,cfg.endpoint+'/users/'+user);
    assert.equal(opts.headers.Authorization,'Bearer '+cfg.adminBearer);
    assert.equal(opts.redirect,'error');
    if(opts.method==='GET')return {ok:true,text:async()=>JSON.stringify({id:user,attributes})};
    if(opts.method==='PUT'){attributes=JSON.parse(opts.body).attributes;return {ok:true};}
    throw Error('unexpected');
  };
  return {client:makeKeycloakBindingAdmin({config:cfg,fetcher}),calls,
    attributes:()=>attributes};
}
test('admin service is disabled and cannot use an arbitrary issuer or missing bearer',()=>{
  assert.throws(()=>readKeycloakAdminConfig({}),/federation_disabled/);
  const base={FWB_REG04C_FEDERATION:'enabled',FWB_REG04_ISSUER:issuer,
    FWB_REG04C_ADMIN_BEARER:'f'.repeat(64)};
  assert.equal(readKeycloakAdminConfig(base).endpoint,cfg.endpoint);
  assert.throws(()=>readKeycloakAdminConfig({...base,FWB_REG04C_ADMIN_BEARER:''}),/admin_service_not_configured/);
  assert.throws(()=>readKeycloakAdminConfig({...base,FWB_REG04_ISSUER:'http://127.0.0.1/realms/lab'}));
  assert.throws(()=>readKeycloakAdminConfig({...base,FWB_REG04_ISSUER:'https://attacker.example.org/realms/bad?other=1'}));
});
test('only signed caller subject chooses the Keycloak account; attaches and checks attributes',async()=>{
  const m=model({email_verified:['true']});
  const r=await m.client.attach(user,site,connection);
  assert.equal(r.status,'federated');
  assert.deepEqual(m.attributes().fwb_site_id,[site]);
  assert.deepEqual(m.attributes().fwb_connection_id,[connection]);
  assert.deepEqual(m.attributes().email_verified,['true']);
  assert.equal(m.calls.length,4);
  await assert.rejects(()=>m.client.attach(user,'bad site',connection),/binding_invalid/);
  await assert.rejects(()=>m.client.attach('other',site,connection),/keycloak_subject_invalid/);
  await assert.rejects(()=>m.client.attach(user,site,connection),/user_already_has_binding/);
  await assert.rejects(()=>m.client.detach(user,'site_other',connection),/binding_mismatch/);
  const revoked=await m.client.detach(user,site,connection);
  assert.equal(revoked.status,'federation_revoked');
  assert.equal(Object.hasOwn(m.attributes(),'fwb_site_id'),false);
  assert.equal(Object.hasOwn(m.attributes(),'fwb_connection_id'),false);
});
test('failed federated attach rolls back persisted site even when Keycloak is unavailable',async()=>{
  let stored=false,deleted=false;
  const fed=makeFederatedOnboarding({
    service:{connect:async()=>{stored=true;return {site_id:site,connection_id:connection};},
      disconnect:async()=>{deleted=true;stored=false;return {status:'disconnected'};},
      resolve:async()=>({})},
    keycloak:{attach:async()=>{throw Error('down');},detach:async()=>{}}
  });
  await assert.rejects(()=>fed.connect(identity,{}),/federation_failed_rolled_back/);
  assert.equal(deleted,true);assert.equal(stored,false);
});
test('failure to remove site binding after unconfirmed IdP update is explicitly flagged',async()=>{
  const fed=makeFederatedOnboarding({
    service:{connect:async()=>({site_id:site,connection_id:connection}),
      disconnect:async()=>{throw Error('db down');},
      resolve:async()=>({})},
    keycloak:{attach:async()=>{throw Error('IdP down');},detach:async()=>{}}
  });
  await assert.rejects(()=>fed.connect(identity,{}),/federation_rollback_failed_manual_review/);
});
test('disconnect erases persisted binding before trying to detach Keycloak user',async()=>{
  let deleted=false,called=false;
  const fed=makeFederatedOnboarding({
    service:{connect:async()=>({site_id:site,connection_id:connection}),
      disconnect:async()=>{deleted=true;return {site_id:site,status:'disconnected'};},
      resolve:async()=>({})},
    keycloak:{attach:async()=>{},detach:async(sub,x,y)=>{
      called=true;assert.equal(sub,user);assert.equal(x,site);assert.equal(y,connection);
      assert.equal(deleted,true);
    }}
  });
  assert.equal((await fed.disconnect(identity,site)).status,'disconnected');
  assert.equal(called,true);
});
test('admin bearer and upstream body never included in public errors',async()=>{
  const client=makeKeycloakBindingAdmin({config:cfg,
    fetcher:async()=>({ok:false,status:403,text:async()=>'secret '+cfg.adminBearer})});
  await assert.rejects(()=>client.attach(user,site,connection),e=>{
    assert.equal(e.message,'keycloak_admin_rejected');
    assert.equal(String(e).includes(cfg.adminBearer),false);
    return true;
  });
});
