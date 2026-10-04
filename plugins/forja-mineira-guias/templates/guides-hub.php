<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

$guide_count = count( $hub_guides );
?>
<section class="fmg-guide fmg-guides-hub" data-fmg-guides-hub>

  <header class="fmg-guides-hub__hero" aria-labelledby="fmg-hub-title">
    <img class="fmg-guides-hub__hero-art" src="<?php echo esc_url( $hub_assets['hero'] ); ?>" alt="" aria-hidden="true" decoding="async" fetchpriority="high">
    <span class="fmg-guides-hub__hero-overlay" aria-hidden="true"></span>

    <div class="fmg-guides-hub__hero-inner">
      <span class="fmg-guides-hub__eyebrow">GUIAS DA FORJA</span>
      <h1 id="fmg-hub-title">Guias de RPG para levar direto à mesa.</h1>
      <p class="fmg-guides-hub__hero-copy">
        Conteúdo prático para escolher melhor, montar personagens e entender como cada decisão funciona em jogo.
      </p>
    </div>

    <div class="fmg-guides-hub__legend" aria-label="Temas da Biblioteca da Forja">
      <span class="fmg-guides-hub__legend-label">Explore a Forja</span>

      <span class="fmg-guides-hub__legend-item">
        <img src="<?php echo esc_url( $hub_assets['classes'] ); ?>" alt="">
        <span class="fmg-guides-hub__legend-copy"><strong>Classes</strong><small>Guias por classe</small></span>
      </span>

      <span class="fmg-guides-hub__legend-item">
        <img src="<?php echo esc_url( $hub_assets['spells'] ); ?>" alt="">
        <span class="fmg-guides-hub__legend-copy"><strong>Spells</strong><small>Magias e truques</small></span>
      </span>

      <span class="fmg-guides-hub__legend-item">
        <img src="<?php echo esc_url( $hub_assets['feats'] ); ?>" alt="">
        <span class="fmg-guides-hub__legend-copy"><strong>Feats</strong><small>Talentos e sinergias</small></span>
      </span>

      <span class="fmg-guides-hub__legend-item">
        <img src="<?php echo esc_url( $hub_assets['backgrounds'] ); ?>" alt="">
        <span class="fmg-guides-hub__legend-copy"><strong>Backgrounds</strong><small>Origens e escolhas</small></span>
      </span>

      <span class="fmg-guides-hub__legend-item">
        <img src="<?php echo esc_url( $hub_assets['items'] ); ?>" alt="">
        <span class="fmg-guides-hub__legend-copy"><strong>Itens</strong><small>Equipamentos e recomendações</small></span>
      </span>
    </div>
  </header>

  <section class="fmg-guides-hub__featured" aria-labelledby="fmg-featured-title">
    <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;"
      class="fmg-guides-hub__featured-card"
      href="<?php echo esc_url( $hub_invocations_url ); ?>"
      aria-label="Abrir guia: Melhores Invocações Místicas para Bruxo">
      <img class="fmg-guides-hub__featured-art" src="<?php echo esc_url( $hub_assets['featured'] ); ?>" alt="" aria-hidden="true" decoding="async">
      <span class="fmg-guides-hub__featured-overlay" aria-hidden="true"></span>

      <div class="fmg-guides-hub__featured-copy">
        <span class="fmg-guides-hub__featured-kicker">Guia em destaque</span>
        <h2 id="fmg-featured-title">Melhores Invocações Místicas para Bruxo</h2>
        <span class="fmg-guides-hub__featured-edition">D&amp;D 5e 2024</span>

        <p>
          Escolha Invocações Místicas (Eldritch Invocations) por nível, função e estilo de jogo,
          com foco no que realmente funciona na mesa.
        </p>

        <div class="fmg-guides-hub__featured-meta" aria-label="Informações do guia">
          <span class="fmg-guides-hub__featured-meta-item">
            <img src="<?php echo esc_url( $hub_assets['warlock'] ); ?>" alt="" aria-hidden="true">
            <span>Bruxo (Warlock)</span>
          </span>
          <span class="fmg-guides-hub__featured-meta-item">
            <img src="<?php echo esc_url( $hub_assets['dnd2024'] ); ?>" alt="" aria-hidden="true">
            <span>D&amp;D 5e 2024</span>
          </span>
          <span class="fmg-guides-hub__featured-meta-item">
            <img src="<?php echo esc_url( $hub_assets['builds'] ); ?>" alt="" aria-hidden="true">
            <span>4 estilos de jogo</span>
          </span>
        </div>

        <span class="fmg-guides-hub__featured-cta">
          Ler guia <span aria-hidden="true">→</span>
        </span>
      </div>
    </a>
  </section>

  <div class="fmg-guides-hub__transition" aria-hidden="true"></div>

  <main class="fmg-guides-hub__shell" id="biblioteca">
    <header class="fmg-guides-hub__library-head">
      <div>
        <h2>BIBLIOTECA DA FORJA</h2>
        <p>Pesquise por conteúdo ou refine a biblioteca com os filtros abaixo.</p>
      </div>
      <span class="fmg-guides-hub__library-count"><?php echo esc_html( $guide_count ); ?> GUIAS PUBLICADOS</span>
    </header>

    <section class="fmg-guides-hub__controls" aria-label="Filtros da biblioteca">
      <div class="fmg-guides-hub__filter-top">
        <div class="fmg-guides-hub__search-wrap">
          <label for="guideSearch">Buscar na Forja</label>
          <div class="fmg-guides-hub__search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>
            <input id="guideSearch" type="search" placeholder="Buscar guia, magia, classe, item...">
          </div>
        </div>
        <button class="fmg-guides-hub__more" id="moreFilters" type="button" aria-expanded="false" aria-controls="advancedFilters">+ Mais filtros</button>
      </div>

      <div class="fmg-guides-hub__filter-main">
        <div class="fmg-guides-hub__field" data-filter-field="system">
          <label for="filterSystem">Sistema</label>
          <select id="filterSystem"><option value="">Todos os sistemas</option></select>
        </div>
        <div class="fmg-guides-hub__field" data-filter-field="category">
          <label for="filterCategory">Categoria</label>
          <select id="filterCategory"><option value="">Todas as categorias</option></select>
        </div>
        <div class="fmg-guides-hub__field" data-filter-field="class">
          <label for="filterClass">Classe</label>
          <select id="filterClass"><option value="">Todas as classes</option></select>
        </div>
        <div class="fmg-guides-hub__field" data-filter-field="level">
          <label for="filterLevel" id="levelLabel">Nível</label>
          <select id="filterLevel"><option value="">Todos os níveis</option></select>
        </div>
      </div>

      <div class="fmg-guides-hub__advanced" id="advancedFilters">
        <div class="fmg-guides-hub__advanced-inner">
          <div class="fmg-guides-hub__advanced-content">
            <span class="fmg-guides-hub__advanced-label">Função / estilo</span>
            <div class="fmg-guides-hub__style-chips" id="styleChips"></div>
          </div>
        </div>
      </div>

      <div class="fmg-guides-hub__filter-summary">
        <div class="fmg-guides-hub__active" id="activeFilters">
          <span class="fmg-guides-hub__active-empty">Nenhum filtro aplicado.</span>
        </div>
        <div class="fmg-guides-hub__summary-actions">
          <span class="fmg-guides-hub__result-count" id="resultCount"><?php echo esc_html( $guide_count ); ?> resultados</span>
          <button class="fmg-guides-hub__clear" type="button" id="clearFilters">Limpar filtros</button>
        </div>
      </div>
    </section>

    <section class="fmg-guides-hub__collection" aria-labelledby="fmg-all-guides-title">
      <header class="fmg-guides-hub__collection-head">
        <span class="fmg-guides-hub__collection-kicker">Biblioteca da Forja</span>
        <h3 id="fmg-all-guides-title">Todos os <span>Guias</span></h3>
        <p>Explore os guias publicados e leve mais conhecimento para as suas aventuras.</p>
      </header>

      <div class="fmg-guides-hub__guide-grid" id="guideGrid">
        <?php foreach ( $hub_guides as $guide ) : ?>
          <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;"
            class="fmg-guides-hub__guide-card"
            href="<?php echo esc_url( $guide['url'] ); ?>"
            aria-label="Abrir guia: <?php echo esc_attr( $guide['title'] ); ?>"
            data-title="<?php echo esc_attr( $guide['title'] ); ?>"
            data-system="<?php echo esc_attr( $guide['system'] ); ?>"
            data-category="<?php echo esc_attr( $guide['category'] ); ?>"
            data-class="<?php echo esc_attr( $guide['class'] ); ?>"
            data-levels="<?php echo esc_attr( $guide['levels'] ); ?>"
            data-styles="<?php echo esc_attr( $guide['styles'] ); ?>"
            data-search="<?php echo esc_attr( $guide['search'] ); ?>">
            <div class="fmg-guides-hub__guide-media">
              <img
                src="<?php echo esc_url( $guide['image'] ); ?>"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                style="object-position:<?php echo esc_attr( $guide['image_pos'] ); ?>;">
            </div>

            <div class="fmg-guides-hub__guide-body">
              <h4><?php echo esc_html( $guide['title'] ); ?></h4>
              <span class="fmg-guides-hub__guide-edition"><?php echo esc_html( $guide['edition'] ); ?></span>
              <p><?php echo esc_html( $guide['description'] ); ?></p>

              <div class="fmg-guides-hub__guide-meta" aria-label="Informações do guia">
                <span>
                  <img src="<?php echo esc_url( $hub_assets['warlock'] ); ?>" alt="" aria-hidden="true">
                  <span>Bruxo</span>
                </span>
                <span>
                  <img src="<?php echo esc_url( $guide['meta_icon'] ); ?>" alt="" aria-hidden="true">
                  <span><?php echo esc_html( $guide['meta_label'] ); ?></span>
                </span>
              </div>

              <span class="fmg-guides-hub__guide-cta">
                Ler guia <span aria-hidden="true">→</span>
              </span>
            </div>
          </a>
        <?php endforeach; ?>
      </div>

      <div class="fmg-guides-hub__empty" id="emptyState" aria-live="polite">
        <h3>Nenhum guia corresponde a esses filtros.</h3>
        <p>Remova um filtro ou limpe a busca para voltar à biblioteca publicada.</p>
        <button type="button" id="emptyClear">Limpar filtros</button>
      </div>
    </section>

    <section class="fmg-guides-hub__end" aria-labelledby="fmg-end-title">
      <div class="fmg-guides-hub__end-divider" aria-hidden="true"></div>

      <header class="fmg-guides-hub__end-head">
        <span class="fmg-guides-hub__end-kicker">Continue na Forja</span>
        <h3 id="fmg-end-title">A aventura não termina aqui.</h3>
        <p>Explore outras áreas da Forja Mineira D20 quando quiser ir além dos guias.</p>
      </header>

      <div class="fmg-guides-hub__end-grid">
        <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;" class="fmg-guides-hub__end-card" href="<?php echo esc_url( $hub_builds_url ); ?>">
          <img src="<?php echo esc_url( $hub_assets['builds'] ); ?>" alt="" aria-hidden="true">
          <span class="fmg-guides-hub__end-copy">
            <strong>Builds</strong>
            <small>Progressões completas, escolhas por nível e estratégias prontas para a mesa.</small>
            <span class="fmg-guides-hub__end-link">Explorar Builds →</span>
          </span>
        </a>

        <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;" class="fmg-guides-hub__end-card" href="<?php echo esc_url( $hub_tools_url ); ?>">
          <img src="<?php echo esc_url( $hub_assets['compass'] ); ?>" alt="" aria-hidden="true">
          <span class="fmg-guides-hub__end-copy">
            <strong>Ferramentas</strong>
            <small>Recursos práticos para criação, consulta e preparação de sessão.</small>
            <span class="fmg-guides-hub__end-link">Ver Ferramentas →</span>
          </span>
        </a>

        <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;" class="fmg-guides-hub__end-card" href="#biblioteca">
          <img src="<?php echo esc_url( $hub_assets['classes'] ); ?>" alt="" aria-hidden="true">
          <span class="fmg-guides-hub__end-copy">
            <strong>Guias de Classe</strong>
            <small>Aprofunde classes, sinergias e decisões importantes ao longo da progressão.</small>
            <span class="fmg-guides-hub__end-link">Explorar Classes →</span>
          </span>
        </a>
      </div>

      <div class="fmg-guides-hub__end-cta">
        <div>
          <span>Forja Mineira D20</span>
          <strong>Quer voltar ao início da Forja?</strong>
        </div>
        <a style="text-decoration:none!important;text-decoration-line:none!important;text-decoration-color:transparent!important;" href="<?php echo esc_url( $hub_home_url ); ?>">Voltar ao início →</a>
      </div>
    </section>
  </main>
</section>
