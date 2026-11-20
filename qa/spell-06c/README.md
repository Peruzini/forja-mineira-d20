# SPELL-06C — Integração experimental do exportador com adaptador SPELL-05E

**Somente leitura / sem WordPress**. Este pacote conecta a estrutura de saída do SPELL-06B ao adaptador `spell-adapter.js` do SPELL-05E, com prévia independente. Nenhum arquivo em `plugins/` foi alterado neste bloco. Não executar merge ou deploy de produção a partir deste PR.

## Artefatos

- `index.html`: interface de comparação com busca, seleção manual de Core/HoF e nível, botão **Limpar filtros**, estado vazio e painel único de detalhe. Abra com um servidor estático na raiz do repositório (ou abra localmente como arquivo mantendo a árvore e scripts relativos). É uma prévia **do adaptador**, não o CSS/PHP real do WordPress.
- `preview-bridge.js`: liga o JSON de exportação à função `adaptEditorial`, valida invariantes e falha fechado; é UMD e também roda nos testes Node.
- `editorial-fixture.js`: cópia *somente dos campos usados no preview* dos **94** cards da `main` em 20/11/2026; origem GitHub blob `6892a172aa4d847f294fba1f0c6431d6121008a8`. 91 Core + 3 HoF.
- `source-fixture.json`: **amostra de quatro IDs** `MAG-0001`, `MAG-0002`, `MAG-0063`, `MAG-0076`, lidos da planilha Forja Mineira D20, sem modificação. Os relacionamentos de classe/subclasse da amostra são intencionalmente vazios (não representa exportação integral).
- `demo-export.js`: forma equivalente ao payload SPELL-06B para esses quatro registros, com `publicationAllowed=false`; o teste de integração verifica sua equivalência ao exportador.
- `preview.test.cjs`: integridade, comparação com SPELL-06B, SHA-256, 94 cards, bloqueio normativo e imutabilidade.

## Validação

```sh
node --test qa/spell-06b/exporter.test.cjs qa/spell-05e/adapter.test.cjs qa/spell-06c/preview.test.cjs
```

Workflow isolado: `.github/workflows/spell-06c-preview.yml`.

## Restrições

1. O navegador carrega uma **amostra já preparada** e não verifica SHA-256 da amostra em tempo de execução. O teste Node verifica que a amostra corresponde à saída do exportador e que o manifesto do exportador é verificável, com rejeição de adulterações. Não confundir a prévia com uma homologação normativa.
2. O modo padrão de `prepare` exige 391 registros Core. Para a amostra, o parâmetro explícito `fixtureMode:true` aceita quatro, **somente em preview**.
3. Todos os registros continuam com gate `REVIEW_REQUIRED` ou `BLOCKED`, mesmo que a interface mostre comparação. `MAG-0063` (**Sonho / Dream**) permanece bloqueado por divergência de alcance; `MAG-0076` (**Caldeirão Borbulhante de Tasha / Tasha's Bubbling Cauldron**) permanece bloqueado no exemplo devido à ausência de custo material na estrutura, apesar de texto editorial já existente.
4. A conversão demonstrativa utiliza apenas `rangeJSON`. A existência de uma conversão de unidade não significa que ela seja editorialmente melhor. Área, gatilhos, salvaguardas condicionais e escalonamentos não são promovidos.
5. Falhas de nomenclatura/ID/nível e mudanças na proporção 91/3 interrompem a conversão. Nenhum link de classe é promovido à interface.
6. **Sem plugin WordPress conectado**: PHP, shortcode, layout real, staging e screenshots reais ainda não foram executados.

## Dependências e rollout

Este PR é empilhado sobre `feature/spell-06b-exportador-deterministico-20261120`, que depende do SPELL-05E/PR #20 e está divergente da `main`. Antes de qualquer integração de produção: homologar contrato completo 391 registros, resolver conflitos normativos, revisar CI, atualizar branch-base contra `main`, validar visual real, garantir rollback e obter aprovação expressa.

Próximo bloco: **SPELL-06D — Regressão do plugin e compatibilidade dos 94 cards (sem WordPress)**.
