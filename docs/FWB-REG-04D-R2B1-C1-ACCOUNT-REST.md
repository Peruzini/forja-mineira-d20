# FWB-REG-04D-R2B1-C1 — Account REST de usuário comum (21/11/2026)

**Escopo:** validar por teste funcional autenticado, em Keycloak 26.8.2 descartável, que os atributos administrativos `fwb_site_id` e `fwb_connection_id` não podem ser lidos ou alterados por uma conta comum via Account REST.

## Diagnóstico que motivou o C1

O fluxo de PKCE do gateway obtém token válido para `https://mcp.example.org/api/gateway-mcp`. A Account REST exige token com **audience=account**; o token da aplicação MCP recebe HTTP 401 corretamente e não serve para validar autoedição. Código-fonte Keycloak 26.8.2 em `AccountLoader.getAccountRestService()` verifica `accessToken.hasAudience(client.getClientId())`. Não elevar permissões do cliente MCP apenas para permitir o teste.

## Isolamento do teste

A suíte C1 cria em tempo de execução, em um realm **descartável**, o client `fwb-account-selfservice-ci` com OAuth Authorization Code/PKCE S256 e consentimento. `fullScopeAllowed=false`, audience explícita **account**, scope de papéis limitado a `account/manage-account` e `account/view-profile`. As únicas roles concedidas ao usuário de CI são de gestão da própria conta; não são atribuídas roles de `realm-management`, `realm-admin`, `manage-users` ou `kc-admin-api`. O cliente original MCP é lido antes e depois para comprovar que não teve alterações.

Provas executadas pela suíte `tests/fwb-reg04d-r2b1-c1/self-service-account.py`:

1. Usuário comum autentica por Authorization Code/PKCE real; valida `sub`, `azp`, audience `account` e a ausência de roles administrativas.
2. Administrador de **laboratório descartável** prepara valores conhecidos em ambos os campos, para que o teste negativo não se limite à ausência inicial.
3. GET `/realms/{realm}/account/v1/` com bearer de usuário confirma que campos reservados não aparecem.
4. **Controle positivo obrigatório:** POST pela Account REST atualiza `firstName`, com confirmação de persistência por leitura independente via Admin REST. Isto evita falso positivo por endpoint inoperante/401.
5. **Teste adversarial:** POST tenta sobrescrever `fwb_site_id` e `fwb_connection_id`, além de introduzir um atributo não declarado. Resposta HTTP 204/400/403 sozinha **não comprova bloqueio**: o PASS só ocorre se leitura posterior comprovar ambos os valores originais intactos e o campo clandestino ausente.
6. Restaura e compara dados básicos de perfil. Logs não contêm tokens, senhas nem PII real. Cleanup do contêiner e TLS da CI permanece ativo.

## Critério de aceite e dependências

- CI com `security-unit-build` **e** `keycloak-native-profile` verdes, marcadores C1 de teste positivo e negativo e sem permissões administrativas adicionais.
- Qualquer 401/403 ao ler a Account REST, qualquer falha no POST de controle positivo, valor reservado modificado, ausência de audience correta ou papel administrativo de usuário **é FAIL**.
- A suíte C1 substitui o ensaio diagnóstico antigo que tentava utilizar diretamente o token do gateway MCP na Account REST.
- O teste não resolve migração de realm existente `ADMIN_EDIT`, staging persistente, privacidade de Admin API, reconciliação concorrente, auditoria operacional, CIMD público ou conexão ChatGPT normal. Estes gates continuam **NO-GO** até R2B2/R2C/R3.

**Evidência:** consultar a nova execução de GitHub Actions no PR draft C1. Não marcar PASS antes da conclusão real da CI.

**Sem Worker, merge automático, deploy ou acesso ao WordPress em produção.**


## Fechamento R2B1-C1-R1 — comprovação em CI (21/11/2026)

**Resultado de laboratório: PASS (ambos os jobs, 2/2)** em [GitHub Actions #44927705973](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44927705973), commit `02ba23b70b47a3c1a3bfe77c3a93b2f4d90141a8`. A palavra PASS se limita ao realm Keycloak 26.8.2 descartável.

**Diagnóstico e reparos:** o callback OAuth era recebido diretamente, sem tela de consentimento intermediária; o ensaio antigo exigia consentimento visual e falhava indevidamente. O novo ensaio valida o callback, `state`, código único, PKCE, assinatura/JWKS, emissor, audience `account`, `sub` e ausência de roles administrativas. O realm importado não fornece automaticamente `sub` ou client scope padrão `roles`; o client de CI recebeu mapeadores explícitos para `sub` e dois papéis de conta. A versão REST deste Keycloak é `v1alpha1`, e não `v1` (ver `AccountRestApiVersion` em Keycloak 26.8.2). O workflow aplica uma substituição exata, protegida por `grep -Fq`, da rota do ensaio R1b para `/account/v1alpha1/`, sem alterar permissões do provedor.

**Marcos reais na CI:**
- `R2B1_C1_R1_ISOLATED_ACCOUNT_CLIENT_PASS` — cliente dedicado sem mudança no cliente MCP original.
- `R2B1_C1_R1_VERIFIED_ACCOUNT_PKCE_PASS` — token de usuário verificado; somente acesso à conta.
- `R2B1_C1_R1_ADMIN_FIELDS_HIDDEN_PASS` — os dois atributos administrativos ausentes da leitura da Account REST.
- `R2B1_C1_R1_SELF_EDIT_POSITIVE_PASS` — `firstName` persistido via Account REST (prova de endpoint operacional).
- `R2B1_C1_R1_PROTECTED_WRITE_NEGATIVE_PASS` — tentativas de sobrescrever atributos reservados e incluir atributo não declarado não persistem; Admin GET confirma valores anteriores.
- `R2B1_C1_R1_CORE_PROFILE_PRESERVED_PASS` — restauração e integridade dos campos básicos.
- `R2B1_C1_R1_ACCOUNT_REST_POLICY_PASS` — fechamento da suíte autenticada.

Os testes nativos e FGAP anteriores também passaram no mesmo run, incluindo não persistência de atributos não declarados e attach/detach.

**Decisão:** R2B1-C1-R1 **LAB PASS**, libera planejamento de R2B2 para isolamento administrativo. **Não libera staging público, migração de realm preexistente, produção, publicação CIMD nem ChatGPT normal.** Esses gates dependem de R2B2 (ACL, segredos, concorrência, auditoria), R2C e R3. PR permanece draft; nenhum merge/deploy/alteração na produção.
