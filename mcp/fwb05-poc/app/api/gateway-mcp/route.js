import { handleGatewayMcp } from '../../../reg03/gateway.mjs';
import { handleCentralMcp } from '../../../reg04/central-gateway.mjs';
import { getRuntimePostgresStore } from '../../../reg04b/postgres-store.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Disabled without REG03 staging gate and a complete server-side tenant registry.
// Fail closed when REG-04 central mode is requested without a durable store.
// No ephemeral in-memory fallback is ever mounted in production routes.
const handle = request => {
  if(process.env.FWB_REG04_STAGING !== 'enabled') return handleGatewayMcp(request);
  if(process.env.FWB_REG04B_PG_STORAGE !== 'enabled') return handleCentralMcp(request);
  try {
    const store=getRuntimePostgresStore(process.env);
    return handleCentralMcp(request,{store});
  } catch {
    return Response.json({error:'central_gateway_not_configured'},
      {status:503,headers:{'Cache-Control':'no-store'}});
  }
};
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
