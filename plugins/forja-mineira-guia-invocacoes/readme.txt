Forja Mineira D20 — Guia de Invocações v1.3.8 — PRODUÇÃO

Shortcode:
[forja_guia_invocacoes_bruxo_2024]

Atualização 1.3.0:
- integra o HTML final aprovado do Guia de Invocações;
- preserva Hero, filtros por nível/estilo/função, cards e análise contextual;
- substitui os blueprints antigos pelo seletor final de quatro mini builds navegáveis;
- Rajada & Controle, Pacto da Lâmina, Pacto do Tomo e Pacto da Corrente mantêm a escala visual aprovada;
- novos ícones de Lâmina, Tomo e Corrente verde-esmeralda;
- títulos das quatro builds padronizados na mesma geometria;
- remove o bloco 2014 × 2024 / Legacy e a seção FAQ;
- CTAs finais compactos para Build Voldemort e Guia de Itens;
- assets visuais externos ao HTML para reduzir o peso da resposta e permitir cache do navegador;
- preserva os atributos build_url e items_url do shortcode.

URLs canônicas relacionadas:
https://forjamineirad20.com.br/voldemort-dnd-5e-build-bruxo/
https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/

Antes de publicar em produção, validar desktop e mobile no WordPress.

Atualização 1.3.3 TESTE:
- base: v1.3.0 correta fornecida pelo usuário;
- remove somente o bloco final `CONTINUE NA FORJA / Use o guia dentro de uma build real`;
- remove somente o bloco `Como este guia foi montado` e suas fontes;
- corrige os níveis 12, 15 e 18 para permanecerem em uma única linha;
- não adiciona o Cluster nesta etapa;
- não altera Hero, filtros de Estilo/Função, cards, análises, mini builds, Grimório versátil, imagens ou JavaScript;
- v1.3.0 permanece a base segura para rollback.

Atualização 1.3.4 TESTE:
- parte diretamente da v1.3.3 TESTE validada;
- remove somente o rodapé interno redundante `FORJA MINEIRA D20 / Guias práticos...`;
- reduz somente o padding inferior do shell antes do footer real do tema;
- mantém a correção dos filtros 12, 15 e 18;
- não adiciona o Cluster nesta etapa;
- todo o conteúdo visual e funcional acima do fechamento permanece preservado;
- v1.3.3 TESTE permanece como rollback imediato.

Atualização 1.3.5 TESTE:
- parte da v1.3.4 TESTE;
- corrige a origem do vazio inferior dos mini builds: o iframe agora pode encolher antes de medir o conteúdo real;
- zera apenas padding/margem inferior do shell e dos wrappers da página que contém o Guia;
- mantém a correção dos filtros 12, 15 e 18;
- mantém removidos os blocos finais antigos e o footer interno redundante;
- não adiciona o Cluster nesta etapa;
- template HTML, imagens e demais geometrias do Guia permanecem congelados;
- v1.3.4 TESTE permanece como rollback imediato.

Atualização 1.3.6 TESTE:
- parte da v1.3.5 TESTE;
- altera somente o fechamento dos mini builds;
- remove `margin-bottom: 48px` dos wrappers internos dos mini builds (5 ocorrências);
- altera `.fmgi-final-mini .hub` de `padding: 18px` para `padding: 18px 18px 6px`;
- nenhuma outra alteração visual, estrutural ou funcional;
- Cluster ainda não reinserido;
- v1.3.5 TESTE permanece como rollback imediato.

Atualização 1.3.7 TESTE:
- parte diretamente da v1.3.6 TESTE;
- alteração única: remove a altura mínima `100vh` dos HTMLs internos dos mini builds;
- aplica `min-height:0!important; height:auto!important;` nas 2 ocorrências encontradas;
- preserva o `resizeFrame()` já existente;
- não altera painéis, Grimório, filtros, imagens, conteúdo, Cluster ou footer externo;
- v1.3.6 TESTE permanece como rollback imediato.

Atualização 1.3.8 — PRODUÇÃO:
- parte diretamente da v1.3.7 TESTE validada;
- reintegra o Cluster de Bruxo pelo hook oficial:
  `do_action( 'forja_d20_cluster_slot', 'bruxo', 'invocacoes' );`
- o Cluster entra após o último mini build e antes do drawer fixo de análise;
- não altera Hero, filtros, 28 Invocações, análises, mini builds, imagens, CSS ou JavaScript;
- não usa shortcode manual do Cluster na página;
- se o plugin Clusters estiver desativado, o Guia continua funcional sem o módulo;
- v1.3.0 é o rollback estável imediato de produção;
- v1.3.7 TESTE permanece arquivada apenas como histórico da validação;
- integração nativa do Cluster aprovada no WordPress em 04/10/2026.
