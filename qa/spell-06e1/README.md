# SPELL-06E.1 — Correção isolada do grid mobile e acessibilidade dos painéis

**Estado:** branch de proposta, sem merge e sem publicação. Dependência: SPELL-06E / PR #25. Este trabalho altera somente CSS/JS/template do plugin **na branch** e a suíte QA; preserva os 94 cards, o shortcode, URLs canônicas e todos os arquivos de produção na `main`.

## Diagnóstico precedente
SPELL-06E (20/11/2026): screenshots mostraram botão **Filtros** cortado (96 px a 390 px; 126 px a 360 px); `aria-hidden=true` nos painéis abertos. A regra v2 de `.catalog-top` foi declarada após `@media(max-width:820px)`, sobrepondo o grid de duas colunas; `overflow:clip` ocultava o botão sem criar overflow de documento.

## Mudanças estritamente isoladas
1. **CSS:** `@media(max-width:820px)` adicional no final do arquivo impõe `grid-template-columns:minmax(0,1fr) max-content` e `min-width:0` na busca. As configurações desktop continuam inalteradas.
2. **Template:** os painéis recebem `role=dialog`, `aria-modal`, `aria-labelledby`, close buttons nomeados e botão Filtros com `aria-controls` e `aria-expanded`.
3. **JavaScript:** abrir/fechar sincroniza `aria-hidden` e `aria-expanded`; foco entra no fechamento; `Escape` fecha, `Tab` circula dentro do diálogo e o foco volta ao acionador (ou card selecionado).
4. **QA:** `qa/spell-06d/guide-regression.test.cjs` atualiza hashes para a branch e testa atributos ARIA; `qa/spell-06e/index.html` foi regenerado a partir do template real. `qa/spell-06e1/browser-check.cjs` valida botões visíveis, ARIA, teclado, seleção e gera screenshots em desktop 1440×900, mobile 390×844 e 360×780.

## Reproduzir
```sh
node qa/spell-06e/build-static.cjs --verify
node --test qa/spell-06d/guide-regression.test.cjs
node --test qa/spell-05e/adapter.test.cjs qa/spell-06b/exporter.test.cjs qa/spell-06c/preview.test.cjs
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node qa/spell-06e1/browser-check.cjs
```

## Gates antes de homologar
- CI de Node e Chromium PASS, sem regressão 94 cards (91 Core / três HoF).
- `#fmmg-openFilters` **totalmente visível** em 390 e 360 px.
- Filtros e detalhes com `aria-hidden=false` ao abrir, `true` ao fechar; `aria-expanded` coerente, teste `Escape`, `Tab` e retorno do foco.
- Inspeção humana das capturas ZIP e revisão de impacto sobre desktop.
- Teste no WordPress real e aprovações editorial/UX ficam para depois da liberação do acesso.
- Nunca realizar merge/deploy automaticamente.

## Arquivos
`qa/spell-06e/index.html` (abrir localmente após extrair ZIP), `qa/spell-06e1/browser-check.cjs`, `qa/spell-06e1/output` (gerado no CI), workflow `.github/workflows/spell-06e1-visual.yml`.
