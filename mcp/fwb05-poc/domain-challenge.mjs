/**
 * OpenAI plugin domain verification challenge, intentionally disabled by default.
 * The portal issues the exact token; do not manufacture, trim, log or persist it.
 * A challenge token is public by design, but never return any other env values.
 */
export function challengeResponse(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048
      || /[\u0000-\u001f\u007f]/.test(token)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  return new Response(token, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
