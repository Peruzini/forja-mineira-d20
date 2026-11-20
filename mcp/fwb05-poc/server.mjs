import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const WP_BASE = 'https://forjamineirad20.com.br';
const WP_INDEX = WP_BASE + '/wp-json/';
export const MCP_NAME = 'forja-wp-bridge-fwb05-poc';

// This is a proof of transport. No application password, no write endpoint,
// no WordPress plugin installation and no authentication are used.
export function makeServer({ fetcher = globalThis.fetch } = {}) {
  const server = new McpServer({ name: MCP_NAME, version: '0.0.1' });

  server.registerTool('forja_ping', {
    title: 'Verificar ponte MCP Forja',
    description: 'Confirma que um cliente MCP consegue descobrir e chamar uma ferramenta própria. Não acessa WordPress.',
    inputSchema: z.object({}),
    outputSchema: z.object({ ok: z.boolean(), operation: z.literal('ping'), project: z.string() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async () => {
    const result = { ok: true, operation: 'ping', project: 'Forja WP Bridge' };
    return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  server.registerTool('forja_wp_public_status', {
    title: 'Verificar WordPress da Forja',
    description: 'Consulta somente o índice REST público e informa se o namespace wp/v2 está disponível. Sem credenciais e sem escrita.',
    inputSchema: z.object({}),
    outputSchema: z.object({ site: z.string(), rest_available: z.boolean(), wordpress_api: z.boolean() }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  }, async () => {
    try {
      const response = await fetcher(WP_INDEX, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('REST indisponível');
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.namespaces)) throw new Error('REST inválida');
      const result = {
        site: 'forjamineirad20.com.br',
        rest_available: true,
        wordpress_api: payload.namespaces.includes('wp/v2')
      };
      return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch {
      return { content: [{ type: 'text', text: 'Falha ao consultar a API pública; nenhuma alteração foi realizada.' }], isError: true };
    }
  });

  return server;
}

export function makeHandler(options = {}) {
  return createMcpHandler(() => makeServer(options));
}

const handler = makeHandler();
export default handler;
