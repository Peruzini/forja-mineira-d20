// Forja WP Bridge — reference adapter for a ChatGPT Sites hosted MCP server.
// This module is NOT itself a published Site or an MCP registration.
// Credentials are used exclusively server-side and never returned in outputs.
const WP_BASE = 'https://forjamineirad20.com.br';
const WP_INDEX = WP_BASE + '/wp-json/';
const WP_ME = WP_BASE + '/wp-json/wp/v2/users/me?context=view';

function site() { return 'forjamineirad20.com.br'; }
function fetchOptions(authorization) {
  const headers = { Accept: 'application/json' };
  if (authorization) headers.Authorization = authorization;
  return { method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(8000) };
}

export function createForjaSiteTools({ fetcher = globalThis.fetch, env = process.env } = {}) {
  return {
    async forja_ping() {
      return { ok: true, operation: 'ping', project: 'Forja WP Bridge', read_only: true };
    },
    async forja_wp_public_status() {
      try {
        const response = await fetcher(WP_INDEX, fetchOptions());
        if (!response.ok) throw new Error('HTTP_ERROR');
        const data = await response.json();
        if (!Array.isArray(data?.namespaces)) throw new Error('INVALID_REST_INDEX');
        return {
          site: site(),
          rest_available: true,
          wordpress_api: data.namespaces.includes('wp/v2')
        };
      } catch {
        return { site: site(), rest_available: false, wordpress_api: false, error: 'PUBLIC_REST_UNAVAILABLE' };
      }
    },
    async forja_wp_auth_probe() {
      const username = env.FWB_WP_USERNAME;
      const password = env.FWB_WP_APP_PASSWORD;
      if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password.trim()) {
        return { site: site(), configured: false, authenticated: false, error: 'SERVER_SECRET_NOT_CONFIGURED' };
      }
      try {
        // Never log, return or persist the Authorization header or credentials.
        const basic = Buffer.from(username + ':' + password, 'utf8').toString('base64');
        const response = await fetcher(WP_ME, fetchOptions('Basic ' + basic));
        if (!response.ok) throw new Error('AUTH_FAILED');
        const data = await response.json();
        if (!Number.isInteger(data?.id) || data.id <= 0) throw new Error('INVALID_AUTH_RESPONSE');
        return { site: site(), configured: true, authenticated: true, operation: 'read_authenticated_identity' };
      } catch {
        return { site: site(), configured: true, authenticated: false, error: 'WORDPRESS_AUTH_NOT_VERIFIED' };
      }
    }
  };
}
