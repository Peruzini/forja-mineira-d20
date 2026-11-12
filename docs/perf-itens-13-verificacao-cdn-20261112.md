# PERF-ITENS-13 — Verificação da entrega CDN do Hero mobile sem acesso ao WordPress

**Data:** 12/11/2026. **Status:** CONCLUÍDO, sem falha comprovada. **Produção:** somente leitura via GET público HTTPS. Não houve login WordPress, WPVibe, manipulação da CDN, alterações de plugin, cache, tema ou HTML.

## Implementação independente do WordPress

- [GitHub Actions: execução 43281559484](https://github.com/Peruzini/forja-mineira-d20/actions/runs/43281559484) — success.
- [Script reproduzível](../scripts/perf-itens-13-cdn.py) — Python + curl, somente bibliotecas padrão.
- [Workflow de execução única](../.github/workflows/perf-itens-13-cdn-once.yml).
- [Artefato com headers brutos e JSON](https://github.com/Peruzini/forja-mineira-d20/actions/runs/43281559484/artifacts/13973101150): PERF-ITENS-13-CDN-HTTP-EVIDENCE.
- Imagem pública, **sem parâmetros cache-busting**:
  https://forjamineirad20.com.br/wp-content/plugins/forja-mineira-guia-itens-conjuradores/assets/hero-vaeros-mobile-960-v1.0.7.webp

## Método

Executamos **três GET HTTP/2** sequenciais (separados por 2 segundos) para a URL *exata* da imagem e um GET para cada recurso de controle (r6-perf.css?ver=1.0.7 e guia-itens-hero-conjuradores-128.webp). User-Agent Chrome Mobile. GitHub-hosted runner, curl 8.18.0. Não usamos HEAD, invalidação ou limpeza de cache. Cada GET pode naturalmente aquecer o cache da CDN. Essas medições não aplicam throttling Lighthouse e não equivalem a experiência de um visitante no Brasil em HTTP/3.

## Resultado do Hero

| Campo | GET 1 | GET 2 | GET 3 |
|---|---:|---:|---:|
| Status HTTP | 200 | 200 | 200 |
| Cache x-hcdn-cache-status | **HIT** | **MISS** | **MISS** |
| Identificador de borda no request-id | **imm-edge10** | **imm-edge8** | **imm-edge9** |
| Age | 3926 | ausente | ausente |
| x-hcdn-upstream-rt | ausente | 0,133 s | 0,129 s |
| Corpo transferido | 45.420 bytes | 45.420 bytes | 45.420 bytes |
| Tempo até primeiro byte, incluindo DNS/TLS (curl) | 340,367 ms | 387,449 ms | 339,126 ms |
| Tempo total da requisição | 481,483 ms | 505,179 ms | 438,554 ms |
| Tempo do corpo após primeiro byte | 141,116 ms | 117,730 ms | 99,428 ms |
| IP de conexão | 191.101.104.116 | 191.101.104.116 | 191.101.104.116 |

- **Integridade da imagem:** 3/3 respostas image/webp, assinatura RIFF/WEBP válida, corpos e hashes SHA-256 idênticos: c43ec1926159be62bd06612d56ee43861a6cda5e77c54b893a948f481329c36f.
- **Cache-Control:** public, max-age=604800 (7 dias) nas três respostas.
- Embora o IP registrado tenha sido o mesmo nos três GET, os identificadores no x-hcdn-request-id diferem (imm-edge10, imm-edge8, imm-edge9), indicando possível distribuição interna da CDN. Isso **não permite demonstrar MISS persistente de um único nó de cache**.
- **Controles:** CSS HTTP 200, cache MISS, total 378,205 ms; arte WebP de 128px HTTP 200, cache HIT, total 329,088 ms. O CSS respondeu MISS e ainda assim incluiu Age: 3931; a semântica interna de Age e x-hcdn-cache-status deve ser interpretada pela Hostinger, não assumida como prova de defeito.
- Nenhuma falha de status, arquivo incorreto, corrupção, redirecionamento indevido ou bloqueio de conteúdo observada.

## Conclusão e recomendações

1. **Confirmado:** entrega funcional da imagem pela CDN; os três downloads retornaram HTTP 200, tamanho e hash exatos, WebP válido.
2. **Confirmado:** há HIT e MISS em requisições consecutivas, com identificadores de edge distintos. Isso não caracteriza falha persistente.
3. **Não confirmado:** a causa dos ~2.240 ms de carregamento no Lighthouse mobile anterior. O GET do GitHub runner não passa pelas mesmas condições de rede e não executa navegador/Chrome HTTP/3.
4. **Decisão:** **não mexer na CDN nem no plugin 1.0.7** por causa desses resultados. Evitar purgar cache, alterar compressão ou reescrever o Hero sem motivo comprovado.
5. **Independência:** os scripts e workflows de diagnóstico estão no GitHub. As futuras análises externas de HTTP, CDN, Lighthouse e Chrome trace podem rodar via Actions sem WordPress admin e sem plugin de acesso WPVibe. Para *inspeção estática completa do código do plugin* no Git, seria necessário também manter no repositório uma cópia versionada da versão realmente instalada, ainda ausente em main.

**P0:** entrega externa validada; não há correção obrigatória identificada. Um teste regional/real-user só se justifica se houver evidência nova de lentidão no público brasileiro.
