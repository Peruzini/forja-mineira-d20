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
