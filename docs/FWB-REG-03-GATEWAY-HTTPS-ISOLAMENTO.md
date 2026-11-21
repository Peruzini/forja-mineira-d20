# FWB-REG-03 — Gateway HTTPS e isolamento de usuários/sites WordPress

Status: **IMPLEMENTAÇÃO EM PR DRAFT; validação CI obrigatória antes de GO de laboratório**.
Base: FWB-REG-02C, PR #29 (WordPress efêmero OAuth/MCP 54 checks PASS).

## Arquitetura entregue

- **Endpoint novo e separado:** `/api/gateway-mcp` no projeto Next.js existente; rotas REG-02 `/api/secure-mcp` e REG-02C WordPress não foram substituídas.
- **OAuth Protected Resource Metadata RFC 9728:** `/.well-known/oauth-protected-resource/api/gateway-mcp`, correspondente a resource `https://HOST/api/gateway-mcp`; 401 com `WWW-Authenticate: Bearer resource_metadata=...`.
- **Resource server OAuth:** JWT access token RS256 `typ: at+jwt`; issuer HTTPS e JWKS no mesmo origin, audience **igual ao URL do gateway**, validade curta, assinatura verificada usando a biblioteca REG-02. `posts:read` obrigatório.
- **Binding de tenant:** claims assinadas `sub` + `site_id` devem corresponder a um registro pré-aprovado. O par seleciona um único WordPress HTTPS, credencial de Application Password e `wordpress_user_id`. Antes de confirmar a assinatura, a claim não é confiável: ela **somente seleciona** registro estático, não autoriza requisição nem determina URL arbitrária.
- **Isolamento:** nenhum parâmetro MCP/URL/Host header altera o WordPress; consultas REST usam `author` filtrado e validam `author` de cada item e de cada post consultado, inclusive quando dois usuários compartilham um domínio.
- **Sem escrita:** `enableWrites=false` imposto pelo backend do REG-03 mesmo se JWT tiver `drafts:write`, ferramentas de escrita ocultas de `tools/list` e discovery limitada ao scope `posts:read`, sem botão para tornar escrita pública. REG-02 anterior mantém seu comportamento próprio.
- **Sem segredos no repositório:** credenciais só em variável de ambiente do servidor de staging. Erros não refletem responses upstream ou segredos; sem redirects HTTP; tempo limite em WordPress e JWKS.
- **Fail closed:** variável de habilitação ausente, registro inválido, domínio de produção ou HTTP para staging => HTTP 503. Token inválido, inexistente ou associação não permitida => HTTP 401.

## Configuração somente de staging (não preencher com dados de produção)

- `FWB_REG03_STAGING=enabled`
- `FWB_OAUTH_ISSUER=https://login.staging.example.org`
- `FWB_OAUTH_JWKS_URL=https://login.staging.example.org/jwks.json`
- `FWB_REG03_MCP_RESOURCE=https://mcp.staging.example.org/api/gateway-mcp`
- `FWB_REG03_TENANTS_JSON`: JSON **SECRET**, armazenado como configuração privada do deploy de staging, nunca em arquivo versionado. Array de no máximo oito registros `{site_id,subject,wordpress_url,wordpress_host,wordpress_user,wordpress_app_password,wordpress_user_id}`. `wordpress_url` deve ser base HTTPS (com `/` final); `wordpress_host` corresponde ao hostname e não pode ser o site público da Forja. Cada par `subject/site_id` é único. `wordpress_user_id` é ID do usuário WordPress autorizado no site.
- Token de teste emitido pelo Authorization Server de staging deve conter `iss`, `aud`, `sub`, `site_id`, `scope`, `iat`, `exp` e ser assinado RS256.

**Nunca inserir segredos reais no ChatGPT, GitHub Actions, código-fonte, documentação ou logs.** O registry é um MVP controlado, **não** substitui vault, banco de dados transacional, criptografia em repouso, cadastro de usuários/sites, recuperação, rotação ou exclusão LGPD.

## Modelo de ameaça e pontos de NÃO homologação

1. O WordPress OAuth REG-02C emite token **HS256** com audience do WordPress; este gateway exige **RS256** assinado pelo provedor fixo e audience do gateway. **Não há ponte de troca de tokens implementada.** Não encaminhar diretamente bearer do WordPress, não replicar secret HMAC e não relaxar o validador.
2. Nenhum provedor central de OAuth, login de cliente ChatGPT, associação real de usuários/site, refresh token ou revogação no gateway foi testado. Para produção, exigir revogação verificável (JWT curta + lista de revogação/introspection quando aplicável), lifecycle de onboarding e registro de consentimento.
3. HTTPS é **obrigatório por configuração e transportes**, mas somente deploy real com TLS/certificado, domínio, proteção da origem e challenge OpenAI poderá confirmar conexão pública. A CI usa fixtures em memória.
4. IPs literais (inclusive privados) não são aceitos como URL de destino. A URL WordPress é pinada em registro do servidor, mas DNS pode mudar. O deploy deverá aplicar **egress ACL e proteção contra DNS rebinding**, além de verificação de posse do site e controle de quotas, antes de permitir onboarding público.
5. Apenas o subconjunto editorial read-only deve ser considerado. As ferramentas herdadas `forja_draft_create`/`forja_draft_update` não são anunciadas no gateway REG-03; o backend também mantém `enableWrites=false`. Não publicar capacidade de escrita sem revisão separada.
6. Diferenciar **isolamento por binding** (testável agora) de **isolamento multi-tenant persistido/homologado** (pendente).
7. Nenhuma instalação/alteração no WordPress da Forja, merge automático, deploy em produção ou submissão à OpenAI está autorizada por este PR.

## Matriz de testes (CI)

Workflow `.github/workflows/fwb-reg03-tenant-gateway.yml` roda `npm test` (inclui regressões REG-02) e `npm run build` com Node 22. Testes REG-03 abrangem: 503 sem opt-in, HTTPS/hosts fixos, bloqueio de domínio produção, registro duplicado/extra inválido, metadata, autenticação RS256 com rejeição de assinatura adulterada, expiração, issuer/audience/scope, cruzamento de `sub` e `site_id`, desafio 401 e ausência de comunicação WordPress quando inválido, cliente MCP de verdade com duas identidades e duas credenciais WordPress de teste, usuário de mesmo host separado por autor, e escrita bloqueada.

**Critério de encerramento do REG-03 (escopo CI):** testes e build PASS, PR draft em revisão, nenhum deploy real. **Critério posterior de HTTPS operacional:** staging HTTPS de verdade, AS interoperável e emissão do par `sub/site_id` sem fraude, verificação DNS e egress, revogação, logs de auditoria sem dados sensíveis, testes de múltiplos WordPress reais descartáveis, permissões e conexão live com ChatGPT quando app habilitado. Não marcar publicação como pronta.

## Próximo bloco sugerido

**FWB-REG-04 — Provedor OAuth central e onboarding de sites:** decidir como obter tokens RS256 do gateway a partir de login/autorização real WordPress, gerenciar associação de contas com comprovação de posse de domínio, vault/rotação de segredos e revogação. Esse bloco é uma dependência material antes do review OpenAI.
