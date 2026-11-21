import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEditorial } from '../reg02/editorial.mjs';

const base='https://wp-stage.example.org';
const cfg={
  wpBase:base,wpUser:'editor-demo',wpPassword:'dummy-secret-for-tests',
  enableWrites:false
};
const principal={sub:'owner',scopes:new Set(['posts:read','drafts:write'])};
const body=(data,status=200)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(data)});
test('list and get posts: fixed staging URL, Basic credential only server-side, no redirects',async()=>{
  const calls=[];
  const fetcher=async(url,options)=>{
    calls.push({url,options});
    assert.ok(url.startsWith(base+'/wp-json/'));
    assert.equal(options.method,'GET');
    assert.equal(options.redirect,'error');
    assert.equal(options.headers.Authorization,
      'Basic '+Buffer.from(cfg.wpUser+':'+cfg.wpPassword).toString('base64'));
    if(url.includes('/posts?')) return body([{id:10,slug:'draft',status:'draft',
      title:{raw:'Preview'},excerpt:{raw:'Resumo'},link:'https://wp-stage.example.org/?p=10'}]);
    return body({id:10,status:'draft',slug:'draft',title:{raw:'Preview'},
      content:{raw:'Gutenberg original'},modified_gmt:'2026-11-20 20:00:00'});
  };
  const api=makeEditorial({identity:principal,config:cfg,fetcher});
  const posts=await api.listPosts(3);
  const post=await api.getPost(10);
  assert.equal(posts.count,1);
  assert.equal(posts.posts[0].title,'Preview');
  assert.equal(post.post.content,'Gutenberg original');
  assert.equal(calls.length,2);
  assert.ok(!JSON.stringify(posts).includes(cfg.wpPassword));
});
test('readonly scope rejects write before network call',async()=>{
  const fetcher=async()=>{throw Error('network must not be used');};
  const onlyRead={sub:'read',scopes:new Set(['posts:read'])};
  const api=makeEditorial({identity:onlyRead,config:{...cfg,enableWrites:true},fetcher});
  await assert.rejects(()=>api.createDraft({title:'x'},'stableOperationId_123'),/insufficient_scope/);
});
test('staging write disabled by default: no WP write request',async()=>{
  const api=makeEditorial({identity:principal,config:cfg,
    fetcher:async()=>{throw Error('network must not be used');}});
  await assert.rejects(()=>api.createDraft({title:'x'},'stableOperationId_123'),/staging_writes_disabled/);
});
test('validation is dry-run and uses only plugin draft validation route',async()=>{
  const api=makeEditorial({identity:principal,config:cfg,fetcher:async(url,options)=>{
    assert.equal(url,base+'/wp-json/forja-bridge/v1/drafts/validate');
    assert.equal(options.method,'POST');
    const parsed=JSON.parse(options.body);
    assert.equal(parsed.title,'Teste');
    assert.equal(parsed.dry_run,true);
    return body({valid:true,dry_run:true,would_change:['title']});
  }});
  const result=await api.validateDraft({title:'Teste'});
  assert.equal(result.dry_run,true);
});
test('create draft: idempotency key on exactly one POST and verified GET',async()=>{
  const calls=[];
  const api=makeEditorial({identity:principal,config:{...cfg,enableWrites:true},
    fetcher:async(url,options)=>{
      calls.push({url,method:options.method,headers:options.headers});
      if(options.method==='POST'){
        assert.equal(url,base+'/wp-json/forja-bridge/v1/drafts');
        assert.equal(options.headers['X-FWB-Idempotency-Key'],'operationId_123456');
        const d=JSON.parse(options.body);
        assert.equal(d.dry_run,false);
        assert.equal(d.title,'Rascunho');
        assert.equal(d.status,undefined);
        return body({id:42,status:'draft',replayed:false},201);
      }
      assert.equal(url,base+'/wp-json/forja-bridge/v1/drafts/42');
      return body({id:42,status:'draft',title:'Rascunho'});
    }});
  const result=await api.createDraft({title:'Rascunho'},'operationId_123456');
  assert.deepEqual(result,{site:'staging',id:42,status:'draft',verified:true,replayed:false});
  assert.equal(calls.filter(c=>c.method==='POST').length,1);
  assert.equal(calls.filter(c=>c.method==='GET').length,1);
});
test('failed post-write verification reports uncertainty and NEVER retries',async()=>{
  let requests=0;
  const api=makeEditorial({identity:principal,config:{...cfg,enableWrites:true},
    fetcher:async(url,options)=>{
      requests++;
      if(options.method==='POST')return body({id:9,status:'draft'},201);
      return body({code:'service_unavailable'},503);
    }});
  await assert.rejects(()=>api.createDraft({title:'Texto'},'operationId_123456'),/uncertain_write_verify_manually/);
  assert.equal(requests,2);
});
test('update requires explicit optimistic version and idempotency',async()=>{
  const requests=[];
  const api=makeEditorial({identity:principal,config:{...cfg,enableWrites:true},
    fetcher:async(url,options)=>{
      requests.push(options);
      if(options.method==='POST'){
        assert.equal(url,base+'/wp-json/forja-bridge/v1/drafts/9');
        const data=JSON.parse(options.body);
        assert.equal(data.expected_modified_gmt,'2026-11-20 22:00:00');
        assert.equal(data.dry_run,false);
        return body({id:9,status:'draft'});
      }
      return body({id:9,status:'draft'});
    }});
  await assert.rejects(()=>api.updateDraft(9,{title:'X'},'bad','operationId_123456'));
  assert.equal(requests.length,0);
  const r=await api.updateDraft(9,{title:'X'},'2026-11-20 22:00:00','operationId_123456');
  assert.equal(r.verified,true);
  assert.equal(requests.length,2);
});
test('untrusted WordPress response/error never leaks service secret',async()=>{
  const api=makeEditorial({identity:principal,config:cfg,fetcher:async()=>body({
    error:'database-password '+cfg.wpPassword
  },403)});
  await assert.rejects(()=>api.listPosts(1),e=>{
    assert.equal(e.message,'wordpress_rejected_403');
    assert.ok(!String(e).includes(cfg.wpPassword));
    return true;
  });
});
