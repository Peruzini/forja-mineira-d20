# SPELL-06D — Resultado da homologação técnica isolada

- **Data:** 20/11/2026 (UTC)
- **PR:** [#24](https://github.com/Peruzini/forja-mineira-d20/pull/24) — branch empilhada sobre SPELL-06C / PR #22.
- **Evidência do CI (primeira execução):** [GitHub Actions #44840618850](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44840618850)
- **Escopo:** JavaScript de produção `guide-spells.js` v1.0.9, CSS, template, plugin PHP, fixtures de preview 06C e dependências 05E/06B.
- **Ambiente:** Node.js 22 com DOM simulado e verificação estática. Sem WordPress/staging.

## Matriz de resultados

| Área | Testes | Aprovados | Pendentes (TODO) | Falhas |
|---|---:|---:|---:|---:|
| SPELL-06D — regressão do guia real | 15 | 12 | 3 | 0 |
| SPELL-05E + SPELL-06B + SPELL-06C | 20 | 20 | 0 | 0 |
| **Total** | **35** | **32** | **3** | **0** |

## Integridade comprovada pelo CI

1. **Arquivos existentes imutáveis**: hashes Git blob confirmados para JS `6892a172aa4d847f294fba1f0c6431d6121008a8`, CSS `ee2adc87acd707e68d77ce326cb36193056143df`, template PHP `0e1df4280f0448c475e15d13155811250e007ec0`, plugin PHP `b29a7d99dcff198987e6d2f9966fcbd21c26edfc`.
2. **94 cards, 91 Core 2024 e três HoF**. IDs únicos, ordem preservada, equivalência de campos selecionados com fixture editorial 06C e hashes de origem.
3. **Filtros**: Core/HoF, função, escola, nível, prioridade, busca PT/EN; combinações, estado vazio e reset.
4. **Desktop/mobile simulados**: renderização de template compartilhado, seleção e painéis, sem alterar a UX já publicada.
5. **Confiabilidade**: escape HTML das fichas, bloqueios editoriais e controle de identidade da bridge 06C.

## Pendências abertas (não mascarar como PASS)

- **TODO A11Y mobile:** o template possui `aria-hidden="true"` nos painéis e o JS somente alterna classes `open`; sem sincronização de atributo, o conteúdo visível pode continuar oculto a tecnologias assistivas. **Achado existente; nenhuma mudança aplicada**, sujeito a discussão/aprovação UX.
- **TODO browser real:** testar DOM real, CSS, foco, rolagem e screenshots em viewport desktop/mobile. A simulação `node:vm` não comprova esses aspectos.
- **TODO WordPress:** shortcode, PHP e enqueue em ambiente de staging quando acesso disponível.

## Decisão

**PASS técnico isolado com ressalvas (3 TODO)**. Não equivale a homologação de UX/WordPress; não autoriza merge, deploy ou atualização normativa do Google Sheets. Conservar PR draft; branch e dependências ainda divergentes da main. Próximo bloco recomendado: **SPELL-06E — Homologação visual independente**, seguida de integração real somente com WordPress novamente disponível.
