# SPELL-06D — Regressão e compatibilidade dos 94 cards

## Objetivo
Executar testes de compatibilidade diretamente contra o **JavaScript efetivo** do plugin `forja-mineira-guia-magias` v1.0.9, usando simulação de DOM em Node.js **sem alterar a interface publicada**. A base do PR é a branch SPELL-06C (PR #22), preservando as dependências 06B/PR #21 e 05E/PR #20.

## Execução
```sh
node --test qa/spell-06d/guide-regression.test.cjs
node --test qa/spell-05e/adapter.test.cjs qa/spell-06b/exporter.test.cjs qa/spell-06c/preview.test.cjs
```

### Cobertura automatizada
- Compara os hashes Git blob do JS do catálogo, CSS, template PHP e plugin PHP com a revisão realmente auditada; recusa mudanças implícitas.
- Carrega o **script real** `guide-spells.js` em `node:vm` com DOM mínimo isolado; preserva os **94 cards (91 Core 2024, 3 HoF)**, IDs, ordem e paridade com o fixture SPELL-06C campo a campo.
- Executa filtros: fonte Core/HoF, função, escola, nível, prioridade, busca livre, combinações por interseção; valida resultado vazio, limpar filtros, seleção, mudança automática do ID ativo.
- Simula viewport desktop e mobile (media-query 820px): filtros mobile, abertura/fechamento dos painéis e comparativo de detalhes desktop/mobile. **Não é um navegador e não valida pixels, foco, rolagem, responsividade CSS ou acessibilidade real**.
- Exercita os 94 templates de detalhe; verifica HTML escape de campos editoriais e compatibilidade dos dados protegidos (Sonho/Caldeirão).
- Confere estrutura estática PHP/CSS do shortcode e URLs canônicas conhecidas; **não executa WordPress**.
- As fixtures 06C têm 4 linhas reais para conversão; não fingir exportação validada das 391 magias.

## Limites / achados existentes (não corrigidos)
1. **A11Y:** o template define `aria-hidden="true"` nos painéis mobile enquanto o JS original modifica apenas classe `open`. Portanto o estado de acessibilidade pode ficar inconsistente. Registro como TODO; UX requer discussão e aprovação antes de modificar produção.
2. **Navegador:** `node:vm` com DOM simulado não substitui Playwright/Chrome e não prova screenshot, quebra visual ou acessibilidade do site.
3. **WordPress:** não foram executados PHP real, shortcode, filas/enqueue e staging; ambiente indisponível no bloco.
4. **Contrato normativo:** Sonho (Dream), Drawmij's Instant Summons e demais gates continuam pendentes. Sem desbloqueio, sem atualização do Sheets.
5. **Integração:** SPELL-05E/06B/06C permanecem branches draft empilhadas e divergentes da `main`; reconciliação antes de eventual publicação.

## Critério de encerramento
- **PASS técnico isolado:** CI de regressão Node + dependências verde; prova que nenhuma atualização de interface existente foi feita pelo PR.
- **PASS condicionado:** validação browser real e de acessibilidade mobile permanece pendente e será conduzida em bloco de preview/homologação.
- **NÃO AUTORIZA PUBLICAÇÃO:** nenhum merge, deploy ou alteração das 94 fichas.

### Entregáveis
- `qa/spell-06d/guide-regression.test.cjs`
- `qa/spell-06d/README.md`
- `.github/workflows/spell-06d-regression.yml`
