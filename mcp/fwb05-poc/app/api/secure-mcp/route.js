import { handleSecureMcp } from '../../../reg02/secure-server.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Separate from anonymous FWB-05 /api/mcp; no production WordPress writes.
export const GET = (request) => handleSecureMcp(request);
export const POST = (request) => handleSecureMcp(request);
export const DELETE = (request) => handleSecureMcp(request);
