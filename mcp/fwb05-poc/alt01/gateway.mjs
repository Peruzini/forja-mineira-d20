import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { getJwks } from '../reg02/auth.mjs';
import { makeEditorial } from '../reg02/editorial.mjs';
import { makeStrictEgressPolicy } from '../reg04d-r1/pinned-egress.mjs';
import { makeAltPinnedEgress } from './egress.mjs';
import { READ_SCOPE, readAltAuth0Config, verifyAltAuth0Access } from './auth0.mjs';

const response = (status, error, headers = {}) => Response.json({error}, {
  status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers}
});
const publicSite = 'https://forjamineirad20.com.br';
const publicPostsPath = '/wp-json/wp/v2/posts';

function publicPostsUrl(limit) {
  const url = new URL(publicPostsPath, publicSite);
  url.search = new URLSearchParams({context: 'view', status: 'publish',
    per_page: String(limit), _fields: 'id,link,status'}).toString();
  return url.href;
}

async function listPublicPosts(limit, fetcher) {
  const result = await fetcher(publicPostsUrl(limit), {
    method: 'GET', headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(5000)
  });
  if (!result.ok) throw Error('public_posts_unavailable');
  const posts = await result.json();
  if (!Array.isArray(posts) || posts.length > limit) throw Error('public_posts_invalid');
  return {site: publicSite, posts: posts.map(post => {
    if (post?.status !== 'publish' || !Number.isSafeInteger(post.id) || post.id < 1 ||
        typeof post.link !== 'string') throw Error('public_posts_invalid');
    const link = new URL(post.link);
    if (link.origin !== publicSite || link.username || link.password) throw Error('public_posts_invalid');
    return {id: post.id, link: link.href};
  })};
}

function challenge(config, status, code) {
  const extra = code ? ', error="' + code + '"' : '';
  return response(status, code || 'authentication_required', {
    'WWW-Authenticate': 'Bearer resource_metadata="' + config.metadataUrl +
      '", scope="' + READ_SCOPE + '"' + extra
  });
}

function policyFor(config) {
  const wordPress = makeStrictEgressPolicy({
    wpHosts: config.tenants.map(t => new URL(t.wpBase).hostname),
    issuer: config.issuer
  });
  return {assertUrl(raw) {
    if (raw === config.jwks) return;
    const url = new URL(raw);
    if (config.publicPosts && url.origin === publicSite) {
      const limit = Number(url.searchParams.get('per_page'));
      if (Number.isInteger(limit) && limit >= 1 && limit <= 20 && raw === publicPostsUrl(limit)) return;
      throw Error('auth0_alternative_egress_denied');
    }
    if (url.origin === new URL(config.issuer).origin ||
        !/^\/wp-json\/wp\/v2\/posts(?:\/[1-9]\d*)?$/.test(url.pathname)) {
      throw Error('auth0_alternative_egress_denied');
    }
    wordPress.assertUrl(raw);
  }};
}

function cachedKeys(config, fetcher) {
  let cached = null;
  let refresh = null;
  return async () => {
    if (cached && cached.until > Date.now()) return cached.keys;
    refresh ??= getJwks(config, fetcher).then(keys => {
      cached = {keys, until: Date.now() + 60_000};
      return keys;
    }).finally(() => { refresh = null; });
    return refresh;
  };
}

function makeServer(config, identity, fetcher) {
  const server = new McpServer({name: 'forja-wp-bridge-auth0-staging', version: '0.1.0'});
  const securitySchemes = [{type: 'oauth2', scopes: [READ_SCOPE]}];
  function register(name, description, schema, operation, openWorldHint) {
    server.registerTool(name, {
      title: description, description, inputSchema: schema,
      annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint},
      _meta: {securitySchemes}
    }, async input => {
      try {
        const result = await operation(input);
        return {structuredContent: result, content: [{type: 'text', text: JSON.stringify(result)}]};
      } catch {
        return {isError: true, content: [{type: 'text', text: 'editorial_operation_failed'}]};
      }
    });
  }
  register('forja_auth0_status', 'Verificar autentica��o OAuth no gateway de homologa��o.',
    z.object({}).strict(), () => ({authenticated: true, provider: 'auth0', scope: READ_SCOPE}), false);
  if (config.publicPosts) {
    register('forja_wp_list_posts', 'Listar IDs e links de posts p�blicos da Forja Mineira D20.',
      z.object({limit: z.number().int().min(1).max(20).default(5)}).strict(),
      ({limit}) => listPublicPosts(limit, fetcher), true);
  }
  const binding = config.tenants.find(tenant => tenant.sub === identity.sub);
  if (binding) {
    const editorial = makeEditorial({identity, config: binding, fetcher});
    register('forja_posts_list', 'Listar posts pr�prios no WordPress de homologa��o.',
      z.object({limit: z.number().int().min(1).max(20).default(5)}).strict(),
      ({limit}) => editorial.listPosts(limit), true);
    register('forja_post_get', 'Consultar um post pr�prio no WordPress de homologa��o.',
      z.object({id: z.number().int().positive()}).strict(), ({id}) => editorial.getPost(id), true);
  }
  return server;
}

export function createAltAuth0Gateway({
  env = process.env, fetcher, resolver, now = Date.now
} = {}) {
  const config = readAltAuth0Config(env);
  const outbound = makeAltPinnedEgress({policy: policyFor(config), fetcher, resolver});
  const keySource = cachedKeys(config, outbound.fetcher);
  async function handle(request) {
    const authorization = request.headers.get('authorization');
    if (!authorization) return challenge(config, 401);
    let identity;
    try {
      identity = await verifyAltAuth0Access(authorization, config, {keySource, now: now()});
    } catch (error) {
      if (error?.code === 'identity_provider_unavailable') return response(503, 'identity_provider_unavailable');
      if (error?.code === 'insufficient_scope') return challenge(config, 403, 'insufficient_scope');
      return challenge(config, 401, 'invalid_token');
    }
    try {
      return await createMcpHandler(() => makeServer(config, identity, outbound.fetcher)).fetch(request);
    } catch {
      return response(502, 'gateway_dispatch_failed');
    }
  }
  return {handle, close: outbound.close};
}
