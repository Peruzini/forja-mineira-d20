import { gatewayMetadata, readGatewayConfig } from '../../../../../reg03/gateway.mjs';
import { centralMetadata } from '../../../../../reg04/central-gateway.mjs';
import { readCentralConfig } from '../../../../../reg04/onboarding.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  try {
    const selected = process.env.FWB_REG04_STAGING === 'enabled'
      ? centralMetadata(readCentralConfig(process.env))
      : gatewayMetadata(readGatewayConfig(process.env));
    return Response.json(selected,
      {headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  } catch {
    return Response.json({error:'gateway_not_configured'},
      {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
