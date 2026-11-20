<?php
/** Forja Mineira — Doutor Destino nível total 16. Prévia NÃO homologada. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(16);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel16.json'),true,512,JSON_THROW_ON_ERROR);
$wish=FMB_Doom_Proposal::get_for_preview(13)['wishlist_novas_prioridades'][0]??null;
$spells=$d['magias_grimorio_adicionadas'];$prepared=$d['preparacao_padrao_mago'];
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==16 || ($copy['publicacao_autorizada']??true)!==false || count($copy['combat']??[])!==4 || count($copy['spell_notes']??[])!==3 ||
 ($d['nivel_total']??null)!==16 || ($d['artifice']??null)!==3 || ($d['mago']??null)!==13 || ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 $d['pv_fixos']!==118 || $d['bonus_proficiencia']!==5 || $d['atributos']['INT']!==20 || $d['protecao_arcana_maxima']!==31 ||
 $d['magias_mago_preparadas_regulares']!==17 || count($prepared)!==17 || $d['total_magias_grimorio']!==37 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,2,1,1,1] ||
 array_column($spells,'pt')!==['Teletransporte','Simulacro','Símbolo'] ||
 ($spells[2]['origem_aprendizado']??'')!=='especialista_abjuracao_bonus' ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02D'] ||
 !empty($d['wishlist_novas_prioridades']) || ($wish['identificador']??'')!=='staff_of_power' ||
 ($wish['estado_aquisicao']??'')!=='NAO_CONFIRMADO' || ($wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false) {
 throw new RuntimeException('Nível 16 bloqueado: contrato v1.2 ou estados divergentes.');
}
$n=16; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-13-16.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if($dc!==18 || $attack!==10 || $d['protecao_arcana_maxima']!==2*$d['mago']+$mod)throw new RuntimeException('N16: valores derivados incorretos.');
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-16 doom-level-16 doom-level-proposal" data-fmb-block="16">
 <div class="preview"><section class="level" id="doom-nivel-16" data-fmb-level="16" data-fmb-phase="IV · O Domínio da Magia" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(16) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n16-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível 16">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div>
   <div class="level-no" aria-label="Nível 16">16</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02d-mascara-iv-aprovada.webp'); ?>" alt="Máscara de Victor na quarta fase, arte pictórica" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos do nível</span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat); ?></small><strong><?php echo esc_html($val); ?></strong><span><?php echo esc_html($doom_mod($val)); ?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · configuração condicionada</span><div class="fm-row"><small>CA com escudo comum</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($ca_ref); ?></strong></div><div class="fm-row"><small>Proteção Arcana (máximo)</small><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n16-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($q); ?></strong></div><?php endforeach; ?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n16-wishlist" role="note" aria-label="Wishlist pendente no nível 16"><span class="wish-title">Wishlist · prioridade pendente</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']); ?></p></div></div>
   <div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n16-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n16-title" class="doom-n16-title"><?php echo esc_html($copy['title']); ?></h2>
   <p class="lead doom-n16-lead"><?php echo esc_html($copy['intro']); ?></p>
   <div class="doom-n16-strip" aria-label="Indicadores do nível 16">
    <span><strong><?php echo esc_html($d['pv_fixos']); ?> PV</strong> Artífice 3 / Mago 13</span>
    <span><strong>INT <?php echo esc_html($d['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod); ?>)</span>
    <span><strong>CD <?php echo esc_html($dc); ?></strong> · ataque +<?php echo esc_html($attack); ?></span>
    <span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
    <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
    <span><strong>37</strong> grimório · <strong>17</strong> preparadas</span>
   </div>
   <section class="doom-n16-feature" aria-labelledby="doom-n16-feature-title">
    <div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div>
    <h3 id="doom-n16-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3>
    <p><?php echo esc_html($copy['feature_detail']); ?></p>
    <div class="doom-n16-feature-grid"><div class="doom-n16-ward-value"><span>Proteção Arcana</span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?></strong><small>PV da barreira · não são PV de Victor</small></div><p><?php echo esc_html($copy['ward_detail']); ?></p></div>
   </section>
   <section class="doom-n16-feature" aria-labelledby="doom-n16-spells-title">
    <div class="mini-label">Magias de 7º círculo</div><h3 id="doom-n16-spells-title">Três inscrições no grimório</h3>
    <div class="doom-n16-spell-grid"><?php foreach($spells as $s): ?>
      <?php $note='';foreach($copy['spell_notes'] as $c)if($c['pt']===$s['pt'])$note=$c['note']; ?>
      <article class="doom-n16-spell"><small><?php echo esc_html(($s['origem_aprendizado']??'')==='especialista_abjuracao_bonus'?'ABJURAÇÃO · BÔNUS':'MAGO · PROGRESSÃO'); ?></small><strong><?php echo $doom_fmt($s); ?></strong><span><?php echo esc_html($note); ?></span></article>
    <?php endforeach; ?></div>
    <p class="doom-n16-note"><strong>Preparação e componentes:</strong> <?php echo esc_html($copy['prep_note']); ?></p>
    <div class="doom-n16-prepared"><strong>Preparação regular de Mago · 17</strong><ul><?php foreach($prepared as $s): ?><li><?php echo esc_html($s); ?><?php if (strpos($s,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($s,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach; ?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
    <p class="doom-n16-note"><strong>Espaços versus magias conhecidas:</strong> <?php echo esc_html($copy['slot_note']); ?></p>
   </section>
   <section class="doom-n16-combat" aria-labelledby="doom-n16-combat-title"><div class="mini-label">Na mesa · estratégia provisória</div><h3 id="doom-n16-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n16-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n16-footer"><span>Fim do nível total 16 · O Mestre das Grandes Obras</span></footer>
 </section></div>
</div>
