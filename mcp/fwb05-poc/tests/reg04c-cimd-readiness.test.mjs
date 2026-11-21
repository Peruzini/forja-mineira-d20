import test from 'node:test';
import assert from 'node:assert/strict';
import {validateChatGptCimd,verifyChatGptCimdDocument,assertKeycloakCimdPolicy,
  CHATGPT_CIMD} from '../reg04c/cimd-readiness.mjs';

const metadata={
  client_id:CHATGPT_CIMD,client_uri:'https://chatgpt.com/',
  redirect_uris:['https://chatgpt.com/connector_platform_oauth_redirect'],
  token_endpoint_auth_method:'private_key_jwt',
  token_endpoint_auth_methods_supported:['none','private_key_jwt'],
  token_endpoint_auth_signing_alg:'RS256',
  jwks_uri:'https://chatgpt.com/oauth/jwks.json',
  grant_types:['authorization_code','refresh_token','urn:ietf:params:oauth:grant-type:jwt-bearer'],
  response_types:['code'],logo_uri:'https://persistent.oaistatic.com/sonic/misc/openai-logo.png'
};
test('real ChatGPT CIMD profile requires private_key_jwt, signature and exact callback',async()=>{
  const r=await verifyChatGptCimdDocument(async(url,init)=>{
    assert.equal(url,CHATGPT_CIMD);assert.equal(init.redirect,'error');
    return {ok:true,text:async()=>JSON.stringify(metadata)};
  });
  assert.equal(r.auth,'private_key_jwt');
  assert.equal(r.signingAlg,'RS256');
  for(const [field,value] of [
    ['token_endpoint_auth_method','none'],
    ['jwks_uri','https://attacker.example.org/keys'],
    ['token_endpoint_auth_signing_alg','HS256'],
    ['redirect_uris',['https://attacker.example.org/callback']],
    ['client_id','https://evil.example.org/client.json'],
    ['logo_uri','https://attacker.example.org/evil.png'],
    ['grant_types',['password']]
  ])assert.throws(()=>validateChatGptCimd({...metadata,[field]:value}));
  await assert.rejects(()=>verifyChatGptCimdDocument(async()=>({ok:false})));
});
const resource='https://mcp.example.org/api/gateway-mcp';
const profile={
  name:'fwb-chatgpt-cimd',
  executors:[{executor:'client-id-metadata-document',configuration:{
    'allow-http-scheme':false,
    'trusted-domains':['chatgpt.com','persistent.oaistatic.com'],
    'restrict-same-domain':false,
    'only-allow-confidential-client':false,
    'accept-public-client-with-confidential-only-grant-types':true,
    'resource-indicator-allow-list':[resource]
  }}]
};
const policy={
  name:'fwb-chatgpt-cimd-only',profiles:['fwb-chatgpt-cimd'],
  conditions:[{condition:'client-id-uri',configuration:{
    'uri-scheme':['https'],'trusted-domains':['chatgpt.com']
  }}]
};
test('CIMD needs strict Keycloak client-policy, not merely a feature flag',()=>{
  assert.equal(assertKeycloakCimdPolicy(profile,policy,resource),true);
  const bads=[
    [{...profile,executors:[{...profile.executors[0],configuration:{
      ...profile.executors[0].configuration,'allow-http-scheme':true}}]},policy],
    [profile,{...policy,conditions:[{condition:'client-id-uri',configuration:{
      'uri-scheme':['https'],'trusted-domains':['*.example.org']}}]}],
    [profile,{...policy,profiles:[]}],
    [{...profile,executors:[{...profile.executors[0],configuration:{
      ...profile.executors[0].configuration,'resource-indicator-allow-list':['https://evil.example.org/']}}]},policy]
  ];
  bads.forEach(([p,c])=>assert.throws(()=>assertKeycloakCimdPolicy(p,c,resource)));
});
