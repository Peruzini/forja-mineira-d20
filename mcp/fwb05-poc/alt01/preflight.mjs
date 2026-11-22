import { fileURLToPath } from 'node:url';
import { checkOAuthDiscovery } from '../../../infra/fwb-alt-01/discovery-contract.mjs';
import { makeAltPinnedEgress } from './egress.mjs';
import { READ_SCOPE, readAltAuth0Config } from './auth0.mjs';

function reject(code) { throw Error(code); }

async function readJson(response) {
  if (!response.ok) reject('auth0_preflight_http_' + response.status);
  const data = await response.text();
  if (data.length > 65536) reject('auth0_preflight_response_too_large');
  try { return JSON.parse(data); } catch { reject('auth0_preflight_invalid_json'); }
}

export async function checkAltAuth0Readiness(config, {fetcher, stableCallback = false} = {}) {
  const oauth = new URL('/.well-known/oauth-authorization-server', config.issuer).href;
  const oidc = new URL('/.well-known/openid-configuration', config.issuer).href;
  const allowed = new Set([config.metadataUrl, oauth, oidc]);
  const outbound = fetcher ? null : makeAltPinnedEgress({policy: {assertUrl(url) {
    if (!allowed.has(url)) reject('auth0_preflight_route_not_allowed');
  }}});
  const fetch = fetcher || outbound.fetcher;
  const get = url => fetch(url, {method: 'GET', redirect: 'error',
    headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(6000)});
  try {
    const protectedResource = await readJson(await get(config.metadataUrl));
    const first = await get(oauth);
    const source = first.status === 404 ? oidc : oauth;
    const authorizationServer = await readJson(first.status === 404 ? await get(oidc) : first);
    if (protectedResource?.authorization_servers?.length !== 1 ||
        !protectedResource?.scopes_supported?.includes(READ_SCOPE) ||
        authorizationServer?.jwks_uri !== config.jwks) reject('auth0_preflight_provider_mismatch');
    const result = checkOAuthDiscovery({
      resource: config.resource, issuer: config.issuer, protectedResource, authorizationServer,
      mode: config.registration, stableCallback
    });
    return {...result, discoverySource: source, stableCallbackAdvertised:
      authorizationServer.authorization_response_iss_parameter_supported === true};
  } finally { await outbound?.close(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--stable-callback')) {
    process.stderr.write('Uso: node alt01/preflight.mjs [--stable-callback]\n');
    process.exitCode = 1;
  } else {
    try {
      const result = await checkAltAuth0Readiness(readAltAuth0Config(), {
        stableCallback: args.includes('--stable-callback')
      });
      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (error) {
      const code = error.code || error.message;
      const safe = typeof code === 'string' && /^[a-z0-9_]{3,100}$/.test(code);
      process.stderr.write((safe ? code : 'auth0_preflight_failed') + '\n');
      process.exitCode = 1;
    }
  }
}
