<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<section class="fmb-featured-guide" aria-label="Guias em destaque da Forja">
  <div class="fmb-featured-guide-shell">

    <?php if ( ! empty( $featured_spells_url ) ) : ?>
      <a
        class="fmb-featured-guide-card fmb-featured-guide-card--link fmb-featured-guide-card--spells"
        href="<?php echo esc_url( $featured_spells_url ); ?>"
        aria-label="Abrir guia: Melhores Magias para Bruxo D&D 5e 2024"
      >
    <?php else : ?>
      <article class="fmb-featured-guide-card fmb-featured-guide-card--spells">
    <?php endif; ?>

      <img
        class="fmb-featured-guide-art fmb-featured-guide-art--spells"
        src="<?php echo esc_url( $featured_spells_image ); ?>"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async">

      <div class="fmb-featured-guide-overlay" aria-hidden="true"></div>

      <div class="fmb-featured-guide-content">
        <span class="fmb-featured-guide-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path d="M12 2.8 14 8l5.2 2-5.2 2-2 5.2-2-5.2-5.2-2 5.2-2 2-5.2Z"/>
            <path d="M18.2 14.2 19.3 17l2.7 1-2.7 1-1.1 2.8-1-2.8-2.8-1 2.8-1 1-2.8Z"/>
          </svg>
        </span>

        <div class="fmb-featured-guide-copy">
          <span class="fmb-featured-guide-kicker">NOVO GUIA EM DESTAQUE</span>
          <h2>Melhores Magias para Bruxo D&amp;D 5e 2024</h2>
          <p>Compare 94 magias por nível, função, escola, fonte e prioridade — com mecânicas, sinergias e leitura prática para a mesa.</p>
        </div>

        <div class="fmb-featured-guide-action">
          <?php if ( ! empty( $featured_spells_url ) ) : ?>
            <span class="fmb-featured-guide-button">Ver guia <span aria-hidden="true">→</span></span>
          <?php else : ?>
            <span class="fmb-featured-guide-button is-disabled" aria-disabled="true">Em breve</span>
          <?php endif; ?>
        </div>
      </div>

    <?php if ( ! empty( $featured_spells_url ) ) : ?>
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

      <img class="fmb-featured-guide-art fmb-featured-guide-art--invocations" src="<?php echo esc_url( $featured_invocations_image ); ?>" alt="" aria-hidden="true" loading="lazy" decoding="async">
      <div class="fmb-featured-guide-overlay" aria-hidden="true"></div>

      <div class="fmb-featured-guide-content">
        <span class="fmb-featured-guide-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img" focusable="false">
            <path d="M4 4.8c2.9-.8 5.2-.4 8 1.2v13c-2.8-1.6-5.1-2-8-1.2v-13Zm16 0c-2.9-.8-5.2-.4-8 1.2v13c2.8-1.6 5.1-2 8-1.2v-13Z"/>
            <path d="M12 6.2v12.6M8.2 9.3h1.7M14.1 9.3h1.7"/>
          </svg>
        </span>
        <div class="fmb-featured-guide-copy">
          <span class="fmb-featured-guide-kicker">GUIA EM DESTAQUE</span>
          <h2>Melhores Invocações Místicas para Bruxo</h2>
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

    <?php if ( ! empty( $featured_guide_url ) ) : ?>
      <a
        class="fmb-featured-guide-card fmb-featured-guide-card--link fmb-featured-guide-card--items"
        href="<?php echo esc_url( $featured_guide_url ); ?>"
        aria-label="Abrir guia: Melhores Itens para Bruxo nos Níveis 1–5"
      >
    <?php else : ?>
      <article class="fmb-featured-guide-card fmb-featured-guide-card--items">
    <?php endif; ?>

      <img class="fmb-featured-guide-art" src="<?php echo esc_url( $featured_guide_image ); ?>" alt="" aria-hidden="true" loading="lazy" decoding="async">
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
          <h2>Melhores Itens para Bruxo nos Níveis 1–5</h2>
          <p>Itens, dicas e combinações para fortalecer seu Bruxo desde os primeiros níveis.</p>
        </div>

        <div class="fmb-featured-guide-action">
          <?php if ( ! empty( $featured_guide_url ) ) : ?>
            <span class="fmb-featured-guide-button">Ver guia <span aria-hidden="true">→</span></span>
          <?php else : ?>
            <span class="fmb-featured-guide-button is-disabled" aria-disabled="true">Em breve</span>
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
