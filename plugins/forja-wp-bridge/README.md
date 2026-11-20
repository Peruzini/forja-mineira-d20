# Forja WP Bridge — FWB-02

Plugin WordPress experimental para a **Forja Mineira D20**, versão 0.2.0. **Não está instalado em produção** e não deve ser ativado sem FWB-04.

## Escopo propositalmente restrito

- Autenticação: a nativa do WordPress REST API (preferencialmente Application Passwords em HTTPS); nenhum token customizado.
- Autorização: usuário autenticado com edit_posts; para rascunho específico também edit_post.
- Consultar status e rascunho individual (sem endpoints públicos novos).
- Validar payload editorial sem escrita.
- Criar/alterar **somente rascunhos de posts padrão**, com dry_run=true por padrão.
- Sem suporte a publicar, aprovar posts, editar páginas, mídia, SEO, redirecionamentos, plugins ou tema.
- Não fornece acesso MCP por si só.

## Fail closed

Por padrão, **nenhuma escrita é permitida**, inclusive após instalar e ativar o plugin. Para habilitar os comandos de escrita de rascunhos, é necessária configuração administrativa explícita em wp-config.php:

    define( 'FWB_ENABLE_DRAFT_WRITES', true );

**Não incluir essa configuração no GitHub.** É um passo futuro de homologação com autorização do proprietário. Mesmo com a flag, a API do Bridge força post_status=draft e rejeita atualização de posts que não sejam drafts. Recomendado usar uma conta de serviço exclusiva com permissões de editor/autor ajustadas, sem publicação, e senha de aplicação revogável.

## Rotas previstas (somente após instalação)

Base: /wp-json/forja-bridge/v1

| Método | Rota | Comportamento |
|---|---|---|
| GET | /status | Informações mínimas de capacidade (autenticada) |
| POST | /drafts/validate | Validação estrita; nunca escreve |
| POST | /drafts | Valida; default dry_run=true; com flag e dry_run=false cria rascunho |
| GET | /drafts/{id} | Lê somente rascunho com edit_post |
| POST | /drafts/{id} | Valida; com flag, dry_run=false e versão atualizada, edita rascunho |

Enviar Content-Type: application/json; somente title, content, excerpt, slug e dry_run são permitidos. Para alteração real também enviar expected_modified_gmt no formato UTC retornado em GET.

Exemplo **sem escrita** (após instalação e conexão autorizada):

    curl --fail-with-body --user "$WP_USERNAME:$WP_APP_PASSWORD" \
      -H 'Content-Type: application/json' \
      -d '{"title":"Teste FWB","content":"Rascunho exemplo","dry_run":true}' \
      'https://forjamineirad20.com.br/wp-json/forja-bridge/v1/drafts'

Não colocar credenciais em logs, comandos compartilhados ou artefatos de CI.

## Limitações e gates

- O WordPress pode disponibilizar a API nativa /wp/v2/posts fora do Bridge. O controle de publicação exige limitar as permissões da conta de serviço, não apenas usar esta API.
- Ainda **não há chave de idempotência** para criação nem registro de auditoria persistente; chamadas reais não devem ser automatizadas antes de FWB-03. A ação fwb_draft_written permite integrar auditoria posteriormente.
- Conflitos de atualização são checados por post_modified_gmt; não constitui trava transacional.
- O plugin não expõe metadados Rank Math, mídia nem dados de autenticação.
- Não executar testes de escrita em produção no FWB-02. A flag de escrita deve permanecer desativada.
- FWB-03: fluxo externo com credenciais segregadas, idempotência e aprovação; FWB-04: staging, segurança e homologação.

## Testes e empacotamento

    php -l forja-wp-bridge.php
    php -l includes/class-fwb-validator.php
    php -l includes/class-fwb-rest-controller.php
    php tests/validator-test.php

O GitHub Actions executa lint e testes, empacotando ZIP instalável para inspeção. Não implanta nem ativa o plugin.


## FWB-03 — Ledger de idempotência e auditoria (v0.2.0)

Qualquer chamada real (dry_run=false) exige header X-FWB-Idempotency-Key (12–80 caracteres, letras/números/_/-). O servidor reserva o identificador por add_option (chave única). Solicitações repetidas com mesmo identificador e corpo retornam o recibo anterior, sem nova escrita. Reuso do identificador com outro corpo, operações pendentes ou indeterminadas retorna conflito e exige reconciliação humana — nunca retry automático. Identificadores ficam registrados em wp_options sem autoload; não eliminar registros indiscriminadamente, pois isso anularia a proteção antirreplay.

Após cada escrita, grava-se evento privado _fwb_audit_event no postmeta (horário UTC, usuário, tipo, identificador anonimizado). Sem capturar o conteúdo editorial ou credenciais. Falha no registro obriga reconciliação manual.

**Importante:** a checagem expected_modified_gmt não é trava transacional de banco; atualizações concorrentes ainda exigem teste e mitigação em staging. A integração NÃO publica; o workflow de escrita não deve ser autorizado até configurar ambiente GitHub com revisores, segredos de conta técnica sem publish_posts e autorização específica para a operação. O WPVibe permanece instalado.
