<?php
/** Componente regular compartilhado apenas pelos niveis 10 e 11. Preview sem publicacao. */
if (!defined('ABSPATH')) { exit; }
$n=(int)($doom_current_level??0);
if (!in_array($n,[10,11],true)) throw new RuntimeException('Nível fora do contrato.');
$is_proposal=$n===11;
if ($is_proposal) {
    require_once FMB_PATH.'includes/class-doom-proposal.php';
    $d=FMB_Doom_Proposal::get_for_preview(11);
} else {
    $row=FMB_Doom_Data::get_approved_level(10);
    if (!$row || ($row['status_aprovacao']??'')!=='APROVADO_MECANICAMENTE' || ($row['publicacao_autorizada']??true)!==false) throw new RuntimeException('N10 não aprovado no contrato.');
    $d=$row['mecanica'];
}
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel'.str_pad((string)$n,2,'0',STR_PAD_LEFT).'.json'),true,512,JSON_THROW_ON_ERROR);
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==$n || ($copy['publicacao_autorizada']??true)!==false || count($copy['combat']??[])!==4 ||
 ($d['nivel_total']??null)!==$n || ($d['artifice']??null)!==3 || ($d['mago']??null)!==$n-3 ||
 ($d['pv_fixos']??null)!==($is_proposal?83:76) || ($d['bonus_proficiencia']??null)!==4 ||
 ($d['atributos']['INT']??null)!==($is_proposal?20:18) ||
 ($d['protecao_arcana_maxima']??null)!==($is_proposal?21:18) ||
 ($d['espacos_magia_por_circulo']??null)!==($is_proposal?[4,3,3,3,2]:[4,3,3,3,1]) ||
 ($d['total_magias_grimorio']??null)!==($is_proposal?24:22) ||
 count($d['preparacao_padrao_mago']??[])!==($is_proposal?12:11) ||
 (!$is_proposal && ($d['classe_armadura']['ca_referencia']??null)!==18) ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-02C'] ||
 ($d['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']??null)!==4 ||
 ($d['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']??null)!==5) {
 throw new RuntimeException('Contrato mecânico ou editorial N'.$n.' divergente.');
}
$books=$d['magias_grimorio_adicionadas'];
if (array_column($books,'pt')!==($is_proposal?['Fabricar','Esfera Resiliente de Otiluke']:['Lança Psíquica de Raulothim','Porta Dimensional','Banimento'])) throw new RuntimeException('Grimório divergente N'.$n);
// Aplicar overlay editorial após contratos de inscrições consolidados DOOM-FINAL-01; sem gravar na base.
include FMB_PATH . 'templates/doom-combat-mechanics-overlay.php';
$books=$d['magias_grimorio_adicionadas'];
$wish=$d['wishlist_novas_prioridades'];
if (count($wish)!==1 || ($wish[0]['pt']??'')!==($is_proposal?'Anel de Armazenamento de Magias':'Armadura de Placas') ||
 ($wish[0]['estado_aquisicao']??'')!=='NAO_CONFIRMADO' || ($wish[0]['aplicar_bonus_no_personagem_automaticamente']??true)!==false) throw new RuntimeException('Wishlist foi adulterada.');
$intmod=(int)floor(($d['atributos']['INT']-10)/2);$dc=8+$d['bonus_proficiencia']+$intmod;$attack=$d['bonus_proficiencia']+$intmod;
if (($is_proposal && ($dc!==17 || $attack!==9)) || (!$is_proposal && ($dc!==16 || $attack!==8))) throw new RuntimeException('CD divergente.');
// O rascunho v1.2 do N11 não registra CA: apenas repetimos a CA condicional aprovada do N10.
$ca_reference=$is_proposal?(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia']:(int)$d['classe_armadura']['ca_referencia'];
$cls='doom-n'.$n;
$slottext=implode(' · ',array_map(static function($i,$count){ return $count.'×'.($i+1).'º'; },array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-<?php echo $n;?> doom-level-<?php echo $n;?><?php echo $is_proposal?' doom-level-proposal':'';?>" data-fmb-block="<?php echo $n;?>">
 <div class="preview"><section class="level" id="doom-nivel-<?php echo $n;?>" data-fmb-level="<?php echo $n;?>" data-fmb-phase="III · A Primeira Máscara" data-fmb-approval="<?php echo ($is_proposal && !FMB_Doom_Release::is_public_level(11))?'PROPOSTA_NAO_APROVADA':'APROVADO_MECANICAMENTE';?>" aria-labelledby="doom-n<?php echo $n;?>-title">
  <aside class="progress-side" aria-label="Ficha resumida e Wishlist do nível <?php echo $n;?>">
   <div class="phase"><?php echo esc_html($copy['phase']); ?></div><div class="level-no" aria-label="Nível <?php echo $n;?>"><?php echo $n;?></div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02c-mascara-iii-aprovada.webp'); ?>" alt="Máscara da terceira fase de Doutor Destino" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos · <?php echo $is_proposal?'Mago 8':'Mago 7'; ?></span><div class="fm-stats-grid"><?php foreach($d['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat);?></small><strong><?php echo esc_html($val);?></strong><span><?php echo esc_html($doom_mod($val));?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa e barreira<?php echo ($is_proposal && !FMB_Doom_Release::is_public_level(11))?' · proposta':'';?></span><div class="fm-row"><small>CA sem réplica ativa</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($ca_reference);?></strong></div><div class="fm-row"><small>Proteção Arcana · máxima</small><strong><?php echo esc_html($d['protecao_arcana_maxima']);?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini <?php echo $cls;?>-resource"><?php foreach($d['espacos_magia_por_circulo'] as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo');?></small><strong><?php echo esc_html($q);?></strong></div><?php endforeach;?></div></div>
   </div>
   <div class="wish-section doom-wish-section <?php echo $cls;?>-wishlist" role="note" aria-label="<?php echo $is_proposal?'Wishlist de nível 11':'Recomendação de armadura não mágica';?>"><span class="wish-title"><?php echo $is_proposal?'Wishlist · próxima prioridade':'Melhor armadura · desde o nível 6';?></span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish[0]);?></strong><?php if($is_proposal): ?><span class="wish-tag">NÃO ADQUIRIDA</span><?php endif;?></div><p><?php echo esc_html($copy['wishlist_note']);?></p></div></div><div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content <?php echo $cls;?>-content">
   <div class="kicker"><?php echo esc_html($copy['kicker']);?> · PHB 2024 / Eberron 2025</div>
   <h2 id="doom-n<?php echo $n;?>-title" class="<?php echo $cls;?>-title"><?php echo esc_html($copy['title']);?></h2>
   
   <p class="lead <?php echo $cls;?>-lead"><?php echo esc_html($copy['intro']);?></p>
   <div class="<?php echo $cls;?>-strip" aria-label="Indicadores nível <?php echo $n;?>"><span><strong><?php echo esc_html($d['pv_fixos']);?> PV</strong></span><span><strong>INT <?php echo esc_html($d['atributos']['INT']);?></strong> (<?php echo esc_html($doom_mod($d['atributos']['INT']));?>)</span><span><strong><?php echo esc_html($d['protecao_arcana_maxima']);?> PV</strong> Proteção Arcana</span><span><strong><?php echo esc_html($slottext);?></strong> espaços</span><span><strong>CD <?php echo esc_html($dc);?></strong> · ataque +<?php echo esc_html($attack);?></span><span><strong><?php echo esc_html($d['total_magias_grimorio']);?></strong> no grimório · <?php echo esc_html(count($d['preparacao_padrao_mago']));?> preparadas</span></div>
   <section class="<?php echo $cls;?>-feature" aria-labelledby="doom-n<?php echo $n;?>-feature-title"><div class="mini-label"><?php echo esc_html($copy['feature_label']);?></div><h3 id="doom-n<?php echo $n;?>-feature-title"><?php echo esc_html($copy['feature_title']);?></h3><p><?php echo esc_html($copy['feature_detail']);?></p><p class="<?php echo $cls;?>-note"><strong>Proteção Arcana:</strong> <?php echo esc_html($copy['ward_detail']);?></p></section>
   <section class="<?php echo $cls;?>-feature" aria-labelledby="doom-n<?php echo $n;?>-spells-title"><div class="mini-label">Grimório · novas inscrições</div><h3 id="doom-n<?php echo $n;?>-spells-title"><?php echo esc_html(count($books));?> novas inscrições · Mago <?php echo esc_html($d['mago']);?></h3><p><?php echo esc_html($copy['spell_intro']);?></p>
    <div class="<?php echo $cls;?>-spell-grid"><?php foreach($books as $spell): ?><?php $note='';foreach($copy['spell_notes'] as $sc) if ($sc['pt']===$spell['pt']) $note=$sc['note']; ?><article class="<?php echo $cls;?>-spell"><small><?php echo esc_html(($spell['origem_aprendizado']??'')==='especialista_abjuracao_bonus'?'BÔNUS DO ABJURADOR':'GRIMÓRIO'); ?></small><strong><?php echo $doom_fmt($spell);?></strong><?php if (!empty($spell['legado'])): ?><span class="doom-legacy-label">LEGACY · Fizban (2021) · requer Mestre</span><?php endif; ?><span><?php echo esc_html($note);?></span></article><?php endforeach;?></div>
    <div class="<?php echo $cls;?>-prepared"><strong>Preparação regular de Mago · <?php echo count($d['preparacao_padrao_mago']);?></strong><ul><?php foreach($d['preparacao_padrao_mago'] as $prepared):?><li><?php echo esc_html($prepared);?><?php if (strpos($prepared,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?></li><?php endforeach;?></ul></div><p class="<?php echo $cls;?>-note"><?php echo esc_html($copy['prep_note']);?> Espaços de 5º círculo pela multiclasse não permitem aprender magias de Mago de 5º círculo neste nível.</p>
   </section>
   <section class="<?php echo $cls;?>-combat" aria-labelledby="doom-n<?php echo $n;?>-combat-title"><div class="mini-label">Na mesa · passos de combate</div><h3 id="doom-n<?php echo $n;?>-combat-title"><?php echo esc_html($copy['combat_title']);?></h3><p><?php echo esc_html($copy['combat_intro']);?></p><ol><?php foreach($copy['combat'] as $step):?><li><strong><?php echo esc_html($step['label']);?>:</strong> <?php echo esc_html($step['text']);?></li><?php endforeach;?></ol><div class="<?php echo $cls;?>-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']);?></div><?php $doom_tactical = $copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="<?php echo $cls;?>-footer"><span>Fim do nível total <?php echo $n;?> · <?php echo esc_html($copy['title']);?></span></footer>
 </section></div>
</div>
