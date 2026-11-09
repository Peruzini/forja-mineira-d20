# PERF-ITENS-09 — Experimento do Hero mobile

## Método

- [Página de referência](https://forjamineirad20.com.br/itens-magicos-conjuradores-dnd-2024/) consultada por GET. O WebP publicado tinha o mesmo SHA-256 do controle de [PERF-ITENS-08-R2](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42670511180).
- A página e os recursos públicos do próprio domínio foram lidos uma vez e congelados em memória. A cópia foi servida via HTTP em loopback. As referências ao domínio próprio foram reescritas para o loopback e as requisições a domínios externos foram excluídas igualmente. A medição é comparativa em fixture. Os valores absolutos não são uma previsão para produção ou PageSpeed Insights.
- Em cada cenário, apenas os bytes da resposta do caminho `hero-vaeros-mobile-1280.webp` variaram. Foram usados o mesmo HTML, CSS, JavaScript, regra mobile, URL do recurso e preload. O manifesto da execução contém os hashes do snapshot e das imagens.
- A e B partem do WebP aprovado. Pillow 12.1.0, WebP com `method=6`, sem metadados adicionados. A usa qualidade 80 em 1280 × 512. B usa LANCZOS para 960 × 384 e qualidade 82. As duas mantêm proporção 2,5:1.
- Três rodadas com ordem alternada `controle/A/B`, `A/B/controle`, `B/controle/A`. Um processo Chrome com perfil temporário novo por navegação, fixture com `Cache-Control: no-store` e reset padrão do Lighthouse.
- Trace e relatório Lighthouse extraídos da mesma navegação. Capturas visuais feitas separadamente com a mesma viewport e sem throttling, depois de fontes e imagem estarem prontas.

Chrome 156.0.8078.79 e Node 22.23.4 no runner Linux do GitHub. Lighthouse 13.6.0 em 412 × 823 px CSS, DPR 1,75 e UA mobile Android 10. Throttling `devtools` com CPU 4×, latência aplicada por requisição de 562,5 ms, download de 1.474,56 kbps e upload de 675 kbps. A captura ocorreu em 09/11/2026 entre 21:51:38 e 21:55:14 UTC.

## Medições

Medianas de três navegações por cenário. Tempos em milissegundos desde o início da navegação, salvo a duração da requisição.

| Cenário | WebP | Bytes | Score | FCP | LCP | CLS | TBT | Speed Index | Visual |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Controle | 1280 × 512 | 105.192 | 99 | 1.400 | 2.064 | 0,000 | 0 | 1.638 | Arte publicada |
| A | 1280 × 512 | 66.958 | 99 | 1.459 | 1.665 | 0,000 | 0 | 1.584 | Enquadramento idêntico, textura próxima do controle |
| B | 960 × 384 | 45.420 | 100 | 1.421 | 1.533 | 0,000 | 0 | 1.525 | Enquadramento idêntico, textura fina um pouco mais suave |

| Cenário | Início da requisição | Fim da requisição | Duração da requisição | Pintura LCP no Chrome | Nó LCP |
| --- | ---: | ---: | ---: | ---: | --- |
| Controle | 618 | 2.031 | 1.412 | 2.064 | `section.hero` |
| A | 643 | 1.639 | 1.000 | 1.665 | `section.hero` |
| B | 626 | 1.510 | 888 | 1.533 | `section.hero` |

As colunas são medianas independentes. As métricas de rede vêm do audit `network-requests`, e a pintura vem de `observedLargestContentfulPaint`. O relatório bruto guarda tempos com mais precisão.

| Rodada | Controle LCP | A LCP | B LCP | Ganho de B vs. controle |
| --- | ---: | ---: | ---: | ---: |
| 1 | 2.105,981 | 1.639,893 | 1.528,495 | 577,486 |
| 2 | 2.056,668 | 1.664,601 | 1.532,508 | 524,160 |
| 3 | 2.063,925 | 1.693,804 | 1.534,450 | 529,475 |

Nas nove capturas, `largestContentfulPaint::Candidate` marcou o mesmo timestamp de `LargestImagePaint::Candidate` para o mesmo nó. O primeiro evento identifica o tipo `image` e `SECTION class='hero'`. O segundo identifica o caminho do WebP mobile. O LHR confirma o seletor `section.hero` e o preload de prioridade alta em todos os cenários. O campo preliminar `heroIsLcp` em `measurements.json` retornou falsos negativos porque o extrator consultou `nodeId` também no segundo evento, que nesta versão do Chrome usa `DOMNodeId`. A verificação posterior juntou os campos corretos, confirmou os nove pares e preservou os arquivos brutos. Exemplo da rodada 2/B: nó 29, timestamp 151240794 µs na base do trace, LCP 1.532,508 ms desde a navegação.

Na decomposição Lighthouse, a mediana de carregamento do recurso caiu de 1.418,44 ms para 894,02 ms (−524,42 ms). O atraso mediano após o carregamento ficou entre 22 e 32 ms nos três cenários. A redução do LCP veio principalmente da transferência. As quatro fases somam o LCP de cada captura, verificadas nos nove arquivos originais.

## Validação visual e limites

- As capturas colocam o controle à esquerda e a variante à direita. Nas duas variantes, a leitura do título e o enquadramento foram preservados. O Hero mediu 380 × 678,66 px CSS, com posição do título, posicionamento do fundo (`61% 8%`) e altura da página iguais. O personagem e os elementos centrais permanecem na mesma posição, com suavização leve da textura das escamas em B.
- O preload manteve o mesmo caminho, prioridade alta e condição `(max-width: 850px)`. O escopo visual medido foi 412 × 823. O CSS responsivo e as dimensões relativas do fundo foram preservados.
- O fixture congelou 28 recursos do domínio, excluiu o Google Tag Manager e devolveu 404 local para cinco imagens de cards solicitadas depois do LCP em todas as navegações. A primeira dessas requisições ocorreu pelo menos 2,15 s após o LCP. Nenhuma é o Hero. A validação se limita ao Hero e à renderização inicial da cópia.
- Os resultados de score e tempo referem-se ao loopback e ao perfil emulado. O ganho de produção não foi medido.

## Recomendação

**RECOMENDAR IMPLEMENTAÇÃO da variante B**, sujeita à validação visual do responsável. B reduziu 59.772 bytes (56,8%) e 531,417 ms de LCP mediano (25,7%) frente ao controle. Em relação à A, economizou mais 21.538 bytes e 132,093 ms de LCP mediano. O ganho apareceu nas três rodadas com CLS 0,000. A preserva mais detalhe fino, com ganho de 399,324 ms no LCP mediano (19,3%) frente ao controle.

A operação se limitou a GETs públicos, arquivos temporários do runner e commits na branch de diagnóstico. Produção, WordPress, cache, plugins, tema, scripts, shortcode e PR #10 ficaram intactos. Sem merge.

## Evidências

- [Run 42706411745](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42706411745) e [workflow no commit executado](https://github.com/Peruzini/forja-mineira-d20/blob/7bb4fd2c3b3f185a582e87125d20c27fd6a6a0c0/.github/workflows/perf-itens-09-once.yml).
- [Artefato de medições, metadados, WebPs e capturas controle/A e controle/B](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42706411745/artifacts/13713609190). SHA-256 do ZIP `0851ce8dd82840136d43204f7192b0fa785f30a5a43353ae660ae1430622297e`.
- [Artefato com nove Lighthouse JSON e nove Chrome traces](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42706411745/artifacts/13713194629). SHA-256 do ZIP `19bba55f1d08e92493ad1856128c0a4f33a572d47edff1d54828641d129123ed`.
- [Pacote completo com arquivos brutos, comparativos e verificação corrigida](https://chatgpt.com/library?file_id=libfile_cba033e46ac481919284dada00c3a9c1&account_id=personal).

O workflow de disparo único foi removido da ponta da branch após a execução. A definição permanece disponível no commit executado.
