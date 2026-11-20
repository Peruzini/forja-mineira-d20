import test from 'node:test';
import assert from 'node:assert/strict';
import { challengeResponse } from '../domain-challenge.mjs';

test('domain challenge is closed without OpenAI-issued token', async () => {
  for (const value of [undefined,'','\n','token\nwith-line-break',' token\r']) {
    const response=challengeResponse(value);
    assert.equal(response.status,404);
    assert.equal(await response.text(),'Not Found');
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
});
test('exact token returned as plain text without modification and without caching', async () => {
  const token='OpenAI-VERIFY_example.test+token';
  const response=challengeResponse(token);
  assert.equal(response.status,200);
  assert.equal(await response.text(),token);
  assert.match(response.headers.get('content-type'),/^text\/plain/);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
});
test('reject oversized or control-bearing tokens', async () => {
  assert.equal(challengeResponse('x'.repeat(2049)).status,404);
  assert.equal(challengeResponse('x\u0000y').status,404);
});
