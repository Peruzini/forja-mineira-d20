# FWB-04 — Homologação isolada e ativação controlada

Estado: **em homologação no GitHub, sem autorização para instalar/ativar em produção**.
Base empilhada: FWB-03 PR #16, branch feature/fwb-03-actions-wordpress-20261120.
Branch de homologação: test/fwb-04-ephemeral-staging-20261120.
Site público: https://forjamineirad20.com.br — nunca recebe operações do CI FWB-04.

## Escopo da homologação automatizada

- Workflow em .github/workflows/fwb-04-ephemeral-staging.yml.
- WordPress Docker + MariaDB descartáveis em .github/fwb-04/compose.yaml, expostos só em 127.0.0.1:18080 no runner privado temporário.
- Arquivos do plugin Forja WP Bridge v0.2.0 carregados da branch no contêiner, sem instalação no site público.
- Conta local de teste Contributor (edit_posts=true, publish_posts=false) com Application Password temporária.
- Testes REST automatizados: identidade autenticada, anonimato negado, política draft-only, dry-run, publicação rejeitada, obrigatoriedade da chave idempotente, criação/edição/replay e conflito, versão obsoleta, conteúdo Gutenberg, permissão sobre rascunho alheio e post publicado.
- Auditoria de criação e edição comprovada por leitura independente via WP-CLI.
- Banco, arquivos WordPress e senha efêmera destruídos ao fim do job.

## Limites

Este teste é laboratório técnico, **não** simula fielmente plugins adicionais, tema e segurança da hospedagem da Forja. Ele valida comportamento do Bridge em WordPress descartável, não prova autenticação REST externa ou integrações com Rank Math no domínio real.
Não há staging hospedado identificado no WPVibe, apenas o site de produção. A cota WPVibe permanece esgotada; não consumir reset reservado.
As ferramentas GitHub conectadas aqui não gerenciam secrets do repositório nem configuram required reviewers. Não declarar ambientes fwb-wp-read / fwb-wp-draft-write como preparados sem verificar suas regras.

## Critérios para liberação futura da ativação

1. Aprovação do PR #15 e PR #16, seguida desta homologação; **não executar merge automático**.
2. WordPress descartável com testes funcionais PASS, sem falhas críticas abertas.
3. Auditoria de segurança humana do código, incluindo controle de concorrência e restrições da API REST nativa.
4. Criar ambiente staging privado de verdade na hospedagem, ou homologação equivalente isolada, antes de instalar no domínio público.
5. Criar usuário WordPress técnico sem publish_posts; gerar senha de aplicação revogável, somente HTTPS, sem registrar em repo.
6. Criar GitHub environments, restringir branches, configurar required reviewers e prevent self-review antes de adicionar secrets.
7. Executar probe somente leitura, confrontar perfil e plugin/site; validar respostas 401/403/409.
8. Somente após autorização independente: instalar ZIP em staging, habilitar writes apenas para testes de rascunho; validar rollback da ativação sem remover o WPVibe.
9. Para a produção: autorização explícita adicional para deploy/ativação; manter FWB_ENABLE_DRAFT_WRITES desabilitada até aceitar fluxo real de escrita.

## Rollback futuro

Se for instalado em ambiente de staging/produção mediante aprovação, primeiro desabilitar FWB_ENABLE_DRAFT_WRITES e desabilitar o job apply-draft; revogar a Application Password da conta técnica; depois desativar o plugin Forja WP Bridge.
Não limpar manualmente as opções fwb_op_* nem postmeta _fwb_audit_event antes de preservar evidências; esses registros suportam reconciliação contra operações duplicadas. Preservar WPVibe ativo até homologação independente do fluxo REST.

**Critério de encerramento técnico:** CI e testes REST funcionais homologados, PR draft e documentação; ativação em produção permanece HOLD enquanto credenciais, aprovações e staging externo não existirem.
