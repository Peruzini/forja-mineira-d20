# FWB-REG-04 — OAuth central interoperável e onboarding de sites WordPress

**Estado:** protótipo de contrato OAuth + onboarding em PR draft; **NÃO é um provedor OAuth implantado nem um onboarding público operacional**.

## Desenho escolhido

O REG-02C homologou autenticação de uma instalação WordPress descartável usando JWT HS256 com `aud` WordPress. O REG-03 criou recurso MCP central que aceita somente JWT RS256 com `aud` próprio. Aceitar o token HS256 da instalação WordPress como se fosse token RS256 do gateway é incorreto (token confusion, audience mismatch), por isso o REG-04 **não faz conversão insegura, não copia chaves HMAC e não simula um token exchange autorizado**.

Em vez disso, o REG-04 define um contrato para um **Authorization Server OAuth 2.1 central, operado por infraestrutura separada**, que deve emitir access tokens RS256 para o resource do MCP `/api/gateway-mcp` com claims `sub`, `site_id`, `connection_id`, escopos `posts:read` e, para administrar vínculos, `sites:connect`.

- `reg04/oauth-profile.mjs` valida discovery real HTTPS de Authorization Server via `/.well-known/oauth-authorization-server`, issuer, token/authorize endpoints, JWKS, Authorization Code, PKCE S256, CIMD e `none` no token endpoint. Tudo ancorado em host HTTPS pré-configurado sem redirecionamento.
- `reg04/onboarding.mjs`: exige identidade OAuth RS256 validada; o `sub` só é usado após assinatura, audience, issuer, validade e scope verificados.
- `reg04/central-gateway.mjs`: para cada chamada MCP, exige token RS256 válido + `site_id` e `connection_id` **assinados**, abre o registro persistente equivalente e encaminha somente a credencial editorial do site correspondente ao handler MCP de leitura.
- O endpoint REG-03 `/api/gateway-mcp` e seu discovery utilizam REG-04 **somente se** `FWB_REG04_STAGING=enabled`. Sem adapter de storage durável injetado, retorna **503** (fail closed). **Nenhum store em memória é conectado em rota Next.js/Vercel**.
- REG-02/REG-03 permanecem compatíveis quando REG-04 não está habilitado.

## Onboarding de site sob controle do administrador

1. Um usuário já autenticado pelo AS central apresenta `posts:read sites:connect`; vínculo para `sub` vem da assinatura. Sem token verificado, serviço de onboarding não é acionado por nenhuma rota pública.
2. Escolhe `site_id` e um WordPress sob hostname **pré-aprovado pelo servidor**; domínio de produção da Forja, IP literal, HTTP, URL com path extra, userinfo ou query são recusados.
3. Fornece exclusivamente em sessão HTTPS protegida uma Application Password **temporária de administrador** e outra **de autor/editor sem `manage_options`**, de contas diferentes. O servidor consulta `/wp-json/wp/v2/users/me?context=edit` usando Basic, TLS e bloqueio de redirects para provar `manage_options` do primeiro e `edit_posts` do segundo. As respostas são limitadas e checadas; nenhuma autorização por descrição não verificada do usuário.
4. **Somente** host, usuário editorial, ID WordPress autorizado e Application Password editorial ficam gravados, cifrados com AES-256-GCM e AAD associado a `sub/site_id`; a credencial de administrador não é persistida. O storage exige `createIfAbsent`, `get`, `delete` transacionais. A implementação `EphemeralSiteStore` é exclusivamente de testes; **não é datastore de produto**.
5. O vínculo gera `connection_id` novo. O issuer OAuth central precisará incluí-lo em tokens da conexão com assinatura RS256. O MCP exige o mesmo ID no registro criptografado; tokens antigos deixam de funcionar após `disconnect` + reconexão, mesmo que o `site_id` seja reutilizado.
6. O resultado público do onboarding não inclui password/secret. Desconectar apaga o registro e bloqueia imediatamente novas chamadas MCP; scopes de escrita não são oferecidos no gateway.

### Observação importante

O onboarding implementado é um **serviço interno com contrato e testes**, não uma página pública de cadastro. O fluxo de tela, credenciais temporárias protegidas e a troca entre sessão WordPress/issuer central ainda requerem infraestrutura real. O domínio e o acesso WP são testados com fixtures em memória. Isto não equivale a afirmar posse de um WordPress real ou permissões já homologadas em HTTPS.

## Configuração exigida (somente staging, nenhum segredo no Git)

- `FWB_REG04_STAGING=enabled` para selecionar modo central. **Não habilitar em Vercel antes de storage durável e AS reais**.
- `FWB_REG04_ISSUER=https://login-staging.example.org/` (URL exata do AS, slash final).
- `FWB_REG04_JWKS_URL=https://login-staging.example.org/oauth/jwks.json`.
- `FWB_REG04_RESOURCE=https://mcp-staging.example.org/api/gateway-mcp`.
- `FWB_REG04_ALLOWED_WP_HOSTS=wp1.staging.example.org,wp2.staging.example.org`, somente hostnames verificados no servidor e nunca WordPress produção.
- `FWB_REG04_ENCRYPTION_KEY_B64URL`: chave aleatória AES-256-GCM de 32 bytes base64url, gerenciada fora do Git/Chat e com rotação planejada. **Não armazenar a chave nem credenciais no PR**.

## Segurança e limitações reais

**Comprovável por CI isolada:** troca de identidade vinculada a RS256, bloqueio de issuer/audience errados, escopos e expiração, verificação de privilégios WordPress pela API simulada, AES-GCM sem exposição do segredo administrativo, isolamento `sub/site_id/connection_id`, bloqueio de callbacks cross-site, revogação por exclusão do vínculo e transporte MCP real com cliente de teste.

**Não comprovado / bloqueio para produção:**

- Emissor OAuth central **real** com Authorization Code/PKCE/CIMD, tokens RS256, refresh, revogação e consentimento ativo. Discovery testado via fixture não prova interoperabilidade com WordPress OAuth REG-02C nem com ChatGPT.
- Como o AS central recebe `site_id`/`connection_id` após onboarding e emite um novo token; o login WordPress e a associação federada não foram implementados.
- Persistência transacional, criptografia em repouso com KMS/vault e rotação de chave, auditoria, revogação por token `jti`, retenção/exclusão LGPD, rate limiting e prevenção de concorrência distribuída. O store de teste é efêmero.
- Proteção SSRF de **DNS rebinding** ainda exige egress ACL/firewall, consulta DNS com pinning e verificação pública no deploy; hostname aprovado não equivale a IP seguro.
- O projeto não instalou um WordPress real, não recebeu credenciais do proprietário, não configurou TLS público, não verificou domínio, não fez registro/submissão OpenAI nem testou conexão com Chat normal.
- A credencial da conta editorial deve ser rotacionada e revogada se o vínculo for desfeito; a exclusão no gateway bloqueia o acesso *pelo gateway*, mas não revoga automaticamente a Application Password no WordPress de origem.
- `EphemeralSiteStore` não é apto para serverless/produção. Em rota pública, REG-04 ativado sem storage retorna HTTP 503 de propósito.
- Não usar tokens HS256 do WordPress de REG-02C no gateway REG-04. Não incorporar a senha HMAC WordPress ao Vercel.

## Gate de aceitação

**REG-04A — Contrato de OAuth e onboarding em laboratório:** GO apenas se npm tests e Next.js build PASS, sem produção, PR draft e regressão REG-03/REG-02 sem falhas.

**REG-04B — Homologação de OAuth central real:** NO-GO até infraestrutura IdP, datastore durável, fluxo browser autorização+consentimento+PKCE, refresh/revoke, vinculação pós-login e conexão HTTPS do ChatGPT em ambiente autorizado. Não usar o selo 'OAuth central operacional' somente pela aprovação do 04A.

## Dependências seguintes

1. Selecionar provedor OAuth central auto-hospedável ou serviço já disponível que emita `RS256 typ:at+jwt`, `aud` do gateway e suporte CIMD/PKCE. Não presumir que biblioteca WordPress HS256 satisfaz isso.
2. Configurar domínio TLS e staging real com egress privado e banco transacional cifrado; expor fluxo de vínculo UI com proteção CSRF, consentimento, posse do site e rotação de senhas.
3. Reexecutar OAuth Authorization Code + PKCE real de um navegador com WordPress de testes (não com fixture de ChatGPT) e depois testar conexão no ChatGPT somente após app autorizado.
4. Fechar revisões PRs anteriores na ordem, nunca merge automático ou instalação no WordPress de produção.

Referências: https://developers.openai.com/plugins/build/auth ; https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization ; RFC 8414/8707/9728.
