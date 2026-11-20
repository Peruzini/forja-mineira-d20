import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const url = process.env.FWB_MCP_REMOTE_URL;
if (!url || !/^https:\/\/[a-z0-9.-]+\.vercel\.app\/api\/mcp$/.test(url)) {
  throw new Error('Configure FWB_MCP_REMOTE_URL com HTTPS /api/mcp da Vercel.');
}
const client = new Client({ name: 'fwb05c-remote-check', version: '0.0.1' }, { versionNegotiation: { mode: 'auto' } });
const transport = new StreamableHTTPClientTransport(new URL(url));
try {
  await client.connect(transport);
  const list = await client.listTools();
  const names = new Set(list.tools.map(t => t.name));
  if (!names.has('forja_ping') || !names.has('forja_wp_public_status')) throw new Error('Tool list incompleta');
  const ping = await client.callTool({ name: 'forja_ping', arguments: {} });
  if (ping.structuredContent?.ok !== true || ping.structuredContent?.operation !== 'ping') throw new Error('Ping MCP não confirmado');
  const status = await client.callTool({ name: 'forja_wp_public_status', arguments: {} });
  if (status.isError || status.structuredContent?.rest_available !== true || status.structuredContent?.wordpress_api !== true) {
    throw new Error('GET REST público do WordPress não confirmado');
  }
  console.log('FWB-05C: MCP REMOTO PASS; 2 ferramentas descobertas; ping e status WordPress público confirmados; zero escrita.');
} finally {
  await client.close();
}
