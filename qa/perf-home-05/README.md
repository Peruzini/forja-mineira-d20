# PERF-HOME-05 — CSS condicional da Home (staging RC1)

**Estado:** protótipo em branch isolada — não aprovado para produção.
**WordPress de produção:** inalterado. **Versão candidata:** 2.3.29-rc.1.

## Mudança proposta
- Extração literal, preservando ordem e cascata, do trecho de Home em `assets/css/builds.css` para `assets/css/home.css`.
- Os cinco shortcodes da Home passam a solicitar `home.css`:
  `forja_home_hero`, `forja_home_build_cycle`, `forja_home_featured_guide`, `forja_home_next_build`, `forja_home_featured_build`.
- `forja_build` (Voldemort) e `forja_builds_hub` mantêm o CSS original completo.
- Fallback automático para `builds.css` se o novo arquivo não existir.
- JS, markup original do WordPress, imagens, URLs, shortcodes e regras Core/HoF permanecem inalterados.

## Evidência anterior
- PageSpeed Insights mobile da Home: 68/100, LCP 6,3 s, FCP 3,0 s, CLS 0, TBT 150 ms.
- Desktop: 95/100, LCP 1,4 s, CLS 0, TBT 30 ms.
- A causa exata do LCP ainda não foi isolada. **Não atribuir ganho de LCP à separação do CSS sem medir.**
- CSS completo: ~309 KiB como fonte; `home.css`: ~64 KiB como fonte. Valores não são bytes transferidos com compressão.

## Validações e limitações
1. `php -l` nos arquivos PHP modificados.
2. `python3 qa/perf-home-05/check.py` compara CSS extraído ao trecho original, valida estrutura, chamadas e fallback.
3. `qa/perf-home-05/index.html` contém uma **prévia estática representativa** da Home, com alternância manual entre CSS original e candidato, e votação desativada. Ela NÃO substitui staging WordPress e seus efeitos dinâmicos.
4. Conferir visualmente nas larguras 360/390/768/1440 px e comparar votações e cards **em staging WordPress real**, quando houver ambiente.
5. Rodar Lighthouse mobile e desktop no staging WordPress e comparar medianas com produção, sob condições equivalentes.
6. Antes de qualquer merge, obter aprovação explícita e plano de rollback.

## Critérios de bloqueio
- Falha na paridade CSS, PHP lint ou carregamento condicional.
- Regressão visual em hero, mascote, ciclo, votação, guias e Hub/Build.
- Erros de votação, shortcodes ou recursos.
- Degradação sistemática de CLS, LCP ou FCP.

## Rollback
A produção não precisa de rollback enquanto a branch estiver isolada. Em eventual publicação posterior, voltar a usar `builds.css` em todos os shortcodes ou restaurar a versão publicada do plugin e invalidar cache.
