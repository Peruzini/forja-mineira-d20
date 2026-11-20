# FWB-04B — Preparação da conexão REAL Forja WP Bridge

Data: 20/11/2026
Situação: implementação de pré-verificação pública e endurecimento do probe autenticado; **HOLD para credenciais e ativação real**.
Base empilhada: PR #17 FWB-04, que depende dos PRs #16 e #15.
Branch FWB-04B: audit/fwb-04b-conexao-real-20261120.
Site fixo: https://forjamineirad20.com.br.

## 1. Evidências do diagnóstico anterior

- FWB-02 + FWB-03: plugin 0.2.0, REST draft-only, ledger de idempotência e scripts GitHub Actions validados offline; PRs #15/#16 em draft, sem merge.
- FWB-04: 24/24 testes REST e dois eventos de auditoria em WordPress/MariaDB descartáveis, sem publicações indevidas; PR #17 em draft.
- WPVibe: única instalação conectada é forjamineirad20.com.br; cota 114/100, 0 operações restantes (20/11); reset reservado, não utilizar.
- O acesso GitHub conectado não fornece ações para gerenciar environments, cadastrar secrets ou configurar reviewers. Não inferir que essas configurações já estejam feitas.
- O plugin Forja WP Bridge não está homologado nem instalado na hospedagem pública.

## 2. Entregas FWB-04B

- scripts/fwb_public_preflight.py: teste sem credenciais, sem escrita, HTTPS e URL fixos, 3 GETs públicos em /wp-json/, /wp-json/wp/v2/types?context=view e /wp-json/wp/v2/users/me?context=edit (o último deve negar anônimos). Não segue redirects e não imprime respostas brutas.
- scripts/tests/test_fwb_public_preflight.py: verificações offline da allowlist, TLS/host fixo, ausência de Authorization, redirecionamentos bloqueados, JSON inválido e recusa de exposição anônima.
- scripts/fwb_client.py: reforço do modo probe autenticado, que só aprova conta com edit_posts=true e publish_posts=false (conta administradora rejeitada).
- .github/workflows/fwb-04b-readiness.yml: testes offline e preflight público separados, sem referência a secrets ou write jobs.
- O teste público confirma apenas a possibilidade de alcançar endpoints GET anônimos do WordPress; NÃO é teste de Application Passwords, autenticação de usuário nem comunicação com o Bridge.

## 3. Como preparar a hospedagem real — ações do proprietário

### 3A. Staging separado (NÃO o WordPress público)

1. No painel da Hostinger, verificar se a hospedagem oferece Staging WordPress. Se não houver, provisionar subdomínio separado com autenticação por senha/VPN e banco/arquivos isolados, sem reaproveitar segredos de produção.
2. Antes de copiar conteúdo, criar backup consistente de arquivos e banco. Se houver dados pessoais, restringir acesso e remover/mascarar dados na cópia; evitar copiar tokens e Application Passwords de produção.
3. Bloquear indexação por controles do servidor, não apenas robots.txt/noindex, e impedir envios de e-mail, webhooks, pagamentos e crons externos na cópia.
4. Registrar URL e versão reais, PHP, WP, plugins e cache; comparar com o ambiente descartável.
5. Testar ZIP 0.2.0 e rollback somente no staging após autorização específica. Não instalar candidato diretamente no domínio público.

### 3B. Conta técnica WordPress com privilégios mínimos

1. Em WordPress: **Usuários → Adicionar novo usuário**. Nome sugerido: fwb-servico. Usar e-mail controlado e senha forte/2FA para login ao painel.
2. Atribuir inicialmente o papel **Colaborador (Contributor)**, não Administrador/Editor. Verificar capacidades reais: edit_posts=true, publish_posts=false; não presumir permissões de uploads ou outros plugins.
3. No perfil da conta, em **Senhas de aplicação**, criar uma senha revogável para FWB GitHub Read. Usar apenas HTTPS.
4. Copiar a senha DIRETAMENTE para o Secret do GitHub, nunca para conversa, issue, commit, documento, Actions output ou artefato.
5. Antes do primeiro probe, conferir que o usuário não é administrador e não tem publish_posts; o cliente FWB-03 agora falha quando há privilégio excessivo.
6. Se Application Passwords estiver indisponível, registrar motivo (plugin/host/HTTPS/WAF) e manter HOLD; não substituir por senha principal do usuário.

### 3C. Ambientes do GitHub

Repositório: https://github.com/Peruzini/forja-mineira-d20/settings/environments

**Ambiente de leitura: fwb-wp-read**
- Criar environment; restringir execução à main após revisão/merge (ou a um ref homologado específico, se aprovado).
- Criar environment secrets FWB_WP_USERNAME e FWB_WP_APP_PASSWORD contendo conta técnica de acesso restrito.
- O workflow FWB-03 possui mode=probe e executa GET /wp/v2/users/me?context=edit via HTTPS; nenhum POST.
- Verificar que o token não é exposto nos logs. Revogar a senha de aplicação após diagnóstico, se não houver intenção de conexão contínua.

**Ambiente de escrita: fwb-wp-draft-write**
- Não criar credenciais de escrita neste bloco. Configurar primeiro Required reviewers, Prevent self-review e deployment branch policy (main apenas), confirmar que a proteção está de fato ativa e que outra pessoa pode aprovar.
- Deixar variável FWB_WRITE_ENABLED AUSENTE (ou false). NÃO habilitar FWB_ENABLE_DRAFT_WRITES no WordPress.
- Nunca utilizar a conta administradora já conectada ao WPVibe para este ambiente.
- O simples texto "environment: fwb-wp-draft-write" no YAML NÃO configura as regras de proteção; sem essas regras, NÃO é seguro cadastrar secrets.
- Conexão de escrita, ativação do plugin e publicação exigem aprovações explícitas posteriores.

## 4. Ordem de execução da conexão real após autorização

1. Revisar PRs empilhados #15 → #16 → #17 → #18 com CI PASS e auditoria de segurança. Não fazer merge automático.
2. Preparar staging e conta técnica, armazenar segredos de leitura em fwb-wp-read.
3. Após merge independente aprovado para workflows, executar **mode=probe** na main; exigir edit_posts=true e publish_posts=false. Esse diagnóstico não usa WPVibe.
4. Conferir logs de autenticação e prova de REST; se HTTP 401/403/404, verificar bloqueio de Basic Auth por CDN/WAF, conta e Application Password em vez de elevar permissões.
5. Instalar Bridge no staging (somente após autorização), validar 401/403/409, auditoria, idempotência, criação e edição de draft, rollback e conflito de versão.
6. Somente então decidir em bloco separado sobre instalação em produção, com confirmação adicional. Nunca instalar ou publicar automaticamente.

## 5. Critérios e limites

- **PASS possível neste bloco:** REST pública acessível de GitHub Actions e  testes de segurança offline.
- **PENDENTE:** staging externo, credenciais read-only/restritas, environments protegidos e probe autenticado; não há conexão real sem esses itens.
- **HOLD:** qualquer escrita, criação de usuário no WordPress público, manipulação de Secrets, ativação do Bridge em produção, ou merge na main sem decisão específica.
- **Rollback futuro:** primeiro desativar workflows/variáveis de escrita, revogar Application Password, desativar plugin; preservar metadados de auditoria e histórico para reconciliação. WPVibe permanece instalado.

## 6. Referências

- https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
- https://developer.wordpress.org/advanced-administration/security/application-passwords/
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments

**Resultado final planejado:** se o preflight público passar, a conectividade externa anônima está confirmada. Credenciais e integração autenticada real continuam separadas e requerem configuração administrativa autorizada.


## 7. Evidências executadas — diagnóstico público FWB-04B

- Run GitHub Actions #44799798338 (push): **FAIL transitório**, erro de rede/TLS do runner (OSError); não indica falha de autenticação WordPress.
- Run GitHub Actions #44799859297 (pull_request): **PASS** em verificação pública.
- Run GitHub Actions #44799983969 (pull_request, commit de correção): **PASS**, teste público e unit tests.
- Run FWB-03 #44799983954 (pull_request): **PASS**, testes offline da integração.
- Resposta REST index: HTTP 200, namespace wp/v2 exposto, suporte Application Passwords anunciado (não comprovado funcionalmente).
- GET de /wp/v2/types: HTTP 200 e tipo post confirmado.
- GET sem credenciais de /wp/v2/users/me?context=edit: HTTP 401, sem revelação da identidade.
- Zero credenciais usadas; 3 requisições GET públicas por execução, sem POST/PUT/DELETE e sem chamada WPVibe.

**Gate atingido:** conectividade pública da REST API = PASS (após falha transitória inicial). **Gate ainda não atingido:** autenticação real do usuário técnico por Application Password, criação de staging hospedado, ambientes protegidos e eventual ativação. Nenhum deploy/merge.
