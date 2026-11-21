# FWB-ALT-01 — Auditoria de migração Auth0 Free ↔ ChatGPT

**Data:** 21/11/2026 (BRT)  
**Escopo:** comparação de contratos, prova sintética de metadados, decisão de arquitetura e plano de homologação.  
**Estado:** AUDITORIA CONCLUÍDA, **AUTH0 LIVE / CHATGPT E2E NO-GO**.  
**Branch-base:** PR #41 (R2B2). **Os PRs #42–#44, OCI/Keycloak, não foram alterados.**

> Esta entrega NÃO conecta ao Auth0 ou ChatGPT, não cria tenant/API/client, não muda DNS, deploy, merge ou plano financeiro. Não afirma que a arquitetura com D1 já seja segura ou implementada.

## Resumo executivo

**Decisão: GO condicional somente para uma prova de conceito do Auth0; NO-GO para substituir Keycloak, migrar clientes ou publicar.**

Auth0 declarou suporte a Auth for MCP (GA em maio/2026), CIMD e parâmetro OAuth \`resource\` via **Resource Parameter Compatibility Profile**. ChatGPT requer PRM RFC 9728, metadados OAuth, Authorization Code + PKCE S256, e registro CIMD, DCR ou pré-registrado. As capacidades existem **na documentação**, mas não há tenant Auth0 do usuário conectado aqui. Ainda é obrigatório testar as permissões reais do plano Free e a sessão do ChatGPT.

Há relatos contraditórios sobre a integração CIMD com ChatGPT:
- 30/09/2026: preview CIMD do Auth0 passava, registro falhava (400 \`invalid_client_metadata\`).
- 28/10/2026: o autor confirmou que a falha parecia resolvida em novo teste.
- 05/11/2026: outro usuário Free reportou nova falha de criação para um URL CIMD diferente, em contexto de cliente já existente.
Conclusão: **CIMD não pode ser marcado PASS por documentação ou comentários.** DCR funcionou para um usuário do fórum, mas não é prova do nosso tenant. Ver [discussão pública](https://community.auth0.com/t/auth0-cimd-registration-appears-incompatible-with-the-current-chatgpt-client-id-metadata-document/203817).

## 01A — Inventário verificado no GitHub (PR #41)

| Origem real no repositório | Acoplamento atual | Consequência para Auth0/Workers | Severidade |
| --- | --- | --- | --- |
| \`mcp/fwb05-poc/reg04/onboarding.mjs\` | \`readCentralConfig()\` aceita só \`keycloak\` e \`legacy\`; Keycloak exige emissor \`/realms/<realm>\` e JWKS \`/protocol/openid-connect/certs\` | Implementar um **novo** perfil estrito \`auth0\` com URL OIDC/Auth0 e JWKS derivado de discovery confiável; sem fallback silencioso | P0 |
| \`mcp/fwb05-poc/reg02/auth.mjs\` | \`verifyAccessToken()\`: JWT RSA \`typ='at+jwt'\`, \`aud\` string exata, \`sub\` de allowlist, \`exp-iat <= 600\`, escopo \`posts:read\` | **Não** aceitar Auth0 JWT por simples mudança de \`issuer\`: verificar dialect RFC 9068, \`aud\` array/string, \`sub\` não UUID e lifetime real; política explícita para limites | P0 |
| \`mcp/fwb05-poc/reg04/central-gateway.mjs\` | \`verifyCentralIdentity()\` e \`service.resolve()\` exigem \`site_id\` e \`connection_id\` dentro de *claims* de token | Projetar seleção de site com identidade validada e vínculo proprietário no D1; **não** confiar em site_id fornecido pelo modelo/cliente | P0 |
| \`mcp/fwb05-poc/reg04d-r2b/restricted-attributes.mjs\` | API Admin Keycloak com GET/PUT; somente \`fwb_site_id\`, \`fwb_connection_id\` e perfil preservado | Remover mecanismo do caminho Auth0; fazer vinculação no registro do serviço, não dar à aplicação token de Auth0 Management API | P0 |
| \`mcp/fwb05-poc/reg04d-r1/scoped-service.mjs\` | Client Credentials e FGAP para Keycloak; valida roles \`query-users\` e \`kc-admin-api\` | Não transportar credenciais Admin Keycloak ou atribuir papel amplo de Auth0 ao Worker | P0 |
| \`mcp/fwb05-poc/reg04d-r2b2/isolated-admin.mjs\` | **PG advisory lock por sujeito**, diário persistente \`started/manual_review/confirmed\`, HMAC epoch, bloqueio após crash | D1 não tem advisory locks de sessão; exigir nova máquina de estados auditável e concorrência equivalente, incluindo \`manual_review\` durável | P0 |
| \`mcp/fwb05-poc/reg04b/postgres-store.mjs\` | \`pg\`, \`JSONB\`, \`ON CONFLICT\`, \`rowCount\`, URL TLS do Postgres | Criar novo adaptador de persistência SQLite/D1 **sem** reutilizar SQL PG cegamente | P0 |
| \`mcp/fwb05-poc/reg04/onboarding.mjs\` | \`Buffer\`, \`node:crypto\` AES-256-GCM e AAD ligado a \`(sub,siteId)\`; IDs hash | Portabilidade para WebCrypto no Workers e testes de criptografia/rotação, sem jamais armazenar credenciais WP em claro | P0 |
| \`mcp/fwb05-poc/reg03/gateway.mjs\` | \`@modelcontextprotocol/server\` MCP transport e código Node | Testar no runtime Cloudflare Workers; não presumir que o pacote Node/Next API Route rode sem adaptações | P1 |
| \`mcp/fwb05-poc/app/api/gateway-mcp/route.js\` | Handler Next.js em Vercel, acesso ao Postgres e política pinned egress | Separar entrypoint Worker/Fetch API, sem mexer na route antiga nesta fase | P1 |
| \`mcp/fwb05-poc/reg04d-r1/pinned-egress.mjs\` | Proteção de DNS/IP, SSRF e host pinning para WP | Revalidar proteção compatível com egress Workers; subrequests/redirects/DNS/private IP não podem causar rebinding | P0 |
| \`mcp/fwb05-poc/reg04c/federated-onboarding.mjs\` | Rollback/remoção de vínculo quando atualização administrativa falha | Preservar revogação, compensação e \`fail-closed\` em qualquer novo modelo | P0 |

**Invariante de identidade:** chaves locais devem ser \`(iss,sub,siteId)\`, não só \`sub\` (evita colisões entre diferentes issuers/tenants); sempre derivadas **após** validar JWT. A versão Keycloak foi construída com \`sub\` UUID; Auth0 usa outro formato e não deve herdar essa restrição nem ser aceito sem revisão.

**Invariante de segurança:** um vínculo WordPress pertence exclusivamente a um proprietário validado. Nenhum usuário, conexão, prompt ou ferramenta pode escolher arbitrariamente outro \`siteId\`. Credenciais WP ficam cifradas com AAD vinculada à identidade e site; falhas de verificação ou auditabilidade causam negação.

## 01B — Contrato e configuração proposta para Auth0 Free (NÃO configurados)

Referências: [Auth0 Free](https://auth0.com/pricing); [Auth for MCP GA](https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/); [Auth0 Resource Parameter](https://support.auth0.com/center/s/article/mcp-audience-error-with-auth0).

1. O operador cria uma conta pessoal [Auth0 Free](https://auth0.com/signup), **sem cartão para o cadastro básico**; confirma tenant Free, região e MFA na conta. Domínio personalizado no Free pode exigir verificação por cartão: **não utilizá-lo nesta POC**.
2. Criar API de laboratório com identificador canônico HTTPS do MCP staging, sem usar domínio WordPress de produção e sem alterar a URL de produção. Confirmar assinatura RS256 e dialect de token compatível com o verificador proposto.
3. Ativar \`Resource Parameter Compatibility Profile\` e user-delegated access da API onde necessários. Validar fluxo real com OAuth \`resource\`; **não** substituir globalmente \`resource\` por \`audience\` com proxy ad hoc.
4. Descoberta OAuth deve publicar URL exato do emissor, token/authorization endpoints, PKCE \`S256\`, \`token_endpoint_auth_methods_supported\` e CIMD ou \`registration_endpoint\` para DCR.
5. Em CIMD, **usar o client ID e callback exatos mostrados pelo painel de conexão do ChatGPT** — não reutilizar valores de outros usuários/fóruns. Testar *pré-registro* manual antes de considerar CIMD dynamic EA. Registrar \`preview\` e \`register\` como evidências distintas.
6. Se CIMD falhar, avaliar **DCR explicitamente** (não ignorar falha). DCR em cliente externo aumenta superfície de inscrição e requer políticas de aplicação/escopos, conexão de login habilitada, limite e auditoria. Nunca habilitar cadastro aberto sem revisão.
7. Definir scopes mínimos \`posts:read\`, \`sites:connect\` de laboratório; nenhuma ferramenta de escrita nessa primeira homologação. Não distribuir acesso à Auth0 Management API pelo ChatGPT.
8. Contas/credenciais pessoais permanecem no painel Auth0 e vault da máquina; **nunca** compartilhar tokens, API keys, client secrets ou credenciais WordPress no PR/chat.

**Bloqueador:** o Auth0 não está conectado às ferramentas desta conversa. Não foi criado tenant nem confirmado o acesso às funções CIMD/DCR para esta conta.

## 01C — Matriz de compatibilidade ChatGPT (prova REAL futura)

| Prova | Observação exigida para PASS | Estado neste PR |
| --- | --- | --- |
| OAuth protected resource | URL HTTPS \`/.well-known/oauth-protected-resource\` (ou por recurso), \`resource\` canônico e emissor exato | OFFLINE CONTRACT APENAS |
| 401 challenge | \`WWW-Authenticate: Bearer resource_metadata="..."\`, sem dados privados | NÃO EXECUTADO |
| OAuth metadata | \`S256\`, auth code, métodos de autenticação, issuer, endpoints corretos | TESTE SINTÉTICO |
| CIMD registration | URL do ChatGPT registrado com sucesso, callback exato, token method negociado | NÃO EXECUTADO |
| DCR fallback | Registro e persistência do client ID, login habilitado e proteção contra abuso | NÃO EXECUTADO |
| Auth code + PKCE | Redirecionamento, login, consentimento, troca de código e renovação reais | NÃO EXECUTADO |
| RFC 8707 resource | O token Auth0 contém audience correto para MCP; não \`userinfo\` | NÃO EXECUTADO |
| JWT real Auth0 | Verificação \`iss,aud,exp,nbf,iat,alg,kid\` e escopos. Testar token errado/expirado | NÃO EXECUTADO |
| Multiusuário | 2 usuários e 2 WP sintéticos: tentativa de acesso cruzado SEMPRE negada | NÃO EXECUTADO |
| Administração | Sem Admin REST/Management API no gateway público | NÃO EXECUTADO |
| Revogação/concorrência | Operação incerta, crash, retry e revogação não geram escrita duplicada | NÃO EXECUTADO |
| Workers/D1 | CPU/quotas, segurança do egress e diário durável equivalentes ao PG | NÃO EXECUTADO |

**Sobre callback:** ChatGPT pode usar \`https://chatgpt.com/connector_platform_oauth_redirect\` quando são atendidas exigências do issuer e \`authorization_response_iss_parameter_supported\`; caso contrário há callback específico. Nunca fixar um callback inventado.

## Teste offline incluído (NÃO é integração com Auth0)

\`infra/fwb-alt-01/discovery-contract.mjs\` e \`discovery-contract.test.mjs\` verificam formato de PRM/OAuth metadata, igualdade de recurso/emissor, PKCE S256, tipos de token endpoint e modo CIMD/DCR. Testes usam um **domínio fictício** de fixture, não criam cliente nem consultam provedores.

Para executar **no Windows local** (Node 22, raiz do checkout):

\`\`\`powershell
node --test infra/fwb-alt-01/discovery-contract.test.mjs
\`\`\`

Sem GitHub Actions hospedadas. Se CI for indispensável depois, utilizar **runner self-hosted adequado e confiável**. Não conectar runner com segredos a PR de código de origem desconhecida.

## 01D — Decisão e critérios de avanço

| Marco | Condição de aceitação | Estado |
| --- | --- | --- |
| Auditoria Keycloak / PG | Dependências e riscos mapeados | **PASS (documental)** |
| Contrato de metadados | Código sintético com testes negativos | **CRIADO (teste ainda não executado)** |
| Auth0 Free | Tenant pessoal real, API/scopes, resource profile | **PENDENTE CONTA** |
| Compatibilidade ChatGPT | CIMD **ou** DCR e Authorization Code + PKCE reais | **NO-GO** |
| Workers | MCP funcional sob Free CPU/memória, auth segura, SSRF negado | **NÃO INICIADO** |
| D1 | Vinculações e diário com atomicidade/serialização testadas, crash seguro | **NÃO INICIADO** |
| Produção | Dois WordPress isolados, logs, backup, revogação, custos verificados | **NÃO AUTORIZADO** |

**Importante:** D1 \`batch()\` transaciona instruções SQL, mas **não equivale** ao lock de sessão do PostgreSQL durante chamada externa à Keycloak/WP. Avaliar conditional state machine com reconciliação manual e, se necessário, **Durable Objects SQLite** (disponíveis no Workers Free), mas sem declarar equivalência antes de testes concorrentes reais.

**Próximas etapas:**
- **FWB-ALT-01B — Tenant Auth0 Free e configuração OAuth de laboratório** após cadastro pelo operador.
- **FWB-ALT-01C — Homologação ChatGPT real CIMD/DCR**, usando URL de conexão e emissor autênticos, somente em staging.
- **FWB-ALT-01D — Parecer final GO/NO-GO**, baseado nas evidências reais; só então iniciar Workers/D1.
- Se a prova falhar, manter intacto o desenvolvimento Keycloak/OCI e não criar novas despesas.

## Referências oficiais verificadas em 21/11/2026

- [OpenAI — Authentication for plugins](https://developers.openai.com/plugins/build/auth)
- [OpenAI — Troubleshooting](https://developers.openai.com/plugins/deploy/troubleshooting)
- [Auth0 — Auth for MCP is GA](https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/)
- [Auth0 — CIMD and application profiles](https://auth0.com/blog/scaling-ai-agent-identity-cimd-application-profiles/)
- [Auth0 — MCP resource audience troubleshooting](https://support.auth0.com/center/s/article/mcp-audience-error-with-auth0)
- [Auth0 — Pricing Free](https://auth0.com/pricing)
- [Auth0 — ChatGPT CIMD community report, with Nov 5 follow-up](https://community.auth0.com/t/auth0-cimd-registration-appears-incompatible-with-the-current-chatgpt-client-id-metadata-document/203817)
- [Cloudflare — Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare — D1 documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare — Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

## Bloqueios operacionais

**Sem** alteração em produção, env de Vercel, WordPress real, DNS, Auth0 tenant, conta Cloudflare, R2B2 Keycloak, OCI, despesas, merge, Worker externo, uso de GitHub Actions hospedado ou deploy. Esta é uma branch de auditoria independente das propostas OCI (#43/#44), baseada no R2B2 (#41).
