# ARQ-01B — Reconciliação de Builds e Guias (2026-11-20)

**Estado:** inventário e auditoria de candidatos concluídos; **HOLD para sincronização de código**, até comparação com a árvore realmente instalada no WordPress.  
**Modo:** somente leitura das fontes; este PR altera exclusivamente a documentação. Não instalar ZIP, não alterar URLs, não efetuar merge/deploy, não habilitar `FMB_DOOM_REVIEW_MODE`.

## 1. Fontes e prevalência

- Fonte operacional do plugin instalado: árvore de arquivos e metadados **da instalação WordPress**, a recuperar/conferir por hash quando o acesso administrativo for liberado.
- Fonte versionada: GitHub `main`, lido diretamente em 20/11/2026.
- Arquivos de comparação: Biblioteca, manifestos e ZIPs do Google Drive. `CANDIDATA` e `TESTE-NAO-PUBLICAR` não significam produção.
- Histórico: `docs/wordpress-production-sync-2026-11-20.md` da branch SYNC-01, relatório de Guias 1.2.6 e documentação B2/DOOM-FINAL-01.

| Componente | WordPress (inventário anterior, **não relido neste bloco**) | GitHub `main` (cabeçalho verificado) | Fontes de comparação | Diagnóstico |
|---|---|---|---|---|
| Builds | 2.3.32-rc.1 | 2.3.28 | ZIP candidato 2.3.32-rc.2-DOOM-FINAL-01 | Divergência; conteúdo instalado completo NÃO conferido |
| Guias/Hub | 1.2.6 (inventário 20/11; documento 13/11 registra 1.2.5) | 1.2.4 | ZIP candidato 1.2.6-TALENTOS | Versão ativa precisa confirmação; candidato NÃO homologado automaticamente |

## 2. Guias 1.2.6 — pacote integral agora localizado

- **Drive / Assets / 09_Hub_Guias:** https://drive.google.com/file/d/1dHhi5NV4b8Y753fbJFlhnmJE-zKd1dW3/view
- Nome: `forja-mineira-guias-v1.2.6-CANDIDATA-TALENTOS.zip`
- Integridade ZIP: PASS; 30 entradas regulares (3 PHP, 2 JS, 2 CSS, 2 JSON, 17 WebP, documentos); SHA-256: `c920fda2c775dfc0736b5c3e941351e63d4e35666fc27b020d2f8f1e242c21ff`.
- Validação local reproduzida: PHP 3/3 PASS, JavaScript 2/2 PASS, JSON 2/2 PASS.
- De 8 arquivos amostrados contra hashes de blobs em `main`, **5 idênticos e 3 divergentes**. Idênticos: `templates/guide-warlock-items.php`, `assets/css/guide-warlock-items.css`, `assets/js/guides-hub.js`, `assets/js/rank-math-integration.js`, `assets/images/feats.webp`. Divergentes: `forja-mineira-guias.php`, `templates/guides-hub.php`, `assets/css/guides-hub.css`.
- Comportamento de candidata analisado: `fmg_get_public_warlock_feats_guide()` exige página WP ID 318 publicada, shortcode `[forja_guia_talentos_bruxo_2024]`, permalink válido e canonical Rank Math compatível; ordem de cards por data de publicação com desempate estável.
- Relatório original (13/11): https://docs.google.com/document/d/11rurO3Mg6Uk0GcG0rq7BXdYNcrgBh7yzOXzPX2om_5Q/edit. Registra **candidata offline NÃO instalada** naquele momento, quando o WP estava em 1.2.5. Já o inventário do SYNC-01 (20/11) diz 1.2.6 ativo. **Resolver esta divergência temporal com hash da instalação atual**; não presumir instalação do ZIP encontrado.
- Gate UX: geometria do quinto card e filtros/estado vazio em staging; verificar página 318 e canonical publicados antes de disponibilizar CTA.

## 3. Builds — candidato de teste integral, NÃO release de produção

- **Drive / Build_Doutor_Destino:** https://drive.google.com/file/d/1LhzY-ByMGLFQPmrPIPUIG5b3r_yZycEE/view
- Nome: `forja-mineira-builds-v2.3.32-rc.2-DOOM-FINAL-01-TESTE-NAO-PUBLICAR.zip`; modificado em 20/11.
- Integridade ZIP: PASS; 129 arquivos (40 PHP, 3 JS, 35 JSON, 5 CSS, 41 WebP, outros); SHA-256: `7ab14d1c926ee731ebb84a089a8033356b850fd27456ce0c5eadc79ad5c7be7f`, idêntico ao publicado no relatório DOOM-FINAL-01.
- Validação local reproduzida: PHP 40/40 PASS, JavaScript 3/3 PASS, JSON 35/35 PASS. Não equivalem a QA do WordPress.
- **Distinção crítica:** apesar de `rc.2` no nome do ZIP, o cabeçalho PHP, `FMB_VERSION` e `Stable tag` ainda declaram **2.3.32-rc.1** (preservação intencional no relatório). Não inferir estado de produção pelo filename ou só pelo número interno.
- 12 arquivos críticos amostrados contra `main`: **6 idênticos, 5 divergentes e 1 ausente em `main`**. Idênticos: `includes/class-build-voting.php`, `templates/voldemort.php`, `templates/home-hero.php`, `templates/home-build-cycle.php`, `templates/home-featured-guide.php`, `assets/js/builds.js`. Divergentes: `forja-mineira-builds.php`, `includes/class-forja-builds.php`, `includes/class-build-shortcode.php`, `templates/builds-hub.php`, `assets/css/builds.css`. Ausente na `main`: `assets/css/home.css`.
- Shortcodes encontrados na candidata: `[forja_build]`, `[forja_builds_hub]`, `[forja_home_hero]`, `[forja_home_build_cycle]`, `[forja_home_featured_guide]`, `[forja_home_featured_build]`, `[forja_home_next_build]`.
- `FMB_DOOM_REVIEW_MODE` continua referido no código (24 ocorrências no conjunto PHP). Níveis 11–20 exigem homologação editorial e QA antes de liberar acesso público.
- Documentação: https://docs.google.com/document/d/1WczJpef5tQw4IAhrNg1qU1snzHpHHrP3/edit e https://docs.google.com/document/d/11sBZ0i1XcM52Q1Vu6gkVvshxdQbvmgY8/edit.
- Home: preservar B3 Hotfix, B4 Vencedor 1.0.1, os filtros e o painel Dunk/Egg; comparar a integração do CSS `home.css` e o CSS do Hub antes de promover. Preservar a URL de Voldemort. Não publicar URL presumida para Doutor Destino.

## 4. Gates para encerrar reconciliação

1. **Snapshot autenticado:** capturar diretórios instalados de Builds e Guias, versão/atividade, checksum por arquivo, shortcodes e ativos; identificar pacote de rollback. Não consumir cota/reserva do WPVibe sem autorização operacional.
2. **Comparação integral:** instalar **nenhum** candidato no WP. Comparar arquivos instalados contra ZIPs e `main` (lista de inclusões, exclusões, alterações e hashes); separar diferenças de Doom em teste das mudanças de produção.
3. **PRs de código independentes (quando houver fonte homologada):** um por plugin; preservar assets, rotas, links, CSS, namespace, dependências e componentes B3/B4 existentes.
4. **Staging:** PHP/JS, regressões de shortcodes, Home, builds (Voldemort e Doutor Destino), Hub, filtros, drafts/publicações, Rank Math, cache, 1440/1024/390/320px, CLS/LCP quando aplicável.
5. **Governança:** revisão + CI + preview + QA + rollback e autorização independente; merge/deploy apenas em bloco posterior aprovado.

**Decisão ARQ-01B:** fontes candidatas recuperadas e comparadas; **não é seguro sincronizá-las diretamente**. Não há paridade comprovada com a instalação WordPress ativa, portanto nenhuma mudança de plugin é incluída neste PR.
