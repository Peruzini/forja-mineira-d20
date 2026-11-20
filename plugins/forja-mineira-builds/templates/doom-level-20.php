<?php
/** Forja Mineira — Doutor Destino Nível 20. Proposta NÃO homologada; review mode only. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH . 'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(20);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel20.json'),true,512,JSON_THROW_ON_ERROR);
$wish=FMB_Doom_Proposal::get_for_preview(17)['wishlist_novas_prioridades'][0]??null;
$spells=$d['magias_grimorio_adicionadas'];$prepared=$d['preparacao_padrao_mago'];
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==20 || ($copy['publicacao_autorizada']??true)!==false || count($copy['combat']??[])!==4 || count($copy['spell_notes']??[])!==3 ||
 ($d['nivel_total']??null)!==20 || ($d['artifice']??null)!==3 || ($d['mago']??null)!==17 || ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 $d['pv_fixos']!==146 || $d['bonus_proficiencia']!==6 || $d['atributos']['INT']!==21 || $d['protecao_arcana_maxima']!==39 ||
 $d['magias_mago_preparadas_regulares']!==22 || count($prepared)!==22 || count(array_unique($prepared))!==22 || $d['total_magias_grimorio']!==47 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,3,2,1,1,1] || array_column($spells,'pt')!==['Desejo','Parar o Tempo','Muralha Prismática'] ||
 ($spells[2]['origem_aprendizado']??'')!=='abjuration_savant_inscricao_extra' || !empty($d['wishlist_novas_prioridades']) ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02E'] || ($wish['identificador']??'')!=='tome_of_clear_thought' ||
 ($wish['estado_aquisicao']??'')!=='NAO_CONFIRMADO' || ($wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false) {
 throw new RuntimeException('Nível 20 bloqueado: proposta incompleta ou adulterada.');
}
$n=20; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-17-20.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if ($dc!==19 || $attack!==11 || $d['protecao_arcana_maxima']!==2*$d['mago']+$mod) throw new RuntimeException('N20: cálculos derivados divergentes.');
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-20 doom-level-20 doom-level-proposal" data-fmb-block="20">
 <div class="preview"><section class="level" id="doom-nivel-20" data-fmb-level="20" data-fmb-phase="V · O Poder do Soberano" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(20) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n20-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível 20">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div><div class="level-no" aria-label="Nível 20">20</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02e-mascara-v-aprovada.webp'); ?>" alt="Máscara de Victor na quinta fase, arte pictórica" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos · Dádiva de INT do nível 19</span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat); ?></small><strong><?php echo esc_html($val); ?></strong><span><?php echo esc_html($doom_mod($val)); ?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · configuração condicionada</span><div class="fm-row"><small>CA com escudo comum</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($ca_ref); ?></strong></div><div class="fm-row"><small>Proteção Arcana (máximo)</small><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n20-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($q); ?></strong></div><?php endforeach; ?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n20-wishlist" role="note" aria-label="Wishlist pendente no nível 20"><span class="wish-title">Wishlist · prioridade pendente</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']); ?></p></div></div>
   <div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n20-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n20-title" class="doom-n20-title"><?php echo esc_html($copy['title']); ?></h2>
   <p class="lead doom-n20-lead"><?php echo esc_html($copy['intro']); ?></p>
   <div class="doom-n20-strip" aria-label="Indicadores do nível 20 proposto">
    <span><strong><?php echo esc_html($d['pv_fixos']); ?> PV</strong> Artífice 3 / Mago 17</span>
    <span><strong>INT <?php echo esc_html($d['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod); ?>)</span>
    <span><strong>CD <?php echo esc_html($dc); ?></strong> · ataque +<?php echo esc_html($attack); ?></span>
    <span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
    <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
    <span><strong>47</strong> grimório · <strong>22/22</strong> preparadas</span>
   </div>
   <section class="doom-n20-feature" aria-labelledby="doom-n20-feature-title">
    <div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div>
    <h3 id="doom-n20-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3>
    <div class="doom-n20-hero-note"><strong>9º círculo de Mago — o ápice</strong><p><?php echo esc_html($copy['feature_detail']); ?></p></div>
    <div class="doom-n20-feature-grid"><div class="doom-n20-ward-value"><span>Proteção Arcana</span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?></strong><small>PV da barreira · não são PV de Victor</small></div><p><?php echo esc_html($copy['ward_detail']); ?></p></div>
   </section>
   <section class="doom-n20-feature" aria-labelledby="doom-n20-spells-title">
    <div class="mini-label">Magias de 9º círculo</div><h3 id="doom-n20-spells-title">Duas inscrições regulares + uma de Abjuração</h3>
    <div class="doom-n20-spell-grid"><?php foreach($spells as $s): ?>
      <?php $note='';$role='';foreach($copy['spell_notes'] as $c)if($c['pt']===$s['pt']){$note=$c['note'];$role=$c['label'];} ?>
      <article class="doom-n20-spell"><small><?php echo esc_html($role); ?></small><strong><?php echo $doom_fmt($s); ?></strong><span><?php echo esc_html($note); ?></span></article>
    <?php endforeach; ?></div>
    <p class="doom-n20-note"><strong>Preparação:</strong> <?php echo esc_html($copy['prep_note']); ?></p>
    <div class="doom-n20-prepared"><strong>Preparação regular de Mago · 22/22 preparadas</strong><ul><?php foreach($prepared as $s): ?><li><?php echo esc_html($s); ?><?php if (strpos($s,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($s,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach; ?><?php for ($i=0;$i<$doom_prep_pending;$i++): ?><li class="doom-pending-preparation"><strong>Vaga pendente de escolha</strong> · não é magia preparada</li><?php endfor; ?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
    <p class="doom-n20-note"><strong>Espaços e limites:</strong> <?php echo esc_html($copy['slot_note']); ?></p>
   </section>
   <section class="doom-n20-combat" aria-labelledby="doom-n20-combat-title"><div class="mini-label">Na mesa · estratégia provisória</div><h3 id="doom-n20-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n20-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n20-footer"><span>Fim do nível total 20 · O Soberano do Impossível</span></footer>
 </section></div>
</div>
