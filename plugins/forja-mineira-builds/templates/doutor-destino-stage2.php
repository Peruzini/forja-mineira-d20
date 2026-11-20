<?php
/**
 * Etapa 4: Hero + SOMENTE nível 1. Padrão visual compartilhado com Voldemort.
 * Dados exclusivamente do contrato aprovado da Etapa 3; não libera os níveis seguintes.
 */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH . 'includes/class-doom-release.php';
require_once FMB_PATH . 'includes/class-doom-data.php';
try {
    $doom_data = FMB_Doom_Data::load();
    $doom_level = FMB_Doom_Data::get_approved_level(1);
    $doom_copy_file = FMB_PATH . 'data/doom-editorial-etapa4.json';
    $doom_copy = json_decode((string)file_get_contents($doom_copy_file), true, 512, JSON_THROW_ON_ERROR);
    if (($doom_copy['schema'] ?? '') !== 'forja-doom-editorial-preview/1.0' ||
        ($doom_copy['build_id'] ?? '') !== 'doutor-destino' ||
        ($doom_copy['publicacao_autorizada'] ?? true) !== false ||
        ($doom_copy['etapa'] ?? null) !== 4 ||
        count($doom_copy['nivel_1']['combat'] ?? []) !== 4) {
        throw new RuntimeException('Editorial de preview nao homologado.');
    }
    if (!$doom_level || empty($doom_level['pode_entrar_em_preview_individual'])) {
        throw new RuntimeException('Nivel 1 nao liberado para preview individual.');
    }
} catch (Throwable $exception) {
    if (function_exists('current_user_can') && current_user_can('edit_posts')) {
        echo '<p class="fmb-notice">A base homologada de Doutor Destino está indisponível.</p>';
    }
    return;
}
$doom = $doom_level['mecanica'];
$doom_art = FMB_URL . 'assets/images/doutor-destino/';
$doom_stats = $doom['atributos'];
$doom_ux = $doom_level['decisoes_de_layout'];
// Fail closed: o layout não pode antecipar conteúdo ou mudar o tamanho aprovado da arte.
if (($doom_level['nivel_total'] ?? null) !== 1 || ($doom_ux['lvl1_foundation_art_min_height_desktop_px'] ?? null) !== 655 ||
    ($doom_ux['lvl1_tradeoffs_panel'] ?? true) !== false || ($doom_ux['lvl1_wishlist_panel'] ?? true) !== false ||
    ($doom_ux['lvl1_combat_panel_count'] ?? null) !== 1) {
    if (current_user_can('edit_posts')) echo '<p class="fmb-notice">Contrato visual do nível 1 não homologado.</p>';
    return;
}
$doom_fmt = static function ($term) { return esc_html(is_array($term) ? trim(($term['pt'] ?? '') . ' (' . ($term['en'] ?? '') . ')') : (string)$term); };
$doom_mod = static function ($val) { $v = (int)floor(((int)$val - 10) / 2); return ($v >= 0 ? '+' : '') . $v; };
$doom_ability = ['FOR' => 'Força', 'DES' => 'Destreza', 'CON' => 'Constituição', 'INT' => 'Inteligência', 'SAB' => 'Sabedoria', 'CAR' => 'Carisma'];
$doom_pv = (int)$doom['pv_fixos'];
$doom_ca = (int)$doom['classe_armadura']['ca_referencia'];
$doom_slots = (int)($doom['espacos_magia_por_circulo'][0] ?? 0);
$doom_species = (string)($doom_data['personagem']['especie'] ?? '');
$doom_background = (string)($doom_data['personagem']['antecedente'] ?? '');
$doom_features = $doom['caracteristicas_e_talentos'] ?? [];
$doom_feat_human = ''; $doom_feat_sage = '';
foreach ($doom_features as $feature) {
    if (strpos($feature, 'Artesão (Crafter)') === 0) $doom_feat_human = $feature;
    if (strpos($feature, 'Iniciado em Magia — Mago (Magic Initiate — Wizard)') === 0) $doom_feat_sage = $feature;
}
if (!$doom_species || !$doom_background || !$doom_feat_human || !$doom_feat_sage) {
    if (current_user_can('edit_posts')) echo '<p class="fmb-notice">Faltam dados de Origem aprovados.</p>';
    return;
}
$doom_species_parts = explode(' (', $doom_species, 2);
$doom_background_parts = explode(' (', $doom_background, 2);
$doom_resource_details = [];
foreach ($doom['caracteristicas_detalhadas'] ?? [] as $row) $doom_resource_details[$row['nome']] = $row['observacao'] ?? '';

?>
<div class="fmb-build-root fmb-build-root--doom fmb-doom-stage2-root" id="forja-build-doutor-destino" data-fmb-build="doutor-destino" data-fmb-mascot="<?php echo esc_url(FMB_URL . 'assets/images/pao-de-queijo-d20.png?ver=' . FMB_VERSION); ?>" data-build-stage="combate-v1.4-preview">
  <div class="fmb-block fmb-block-0" data-fmb-block="0">
    <div class="shell"><section class="hero" aria-labelledby="doom-hero-title">
      <div class="copy">
        <p class="kicker"><?php echo esc_html($doom_copy["hero"]["kicker"]); ?></p>
        <div class="scope"><?php echo esc_html($doom_copy["hero"]["scope"]); ?></div>
        <h1 id="doom-hero-title"><?php echo esc_html($doom_copy["hero"]["title_lines"][0]); ?><br><?php echo esc_html($doom_copy["hero"]["title_lines"][1]); ?><span><?php echo esc_html($doom_copy["hero"]["tagline"]); ?></span></h1>
        <div class="rule"></div>
        <p class="lead"><strong><?php echo esc_html($doom_copy["hero"]["lead_bold"]); ?></strong> <?php echo esc_html($doom_copy["hero"]["lead"]); ?></p>
        <aside class="quote"><p><?php echo esc_html($doom_copy["hero"]["quote"]); ?></p><small><?php echo esc_html($doom_copy["hero"]["quote_label"]); ?></small></aside>
        <div class="actions">
          <a class="btn primary" href="#doom-nivel-1">Começar no nível 1 ↓</a>
          <a class="btn secondary" href="#doom-atributos">Ver ficha inicial</a>
        </div>
      </div>
      <div class="visual">
        <img src="<?php echo esc_url($doom_art . 'doom-art-01-hero-aprovado.webp'); ?>" alt="Doutor Destino adulto, de manto verde e máscara de metal, em pintura de fantasia sombria" width="1086" height="1448" fetchpriority="high">
        <div class="art-caption">Doutor Destino · A vontade acima de tudo</div>
      </div>
    </section></div>
  </div>
  <div class="fmb-block fmb-block-1" data-fmb-block="1">
    <div class="preview"><section class="block" id="doom-nivel-1" data-fmb-level="1" data-fmb-phase="I · As Origens" aria-labelledby="doom-n1-title">
      <div class="top">
        <figure class="art">
          <img src="<?php echo esc_url($doom_art . 'doom-art-04-origem-victor-aprovada.webp'); ?>" alt="Jovem Victor em sua oficina, construindo um instrumento arcano de metal dourado" width="1448" height="1086" loading="eager">
          <figcaption class="stage-tag"><?php echo esc_html($doom_copy["nivel_1"]["stage_tag"]); ?></figcaption>
        </figure>
        <div class="copy">
          <div class="kicker"><?php echo esc_html($doom_copy["nivel_1"]["kicker"]); ?></div>
          <h2 class="doom-level-title" id="doom-n1-title"><?php echo esc_html($doom_copy["nivel_1"]["title"]); ?></h2>
          <div class="subtitle"><?php echo esc_html($doom_copy["nivel_1"]["subtitle"]); ?></div>
          <p class="intro"><?php echo esc_html($doom_copy["nivel_1"]["intro"]); ?></p>
          <div class="status" aria-label="Indicadores do Artífice no nível 1">
            <div class="status-card"><span>Pontos de vida</span><strong><?php echo esc_html($doom_pv); ?></strong><small>PV</small></div>
            <div class="status-card"><span>Classe de Armadura</span><strong><?php echo esc_html($doom_ca); ?></strong><small>CA real</small></div>
            <div class="status-card"><span>Inteligência</span><strong><?php echo esc_html($doom_stats['INT']); ?></strong><small><?php echo esc_html($doom_mod($doom_stats['INT'])); ?></small></div>
            <div class="status-card"><span>Espaços de magia</span><strong><?php echo esc_html($doom_slots); ?> × 1º</strong><small>círculo</small></div>
          </div>
          <div class="origin-grid">
            <article class="info">
              <div class="kicker">Espécie · 2024</div>
              <h3><?php echo esc_html($doom_species_parts[0]); ?> <small><?php echo esc_html(isset($doom_species_parts[1]) ? '(' . $doom_species_parts[1] : ''); ?></small></h3>
              <div class="feat"><div class="feat-label">Talento de Origem do Humano</div><span class="feat-name"><?php echo esc_html($doom_feat_human); ?></span></div>
            </article>
            <article class="info">
              <div class="kicker">Antecedente · 2024</div>
              <h3><?php echo esc_html($doom_background_parts[0]); ?> <small><?php echo esc_html(isset($doom_background_parts[1]) ? '(' . $doom_background_parts[1] : ''); ?></small></h3>
              <div class="feat"><div class="feat-label">Talento de Origem do Antecedente</div><span class="feat-name"><?php echo esc_html($doom_feat_sage); ?></span></div>
            </article>
          </div>
        </div>
      </div>
      <section class="section" id="doom-atributos" aria-labelledby="doom-attrs-title">
        <div class="section-head"><div><div class="kicker">01 · Fundação mecânica</div><h2 id="doom-attrs-title">Os atributos do jovem Victor</h2></div><div class="note">Artífice 1 · bônus de proficiência +<?php echo esc_html($doom['bonus_proficiencia']); ?></div></div>
        <div class="attributes">
        <?php foreach($doom_ability as $abbr => $label): ?>
          <div class="attr<?php echo $abbr === 'INT' ? ' primary' : ''; ?>"><span class="name"><?php echo esc_html($label); ?></span><span class="score"><?php echo esc_html($doom_stats[$abbr]); ?></span><span class="mod"><?php echo esc_html($doom_mod($doom_stats[$abbr])); ?></span><span class="base"><?php echo esc_html($abbr); ?></span></div>
        <?php endforeach; ?>
        </div>
        <div class="progression"><strong>Inteligência <?php echo esc_html($doom_stats['INT']); ?> (<?php echo esc_html($doom_mod($doom_stats['INT'])); ?>)</strong> direciona suas magias. <strong>CA <?php echo esc_html($doom_ca); ?></strong> resulta de Cota de Escamas (Scale Mail) e escudo comum. O antecedente Sábio (Sage) fornece proficiências em Arcanismo (Arcana) e História (History).</div>
      </section>
      <section class="section" aria-labelledby="doom-recursos-title">
        <div class="section-head"><div><div class="kicker">02 · Recursos adquiridos</div><h2 id="doom-recursos-title">O que Victor domina agora</h2></div><div class="note">Recursos presentes no nível 1 — sem antecipações</div></div>
        <div class="doom-duo-grid">
          <article class="magic-card"><div class="kicker">Artífice 2025</div><h3>Magia de Funileiro <small>(Tinker's Magic)</small></h3><p><?php echo esc_html($doom_resource_details["Magia de Funileiro (Tinker's Magic)"] ?? ''); ?></p></article>
          <article class="magic-card"><div class="kicker">Talento de Origem</div><h3><?php echo esc_html($doom_feat_human); ?></h3><p><?php echo esc_html($doom_resource_details[$doom_feat_human] ?? ''); ?></p></article>
        </div>
      </section>
      <section class="section" id="doom-conjuracao" aria-labelledby="doom-magias-title">
        <div class="section-head"><div><div class="kicker">03 · Conjuração (Spellcasting)</div><h2 id="doom-magias-title">Os primeiros recursos arcanos</h2></div><div class="note"><?php echo esc_html($doom_slots); ?> espaços de 1º círculo · CD <?php echo esc_html(8 + (int)$doom['bonus_proficiencia'] + (int)floor(($doom_stats['INT'] - 10)/2)); ?> · ataque +<?php echo esc_html((int)$doom['bonus_proficiencia'] + (int)floor(($doom_stats['INT'] - 10)/2)); ?></div></div>
        <div class="magic-grid">
          <article class="magic-card tome">
            <div class="kicker">Truques de Artífice e Origem</div><h3>Truques disponíveis</h3>
            <ul><?php foreach($doom['truques_adquiridos_no_nivel'] as $term): ?><li><strong><?php echo esc_html($term['nome']); ?></strong><span class="doom-source">· <?php echo esc_html($term['origem']); ?></span></li><?php endforeach; ?></ul>
          </article>
          <article class="magic-card">
            <div class="kicker">Artífice 2025</div><h3>Magias preparadas</h3>
            <ul><?php foreach($doom['magias_artifice_preparadas'] as $term): ?><li><?php echo $doom_fmt($term); ?></li><?php endforeach; ?></ul><span class="source">Lista de Artífice · 2 preparadas</span>
          </article>
          <article class="magic-card">
            <div class="kicker">Iniciado em Magia (Magic Initiate)</div><h3>Magia recebida pelo talento</h3>
            <ul><?php foreach($doom['magias_talento_origem'] as $term): ?><li><strong><?php echo $doom_fmt($term); ?></strong><span class="doom-source"><?php echo esc_html($term['estado'] ?? ''); ?></span></li><?php endforeach; ?></ul>
            <span class="source">Fonte separada das preparadas de Artífice</span>
          </article>
        </div>
        <p class="doom-spell-note"><strong>Leitura de mesa:</strong> Conjuração (Spellcasting) recupera esses espaços no Descanso Longo. Escudo (Shield) pode fornecer +5 à CA como Reação, elevando CA 17 a 22 apenas quando a magia é conjurada validamente — não é CA permanente. Confira componentes somáticos e mãos disponíveis com o escudo equipado.</p>
      </section>
      <section class="section" aria-labelledby="doom-equip-title">
        <div class="section-head"><div><div class="kicker">04 · Inventário inicial confirmado</div><h2 id="doom-equip-title">Ferramentas antes da armadura arcana</h2></div><div class="note">Equipamento inicial do nível 1</div></div>
        <ul class="doom-equipment">
          <?php foreach($doom['equipamento_inicial_aprovado'] as $item): ?><li><?php echo esc_html($item); ?></li><?php endforeach; ?>
        </ul>
      </section>
      <section class="play" aria-labelledby="doom-combat-title">
        <div class="play-box">
          <div><div class="kicker">05 · Na mesa</div><h2 id="doom-combat-title"><?php echo esc_html($doom_copy["nivel_1"]["combat_title"]); ?></h2></div>
          <div>
            <?php foreach ($doom_copy['nivel_1']['combat'] as $item): ?>
            <p><strong><?php echo esc_html($item['label']); ?>:</strong> <?php echo esc_html($item['text']); ?></p>
            <?php endforeach; ?>
            <div class="combat-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy['nivel_1']['combat_priority']); ?></div>
            <?php $doom_tactical = $doom_copy['nivel_1']['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
          </div>
        </div>
      </section>
      <footer class="doom-l1-footer"><span>Fim do nível total 1 · O Jovem Inventor</span></footer>
    </section></div>
  </div>
  <?php include FMB_PATH . 'templates/doom-level-02.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-03.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-04.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-05.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-06.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-07.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-08.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-09.php'; ?>
  <?php include FMB_PATH . 'templates/doom-level-10.php'; ?>
  <?php if (FMB_Doom_Release::is_public_level(11) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-11.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(12) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-12.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(13) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-13.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(14) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-14.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(15) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-15.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(16) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-16.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(17) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-17.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(18) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-18.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(19) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-19.php'; endif; ?>
  <?php if (FMB_Doom_Release::is_public_level(20) || (defined('FMB_DOOM_REVIEW_MODE') && FMB_DOOM_REVIEW_MODE === true)): include FMB_PATH . 'templates/doom-level-20.php'; endif; ?>
</div>
