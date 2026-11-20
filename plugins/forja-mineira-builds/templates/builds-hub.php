<?php
/**
 * FORJA MINEIRA — BUILDS HUB — INTEGRAÇÃO B2 (CANDIDATO DE TESTE)
 * Scope: replaces the Hub template, keeping the existing shortcode and site links.
 * Requires assets/css/doom-hub.css and approved panorama WebP.
 * DOOM URL found from a published shortcode page or supplied via doom_url.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

$build_url = ! empty( $hub_build_url )
    ? $hub_build_url
    : home_url( '/voldemort-dnd-5e-build-bruxo/' );

$doom_build_url = ! empty( $hub_doom_url ) ? esc_url( $hub_doom_url ) : '';
$guides_url = home_url( '/guias/' );
$tools_url = home_url( '/ferramentas/' );
$vote_url = home_url( '/#votacao-proxima-build' );
$home_url = home_url( '/' );
$hero_image = FMB_URL . 'assets/images/doom-hub-panorama-cinco-facetas-aprovado.webp?ver=' . FMB_VERSION;
$doom_card_image = $hero_image;
$card_image = FMB_URL . 'assets/images/voldemort-l17-img1-bffe22434a23.webp?ver=' . FMB_VERSION;
$icon_guides = FMB_URL . 'assets/images/forja-bussola-institucional.webp?ver=' . FMB_VERSION;
$icon_tools = FMB_URL . 'assets/images/regras.webp?ver=' . FMB_VERSION;
$icon_builds = FMB_URL . 'assets/images/builds.webp?ver=' . FMB_VERSION;
?>
<div class="fmb-hub fmb-hub--doom" id="forja-builds">
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

  <section class="fmb-doom-hero" aria-labelledby="fmb-featured-title">
    <img class="fmb-doom-hero__art" src="<?php echo esc_url( $hero_image ); ?>" width="1942" height="809" fetchpriority="high" alt="Cinco facetas da ascensão de Victor von Doom, do jovem inventor ao Doutor Destino mascarado com magia esmeralda">
    <span class="fmb-doom-hero__veil" aria-hidden="true"></span>
    <span class="fmb-doom-hero__glow" aria-hidden="true"></span>
    <div class="fmb-doom-hero__counter"><span>NOVA BUILD</span><strong>02</strong></div>
    <div class="fmb-doom-hero__content">
      <span class="fmb-doom-hero__eyebrow">BUILD EM DESTAQUE</span>
      <h2 class="fmb-doom-hero__title" id="fmb-featured-title">Doutor Destino</h2>
      <p class="fmb-doom-hero__subtitle">A genialidade que une aço, magia e ambição.</p>
      <p class="fmb-doom-hero__lead">O senhor da Latvéria como uma progressão completa: engenharia arcana, armadura e magia para controlar o campo de batalha.</p>
      <p class="fmb-doom-hero__meta">ARTÍFICE (ARTIFICER) 3 / MAGO (WIZARD) 17 · NÍVEIS 1–20 · REGRAS 2024 + 2025</p>
      <div class="fmb-doom-hero__tags" aria-label="Características da build">
        <span>Controle</span><span>Tecnomagia</span><span>Armeiro (Armorer)</span><span>Abjurador (Abjurer)</span>
      </div>
      <div class="fmb-doom-hero__buttons">
        <?php if ( $doom_build_url ) : ?>
          <a class="fmb-doom-btn fmb-doom-btn--primary" href="<?php echo esc_url( $doom_build_url ); ?>">Explorar build <span aria-hidden="true">→</span></a>
        <?php else : ?>
          <span class="fmb-doom-btn fmb-doom-btn--primary fmb-doom-btn--pending" aria-disabled="true" title="Aguardando validação do permalink canônico">Explorar build <span aria-hidden="true">→</span></span>
        <?php endif; ?>
        <a class="fmb-doom-btn fmb-doom-btn--ghost" href="#fmb-catalog-title">Ver outras builds <span aria-hidden="true">↓</span></a>
      </div>
    </div>
    <span class="fmb-doom-hero__art-caption">A ASCENSÃO DO DOUTOR DESTINO</span>
  </section>

  <section class="fmb-build-catalog" aria-labelledby="fmb-catalog-title">
    <header class="fmb-catalog-head">
      <div><span class="fmb-hub-eyebrow">CATÁLOGO</span><h2 id="fmb-catalog-title">Todas as Builds</h2></div>
      <p>Duas lendas. Dois caminhos de poder. Encontre a progressão temática que combina com seu estilo.</p>
    </header>
    <div class="fmb-build-grid">
      <article class="fmb-build-card" data-class="artifice mago" data-rules="2024 2025" data-role="controle tecnomagia">
        <?php if ( $doom_build_url ) : ?><a class="fmb-build-card-link" href="<?php echo esc_url( $doom_build_url ); ?>"><?php else : ?><div class="fmb-build-card-link" aria-label="Doutor Destino: URL canônica pendente"><?php endif; ?>
          <div class="fmb-build-card-art fmb-build-card-art--doom">
            <img src="<?php echo esc_url( $doom_card_image ); ?>" alt="Doutor Destino com máscara, armadura e magia esmeralda" loading="lazy" decoding="async">
            <span class="fmb-card-badge">NOVA BUILD</span>
          </div>
          <div class="fmb-build-card-body">
            <div class="fmb-build-card-meta">ARTÍFICE / MAGO · 2024 + 2025 · NÍVEL 1–20</div>
            <h3>Doutor Destino</h3>
            <p>Da pesquisa e das invenções à armadura arcana e à supremacia mágica.</p>
            <div class="fmb-card-tags"><span>Controle</span><span>Tecnomagia</span><span>Abjuração</span></div>
            <div class="fmb-card-cta">Explorar build <span aria-hidden="true">→</span></div>
          </div>
        <?php if ( $doom_build_url ) : ?></a><?php else : ?></div><?php endif; ?>
      </article>

      <article class="fmb-build-card" data-class="bruxo" data-rules="2024" data-role="controle">
        <a class="fmb-build-card-link" href="<?php echo esc_url( $build_url ); ?>">
          <div class="fmb-build-card-art fmb-build-card-art--voldemort">
            <img src="<?php echo esc_url( $card_image ); ?>" alt="Voldemort, Bruxo inspirado em um lorde das trevas" loading="lazy" decoding="async">
            <span class="fmb-card-badge">PUBLICADA</span>
          </div>
          <div class="fmb-build-card-body">
            <div class="fmb-build-card-meta">BRUXO (WARLOCK) · 2024 · NÍVEL 1–20</div>
            <h3>Voldemort</h3>
            <p>Conhecimento, controle, servos e magia proibida em uma progressão completa.</p>
            <div class="fmb-card-tags"><span>Controle</span><span>Grande Antigo</span><span>Arcano</span></div>
            <div class="fmb-card-cta">Explorar build <span aria-hidden="true">→</span></div>
          </div>
        </a>
      </article>
    </div>
  </section>

  <section class="fmb-builds-continue" aria-labelledby="fmb-builds-continue-title">
    <div class="fmb-builds-divider" aria-hidden="true">
      <span class="fmb-builds-divider-line fmb-builds-divider-line--left"></span>
      <span class="fmb-builds-divider-diamond"><svg viewBox="0 0 16 16" focusable="false" aria-hidden="true"><path d="M8 1.5 14.5 8 8 14.5 1.5 8Z"/><path d="M8 5 11 8 8 11 5 8Z"/></svg></span>
      <span class="fmb-builds-divider-line fmb-builds-divider-line--right"></span>
    </div>
    <header class="fmb-builds-continue-head">
      <span class="fmb-hub-eyebrow">CONTINUE NA FORJA</span>
      <h2 id="fmb-builds-continue-title">A build é só o começo</h2>
      <p>Depois da progressão, continue por guias, ferramentas e pela escolha da próxima personagem a entrar na Forja.</p>
    </header>
    <div class="fmb-builds-continue-grid">
      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $guides_url ); ?>">
        <span class="fmb-builds-icon-frame"><img src="<?php echo esc_url( $icon_guides ); ?>" alt="" loading="lazy" decoding="async"></span>
        <span class="fmb-builds-card-copy"><span class="fmb-builds-card-kicker">NAVEGAÇÃO</span><strong>Guias</strong><span>Classes, magias, itens e decisões de personagem reunidos em um só lugar.</span><b>Explorar Guias →</b></span>
      </a>
      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $tools_url ); ?>">
        <span class="fmb-builds-icon-frame"><img src="<?php echo esc_url( $icon_tools ); ?>" alt="" loading="lazy" decoding="async"></span>
        <span class="fmb-builds-card-copy"><span class="fmb-builds-card-kicker">UTILIDADES</span><strong>Ferramentas</strong><span>Calculadoras e recursos rápidos para usar antes e durante a mesa.</span><b>Ver Ferramentas →</b></span>
      </a>
      <a class="fmb-builds-continue-card" href="<?php echo esc_url( $vote_url ); ?>">
        <span class="fmb-builds-icon-frame"><img src="<?php echo esc_url( $icon_builds ); ?>" alt="" loading="lazy" decoding="async"></span>
        <span class="fmb-builds-card-copy"><span class="fmb-builds-card-kicker">PRÓXIMA FORJA</span><strong>Escolha a próxima Build</strong><span>Ajude a decidir qual personagem será o próximo a ganhar uma progressão completa.</span><b>Ir para a votação →</b></span>
      </a>
    </div>
    <div class="fmb-builds-return-strip">
      <span>Forja Mineira D20 · Quer voltar ao início da Forja?</span>
      <a href="<?php echo esc_url( $home_url ); ?>">Voltar ao início →</a>
    </div>
  </section>
</div>
