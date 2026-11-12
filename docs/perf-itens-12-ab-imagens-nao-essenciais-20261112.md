# PERF-ITENS-12 — A/B controlado de adiamento de imagens não essenciais

**Data:** 12/11/2026. **Status:** CONCLUÍDO — SEM GANHO MATERIAL; NÃO RECOMENDAR MUDANÇA EM PRODUÇÃO.

**Escopo:** página \`https://forjamineirad20.com.br/itens-magicos-conjuradores-dnd-2024/\` com plugin publicado \`forja-mineira-guia-itens-conjuradores-v1.0.7\`. Nenhuma mudança no WordPress, plugin, cache, CDN, tema, artes, SEO ou conteúdo editorial. Experimento executado em fixture local congelada a partir dos recursos públicos.

## Execução e evidências

- [GitHub Actions — PERF-ITENS-12, execução 43270167247](https://github.com/Peruzini/forja-mineira-d20/actions/runs/43270167247): **success**.
- [Artefato de evidências 13967991777](https://github.com/Peruzini/forja-mineira-d20/actions/runs/43270167247/artifacts/13967991777): sumário completo, medições por rodada, QA das imagens e screenshots.
- [Artefato bruto 13968841101](https://github.com/Peruzini/forja-mineira-d20/actions/runs/43270167247/artifacts/13968841101): oito relatórios Lighthouse JSON e oito Chrome traces.
- Script reproduzível: [scripts/perf-itens-12-ab.mjs](../scripts/perf-itens-12-ab.mjs).
- Workflow de execução única: [.github/workflows/perf-itens-12-once.yml](../.github/workflows/perf-itens-12-once.yml).

## Desenho A/B

- **A (controle):** HTML original da página com as imagens e prioridades exatamente como publicadas; URLs reescritas apenas para o mesmo servidor loopback isolado.
- **B (variante):** alteração exclusiva nos elementos \`<img>\` dos cards de itens, da análise detalhada e do bloco de links relacionados: URLs \`src/srcset\` preservadas em atributos \`data-*\`; um \`IntersectionObserver\` as restaura quando o elemento entra na margem de 160px do viewport. O objetivo é impedir requisições dessas imagens no carregamento inicial. Uma imagem relacionada tinha originalmente \`fetchpriority="high"\`, convertida para \`low\` em B. Não se altera a imagem principal \`hero-vaeros-mobile-960-v1.0.7.webp\`, preload, benefício visual do Hero, logotipo, texto ou geometria.
- **Fixture congelada:** 34 recursos do site capturados antes das medições; sem requisições desconhecidas durante o experimento (\`snapshotMisses=[]\`). Servidor local \`http://127.0.0.1\` com \`cache-control: no-store\`; recursos e conteúdo idênticos entre variantes salvo as imagens adiadas. URLs de terceiros fora do domínio foram bloqueadas igualmente para A e B.
- **Ambiente:** Chrome/157.0.8103.50, Lighthouse 13.6.0, 412×823 CSS pixels, DPR 1,75, throttling mobile via DevTools, perfil Chrome novo para cada medição. **Quatro medições por variante** em ordem alternada A–B, B–A, B–A, A–B. Cada Lighthouse e seu Chrome trace vêm da mesma navegação.
- **Limite metodológico:** a fixture loopback não simula a cadeia real de CDN/Hostinger nem o MISS do PERF-ITENS-10; seus tempos absolutos **não devem ser equiparados** aos 2,876s observados no site público. O teste serve para medir o efeito marginal de retirar imagens concorrentes do carregamento inicial sob condições controladas.

## Resultados por rodada

| Rodada | A LCP (ms) | B LCP (ms) | B − A (ms) |
| --- | ---: | ---: | ---: |
| 1 | 1.528,150 | 1.519,377 | −8,773 |
| 2 | 1.522,390 | 1.529,025 | +6,635 |
| 3 | 1.514,930 | 1.510,902 | −4,028 |
| 4 | 1.533,124 | 1.507,510 | −25,614 |
| **Mediana** | **1.525,270** | **1.515,140** | **−10,131 (−0,664%)** |

| Indicador mediano | A | B |
| --- | ---: | ---: |
| LCP | 1.525,270 ms | 1.515,140 ms |
| Duração de carregamento do Hero | 889,099 ms | 884,375 ms |
| TBT | 0 ms | 0 ms |
| CLS | 0 | 0 |
| Performance Lighthouse | 100 | 100 |

- A imagem \`hero-vaeros-mobile-960-v1.0.7.webp\` permaneceu o elemento LCP nas **oito** medições; HTTP 200 em todas.
- O controle A solicitou antecipadamente a imagem não essencial \`spells.webp\` (prioridade High; ~31KB), enquanto B não a solicitou antes do LCP. A mediana da duração de transferência do Hero caiu **~4,7 ms**, sem efeito material no LCP.
- Soma dos \`transferSize\` das requisições **iniciadas até o LCP**: A 393.382 bytes, B 365.151 bytes (**−28.231 bytes**). **Nota técnica:** essa soma inclui o tamanho total de recursos cuja transferência terminou depois do LCP; não deve ser descrita como bytes efetivamente recebidos *antes* do LCP. O objetivo dessa métrica é identificar pedidos iniciados antecipadamente, não contabilização temporal exata de bytes.

## QA visual e de comportamento

- A geometria do \`section.hero\` permaneceu idêntica (\`x=16, y=309,766, width=380, height=678,656\` CSS px), com título, preload, background e altura documental sem mudanças.
- **14 imagens** foram adiadas em B. Ao percorrer a página, **14/14** carregaram com \`naturalWidth>0\`, sem imagens pendentes. No controle A, 14/14 carregaram.
- Comparação de screenshots da primeira tela: **721×1440 pixels**, diferença RGB média **0,0**, sem caixa de diferenças.
- **CLS 0 em todas as execuções.** Esse resultado não dispensa QA humano de rolagem em aparelhos reais, que não foi feito.

## Decisão

**Resultado: otimização marginal (~10ms, −0,66%) — NÃO APROVAR implementação em produção.** São apenas quatro execuções por variante e há dispersão de cerca de 20 ms; não existe evidência de melhora relevante ou generalizável. A variante B acrescenta complexidade e pode retardar a aparição das artes durante rolagem rápida. A implementação publicada 1.0.7 e suas imagens aprovadas devem permanecer intactas.

Caso se queira atacar o LCP público de 2,876 s, a próxima investigação deveria tratar separadamente **latência/entrega via CDN e concorrência real**, nunca inferir economia de ~1,35 s a partir do resultado de loopback. Novo teste ou mudança apenas mediante novo escopo e decisão.
