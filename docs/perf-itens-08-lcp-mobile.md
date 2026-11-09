# PERF-ITENS-08 — Diagnóstico do LCP mobile

Data da coleta: 07/11/2026, horário de Brasília. Status: **EVIDÊNCIA INSUFICIENTE** para atribuir a causa do atraso de pintura a um recurso ou tarefa específica. O elemento e a fase dominante estão identificados no relatório de referência.

## Medição de referência

[PageSpeed Insights mobile — 07/11/2026, 00:31:39](https://pagespeed.web.dev/analysis/https-forjamineirad20-com-br-itens-magicos-conjuradores-dnd-2024/ilq14wq6uw?form_factor=mobile). URL analisada: [Guia de Itens para Conjuradores](https://forjamineirad20.com.br/itens-magicos-conjuradores-dnd-2024/). Lighthouse 13.6.0, Moto G Power emulado, perfil mobile padrão do PSI com throttling simulado, conforme [documentação do Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#devtools-lighthouse-panel-throttling). Os valores de milissegundos foram lidos do link da calculadora de pontuação do relatório.

| Métrica | Valor |
| --- | ---: |
| Desempenho | 76/100 |
| FCP | 2.768 ms |
| LCP simulado | 4.546 ms |
| CLS | 0,000 |
| TBT | 29 ms |
| Speed Index | 5.037 ms |

## Elemento e reconciliação dos tempos

O insight **Detalhamento da LCP** identifica o nó `div.article-content > div.fmic-screen-shell > div.forja-page > section.hero`, uma `<section aria-labelledby="hero-title" class="hero">` que contém o título do guia. Esse insight usa o ID do nó do evento LCP do trace para exibir o seletor, conforme o [código do Lighthouse 13.6.0](https://github.com/GoogleChrome/lighthouse/blob/v13.6.0/core/audits/insights/lcp-breakdown-insight.js). A Pérola do Poder (Pearl of Power) é renderizada separadamente em imagens do catálogo e painel de detalhes com `loading="lazy"`.

| Fase exibida no insight | Duração exibida | Acumulado pelos valores arredondados |
| --- | ---: | ---: |
| TTFB | 40 ms | 40 ms |
| Atraso até solicitar o recurso | 320 ms | 360 ms |
| Duração do carregamento | 320 ms | 680 ms |
| Atraso até a pintura do elemento | 1.830 ms | 2.510 ms |
| **Soma das fases exibidas** | **2.510 ms** | |

A soma das fases vem da cronologia observada. O indicador de **4.546 ms** usa a simulação do PSI. A diferença aritmética de **2.036 ms** corresponde a comparar essas bases de tempo. Ela não representa uma quinta fase. O total observado exato e uma decomposição coerente dos 4.546 ms simulados não foram recuperados. Os 1.830 ms respondem por aproximadamente **73%** das fases exibidas.

## Recursos e atribuição

- **Confirmado.** A fase dominante no insight foi o intervalo entre o término do carregamento associado e a pintura. TTFB, descoberta e transferência tiveram durações menores nessa cronologia. O PSI também mostrou 300 ms de economia estimada para solicitações bloqueantes e duas tarefas longas. Esses indicadores não atribuem os 1.830 ms a uma folha de estilo ou script específico.
- **Confirmado no HTML e CSS públicos.** A imagem `hero-vaeros-mobile-1280.webp` (105.192 bytes) é pré-carregada com prioridade alta em até 850 px e usada como fundo de `.hero::before` nas regras mobile de `r6-perf.css`. `r6-perf.css?ver=1.0.6` aparece como stylesheet e `r6.js?ver=1.0.6` e `navigation.js?ver=0.1.0` aparecem como scripts. A Pérola do Poder tem variantes responsivas no card. O inventário HTTP registra arquivos entregues e seus hashes, sem equivalência com o waterfall do navegador.
- **Provável.** O fundo do hero é o recurso de imagem associado ao nó no perfil mobile, dado o seletor e a correspondência entre CSS e preload. A URL do recurso no evento LCP precisa do trace bruto para confirmação. O bloqueio de renderização por CSS merece inspeção, sem atribuição a `r6-perf.css` por enquanto.
- **Não confirmado.** Participação individual de `r6-perf.css`, `r6.js`, scripts globais, decodificação da imagem e tarefas longas na janela de atraso. O efeito causal do PERF-ITENS-07 sobre LCP exigiria comparação controlada com e sem o patch, usando o mesmo conteúdo e configuração.

## Coleta e artefatos

O teste pretendido usou Lighthouse 13.6.0 e Chrome headless em perfil novo com throttling `devtools`, para alinhar o indicador ao trace observado. O Chrome local encerrou na inicialização do processo gráfico antes da navegação. A alternativa interativa foi interrompida porque o controle do Chrome no Windows não conseguiu verificar a URL ativa. A API oficial do PageSpeed retornou HTTP 429 `RESOURCE_EXHAUSTED`. Não foram gerados `PERF-ITENS-08-LIGHTHOUSE-MOBILE.json` ou `PERF-ITENS-08-CHROME-TRACE.json`. Sem os artefatos brutos, não foi possível extrair waterfall, nós com ID do trace, cadeia crítica ou horários de execução dos scripts.

[Evidências extraídas e inventário HTTP em JSON](https://chatgpt.com/library?file_id=libfile_a3cbd73544108191a99240d650c343eb&account_id=personal), SHA-256 `9d0e8c240d2f18bf4b4e5b2bd58524551a4ba1c37651adfd453b4724da9de173`. Esse arquivo contém dados transcritos do PSI e hashes dos recursos públicos coletados, sem os dados brutos do Lighthouse ou do Chrome.

## Correção mínima

Ainda não há evidência para escolher um patch de produção. A primeira hipótese a validar é retirar do caminho crítico somente o recurso bloqueante que o trace mostrar entre o fim do carregamento do hero e a pintura. Caso o trace identifique CSS, a intervenção deve se limitar às regras comprovadamente não críticas à primeira pintura. A coleta de confirmação deve usar uma única navegação mobile com perfil frio, throttling DevTools e exportação conjunta do LHR e do trace. O diagnóstico foi somente leitura em produção.

## Rechecagem somente leitura — 09/11/2026

Uma **única nova execução mobile** do PageSpeed Insights foi realizada pelo navegador remoto:
[PageSpeed mobile de 09/11/2026](https://pagespeed.web.dev/analysis/https-forjamineirad20-com-br-itens-magicos-conjuradores-dnd-2024/a3lvocu0f3?form_factor=mobile).

| Métrica | Valor |
| --- | ---: |
| Performance | 75/100 |
| FCP | 2,9 s |
| LCP | **4,6 s** |
| TBT | 40 ms |
| CLS | **0** |
| Speed Index | 5,1 s |

O relatório visual voltou a identificar a região `section.hero` e apontou `hero-vaeros-mobile-1280.webp` como imagem principal associada ao Hero. **A identidade exata do nó/recurso LCP não foi confirmada por dados brutos do trace**, portanto não deve ser considerada demonstrada.

Fases apresentadas visualmente: TTFB 30 ms; resource load delay 370 ms; resource load duration 310 ms; element render delay 1.830 ms. **Somam 2.540 ms, não 4.600 ms**: a diferença de 2.060 ms segue sem reconciliação por artefato bruto. Não atribuir esse valor a uma nova fase nem presumir causalidade de CSS, JS ou imagem.

**Limites da coleta:** este ambiente possui Chromium e Playwright, porém sem resolução de DNS para o domínio público, logo não permite navegação e captura local. O navegador remoto conseguiu executar a medição PSI, mas não permite exportar LHR JSON/DevTools Performance Trace acessível nesta sessão. O GitHub contém somente workflows de empacotamento de plugins, sem pipeline de diagnóstico Lighthouse/trace já disponível. **Não foram obtidos Lighthouse JSON nem trace**. Nenhum arquivo do WordPress, plugin, tema ou cache foi modificado.

**Conclusão:** a persistência do LCP alto foi reconfirmada, com CLS zero, mas o diagnóstico causal continua **EVIDÊNCIA INSUFICIENTE**. A próxima coleta deverá ser executada em um ambiente com Chrome DevTools Protocol e rede pública funcionais (por exemplo, runner autorizado), exportando LHR e trace na **mesma navegação fria** antes de propor correção.

## PERF-ITENS-08-R2 — Captura de 09/11/2026

**EVIDÊNCIA PARCIAL quanto à causa do atraso histórico.** O LCP e o gargalo da captura R2 estão confirmados por dados brutos. Os 1.830 ms de renderização do relatório anterior não se reproduziram nesta execução.

### Captura e integridade

- [Execução 42670511180](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42670511180) e [artefato original](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42670511180/artifacts/13699420575), com os três arquivos. [Cópia do ZIP](https://chatgpt.com/library?file_id=libfile_fdcbb84801608191b98f25db4a99997c&account_id=personal).
- Captura UTC de 18:03:24.829 a 18:04:33.923. Chrome 156.0.8078.79, CDP 1.3, Node 22.23.4 e Lighthouse 13.6.0. URL inicial e final iguais à página pública do Guia de Itens.
- Lighthouse e trace vieram da **mesma navegação**, em viewport 412 × 823 px, DPR 1,75, UA Chrome Mobile Android reduzido e throttling `devtools`. Limites de rede configurados em 1.474,56 kbps de download, 675 kbps de upload, latência de requisição de 562,5 ms e CPU 4×.
- O pré-teste do Chrome confirmou HTTP 200 e `section.hero`. O cache HTTP local do Chrome foi limpo via CDP antes da medição e o Lighthouse manteve o reset padrão de armazenamento. Sessão pública e possíveis conexões reaproveitadas foram mantidas. O documento medido respondeu HTTP 200, com `x-hcdn-cache-status: HIT` e `X-LiteSpeed-Cache: hit`. Isso representa cache frio de recursos no navegador, com cache público do servidor ativo.
- O Chrome for Testing no Windows falhou na inicialização gráfica. A [primeira execução](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42669752671) parou na validação do YAML, corrigida antes da coleta. As [tentativas com UA Lighthouse](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42669980865) e [UA móvel reduzido](https://github.com/Peruzini/forja-mineira-d20/actions/runs/42670267468) foram invalidadas por HTTP 403 na navegação medida, embora o pré-teste Node respondesse 200. A segunda mostrou 403 seguido de 200 para o documento. O pré-teste no Chrome resolveu o impedimento na execução válida.
- [Código reproduzível do workflow temporário](https://github.com/Peruzini/forja-mineira-d20/blob/2a56a4ca586ed6f4d01380c7b38eb48bd7c3bf12/.github/workflows/perf-itens-08-r2-once.yml). Foi iniciado por commit deliberado, com branch, caminho e mensagem exclusivos, pois `workflow_dispatch` exige definição na branch padrão. O workflow foi removido da branch temporária no commit `c0e726bfc319e56736f0ec1b47cd216bfc3eb602`. Nenhuma modificação em produção ou na PR #10.

| Arquivo original | Bytes | SHA-256 verificado |
| --- | ---: | --- |
| `PERF-ITENS-08-R2-LIGHTHOUSE-MOBILE.json` | 716.533 | `62193a6458df9e1630481e9935d4c530c6e88c5a4690f1290c4a56db63d6756e` |
| `PERF-ITENS-08-R2-CHROME-TRACE.json` | 21.761.357 | `d0484a45343372133018cacaf116ff215b238a22c7d754302637c0a9c10735af` |
| `PERF-ITENS-08-R2-RUN-METADATA.json` | 1.605 | `7f82cc32906bea1b75a557bdaf11f06322e669e55d2fd458bd59ddc3f2576304` |

O ZIP original coincide com o digest do GitHub Actions, `5577f51cc1e877f95ffa881afde326d9a54ba41466d7fb5c8fb5350e70856405`. Os hashes do LHR e do trace também coincidem com os metadados da execução.

### Nó, recurso e fases

**A e B — Confirmado.** O LCP é uma **imagem de fundo CSS** do hero. O evento final `largestContentfulPaint::Candidate`, índice 2, identifica o nó **43** e o tipo `image`. O evento `LargestImagePaint::Candidate` no mesmo timestamp liga o nó 43 a [hero-vaeros-mobile-1280.webp](https://forjamineirad20.com.br/wp-content/plugins/forja-mineira-guia-itens-conjuradores/assets/hero-vaeros-mobile-1280.webp). `PaintImage` confirma `isCSS: true` e o pseudo-elemento `::before` (nó 44). O seletor do LHR é `div.article-content > div.fmic-screen-shell > div.forja-page > section.hero`, com `aria-labelledby="hero-title"`.

| Marco, relativo ao início da navegação | Tempo |
| --- | ---: |
| TTFB do documento | 130,662 ms |
| `ResourceSendRequest` da imagem | 649,949 ms |
| Descoberta registrada no candidato LCP | 650,800 ms |
| Início da rede no audit `network-requests` | 651,519 ms |
| Evento `ResourceReceiveResponse` da imagem | 1.250,480 ms |
| Fim efetivo do recurso pelo `ResourceFinish.finishTime` | 2.425,875 ms |
| `PaintImage` do fundo durante a pintura do hero | 2.430,296 ms |
| Evento LCP e `numericValue` do Lighthouse | **2.449,302 ms** |

`navigationStart.ts = 45.625.541 µs` e `largestContentfulPaint::Candidate.ts = 48.074.843 µs`, na navegação `1D3F526D60E84498063E55ACB2089201`. Os marcos de envio, descoberta e início de rede são eventos diferentes e não devem ser substituídos entre si.

| Fase no `lcp-breakdown-insight` | Tempo observado |
| --- | ---: |
| TTFB | 130,662 ms |
| Atraso até solicitação do recurso | 519,287 ms |
| Duração do carregamento, incluindo espera de rede | **1.775,926 ms** |
| Atraso até a pintura | 23,427 ms |
| **Total** | **2.449,302 ms** |

A pontuação foi **94/100**, FCP 1.518,644 ms, CLS **0**, TBT 182,692 ms e Speed Index 1.772 ms. `metrics.observedLargestContentfulPaint` arredonda o LCP para 2.449 ms. Nesta captura o throttling foi aplicado durante a navegação e não há LCP simulado no JSON. Os 4.600 ms aproximados do PSI anterior são simulados. A soma arredondada de 2.540 ms é das fases exibidas para a cronologia original daquele relatório. Nenhuma fase foi acrescentada à soma.

### O que ocupou a janela de renderização

**C — Confirmado.** O carregamento de rede do fundo do hero ocupou **72,5%** do LCP. A requisição HTTP/3 respondeu 200, transferiu 105.551 bytes e saiu com prioridade alta. O `lcp-discovery-insight` confirma descoberta pelo documento inicial, prioridade alta e carregamento imediato, sem lazy loading do LCP. O resultado identifica a fase dominante e não separa causa estrutural de rede de efeitos do throttling.

**D — Não confirmado para o PSI anterior.** A R2 tem apenas 23,427 ms do fim do recurso ao LCP. A janela contém 5,609 ms cobertos por `RunTask` na thread principal, incluindo `PrePaint` de 0,025 ms e `Paint` com 1,470 ms de cobertura sem somar eventos aninhados. `ImageDecodeTask` de 3,451 ms aparece em outra thread. Essa tarefa coincide temporalmente com a janela, sem vínculo individual de causalidade no evento. Não há tarefa longa, execução JavaScript identificada, recálculo de estilo ou layout na thread principal durante essa janela. O trace histórico do PSI é necessário para explicar seus 1.830 ms.

| Recurso | Evidência na R2 |
| --- | --- |
| `r6-perf.css?ver=1.0.6` | Identificado como bloqueante, mas terminou em 1.376,427 ms, antes do fim da imagem. O insight de bloqueio atribuiu economia de 0 ms ao LCP desta execução. |
| `r6.js?ver=1.0.6` | Rede de 2.425,773 a 3.084,328 ms. Sua transferência termina depois do LCP e o trace não mostra execução de JS na janela de pintura. |
| `navigation.js?ver=0.1.0` | Rede iniciada a 2.703,455 ms, depois do LCP. |
| Pérola do Poder (Pearl of Power) | A variante do card iniciou rede a 2.997,528 ms e o original a 4.594,485 ms. Ambos após o LCP. |
| Scripts globais e long tasks | As duas tarefas atribuídas ao Google Tag Manager começaram a 5.154,450 e 5.275,612 ms. As outras duas long tasks do audit começaram a 598,022 e 1.394,430 ms e acabaram antes da janela de pintura. |

**E — Não confirmado.** CLS permaneceu zero. A execução única com o PERF-ITENS-07 ativo e as diferenças de ambiente e throttling entre R2 e PSI não permitem inferir regressão causal do patch.

**F — Provável oportunidade, sem implementação.** Medir em ambiente isolado uma versão mobile menor do mesmo fundo, com proporção, geometria do hero e prioridade de preload equivalentes. O teste deve demonstrar queda no tempo de carregamento com CLS zero antes de justificar uma troca. O relatório de imagens não estimou uma economia específica para esse WebP. Não há suporte nesta captura para retirar `r6-perf.css`, atrasar `r6.js` ou reverter o PERF-ITENS-07.
