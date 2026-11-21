import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const status=require('./edge-shell/api/status.js');
const denied=require('./edge-shell/api/gateway-mcp.js');

function response(){
  const headers={};
  return {headers,statusCode:undefined,body:undefined,
    setHeader(name,value){headers[name.toLowerCase()]=value;},
    end(body){this.body=body;return this;}
  };
}
test('stage status is a non-sensitive shell marker, no OAuth or MCP promise',()=>{
  const r=response();status({method:'GET',headers:{}},r);
  assert.equal(r.statusCode,200);
  const data=JSON.parse(r.body);
  assert.deepEqual(data,{
    project:'fwb-reg04d-r2a',component:'isolated_https_shell',
    status:'SHELL_ONLY',oauth:'NOT_CONFIGURED',
    mcp:'DISABLED',production_wordpress:'NOT_CONNECTED'
  });
  assert.match(r.headers['cache-control'],/no-store/);
  assert.match(r.headers['x-robots-tag'],/noindex/);
  const other=response();status({method:'POST'},other);
  assert.equal(other.statusCode,405);
});
test('all MCP verbs fail closed with 503 and reveal no resources, auth or secrets',()=>{
  for(const method of ['GET','POST','DELETE','OPTIONS','PUT']){
    const r=response();denied({method,headers:{authorization:'Bearer should_not_echo'}},r);
    assert.equal(r.statusCode,503,method);
    assert.deepEqual(JSON.parse(r.body),{error:'staging_mcp_disabled'});
    assert.equal(r.body.includes('should_not_echo'),false);
    assert.match(r.headers['cache-control'],/no-store/);
    assert.match(r.headers['x-robots-tag'],/noindex/);
  }
});
