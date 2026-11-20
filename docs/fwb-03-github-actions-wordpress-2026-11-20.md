# FWB-03 — Integração GitHub Actions ↔ WordPress

**Estado:** candidata em PR draft, empilhada sobre FWB-02. Sem instalação, merge ou alteração de produção.
**Branch:** feature/fwb-03-actions-wordpress-20261120.
**WordPress alvo:** https://forjamineirad20.com.br.

## Entregas

- scripts/fwb_client.py: cliente independente do WPVibe, somente Python stdlib.
- .github/workflows/fwb-03-wordpress-actions.yml: testes offline + operações manuais isoladas.
- Plugin Forja WP Bridge 0.2.0: cabeçalho X-FWB-Idempotency-Key obrigatório em operações reais, ledger persistente em opções WordPress, log privado de cada alteração de rascunho.
- Testes offline PHP/Python e pacote ZIP de revisão, sem deploy.

## Operações previstas

1. plan: valida JSON editorial versionado e SHA-256, sem rede nem escrita.
2. probe: GET autenticado da REST API nativa /wp/v2/users/me?context=edit, sem gravar. Exige ambiente GitHub fwb-wp-read, com usuário e senha de aplicação.
3. apply_draft: **bloqueada por padrão** e somente disponível após workflow estar na main, revisão do conteúdo por SHA-256, configuração de ambiente com required reviewers e prevent self-review, credenciais da conta técnica, confirmação explícita e FWB_WRITE_ENABLED=true. Escreve somente rascunhos; não publica.

### Ações administrativas ainda NÃO realizadas

- Criar usuário WordPress dedicado com edit_posts=true e publish_posts=false (não usar administrador).
- Gerar Application Password revogável da conta técnica, somente via HTTPS.
- Criar ambiente GitHub fwb-wp-read com secrets FWB_WP_USERNAME e FWB_WP_APP_PASSWORD.
- Criar separadamente ambiente fwb-wp-draft-write: configurar required reviewers, prevent self-review, limites de branch, só então cadastrar secrets de escrita. Não foi verificada nem criada esta proteção.
- Manter FWB_WRITE_ENABLED desativada até autorização específica para escrita.
- Instalar o ZIP e habilitar o plugin em staging somente em FWB-04; não ativar flag FWB_ENABLE_DRAFT_WRITES em produção nesta etapa.

## Manifestos: contratos e aprovação

Local permitido: editorial/fwb/requests/<slug>.json (nenhum pedido real acompanha este PR).
Exemplo documental, NÃO usar como solicitação de produção:

    {
      "operation_id": "forja_news14_20261120_v1",
      "operation": "create",
      "fields": {
        "title": "Título do rascunho",
        "content": "<!-- wp:paragraph --><p>Conteúdo editorial revisado</p><!-- /wp:paragraph -->",
        "excerpt": "Resumo"
      }
    }

Para update: operation=update, post_id positivo e expected_modified_gmt UTC lido do rascunho. O operation_id é estável (12 a 80 caracteres) e exclusivo por pedido; não reutilizá-lo para outra operação.

O SHA-256 do workflow corresponde aos bytes UTF-8 do arquivo inteiro, não ao hash de campos. Se o conteúdo mudar, precisa de nova revisão. Não são permitidos status, author, meta, ações em páginas, plugin/tema ou Rank Math.

## Segurança e limites

- Cliente usa URL https fixa, bloqueia redirects e não imprime segredos ou corpos de erros HTTP.
- Antes de escrever, valida no WordPress que a conta técnica possui edit_posts=true e publish_posts=false; valida que o Bridge está instalado com política draft_only, writes_enabled=true e idempotência ativa.
- Bridge também exige flag FWB_ENABLE_DRAFT_WRITES=true (desabilitada por padrão). Rejeita alterações em posts publicados.
- Ledger utiliza add_option com chave HMAC baseada no identificador de operação, reapresenta recibo de operação concluída e recusa operações pendentes/incertas. Não há purge automático para não perder proteção contra duplicidade.
- Eventos de escrita são guardados em postmeta protegido _fwb_audit_event; não há trilha de auditoria imutável externa.
- O controle expected_modified_gmt não é uma trava transacional. Concorrência, falha parcial, timeouts, reexecução e cache precisam de testes em staging.
- A REST API nativa pode publicar caso a conta tenha permissão; **o menor privilégio na conta WordPress é indispensável**, independentemente do plugin.
- GitHub environments só oferecem aprovação se as regras forem realmente configuradas; citar environment no YAML não basta.
- Workflows com workflow_dispatch só serão acionáveis normalmente após o arquivo integrar a branch default mediante aprovação futura. Nenhuma requisição remota com credenciais foi realizada.
- WPVibe instalado e reset não utilizado.

## Gates de homologação

- [ ] Lint PHP, teste validador, teste ledger e unittest Python aprovados.
- [ ] ZIP v0.2.0 verificado como pacote apenas de revisão.
- [ ] PR draft revisado, sem merge automático.
- [ ] Environments, required reviewers e contas técnicas configurados e auditados.
- [ ] Probe autenticado confirmado.
- [ ] Homologação de 401/403/409, idempotência, auditoria e controle de edição no staging.

**Critério de conclusão FWB-03:** código de integração e CI offline validados; autenticação real e escrita só após configuração, instalação e autorização subsequente.
