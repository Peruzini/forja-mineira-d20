<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

$build_url = ! empty( $hub_build_url )
    ? $hub_build_url
    : home_url( '/voldemort-dnd-5e-build-bruxo/' );

$guide_url = ! empty( $hub_guide_url )
    ? $hub_guide_url
    : home_url( '/?s=Bruxo' );

$guides_url = home_url( '/guias/' );
$tools_url  = home_url( '/ferramentas/' );
$vote_url   = home_url( '/#votacao-proxima-build' );
$home_url   = home_url( '/' );

$hero_image = FMB_URL . 'assets/images/voldemort-featured-five-stages.webp?ver=' . FMB_VERSION;
$card_image = FMB_URL . 'assets/images/voldemort-l17-img1-bffe22434a23.webp?ver=' . FMB_VERSION;
$mascot     = FMB_URL . 'assets/images/pao-de-queijo-d20.png?ver=' . FMB_VERSION;

$icon_guides = FMB_URL . 'assets/images/forja-bussola-institucional.webp?ver=' . FMB_VERSION;
$icon_tools  = FMB_URL . 'assets/images/regras.webp?ver=' . FMB_VERSION;
$icon_builds = FMB_URL . 'assets/images/builds.webp?ver=' . FMB_VERSION;
?>
<div class="fmb-hub" id="forja-builds">
  <section class="fmb-hub-intro">
    <div>
      <span class="fmb-hub-eyebrow">FORJA MINEIRA D20 · BUILDS</span>
      <h1>Escolha sua próxima lenda</h1>
      <p>
        Builds completas, pensadas do nível 1 ao 20, com progressão mecânica,
        identidade visual, estratégia de combate e equipamentos desejáveis.
      </p>
    </div>
  </section>

  <section class="fmb-featured-build fmb-featured-build--progression" aria-labelledby="fmb-featured-title">
    <a
      class="fmb-featured-art-wrap fmb-featured-art-link"
      href="<?php echo esc_url( $build_url ); ?>"
      aria-label="Abrir a build completa de Voldemort, do nível 1 ao 20"
    >
      <img class="fmb-featured-art-full" src="<?php echo esc_url( $hero_image ); ?>" alt="Cinco fases visuais da progressão da build, do estudante ao poder absoluto">
      <div class="fmb-featured-art-glow" aria-hidden="true"></div>

      <div class="fmb-featured-topline">
        <div class="fmb-featured-label">
          <span class="fmb-live-dot" aria-hidden="true"></span>
          BUILD EM DESTAQUE
        </div>
        <div class="fmb-featured-counter">
          <span>NOVA BUILD</span>
          <strong>01</strong>
        </div>
      </div>
    </a>

    <div class="fmb-featured-footer">
      <div class="fmb-featured-footer-copy">
        <div class="fmb-featured-kicker">D&D 5E · REGRAS 2024 · BRUXO · NÍVEL 1–20</div>
        <h2 id="fmb-featured-title">Voldemort</h2>
        <p class="fmb-featured-sub">O poder além da morte</p>
        <p class="fmb-featured-copy">
          Uma progressão completa de Bruxo focada em conhecimento, controle,
          manipulação, servos e poder arcano — agora apresentada pelas cinco fases da transformação.
        </p>

        <div class="fmb-featured-tags" aria-label="Características da build">
          <span>Bruxo</span>
          <span>Grande Antigo</span>
          <span>Controle</span>
          <span>Nível 1–20</span>
          <span>2024</span>
        </div>
      </div>

      <div class="fmb-featured-actions fmb-featured-actions--footer">
        <a class="fmb-hub-btn fmb-hub-btn--primary" href="<?php echo esc_url( $build_url ); ?>">
          Ver build completa <span aria-hidden="true">→</span>
        </a>
        <a class="fmb-hub-btn fmb-hub-btn--ghost" href="<?php echo esc_url( $guide_url ); ?>">
          Guia do Bruxo
        </a>
      </div>
    </div>
  </section>

  <section class="fmb-build-catalog" aria-labelledby="fmb-catalog-title">
    <header class="fmb-catalog-head">
      <div>
        <span class="fmb-hub-eyebrow">CATÁLOGO</span>
        <h2 id="fmb-catalog-title">Todas as Builds</h2>
      </div>
      <p>
        Sem filtros por enquanto. Conforme o catálogo crescer, entram filtros por
        <strong>classe</strong>, <strong>regras</strong>, <strong>função</strong> e estilo de jogo — sem ocupar espaço agora.
      </p>
    </header>

    <div class="fmb-build-grid">
      <article class="fmb-build-card" data-class="bruxo" data-rules="2024" data-role="controle">
        <a href="<?php echo esc_url( $build_url ); ?>" class="fmb-build-card-link">
          <div class="fmb-build-card-art">
            <img src="<?php echo esc_url( $card_image ); ?>" alt="Build de Bruxo inspirada em um lorde das trevas">
            <span class="fmb-card-badge">DESTAQUE</span>
          </div>

          <div class="fmb-build-card-body">
            <div class="fmb-build-card-meta">BRUXO · 2024 · NÍVEL 1–20</div>
            <h3>Voldemort</h3>
            <p>Conhecimento, controle, servos e magia proibida em uma progressão completa.</p>

            <div class="fmb-card-tags">
              <span>Controle</span>
              <span>Grande Antigo</span>
              <span>Arcano</span>
            </div>

            <div class="fmb-card-cta">
              Explorar build <span aria-hidden="true">→</span>
            </div>
          </div>
        </a>
      </article>

      <article class="fmb-build-card fmb-build-card--future" aria-label="Novas builds em breve">
        <div class="fmb-future-inner">
          <img src="<?php echo esc_url( $mascot ); ?>" alt="">
          <span>PRÓXIMAS FORJAS</span>
          <h3>Mais builds estão chegando</h3>
          <p>Novos personagens entram aqui conforme o catálogo crescer.</p>
        </div>
      </article>
    </div>
  </section>

  <section class="fmb-builds-continue" aria-labelledby="fmb-builds-continue-title">
    <div class="fmb-builds-divider" aria-hidden="true">
      <span class="fmb-builds-divider-line fmb-builds-divider-line--left"></span>
      <span class="fmb-builds-divider-diamond">
        <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
          <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z"/>
          <path d="M8 5 11 8 8 11 5 8Z"/>
        </svg>
      </span>
      <span class="fmb-builds-divider-line fmb-builds-divider-line--right"></span>
    </div>

    <header class="fmb-builds-continue-head">
      <span class="fmb-hub-eyebrow">CONTINUE NA FORJA</span>
      <h2 id="fmb-builds-continue-title">A build é só o começo</h2>
      <p>
        Depois da progressão, continue por guias, ferramentas e pela escolha da próxima
        personagem a entrar na Forja.
      </p>
    </header>

    <div class="fmb-builds-continue-grid">
      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $guides_url ); ?>">
        <span class="fmb-builds-icon-frame">
          <img src="<?php echo esc_url( $icon_guides ); ?>" alt="" loading="lazy" decoding="async">
        </span>
        <span class="fmb-builds-card-copy">
          <span class="fmb-builds-card-kicker">NAVEGAÇÃO</span>
          <strong>Guias</strong>
          <span>Classes, magias, itens e decisões de personagem reunidos em um só lugar.</span>
          <b>Explorar Guias →</b>
        </span>
      </a>

      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $tools_url ); ?>">
        <span class="fmb-builds-icon-frame">
          <img src="<?php echo esc_url( $icon_tools ); ?>" alt="" loading="lazy" decoding="async">
        </span>
        <span class="fmb-builds-card-copy">
          <span class="fmb-builds-card-kicker">UTILIDADES</span>
          <strong>Ferramentas</strong>
          <span>Calculadoras e recursos rápidos para usar antes e durante a mesa.</span>
          <b>Ver Ferramentas →</b>
        </span>
      </a>

      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $vote_url ); ?>">
        <span class="fmb-builds-icon-frame">
          <img src="<?php echo esc_url( $icon_builds ); ?>" alt="" loading="lazy" decoding="async">
        </span>
        <span class="fmb-builds-card-copy">
          <span class="fmb-builds-card-kicker">PRÓXIMA FORJA</span>
          <strong>Escolha a próxima Build</strong>
          <span>Ajude a decidir qual personagem será o próximo a ganhar uma progressão completa.</span>
          <b>Ir para a votação →</b>
        </span>
      </a>
    </div>

    <div class="fmb-builds-return-strip">
      <span>Forja Mineira D20 · Quer voltar ao início da Forja?</span>
      <a href="<?php echo esc_url( $home_url ); ?>">Voltar ao início →</a>
    </div>
  </section>
</div>
