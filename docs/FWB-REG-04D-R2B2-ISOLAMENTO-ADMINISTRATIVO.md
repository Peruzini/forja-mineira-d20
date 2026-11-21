# FWB-REG-04D-R2B2 — Isolamento do serviço administrativo (21/11/2026)

**Decisão de projeto:** o serviço administrativo é um módulo interno de Node, sem handler HTTP público e sem qualquer exportação de cliente SQL, credencial Keycloak ou token administrativo. Este PR é apenas de laboratório: rede privada, cofre de segredos e produção ainda **NO-GO**, mesmo com CI aprovada.

Base: PR draft #40 (R2B1-C1-R1). Entrega empilhada sem merge nem deploy.

## Modelo de ameaça e controles de aplicação

| Risco | Controle implementado | Limite |
| --- | --- | --- |
| Caller tenta atingir Admin API sem autorização | `makeR2B2VerifiedOnboarding` exige JWT de usuário real, assinatura, issuer, audience, escopo `sites:connect` e `sub` allowlisted; fachada expõe somente `attach`/`detach` | O código legado R2B continua no repositório, portanto a migração da composição dos serviços no staging exige prova R2C |
| Exposição de token client_credentials | Chamada interna ao R1 de privilégio mínimo e FGAP, sem cache compartilhado, sem exportação de token, e sem rota externa; dados sensíveis não entram no journal | A credencial deve vir de vault/secret manager num worker com acesso privado |
| GET→PUT simultâneo sobre mesmo usuário | PostgreSQL `pg_try_advisory_lock(bigint)` em conexão **dedicada** e mantida durante a chamada ao Keycloak; ambas as instâncias usam a mesma chave HMAC de configuração e a mesma base | Outros administradores externos que não usam a fachada não obedecem ao lock; a Admin REST não fornece CAS/ETag transacional para a operação |
| Falha após PUT, timeout ou perda da resposta | Linha durável `started` gravada **antes** da ação externa; quando possível atualiza para `manual_review`; em falha de DB o estado `started` sobrevive e impede nova operação | Requer reconciliação humana supervisionada; não há retry automático |
| Concorrência com falha de processo | Advisory lock liberado ao encerrar a sessão; linha `started` persistida bloqueia o próximo executor | Prova real de crash/HA em infraestrutura permanente ainda pendente |
| Vazamento de dados pelos logs | Journal com somente UUID aleatório da operação, HMAC SHA-256 do sujeito (chave separada), ação, estado, código fixo e timestamps; sem IDs, site, conexão, e-mails, tokens, corpo HTTP | Operadores do banco ainda devem ter privilégios e retenção limitados |
| Exclusão da auditoria pelo serviço | Papel runtime SQL com `SELECT`, `INSERT`, `UPDATE` apenas na tabela `fwb_admin_operation_log`, sem `DELETE`/DDL | Provisionamento do usuário do banco em produção ainda não comprovado |

**Importante:** flag de ambiente não substitui um isolamento de rede. O módulo não faz deploy nem cria TLS/ACL por si só.

## Código

- `mcp/fwb05-poc/reg04d-r2b2/isolated-admin.mjs` — fachada privada, locking por usuário, persistência e fail-closed, composição opcional de onboarding verificado.
- `mcp/fwb05-poc/reg04d-r2b2/schema.sql` — journal de operações e índice para pendências de reconciliação.
- `mcp/fwb05-poc/tests/reg04d-r2b2-isolation.test.mjs` — configuração e entradas não confiáveis são negadas antes de I/O.
- `tests/fwb-reg04d-r2b2/isolated-admin-e2e.mjs` — PostgreSQL 16 real e Keycloak 26.8.2 real descartável com FGAP; duas instâncias, attach/detach, auditoria, falha injetada pós-PUT, bloqueio de retry e papel SQL sem DELETE.
- `.github/workflows/fwb-reg04d-r2b1-native-profile.yml` — estende suíte de segurança integrada com PostgreSQL descartável.

## Invariantes operacionais

1. Invocar a fachada somente por serviço interno. Não aceitar `sub` de JSON público: usar `makeR2B2VerifiedOnboarding`.
2. O PostgreSQL deve empregar conexões dedicadas **session pooling**, nunca PgBouncer em transaction pooling, para os advisory locks.
3. Todos os executores devem usar a mesma HMAC key (32 bytes) e o mesmo banco. A chave da auditoria é independente das chaves de cifragem do WordPress.
4. Nunca registrar, retornar ou expor o bearer do Keycloak, `client_secret`, senha SQL, HMAC key ou conteúdo de HTTP no journal.
5. Uma operação `started` ou `manual_review` não pode ser repetida automaticamente. Para reconciliar, um operador independente cruza estado Keycloak, banco de conexões e registros, autoriza correção e registra evidências, sem endpoint de bypass.
6. Mudança de configuração do realm (`ADMIN_EDIT` histórico), permissões FGAP ou perfil nativo exige homologação separada; esta fachada **não substitui** a política de atributos nativa R2B1.

## Critérios de aceite de laboratório

Exigir `security-unit-build` e `keycloak-native-profile` com sucesso, incluindo os seguintes marcadores reais no job Keycloak/PostgreSQL:

- `REG04D_R2B2_REAL_CROSS_INSTANCE_CONCURRENT_ATTACH_SERIALIZED_PASS`
- `REG04D_R2B2_REAL_SCOPED_ADMIN_ATTACH_DETACH_PASS`
- `REG04D_R2B2_DURABLE_PSEUDONYMOUS_AUDIT_PASS`
- `REG04D_R2B2_REAL_UNKNOWN_PUT_OUTCOME_BLOCKS_RETRY_PASS`
- `REG04D_R2B2_PG_ROLE_CANNOT_DELETE_AUDIT_PASS`
- `REG04D_R2B2_INTERNAL_ADMIN_ISOLATION_LAB_PASS`

Na falta de qualquer prova, **FAIL/NO-GO**. Não considerar alteração de manifesto ou teste mockado prova de rede/ACL.

## Pré-requisitos de R2C: infraestrutura **não homologada**

- Colocar worker administrativo e Keycloak em rede privada, com ingress negado para Admin REST a partir da internet pública; liberar somente egress do worker ao Keycloak e PostgreSQL.
- TLS certificado em ambos os caminhos, política de firewall/ACL **testada de fora da rede** e segmentação de rede que impeça requests administrativos vindos do MCP público, WordPress e browser.
- Credenciais de serviço FGAP com query-users restrito e `kc-admin-api` somente no worker; armazenar no secret manager com ACL, rotação e histórico de acessos. Nunca inserir em GitHub ou aplicativo público.
- PostgreSQL não exposto, papel runtime com permissões da tabela somente, backups e retenção auditável; HMAC e credencial DB obtidos de vault separado.
- Health checks sem segredos, testes de serviço reiniciado em meio à transição, reconciliação controlada e failover; controle de outros escritores do mesmo realm para impedir concorrência fora do lock.
- Nenhum commit/merge para `main` ou alteração na instalação forjamineirad20.com.br antes desses gates.

## Evidência

**LAB PASS — [GitHub Actions #44930131319](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44930131319), 2/2 jobs SUCCESS, commit de código `9443aa9c38f08507c820e7a3b9f3b4d25e90e53b`.** Evidências efetivas: duas instâncias concorrentes serializadas, scoped FGAP attach/detach, journal pseudonimizado persistente, rejeição de nova chave HMAC, perda de resposta após PUT e proibição de retry, papel PostgreSQL sem DELETE, regressões de OAuth Account REST R2B1 e testes unitários/build. O sucesso no CI prova **mecanismo de software**, não uma rede privada implantada.

## Proteção contra rotação de chave e alteração do journal

A tabela adicional `fwb_admin_key_epoch` armazena somente um marcador HMAC irreversível de época. A fachada cria o registro único por `INSERT ... ON CONFLICT DO NOTHING` e compara o marcador antes de qualquer operação. Se os executores usam uma nova chave sem migração supervisionada, devolve `r2b2_audit_key_epoch_changed` e não alcança a Admin REST. **Nunca** trocar automaticamente esse registro para desbloquear o ambiente: reconciliar operações antigas, manter histórico e planejar a troca de epoch com DBA/auditoria independentes.

O índice de operações pendentes é **único** por `subject_digest`. O papel runtime recebe somente `SELECT/INSERT` na tabela de operações e `UPDATE(state,code,finished_at)`, além de `SELECT/INSERT` no marcador de época. Assim não pode excluir linhas, alterar o identificador da operação ou reescrever o sujeito pseudonimizado pelas permissões SQL concedidas.

**A evidência adicional** deve incluir `REG04D_R2B2_HMAC_EPOCH_MISMATCH_DENIED_PASS` em CI real. Esta prova não substitui vault e política de rotação em ambiente persistente.
