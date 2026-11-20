<?php
/** Nível total 8 — Artífice 3 / Mago 5, dados aprovados v1.2. Prévia sem publicação. */
$row8=FMB_Doom_Data::get_approved_level(8);
$copy8=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel08.json'),true,512,JSON_THROW_ON_ERROR);
if (!$row8 || $row8['nivel_total']!==8 || $row8['status_aprovacao']!=='APROVADO_MECANICAMENTE' || $row8['publicacao_autorizada']!==false ||
 ($copy8['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy8['build_id']??'')!=='doutor-destino' || ($copy8['nivel_total']??0)!==8 || $copy8['publicacao_autorizada']!==false || count($copy8['combat']??[])!==4) throw new RuntimeException('Nível 8 bloqueado por contrato.');
$d8=$row8['mecanica'];$slots8=$d8['espacos_magia_por_circulo'];$books8=$d8['magias_grimorio_adicionadas'];$prep8=$d8['preparacao_padrao_mago'];
if ($d8['artifice']!==3 || $d8['mago']!==5 || $d8['pv_fixos']!==62 || $d8['bonus_proficiencia']!==3 || $d8['atributos']['INT']!==18 ||
  $d8['protecao_arcana_maxima']!==14 || $slots8!==[4,3,3,1] || $d8['total_magias_grimorio']!==17 || count($books8)!==3 ||
  array_column($books8,'pt')!==['Contramágica','Voo','Bola de Fogo'] || count($prep8)!==9 || $d8['magias_mago_preparadas_regulares']!==9 ||
  $d8['caracteristicas_e_talentos'][0]!=='Memorizar Magia (Memorize Spell)' || $d8['classe_armadura']['ca_referencia']!==18 ||
  $d8['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']!==3 || $d8['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']!==4 ||
  $d8['arte_editorial']['identificadores']!==['DOOM-ART-02B'] || $d8['wishlist_novas_prioridades']!==[]) throw new RuntimeException('Nível 8 divergente do consolidado v1.2.');
$prior8=FMB_Doom_Data::get_approved_level(5)['mecanica']['wishlist_novas_prioridades'][0];
if ($prior8['pt']!=='Armadura Segmentada' || $prior8['estado_aquisicao']!=='NAO_CONFIRMADO' || $prior8['aplicar_bonus_no_personagem_automaticamente']!==false) throw new RuntimeException('Wishlist N8 inválida.');
$mod8=(int)floor(($d8['atributos']['INT']-10)/2);$dc8=8+$d8['bonus_proficiencia']+$mod8;$atk8=$d8['bonus_proficiencia']+$mod8;
?>
<div class="fmb-block fmb-block-8 doom-level-eight" data-fmb-block="8">
 <div class="preview"><section class="level" id="doom-nivel-8" data-fmb-level="8" data-fmb-phase="II · O Conhecimento Arcano" aria-labelledby="doom-n8-title">
  <aside class="progress-side">
   <div class="phase"><?php echo esc_html($copy8['phase']); ?></div><div class="level-no" aria-label="Nível 8">8</div><div class="timeline" aria-hidden="true"></div>
   <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02b-mascara-ii-aprovada.webp'); ?>" alt="Máscara da fase II" width="1024" height="1536" loading="lazy"></div>
   <div class="fm-side-sheet">
    <div class="fm-side-section"><span class="fm-side-label">Atributos · Mago 5</span><div class="fm-stats-grid"><?php foreach($d8['atributos'] as $stat=>$val): ?><div class="fm-stat"><small><?php echo esc_html($stat); ?></small><strong><?php echo esc_html($val); ?></strong><span><?php echo esc_html($doom_mod($val)); ?></span></div><?php endforeach; ?></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa e barreira</span><div class="fm-row"><small>CA sem réplica ativa</small><strong>17</strong></div><div class="fm-row"><small>CA com Escudo +1 replicado</small><strong><?php echo esc_html($d8['classe_armadura']['ca_referencia']); ?></strong></div><div class="fm-row"><small>Proteção Arcana · máxima</small><strong><?php echo esc_html($d8['protecao_arcana_maxima']); ?> PV</strong></div></div>
    <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n8-resource"><?php foreach($slots8 as $i=>$q): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($q); ?></strong></div><?php endforeach; ?></div></div>
   </div>
   <div class="wish-section doom-wish-section doom-n8-wishlist" role="note"><span class="wish-title">Wishlist · próxima prioridade</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($prior8); ?></strong><span class="wish-tag">NÃO ADQUIRIDA</span></div><p><?php echo esc_html($copy8['wishlist_note']); ?></p></div></div><div class="fm-timeline-resume" aria-hidden="true"></div>
  </aside>
  <div class="content doom-n8-content">
   <div class="kicker"><?php echo esc_html($copy8['kicker']); ?> · PHB 2024 / Eberron 2025</div><h2 id="doom-n8-title" class="doom-n8-title"><?php echo esc_html($copy8['title']); ?></h2><p class="lead doom-n8-lead"><?php echo esc_html($copy8['intro']); ?></p>
   <div class="doom-n8-strip" aria-label="Indicadores do nível 8"><span><strong><?php echo esc_html($d8['pv_fixos']); ?> PV</strong></span><span><strong>INT <?php echo esc_html($d8['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod8); ?>)</span><span><strong><?php echo esc_html($d8['protecao_arcana_maxima']); ?> PV</strong> Proteção Arcana</span><span><strong>4×1º · 3×2º · 3×3º · 1×4º</strong> espaços</span><span><strong>CD <?php echo esc_html($dc8); ?></strong> · ataque +<?php echo esc_html($atk8); ?></span><span><strong><?php echo esc_html($d8['total_magias_grimorio']); ?></strong> no grimório · <?php echo esc_html(count($prep8)); ?> preparadas</span></div>
   <section class="doom-n8-feature" aria-labelledby="doom-n8-feature-title"><div class="mini-label">Novo recurso · Mago (Wizard) 5</div><h3 id="doom-n8-feature-title"><?php echo esc_html($copy8['feature_title']); ?></h3><p><?php echo esc_html($copy8['feature_detail']); ?></p><p class="doom-n8-note"><strong>Proteção Arcana:</strong> <?php echo esc_html($copy8['ward_detail']); ?></p></section>
   <section class="doom-n8-feature" aria-labelledby="doom-n8-spells-title"><div class="mini-label">Primeiras magias de Mago de 3º círculo</div><h3 id="doom-n8-spells-title">Três novas inscrições no grimório</h3><p><?php echo esc_html($copy8['spell_intro']); ?></p>
    <div class="doom-n8-spell-grid"><?php foreach($books8 as $spell): ?><?php $desc8='';foreach($copy8['spell_notes'] as $x) if($x['pt']===$spell['pt']) $desc8=$x['note']; ?><article class="doom-n8-spell"><small><?php echo esc_html($spell['origem_aprendizado']==='especialista_abjuracao_bonus'?'BÔNUS DO ABJURADOR':'PROGRESSÃO NORMAL'); ?></small><strong><?php echo $doom_fmt($spell); ?></strong><span><?php echo esc_html($desc8); ?></span></article><?php endforeach; ?></div>
    <div class="doom-n8-prepared"><strong>Preparação padrão de Mago · <?php echo esc_html(count($prep8)); ?></strong><ul><?php foreach($prep8 as $sp): ?><li><?php echo esc_html($sp); ?></li><?php endforeach; ?></ul></div><p class="doom-n8-note"><?php echo esc_html($copy8['prep_note']); ?></p>
   </section>
   <section class="doom-n8-combat" aria-labelledby="doom-n8-combat-title"><div class="mini-label">Na mesa · um único campo de combate</div><h3 id="doom-n8-combat-title"><?php echo esc_html($copy8['combat_title']); ?></h3><p><?php echo esc_html($copy8['combat_intro']); ?></p><ol><?php foreach($copy8['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n8-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy8['priority']); ?></div>
       <?php $doom_tactical = $copy8['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
  </div>
  <footer class="doom-n8-footer"><span>Fim do nível total 8 · A Magia Obedece ao Intelecto</span></footer>
 </section></div>
</div>
