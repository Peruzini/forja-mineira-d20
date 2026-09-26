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


    <?php if ( ! empty( $featured_invocations_url ) ) : ?>
      <a
        class="fmb-featured-guide-card fmb-featured-guide-card--link fmb-featured-guide-card--invocations"
        href="<?php echo esc_url( $featured_invocations_url ); ?>"
        aria-label="Abrir guia: Melhores Invocações Místicas para Bruxo"
      >
    <?php else : ?>
      <article class="fmb-featured-guide-card fmb-featured-guide-card--invocations">
    <?php endif; ?>

      <img
        class="fmb-featured-guide-art fmb-featured-guide-art--invocations"
        src="<?php echo esc_url( $featured_invocations_image ); ?>"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async">

      <div class="fmb-featured-guide-overlay" aria-hidden="true"></div>

      <div class="fmb-featured-guide-content">
        <span class="fmb-featured-guide-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path d="M4 4.8c2.9-.8 5.2-.4 8 1.2v13c-2.8-1.6-5.1-2-8-1.2v-13Zm16 0c-2.9-.8-5.2-.4-8 1.2v13c2.8-1.6 5.1-2 8-1.2v-13Z"/>
            <path d="M12 6.2v12.6M8.2 9.3h1.7M14.1 9.3h1.7"/>
          </svg>
        </span>
        <div class="fmb-featured-guide-copy">
          <span class="fmb-featured-guide-kicker">NOVO GUIA EM DESTAQUE</span>
          <h2 id="fmb-featured-guide-invocations-title">Melhores Invocações Místicas para Bruxo</h2>
          <p>Escolha por nível, estilo e função — com mini-builds para Rajada, Lâmina, Tomo e Corrente.</p>
        </div>
        <div class="fmb-featured-guide-action">
          <?php if ( ! empty( $featured_invocations_url ) ) : ?>
            <span class="fmb-featured-guide-button">Ver guia <span aria-hidden="true">→</span></span>
          <?php else : ?>
            <span class="fmb-featured-guide-button is-disabled" aria-disabled="true">Em breve</span>
          <?php endif; ?>
        </div>
      </div>

    <?php if ( ! empty( $featured_invocations_url ) ) : ?>
      </a>
    <?php else : ?>
      </article>
    <?php endif; ?>
  </div>
</section>
