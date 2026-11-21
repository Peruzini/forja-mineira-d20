# FWB-REG-02 — Servidor OAuth protegido e MVP editorial (staging)

**Data:** 20/11/2026 · **Branch:** feature/fwb-reg-02-oauth-editorial-20261120  
**PR base:** feature/fwb-reg-01-publicacao-oficial-20261120  
**Estado:** \`OAUTH_RESOURCE_SERVER_IMPLEMENTED / STAGING_EDITORIAL_IMPLEMENTED / END_TO_END_LOGIN_NOT_CONNECTED\`

## Objetivo e alcance

Criar a **camada segura do servidor MCP** para operar WordPress em um ambiente isolado, preservando o requisito Chat normal sem Work/Worker e custo adicional R$ 0. Esta etapa **não entrega ainda login OAuth funcional para o usuário**: falta um **Authorization Server/IdP** que ofereça OAuth 2.1 Authorization Code + PKCE S256, CIMD ou DCR, metadados, revogação e armazenamento durável.

Não instalar plugin ou Application Password em WordPress produção, não realizar deploy Vercel, não permitir um cliente anônimo editar posts, não fazer publicação pública. A PoC FWB-05 em \`/api/mcp\` permanece **inalterada** e anônima com apenas 2 funções públicas de leitura.

## Entregas técnicas reais neste branch

| Entrega | Código | Status |
| --- | --- | --- |
| MCP protegido separado da PoC | \`mcp/fwb05-poc/app/api/secure-mcp/route.js\` | Implementado no branch; NÃO implantado |
| Metadados RFC 9728 | \`app/.well-known/oauth-protected-resource/route.js\` | Implementado; retorna 503 sem configuração |
| JWT access token RS256 | \`reg02/auth.mjs\` | Verifica assinatura RS256, JWK pinada à origem do emissor, \`iss\`, \`aud\`, \`sub\`, TTL, \`exp\`, \`iat\`, \`nbf\`, scopes; rejeita JWT fraco/sem assinatura |
| Segregação de usuário/site | \`readConfig\` | **Somente um sub e um host staging** fixos; não é multi-tenant |
| Listar posts e ler post por ID | \`reg02/editorial.mjs\` | Usa REST nativa WordPress em staging, precisa credenciais e papel adequados |
| Validar rascunho | \`forja_draft_validate\` | Usa \`forja-bridge/v1/drafts/validate\` com \`dry_run=true\` |
| Criar/editar rascunho | \`forja_draft_create\`, \`forja_draft_update\` | Usa plugin FWB-03 com idempotência, autorização \`drafts:write\`, \`FWB_REG02_DRAFT_WRITES=enabled\`, \`FWB_ENABLE_DRAFT_WRITES=true\` em staging e leitura posterior de confirmação |
| Relatórios seguros de falha | \`reg02/editorial.mjs\` | Não reflete corpo de erro WP nem senhas; falha pós-escrita é **indeterminada**, não faz retry automático |
| Manifesto OAuth candidato | \`reg02/candidate-mcp.json\` | **NÃO publicar**: endpoint ainda não implantado/AS não selecionado |

## Exigências obrigatórias para habilitar em staging

Todas as variáveis abaixo são **secrets e/ou configuração do servidor**, não conteúdo para copiar no ChatGPT nem GitHub. Nunca usar credenciais WordPress reais em testes.

| Variável | Exemplo ilustrativo (não configurar exatamente) |
| --- | --- |
| \`FWB_REG02_STAGING\` | \`enabled\` |
| \`FWB_OAUTH_ISSUER\` | \`https://auth.exemplo.com\` |
| \`FWB_OAUTH_JWKS_URL\` | \`https://auth.exemplo.com/.well-known/jwks.json\` |
| \`FWB_MCP_RESOURCE\` | \`https://mcp.exemplo.com/api/secure-mcp\` |
| \`FWB_OAUTH_ALLOWED_SUB\` | ID real da conta de serviço autorizada pelo IdP |
| \`FWB_WP_STAGING_URL\` | \`https://staging.exemplo.com/\` |
| \`FWB_WP_STAGING_HOST\` | \`staging.exemplo.com\` |
| \`FWB_WP_SERVICE_USER\` | Usuário WordPress exclusivo de staging |
| \`FWB_WP_SERVICE_APP_PASSWORD\` | Secret da Application Password WordPress |
| \`FWB_REG02_DRAFT_WRITES\` | OMITIR até homologação; \`enabled\` apenas após autorização |

\`FWB_WP_STAGING_URL\` **rejeita** o domínio de produção \`forjamineirad20.com.br\` e \`www\`. O host WordPress não vem de argumentos do modelo nem de qualquer URL enviada pelo usuário. A função só chama rotas permitidas em host pré-configurado, sem redirecionamentos.

A porta do MCP protegido é **\`/api/secure-mcp\`**. A porta antiga \`/api/mcp\` permanece pública e **jamais deve ganhar escrita ou credenciais**.

## Autenticação — o que funciona e o que ainda falta

### Implementado no resource server

1. \`GET /.well-known/oauth-protected-resource\` retorna \`resource\`, \`authorization_servers\` e scopes **somente** se a instância estiver configurada; sem configuração, responde HTTP 503.
2. Uma requisição MCP sem bearer token retorna 401 com \`WWW-Authenticate: Bearer resource_metadata=...\`.
3. JWT precisa assinatura RS256 válida por chave do JWKS fixado a \`FWB_OAUTH_ISSUER\`, tipo \`at+jwt\`, \`aud\` igual a \`FWB_MCP_RESOURCE\`, \`sub\` autorizado, \`posts:read\`, TTL máximo de 10 min; \`drafts:write\` adicional para escrita.
4. A aplicação de staging fica desligada se variável/secret estiver ausente ou inconsistente.
5. As ferramentas não aceitam URL WordPress arbitrária nem enviam o token OAuth ao WordPress; usam credencial WordPress independente e configurada exclusivamente no servidor.

### NÃO implementado — requisito para OAuth completo e publicação

- Servidor de autorização com \`/.well-known/oauth-authorization-server\` e Authorization Code + PKCE S256; consentimento e login.
- Registro/identificação de cliente CIMD/DCR ou cliente previamente aprovado; token endpoint; refresh e revogação; sessão/conta real, persistência confiável.
- Compatibilidade \`typ: at+jwt\` de access token RS256 com provedor escolhido, token curto e política de revogação.
- Identidade + associação segura de sites para **outros usuários**. O modo de um único \`sub\` serve apenas como teste controlado, não plugin público multi-tenant.
- Teste contra servidor de OAuth real, DNS personalizado, staging WordPress instalado e submissão.

## Testes esperados

Rodar em PR via \`.github/workflows/fwb-reg02-staging.yml\`:

- \`npm test\`: testes reais do MCP (cliente/servidor), JWT RS256 e bibliotecas editoriais com WordPress simulado em memória.
- \`npm run build\`: compilação da rota Next.js existente + novas rotas protegidas.
- Sem requisições WordPress reais, OAuth real, Vercel deploy, secrets GitHub e alterações de produção.

**GO apenas para** PR técnico e experimentos sem credenciais em staging. **NO-GO** para WordPress produção, publicação, OAuth de usuários finais e qualquer módulo multi-tenant.

## Ordem recomendada depois deste bloco

1. Selecionar um Authorization Server OAuth 2.1 que possa ser hospedado sem custo adicional e com persistência transacional (preferência por aproveitar WordPress de teste, se segurança viável); não criar login simulado.
2. Provar login e consentimento, PKCE S256, resource binding, revogação e OAuth CIMD/DCR com ChatGPT no portal de desenvolvimento.
3. Instalar FWB WordPress em **staging**, com conta técnica de escopo restrito e testar conteúdo real de exemplo.
4. Resolver onboarding multi-site, armazenamento criptografado por usuário/tenant, auditoria, deleção, LGPD; só depois cogitar submissão pública.
5. Liberar \`FWB-REG-01\` e \`FWB-REG-02\` após revisão e gates; **não fazer merge automático**.

## Referências oficiais (consultadas em 20/11/2026)

- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission
- https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
