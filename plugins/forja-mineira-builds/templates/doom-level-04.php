<?php
/** Nível total 4: Mago 1. Apenas prévia local; mecânica proveniente da base v1.2 aprovada. */
$doom_level4=FMB_Doom_Data::get_approved_level(4);
$doom_copy4=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel04.json'),true,512,JSON_THROW_ON_ERROR);
if (!$doom_level4 || ($doom_level4['nivel_total']??null)!==4 ||
    ($doom_level4['status_aprovacao']??'')!=='APROVADO_MECANICAMENTE' ||
    ($doom_level4['publicacao_autorizada']??true)!==false ||
    ($doom_copy4['schema']??'')!=='forja-doom-level-editorial/1.0' ||
    ($doom_copy4['build_id']??'')!=='doutor-destino' || ($doom_copy4['nivel_total']??null)!==4 ||
    ($doom_copy4['publicacao_autorizada']??true)!==false) {
  throw new RuntimeException('Contrato do nível 4 indisponível ou não aprovado para prévia.');
}
$doom4=$doom_level4['mecanica'];
$doom4_rituals=['Encontrar Familiar (Find Familiar)','Alarme (Alarm)'];
$doom4_book=$doom4['magias_grimorio_adicionadas'];
$doom4_prepared=$doom4['preparacao_padrao_mago'];
$doom4_cantrips=$doom4['truques_adquiridos_no_nivel'];
$doom4_slots=$doom4['espacos_magia_por_circulo'];
if ($doom4['artifice']!==3 || $doom4['mago']!==1 || $doom4['pv_fixos']!==34 ||
  $doom4['bonus_proficiencia']!==2 || $doom4['atributos']['INT']!==17 ||
  $doom4_slots!==[4,2] || ($doom4['total_magias_grimorio']??null)!==6 ||
  ($doom4['magias_mago_preparadas_regulares']??null)!==4 || count($doom4_book)!==6 ||
  count($doom4_prepared)!==4 || count($doom4_cantrips)!==3 ||
  ($doom4['classe_armadura']['ca_referencia']??null)!==18 ||
  ($doom4['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']??null)!==1 ||
  ($doom4['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']??null)!==2 ||
  ($doom4['arte_editorial']['identificadores'][0]??null)!=='DOOM-ART-02A' ||
  count($doom_copy4['combat']??[])!==4) {
  throw new RuntimeException('Nível 4 diverge do contrato mecânico canônico.');
}
$doom4_fmt=$doom_fmt;
$doom4_prepared_normalized=array_map(static fn($s)=>str_replace(["’",'Obscurecente'],["'",'Obscurecente'],$s),$doom4_prepared);
$doom4_is_prepared=static function($spell) use($doom4_prepared_normalized) {
  $pt=str_replace('’',"'",$spell['pt']);
  foreach ($doom4_prepared_normalized as $x) if (strpos($x,$pt)!==false) return true;
  return false;
};
?>
<div class="fmb-block fmb-block-4" data-fmb-block="4">
  <div class="preview"><section class="level" id="doom-nivel-4" data-fmb-level="4" data-fmb-phase="I · O Inventor" aria-labelledby="doom-n4-title">
    <aside class="progress-side">
      <div class="phase"><?php echo esc_html($doom_copy4['phase']); ?></div>
      <div class="level-no" aria-label="Nível total 4">4</div>
      <div class="timeline" aria-hidden="true"></div>
      <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02a-mascara-i-aprovada.webp'); ?>" width="1024" height="1536" loading="lazy" alt="Máscara de ferro no primeiro estágio de Victor, arte"></div>
      <div class="fm-side-sheet">
        <div class="fm-side-section"><span class="fm-side-label">Atributos · sem mudança</span><div class="fm-stats-grid">
          <?php foreach ($doom4['atributos'] as $abbr=>$value): ?><div class="fm-stat"><small><?php echo esc_html($abbr); ?></small><strong><?php echo esc_html($value); ?></strong><span><?php echo esc_html($doom_mod($value)); ?></span></div><?php endforeach; ?>
        </div></div>
        <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa</span>
          <div class="fm-row"><small>CA inicial (escudo comum)</small><strong>17</strong></div>
          <div class="fm-row"><small>Com Escudo +1 replicado</small><strong><?php echo esc_html($doom4['classe_armadura']['ca_referencia']); ?></strong></div>
          <div class="fm-row"><small>Cota de Malha comprada + réplica</small><strong>19*</strong></div>
        </div>
        <div class="fm-side-section fm-panel"><span class="fm-side-label">Recursos de magia</span><div class="fm-resource-mini">
          <div><small>1º círculo</small><strong><?php echo esc_html($doom4_slots[0]); ?></strong></div>
          <div><small>2º círculo</small><strong><?php echo esc_html($doom4_slots[1]); ?></strong></div>
        </div></div>
      </div>
      <?php $doom_wishlist_level = 4; include FMB_PATH . 'templates/doom-sidebar-wishlist.php'; ?>
      <div class="fm-timeline-resume" aria-hidden="true"></div>
    </aside>
    <div class="content compact-content">
      <div class="kicker"><?php echo esc_html($doom_copy4['kicker']); ?> · PHB 2024 / Eberron 2025</div>
      <h2 class="doom-n4-title" id="doom-n4-title"><?php echo esc_html($doom_copy4['title']); ?></h2>
      <p class="lead compact-lead"><?php echo esc_html($doom_copy4['intro']); ?></p>
      <div class="compact-strip" aria-label="Indicadores do nível 4"><span><strong><?php echo esc_html($doom4['pv_fixos']); ?> PV</strong></span><span><strong>CA 18*</strong> com réplica ativa</span><span><strong>4×1º + 2×2º</strong> espaços</span><span><strong>6</strong> magias no grimório</span></div>
      <section class="compact-block" aria-labelledby="doom-n4-features">
        <div class="mini-label">Nova classe · Mago 1</div>
        <h3 class="doom-n4-heading" id="doom-n4-features">Três características que ampliam o repertório</h3>
        <div class="doom-n4-feature-grid">
          <article><small>Conjuração (Spellcasting)</small><h4>Grimório de Mago</h4><p>Seis magias inscritas, três novos truques e quatro preparadas regulares. A lista de Mago não substitui a de Artífice.</p></article>
          <article><small>Adepto de Rituais (Ritual Adept)</small><h4>Rituais do grimório</h4><p><?php echo esc_html($doom_copy4['ritual']); ?></p></article>
          <article><small>Recuperação Arcana (Arcane Recovery)</small><h4>Recuperação limitada</h4><p><?php echo esc_html($doom_copy4['arcane_recovery']); ?></p></article>
        </div>
      </section>
      <section class="compact-block" aria-labelledby="doom-n4-cantrips">
        <div class="mini-label">Truques (Cantrips) · Mago 1</div>
        <h3 class="doom-n4-heading" id="doom-n4-cantrips">Três novos truques de Mago</h3>
        <div class="doom-n4-pills"><?php foreach($doom4_cantrips as $term): ?><span><?php echo esc_html($term['nome']); ?></span><?php endforeach; ?></div>
      </section>
      <section class="compact-block" aria-labelledby="doom-n4-book">
        <div class="mini-label">Grimório (Spellbook) · 6 magias de 1º círculo</div>
        <h3 class="doom-n4-heading" id="doom-n4-book">Seis inscrições, quatro preparações</h3>
        <p class="doom-n4-text"><?php echo esc_html($doom_copy4['spellbook']); ?></p>
        <div class="doom-n4-book-grid">
          <?php foreach($doom4_book as $term): ?>
          <article class="doom-n4-spell <?php echo $doom4_is_prepared($term)?'is-prepared':'is-ritual'; ?>">
            <small><?php echo $doom4_is_prepared($term)?'PREPARADA · MAGO':'RITUAL · GRIMÓRIO'; ?></small>
            <strong><?php echo $doom4_fmt($term); ?></strong>
          </article>
          <?php endforeach; ?>
        </div>
        <p class="doom-n4-note"><?php echo esc_html($doom_copy4['old_spell']); ?></p>
      </section>
      <section class="compact-block" aria-labelledby="doom-n4-spells">
        <div class="mini-label">Multiclasse · fontes separadas</div>
        <h3 class="doom-n4-heading" id="doom-n4-spells">Um repertório, quatro fontes diferentes</h3>
        <div class="doom-n4-sources">
          <div><strong>Artífice · 4 preparadas</strong><p><?php echo implode(' · ',array_map($doom4_fmt,$doom4['magias_artifice_preparadas'])); ?></p></div>
          <div><strong>Armeiro · 2 sempre preparadas</strong><p><?php echo implode(' · ',array_map($doom4_fmt,$doom4['magias_armoreiro_sempre_preparadas'])); ?></p></div>
          <div><strong>Origem · talento</strong><p><?php echo implode(' · ',array_map($doom4_fmt,$doom4['magias_talento_origem'])); ?></p></div>
          <div><strong>Mago · 4 preparadas regulares</strong><p><?php echo esc_html(implode(' · ',$doom4_prepared)); ?></p></div>
        </div>
        <p class="doom-n4-note"><strong>Espaços compartilhados:</strong> <?php echo esc_html($doom_copy4['shared_slots']); ?></p>
        <p class="doom-n4-text"><strong>Componentes e focos:</strong> <?php echo esc_html($doom_copy4['casting_focus']); ?></p>
      </section>
      <section class="compact-combat doom-n4-combat" aria-labelledby="doom-n4-combat">
        <span class="mini-label">Na mesa · um único plano de combate</span>
        <h3 class="doom-n4-heading" id="doom-n4-combat"><?php echo esc_html($doom_copy4['combat_title']); ?></h3>
        <p><?php echo esc_html($doom_copy4['combat_intro']); ?></p>
        <ol><?php foreach($doom_copy4['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol>
        <p class="doom-n4-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy4['priority']); ?></p>
        <?php $doom_tactical = $doom_copy4['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
      </section>
      <div class="doom-n4-footer">Fim do nível total 4 · Primeiro Grimório </div>
    </div>
  </section></div>
</div>
