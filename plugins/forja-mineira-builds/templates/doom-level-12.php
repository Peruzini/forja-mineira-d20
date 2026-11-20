<?php
/** Nível total 12: PROPOSTA da fonte v1.2, visível só em modo revisão. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(12);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel12.json'),true,512,JSON_THROW_ON_ERROR);
$wish_source=FMB_Doom_Proposal::get_for_preview(11)['wishlist_novas_prioridades'];
$w=$wish_source[0]??null;
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['nivel_total']??null)!==12 ||
 ($copy['build_id']??'')!=='doutor-destino' || ($copy['publicacao_autorizada']??true)!==false || count($copy['combat']??[])!==4 ||
 ($d['nivel_total']??null)!==12 || ($d['artifice']??null)!==3 || ($d['mago']??null)!==9 ||
 ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 ($d['pv_fixos']??null)!==90 || ($d['atributos']['INT']??null)!==20 || ($d['bonus_proficiencia']??null)!==4 ||
 ($d['protecao_arcana_maxima']??null)!==23 || ($d['total_magias_grimorio']??null)!==27 ||
 ($d['magias_mago_preparadas_regulares']??null)!==14 || count($d['preparacao_padrao_mago']??[])!==14 ||
 ($d['espacos_magia_por_circulo']??null)!==[4,3,3,3,2,1] ||
 ($d['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']??null)!==5 ||
 ($d['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']??null)!==6 ||
 array_column($d['magias_grimorio_adicionadas']??[],'pt')!==['Muralha de Força','Telecinese','Vínculo Planar'] ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02C'] ||
 !empty($d['wishlist_novas_prioridades']) || ($w['identificador']??'')!=='ring_of_spell_storing' ||
 ($w['estado_aquisicao']??'')!=='NAO_CONFIRMADO' || ($w['aplicar_bonus_no_personagem_automaticamente']??true)!==false) {
 throw new RuntimeException('Falha no contrato do nível 12 / Wishlist pendente.');
}
$dc=8+(int)$d['bonus_proficiencia']+5;
$attack=(int)$d['bonus_proficiencia']+5;
if ($dc!==17 || $attack!==9) throw new RuntimeException('CD/ataque do nível 12 divergente.');
// A fonte v1.2 não informa CA própria nos níveis 11/12; a referência permanece condicional.
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$n=12; include FMB_PATH . 'templates/doom-combat-mechanics-overlay.php';
$slots=implode(' · ',array_map(static function($i,$count){return $count.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-12 doom-level-12 doom-level-proposal" data-fmb-block="12">
 <div class="preview"><section class="level" id="doom-nivel-12" data-fmb-level="12" data-fmb-phase="III · A Primeira Máscara" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(12) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n12-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível 12">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div><div class="level-no" aria-label="Nível 12">12</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02c-mascara-iii-aprovada.webp'); ?>" alt="Máscara da terceira fase de Doutor Destino" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos · simulação</span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val):?><div class="fm-stat"><small><?php echo esc_html($stat);?></small><strong><?php echo esc_html($val);?></strong><span><?php echo esc_html($doom_mod($val));?></span></div><?php endforeach;?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa e barreira</span><div class="fm-row"><small>CA sem réplica ativa</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($ca_ref);?></strong></div><div class="fm-row"><small>Proteção Arcana · máxima</small><strong><?php echo esc_html($d['protecao_arcana_maxima']);?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n12-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q):?><div><small><?php echo esc_html(($i+1).'º círculo');?></small><strong><?php echo esc_html($q);?></strong></div><?php endforeach;?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n12-wishlist" role="note" aria-label="Wishlist ainda não adquirida, nível 12"><span class="wish-title">Wishlist · prioridade pendente</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($w);?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']);?></p></div></div><div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n12-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']);?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n12-title" class="doom-n12-title"><?php echo esc_html($copy['title']);?></h2>
   <p class="lead doom-n12-lead"><?php echo esc_html($copy['intro']);?></p>
   <div class="doom-n12-strip" aria-label="Indicadores propostos nível 12"><span><strong><?php echo esc_html($d['pv_fixos']);?> PV (proposto)</strong></span><span><strong>INT <?php echo esc_html($d['atributos']['INT']);?></strong> (+5)</span><span><strong>23 PV</strong> Proteção Arcana*</span><span><strong><?php echo esc_html($slots);?></strong> espaços</span><span><strong>CD 17</strong> · ataque +9</span><span><strong>27</strong> no grimório · <strong>14</strong> preparadas</span></div>
   <section class="doom-n12-feature" aria-labelledby="doom-n12-feature-title"><div class="mini-label"><?php echo esc_html($copy['feature_label']);?></div><h3 id="doom-n12-feature-title"><?php echo esc_html($copy['feature_title']);?></h3><p><?php echo esc_html($copy['feature_detail']);?></p><p class="doom-n12-note"><strong>Proteção Arcana:</strong> <?php echo esc_html($copy['ward_detail']);?></p></section>
   <section class="doom-n12-feature" aria-labelledby="doom-n12-spells-title"><div class="mini-label">Grimório · novas inscrições</div><h3 id="doom-n12-spells-title">3 novas inscrições · Mago 9</h3><p><?php echo esc_html($copy['spell_intro']);?></p>
    <div class="doom-n12-spell-grid"><?php foreach($d['magias_grimorio_adicionadas'] as $spell):?><?php $note='';foreach($copy['spell_notes'] as $sc) if($sc['pt']===$spell['pt'])$note=$sc['note'];?><article class="doom-n12-spell"><small><?php echo esc_html(($spell['origem_aprendizado']??'')==='especialista_abjuracao_bonus'?'BÔNUS DO ABJURADOR':'PROGRESSÃO NORMAL');?></small><strong><?php echo $doom_fmt($spell);?></strong><span><?php echo esc_html($note);?></span></article><?php endforeach;?></div>
    <div class="doom-n12-prepared"><strong>Preparação proposta de Mago · 14</strong><ul><?php foreach($d['preparacao_padrao_mago'] as $prepared):?><li><?php echo esc_html($prepared);?><?php if (strpos($prepared,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?></li><?php endforeach;?></ul></div><p class="doom-n12-note"><?php echo esc_html($copy['prep_note']);?> Espaços de 6º círculo da multiclasse não permitem aprender magias de Mago de 6º círculo neste nível.</p>
   </section>
   <section class="doom-n12-combat" aria-labelledby="doom-n12-combat-title"><div class="mini-label">Na mesa · proposta para revisão tática posterior</div><h3 id="doom-n12-combat-title"><?php echo esc_html($copy['combat_title']);?></h3><p><?php echo esc_html($copy['combat_intro']);?></p><ol><?php foreach($copy['combat'] as $step):?><li><strong><?php echo esc_html($step['label']);?>:</strong> <?php echo esc_html($step['text']);?></li><?php endforeach;?></ol><div class="doom-n12-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']);?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n12-footer"><span>Fim do nível total 12 · <?php echo esc_html($copy['title']);?></span></footer>
 </section></div>
</div>
