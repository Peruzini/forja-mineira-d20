# FWB-REG-04D-R1 — Staging isolado (preparação e segurança)

**Situação:** código e CI somente. Este diretório NÃO publica nem inicializa um servidor HTTPS. Nenhum WordPress de produção é alterado.

## Topologia exigida antes de liberar deploy

- **Keycloak (auth-stage)**: realm exclusivo de staging, OAuth Authorization Code/PKCE; client confidencial `fwb-onboarding` com `serviceAccountsEnabled`, `client_credentials`; FGAP V2 com permissão `view,manage` somente em contas de teste elegíveis. Sem `manage-users`, `realm-admin`, `manage-clients` ou grant password no client.
- **MCP gateway (mcp-stage)**: TLS público válido, gateway read-only; JWT RS256 do issuer pinado e `aud` igual a URL exata `https://mcp-stage.../api/gateway-mcp`; somente uma conta/site de staging por associação; política de egress `FWB_REG04D_R1_EGRESS=enabled`.
- **WordPress (wp-stage)**: outro domínio de staging, sem dados de produção, autores de teste e Application Passwords próprias. SSL público confiável. Egress restringe hosts e endpoints e valida TODOS os IPs retornados pelo DNS no instante de estabelecer conexões; bloqueia IP privado, link-local e metadata de cloud.
- **PostgreSQL**: base separada e privada; TLS verificado pelo cliente Node, usuário sem privilégios DDL em runtime e migrações executadas explicitamente; segredos criptografados em repouso com AES-256-GCM. Backup, recuperação e rotação de chaves exigem plano próprio.
- **Admin Keycloak**: o endpoint administrativo precisa de ACL de rede interna e TLS. O módulo R1 demonstra autenticação do serviço com token de curta duração; não expor uma rota de credenciais no MCP público. Keycloak FGAP concede permissões de usuário inteiro, não ACL de atributos; uma API interna de atualização limitada a `fwb_site_id` e `fwb_connection_id` ainda é obrigatória antes de publicação.

## O que foi implementado

`mcp/fwb05-poc/reg04d-r1/scoped-service.mjs` obtém tokens de `client_credentials` no próprio realm Keycloak e permite `attach/detach` somente ao `sub` que esteja na allowlist privada do serviço. Não aceita o bearer legado nem roles administrativas amplas no token. O Keycloak FGAP continua sendo a autoridade efetiva.

`mcp/fwb05-poc/reg04d-r1/pinned-egress.mjs` limita as requisições do gateway ao JWKS exato e aos endpoints necessários para WordPress read-only, usando Undici Agent com callback DNS que rejeita resoluções privadas/mistas e preserva verificação TLS e hostname. O gate R1 na rota exige egress protegido ou responde 503.

`mcp/fwb05-poc/reg04d-r1/staging-preflight.mjs` valida a configuração com três atestações explícitas; não testa disponibilidade, CA de TLS, egress no host de deploy nem backup. Apenas devolve `CONFIGURATION_REVIEWED_NOT_DEPLOYED`.

## Processo seguro de provisionamento

1. Reservar **três** domínios totalmente separados dos endpoints em produção. Obter autorização para provisionar conta, DNS/TLS, Keycloak, serviço e PostgreSQL. Nenhuma URL fictícia em produção.
2. Criar uma rede privada/segregada com controle de saída e vault. Criar certificado/TLS para os três domínios; testar hostname e cadeia de CA, inclusive certificado do Postgres e o caminho privado de admin Keycloak.
3. Criar o client `fwb-onboarding` com credencial apenas no vault, sem password grant, e permissões FGAP V2 para contas elegíveis. Confirmar nas negativas reais que conta externa, clients e realm ficam proibidos. Evitar global admin roles. Adicionar auditoria por operação.
4. Criar a infraestrutura WordPress **de testes**. Excluir produção explicitamente da allowlist. Validar IP DNS real (inclusive respostas múltiplas e rebinding), redirecionamentos e política de saída.
5. Provisionar variáveis do `staging.env.example` fora do Git, completar três auditorias, executar `node infra/fwb-reg04d-r1/check-stage.mjs` com env carregado pelo vault. **PASS do preflight não autoriza publicação.**
6. Só então executar um smoke HTTPS real e rotinas de recuperação, negar cross-user, revogar também a Application Password WordPress e testar acesso após revogação. Confirmar o CIMD real corrigido antes da conexão ChatGPT normal.

## Bloqueios atuais de liberação

- **CIMD:** bug oficial do Keycloak 26.8.2 ao ler `token_endpoint_auth_methods_supported`, relatado no REG-04D; não contornar, filtrar nem espelhar o documento do ChatGPT.
- **Staging público:** não há DNS, host, Keycloak, WP de teste persistente, PostgreSQL TLS privado ou segredos concedidos ao bloco. Não afirmar que está publicado.
- **Autorização administrativa:** sem auditoria final da política FGAP V2 em ambiente persistente e sem proxy de atributos restritos. A allowlist por `sub` é complementar, não substituta.
- **Operação:** rotação de segredos, KMS, backups/restore, telemetria sem dados sensíveis, ACL de rede administrativa e revogação de senhas de aplicativo permanecem gates.
- **Privacidade:** nunca registrar tokens, bodies de login, código OAuth, JWT, senhas WordPress, chave AES nem URI completa de banco. Não utilizar `admin-cli` ou grant password fora da CI descartável.

Critério final: GO apenas para **preparação/CI**, NO-GO para staging público e ChatGPT normal até comprovar todos os itens e obter autorização explícita de deploy.
