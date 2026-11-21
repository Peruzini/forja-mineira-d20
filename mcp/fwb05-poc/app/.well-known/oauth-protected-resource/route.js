import { readConfig, metadata } from '../../../reg02/auth.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function GET() {
  try {
    const result = metadata(readConfig(process.env));
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'secure_mcp_not_configured'},{
      status:503,headers:{'Cache-Control':'no-store'}
    });
  }
}
