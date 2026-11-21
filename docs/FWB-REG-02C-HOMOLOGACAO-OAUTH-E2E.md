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

## Resultado final verificado — 54/54 PASS (homologação local)

**Veredito técnico do REG-02C: PASS EM WORDPRESS DESCARTÁVEL.** O workflow foi executado realmente em WordPress + MariaDB isolados, com OAuth e MCP por HTTP, não apenas chamadas simuladas de funções PHP.

**Evidência principal:** [GitHub Actions run 44844849668](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44844849668) — conclusão **success**; testes executados sobre o código do commit `12321a4450c52230263846794ea68af0e40ed488`; log final `REG02C_END_TO_END_LOCAL_HTTP_PASS 54`. O teardown do WordPress descartável também passou.

### Verificações efetivamente demonstradas

- RFC 9728 / RFC 8414: documentos `.well-known` respondem JSON HTTP 200, `resource`, `authorization_servers`, PKCE S256, CIMD.
- Endpoint MCP sem autenticação rejeitou com **HTTP 401** e desafio `WWW-Authenticate`.
- Conta fictícia WordPress `e2eauthor` autenticou por HTTP; visualizou consentimento, validou nonce, recebeu autorização e `state` correspondente.
- Token `Bearer` realmente emitido e assinado com HS256 pela biblioteca OAuth WordPress; `authorization_code` não pode ser reutilizado e `code_verifier` PKCE S256 incorreto foi rejeitado.
- Com esse **mesmo token OAuth**, cliente MCP HTTP fez `initialize`, `tools/list`, `tools/call` e descobriu as três Abilities: `forja-bridge/list-posts`, `forja-bridge/get-post`, `forja-bridge/validate-draft`.
- As **Abilities foram executadas** por `mcp-adapter-execute-ability`: listagem de rascunho próprio `E2EOwnDraft`, consulta de post próprio e validação de rascunho com `dry_run=true`, sem persistência.
- Tentativa de ler post de terceiro foi rejeitada.
- `POST /oauth/revoke` revogou sessão; token revogado passou a receber **401** nas chamadas MCP.
- Foi comprovado desligamento do WordPress temporário na etapa `Tear down ephemeral WordPress`.

### Falhas anteriores e correções aplicadas (histórico auditável)

1. Run [44842954020](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44842954020): erro de invocação de WP-CLI via `wp-env` por passagem de comando inteiro como executável; corrigido para argumentos individuais.
2. Runs [44843236183](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44843236183) e [44843522693](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44843522693): `redirect_canonical` do WordPress gerava 301 para `.well-known`; desabilitado **somente nas rotas OAuth e somente em staging**, sem afetar páginas normais.
3. Run [44843851474](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44843851474): redirecionamento análogo em `/oauth/authorize`; incluídos caminhos OAuth exatos no filtro staging.
4. Run [44844176915](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44844176915): primeiro PASS do OAuth até MCP, 35 checks.
5. Run [44844493602](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44844493602): Abilities editoriais reais passaram; o parser do teste negativo assumia JSON estruturado em resposta de erro MCP; ajustado para detectar rejeição como `isError` ou erro de permissão e acrescentado teste de revogação.
6. Run 44844849668: **54 checks PASS, sem exceções.**

### Distinção entre homologado e pendente

**Homologado neste bloco:**
- Servidor OAuth + WordPress MCP em instalação efêmera local; end-to-end HTTP com login, consentimento, PKCE, token, execução de ferramentas e revogação.
- Permissões negativas demonstradas com usuário e conteúdo reais de staging.
- Nenhuma edição do WordPress público nem habilitação de escrita administrativa.

**NÃO homologado:**
- Login iniciado por **ChatGPT normal**; cliente da CI usa uma **fixture de CIMD do ChatGPT** e controla o fluxo via Python, não representa o aplicativo ChatGPT.
- TLS/HTTPS público, domínio e DNS de homologação, challenge de verificação da OpenAI.
- Integração da aplicação pública num endpoint MCP fixo, onboarding de usuários/sites, isolamento multi-tenant, cadastro/aprovação na plataforma OpenAI.
- Conexão segura com site de produção, operações efetivas de criação/edição/publicação e política de privacidade do serviço público.
- O endpoint protegido Vercel REG-02 usa RS256; este piloto WordPress usa HS256 com audience WordPress. **Não misturar tokens nem presumir interoperabilidade.**

**GO:** encerrar REG-02C como **homologação de laboratório concluída** e planejar endpoint HTTPS estável e integração autorizada com ChatGPT.

**NO-GO:** merge automático, instalação em produção, chamada real ChatGPT declarada, publicação no diretório ou liberar escrita.

**Estado do PR:** [#29 draft](https://github.com/Peruzini/forja-mineira-d20/pull/29), empilhado sobre PR #27; não mergeado.
