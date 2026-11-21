import test from 'node:test';
import assert from 'node:assert/strict';
import { checkOAuthDiscovery, ContractRejected } from './discovery-contract.mjs';

const issuer='https://fwb-alt01-dev.us.auth0.com/';
const resource='https://fwb-alt01.example.org/api/gateway-mcp';
const basic=()=>({
  resource,issuer,
  protectedResource:{
    resource,authorization_servers:[issuer],
    scopes_supported:['posts:read','sites:connect']
  },
  authorizationServer:{
    issuer,
    authorization_endpoint:issuer+'authorize',
    token_endpoint:issuer+'oauth/token',
    registration_endpoint:issuer+'oidc/register',
    client_id_metadata_document_supported:true,
    authorization_response_iss_parameter_supported:true,
    code_challenge_methods_supported:['S256'],
    token_endpoint_auth_methods_supported:['none','private_key_jwt'],
    response_types_supported:['code'],
    grant_types_supported:['authorization_code']
  }
});

test('CIMD metadata shape passes but real ChatGPT/tenant proof remains FALSE',()=>{
  const result=checkOAuthDiscovery(basic());
  assert.equal(result.status,'METADATA_SHAPE_PASS_LIVE_AUTH_REQUIRED');
  assert.equal(result.liveClientRegistration,false);
  assert.equal(result.liveAuthCodePkce,false);
  assert.equal(result.jwtClaimsValidated,false);
  assert.equal(result.wordpressIsolationTested,false);
});

test('DCR metadata shape requires valid registration endpoint and PKCE S256',()=>{
  const m=basic();
  assert.equal(checkOAuthDiscovery({...m,mode:'dcr'}).mode,'dcr');
  delete m.authorizationServer.registration_endpoint;
  assert.throws(()=>checkOAuthDiscovery({...m,mode:'dcr'}),ContractRejected);
});

const rejectedCases=[
 ['wrong protected resource',m=>m.protectedResource.resource='https://evil.example/mcp'],
 ['wrong issuer',m=>m.authorizationServer.issuer='https://untrusted.example/'],
 ['HTTP auth endpoint',m=>m.authorizationServer.authorization_endpoint='http://untrusted.example/'],
 ['cross-origin token',m=>m.authorizationServer.token_endpoint='https://evil.example/token'],
 ['no S256',m=>m.authorizationServer.code_challenge_methods_supported=['plain']],
 ['CIMD not advertised',m=>m.authorizationServer.client_id_metadata_document_supported=false],
 ['CIMD incompatible token method',m=>m.authorizationServer.token_endpoint_auth_methods_supported=['client_secret_basic']],
 ['no published token methods',m=>delete m.authorizationServer.token_endpoint_auth_methods_supported],
 ['no code response',m=>m.authorizationServer.response_types_supported=['token']],
 ['no auth code grant',m=>m.authorizationServer.grant_types_supported=['client_credentials']],
 ['incorrect authorization server list',m=>m.protectedResource.authorization_servers=['https://other.example/']]
];
for (const [name,mutate] of rejectedCases) {
  test('reject '+name,()=>{
    const m=basic(); mutate(m);
    assert.throws(()=>checkOAuthDiscovery(m),ContractRejected);
  });
}

test('stable callback requires issuer identification metadata',()=>{
  const m=basic();
  m.authorizationServer.authorization_response_iss_parameter_supported=false;
  assert.throws(()=>checkOAuthDiscovery({...m,stableCallback:true}),ContractRejected);
  assert.equal(checkOAuthDiscovery({...m,stableCallback:false}).mode,'cimd');
});

test('discovery fixture is synthetic, never touches real Auth0 or WordPress',()=>{
  const r=checkOAuthDiscovery(basic());
  assert.equal(r.issuer,'https://fwb-alt01-dev.us.auth0.com/');
  assert.ok(r.status.includes('LIVE_AUTH_REQUIRED'));
});
