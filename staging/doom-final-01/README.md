# DOOM-FINAL-01 — revisão editorial de Doutor Destino (20/11/2026)

**NÃO PUBLICAR / NÃO FAZER MERGE.** Este diretório é um registro de revisão do candidato B2, não substitui o plugin `plugins/forja-mineira-builds/` presente em `main`.

## Decisões aprovadas

- N10: Lança Psíquica de Raulothim (Raulothim's Psychic Lance) — Legacy, condicionada à aceitação do Mestre — substitui Fabricar (Fabricate) na inscrição e Teia (Web) na preparação.
- N11: Fabricar (Fabricate) inscrita em vez de Olho Arcano (Arcane Eye). Contrato antigo do template 10/11 atualizado.
- N13: Vidência (Scrying), 15/15 preparações regulares.
- N19: Visão da Verdade (True Seeing) e Contingência (Contingency), 21/21; sem duplicações.
- N20: manter Visão da Verdade e Contingência junto com Desejo (Wish), 22/22.
- N13–20: Quebra-Feitiços (Spell Breaker) — Contramágica (Counterspell) e Dissipar Magia (Dispel Magic) sempre preparadas, fora das vagas regulares.

## QA

125/125 verificações PASS; 40 arquivos PHP com sintaxe válida; 35 JSON parseáveis; níveis 10–20 renderizados isoladamente em PHP; prévia técnica em 1440px e 390px sem overflow horizontal nos níveis críticos, mas o GATE 8 ainda está pendente. Todos os 126 arquivos B2 antigos preservados; 98 sem alteração, 28 alterados (somente Doom), 3 criados. Artes, Home, Hub, Voldemort, shortcodes e votação permanecem iguais byte a byte.

## Artefatos

- Candidato completo de teste no Google Drive (substitui candidato antigo no **mesmo ID**): https://drive.google.com/file/d/1LhzY-ByMGLFQPmrPIPUIG5b3r_yZycEE/view
- Revisão editorial v1.4: https://drive.google.com/file/d/1R1n5yYXujsF8J_TfhzI4npxByOHzztYO/view
- Relatório atualizado: https://drive.google.com/file/d/11sBZ0i1XcM52Q1Vu6gkVvshxdQbvmgY8/view
- QA detalhado: https://drive.google.com/file/d/1Al4o2mU3FEHEo8oNJE_mrmCz043xGuH5/view
- ZIP SHA256: `7ab14d1c926ee731ebb84a089a8033356b850fd27456ce0c5eadc79ad5c7be7f`.

`DOOM-FINAL-01-ALTERACOES-B2.patch`: patch unificado que se aplica **à base B2 documentada** de 13/10/2026, não à árvore atual de `main` do GitHub. `DOOM-FINAL-01-CODIGO-REVISAO.zip`: somente 31 arquivos alterados/adicionados, com patch e relatório de QA, para revisão técnica.

**Bloqueios preservados:** `FMB_DOOM_REVIEW_MODE` exigido, `publicacao_autorizada=false`, nenhuma publicação nem merge; Legacy depende do Mestre; homologação mecânica integral, GATE 8, staging real, SEO e release WordPress ainda pendentes.
