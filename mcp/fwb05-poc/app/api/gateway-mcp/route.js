import { handleGatewayMcp } from '../../../reg03/gateway.mjs';
import { handleCentralMcp } from '../../../reg04/central-gateway.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Disabled without REG03 staging gate and a complete server-side tenant registry.
// Fail closed when REG-04 central mode is requested without a durable store.
// No ephemeral in-memory fallback is ever mounted in production routes.
const handle = request => process.env.FWB_REG04_STAGING === 'enabled'
  ? handleCentralMcp(request)
  : handleGatewayMcp(request);
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
