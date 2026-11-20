<?php
/** Doutor Destino Nível 18 — PREVIEW de decisões ainda pendentes na documentação v1.2. */
if (!defined('ABSPATH')) exit;
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(18);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel18.json'),true,512,JSON_THROW_ON_ERROR);
$source=json_decode((string)file_get_contents(FMB_PATH.'data/doom-proposal-18-preview.json'),true,512,JSON_THROW_ON_ERROR);
$wish=FMB_Doom_Proposal::get_for_preview(17)['wishlist_novas_prioridades'][0];
$wish_additional=FMB_Doom_Proposal::get_for_preview(17)['wishlist_novas_prioridades'][1];
$spells=$d['magias_grimorio_adicionadas']; $prepared=$d['preparacao_padrao_mago'];
if (($copy['schema']??null)!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??null)!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==18 || ($copy['publicacao_autorizada']??true)!==false ||
 ($source['source_status']??null)!=='pendente' || ($d['nivel_total']??null)!==18 || $d['mago']!==15 || $d['artifice']!==3 ||
 $d['pv_fixos']!==132 || $d['bonus_proficiencia']!==6 || $d['atributos']['INT']!==20 || $d['protecao_arcana_maxima']!==35 ||
 $d['total_magias_grimorio']!==42 || $d['magias_mago_preparadas_regulares']!==19 || count($prepared)!==19 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,2,1,1,1,1] ||
 array_column($spells,'pt')!==['Labirinto','Clone','Mente Vazia'] ||
 $spells[2]['origem_aprendizado']!=='especialista_abjuracao_bonus' ||
 count($copy['combat'])!==4 || count($copy['spell_notes'])!==3 ||
 ($wish['identificador']??null)!=='tome_of_clear_thought' || ($wish['estado_aquisicao']??null)!=='NAO_CONFIRMADO' ||
 ($wish_additional['identificador']??null)!=='robe_of_the_archmagi' || ($wish_additional['estado_aquisicao']??null)!=='NAO_CONFIRMADO' ||
 $wish['aplicar_bonus_no_personagem_automaticamente']!==false || $wish_additional['aplicar_bonus_no_personagem_automaticamente']!==false ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02E','DOOM-ART-05-V2']){
 throw new RuntimeException('Nível 18: dados e propostas divergentes; renderização bloqueada.');
}
$n=18; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-17-20.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if ($dc!==19 || $attack!==11 || $d['protecao_arcana_maxima']!==2*$d['mago']+$mod)throw new RuntimeException('N18: derivação divergente');
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-18 doom-level-18 doom-level-proposal" data-fmb-block="18">
<div class="preview"><section class="level" id="doom-nivel-18" data-fmb-level="18" data-fmb-phase="V · O Poder do Soberano" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(18) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n18-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível 18">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div><div class="level-no" aria-label="Nível 18">18</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02e-mascara-v-aprovada.webp'); ?>" alt="Máscara de Victor na quinta fase, arte pictórica" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos do nível</span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat); ?></small><strong><?php echo esc_html($val); ?></strong><span><?php echo esc_html($doom_mod($val)); ?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · valores sem itens novos</span><div class="fm-row"><small>PV do personagem</small><strong>132</strong></div><div class="fm-row"><small>Proteção Arcana (máximo)</small><strong>35 PV</strong></div><div class="fm-row"><small>CA</small><strong>Depende do equipamento obtido</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n18-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($q); ?></strong></div><?php endforeach; ?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n18-wishlist" role="note" aria-label="Wishlist pendente do nível 18"><span class="wish-title">Wishlist · prioridade pendente</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p>Objetivo de campanha, sem aumento de atributo na ficha.</p></div><small class="doom-n18-wish-extra">Objetivo adicional: <?php echo $doom_fmt($wish_additional); ?> — ainda não adquirido.</small></div>
   <div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n18-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n18-title" class="doom-n18-title"><?php echo esc_html($copy['title']); ?></h2>
   <p class="lead doom-n18-lead"><?php echo esc_html($copy['intro']); ?></p>
   <div class="doom-n18-strip" aria-label="Indicadores do nível 18">
    <span><strong>132 PV</strong> Artífice 3 / Mago 15</span>
    <span><strong>INT 20 (+5)</strong> · SAB 11 (+0)</span>
    <span><strong>PB +6</strong> · CD <?php echo esc_html($dc); ?> / ataque +<?php echo esc_html($attack); ?></span>
    <span><strong>35 PV</strong> máximo da barreira</span>
    <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
    <span><strong>42</strong> grimório · <strong>19</strong> preparadas</span>
   </div>
   <figure class="doom-n18-banner"><img src="<?php echo esc_url($doom_art.'doom-art-05-banner-nivel-18-panorama-v2-aprovada.webp'); ?>" alt="Victor em cenário panorâmico de fantasia sombria, banner -V2" loading="lazy"></figure>
   <section class="doom-n18-feature" aria-labelledby="doom-n18-feature-title"><div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div><h3 id="doom-n18-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3><p><?php echo esc_html($copy['feature_detail']); ?></p><div class="doom-n18-feature-grid"><div class="doom-n18-ward-value"><span>Proteção Arcana</span><strong>35</strong><small>PV da barreira · máximo</small></div><p><?php echo esc_html($copy['ward_detail']); ?></p></div></section>
   <section class="doom-n18-feature" aria-labelledby="doom-n18-spells-title"><div class="mini-label">Magias de 8º círculo · escolhas em discussão</div><h3 id="doom-n18-spells-title">Três inscrições de 8º círculo</h3>
    <div class="doom-n18-spell-grid"><?php foreach($spells as $spell): ?><?php $note='';foreach($copy['spell_notes'] as $entry)if($entry['pt']===$spell['pt'])$note=$entry['note']; ?><article class="doom-n18-spell"><small><?php echo esc_html($spell['origem_aprendizado']==='especialista_abjuracao_bonus'?'ABJURAÇÃO · INSCRIÇÃO BÔNUS':'MAGO · INSCRIÇÃO'); ?></small><strong><?php echo $doom_fmt($spell); ?></strong><span><?php echo esc_html($note); ?></span></article><?php endforeach; ?></div>
    <p class="doom-n18-note"><?php echo esc_html($copy['prep_note']); ?></p>
    <div class="doom-n18-prepared"><strong>Preparação regular de Mago · 19</strong><ul><?php foreach($prepared as $spell): ?><li><?php echo esc_html($spell); ?><?php if (strpos($spell,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($spell,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach; ?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
    <p class="doom-n18-note"><strong>Regra de multiclasse:</strong> <?php echo esc_html($copy['slot_note']); ?></p>
   </section>
   <section class="doom-n18-combat" aria-labelledby="doom-n18-combat-title"><div class="mini-label">Na mesa · estratégia provisória</div><h3 id="doom-n18-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n18-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n18-footer"><span>Fim do nível total 18 · O Soberano Além da Morte</span></footer>
</section></div></div>
