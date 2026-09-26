<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<section class="fmg-guide fmg-guides-hub" aria-labelledby="fmg-guides-hub-title">
  <div class="fmg-guides-hub__shell">

    <header class="fmg-guides-hub__hero">
      <div class="fmg-guides-hub__hero-copy">
        <span class="fmg-guides-hub__eyebrow">GUIAS DA FORJA</span>
        <h1 id="fmg-guides-hub-title">Guias de RPG para levar direto à mesa.</h1>
        <p>
          Conteúdo prático de D&amp;D 5e 2024 para escolher melhor, montar personagens
          e entender como cada decisão funciona em jogo.
        </p>
        <div class="fmg-guides-hub__meta" aria-label="Temas atuais">
          <span>D&amp;D 5e 2024</span>
          <span>Bruxo (Warlock)</span>
          <span>Builds &amp; otimização</span>
        </div>
      </div>

      <div class="fmg-guides-hub__count" aria-label="Quantidade de guias publicados">
        <strong>02</strong>
        <span>guias publicados</span>
      </div>
    </header>

    <section class="fmg-guides-hub__featured" aria-labelledby="fmg-guides-featured-title">
      <div class="fmg-guides-hub__section-head">
        <div>
          <span class="fmg-guides-hub__eyebrow">COMECE POR AQUI</span>
          <h2 id="fmg-guides-featured-title">Guia em destaque</h2>
        </div>
        <span class="fmg-guides-hub__rule" aria-hidden="true"></span>
      </div>

      <a class="fmg-guides-hub__feature-card" href="<?php echo esc_url( $hub_invocations_url ); ?>">
        <img
          src="<?php echo esc_url( $hub_invocations_image ); ?>"
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchpriority="high">
        <span class="fmg-guides-hub__feature-shade" aria-hidden="true"></span>

        <div class="fmg-guides-hub__feature-copy">
          <div class="fmg-guides-hub__badges">
            <span class="is-new">NOVO</span>
            <span>D&amp;D 5e 2024</span>
            <span>BRUXO</span>
          </div>
          <h3>Melhores Invocações Místicas para Bruxo</h3>
          <p>
            Invocações Místicas (Eldritch Invocations) por nível, estilo e função,
            com mini-builds para Rajada, Lâmina, Tomo e Corrente.
          </p>
          <span class="fmg-guides-hub__cta">Ler guia <b aria-hidden="true">→</b></span>
        </div>
      </a>
    </section>

    <section class="fmg-guides-hub__all" aria-labelledby="fmg-guides-all-title">
      <div class="fmg-guides-hub__section-head">
        <div>
          <span class="fmg-guides-hub__eyebrow">BIBLIOTECA</span>
          <h2 id="fmg-guides-all-title">Todos os guias</h2>
        </div>
        <span class="fmg-guides-hub__rule" aria-hidden="true"></span>
      </div>

      <div class="fmg-guides-hub__grid">
        <a class="fmg-guides-hub__card" href="<?php echo esc_url( $hub_invocations_url ); ?>">
          <div class="fmg-guides-hub__card-media">
            <img
              src="<?php echo esc_url( $hub_invocations_image ); ?>"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async">
            <span class="fmg-guides-hub__card-tag">NOVO</span>
          </div>
          <div class="fmg-guides-hub__card-copy">
            <span class="fmg-guides-hub__card-kicker">D&amp;D 5e 2024 · BRUXO</span>
            <h3>Melhores Invocações Místicas para Bruxo</h3>
            <p>Escolha por nível, função e estilo de jogo sem misturar recomendações fora do contexto da build.</p>
            <span class="fmg-guides-hub__card-link">Abrir guia <b aria-hidden="true">→</b></span>
          </div>
        </a>

        <a class="fmg-guides-hub__card" href="<?php echo esc_url( $hub_items_url ); ?>">
          <div class="fmg-guides-hub__card-media">
            <img
              src="<?php echo esc_url( $hub_items_image ); ?>"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async">
          </div>
          <div class="fmg-guides-hub__card-copy">
            <span class="fmg-guides-hub__card-kicker">D&amp;D 5e 2024 · BRUXO</span>
            <h3>Melhores Itens para Bruxo nos Níveis 1–5</h3>
            <p>Defesa, foco arcano, consumíveis e prioridades para fortalecer o personagem nos primeiros níveis.</p>
            <span class="fmg-guides-hub__card-link">Abrir guia <b aria-hidden="true">→</b></span>
          </div>
        </a>
      </div>
    </section>

  </div>
</section>
