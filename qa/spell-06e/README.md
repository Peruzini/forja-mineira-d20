# SPELL-06E — Prévia independente desktop/mobile

**Objetivo:** executar o HTML, CSS e JS **originais e inalterados** do Guia de Magias de Bruxo v1.0.9 no Chromium, fora do WordPress. A branch e PR são **draft** e têm base SPELL-06D.

## Entrada canônica
- `plugins/forja-mineira-guia-magias/templates/guide-spells.php`, convertido estaticamente em `index.html` apenas com omissão das duas instruções PHP (guarda ABSPATH e slot dinâmico `do_action`). Qualquer alteração estrutural desse PHP bloqueia geração automática.
- `plugins/forja-mineira-guia-magias/assets/css/guide-spells.css` e `assets/js/guide-spells.js`, carregados diretamente pela prévia. O hero mantém a arte original `guia-magias-bruxo-hero-aprovado.webp`.
- `qa/spell-06e/build-static.cjs` verifica igualdade byte a byte da prévia derivada; `qa/spell-06e/browser-check.cjs` executa interações e screenshots no Chromium via Playwright.

## Abrir localmente
Abra `qa/spell-06e/index.html` **com toda a estrutura de diretórios do ZIP mantida**. O `index.html` usa paths relativos para as folhas de estilo e o script; não necessita de WordPress nem internet.

## Rodar em ambiente com Node 22 e Chromium
```sh
node qa/spell-06e/build-static.cjs --verify
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node qa/spell-06e/browser-check.cjs
```

## Cenários
- Desktop 1440 × 900: estado inicial 94 cards, fonte HoF = 3, pesquisa sem resultado, reset, seleção e detalhe.
- Mobile 390 × 844 e 360 × 780: filtro mobile, HoF = 3, abertura/fechamento de detalhe, vazio/reset.
- Verificação real de CSS carregado, erros JS, overflow horizontal e acessibilidade `aria-hidden` nas duas abas móveis.
- Capturas PNG de cada cenário e JSON/Markdown de relatório são publicadas em ZIP no GitHub Actions.

## Decisão e limites
- CI browser verde comprova que os cenários programados funcionam no Chromium, **não** confirma acessibilidade geral, fidelidade do tema WordPress, semântica de regras, desempenho real ou aprovação editorial.
- `aria-hidden=true` persistente quando painel está aberto é **bug conhecido da UI atual**: registrar RISK, não ocultar nem corrigir sem discussão/validação de UX.
- O plugin WordPress/shortcode e as 94 fichas não são modificados. O ZIP contém uma prévia independente, não um plugin instalável.
- Capturas precisam de inspeção humana antes de aprovação visual. Nunca promover o preview automaticamente a produção.
- Prévia baseada em branch antiga de SPELL-05E/06B/06C/06D que está divergente da `main`; resolver compatibilidade antes de merge.

## Entregáveis
`qa/spell-06e/index.html`, `build-static.cjs`, `browser-check.cjs`, `README.md`, GitHub workflow e artefato ZIP com capturas.
