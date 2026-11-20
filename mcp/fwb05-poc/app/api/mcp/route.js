import { makeHandler } from '../../../server.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Streamable HTTP MCP transport. No authentication here because this PoC
// offers only a ping and public WordPress REST index (zero writes/private data).
const mcp = makeHandler();
const serve = (request) => mcp.fetch(request);

export const GET = serve;
export const POST = serve;
export const DELETE = serve;
