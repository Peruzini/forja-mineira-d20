import test from 'node:test';
import assert from 'node:assert/strict';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { makeHandler } from '../server.mjs';

async function withClient(handler, run) {
  const transport = new StreamableHTTPClientTransport(new URL('http://mcp-poc.local/mcp'), {
    fetch: (url, init) => handler.fetch(new Request(url, init))
  });
  const client = new Client({ name: 'fwb05-test', version: '0.0.1' }, { versionNegotiation: { mode: 'auto' } });
  try {
    await client.connect(transport);
    await run(client);
  } finally {
    await client.close();
    await handler.close();
  }
}

test('MCP client discovers both Forja tools and invokes ping without WordPress network', async () => {
  const handler = makeHandler({
    fetcher: () => { throw new Error('ping must not call the network'); }
  });
  await withClient(handler, async client => {
    const tools = await client.listTools();
    const names = tools.tools.map(x => x.name);
    assert.ok(names.includes('forja_ping'));
    assert.ok(names.includes('forja_wp_public_status'));
    const response = await client.callTool({ name: 'forja_ping', arguments: {} });
    assert.deepEqual(response.structuredContent, { ok: true, operation: 'ping', project: 'Forja WP Bridge' });
  });
});

test('WordPress status uses exactly one public GET without credentials or redirects', async () => {
  let calls = 0;
  const handler = makeHandler({
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, 'https://forjamineirad20.com.br/wp-json/');
      assert.equal(options.method, 'GET');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.Accept, 'application/json');
      assert.equal(options.headers.Authorization, undefined);
      return { ok: true, json: async () => ({ namespaces: ['wp/v2', 'oembed/1.0'] }) };
    }
  });
  await withClient(handler, async client => {
    const response = await client.callTool({ name: 'forja_wp_public_status', arguments: {} });
    assert.deepEqual(response.structuredContent, {
      site: 'forjamineirad20.com.br', rest_available: true, wordpress_api: true
    });
    assert.equal(calls, 1);
  });
});

test('Remote error fails visibly without leaking payload or retrying', async () => {
  let calls = 0;
  const handler = makeHandler({
    fetcher: async () => { calls++; throw Error('sensitive-upstream-text'); }
  });
  await withClient(handler, async client => {
    const response = await client.callTool({ name: 'forja_wp_public_status', arguments: {} });
    assert.equal(response.isError, true);
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(response).includes('sensitive-upstream-text'));
  });
});
