<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<section class="fmb-featured-guide" aria-labelledby="fmb-featured-guide-title">
  <div class="fmb-featured-guide-shell">
    <?php if ( ! empty( $featured_guide_url ) ) : ?>
      <a
        class="fmb-featured-guide-card fmb-featured-guide-card--link"
        href="<?php echo esc_url( $featured_guide_url ); ?>"
        aria-label="Abrir guia: Melhores Itens para Bruxo nos Níveis 1–5"
      >
    <?php else : ?>
      <article class="fmb-featured-guide-card">
    <?php endif; ?>

      <img
        class="fmb-featured-guide-art"
        src="<?php echo esc_url( $featured_guide_image ); ?>"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async">

      <div class="fmb-featured-guide-overlay" aria-hidden="true"></div>

      <div class="fmb-featured-guide-content">
        <span class="fmb-featured-guide-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path d="M6 3.5h8.5L19 8v12.5H6V3.5Z"/>
            <path d="M14.5 3.5V8H19M9 12h7M9 15h7M9 18h5"/>
          </svg>
        </span>

        <div class="fmb-featured-guide-copy">
          <span class="fmb-featured-guide-kicker">GUIA EM DESTAQUE</span>
          <h2 id="fmb-featured-guide-title">Melhores Itens para Bruxo nos Níveis 1–5</h2>
          <p>Itens, dicas e combinações para fortalecer seu Bruxo desde os primeiros níveis.</p>
        </div>

        <div class="fmb-featured-guide-action">
          <?php if ( ! empty( $featured_guide_url ) ) : ?>
            <span class="fmb-featured-guide-button">
              Ver guia <span aria-hidden="true">→</span>
            </span>
          <?php else : ?>
            <span class="fmb-featured-guide-button is-disabled" aria-disabled="true">
              Em breve
            </span>
          <?php endif; ?>
        </div>
      </div>

    <?php if ( ! empty( $featured_guide_url ) ) : ?>
      </a>
    <?php else : ?>
      </article>
    <?php endif; ?>
  </div>
</section>
