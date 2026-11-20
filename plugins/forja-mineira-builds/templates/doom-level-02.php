<?php
/** Etapa 5 — Nível 2 apenas. Renderiza usando a fonte v1.2 aprovada; jamais publica. */
$doom_level2 = FMB_Doom_Data::get_approved_level(2);
$doom_copy2_path = FMB_PATH . 'data/doom-editorial-nivel02.json';
$doom_copy2 = json_decode((string)file_get_contents($doom_copy2_path), true, 512, JSON_THROW_ON_ERROR);
if (!$doom_level2 || ($doom_level2['nivel_total'] ?? null) !== 2 ||
    ($doom_level2['status_aprovacao'] ?? '') !== 'APROVADO_MECANICAMENTE' ||
    ($doom_level2['publicacao_autorizada'] ?? true) !== false ||
    ($doom_copy2['schema'] ?? '') !== 'forja-doom-level-editorial/1.0' ||
    ($doom_copy2['nivel_total'] ?? null) !== 2 ||
    ($doom_copy2['build_id'] ?? '') !== 'doutor-destino' ||
    ($doom_copy2['publicacao_autorizada'] ?? true) !== false) {
    throw new RuntimeException('Contrato de nível 2 não autorizado para preview.');
}
$doom2 = $doom_level2['mecanica'];
$doom2_rep = $doom2['replicar_itens_magicos'] ?? [];
$doom2_plans = $doom2_rep['planos_conhecidos'] ?? [];
$doom2_loadout = $doom2_rep['conjunto_padrao_projetado'] ?? [];
$doom2_spells = $doom2['magias_artifice_preparadas'] ?? [];
$doom2_atts = $doom2['atributos'] ?? [];
if (count($doom2_plans) !== 4 || count($doom2_loadout) !== 2 || (int)($doom2_rep['limite_itens_ativos'] ?? -1) !== 2 ||
    count($doom2_spells) !== 3 || (int)$doom2['pv_fixos'] !== 19 ||
    (int)$doom2['classe_armadura']['ca_referencia'] !== 18 ||
    ($doom2['arte_editorial']['identificadores'][0] ?? '') !== 'DOOM-ART-02A') {
    throw new RuntimeException('Contrato mecânico do nível 2 não corresponde ao consolidado.');
}
?>
<div class="fmb-block fmb-block-2" data-fmb-block="2">
  <div class="preview"><section class="level" id="doom-nivel-2" data-fmb-level="2" data-fmb-phase="I · O Inventor" aria-labelledby="doom-n2-title">
    <aside class="progress-side">
      <div class="phase"><?php echo esc_html($doom_copy2['phase']); ?></div>
      <div class="level-no" aria-label="Nível total 2">2</div>
      <div class="timeline" aria-hidden="true"></div>
      <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art . 'doom-art-02a-mascara-i-aprovada.webp'); ?>" alt="Máscara de metal do primeiro estágio de Victor" width="1024" height="1536" loading="lazy"></div>
      <div class="fm-side-sheet">
        <div class="fm-side-section">
          <span class="fm-side-label">Atributos · sem mudança</span>
          <div class="fm-stats-grid">
            <?php foreach($doom2_atts as $abbr=>$value): ?>
              <div class="fm-stat"><small><?php echo esc_html($abbr); ?></small><strong><?php echo esc_html($value); ?></strong><span><?php echo esc_html($doom_mod($value)); ?></span></div>
            <?php endforeach; ?>
          </div>
        </div>
        <div class="fm-side-section fm-panel">
          <span class="fm-side-label">Defesa condicionada</span>
          <div class="fm-row"><small>CA sem réplica</small><strong>17</strong></div>
          <div class="fm-row"><small>CA com Escudo +1 ativo</small><strong><?php echo esc_html($doom2['classe_armadura']['ca_referencia']); ?></strong></div>
          <div class="fm-row"><small>Escudo (Shield)</small><strong>+5 temporários</strong></div>
        </div>
        <div class="fm-side-section fm-panel">
          <span class="fm-side-label">Conjuração e réplicas</span>
          <div class="fm-resource-mini">
            <div><small>Espaços 1º círculo</small><strong><?php echo esc_html($doom2['espacos_magia_por_circulo'][0]); ?></strong></div>
            <div><small>Réplicas máximas</small><strong><?php echo esc_html($doom2_rep['limite_itens_ativos']); ?></strong></div>
          </div>
        </div>
      </div>
      <?php $doom_wishlist_level = 2; include FMB_PATH . 'templates/doom-sidebar-wishlist.php'; ?>
      <div class="fm-timeline-resume" aria-hidden="true"></div>
    </aside>
    <div class="content compact-content">
      <div class="kicker"><?php echo esc_html($doom_copy2['kicker']); ?></div>
      <h2 class="doom-n2-title" id="doom-n2-title"><?php echo esc_html($doom_copy2['title']); ?></h2>
      <p class="lead compact-lead"><?php echo esc_html($doom_copy2['intro']); ?></p>
      <div class="compact-strip" aria-label="Resumo mecânico de Artífice 2">
        <span><strong><?php echo esc_html($doom2['pv_fixos']); ?> PV</strong></span>
        <span><strong>CA <?php echo esc_html($doom2['classe_armadura']['ca_referencia']); ?>*</strong> com réplica ativa</span>
        <span><strong><?php echo esc_html(count($doom2_plans)); ?></strong> planos conhecidos</span>
        <span><strong><?php echo esc_html($doom2_rep['limite_itens_ativos']); ?></strong> réplicas simultâneas</span>
      </div>
      <section class="compact-block" aria-labelledby="doom-n2-rep-title">
        <div class="mini-label">Característica de Artífice 2025</div>
        <h3 class="doom-n2-heading" id="doom-n2-rep-title">Replicar Item Mágico (Replicate Magic Item)</h3>
        <p class="doom-n2-text"><?php echo esc_html($doom_copy2['feature_intro']); ?></p>
        <div class="doom-n2-plans" aria-label="Quatro planos conhecidos">
          <?php foreach($doom2_plans as $ix=>$plan): ?>
            <article class="doom-n2-plan"><small>Plano <?php echo esc_html($ix+1); ?> de 4</small><strong><?php echo esc_html($plan); ?></strong><p><?php echo esc_html($doom_copy2['plan_notes'][$ix]); ?></p></article>
          <?php endforeach; ?>
        </div>
        <div class="doom-n2-loadout">
          <div class="mini-label"><?php echo esc_html($doom_copy2['loadout_label']); ?></div>
          <strong><?php echo esc_html(implode(' + ', $doom2_loadout)); ?></strong>
          <p><?php echo esc_html($doom_copy2['loadout_note']); ?></p>
          <p class="doom-n2-conditional">* CA 18 somente se Escudo +1 (Shield +1) estiver replicado e equipado. Sem ele, a CA continua 17. Não há aquisição de tesouro automático.</p>
        </div>
      </section>
      <section class="compact-block" aria-labelledby="doom-n2-magic-title">
        <div class="mini-label">Conjuração (Spellcasting) · Artífice 2</div>
        <h3 class="doom-n2-heading" id="doom-n2-magic-title">Uma magia preparada a mais</h3>
        <p class="doom-n2-text"><strong><?php echo esc_html($doom_copy2['new_spell_title']); ?></strong> — <?php echo esc_html($doom_copy2['new_spell_note']); ?></p>
        <div class="doom-n2-spells">
          <span>Preparadas de Artífice (3):</span>
          <?php foreach($doom2_spells as $spell): ?><strong><?php echo $doom_fmt($spell); ?></strong><?php endforeach; ?>
        </div>
        <p class="doom-n2-footnote">Espaços de magia: 2 de 1º círculo, sem aumento neste nível. Escudo (Shield), recebido por Iniciado em Magia — Mago (Magic Initiate — Wizard), permanece separado das preparadas regulares.</p>
      </section>
      <section class="compact-combat doom-n2-combat" aria-labelledby="doom-n2-combat-title">
        <span class="mini-label">Na mesa · Um plano de combate</span>
        <h3 class="doom-n2-heading" id="doom-n2-combat-title"><?php echo esc_html($doom_copy2['combat_title']); ?></h3>
        <p><?php echo esc_html($doom_copy2['combat_intro']); ?></p>
        <ul class="doom-n2-combat-steps">
          <?php foreach($doom_copy2['combat'] as $item): ?><li><strong><?php echo esc_html($item['label']); ?>:</strong> <?php echo esc_html($item['text']); ?></li><?php endforeach; ?>
        </ul>
        <p class="doom-n2-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy2['combat_priority']); ?></p>
        <?php $doom_tactical = $doom_copy2['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
      </section>
      <div class="doom-n2-footer">Nível 2 · O Primeiro Arsenal </div>
    </div>
  </section></div>
</div>
