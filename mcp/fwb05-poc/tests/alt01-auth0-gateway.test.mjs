import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { altAuth0Metadata, readAltAuth0Config, verifyAltAuth0Access } from '../alt01/auth0.mjs';
import { createAltAuth0Gateway } from '../alt01/gateway.mjs';
import { makeAltPinnedEgress } from '../alt01/egress.mjs';
import { checkAltAuth0Readiness } from '../alt01/preflight.mjs';
import { DRAFT_ROUTE } from '../alt01/drafts.mjs';

const issuer = 'https://forja-lab.us.auth0.com/';
const resource = 'https://mcp-lab.example.org/api/gateway-mcp';
const chatgpt = 'https://chatgpt.com/oauth/client.json';
const subjects = ['auth0|author-a', 'auth0|author-b'];
const env = {
  FWB_ALT_AUTH0_STAGING: 'enabled',
  FWB_ALT_AUTH0_ISSUER: issuer,
  FWB_ALT_AUTH0_RESOURCE: resource,
  FWB_ALT_AUTH0_REGISTRATION: 'cimd',
  FWB_ALT_AUTH0_SUBJECTS_JSON: JSON.stringify(subjects),
  FWB_ALT_AUTH0_CLIENT_IDS_JSON: JSON.stringify([chatgpt])
};
const config = readAltAuth0Config(env);
const now = 1_789_000_000_000;
const time = now / 1000;
const {privateKey, publicKey} = generateKeyPairSync('rsa', {modulusLength: 2048});
const other = generateKeyPairSync('rsa', {modulusLength: 2048}).privateKey;
const jwk = {...publicKey.export({format: 'jwk'}), kid: 'synthetic-key-1', alg: 'RS256', use: 'sig'};
const b64 = data => Buffer.from(JSON.stringify(data)).toString('base64url');
function token(extra = {}, header = {}, key = privateKey) {
  const payload = b64({iss: issuer, aud: resource, sub: subjects[0], client_id: chatgpt,
    jti: 'synthetic-jti', iat: time - 1, exp: time + 300, scope: 'posts:read', ...extra});
  const head = b64({alg: 'RS256', typ: 'at+jwt', kid: jwk.kid, ...header});
  const raw = head + '.' + payload;
  return 'Bearer ' + raw + '.' + sign('RSA-SHA256', Buffer.from(raw), key).toString('base64url');
}
const site = (id, index) => ({
  site_id: id, subject: subjects[index], wordpress_host: 'wp-' + index + '.example.org',
  wordpress_url: 'https://wp-' + index + '.example.org/', wordpress_user: 'fake-author-' + index,
  wordpress_app_password: 'synthetic-' + index + '-credential', wordpress_user_id: 101 + index
});
const configuredSites = (...rows) => ({...env, FWB_ALT_AUTH0_TENANTS_JSON: JSON.stringify(rows)});

test('Auth0 is an exclusive, opt-in staging profile', () => {
  for (const changed of [
    {FWB_ALT_AUTH0_STAGING: ''}, {FWB_REG03_STAGING: 'enabled'}, {FWB_REG04_STAGING: 'enabled'},
    {FWB_ALT_AUTH0_ISSUER: issuer.slice(0, -1)},
    {FWB_ALT_AUTH0_ISSUER: 'https://example.org/'},
    {FWB_ALT_AUTH0_ISSUER: 'https://forja-lab.us.auth0.com.example.org/'},
    {FWB_ALT_AUTH0_RESOURCE: 'https://forjamineirad20.com.br/api/gateway-mcp'},
    {FWB_ALT_AUTH0_RESOURCE: 'https://mcp-lab.example.org/api/gateway-mcp?x=1'},
    {FWB_ALT_AUTH0_REGISTRATION: 'automatic'}, {FWB_ALT_AUTH0_CLIENT_IDS_JSON: '[]'},
    {FWB_ALT_AUTH0_SUBJECTS_JSON: '["app@clients"]'}
  ]) assert.throws(() => readAltAuth0Config({...env, ...changed}));
  assert.throws(() => readAltAuth0Config(configuredSites(site('site_a', 0), site('site_b', 0))));
  assert.throws(() => readAltAuth0Config(configuredSites({...site('site_a', 0), subject: 'auth0|outside'})));
  assert.deepEqual(altAuth0Metadata(config), {
    resource, authorization_servers: [issuer], scopes_supported: ['posts:read'],
    bearer_methods_supported: ['header']
  });
});

test('signed Auth0 RFC 9068 access tokens support string and array audience', async () => {
  for (const aud of [resource, [resource], [issuer + 'userinfo', resource]]) {
    const identity = await verifyAltAuth0Access(token({aud}), config, {keySource: () => [jwk], now});
    assert.equal(identity.sub, subjects[0]);
    assert.deepEqual([...identity.scopes], ['posts:read']);
  }
  const dcr = readAltAuth0Config({...env, FWB_ALT_AUTH0_REGISTRATION: 'dcr',
    FWB_ALT_AUTH0_CLIENT_IDS_JSON: '["LabClient1234"]'});
  await assert.rejects(() => verifyAltAuth0Access(token(), dcr, {keySource: () => [jwk], now}));
  assert.equal((await verifyAltAuth0Access(token({client_id: 'LabClient1234'}), dcr,
    {keySource: () => [jwk], now})).sub, subjects[0]);
});

test('invalid access tokens are rejected before they can authorize any call', async t => {
  const cases = [
    ['opaque token', 'Bearer abc'],
    ['wrong issuer', token({iss: issuer.slice(0, -1)})],
    ['userinfo only', token({aud: issuer + 'userinfo'})],
    ['unexpected extra audience', token({aud: [resource, 'https://other.example.org/api']})],
    ['expired token', token({exp: time - 1})],
    ['too-long lifetime', token({exp: time + 601})],
    ['future issuance', token({iat: time + 40})],
    ['future not-before', token({nbf: time + 60})],
    ['missing jti', token({jti: undefined})],
    ['other OAuth client', token({client_id: 'wrong-client'})],
    ['unlisted user', token({sub: 'auth0|unlisted'})],
    ['machine grant', token({gty: 'client-credentials'})],
    ['ID token type', token({}, {typ: 'JWT'})],
    ['wrong algorithm', token({}, {alg: 'HS256'})],
    ['unrecognized key id', token({}, {kid: 'other-key'})],
    ['unknown header extension', token({}, {ext: true})],
    ['incorrect signature', token({}, {}, other)]
  ];
  for (const [name, credential] of cases) await t.test(name, async () => {
    await assert.rejects(() => verifyAltAuth0Access(credential, config, {keySource: () => [jwk], now}),
      {code: 'invalid_token'});
  });
  await assert.rejects(() => verifyAltAuth0Access(token(), config, {keySource: () => [jwk, jwk], now}),
    {code: 'invalid_token'});
  await assert.rejects(() => verifyAltAuth0Access(token({scope: 'drafts:write'}), config,
    {keySource: () => [jwk], now}), {code: 'insufficient_scope'});
});

test('PRM discovery checks CIMD, DCR, code/PKCE S256 and trusted JWKS', async () => {
  const metadata = {
    issuer, jwks_uri: config.jwks, authorization_endpoint: issuer + 'authorize',
    token_endpoint: issuer + 'oauth/token', registration_endpoint: issuer + 'oidc/register',
    client_id_metadata_document_supported: true, code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'private_key_jwt'],
    response_types_supported: ['code'], grant_types_supported: ['authorization_code'],
    authorization_response_iss_parameter_supported: true
  };
  const fixture = (claims, useOidc = false) => async (url, opt) => {
    assert.equal(opt.redirect, 'error');
    if (url === config.metadataUrl) return Response.json(altAuth0Metadata(config));
    if (useOidc && url.endsWith('oauth-authorization-server')) return new Response(null, {status: 404});
    return Response.json({...metadata, ...claims});
  };
  for (const registration of ['cimd', 'dcr']) {
    const result = await checkAltAuth0Readiness({...config, registration},
      {fetcher: fixture({}, registration === 'dcr'), stableCallback: true});
    assert.equal(result.mode, registration);
    assert.equal(result.liveAuthCodePkce, false);
  }
  for (const claims of [
    {client_id_metadata_document_supported: false},
    {code_challenge_methods_supported: ['plain']},
    {grant_types_supported: ['client_credentials']},
    {token_endpoint_auth_methods_supported: ['client_secret_basic']},
    {jwks_uri: 'https://unexpected.example.org/jwks.json'},
    {authorization_response_iss_parameter_supported: false}
  ]) await assert.rejects(() => checkAltAuth0Readiness(config,
    {fetcher: fixture(claims), stableCallback: true}));
  await assert.rejects(() => checkAltAuth0Readiness({...config, registration: 'dcr'},
    {fetcher: fixture({registration_endpoint: 'https://unexpected.example.org/reg'})}));
});

async function withMcp(gateway, authorization, fn) {
  const client = new Client({name: 'synthetic-auth0-lab', version: '0.1.0'},
    {versionNegotiation: {mode: 'auto'}});
  const transport = new StreamableHTTPClientTransport(new URL(resource), {
    fetch: (url, options) => {
      const request = new Request(url, options);
      request.headers.set('Authorization', authorization);
      return gateway.handle(request);
    }
  });
  try {
    await client.connect(transport);
    await fn(client);
  } finally { await client.close(); }
}

test('401 discovery, 403 scope and real MCP probe with mock Auth0 JWKS and zero WordPress calls', async () => {
  let fetched = 0;
  const gateway = createAltAuth0Gateway({
    env, now: () => now, fetcher: async (url, options) => {
      assert.equal(url, config.jwks);
      assert.equal(options.redirect, 'error');
      fetched++;
      return Response.json({keys: [jwk]});
    }
  });
  try {
    for (const request of [new Request(resource), new Request(resource + '?access_token=abc')]) {
      const challenge = await gateway.handle(request);
      assert.equal(challenge.status, 401);
      assert.match(challenge.headers.get('www-authenticate'), /resource_metadata=.*oauth-protected-resource/);
      assert.equal(fetched, 0);
    }
    const denied = await gateway.handle(new Request(resource, {
      headers: {Authorization: token({scope: 'drafts:write'})}
    }));
    assert.equal(denied.status, 403);
    assert.match(denied.headers.get('www-authenticate'), /insufficient_scope/);
    await withMcp(gateway, token(), async client => {
      const catalog = await client.listTools();
      assert.deepEqual(catalog.tools.map(t => t.name), ['forja_auth0_status']);
      assert.deepEqual(catalog.tools[0]._meta.securitySchemes, [{type: 'oauth2', scopes: ['posts:read']}]);
      const result = await client.callTool({name: 'forja_auth0_status', arguments: {}});
      assert.deepEqual(result.structuredContent, {authenticated: true, provider: 'auth0', scope: 'posts:read'});
    });
    assert.equal(fetched, 1, 'parallel MCP requests reuse bounded JWKS cache');
  } finally { await gateway.close(); }
});

test('only signed sub chooses WordPress, no writes or cross-author exposure', async () => {
  const tenants = [site('site_a', 0), site('site_b', 1)];
  const calls = [];
  const gateway = createAltAuth0Gateway({
    env: configuredSites(...tenants), now: () => now, fetcher: async (raw, opt) => {
      if (raw === config.jwks) return Response.json({keys: [jwk]});
      const url = new URL(raw);
      calls.push(url.hostname);
      assert.equal(opt.method, 'GET');
      assert.equal(opt.redirect, 'error');
      const own = tenants.find(t => t.wordpress_host === url.hostname);
      const credentials = Buffer.from(own.wordpress_user + ':' + own.wordpress_app_password).toString('base64');
      assert.equal(opt.headers.Authorization, 'Basic ' + credentials);
      if (url.pathname.endsWith('/99')) return Response.json({id: 99, author: 999});
      assert.equal(url.searchParams.get('author'), String(own.wordpress_user_id));
      return Response.json([{id: 1, author: own.wordpress_user_id, status: 'draft'}]);
    }
  });
  try {
    for (let i = 0; i < tenants.length; i++) await withMcp(gateway, token({
      sub: subjects[i], site_id: tenants[1 - i].site_id, scope: 'posts:read drafts:write'
    }), async client => {
      const catalog = await client.listTools();
      assert.deepEqual(catalog.tools.map(t => t.name), ['forja_auth0_status', 'forja_posts_list', 'forja_post_get']);
      const list = await client.callTool({name: 'forja_posts_list', arguments: {limit: 1}});
      assert.equal(list.structuredContent.site, tenants[i].site_id);
      const cross = await client.callTool({name: 'forja_post_get', arguments: {id: 99}});
      assert.equal(cross.isError, true);
      assert.equal(cross.structuredContent, undefined);
    });
    assert.deepEqual(calls, ['wp-0.example.org', 'wp-0.example.org', 'wp-1.example.org', 'wp-1.example.org']);
  } finally { await gateway.close(); }
});

test('production public posts use only fixed unauthenticated GET and reject non-public results', async () => {
  const site = 'https://forjamineirad20.com.br';
  const post = {id: 418, link: site + '/post/', status: 'publish'};
  let status = 'publish';
  const gateway = createAltAuth0Gateway({
    env: {...env, FWB_ALT_AUTH0_PUBLIC_POSTS: 'enabled'}, now: () => now,
    fetcher: async (url, options) => {
      if (url === config.jwks) return Response.json({keys: [jwk]});
      assert.equal(url, site + '/wp-json/wp/v2/posts?context=view&status=publish&per_page=1&_fields=id%2Clink%2Cstatus');
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'error');
      assert.deepEqual(options.headers, {Accept: 'application/json'});
      return Response.json([{...post, status}]);
    }
  });
  try {
    await withMcp(gateway, token(), async client => {
      const catalog = await client.listTools();
      assert.deepEqual(catalog.tools.map(t => t.name), ['forja_auth0_status', 'forja_wp_list_posts']);
      const call = () => client.callTool({name: 'forja_wp_list_posts', arguments: {limit: 1}});
      assert.deepEqual((await call()).structuredContent, {site, posts: [{id: post.id, link: post.link}]});
      status = 'draft';
      assert.equal((await call()).isError, true);
    });
  } finally { await gateway.close(); }
});

test('preview-only with one allowed subject uses read scope and makes no WordPress call', async () => {
  const previewEnv = {...env, FWB_ALT02_DRAFT_PREVIEW: 'enabled'};
  assert.equal(readAltAuth0Config(previewEnv).draftPreviewSubject, null);
  previewEnv.FWB_ALT_AUTH0_SUBJECTS_JSON = JSON.stringify([subjects[0]]);
  assert.deepEqual(altAuth0Metadata(readAltAuth0Config(previewEnv)).scopes_supported, ['posts:read']);
  const gateway = createAltAuth0Gateway({env: previewEnv, now: () => now, fetcher: async url => {
    assert.equal(url, config.jwks);
    return Response.json({keys: [jwk]});
  }});
  try {
    await withMcp(gateway, token(), async client => {
      assert.deepEqual((await client.listTools()).tools.map(tool => tool.name),
        ['forja_auth0_status', 'forja_wp_preview_draft']);
      const input = {title: 'Pr�via', content: 'Texto de teste'};
      const result = await client.callTool({name: 'forja_wp_preview_draft', arguments: input});
      assert.deepEqual(result.structuredContent, {...input, status: 'draft',
        approvalDigest: createHash('sha256').update(JSON.stringify(input)).digest('hex')});
    });
  } finally { await gateway.close(); }
});

test('draft creation is opt-in and requires the configured subject and write scope', async () => {
  const signingKey = privateKey.export({format: 'pem', type: 'pkcs8'});
  const input = {title: 'Rascunho da Forja', content: 'Primeira linha.\nSegunda linha.'};
  const draftEnv = {...env, FWB_ALT02_DRAFTS: 'enabled', FWB_ALT02_SUBJECT: subjects[0],
    FWB_ALT02_SIGNING_KEY: signingKey, FWB_ALT02_APPROVED_DIGEST: createHash('sha256').update(JSON.stringify(input)).digest('hex')};
  assert.throws(() => readAltAuth0Config({...draftEnv, FWB_ALT02_SUBJECT: 'auth0|unlisted'}));
  assert.deepEqual(altAuth0Metadata(readAltAuth0Config(draftEnv)).scopes_supported, ['posts:read', 'drafts:write']);
  const call = (client, args = input) => client.callTool({name: 'forja_wp_create_draft', arguments: args});
  let writes = 0;
  const gateway = createAltAuth0Gateway({env: draftEnv, now: () => now, fetcher: async (url, options) => {
    if (url === config.jwks) return Response.json({keys: [jwk]});
    assert.equal(url, DRAFT_ROUTE);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.body, JSON.stringify(input));
    assert.equal(verify('RSA-SHA256', Buffer.from('forja-draft-rsa-v1\n' + options.body), publicKey,
      Buffer.from(options.headers['X-Forja-Draft-Signature'], 'base64')), true);
    writes++;
    return Response.json({id: 418, status: 'draft'}, {status: 201});
  }});
  try {
    await withMcp(gateway, token(), async client => {
      const preview = await client.callTool({name: 'forja_wp_preview_draft', arguments: input});
      assert.deepEqual(preview.structuredContent, {...input, status: 'draft',
        approvalDigest: createHash('sha256').update(JSON.stringify(input)).digest('hex')});
      assert.equal((await call(client)).isError, true);
    });
    await withMcp(gateway, token({sub: subjects[1], scope: 'posts:read drafts:write'}), async client => {
      assert.deepEqual((await client.listTools()).tools.map(tool => tool.name), ['forja_auth0_status']);
    });
    assert.equal(writes, 0);
    await withMcp(gateway, token({scope: 'posts:read drafts:write'}), async client => {
      const create = (await client.listTools()).tools.find(tool => tool.name === 'forja_wp_create_draft');
      assert.equal(create.annotations.readOnlyHint, false);
      assert.deepEqual(create._meta.securitySchemes[0].scopes, ['posts:read', 'drafts:write']);
      assert.equal((await call(client, {...input, status: 'publish'})).isError, true);
      assert.equal((await call(client, {...input, content: 'Texto alterado'})).isError, true);
      assert.deepEqual((await call(client)).structuredContent, {id: 418, status: 'draft',
        editUrl: 'https://forjamineirad20.com.br/wp-admin/post.php?post=418&action=edit'});
    });
    assert.equal(writes, 1);
  } finally { await gateway.close(); }
});

test('upstream failure response is sanitized and does not disclose credentials', async () => {
  const gateway = createAltAuth0Gateway({
    env, now: () => now, fetcher: async () => { throw Error('synthetic-internal-secret'); }
  });
  try {
    const result = await gateway.handle(new Request(resource, {headers: {Authorization: token()}}));
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), {error: 'identity_provider_unavailable'});
  } finally { await gateway.close(); }
});

test('Auth0 egress rejects nonpublic DNS and redirects before delivering a request', async () => {
  let lookups = 0;
  const client = makeAltPinnedEgress({
    policy: {assertUrl(url) { assert.equal(url, config.jwks); }},
    resolver: async host => {
      assert.equal(host, new URL(issuer).hostname);
      lookups++;
      return [{address: '127.0.0.1', family: 4}];
    }
  });
  try {
    await assert.rejects(() => client.fetcher(config.jwks, {redirect: 'follow'}),
      /auth0_egress_redirect_denied/);
    assert.equal(lookups, 0);
    await assert.rejects(() => client.fetcher(config.jwks, {signal: AbortSignal.timeout(4000)}),
      error => error.cause?.message === 'auth0_egress_nonpublic_dns_rejected');
    assert.equal(lookups, 1);
  } finally { await client.close(); }
});
