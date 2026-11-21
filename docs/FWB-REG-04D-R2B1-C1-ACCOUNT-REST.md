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
