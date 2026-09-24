<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

$teaser_art = FMB_URL . 'assets/images/next-build-mystery-teaser.webp?ver=' . FMB_VERSION;
?>
<section class="fmb-next-build" aria-labelledby="fmb-next-build-title">
  <div class="fmb-next-build-shell">
    <div class="fmb-next-build-card">

      <div class="fmb-next-build-visual">
        <img
          src="<?php echo esc_url( $teaser_art ); ?>"
          alt="Figura misteriosa de armadura metálica e capa verde cercada por energia arcana"
          loading="lazy"
          decoding="async"
          width="1400"
          height="1028"
        >
        <div class="fmb-next-build-visual-shade" aria-hidden="true"></div>
        <div class="fmb-next-build-stamp">
          <span>PRÓXIMA BUILD</span>
          <strong>EM DESENVOLVIMENTO</strong>
        </div>
      </div>

      <div class="fmb-next-build-content">
        <div class="fmb-next-build-copy">
          <span class="fmb-next-build-eyebrow">UMA NOVA LENDA ENTROU NA FORJA</span>
          <h2 id="fmb-next-build-title">Você consegue descobrir quem é?</h2>
          <p>
            A identidade fica escondida por enquanto. As pistas já revelam
            o tipo de personagem que está sendo forjado.
          </p>
        </div>

        <div class="fmb-next-build-hints" aria-label="Pistas da próxima build">
          <article class="fmb-next-build-hint">
            <span>01</span>
            <div>
              <small>PISTA</small>
              <strong>Sua armadura é tão importante quanto sua magia.</strong>
            </div>
          </article>

          <article class="fmb-next-build-hint">
            <span>02</span>
            <div>
              <small>PISTA</small>
              <strong>Ciência e feitiçaria não são opostos para ele.</strong>
            </div>
          </article>

          <article class="fmb-next-build-hint">
            <span>03</span>
            <div>
              <small>PISTA</small>
              <strong>Ele não busca apenas poder. Ele governa.</strong>
            </div>
          </article>

          <article class="fmb-next-build-hint">
            <span>04</span>
            <div>
              <small>PISTA</small>
              <strong>Verde, metal e energia arcana fazem parte da sua identidade.</strong>
            </div>
          </article>

          <article class="fmb-next-build-hint">
            <span>05</span>
            <div>
              <small>PISTA</small>
              <strong>Tecnologia, magia e autoridade coexistem no mesmo personagem.</strong>
            </div>
          </article>
        </div>

        <div class="fmb-next-build-footer">
          <span class="fmb-next-build-status-dot" aria-hidden="true"></span>
          <strong>BUILD COMPLETA EM DESENVOLVIMENTO</strong>
          <span>O nome será revelado quando sair da Forja.</span>
        </div>
      </div>

    </div>
  </div>
</section>
