import test from 'node:test';
import assert from 'node:assert/strict';
import { createForjaSiteTools } from '../site-tools.mjs';

test('ping runs without a network request or secrets', async () => {
  const tools = createForjaSiteTools({ fetcher: () => { throw new Error('must not fetch'); }, env: {} });
  assert.deepEqual(await tools.forja_ping(), {
    ok: true, operation: 'ping', project: 'Forja WP Bridge', read_only: true
  });
});

test('public WordPress status GET uses only fixed public URL and no auth', async () => {
  let count = 0;
  const tools = createForjaSiteTools({
    env: {},
    fetcher: async (url, options) => {
      count++;
      assert.equal(url, 'https://forjamineirad20.com.br/wp-json/');
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, undefined);
      return { ok: true, json: async () => ({ namespaces: ['wp/v2'] }) };
    }
  });
  const response = await tools.forja_wp_public_status();
  assert.equal(response.rest_available, true);
  assert.equal(response.wordpress_api, true);
  assert.equal(count, 1);
});

test('missing server secrets stops before any network request', async () => {
  const tools = createForjaSiteTools({
    env: { FWB_WP_USERNAME: 'reader' },
    fetcher: () => { throw new Error('should not call network without credentials'); }
  });
  const result = await tools.forja_wp_auth_probe();
  assert.equal(result.configured, false);
  assert.equal(result.authenticated, false);
  assert.equal(result.error, 'SERVER_SECRET_NOT_CONFIGURED');
});

test('authenticated read uses only users/me, hides user details and credential', async () => {
  const credential = 'secret-example-not-real';
  const tools = createForjaSiteTools({
    env: { FWB_WP_USERNAME: 'fwb-read', FWB_WP_APP_PASSWORD: credential },
    fetcher: async (url, options) => {
      assert.equal(url, 'https://forjamineirad20.com.br/wp-json/wp/v2/users/me?context=view');
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Authorization, 'Basic ' + Buffer.from('fwb-read:' + credential).toString('base64'));
      return { ok: true, json: async () => ({ id: 2, name: 'not-in-output', email: 'secret@example.com' }) };
    }
  });
  const response = await tools.forja_wp_auth_probe();
  assert.equal(response.authenticated, true);
  assert.equal(response.configured, true);
  assert.ok(!JSON.stringify(response).includes(credential));
  assert.ok(!JSON.stringify(response).includes('secret@example.com'));
  assert.ok(!JSON.stringify(response).includes('not-in-output'));
  assert.equal(response.id, undefined);
});

test('remote errors are sanitized and do not retry', async () => {
  let calls = 0;
  const tools = createForjaSiteTools({
    env: { FWB_WP_USERNAME: 'fwb-read', FWB_WP_APP_PASSWORD: 'secret-example-not-real' },
    fetcher: async () => { calls++; throw new Error('SENSITIVE_UPSTREAM_RESPONSE'); }
  });
  const result = await tools.forja_wp_auth_probe();
  assert.equal(result.authenticated, false);
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(result).includes('SENSITIVE_UPSTREAM_RESPONSE'));
});
