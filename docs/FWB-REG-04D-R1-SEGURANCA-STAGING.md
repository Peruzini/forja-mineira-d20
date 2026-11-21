# FWB-REG-04D-R1 — Segurança e infraestrutura de staging (21/11/2026)

**Veredito: LAB PASS; staging público e ChatGPT normal NO-GO.**

## PR e evidências verificadas

- [PR #35 draft](https://github.com/Peruzini/forja-mineira-d20/pull/35), empilhado sobre [PR #34](https://github.com/Peruzini/forja-mineira-d20/pull/34). Nenhum merge, deploy ou alteração em WordPress de produção.
- [CI 44916125993](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44916125993), commit `409e388d8e8c3d31de6bd3d321fc7ef815bcf9aa`: **2 jobs success**.
- `security-unit-build`: **63 testes descobertos, 61 PASS, 0 FAIL, 2 SKIP** (dependem de outra infraestrutura); `npm run build` Next.js PASS.
- `keycloak-scoped-fgap-v2`: **PASS** com Keycloak 26.8.2 verdadeiro e HTTPS confiado **somente no runner**. Logs `REG04D_R1_BUILTIN_KC_ADMIN_API_SCOPE_ATTACHED`, `REG04D_R1_SERVICE_NO_GLOBAL_ADMIN_PASS`, `REG04D_R1_KEYCLOAK_FGAP_V2_RESOURCE_PERMISSION_CREATED`, `REG04D_R1_FGAP_SCOPED_ATTACH_DETACH_PASS`, `REG04D_R1_FGAP_FOREIGN_USER_AND_CLIENTS_DENIED_PASS`.

## Implementações

1. **Service account Keycloak `fwb-onboarding`** com `client_credentials` e segredo exclusivamente interno. `scoped-service.mjs` rejeita bearer administrativo legado, password grant, issuer e client arbitrários, tokens sem audiência correta, sem `kc-admin-api`, muito longos, expirados, com `realm-admin` ou `manage-users` e acesso a `sub` não aprovado. Obtém token novo para cada operação, sem persisti-lo.
2. **FGAP v2 real, por usuário**. No Keycloak 26.8.2, o cliente precisa do escopo embutido `kc-admin-api`, cujo token deve ter audiência exata `https://{issuer}/admin/realms/{realm}`. A CI associa o escopo via Admin API, habilita FGAP, atribui apenas `query-users` como papel de entrada (não `view-users`, `manage-users`, `realm-admin`) e cria permissão `view/manage` somente para conta elegível. A conta autorizada pode ser vinculada e desvinculada; conta externa, API de clientes e edição do realm são negadas.
3. **Proteção do egress MCP** em `pinned-egress.mjs`: restrição das URLs exatas para JWKS do issuer e REST de posts/identidade WordPress previamente permitido, rejeição de redirects, destinos IP privados, link-local, CIDRs reservados, IPv4 mapeado e DNS misto; conexão com resolução DNS validada no callback do Undici Agent e hostname TLS preservado. A rota MCP só ativa esse transporte sob os gates R1 e retorna 503 se o egress exigido faltar. **Unit tests não demonstram ACL na infraestrutura pública.**
4. **Preflight de configuração de staging** `staging-preflight.mjs`, `infra/fwb-reg04d-r1/staging.env.example` e `check-stage.mjs`: valida hosts separados da produção e não fictícios, Keycloak/WordPress/MCP HTTPS, Postgres não local, armazenamento cifrado, segredos e três atestações explícitas de revisão. O retorno é intencionalmente `CONFIGURATION_REVIEWED_NOT_DEPLOYED`; **não cria recursos nem atesta disponibilidade real**.

## Limitações e riscos residuais

- **FGAP v2 limita quais usuários são gerenciáveis, mas `manage` autoriza modificações amplas no usuário elegível**; não é privilégio mínimo em nível de campo. Antes de expor onboarding público, implementar serviço interno limitado exclusivamente aos atributos `fwb_site_id` e `fwb_connection_id`, com vínculo ao sujeito assinado, auditoria, antirreplay, controles de sessão e revisão de privilégios.
- `query-users` autoriza operações de descoberta de contas conforme semântica da API; negar GET de conta externa não comprova ausência de listagem/metadados por outras rotas. Restringir e testar enumeração, acesso a grupos, roles e permissões em staging persistente.
- O token é verificado pelo Keycloak Admin API, que executa assinatura/FGAP. Os checks de claims decodificadas no cliente Node são **defesa complementar, não verificação criptográfica independente**.
- Administração Keycloak requer ACL privada, proxy interno e client secret de vault. O módulo atual pressupõe acesso HTTPS à rota admin do emissor e **não** configura isolamento de rede por conta própria.
- Proteção DNS/egress do gateway está coberta por testes de unidade e **não substitui** ACL externa, certificado público, restrições Keycloak CIMD/JWKS, backups, KMS, migrações DB, observabilidade ou gestão real de rede.
- **Não existe staging público implantado/atestado:** falta domínio autorizado, DNS/TLS real, instâncias Keycloak/WordPress/Postgres, KMS/vault, política de saída, IP e certificados verificados e credenciais provisionadas com autorização.
- **CIMD real do ChatGPT permanece bloqueado no Keycloak 26.8.2** ao interpretar `token_endpoint_auth_methods_supported` no documento público. Não foi testada troca `private_key_jwt` nem sessão pelo ChatGPT normal. Consultar [PR #34](https://github.com/Peruzini/forja-mineira-d20/pull/34).
- Nenhuma credencial de usuário/produção foi incorporada ao Git; apenas credenciais fictícias em realm descartável da CI. Destruição do runner não comprova política de produção.

## Próximo gate

**FWB-REG-04D-R2 — Staging HTTPS isolado e homologação operacional:** primeiro obter permissão explícita e domínio próprio de staging, então provisionar Keycloak/WordPress/Postgres/vault/rede e realizar smoke HTTPS real e segurança de FGAP/atributos. Não tocar no WordPress de produção; não promover PRs enquanto pendências não fecharem. O CIMD do ChatGPT continua um gate separado ligado à correção oficial do Keycloak.

Roteiro de provisionamento e modelo de variáveis (sem segredo): `infra/fwb-reg04d-r1/README.md` e `staging.env.example`.
