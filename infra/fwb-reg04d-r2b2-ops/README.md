# FWB-REG-04D-R2B2-OPS — Isolamento privado e prova operacional

**Estado (21/11/2026): candidate de implantação, sem host persistente provisionado. Rede, vault, banco persistente e TLS público real ainda NO-GO.**

Base: PR #41, que homologou o mecanismo R2B2 com Keycloak e PostgreSQL descartáveis. Este bloco **não implanta** nem altera o projeto Vercel de staging, o POC MCP ou o WordPress de produção.

## Inventário real verificado

- Vercel UR-25 / Hobby: projetos `forja-wp-bridge-mcp-poc` e `forja-wp-bridge-staging-r2a`.
- `forja-wp-bridge-staging-r2a`, projeto `prj_pMM8V1gBN0YriKlPjQ3eK1nbyv38`, tem o deployment `dpl_4Ef9uAJ5N4NhzSkWufkZa2u9CprZ` em READY. É o shell HTTPS isolado: `/api/gateway-mcp` retorna 503 até R2C/R3.
- No staging Vercel foram observadas **0 variáveis de ambiente** e ausência de firewall personalizado. Não foi identificado Keycloak, PostgreSQL, host administrativo ou vault persistente nos projetos acessíveis. Isso **não comprova** ausência de recursos em um provedor não conectado.
- O plano Hobby e as funções/serverless existentes **não constituem** por si só uma rede privada entre gateway, Keycloak e PostgreSQL. Não provisionar plano pago/PrivateLink/Secure Compute ou contratar VPS sem aprovação específica de custo/provedor.

## Artefatos preparados

| Arquivo | Finalidade |
| --- | --- |
| `Caddyfile` | Proxy público *allowlist*: apenas `/realms/<realm>`, seus subcaminhos e `/resources/*`; `/admin/`, `/realms/master/`, métricas, health e rotas desconhecidas não são encaminhadas |
| `compose.staging.yaml` | **Candidato não implantado**, com redes `edge`, `auth-restricted` e `admin-private`, Keycloak e duas bases PostgreSQL sem portas de host, proxy Caddy como única entrada; requer `--profile candidate` |
| `verify-topology.test.mjs` | Verifica topologia fail-closed, ausência de portas administrativas publicadas e placeholders de segredos |
| `external-https-probe.mjs` | Teste **externo** de TLS confiável, emissor OAuth exato e negativa 404 para Admin/Master/health/rotas alheias; sem credenciais |
| `.github/workflows/fwb-reg04d-r2b2-ops.yml` | Prova de contrato do Compose e teste do **mesmo Caddyfile** diante de Keycloak 26.8.2 descartável no runner (HTTP loopback sintético) |

### Por que o Compose não é um deployment GO

Este Compose é uma **referência de segmentação**, propositalmente no perfil `candidate`. Não existe host, DNS real, certificado ACME validado de fora, vault de produção, backup/recovery, TLS backend PostgreSQL ou runtime worker R2B2 operacional integrados nesta etapa. Os `env_file` são somente interfaces de injeção via arquivo temporário; **não** equivalem a um cofre de segredos e podem ser vistos por um administrador da máquina ou por `docker inspect`.

Nenhum caminho usa credenciais reais. Arquivos de vault devem ser colocados em diretório de runtime fora do repositório, protegidos por ACL e injeção do provedor, e apagados com segurança segundo política do operador. Os arquivos precisam injetar `KC_DB_PASSWORD`, `KC_BOOTSTRAP_ADMIN_USERNAME`, `KC_BOOTSTRAP_ADMIN_PASSWORD` no Keycloak; `POSTGRES_PASSWORD` específico nas bases Keycloak e journal. Nunca reutilizar senha entre serviços.

**Não executar `docker compose up` neste projeto de template sem revisões adicionais.** A CI executa somente `docker compose config --quiet` com credenciais sintéticas e jamais sobe o candidate.

## Provas que a CI pode afirmar

- Real Keycloak 26.8.2 na máquina descartável do GitHub Actions, ingress Caddy real usando a mesma política de produção candidata.
- Requisições HTTP ao ingress de laboratório para `/admin/`, `/admin/realms/master`, `/realms/master/...`, métricas e outros realms são negadas com 404.
- Discovery do realm permitido é encaminhada.
- Compose é sintaticamente válido e não publica portas de host para o Keycloak ou para as duas bases, segundo o contrato e a inspeção de configuração.
- Testes de laboratório **não** provam HTTPS público real, VPC/ACL de fornecedor, cofre, TLS Keycloak↔PostgreSQL, backup ou isolamento multi-host. Todos ainda dependem do provedor real.

## Sequência para habilitar staging persistente depois da aprovação de infraestrutura

1. **Provedor e custos:** selecionar um host/VPC persistente não produtivo com DNS independente; aprovar contratação, localização/região, backups e plano de recuperação. Não usar a conta WordPress de produção como host administrativo.
2. **DNS e TLS:** reservar hostname de autenticação de staging e permitir ACME na porta 443, com certificados confiáveis. Não expor Admin REST, `/realms/master/` ou as portas 8080/5432. Garantir que o gateway Vercel consiga buscar somente JWKS, OIDC e serviços autorizados.
3. **Vault:** provisionar segredos exclusivos Keycloak, PostgreSQL, journal, `fwb-onboarding` e chave HMAC; rotação, auditoria de acesso e política de não exposição em logs/CI. Nunca compartilhar credencial administrativa com Vercel ou WordPress.
4. **Banco e permissões:** executar `mcp/fwb05-poc/reg04d-r2b2/schema.sql` sob identidade de migração separada; instalar papel runtime `SELECT/INSERT/UPDATE` estritamente limitado e **sem DELETE**. TLS do cliente para Postgres com CA, hostname e certificado verificados; backups e teste de restore.
5. **Rede e worker:** conectar o worker R2B2 privado ao Keycloak/Admin API e Postgres. Permitir somente origens internas autorizadas e bloquear qualquer bypass por proxy, Vercel, Internet ou cliente WordPress. Instrumentar logs e retenção sem tokens ou PII; vigiar `manual_review` e `started`.
6. **Comprovações independentes:** validar egress e ingress por *dois pontos de vista*: dentro da rede com credencial temporária de privilégio mínimo, e de outro host externo sem credenciais. Prova administrativa positiva interna, negativa pública, negativa entre tenants, recuperação de falhas, concorrência após restart e rotação.
7. **Gate público obrigatório:** somente após DNS e HTTPS reais, rodar de máquina externa:
   ```bash
   FWB_OPS_AUTH_HTTPS_ORIGIN=https://auth-stage.SEUDOMINIO.tld/ \
   FWB_OPS_REALM=fwb_stage \
   node infra/fwb-reg04d-r2b2-ops/external-https-probe.mjs
   ```
   O script exige certificado válido, `issuer` igual à origem e 404 para caminhos administrativos. Esse PASS ainda não substitui acesso interno, egress e banco.
8. **R2C:** homologar integrada e separadamente WordPress de staging, PostgreSQL TLS, revoke, auditoria real e gateway MCP antes de abrir ferramentas. **R3** depende também de CIMD/OAuth ChatGPT normal.

## Critério de decisão

- **LAB GO:** CI de topologia e ingress real descartável verdes.
- **OPS GO:** somente quando houver host persistente verificado, vault, TLS em todos os pontos exigidos, política de rede efetiva, worker privado funcional, PostgreSQL permanente, backup e auditoria, e probes internos e externos com evidência. A aprovação de laboratório não promove automaticamente para OPS GO.
- **PRODUÇÃO / R3 NO-GO:** não realizar merge, deploy de produção nem exposição do MCP até aprovações específicas.

Referências: [Keycloak, reverse proxy](https://www.keycloak.org/server/reverseproxy) (a documentação recomenda não expor a Admin API nem o realm master) e [Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
