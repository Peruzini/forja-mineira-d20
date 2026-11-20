export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 740, margin: '6rem auto', padding: '0 1.5rem' }}>
      <h1>Forja WP Bridge — FWB-05C</h1>
      <p>Prova de hospedagem MCP (somente leitura). Não é um painel administrativo do WordPress.</p>
      <p>Endpoint MCP: <code>/api/mcp</code></p>
      <p>As ferramentas disponíveis consultam apenas informações públicas, sem credenciais ou escrita.</p>
    </main>
  );
}
