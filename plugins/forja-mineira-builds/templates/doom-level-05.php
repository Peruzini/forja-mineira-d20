<?php
/** Marco narrativo do nível total 5. Somente prévia — dados canônicos v1.2. */
$doom_level5 = FMB_Doom_Data::get_approved_level(5);
$doom_copy5 = json_decode((string) file_get_contents(FMB_PATH . 'data/doom-editorial-nivel05.json'), true, 512, JSON_THROW_ON_ERROR);
if (!$doom_level5 || ($doom_level5['nivel_total'] ?? null) !== 5 ||
    ($doom_level5['status_aprovacao'] ?? '') !== 'APROVADO_MECANICAMENTE' ||
    ($doom_level5['publicacao_autorizada'] ?? true) !== false ||
    ($doom_copy5['schema'] ?? '') !== 'forja-doom-level-editorial/1.0' ||
    ($doom_copy5['build_id'] ?? '') !== 'doutor-destino' ||
    ($doom_copy5['nivel_total'] ?? null) !== 5 ||
    ($doom_copy5['publicacao_autorizada'] ?? true) !== false ||
    count($doom_copy5['combat'] ?? []) !== 4) {
  throw new RuntimeException('Nível 5 sem contrato editorial/mecânico aprovado para prévia.');
}
$doom5 = $doom_level5['mecanica'];
$doom5_slots = $doom5['espacos_magia_por_circulo'];
$doom5_book = $doom5['magias_grimorio_adicionadas'];
$doom5_prepared = $doom5['preparacao_padrao_mago'];
$doom5_wishes = $doom5['wishlist_novas_prioridades'];
if ($doom5['artifice'] !== 3 || $doom5['mago'] !== 2 ||
    $doom5['pv_fixos'] !== 41 || $doom5['bonus_proficiencia'] !== 3 ||
    $doom5['atributos']['INT'] !== 17 ||
    $doom5_slots !== [4,3] || $doom5['total_magias_grimorio'] !== 8 ||
    $doom5['magias_mago_preparadas_regulares'] !== 5 ||
    count($doom5_prepared) !== 5 || count($doom5_book) !== 2 ||
    count($doom5_wishes) !== 2 ||
    $doom5_wishes[0]['pt'] !== 'Armadura Segmentada' ||
    $doom5_wishes[1]['pt'] !== 'Manto de Proteção' ||
    ($doom5['especializacao_pericia'] ?? '') !== 'Arcanismo (Arcana), +9 no nível total 5' ||
    ($doom5['classe_armadura']['ca_referencia'] ?? null) !== 18 ||
    ($doom5['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago'] ?? null) !== 1 ||
    ($doom5['arte_editorial']['identificadores'][0] ?? null) !== 'DOOM-ART-03A') {
  throw new RuntimeException('Nível 5 diverge do consolidado v1.2.');
}
$doom5_prof = (int)$doom5['bonus_proficiencia'];
$doom5_int_mod = (int)floor(($doom5['atributos']['INT'] - 10) / 2);
$doom5_arcana = 2*$doom5_prof + $doom5_int_mod;
$doom5_dc = 8+$doom5_prof+$doom5_int_mod;
$doom5_atk = $doom5_prof+$doom5_int_mod;
$doom5_fmt = $doom_fmt;
?>
<div class="fmb-block fmb-block-5 doom-level-five" data-fmb-block="5">
 <div class="preview"><section class="level" id="doom-nivel-5" data-fmb-level="5" data-fmb-phase="II · O Conhecimento Arcano" aria-labelledby="doom-n5-title">
  <div class="phase-open">
   <aside class="doom-n5-art-rail" aria-label="Arte do marco e prioridade de equipamento">
    <figure class="art doom-n5-art">
     <img src="<?php echo esc_url($doom_art . 'doom-art-03a-manopla-arcana-aprovada.webp'); ?>" width="1086" height="1448" loading="lazy" alt="Victor usando uma manopla de energia arcana, pintura original">
     <span class="phase-tag">Fase II · O Conhecimento Arcano</span>
     <span class="level-badge" aria-label="Nível 5">5</span>
     <figcaption class="art-caption"><strong><?php echo esc_html($doom_copy5['art_caption']); ?></strong></figcaption>
    </figure>
    <div class="doom-n5-wish-rail">
      <?php $doom_wishlist_level = 5; include FMB_PATH . 'templates/doom-sidebar-wishlist.php'; ?>
    </div>
   </aside>
   <div class="content doom-n5-content">
    <div class="kicker"><?php echo esc_html($doom_copy5['kicker']); ?> · PHB 2024 / Eberron 2025</div>
    <h2 class="doom-n5-title" id="doom-n5-title"><?php echo esc_html($doom_copy5['title']); ?></h2>
    <div class="subtitle"><?php echo esc_html($doom_copy5['subtitle']); ?></div>
    <p class="lead"><?php echo esc_html($doom_copy5['intro']); ?></p>
    <div class="strip doom-n5-strip" aria-label="Indicadores do nível 5">
      <span><strong><?php echo esc_html($doom5['pv_fixos']); ?> PV</strong></span>
      <span><strong>CA 18*</strong> com réplica ativa</span>
      <span><strong>4×1º + 3×2º</strong> espaços</span>
      <span><strong>CD <?php echo esc_html($doom5_dc); ?></strong> · Ataque +<?php echo esc_html($doom5_atk); ?></span>
    </div>
    <div class="breakthrough doom-n5-breakthrough"><strong>Marco do nível:</strong> <?php echo esc_html($doom_copy5['feature_intro']); ?></div>
    <div class="doom-n5-duo">
      <article class="card primary">
        <span class="mini-label">Erudito (Scholar) · Mago 2</span>
        <h3>Especialização em Arcanismo</h3>
        <div class="doom-n5-big-stat"><strong>+<?php echo esc_html($doom5_arcana); ?></strong><span>Arcanismo (Arcana)</span></div>
        <p>Proficiência +<?php echo esc_html($doom5_prof); ?> duplicada pela Especialização (Expertise), mais Inteligência +<?php echo esc_html($doom5_int_mod); ?>. Excelente para investigação, análise mágica e compreensão de rituais.</p>
      </article>
      <article class="card">
        <span class="mini-label">Escalonamento · nível total 5</span>
        <h3>Truques mais fortes</h3>
        <ul class="doom-n5-cantrips">
          <li><span>Raio de Fogo (Fire Bolt)</span><strong>2d10</strong></li>
          <li><span>Raio de Gelo (Ray of Frost)</span><strong>2d8</strong></li>
          <li><span>Estilhaço Mental (Mind Sliver)</span><strong>2d6</strong></li>
        </ul>
      </article>
    </div>
    <section class="spells doom-n5-spells" aria-labelledby="doom-n5-book">
      <span class="mini-label">Grimório (Spellbook) · duas novas inscrições</span>
      <h3 id="doom-n5-book">Oito magias inscritas, cinco preparadas</h3>
      <div class="spell-grid">
        <?php foreach ($doom5_book as $spell): ?>
        <article class="spell-choice"><span class="mini-label"><?php echo ($spell['pt'] === 'Passos Longos') ? 'Nova · preparada' : 'Nova · ritual do grimório'; ?></span><strong><?php echo $doom5_fmt($spell); ?></strong><p><?php echo ($spell['pt'] === 'Passos Longos') ? 'Mobilidade antes do encontro, sem Concentração.' : 'Pesquisa e tradução como ritual; não ocupa uma preparação regular.'; ?></p></article>
        <?php endforeach; ?>
      </div>
      <div class="doom-n5-prepared"><strong>Preparação de Mago · 5</strong><ul><?php foreach ($doom5_prepared as $spell): ?><li><?php echo esc_html($spell); ?></li><?php endforeach; ?></ul></div>
      <p class="doom-n5-book-note"><?php echo esc_html($doom_copy5['slots_note']); ?></p>
    </section>
   </div>
  </div>
  <section class="combat doom-n5-combat" aria-labelledby="doom-n5-combat-title">
    <div class="combat-wrap">
      <div><span class="mini-label">Na mesa · combate</span><h3 id="doom-n5-combat-title"><?php echo esc_html($doom_copy5['combat_title']); ?></h3></div>
      <div><p><?php echo esc_html($doom_copy5['combat_intro']); ?></p>
        <ol class="doom-n5-combat-list"><?php foreach ($doom_copy5['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol>
        <div class="priority"><?php echo esc_html($doom_copy5['priority']); ?></div>
       <?php $doom_tactical = $doom_copy5['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
      </div>
    </div>
  </section>
  <footer class="doom-n5-footer">Fim do nível total 5 · O Conhecimento Arcano </footer>
 </section></div>
</div>
