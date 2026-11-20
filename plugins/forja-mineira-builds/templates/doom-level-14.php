<?php
/** Forja Mineira — Doutor Destino nível total 14. Prévia NÃO homologada. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(14);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel14.json'),true,512,JSON_THROW_ON_ERROR);
$wish=FMB_Doom_Proposal::get_for_preview(13)['wishlist_novas_prioridades'][0]??null;
$spells=$d['magias_grimorio_adicionadas'];$prepared=$d['preparacao_padrao_mago'];
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==14 || ($copy['publicacao_autorizada']??true)!==false || count($copy['combat']??[])!==4 || count($copy['spell_notes']??[])!==3 ||
 ($d['nivel_total']??null)!==14 || ($d['artifice']??null)!==3 || ($d['mago']??null)!==11 || ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 $d['pv_fixos']!==104 || $d['bonus_proficiencia']!==5 || $d['atributos']['INT']!==20 || $d['protecao_arcana_maxima']!==27 ||
 $d['magias_mago_preparadas_regulares']!==16 || count($prepared)!==16 || $d['total_magias_grimorio']!==32 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,2,1,1] ||
 array_column($spells,'pt')!==['Contingência','Globo de Invulnerabilidade','Desintegrar'] ||
 ($spells[0]['origem_aprendizado']??'')!=='especialista_abjuracao_bonus' ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02D'] ||
 !empty($d['wishlist_novas_prioridades']) || ($wish['identificador']??'')!=='staff_of_power' ||
 ($wish['estado_aquisicao']??'')!=='NAO_CONFIRMADO' || ($wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false) {
 throw new RuntimeException('Nível 14 bloqueado: contrato v1.2 ou estados divergentes.');
}
$n=14; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-13-16.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if($dc!==18 || $attack!==10 || $d['protecao_arcana_maxima']!==2*$d['mago']+$mod)throw new RuntimeException('N14: valores derivados incorretos.');
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-14 doom-level-14 doom-level-proposal" data-fmb-block="14">
 <div class="preview"><section class="level" id="doom-nivel-14" data-fmb-level="14" data-fmb-phase="IV · O Domínio da Magia" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(14) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n14-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível 14">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div>
   <div class="level-no" aria-label="Nível 14">14</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02d-mascara-iv-aprovada.webp'); ?>" alt="Máscara de Victor na quarta fase, arte pictórica" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos do nível</span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat); ?></small><strong><?php echo esc_html($val); ?></strong><span><?php echo esc_html($doom_mod($val)); ?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · configuração condicionada</span><div class="fm-row"><small>CA com escudo comum</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($ca_ref); ?></strong></div><div class="fm-row"><small>Proteção Arcana (máximo)</small><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n14-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($q); ?></strong></div><?php endforeach; ?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n14-wishlist" role="note" aria-label="Wishlist pendente no nível 14"><span class="wish-title">Wishlist · prioridade pendente</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']); ?></p></div></div>
   <div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n14-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n14-title" class="doom-n14-title"><?php echo esc_html($copy['title']); ?></h2>
   <p class="lead doom-n14-lead"><?php echo esc_html($copy['intro']); ?></p>
   <div class="doom-n14-strip" aria-label="Indicadores do nível 14">
    <span><strong><?php echo esc_html($d['pv_fixos']); ?> PV</strong> Artífice 3 / Mago 11</span>
    <span><strong>INT <?php echo esc_html($d['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod); ?>)</span>
    <span><strong>CD <?php echo esc_html($dc); ?></strong> · ataque +<?php echo esc_html($attack); ?></span>
    <span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
    <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
    <span><strong>32</strong> grimório · <strong>16</strong> preparadas</span>
   </div>
   <section class="doom-n14-feature" aria-labelledby="doom-n14-feature-title">
    <div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div>
    <h3 id="doom-n14-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3>
    <p><?php echo esc_html($copy['feature_detail']); ?></p>
    <div class="doom-n14-feature-grid"><div class="doom-n14-ward-value"><span>Proteção Arcana</span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?></strong><small>PV da barreira · não são PV de Victor</small></div><p><?php echo esc_html($copy['ward_detail']); ?></p></div>
   </section>
   <section class="doom-n14-feature" aria-labelledby="doom-n14-spells-title">
    <div class="mini-label">Magias de 6º círculo</div><h3 id="doom-n14-spells-title">Três inscrições no grimório</h3>
    <div class="doom-n14-spell-grid"><?php foreach($spells as $s): ?>
      <?php $note='';foreach($copy['spell_notes'] as $c)if($c['pt']===$s['pt'])$note=$c['note']; ?>
      <article class="doom-n14-spell"><small><?php echo esc_html(($s['origem_aprendizado']??'')==='especialista_abjuracao_bonus'?'ABJURAÇÃO · BÔNUS':'MAGO · PROGRESSÃO'); ?></small><strong><?php echo $doom_fmt($s); ?></strong><span><?php echo esc_html($note); ?></span></article>
    <?php endforeach; ?></div>
    <p class="doom-n14-note"><strong>Preparação e componentes:</strong> <?php echo esc_html($copy['prep_note']); ?></p>
    <div class="doom-n14-prepared"><strong>Preparação regular de Mago · 16</strong><ul><?php foreach($prepared as $s): ?><li><?php echo esc_html($s); ?><?php if (strpos($s,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($s,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach; ?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
    <p class="doom-n14-note"><strong>Espaços versus magias conhecidas:</strong> <?php echo esc_html($copy['slot_note']); ?></p>
   </section>
   <section class="doom-n14-combat" aria-labelledby="doom-n14-combat-title"><div class="mini-label">Na mesa · estratégia provisória</div><h3 id="doom-n14-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n14-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n14-footer"><span>Fim do nível total 14 · O Arquiteto do Impossível</span></footer>
 </section></div>
</div>
