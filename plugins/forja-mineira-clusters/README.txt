=== Forja Mineira D20 — Clusters ===
Stable tag: 1.0.6-TESTE
Version: 1.0.6-TESTE
Status: CANDIDATA PARA INSTALAÇÃO DE TESTE; NÃO HOMOLOGADA EM PRODUÇÃO.

Objetivo
Centralizar links internos estruturais entre conteúdos relacionados da Forja Mineira D20.

Clusters
Bruxo (Warlock): Magias, Invocações, Itens e Build Voldemort (preservado).
Conjuradores: Guia dos 10 Itens Mágicos e Build Doutor Destino (Doctor Doom).

Shortcode de teste
[forja_cluster cluster="bruxo" atual="magias"]

Slot recomendado para integração futura
<?php do_action( 'forja_d20_cluster_slot', 'bruxo', 'magias' ); ?>

Regras
- não altera post_content;
- não faz auto-link de palavras;
- não depende de JavaScript;
- usa links <a href> renderizados no servidor;
- desativar o plugin não quebra os demais plugins;
- auditoria em Ferramentas > Forja — Clusters é somente leitura.

Integração
A v1.0.5 TESTE é isolada. Os plugins Magias, Invocações, Itens e Builds ainda não devem ser alterados até aprovação deste componente.

== 1.0.1 — TESTE ==
- Replica o padrão visual aprovado do bloco “Continue na Forja” do Guia de Magias.
- Usa fundo papel/creme, cards claros, acentos laterais, Georgia nos títulos e CTAs compactos.
- Substitui SVGs genéricos pelos ícones oficiais já aprovados na Biblioteca da Forja.
- Ícones empacotados a partir dos assets oficiais da Biblioteca: spells.webp, bruxo-warlock.webp, itens.webp, builds.webp e forja-bussola-institucional.webp.
- Mantém o plugin visualmente independente do Guia de Magias: o CSS foi adaptado para o namespace FMC.
- Build é posicionada no centro do trio quando participa das relações.
== 1.0.2 — TESTE ==
- Leva para o plugin o design visual aprovado no HTML de validação.
- Cabeçalho centralizado com divisor ornamental simétrico e linhas laterais.
- Mantém kicker, título e subtítulo centralizados.
- Padroniza todas as molduras de ícone com fundo creme, mesma borda, raio, padding e sombra.
- Preserva as cores e variantes editoriais dos cards aprovados na v1.0.1.
- Não altera Registry, Relations, Resolver, auditoria ou integrações com outros plugins.



== 1.0.3 — TESTE ==
- Corrige o dimensionamento do Cluster quando o shortcode é renderizado dentro de contêiner estreito do WordPress/Gutenberg.
- No desktop, o componente controla sua própria largura editorial, até 1320px, centralizado em relação ao contêiner pai.
- Mantém 3 colunas confortáveis no desktop e preserva os breakpoints de tablet e mobile.
- Não altera cards, cores, ícones, divisor, textos, relações ou lógica do Cluster.


== 1.0.4 — TESTE ==
- Amplia o Cluster no desktop para acompanhar quase toda a largura útil da viewport, preservando margem lateral de 16px.
- Remove o teto de 1320px usado na v1.0.3.
- Aumenta visualmente os ícones dentro da moldura aprovada, removendo o padding interno de 4px.
- Mantém moldura, cards, cores, divisor, tipografia, textos, relações e lógica do Cluster sem alterações.


== 1.0.5 — TESTE ==
- Define o fundo da moldura dos ícones como #F7F0DF.
- Amplia levemente a arte dos ícones em 10% dentro da mesma moldura.
- Mantém dimensões da moldura, cards, cores dos cards, divisor, tipografia, textos, relações e lógica do Cluster sem alterações.


== 1.0.6-TESTE — FORJA-CLUSTER-EXP-02 ==
- Novo cluster lógico `conjuradores` com os nós `itens_conjuradores` (WP 334) e `doutor_destino` (WP 351).
- Matriz editorial assimétrica: 1 card Doutor Destino → Guia dos 10 Itens, somente se o destino estiver publicado; sem card inverso obrigatório.
- Título e subtítulo próprios para Conjuradores; layout de card único responsivo.
- Requer status `publish` para todo card; invalidação/revalidação do cache quando a página for despublicada ou mudar de URL.
- Preserva `bruxo.php`, os 3 cards atuais em cada página, ícones aprovados e arte existente.

COMO EXIBIR O CARD NO DOUTOR DESTINO
- Quando a página da Build Doutor Destino estiver pronta, inserir EXATAMENTE UMA vez o shortcode no bloco de conteúdo apropriado, após a build:
  [forja_cluster cluster="conjuradores" atual="doutor_destino"]
- Alternativa em código no plugin consumidor (não combinar com shortcode):
  do_action( 'forja_d20_cluster_slot', 'conjuradores', 'doutor_destino' );
- O registro dos nós é automático ao ativar Clusters, mas inserir o shortcode/slot é necessário para o card aparecer.
- Se o Guia de Itens não estiver publicado, o card não aparece; não existe módulo vazio.
- Não adicionar shortcode ao Guia dos Itens: nessa etapa ele não possui relações estruturais de saída.
- O link contextual Guia → Doutor Destino depende de validação SEO posterior, fora deste plugin.

INSTALAÇÃO / ROLLBACK
- Em ambiente de teste, instalar o ZIP como atualização do plugin `forja-mineira-clusters` (manter mesmo diretório).
- Testar as quatro páginas Bruxo; conferir em Ferramentas > Forja — Clusters os dois novos nós e a resolução por page_id.
- Com a página 351 em draft, nenhum link apontará para ela; publicar e inserir o shortcode somente após os gates da Build.
- Antes de produção, guardar `forja-mineira-clusters-v1.0.5-PRODUCAO.zip` como rollback e validar instalação/preview.
- Este pacote não altera conteúdo WordPress, shortcodes dos consumidores, URLs ou estado de publicação de páginas.
