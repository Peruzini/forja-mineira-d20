<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<section class="fmc-related" aria-labelledby="fmc-related-title-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>">
  <div class="fmc-related-head">
    <div class="fmc-ornamental-divider" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 24" aria-hidden="true" focusable="false" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fmc-line-left-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="586" y2="12">
            <stop offset="0%" stop-color="#c9953f" stop-opacity="0"/>
            <stop offset="25%" stop-color="#c9953f" stop-opacity=".16"/>
            <stop offset="72%" stop-color="#c9953f" stop-opacity=".34"/>
            <stop offset="100%" stop-color="#c9953f" stop-opacity=".62"/>
          </linearGradient>
          <linearGradient id="fmc-line-right-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>" gradientUnits="userSpaceOnUse" x1="614" y1="12" x2="1200" y2="12">
            <stop offset="0%" stop-color="#c9953f" stop-opacity=".62"/>
            <stop offset="28%" stop-color="#c9953f" stop-opacity=".34"/>
            <stop offset="75%" stop-color="#c9953f" stop-opacity=".16"/>
            <stop offset="100%" stop-color="#c9953f" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0 12 H586" fill="none" stroke="url(#fmc-line-left-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>)" stroke-width="1.15" vector-effect="non-scaling-stroke"/>
        <path d="M614 12 H1200" fill="none" stroke="url(#fmc-line-right-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>)" stroke-width="1.15" vector-effect="non-scaling-stroke"/>
        <g transform="translate(600 12)" fill="#f5f0e6" stroke="#c9953f" stroke-width="1.15" stroke-linejoin="round">
          <path d="M0 -6 L6 0 L0 6 L-6 0 Z"/>
          <path d="M0 -3 L3 0 L0 3 L-3 0 Z" fill="none" opacity=".75"/>
        </g>
      </svg>
    </div>
    <span class="fmc-kicker">CONTINUE NA FORJA</span>
    <h2 id="fmc-related-title-<?php echo esc_attr( $cluster_id . '-' . $current_node ); ?>"><?php echo esc_html( $title ); ?></h2>
    <p class="fmc-related-subtitle">Magias, Invocações, Itens e builds conectados para continuar sua progressão.</p>
  </div>

  <div class="fmc-related-grid">
    <?php foreach ( $related as $item ) :
      $icon_url = FMC_Renderer::icon_url( $item );
      $variant = FMC_Renderer::card_variant( $item );
      ?>
      <a class="fmc-related-card fmc-related-card--<?php echo esc_attr( $variant ); ?> fmc-related-card--node-<?php echo esc_attr( sanitize_html_class( $item['id'] ) ); ?>"
         href="<?php echo esc_url( $item['url'] ); ?>">
        <span class="fmc-card-icon" aria-hidden="true">
          <?php if ( $icon_url ) : ?>
            <img src="<?php echo esc_url( $icon_url ); ?>" alt="" width="256" height="256" decoding="async">
          <?php endif; ?>
        </span>
        <span class="fmc-card-copy">
          <small><?php echo esc_html( $item['eyebrow'] ); ?></small>
          <strong><?php echo esc_html( $item['title'] ); ?></strong>
          <span><?php echo esc_html( $item['description'] ); ?></span>
          <b><?php echo esc_html( $item['cta'] ); ?></b>
        </span>
      </a>
    <?php endforeach; ?>
  </div>
</section>
