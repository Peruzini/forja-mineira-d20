<?php
/** Prévia somente nível total 3. Fonte canônica Etapa 3 + editorial isolado; sem publicação. */
$doom_level3 = FMB_Doom_Data::get_approved_level(3);
$doom_copy3 = json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel03.json'),true,512,JSON_THROW_ON_ERROR);
if (!$doom_level3 || ($doom_level3['nivel_total']??null)!==3 ||
($doom_level3['status_aprovacao']??'')!=='APROVADO_MECANICAMENTE' ||
($doom_level3['publicacao_autorizada']??true)!==false ||
($doom_copy3['schema']??'')!=='forja-doom-level-editorial/1.0' ||
($doom_copy3['build_id']??'')!=='doutor-destino' || ($doom_copy3['nivel_total']??null)!==3 ||
($doom_copy3['publicacao_autorizada']??true)!==false) {
 throw new RuntimeException('Contrato do nível 3 indisponível ou não aprovado para preview.');
}
$doom3=$doom_level3['mecanica'];
$doom3_models=$doom3['modelos_armadura_disponiveis'];
$doom3_regular=$doom3['magias_artifice_preparadas'];
$doom3_bonus=$doom3['magias_armoreiro_sempre_preparadas'];
$doom3_feats=$doom3['caracteristicas_detalhadas'];
$doom3_rep=$doom3['replicar_itens_magicos'];
if ($doom3['artifice']!==3 || $doom3['mago']!==0 || $doom3['pv_fixos']!==27 ||
$doom3['espacos_magia_por_circulo']!==[3] || $doom3['modelo_armadura']!=='Guardião (Guardian)' ||
count($doom3_models)!==3 || count($doom3_regular)!==4 || count($doom3_bonus)!==2 ||
($doom3['classe_armadura']['ca_referencia']??null)!==18 ||
($doom3['arte_editorial']['identificadores'][0]??null)!=='DOOM-ART-02A' ||
($doom3_rep['limite_itens_ativos']??null)!==2 || count($doom3_rep['planos_conhecidos']??[])!==4 ||
count($doom_copy3['models_detail'])!==3 || count($doom_copy3['combat'])!==4) {
 throw new RuntimeException('Nível 3 diverge da fonte mecânica aprovada.');
}
?>
<div class="fmb-block fmb-block-3" data-fmb-block="3">
 <div class="preview"><section class="level" id="doom-nivel-3" data-fmb-level="3" data-fmb-phase="I · O Inventor" aria-labelledby="doom-n3-title">
  <aside class="progress-side">
    <div class="phase"><?php echo esc_html($doom_copy3['phase']); ?></div>
    <div class="level-no" aria-label="Nível total 3">3</div>
    <div class="timeline" aria-hidden="true"></div>
    <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02a-mascara-i-aprovada.webp'); ?>" width="1024" height="1536" loading="lazy" alt="Máscara de metal do primeiro estágio de Victor"></div>
    <div class="fm-side-sheet">
      <div class="fm-side-section"><span class="fm-side-label">Atributos · sem mudança</span><div class="fm-stats-grid">
        <?php foreach($doom3['atributos'] as $abbr=>$value): ?><div class="fm-stat"><small><?php echo esc_html($abbr); ?></small><strong><?php echo esc_html($value); ?></strong><span><?php echo esc_html($doom_mod($value)); ?></span></div><?php endforeach; ?>
      </div></div>
      <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · sem itens presumidos</span>
        <div class="fm-row"><small>CA inicial</small><strong>17</strong></div>
        <div class="fm-row"><small>Com Escudo +1 replicado</small><strong><?php echo esc_html($doom3['classe_armadura']['ca_referencia']); ?></strong></div>
        <div class="fm-row"><small>Cota de Malha comprada + réplica</small><strong>19*</strong></div>
      </div>
      <div class="fm-side-section fm-panel"><span class="fm-side-label">Conjuração / recursos</span><div class="fm-resource-mini">
         <div><small>Espaços 1º</small><strong><?php echo esc_html($doom3['espacos_magia_por_circulo'][0]); ?></strong></div>
         <div><small>Réplicas máximas</small><strong><?php echo esc_html($doom3_rep['limite_itens_ativos']); ?></strong></div>
       </div></div>
    </div>
    <?php $doom_wishlist_level = 3; include FMB_PATH . 'templates/doom-sidebar-wishlist.php'; ?>
      <div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content compact-content">
    <div class="kicker"><?php echo esc_html($doom_copy3['kicker']); ?> · Eberron 2025</div>
    <h2 class="doom-n3-title" id="doom-n3-title"><?php echo esc_html($doom_copy3['title']); ?></h2>
    <p class="lead compact-lead"><?php echo esc_html($doom_copy3['intro']); ?></p>
    <div class="compact-strip" aria-label="Indicadores do nível 3"><span><strong><?php echo esc_html($doom3['pv_fixos']); ?> PV</strong></span><span><strong>CA 18*</strong> com réplica ativa</span><span><strong>3 × 1º</strong> espaços</span><span><strong>3 modelos</strong> um ativo</span></div>
    <section class="compact-block" aria-labelledby="doom-n3-features">
      <div class="mini-label">Nova subclasse · Armeiro (Armorer)</div>
      <h3 class="doom-n3-heading" id="doom-n3-features">O equipamento agora é parte do estilo de combate</h3>
      <div class="doom-n3-feature-grid">
        <article><div class="mini-label">Treinamento em armadura pesada</div><h4>Oficina especializada</h4><p><?php echo esc_html($doom_copy3['heavy']); ?></p></article>
        <article><div class="mini-label">Armadura Arcana (Arcane Armor)</div><h4>Tecnologia, não armadura gratuita</h4><p><?php echo esc_html($doom_copy3['arcane']); ?></p></article>
      </div>
      <p class="doom-n3-tools"><strong>Ferramenta adicional:</strong> <?php echo esc_html($doom3['ferramenta_duplicada_substituida_por']); ?>. <?php echo esc_html($doom_copy3['jewel_note']); ?></p>
    </section>
    <section class="compact-block" aria-labelledby="doom-n3-modes">
      <div class="mini-label">Modelo de Armadura (Armor Model)</div>
      <h3 class="doom-n3-heading" id="doom-n3-modes">Três modelos — uma escolha ativa</h3>
      <p class="doom-n3-p"><?php echo esc_html($doom_copy3['models_intro']); ?></p>
      <div class="doom-n3-models">
        <?php foreach($doom3_models as $ix=>$model): ?>
        <article class="doom-n3-model <?php echo $model['estado']==='padrão'?'primary':''; ?>">
          <small><?php echo esc_html($model['estado']==='padrão'?'PADRÃO DA BUILD':'ALTERNATIVO'); ?> · <?php echo esc_html($doom_copy3['models_detail'][$ix]['function']); ?></small>
          <h4><?php echo $doom_fmt($model); ?></h4>
          <div class="doom-n3-tags"><?php foreach($model['recursos'] as $res): ?><span><?php echo esc_html($res); ?></span><?php endforeach; ?></div>
          <p><?php echo esc_html($doom_copy3['models_detail'][$ix]['summary']); ?></p>
        </article>
        <?php endforeach; ?>
      </div>
    </section>
    <section class="compact-block" aria-labelledby="doom-n3-magic">
      <div class="mini-label">Conjuração (Spellcasting) · Artífice 3</div>
      <h3 class="doom-n3-heading" id="doom-n3-magic"><?php echo esc_html($doom_copy3['magic_title']); ?></h3>
      <p class="doom-n3-p"><?php echo esc_html($doom_copy3['magic_note']); ?></p>
      <div class="doom-n3-magic-grid">
        <div><strong>Preparadas regulares · <?php echo count($doom3_regular); ?></strong><ul><?php foreach($doom3_regular as $s): ?><li><?php echo $doom_fmt($s); ?></li><?php endforeach; ?></ul></div>
        <div><strong>Armeiro · sempre preparadas · <?php echo count($doom3_bonus); ?></strong><ul><?php foreach($doom3_bonus as $s): ?><li><?php echo $doom_fmt($s); ?></li><?php endforeach; ?></ul></div>
      </div>
      <p class="doom-n3-p doom-n3-armor-note"><strong>CA e inventário:</strong> <?php echo esc_html($doom_copy3['armor_note']); ?></p>
    </section>
    <section class="compact-combat doom-n3-combat" aria-labelledby="doom-n3-combat">
      <span class="mini-label">Na mesa · Um único plano de combate</span>
      <h3 class="doom-n3-heading" id="doom-n3-combat"><?php echo esc_html($doom_copy3['combat_title']); ?></h3>
      <p><?php echo esc_html($doom_copy3['combat_intro']); ?></p>
      <ol><?php foreach($doom_copy3['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol>
      <p class="doom-n3-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy3['priority']); ?></p>
        <?php $doom_tactical = $doom_copy3['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
    </section>
    <div class="doom-n3-footer">Fim do nível total 3 · Armeiro </div>
  </div>
 </section></div>
</div>
