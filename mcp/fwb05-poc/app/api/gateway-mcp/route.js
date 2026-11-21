import { handleGatewayMcp } from '../../../reg03/gateway.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Disabled without REG03 staging gate and a complete server-side tenant registry.
export const GET = request => handleGatewayMcp(request);
export const POST = request => handleGatewayMcp(request);
export const DELETE = request => handleGatewayMcp(request);
