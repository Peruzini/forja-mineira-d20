<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<section class="fmb-build-cycle" aria-labelledby="fmb-build-cycle-title">
  <div class="fmb-build-cycle-shell">
    <div class="fmb-build-cycle-heading">
      <span class="fmb-build-cycle-eyebrow">DA FORJA PARA A MESA</span>
      <h2 id="fmb-build-cycle-title">Agora, depois e o que vem em seguida.</h2>
    </div>

    <div class="fmb-build-cycle-grid">

      <article class="fmb-cycle-card fmb-cycle-current">
        <a class="fmb-cycle-current-media" href="<?php echo esc_url( $cycle_current_url ); ?>">
          <img
            src="<?php echo esc_url( $cycle_current_image ); ?>"
            alt="Build atual de Voldemort, Bruxo do nível 1 ao 20"
            loading="lazy"
            decoding="async">
          <span class="fmb-cycle-badge">BUILD ATUAL</span>
        </a>
        <div class="fmb-cycle-card-copy">
          <span class="fmb-cycle-kicker">JÁ SAIU DA FORJA</span>
          <h3>Voldemort — Bruxo 1–20</h3>
          <p>Controle, ambição e magia sombria em uma progressão completa até o nível 20.</p>
          <a class="fmb-cycle-cta" href="<?php echo esc_url( $cycle_current_url ); ?>">
            Ver build completa <span aria-hidden="true">→</span>
          </a>
        </div>
      </article>

      <article class="fmb-cycle-card fmb-cycle-next">
        <div class="fmb-cycle-next-media <?php echo empty( $cycle_next_image ) ? 'is-placeholder' : ''; ?>">
          <?php if ( ! empty( $cycle_next_image ) ) : ?>
            <img
              src="<?php echo esc_url( $cycle_next_image ); ?>"
              alt="Prévia misteriosa da próxima build"
              loading="lazy"
              decoding="async">
          <?php else : ?>
            <div class="fmb-cycle-next-placeholder">
              <span>IDENTIDADE OCULTA</span>
              <strong>?</strong>
              <small>A arte final entra aqui quando fecharmos a próxima build.</small>
            </div>
          <?php endif; ?>
          <span class="fmb-cycle-badge fmb-cycle-badge--next">PRÓXIMA BUILD · EM DESENVOLVIMENTO</span>
        </div>

        <div class="fmb-cycle-card-copy">
          <span class="fmb-cycle-kicker">UMA NOVA LENDA ENTROU NA FORJA</span>
          <h3>Você consegue descobrir quem é?</h3>
          <div class="fmb-cycle-clues">
            <span>Armadura e magia.</span>
            <span>Ciência e feitiçaria.</span>
            <span>Ele não apenas luta. Ele governa.</span>
          </div>
          <p class="fmb-cycle-next-note">A identidade será revelada quando a build estiver pronta.</p>
        </div>
      </article>

      <aside
        id="votacao-proxima-build"
        class="fmb-cycle-vote"
        aria-labelledby="fmb-cycle-vote-title"
        data-fmb-vote
        data-poll-id="<?php echo esc_attr( $cycle_poll_id ); ?>"
        data-vote-open="<?php echo $cycle_poll_open ? '1' : '0'; ?>"
        data-vote-endpoint="<?php echo esc_url( $cycle_vote_endpoint ); ?>"
      >
        <div class="fmb-cycle-vote-head">
          <span class="fmb-cycle-vote-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 20h16M6 17V9M12 17V4M18 17v-5"/></svg>
          </span>

          <div class="fmb-cycle-vote-heading-copy">
            <span>VOCÊ ESCOLHE O PRÓXIMO</span>
            <h3 id="fmb-cycle-vote-title">Quem entra na Forja depois?</h3>
            <p>
              Escolha quem deve receber uma build completa.
              As parciais ficam escondidas até o encerramento.
            </p>
          </div>
        </div>

        <div class="fmb-cycle-vote-status" data-fmb-vote-status aria-live="polite">
          <span class="fmb-cycle-vote-status-dot" aria-hidden="true"></span>
          <strong>ESCOLHA 1 DE 3</strong>
        </div>

        <form class="fmb-cycle-vote-form" data-fmb-vote-form>
          <div class="fmb-cycle-vote-options">
            <label class="fmb-cycle-candidate">
              <input type="radio" name="fmb-next-character" value="guts" data-label="Guts">
              <span class="fmb-cycle-candidate-card">
                <span class="fmb-cycle-candidate-check" aria-hidden="true">✓</span>
                <img src="<?php echo esc_url( $cycle_guts_image ); ?>" alt="Guts, de Berserk" loading="lazy" decoding="async">
                <span class="fmb-cycle-candidate-copy">
                  <strong>Guts</strong>
                  <small>Berserk</small>
                </span>
              </span>
            </label>

            <label class="fmb-cycle-candidate">
              <input type="radio" name="fmb-next-character" value="duncan" data-label="Duncan, o Alto">
              <span class="fmb-cycle-candidate-card">
                <span class="fmb-cycle-candidate-check" aria-hidden="true">✓</span>
                <img src="<?php echo esc_url( $cycle_duncan_image ); ?>" alt="Duncan, o Alto" loading="lazy" decoding="async">
                <span class="fmb-cycle-candidate-copy">
                  <strong>Duncan, o Alto</strong>
                  <small>Dunk &amp; Egg</small>
                </span>
              </span>
            </label>

            <label class="fmb-cycle-candidate">
              <input type="radio" name="fmb-next-character" value="trevor" data-label="Trevor Belmont">
              <span class="fmb-cycle-candidate-card">
                <span class="fmb-cycle-candidate-check" aria-hidden="true">✓</span>
                <img src="<?php echo esc_url( $cycle_trevor_image ); ?>" alt="Trevor Belmont" loading="lazy" decoding="async">
                <span class="fmb-cycle-candidate-copy">
                  <strong>Trevor Belmont</strong>
                  <small>Castlevania</small>
                </span>
              </span>
            </label>
          </div>

          <div class="fmb-cycle-vote-action">
            <button class="fmb-cycle-vote-button" type="button" disabled data-fmb-vote-button>
              Escolha um candidato
            </button>

            <p class="fmb-cycle-vote-note" data-fmb-vote-note>
              <span aria-hidden="true">🔒</span>
              O resultado permanece oculto até o encerramento da votação.
            </p>
          </div>
        </form>
      </aside>

    </div>
  </div>
</section>
