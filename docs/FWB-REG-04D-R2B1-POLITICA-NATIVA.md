# FWB-REG-04D-R2B1 — Política nativa de atributos Keycloak (21/11/2026)

**Resultado: parcialmente homologado em laboratório; NO-GO para staging público.**

Branch empilhada sobre PR #37; [PR #38](https://github.com/Peruzini/forja-mineira-d20/pull/38) permanece draft, sem merge/deploy e sem conexão com WordPress real.

## Diagnóstico causal confirmado

No Keycloak 26.8.2 descartável, a Admin REST `PUT /users/profile` aceita:
- Reenviar o perfil original: 200.
- `ADMIN_VIEW`, `ADMIN_EDIT` e `ENABLED`: 200.
- Adicionar as definições administráveis `fwb_site_id` e `fwb_connection_id`: 200.

**O valor literal `unmanagedAttributePolicy: DISABLED` retorna HTTP 400**, com erro `unknown_error` e mensagem `Cannot parse the JSON`, com ou sem os campos FWB. Com um realm recém-importado o GET omite a propriedade `unmanagedAttributePolicy`, representando a política padrão. Reenviar o esquema completo **sem essa propriedade** retorna 200 e a leitura posterior continua a omiti-la.

[Evidência comparativa — CI 44922206364](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44922206364).

## Alterações implementadas

- `mcp/fwb05-poc/reg04d-r2b1/native-profile.mjs`: construtor que preserva campos e grupos nativos, adiciona somente dois campos FWB com `permissions.view=['admin']` e `permissions.edit=['admin']` e omite o valor `DISABLED` que a versão 26.8.2 não aceita. Recusa nomes duplicados ou definições FWB preexistentes, em vez de sobrescrever privilégios.
- Testes unitários em `mcp/fwb05-poc/tests/reg04d-r2b1-native-profile.test.mjs` comprovam preservação da configuração e recusa de configuração de edição pelo usuário.
- `tests/fwb-reg04d-r2b1/native-profile-e2e.mjs` configura o esquema nativo em um realm novo, comprova por escrita real que um atributo **não declarado não persiste**, reaplica FGAP e testa conexão/desconexão. A CI detectou e corrigimos um problema importante: a Admin REST com User Profile nativo pode apagar `email`, `firstName`, `lastName` quando omitidos no corpo do PUT. Agora os módulos `reg04c/federated-onboarding.mjs` e `reg04d-r2b/restricted-attributes.mjs` preservam explicitamente os campos básicos recebidos do próprio Keycloak, não do usuário solicitante. Também foram ajustadas as validações de teste.
- O teste integrado comprova preservação do perfil básico na tentativa negativa e após o ciclo de FGAP.
- `tests/fwb-reg04d-r2b1/user-account-pkce.py` obtém JWT de usuário real por Authorization Code/PKCE e confirma negação da Admin REST para um usuário comum. O teste adicional via Account REST **não conseguiu completar**, pois o endpoint `/account/v1/` respondeu HTTP 401 ao token destinado ao gateway MCP; isso é uma questão de audiência do token, não uma comprovação de que o usuário consiga editar atributos.

## Evidências de CI e limites

- [CI 44921975207](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44921975207): diagnóstico básico PASS, demonstra o parser rejeitando DISABLED.
- [CI 44922206364](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44922206364): diagnóstico com realm recém-criado PASS, demonstra default implícito e escrita aceita sem declaração de política.
- [CI 44923562482](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44923562482): `security-unit-build` PASS; `keycloak-native-profile` FAIL **apenas na etapa adicional de Account REST v1 de usuário**, por HTTP 401. Antes desse ponto, os testes de esquema nativo, tentativa de persistir atributo não declarado, FGAP, vinculação, desvinculação, preservação do perfil básico e login OAuth/PKCE passaram.
- **Não declarar R2B1 completamente homologado** antes de validar por rota de Account REST com audiência/roles adequados ou por teste equivalente de autoedição, sem conceder amplos privilégios administrativos.
- O controle FGAP concede `manage` no **usuário**, não restrição de acesso a campos quando o token administrativo é usado diretamente. A interface privada continua necessária; a Admin API e a credencial devem permanecer em rede privada.
- O método Admin GET/PUT é read-modify-write, sem compare-and-swap e ainda tem risco de concorrência/reconciliação.
- O shell Vercel R2A permanece em modo somente diagnósticos, com MCP 503. **Não existe Keycloak ou WordPress de staging persistentes conectados, e nenhuma requisição tocou a produção.**

## Próxima execução objetiva

**FWB-REG-04D-R2B1-C1 — Homologação self-service da política nativa:** obter acesso **legítimo** à Keycloak Account REST a partir de um fluxo OAuth de usuário com audiência apropriada para o client de conta em **CI descartável**; tentar alterar os dois campos reservados, garantir que a requisição não persiste alterações e que o perfil permaneça íntegro. Não corrigir com `realm-admin`, `manage-users` ou desativação de validação. Caso o provedor não suporte esse fluxo sem configuração adicional, manter o teste como bloqueio explícito e documentado.

**Worker não necessário**: os testes rodaram pelo GitHub Actions conectado. Sem merge automático.
