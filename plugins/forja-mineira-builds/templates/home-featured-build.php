<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

$build_url = ! empty( $home_build_url )
    ? $home_build_url
    : home_url( '/voldemort-dnd-5e-build-bruxo/' );

$builds_url = ! empty( $home_builds_url )
    ? $home_builds_url
    : home_url( '/builds/' );

$art    = FMB_URL . 'assets/images/voldemort-featured-five-stages.webp?ver=' . FMB_VERSION;
$mascot = FMB_URL . 'assets/images/pao-de-queijo-d20.png?ver=' . FMB_VERSION;
?>
<section class="fmb-home-featured" aria-labelledby="fmb-home-featured-title">
  <div class="fmb-home-featured-shell">
    <div class="fmb-home-featured-head">
      <div>
        <span class="fmb-home-featured-eyebrow">ÚLTIMO DA FORJA · BUILD EM DESTAQUE</span>
        <h2 id="fmb-home-featured-title">Voldemort — Bruxo do nível 1 ao 20</h2>
      </div>
      <a class="fmb-home-featured-all" href="<?php echo esc_url( $builds_url ); ?>">
        Ver todas as builds <span aria-hidden="true">→</span>
      </a>
    </div>

    <article class="fmb-home-featured-card">
      <a class="fmb-home-featured-art" href="<?php echo esc_url( $build_url ); ?>" aria-label="Abrir a build completa de Voldemort">
        <img src="<?php echo esc_url( $art ); ?>"
             alt="Voldemort D&D 5e — evolução da build de Bruxo do nível 1 ao 20">
        <span class="fmb-home-featured-badge">NOVA BUILD</span>
      </a>

      <div class="fmb-home-featured-copy">
        <div class="fmb-home-featured-meta">D&D 5E · 2024 · GRANDE ANTIGO · CONTROLE</div>
        <h3>Do aluno prodígio ao poder absoluto</h3>
        <p>
          Uma progressão completa construída em cinco fases: conhecimento, manipulação,
          controle de campo, servos e poder arcano até o nível 20.
        </p>

        <div class="fmb-home-featured-tags" aria-label="Características da build">
          <span>Bruxo</span>
          <span>Nível 1–20</span>
          <span>Controle</span>
          <span>2024</span>
        </div>

        <div class="fmb-home-featured-actions">
          <a class="fmb-home-featured-btn fmb-home-featured-btn--primary"
             href="<?php echo esc_url( $build_url ); ?>">
            Explorar a build <span aria-hidden="true">→</span>
          </a>
          <a class="fmb-home-featured-btn fmb-home-featured-btn--ghost"
             href="<?php echo esc_url( $builds_url ); ?>">
            Área de Builds
          </a>
        </div>

        <div class="fmb-home-featured-mascot">
          <img src="<?php echo esc_url( $mascot ); ?>" alt="Pão de Queijo D20">
          <div>
            <strong>Pão de Queijo D20 recomenda</strong>
            <span>Uma build completa para acompanhar do nível 1 ao 20.</span>
          </div>
        </div>
      </div>
    </article>
  </div>
</section>
