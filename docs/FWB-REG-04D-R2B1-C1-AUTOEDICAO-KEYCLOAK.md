# FWB-REG-04D-R2B1-C1 — Homologação real da autoedição no Keycloak

**Data:** 21/11/2026 (UTC). **Resultado:** LAB PASS, sem exceções de autorização. **Staging público:** NO-GO até R2B2/R2C e correção CIMD.

## Decisão

Um usuário Keycloak comum autenticado por **Authorization Code + PKCE** conseguiu atualizar `firstName` pela Account REST JSON, mas não conseguiu persistir os atributos administrativos `fwb_site_id` e `fwb_connection_id`, nem um atributo não declarado. Após os dois testes, o perfil original foi restaurado e verificado pela Admin REST.

O experimento foi executado exclusivamente em Keycloak **26.8.2 descartável** no GitHub Actions. O gateway HTTPS R2A continua desabilitado para MCP (503); nenhum WordPress real, credencial externa ou deployment de produção foi alterado.

## Por que os testes anteriores falharam

1. O realm importado não trazia um client scope genérico `roles`; o C1 declara em runtime um mapper **somente** para roles do client `account`.
2. O Keycloak controla que papéis um client OAuth pode incluir no access token. O C1 adiciona **apenas** `account/view-profile` e `account/manage-account` às role-scope mappings do client de testes; concede esses dois papéis de autoatendimento ao usuário de testes, sem papéis de `realm-management`, `manage-users` ou `realm-admin`.
3. O `resource` RFC 8707 do MCP restringe o `aud` ao gateway; esse token não deve ser reutilizado na Account REST. O teste usa duas autorizações Code/PKCE independentes: a primeira com o resource MCP; a segunda **sem** `resource`, para receber o público `account` via mapper específico. O helper comum `tests/fwb-reg04b/keycloak-oauth-e2e.py` ganhou parâmetro opcional, mas seu comportamento padrão MCP foi preservado — regressão REG-04B PASS.
4. `/realms/<realm>/account/` é usado com `Accept: application/json` e `Content-Type: application/json`. O teste só continua se retornar JSON real, não HTML da Account Console. No laboratório, `/account/v1/` ora retornou 401 para token sem a audiência, ora 404 após passar validações iniciais, portanto **não é usado** como endpoint funcional da prova. O endpoint de produção deverá ser homologado na mesma versão contratada do Keycloak.

## Teste de segurança positivo e negativo

Fluxo `tests/fwb-reg04d-r2b1/user-account-pkce.py`:

1. Configuração prévia realizada por admin **descartável da CI**: roles `view-profile` e `manage-account` do cliente `account` para um usuário de laboratório, escopos de client limitados e mapper de audiência; nenhuma permissão administrativa sobre outros usuários.
2. Token OAuth PKCE com `resource=MCP`: valida que `aud` contém o MCP e não contém `account`. O probe HTTP na URL versionada é apenas diagnóstico. A garantia adicional foi confirmada por uma requisição ao **endpoint JSON funcional** de Account REST: o token vinculado ao MCP recebeu **HTTP 401**, enquanto o token de conta conseguiu ler e editar o campo comum.
3. Segundo token OAuth PKCE **sem o recurso MCP**: confirma `aud=account`, mapeamentos efetivos e ausência de `realm-management`. Requisição à Keycloak Admin REST para o próprio usuário retorna 401/403.
4. `GET /account/`: HTTP 200 com `Content-Type: application/json`.
5. Controle positivo: `POST /account/` altera `firstName`; leitura posterior da Admin REST confirma que **persistiu**.
6. Ataque: `POST /account/` tenta introduzir `fwb_site_id`, `fwb_connection_id` e `fwb_r2b1_undeclared`, com o mesmo token que editou `firstName`. Leitura posterior da Admin REST comprova que nenhum desses atributos foi persistido, sem perda de `firstName`.
7. Restauração dos campos básicos via uma requisição Admin REST com representação completa, seguida de readback de integridade. Todas as operações ocorrem na mesma conta de laboratório.

Isso demonstra restrição de atributo no próprio Keycloak para contexto **self-service**, não só um 401 genérico por token inválido.

## Evidência CI

- **[CI C1 FINAL #44926136445](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44926136445): 2/2 jobs SUCCESS**.
  - `security-unit-build`: **71 testes descobertos; 69 PASS, 0 FAIL, 2 SKIP**; Next.js build PASS.
  - `keycloak-native-profile`: Keycloak real 26.8.2; FGAP, perfil nativo, preservação do core, PKCE, autoedição e bloqueios PASS. Marcadores:
    - `REG04D_R2B1_C1_OAUTH_PKCE_USER_ACCOUNT_AUDIENCE_PASS`
    - `REG04D_R2B1_C1_USER_ADMIN_REST_DENIED_PASS`
    - `REG04D_R2B1_C1_REAL_ACCOUNT_MCP_BOUND_TOKEN_HTTP 401`
    - `REG04D_R2B1_C1_ACCOUNT_REST_READ_PASS`
    - `REG04D_R2B1_C1_POSITIVE_SELF_EDIT_PASS`
    - `REG04D_R2B1_C1_REAL_ACCOUNT_FWB_SELF_EDIT_DENIED_PASS`
    - `REG04D_R2B1_C1_PROFILE_RESTORE_AND_NO_FWB_BINDING_PASS`
- **[REG-04B #44926136442](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44926136442): SUCCESS**, inclusive fluxo histórico de Code+PKCE com `resource=MCP`.
- **[R2B1 #44926136444](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44926136444): SUCCESS**, valida a política nativa e FGAP.

## Limitações e próximos gates

- O teste comprova que **usuário comum não pode autoeditar** os campos reservados. Não demonstra ACL por campo para um token de serviço com `FGAP manage`: esse poder ainda precisa de isolamento de credencial e API administrativa (R2B2).
- `GET /users` seguido de `PUT` segue sem transação ou compare-and-swap. Concorrência, idempotência, timeout e reconciliação permanecem pendentes no R2B2.
- O experimento utiliza um realm novo em política nativa implícita. Migração de realm existente em `ADMIN_EDIT` não foi testada.
- Não há Keycloak/WordPress/PostgreSQL de staging persistentes, DNS próprio ou segredos em ambiente público. R2C permanece NO-GO.
- CIMD do ChatGPT normal no Keycloak 26.8.2 continua bloqueado no parser, dependência separada para R3.
- Git: **PR #39 draft**, empilhado sobre PR #38, sem merge automático.

**Conclusão:** FWB-REG-04D-R2B1-C1 **LAB PASS**, fecha a pendência da autoedição do R2B1 em laboratório. O próximo bloco objetivo é **FWB-REG-04D-R2B2 — Isolamento do serviço administrativo**, diretamente no GitHub conectado, sem Worker salvo bloqueio técnico comprovado.
