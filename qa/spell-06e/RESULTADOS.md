# SPELL-06E — Resultado da inspeção visual (Chromium)

- **PR:** [#25](https://github.com/Peruzini/forja-mineira-d20/pull/25) — branch empilhada em SPELL-06D.
- **Primeiro workflow:** [#44841045013](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44841045013) — **FAIL de infraestrutura**: Playwright 1.56.1 não suporta Ubuntu 26.04. Corrigido no workflow para Ubuntu 24.04.
- **Segundo workflow:** [#44841126327](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44841126327) — PASS dos cenários automatizados e regressão SPELL-06D; 12 screenshots; quatro ocorrências de `aria-hidden`.
- **Validação visual de screenshots:** FAIL COM BLOQUEIO (não homologar UX mobile).

## Evidência e diagnósticos

| Resolução | Fluxos de interação | Overflow de documento | Inspeção visual |
|---|---|---|---|
| 1440 × 900 desktop | PASS | Nenhum | Painel duplo e filtros íntegros na prévia |
| 390 × 844 mobile | PASS | Nenhum | **FAIL: botão Filtros cortado à direita** |
| 360 × 780 mobile | PASS | Nenhum | **FAIL: botão Filtros quase totalmente oculto** |

**Raiz provável confirmável no CSS:** `assets/css/guide-spells.css` define `.fmmg-guide .catalog-top {grid-template-columns:1fr auto}` dentro de `@media(max-width:820px)` (aprox. linha 173), mas uma regra posterior de mesma especificidade (aprox. linha 217) aplica `grid-template-columns:minmax(280px,1.15fr) minmax(160px,.45fr) auto` **sem restrição de viewport**, substituindo o grid mobile. O catálogo também usa `overflow:clip` (aprox. linha 46), ocultando o controle que ultrapassa o espaço interno.

**Importante:** `documentElement.scrollWidth === viewport` não detecta corte interno causado por `overflow:clip`. O CI foi atualizado para medir a borda real do botão comparada com a borda do catálogo e marcar o problema como bloqueio visual independente do sucesso funcional.

## Acessibilidade
- `aria-hidden="true"` permanece nos painéis de filtro e detalhes mesmo abertos, nas duas resoluções mobile. São **dois defeitos distintos reproduzidos em duas larguras (quatro ocorrências)**.
- Testes de clique passam, mas o controle pode estar invisível para tecnologias assistivas.

## Tratamento sugerido — não aplicado
1. Restringir a regra tardia de grid ao desktop ou adicionar sobreposição final **somente no breakpoint mobile** com `grid-template-columns:minmax(0,1fr) auto`, respeitando largura mínima zero para a coluna de busca.
2. Sincronizar `aria-hidden` (e estado de foco/teclado) com os painéis abertos/fechados em implementação UX futura.
3. Reexecutar capturas e homologar visualmente em 360, 390 e 1440 px após uma revisão isolada aprovada pelo usuário.

**Nenhuma correção visual foi aplicada no CSS/JS do plugin; nenhuma mudança em WordPress, Google Sheets ou `main`.** Não alterar UX já aprovada sem discussão prévia. O PR permanece draft.

## Abrir evidências
O artifact `SPELL-06E-preview-desktop-mobile` pode ser baixado a partir do workflow. Contém `qa/spell-06e/index.html`, os arquivos CSS/JS/arte necessários, 12 screenshots e `output/report.json`. O HTML é uma prévia da camada de plugin, não inclui tema/slots dinâmicos do WordPress.
