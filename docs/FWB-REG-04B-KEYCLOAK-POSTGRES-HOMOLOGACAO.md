# FWB-REG-04B — Provedor OAuth Keycloak real + PostgreSQL durável

**Status:** PR #32 draft. Validações com serviços reais executadas na CI; ver resultados da run e atualizar este documento antes do GO.

## Arquitetura

O REG-04A é uma suíte de contrato OAuth com JWTs gerados em testes e um store em memória **exclusivamente no laboratório**. REG-04B acrescenta duas integrações independentes sem inventar um servidor de credenciais:

1. **Keycloak 26.8.2** como provedor OAuth/OIDC externo (imagem oficial `quay.io/keycloak/keycloak:26.8.2`). Realm de teste isolado com Authorization Code, PKCE S256, autenticação humana por formulário, consentimento, client público previamente cadastrado, refresh/revogação; JWT RS256 com cabeçalho `typ=at+jwt` habilitado no client, JWKS do realm e audience MCP específica.
2. **PostgreSQL 16** para vínculos site/identidade duráveis: chave composta por hash SHA256(`sub/site_id`), gravação atômica com `INSERT ... ON CONFLICT DO NOTHING`, JSONB contendo envelope AES-256-GCM já cifrado pelo REG-04A; consulta e exclusão por chave, sem senha administrativa armazenada.

### Endpoint do gateway

Rota `/api/gateway-mcp` só usa o Postgres se `FWB_REG04_STAGING=enabled` e `FWB_REG04B_PG_STORAGE=enabled`; qualquer configuração ausente retorna 503. A instância real de Postgres exige TLS verificado. Única exceção é `NODE_ENV=test` + `FWB_REG04B_INSECURE_DB_TEST_ONLY=enabled` + host loopback exclusivamente na CI. **Não configurar essa exceção em qualquer deploy público.**

O modo Keycloak requer `FWB_REG04_PROVIDER=keycloak`, `FWB_REG04_ISSUER=https://AUTH/realms/REALM` e JWKS exatamente `${ISSUER}/protocol/openid-connect/certs`. Metadata OIDC é pinada em `${ISSUER}/.well-known/openid-configuration`; a versão Keycloak do validador exige endpoints do próprio realm, Authorization Code, PKCE S256 e token endpoint compatível com public client. Tokens são verificados pela implementação de assinatura RS256 do REG-02; **nenhum token WordPress HS256 é aceito nem trocado**.

### Evidência de laboratório com fluxos reais

Workflow: `.github/workflows/fwb-reg04b-real-oauth.yml`.

- Job PostgreSQL: serviço `postgres:16` descartável, migração explicitamente autorizada apenas no teste, conexão real, concorrência de gravações, isolamento, criptografia, desconexão, além de regressões anteriores e compilação Next.js.
- Job Keycloak: contêiner `quay.io/keycloak/keycloak:26.8.2` com realm fictício, servidor HTTPS local com certificado self-signed **confiável apenas no runner**, cliente OAuth de teste, login por HTTP sobre TLS local, consentimento, Authorization Code + PKCE, JWT real validado contra JWKS real, replay e PKCE errado rejeitados, refresh e revogação. O mesmo bearer JWT é passado ao validador do **gateway** e rejeitado se alterado.
- As URLs `auth-lab.example.org` e `mcp.example.org` são exemplos de laboratório, **não** endpoints públicos nem propriedades do usuário. Sem credenciais pessoais, serviços ou banco do WordPress de produção.

## Pendências que não podem ser mascaradas por CI PASS

1. **CIMD do ChatGPT**: o fluxo de laboratório usa cliente *pre-registered* e retorno fictício, não é uma conexão do ChatGPT. O Keycloak suporta CIMD experimental mediante `--features=cimd`, política `client-id-uri` e perfil `client-id-metadata-document`, mas deve-se testar exatamente o documento ChatGPT (inclusive campos suplementares); não aceitar origem desconhecida nem suprimir campos críticos. Uma incompatibilidade com a CIMD real é um NO-GO, não permissão para enfraquecer validação.
2. **Onboarding federado real**: para emitir `site_id` e `connection_id` sob o sujeito correto após vinculação, o IdP precisa receber atualização autenticada dessas associações; o teste pre-carrega atributos fictícios no realm. A ligação automática do site pelo fluxo de telas e APIs administrativas Keycloak ainda não foi construída/homologada.
3. **WordPress real**: o WordPress do REG-02C é descartável mas separado do IdP; este bloco não demonstra onboarding real WordPress+Keycloak numa mesma sessão HTTPS. As respostas de WordPress do teste Postgres são fixtures e não evidência de acesso real.
4. **PostgreSQL produção**: implantação de banco com certificados reais, migrações permissionadas, backup, rotação do KMS/secret AES, LGPD, quotas, auditoria, egress fixo/DNS rebinding e política de retenção continuam pendentes.
5. **HTTPS público e aprovação**: o TLS do workflow é um proxy efêmero, não certificação pública. Ausência de publicação e de uso no ChatGPT normal. Nenhuma implantação Vercel foi executada.
6. **Token access revocation**: invalidar conexão via registro cancela imediatamente acesso ao site naquele gateway, mas revogação da Application Password WordPress e revogação imediata de JWT sem `connection_id` ainda precisam fluxos operacionais e logs de auditoria.

## Critérios claros

- **GO laboratório real IdP** somente se o job Keycloak demonstrar login/consentimento/PKCE/RS256/refresh/revogação e o validador do gateway aceitar token de issuer real.
- **GO Postgres** somente se o job criar/consultar/excluir vínculo em banco verdadeiro e rodar regressões sem falhas.
- **NO-GO produção, ChatGPT normal e submissão** até CIMD da versão ChatGPT/Keycloak demonstrado, IdP e PostgreSQL HTTPS públicos, associação federada de usuário-site, WordPress real de testes e segurança operacional.
- PR draft sobre #31, sem merge automático; nenhum segredo real ou acesso administrativo ao site Forja.

Referências:
- https://www.keycloak.org/securing-apps/mcp-authz-server
- https://www.keycloak.org/getting-started/getting-started-docker
- https://www.keycloak.org/2025/04/keycloak-2620-released
- https://developers.openai.com/plugins/build/auth
