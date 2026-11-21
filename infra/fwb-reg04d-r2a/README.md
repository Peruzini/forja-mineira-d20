# FWB-REG-04D-R2A — inventário e preparação do staging

## Estado: gateway HTTPS isolado em modo **SHELL_ONLY**, OAuth/MCP **NO-GO**

### Recursos observados no provedor (21/11/2026)
- Vercel team **ur-25**, plano **Hobby**.
- POC legado: projeto `forja-wp-bridge-mcp-poc` (não alterado), deployment `dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN`, READY.
- Não foram encontrados domínios próprios registrados na conta nem conectores de banco/serviços no POC consultado; isso não comprova ausência de recursos externos em outros provedores.
- Novo projeto de staging **separado:** `forja-wp-bridge-staging-r2a`, ID `prj_pMM8V1gBN0YriKlPjQ3eK1nbyv38`.
- Deployment `dpl_4Ef9uAJ5N4NhzSkWufkZa2u9CprZ`, `READY`, alias `https://forja-wp-bridge-staging-r2a.vercel.app`. A plataforma usa rótulo de target `production` **dentro do projeto separado**, não corresponde ao WordPress de produção.
- Projeto não vinculado ao Git remoto, sem credenciais, sem WordPress ou Keycloak, nenhuma dependência runtime. `ssoProtection` desligado somente neste shell público, com endpoints estritamente não sensíveis. Preview deploys desativados.

### Contrato do shell (fonte versionada, Vercel por upload manual)
- `GET /api/status` responde 200, `SHELL_ONLY`, `NOT_CONFIGURED` e `DISABLED`.
- `/api/gateway-mcp` sempre responde 503 `staging_mcp_disabled`, inclusive em GET/POST/DELETE/OPTIONS.
- Não hospeda OAuth, não registra ferramenta, não aceita login, não armazena senhas.
- CI de contrato: `node --test infra/fwb-reg04d-r2a/test-shell.mjs`.
- CI de rede pública: `.github/workflows/fwb-reg04d-r2a-shell.yml` consulta o alias via HTTPS de um runner externo; valida certificado e respostas. Não testa a infraestrutura Keycloak/WP/Postgres porque ainda não existe.


## Homologação realizada no GitHub Actions

- **[Run #44918955996](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44918955996)** — **2/2 jobs SUCCESS**.
- `isolated-shell-contract`: 2/2 testes PASS, sem failures.
- `isolated-public-https-smoke`: runner externo consultou `https://forja-wp-bridge-staging-r2a.vercel.app/api/status` com validação da cadeia TLS e hostname; HTTP 200, JSON de shell, sem cache. Marcador `REG04D_R2A_PUBLIC_TLS_STATUS_SHELL_PASS`.
- Mesmo runner comprovou resposta HTTP 503 para GET, POST, DELETE e OPTIONS em `/api/gateway-mcp` com conteúdo `staging_mcp_disabled`. Marcador `REG04D_R2A_PUBLIC_MCP_FAIL_CLOSED_PASS`.
- Auditoria Vercel após deploy: **0 variáveis de ambiente e 0 conexões a serviços externos** no projeto `forja-wp-bridge-staging-r2a`; domínio nativo `vercel.app` verificado. Não há segredos nem aplicações de produção vinculadas.
- Evidência prova **HTTPS público e indisponibilidade intencional MCP**, não autenticação, login, federação ou persistência.

### Topologia de homologação **a provisionar em fornecedor próprio**

| Componente | Exposição e controle | Estado |
|---|---|---|
| MCP `https://forja-wp-bridge-staging-r2a.vercel.app/api/gateway-mcp` | HTTPS público, isolado da POC; bloqueado 503 até integração; a rota canônica `/api/gateway-mcp` coincide com REG-04 | Shell, somente |
| Keycloak `auth-stage.<domínio-de-testes>` | Serviço com estado fora de Vercel Functions, TLS real, realm separado; /admin acessível **somente pela rede privada** | Não provisionado |
| Onboarding | Backend **privado, próximo ao Keycloak** para operar Admin API; não deve estar exposto diretamente na Vercel pública | Não provisionado |
| WP `wp-stage.<domínio-de-testes>` | WP + MySQL descartáveis, TLS público, usuários de teste e Application Password distintas | Não provisionado |
| Bindings PostgreSQL | PostgreSQL 16, TLS com CA e domínio validado, tráfego restrito, persistência e backup; acesso específico de gateway e onboarding | Não provisionado |
| DNS e Vault | DNS dos três serviços, segredos só em runtime e logs redigidos, rotação e ACL egress | Não provisionados |

**Dependência arquitetural:** a Vercel Hobby oferece Functions para gateway HTTPS, mas não demonstra hospedar Keycloak/PostgreSQL/WordPress persistentes com rede administrativa privada. Não tentar encaixar esses serviços stateful no shell ou liberar Admin REST pela Internet para contornar isso.

**Componente Keycloak:** 26.8.2 continua incapaz de completar CIMD real do ChatGPT devido ao parser do campo `token_endpoint_auth_methods_supported`. Provisionar testes de rede sem alegar OAuth funcional. R2B deverá proteger a edição administrativa apenas dos campos de vínculo.

### Gates antes de qualquer integração
1. Selecionar e autorizar provedor de host persistente e domínio isolado **não de produção**. Se tiver custo/compra, pedir aprovação separada.
2. Provisionar Keycloak e WordPress próprios, PostgreSQL privado, DNS/TLS e vault fora do Git. Garantir que Vercel gateway consiga validar os certificados e acessar os endpoints autorizados sem expor Admin API.
3. Aplicar a preflight `infra/fwb-reg04d-r1/check-stage.mjs` com segredos apenas no provedor, comprovar saída DNS real e teste de isolamento.
4. Para promover o shell a MCP real, passar R2B (escopo de atributos/admin) e R2C (integração HTTPS, revogação e logs). Desbloquear CIMD com Keycloak oficial corrigido e teste ChatGPT real.
5. Manter PR em draft. Não modificar `forjamineirad20.com.br` nem o projeto PoC.

**NO-GO** para afirmar que existe staging OAuth funcional: apenas o shell público e seus testes existem agora.
