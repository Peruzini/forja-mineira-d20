<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

$build_url  = ! empty( $home_build_url )  ? $home_build_url  : home_url( '/voldemort-dnd-5e-build-bruxo/' );
$builds_url = ! empty( $home_builds_url ) ? $home_builds_url : home_url( '/builds/' );
$tools_url  = ! empty( $home_tools_url )  ? $home_tools_url  : home_url( '/ferramentas/' );
$guide_url  = ! empty( $home_guide_url )  ? $home_guide_url  : home_url( '/melhores-itens-para-bruxo-dnd-5e/' );
$vote_url   = home_url( '/#votacao-proxima-build' );

$smoke_d20 = FMB_URL . 'assets/images/pao-de-queijo-d20-fumegante-transparente.webp?ver=' . FMB_VERSION;
$hero_castle = FMB_URL . 'assets/images/home-hero-castelo.webp?ver=' . FMB_VERSION;
?>
<section class="fmb-home-hero" aria-labelledby="fmb-home-hero-title">
  <img class="fmb-home-hero-landscape"
       src="<?php echo esc_url( $hero_castle ); ?>"
       alt=""
       aria-hidden="true"
       decoding="async"
       fetchpriority="high"
       width="1400"
       height="<?php echo esc_attr( round( 1400 * 1024 / 901 ) ); ?>">
  <div class="fmb-home-hero-shell">
    <div class="fmb-home-hero-copy">
      <span class="fmb-home-hero-eyebrow">RPG COM RAÍZES BRASILEIRAS</span>
      <h1 id="fmb-home-hero-title">Sua próxima aventura começa na forja.</h1>
      <p>
        Builds de RPG, guias, ferramentas e ideias para criar personagens
        e melhorar suas histórias de mesa.
      </p>

      <div class="fmb-home-hero-actions">
        <a class="fmb-home-hero-btn fmb-home-hero-btn--primary" href="<?php echo esc_url( $builds_url ); ?>">
          Explorar Builds
        </a>
        <a class="fmb-home-hero-btn fmb-home-hero-btn--ghost" href="<?php echo esc_url( $tools_url ); ?>">
          Ver Ferramentas
        </a>
      </div>
    </div>

    <div class="fmb-home-hero-quote" aria-hidden="true">
      <span>Grandes histórias</span>
      <span>também nascem aqui.</span>
      <i></i>
    </div>

    <aside class="fmb-forja-now" aria-label="Na Forja Agora">
      <div class="fmb-forja-now-title">
        <span aria-hidden="true">🔥</span>
        <strong>NA FORJA AGORA</strong>
      </div>

      <div class="fmb-forja-now-body">
        <div class="fmb-forja-now-art" aria-hidden="true">
          <span class="fmb-forja-now-heat fmb-forja-now-heat--1"></span>
          <span class="fmb-forja-now-heat fmb-forja-now-heat--2"></span>
          <span class="fmb-forja-now-ember fmb-forja-now-ember--1"></span>
          <span class="fmb-forja-now-ember fmb-forja-now-ember--2"></span>
          <span class="fmb-forja-now-ember fmb-forja-now-ember--3"></span>
          <img
            src="<?php echo esc_url( $smoke_d20 ); ?>"
            alt=""
            decoding="async"
            width="900"
            height="900"
          >
        </div>

        <div class="fmb-forja-now-list">
          <a class="fmb-forja-now-item fmb-forja-now-item--live" href="<?php echo esc_url( $build_url ); ?>">
            <span class="fmb-forja-now-icon fmb-forja-now-icon--build" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M12 2.8 20.2 7.5v9L12 21.2 3.8 16.5v-9L12 2.8Z"/>
                <path d="m12 2.8 4.1 7.1L12 21.2 7.9 9.9 12 2.8Zm-8.2 4.7h16.4M3.8 16.5l4.1-6.6h8.2l4.1 6.6"/>
              </svg>
            </span>

            <span class="fmb-forja-now-item-copy">
              <span class="fmb-forja-now-status fmb-forja-now-status--green">NOVA BUILD</span>
              <strong>Voldemort — Bruxo 1–20</strong>
              <small>Magia, estratégia e ambição.</small>
              <span class="fmb-forja-now-link">Ver build <b aria-hidden="true">→</b></span>
            </span>
          </a>

          <a class="fmb-forja-now-item fmb-forja-now-item--live" href="<?php echo esc_url( $guide_url ); ?>">
            <span class="fmb-forja-now-icon fmb-forja-now-icon--guide" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M4 4.8c2.9-.8 5.2-.4 8 1.2v13c-2.8-1.6-5.1-2-8-1.2v-13Zm16 0c-2.9-.8-5.2-.4-8 1.2v13c2.8-1.6 5.1-2 8-1.2v-13Z"/>
              </svg>
            </span>

            <span class="fmb-forja-now-item-copy">
              <span class="fmb-forja-now-status">NOVO GUIA</span>
              <strong>Melhores itens para Bruxo</strong>
              <small>Níveis 1–5</small>
              <span class="fmb-forja-now-link">Ver guia <b aria-hidden="true">→</b></span>
            </span>
          </a>

          <a class="fmb-forja-now-item fmb-forja-now-item--live" href="<?php echo esc_url( $vote_url ); ?>">
            <span class="fmb-forja-now-icon fmb-forja-now-icon--vote" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path d="M7 3h8l3 3-6.2 6.2-7.9-7.9L7 3Zm5 9.2 2.2 2.2L12.6 16H21v5H3v-5h6.8L12 12.2Z"/>
              </svg>
            </span>

            <span class="fmb-forja-now-item-copy">
              <span class="fmb-forja-now-status">VOCÊ DECIDE</span>
              <strong>Escolha a próxima Build</strong>
              <small>Guts, Duncan ou Trevor</small>
              <span class="fmb-forja-now-link">Ir para votação <b aria-hidden="true">↓</b></span>
            </span>
          </a>
        </div>
      </div>

      <div class="fmb-forja-now-footer">Boas rolagens. Boas histórias.</div>
    </aside>
  </div>
</section>
