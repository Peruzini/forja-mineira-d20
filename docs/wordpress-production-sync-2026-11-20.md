# FORJA-SYNC-20261120 — WordPress → GitHub (inventário de reconciliação)

**Data-base:** 20/11/2026, UTC (consulta autenticada somente de leitura).  
**Repositório:** `Peruzini/forja-mineira-d20`.  
**Política:** WordPress instalado é a referência do código efetivamente executado; GitHub `main` pode conter versões anteriores. Preservar versões homologadas, URL canônica, assets e rollback. Sem deploy WordPress ou merge automático.

## Resultado desta branch — Clusters

- **WordPress:** `Forja Mineira D20 — Clusters` **1.0.6-TESTE, ativa e homologada** (confirmação expressa do responsável em 16/10/2026). O sufixo `TESTE` faz parte do identificador da versão e **não** significa falta de homologação.
- **GitHub `main` anterior:** 1.0.5, que permanece preservado como referência de rollback. Artefato anterior também arquivado na Biblioteca em `Projeto/Plugins/forja-mineira-clusters-v1.0.5-PRODUCAO.zip`.
- **Fonte de recuperação:** ZIP homologado `Projeto/Plugins/Testes/forja-mineira-clusters-v1.0.6-TESTE-Conjuradores-Doutor-Destino.zip` (13/10/2026). O pacote passou na verificação de integridade ZIP e seus 9 arquivos PHP passaram em `php -l` local.
- **Arquivos reconciliados:** os 11 arquivos `.php`, `.css` e `.txt` do plugin na branch têm os hashes Git de conteúdo do ZIP homologado. Dez foram lidos da instalação WordPress (e conferidos contra o arquivo do ZIP). O `includes/class-resolver.php` foi recuperado do ZIP porque a leitura adicional esbarrou na cota do conector; seu hash Git confere com o ZIP. Os 5 arquivos WebP já presentes em `main` também têm hashes Git idênticos aos do ZIP. **Não foi feita uma comparação binária HTTP das imagens instaladas no WordPress nesta operação.**
- A origem instalada contém `clusters/conjuradores.php`, novas regras de Resolver/Renderer, CSS e README. Comentários históricos no README ainda chamam a versão de candidata; a classificação operacional correta é **homologada e ativa**, conforme a decisão datada.
- **Gate de promoção:** revisar diff do PR e executar regressão funcional (Bruxo, Conjuradores, cache, destinos draft/publish, HTML, sem links vazios) antes do merge. Não reinstalar a versão em WordPress: já está ativa.

## Demais divergências — ainda não sincronizadas por este PR

| Plugin / frente | WordPress ativo em 20/11 | GitHub `main` observado | Estado da reconciliação |
|---|---|---|---|
| Builds | 2.3.32-rc.1 | 2.3.28 | **Pendente:** existe `FORJA-B3-HOME-PATCH-2.3.32.zip` (somente 3 templates + 2 imagens + QA), mas **não equivale ao plugin completo**; obter árvore integral instalada e rollback antes de sincronizar |
| Guias / Hub | 1.2.6 | 1.2.4 | **Pendente:** Drive contém documento `FORJA-GUIAS-1.2.6` de candidata offline, mas ZIP íntegro 1.2.6 ainda não localizado; obter pacote ou fonte instalada para evitar substituir a versão ativa com o candidato antigo |
| Guia de Talentos | 1.2.1 | Ausente na `main` no início da auditoria | **PR #12 Draft aberto:** 21/21 arquivos recuperados do ZIP oficial do Drive e conferidos por hash; ainda falta paridade exata com a instalação WordPress |
| Talentos UX Candidato | 1.1.2-ux-hero-r2-candidata | Não inventariado | Cópia isolada; não misturar com o plugin público |
| Itens para Conjuradores | 1.0.7 | Não inventariado | ZIP 1.0.7 e rollback 1.0.6 estão arquivados na Biblioteca; conferir correspondência com a instalação antes de subir |
| Radar D&D | 0.1.5-R5-CANDIDATO | Não inventariado | Plugin ativo; coletar fonte/QA e reconciliar sem alterar feed |
| Clusters de Notícias | 0.1.2-R5-CANDIDATO | Não inventariado | Plugin separado do Clusters principal; não fundir sem decisão |
| Home B3 Hotfix | 1.0.0 | Não inventariado | Preservar templates e chain de filtros do Builds |
| Home B4 Vencedor | 1.0.1 | Não inventariado | Preservar exibição Dunk/Egg e rollback por desativação |
| Correção da página inicial | 1.0.0 | Não inventariado | Verificar compatibilidade de `template_include` |
| Guia de Subclasses | 1.0.3 | Não inventariado | Plugin ativo; página editorial ainda `draft` na consulta |
| Guia de Invocações | 1.3.9-TESTE | 1.3.9 | Comparação de código pendente; não decidir pelo sufixo |
| Guia de Magias | 1.0.9 | 1.0.9 | Comparação de código pendente |
| Duncan | 0.1.12 | 0.1.12 | **Verificado:** 25/25 arquivos do ZIP FINAL no Drive conferidos com GitHub `main` (23 diretos e 2 reconstruídos dos arquivos particionados, com hashes idênticos). Sem novo PR necessário |

Os plugins terceiros (Rank Math, LiteSpeed, Hostinger, etc.) não precisam ser incorporados ao repositório próprio.

## Restrições

- **Não promover para `main` sem revisão e testes.** Não atualizar números de versão em arquivos antigos como substituto do código efetivo.
- Não tocar no WordPress nem aplicar PRs #6–#10 automaticamente.
- Antes de sincronizar cada plugin restante: inventariar a árvore instalada, localizar ZIP/rollback, comparar hashes, capturar somente assets aprovados, testar lint e shortcodes, gerar PR independente e registrar resultados.
- **Conector WPVibe:** cota de leitura foi atingida durante esta reconciliação. Não consumir o reset de uso reservado sem solicitação expressa do responsável.

**Resultado atualizado:** Clusters foi preparado no **PR #11 Draft**; Talentos 1.2.1 foi recuperado do Drive no **PR #12 Draft** (`https://github.com/Peruzini/forja-mineira-d20/pull/12`); e a equivalência do ZIP Duncan 0.1.12 com a `main` foi verificada. Builds, Guias, Conjuradores e outros plugins continuam pendentes. Nenhum PR foi incorporado à `main`, nenhum deploy foi feito no WordPress.


## Reconciliação complementar do Drive — 20/11/2026

- Talentos — ZIP `Forja_Mineira_Guia_Talentos_1.2.1_PRODUCAO_INSTALAVEL.zip`, localizado em `https://drive.google.com/file/d/1ru_sRIrgTXKu1SSdun5ERWhLNXzLA_ME/view`; importado integralmente no PR #12 com hashes Git exatos, ZIP íntegro, lint PHP/JS PASS.
- Duncan — ZIP `forja-mineira-duncan-v0.1.12-FINAL.zip` em `https://drive.google.com/file/d/1VBSkWkx67v3v8Ug0mzV1kLKB9TfKlH68/view`: 25/25 conteúdos equivalentes, incluindo CSS e HTML reconstruídos por concatenação dos arquivos `source-parts` na ordem oficial. GitHub `main` já é a fonte de produção dessa versão.
- Guias — documento `FORJA-GUIAS-1.2.6 — Preparação do card Talentos` descreve um ZIP candidato elaborado quando página 318 ainda era draft; atualmente o Hub já exibe cinco guias, mas o ZIP íntegro 1.2.6 **não foi localizado** no Drive pesquisado. Não restaurar o candidato sem comparar a versão instalada.
- Builds — `FORJA-B3-HOME-PATCH-2.3.32.zip` do acervo é pacote incremental, **não** o plugin inteiro. Não substituir o `main` 2.3.28 por três templates como se fossem 2.3.32 completos.
- Itens para Conjuradores — biblioteca possui `forja-mineira-guia-itens-conjuradores-v1.0.7-CANDIDATA.zip` (44 arquivos, íntegro) e rollback v1.0.6. A instalação v1.0.7 estava ativa na última consulta; o código completo ainda precisa ser comparado antes do PR.
