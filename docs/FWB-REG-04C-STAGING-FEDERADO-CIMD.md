# FWB-REG-04C — Staging integrado, onboarding federado e compatibilidade CIMD

**Status:** implementação em PR draft; registrar conclusão e números de CI somente após execução com evidências verificadas.

## Objetivo
Demonstrar o primeiro caminho sem credenciais inventadas:
1. OAuth real com Keycloak 26.8.2 — Authorization Code/PKCE e consentimento por usuário;
2. WordPress real e descartável com duas contas distintas — administrador demonstra `manage_options`; autor oferece `edit_posts` com credencial própria;
3. PostgreSQL real guarda o vínculo AES-256-GCM somente com credencial do autor, `sub`/site e `connection_id` gerado pelo servidor;
4. após persistência, atualização do **mesmo sujeito** no Keycloak para assinar `site_id`/`connection_id` em token novo;
5. gateway read-only usa o novo token para listar/ler posts WordPress e revogação do vínculo deve impedir chamadas subsequentes.

## Alterações

- `reg04c/federated-onboarding.mjs`: Keycloak Admin REST protegido por configuração interna; `sub` deve ser UUID do **token previamente verificado**. Atualiza exclusivamente a conta daquele sujeito. Requer ausência de vínculo anterior, preserva atributos não relacionados, confirma a atualização via nova leitura do servidor.
- `connect`: primeiro prova permissões WordPress, grava PostgreSQL e então vincula Keycloak. Falha de sincronização dispara rollback do vínculo persistido. Se a exclusão falhar, deixa indicação explícita de revisão manual, jamais afirma sucesso.
- `disconnect`: exclui conexão PostgreSQL **antes** de tentar limpar atributos no Keycloak, para que tokens ainda válidos não consigam acessar aquele site. Falha na limpeza do IdP exige saneamento, não libera o site.
- `reg04c/cimd-readiness.mjs`: verificador de contrato do documento CIMD real do ChatGPT. Exige `client_id=https://chatgpt.com/oauth/client.json`, callback `https://chatgpt.com/connector_platform_oauth_redirect`, `token_endpoint_auth_method=private_key_jwt`, JWKS `https://chatgpt.com/oauth/jwks.json`, assinatura RS256 e domínios de metadados explícitos. **Não** trocar `private_key_jwt` por `none` para satisfazer artificialmente testes.
- Definição de **client policy** Keycloak estrita: executor `client-id-metadata-document`, condição `client-id-uri` HTTPS limitada ao domínio `chatgpt.com`, demais hosts de metadados estritamente autorizados, resource indicator exclusivamente o MCP gateway. Verificação local de contrato **não equivale a configuração aplicada nem a token ChatGPT real**.
- `tests/fwb-reg04c`: realm sem `site_id/connection_id` pré-carregados (obriga vínculo real), autenticação Keycloak de navegador automatizado, `wp-env` com WordPress e duas contas verdadeiras, TLS local confiável apenas na CI.
- Workflow `.github/workflows/fwb-reg04c-integrated.yml`: executa regressões unitárias, Keycloak verdadeiro, WordPress verdadeiro, PostgreSQL 16, emissão de novo token e teste MCP; contêineres e credenciais descartados.

## Regras de segurança

- **Nenhuma credencial de administrador WordPress persistida** no banco de dados. As Application Passwords de WordPress e o admin bearer Keycloak são utilizados somente na CI e não devem constar em issues, chats, Git ou logs.
- No projeto WordPress real de produção (forjamineirad20.com.br), **nenhuma instalação, credencial, escrita, query, deploy ou conexão é autorizada** neste bloco.
- O administrador Keycloak do laboratório usa token de admin-cli temporário. **Isso não é adequado a produção**: o serviço real precisa de client credentials isoladas com apenas `manage-users` (ou privilégio equivalente mínimo) e controles de auditoria e rotação. Não existe UI pública para inserir credenciais de usuários.
- O usuário precisa **reautorizar** o gateway após conectar o site para obter novo JWT `site_id/connection_id` e não reaproveitar sessão/token anterior.
- A implementação atual permite um vínculo ativo anunciado por assunto Keycloak; multi-sites simultâneos exigem uma seleção de conexão confiável no fluxo de autorização, ainda pendente.
- Desconectar bloqueia o gateway, mas **não revoga automaticamente** Application Password WordPress; concluir revogação de origem requer ação separada. Tokens expirados/replay/rotina IdP e requisitos LGPD/backup/egress também exigem revisão.
- A allowlist de hostnames do WordPress e o bloqueio de redirects não substituem DNS pinning/egress ACL para SSRF em staging público.

## Gate de encerramento

**PASS apenas para integração de laboratório** se o workflow comprovar numa única execução OAuth Keycloak, credenciais WP REST, PostgreSQL durável, sync real de `sub`/site, JWT atualizado, MCP real com leitura e revogação. O fluxo CIMD com cliente ChatGPT só poderá ser chamado de PASS após uma configuração de client policies **real no Keycloak** e um login do cliente usando documento CIMD e `private_key_jwt` testado. Validação de forma e leitura pública do documento apenas demonstram compatibilidade documental.

**NO-GO público** até TLS confiável e URL estável, provisionamento persistente, vault/KMS, conta de serviço mínima e audível, política Keycloak aprovada, revogação de Application Password, DNS/egress, consentimento e homologação **no ChatGPT normal**.

## Fontes técnicas
- https://www.keycloak.org/securing-apps/mcp-authz-server
- https://developers.openai.com/plugins/build/auth
- https://chatgpt.com/oauth/client.json (documento de terceiro, ler; **não replicar ou alterar**)
