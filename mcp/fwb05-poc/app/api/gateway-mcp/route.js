import { createAltAuth0Gateway } from '../../../alt01/gateway.mjs';
import { handleGatewayMcp } from '../../../reg03/gateway.mjs';
import { handleCentralMcp } from '../../../reg04/central-gateway.mjs';
import { getRuntimePostgresStore } from '../../../reg04b/postgres-store.mjs';
import { readCentralConfig } from '../../../reg04/onboarding.mjs';
import { makeStrictEgressPolicy, makePinnedEgressFetcher } from '../../../reg04d-r1/pinned-egress.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Disabled without REG03 staging gate and a complete server-side tenant registry.
// Fail closed when REG-04 central mode is requested without a durable store.
// No ephemeral in-memory fallback is ever mounted in production routes.
let pinnedOutbound;
function protectedOutbound(env) {
  if(!pinnedOutbound) {
    const config=readCentralConfig(env);
    const policy=makeStrictEgressPolicy({wpHosts:config.hosts,issuer:config.issuer});
    pinnedOutbound=makePinnedEgressFetcher({policy});
  }
  return pinnedOutbound.fetcher;
}
const unavailable=()=>Response.json({error:'central_gateway_not_configured'},
  {status:503,headers:{'Cache-Control':'no-store'}});
let auth0Gateway;
const handle = request => {
  if (process.env.FWB_ALT_AUTH0_STAGING === 'enabled') {
    try {
      auth0Gateway ??= createAltAuth0Gateway();
      return auth0Gateway.handle(request);
    } catch {
      return Response.json({error:'auth0_gateway_not_configured'},
        {status:503,headers:{'Cache-Control':'no-store'}});
    }
  }
  if(process.env.FWB_REG04_STAGING !== 'enabled') return handleGatewayMcp(request);
  if(process.env.FWB_REG04B_PG_STORAGE !== 'enabled') return handleCentralMcp(request);
  // Opt-in R1 environment MUST use a pinned egress connector. An accidental
  // partial deployment fails closed rather than falling back to raw fetch.
  const r1=process.env.FWB_REG04D_R1_SERVICE==='enabled';
  if(r1 && process.env.FWB_REG04D_R1_EGRESS!=='enabled')return unavailable();
  try {
    const store=getRuntimePostgresStore(process.env);
    if(r1) {
      const config=readCentralConfig(process.env);
      if(config.provider!=='keycloak') return unavailable();
      return handleCentralMcp(request,{store,fetcher:protectedOutbound(process.env)});
    }
    return handleCentralMcp(request,{store});
  } catch {
    return unavailable();
  }
};
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
