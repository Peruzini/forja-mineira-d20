# PERF-ITENS-11 — Diagnóstico da transferência do Hero mobile (leitura do trace)

Data: 12/11/2026 (BRT). **Status: ANÁLISE CONCLUÍDA; causa exclusiva não comprovada.** Escopo: versão publicada `forja-mineira-guia-itens-conjuradores-v1.0.7`, somente leitura da captura **PERF-ITENS-10**. **Nenhuma nova execução Lighthouse, alteração do WordPress, cache, plugin ou conteúdo.**

## Fontes e integridade

- GitHub Actions: https://github.com/Peruzini/forja-mineira-d20/actions/runs/43261008867 (job concluído com sucesso).
- ZIP do artefato: https://github.com/Peruzini/forja-mineira-d20/actions/runs/43261008867/artifacts/13964515238, `PERF-ITENS-10-MOBILE-COLD-RAW`.
- `PERF-ITENS-10-LIGHTHOUSE-MOBILE.json`: 578.449 bytes, SHA-256 `23ab54fbf6a1a28d140dae1a694c0c58c768f4279dad8a35172e8353b73869bc`.
- `PERF-ITENS-10-CHROME-TRACE.json`: 6.799.481 bytes, SHA-256 `0cd049b78a10f46f347c58ae7b8550043bc04affae40712000684b24e694aa42`.
- `PERF-ITENS-10-SUMMARY.json`: 7.453 bytes, SHA-256 `0dd8aa559be800ac4936d353bf0ce6164b91dae397cad544156c6c8113c7c889`.
- Os três hashes foram novamente verificados após extrair o ZIP original.
- Chrome 156.0.8078.79, Lighthouse 13.6.0, 412×823 CSS px, DPR 1,75, throttling DevTools (latência de solicitação configurada: 562,5 ms; throughput de download: 1.474,56 kbps; CPU 4×). Uma navegação Lighthouse, LHR e trace associados. Perfil Chrome novo e cache HTTP do navegador limpo; cache de CDN/servidor não foi limpo. Houve preflight antes da coleta, mas não medição adicional.

## Resultados observados

- Página alvo: `https://forjamineirad20.com.br/itens-magicos-conjuradores-dnd-2024/`.
- Performance 93/100; FCP 1.477,003 ms; LCP 2.876,397 ms; TBT 158,584 ms; CLS 0; Speed Index 1.744 ms.
- O candidato final LCP do trace é uma **imagem CSS** da `section.hero`, `nodeId=28`, ligada pelo evento `LargestImagePaint::Candidate` ao recurso `hero-vaeros-mobile-960-v1.0.7.webp` (`DOMNodeId=28`). `PaintImage` informa `isCSS:true` e pseudo-elemento `::before`, com origem 960×384.
- Requisição da imagem: HTTP 200; HTTP/3; `resourceSize=45420` bytes, `transferSize=45802` bytes; prioridade `High`; `isLinkPreload=true`; `connectionReused=true`; `fromCache=false` (navegador); sem nova negociação DNS/TCP/TLS observável nesse recurso (`dnsStart/connectStart/sslStart=-1`).
- **Diferença de cache importante:** documento HTML medido retornou `x-hcdn-cache-status:HIT` e `x-litespeed-cache:hit`, mas os cabeçalhos HTTP da própria imagem no `ResourceReceiveResponse` do trace registram **`x-hcdn-cache-status:MISS`**, `server:hcdn`, `x-hcdn-upstream-rt:0.160` e `cache-control: public, max-age=604800`. Esse MISS é um registro de **uma única requisição**; não prova falha sistemática de cache nem estabelece causa exclusiva da duração. Outras folhas CSS essenciais também registraram `MISS` na coleta.

### Decomposição LCP (Lighthouse, mesma navegação)

| Fase | Duração | % |
| --- | ---: | ---: |
| TTFB do documento | 41,023 ms | 1,4% |
| Atraso até a solicitação do Hero | 575,647 ms | 20,0% |
| Carregamento do recurso Hero | **2.240,187 ms** | **77,9%** |
| Atraso entre fim da imagem e pintura | 19,540 ms | 0,7% |
| **LCP** | **2.876,397 ms** | 100% |

### Detalhe da requisição no trace do Chrome

Identificador do recurso `requestId=2474.2`; `ResourceSendRequest` ts 38.778.412 µs; `ResourceReceiveResponse` ts 39.358.509 µs; primeiro `ResourceReceivedData` ts 39.389.893 µs; último bloco ts 41.018.575 µs; `ResourceFinish` ts 41.019.905 µs.

| Subintervalo observado | Duração aproximada |
| --- | ---: |
| Solicitação → cabeçalhos | **580,097 ms** |
| Cabeçalhos → primeiro bloco | 31,384 ms |
| Primeiro → último bloco | **1.628,682 ms** |
| Último bloco → fim | 1,330 ms |
| Total `ResourceSendRequest` → `ResourceFinish` | **2.241,493 ms** |

Os 30 eventos `ResourceReceivedData` dessa requisição totalizam 45.420 bytes. As pequenas diferenças entre o relógio dos eventos e a decomposição do Lighthouse vêm das referências temporais distintas.

### Concorrência observada

- **33 solicitações tiveram intervalos de rede que se sobrepuseram em algum momento** à janela do carregamento do Hero (não significa 33 simultâneas durante toda a janela).
- CSS bloqueantes `r6-perf.css`, `style.css`, `clusters.css`, `complemento.css` e `calculator.css` foram solicitados logo após o Hero.
- Imagens concorrentes incluem `marca.png` (42 KB de dados de imagem observados na janela), `spells.webp` (30,9 KB) e `guia-itens-hero-conjuradores-128.webp` (24,5 KB), além de ícones e miniaturas iniciadas enquanto o Hero permanecia em transferência.
- O perfil simula uma conexão de download de **1.474,56 kbps**. A transferência isolada e ideal dos 45.420 bytes da imagem equivaleria a aproximadamente **246 ms**, *sem* latência, disputa por banda, custo do protocolo ou variabilidade do servidor. Os 1.629 ms observados para o corpo são compatíveis com competição por rede sob o throttling, mas a captura não quantifica causalidade individual para cada recurso.
- O `ResourceReceiveResponse` informa `timing.requestTime=38.779932` e `receiveHeadersEnd=577.831 ms`, consistente em ordem de grandeza com a latência artificial de 562,5 ms. Não há evidência, nessa coleta, de conexão nova como fator dominante.
- O `render-blocking-insight` estima 0 ms de economia de LCP no cenário medido. O `r6.js` teve transferência completada depois do LCP; os ~20 ms de pós-carga não justificam atribuir o gargalo da imagem à execução do script.

## Conclusões com grau de evidência

1. **CONFIRMADO:** imagem mobile v1.0.7 de 960 px é o LCP, tem prioridade alta e preload, responde 200 por HTTP/3, não vem do cache local do Chrome, e terminou transferência aproximadamente 20 ms antes do LCP.
2. **CONFIRMADO:** 77,9% do LCP corresponde ao intervalo de carregamento do recurso; destes, ~580 ms se passam antes dos cabeçalhos e ~1.629 ms entre primeiro e último bloco de dados.
3. **CONFIRMADO:** a requisição do Hero foi um `MISS` na CDN Hostinger nessa captura; documento foi `HIT`. MISS isolado não demonstra cache permanentemente ineficiente.
4. **CONFIRMADO:** há requisições concorrentes durante o carregamento sob throttling de rede. A duração de transferência pode ser influenciada por essa concorrência; não foi executado contrafactual para provar seu efeito marginal.
5. **NÃO CONFIRMADO:** defeito de CDN/origem em produção, saturação real para usuários, gargalo de decodificação/renderização, ou benefício quantitativo de alterar JS, CSS, imagens ou cache.
6. **SEM NOVA INTERVENÇÃO:** nenhuma mudança de plugin/hotfix/tema/CDN em produção é recomendada só com esta coleta. Para provar ganho de uma otimização futura, executar experimento isolado controlando somente requisições não essenciais antes do LCP, com HTML/hero/viewport/rede idênticos, e comparar com controle. Isso **não foi executado nesta etapa**.

**Decisão:** PERF-ITENS-11 fecha a análise do trace existente; não indica rollback do Hero de 960 px nem nova versão do plugin sem contrafactual.
