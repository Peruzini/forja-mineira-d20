import { gatewayMetadata, readGatewayConfig } from '../../../../../reg03/gateway.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  try {
    return Response.json(gatewayMetadata(readGatewayConfig(process.env)),
      {headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  } catch {
    return Response.json({error:'gateway_not_configured'},
      {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
