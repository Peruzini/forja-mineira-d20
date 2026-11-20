import { challengeResponse } from '../../../domain-challenge.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// FWB-REG-01: no token => 404. Exact challenge token is issued by OpenAI
// only during the connection flow; it is NEVER committed to Git.
export function GET() {
  return challengeResponse(process.env.FWB_OPENAI_DOMAIN_CHALLENGE);
}
