# FWB-REG-02C — Homologação OAuth de ponta a ponta em WordPress descartável

**Objetivo:** GitHub Actions executa WordPress verdadeiro + MariaDB via wp-env, instala MCP Adapter oficial, inicia provider OAuth WordPress v2.0 com patch CIMD do REG-02B e exerce o protocolo HTTP. Nenhuma alteração no WordPress público, Vercel ou credenciais reais.

**Diferença crucial:** o script age como um **cliente OAuth MCP de teste**, não como a aplicação ChatGPT. Os campos do CIMD oficial foram consultados em `https://chatgpt.com/oauth/client.json` e são reproduzidos em uma fixture local controlada para evitar instabilidade de rede. Testa a compatibilidade com o formato do ChatGPT, **não uma conexão live com o app**.

## Matriz planejada de aceitação

1. `/.well-known/oauth-protected-resource`: `resource` correto para `/wp-json/mcp/mcp-oauth-server`.
2. `/.well-known/oauth-authorization-server`: authorization code, PKCE S256, CIMD e revogação.
3. Anônimo: endpoint MCP rejeita com 401 e `WWW-Authenticate`.
4. Usuário fictício faz login HTTP WordPress, segue o callback, confirma a autorização e recebe `code` vinculado ao `state`.
5. `POST /oauth/token` com PKCE S256 correto emite bearer token assinado.
6. Reutilização do `code` retorna `invalid_grant`.
7. Outro `code` com verificador PKCE incorreto retorna `invalid_grant`.
8. MCP `initialize`, `tools/list`, `tools/call` autenticados por bearer token, usando conta WordPress real de staging.
9. Verificar descoberta das abilities `forja-bridge/list-posts`, `forja-bridge/get-post`, `forja-bridge/validate-draft` e negativas de autorização, conforme funcionamento das meta-tools do WordPress.
10. Tear-down automático do WordPress efêmero após CI.

**Não considerar PASS antes do job concluir**; um teste falho significa bloqueio técnico, que requer ajuste de código ou de ambiente. Em nenhuma hipótese substituir falha de protocolo por resultado simulado.

## Dependências e restrições

- WordPress oficial `latest`, MCP Adapter oficial do diretório WordPress.org, wp-env oficial, PHP 8.3, Composer do runner.
- A biblioteca `wp-media/mcp-oauth v2.0` é GPL; o patch CIMD ocorre apenas no vendor temporário antes do boot.
- Todos os logins, senhas e tokens são efêmeros e fictícios; a CI deve evitar imprimir tokens.
- WordPress em `http://localhost:8888` é **somente homologação local**; não serve como prova de conformidade HTTPS público, DNS, domínio verificado, multi-tenant ou aprovação do plugin ChatGPT.
- Os PRs FWB-REG-01 #23, REG-02 #26 e REG-02B #27 são draft e não devem sofrer merge automático.
