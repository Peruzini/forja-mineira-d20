<?php
/** Nível total 6: Artífice 3 / Mago 3 — Abjurador 2024. Prévia isolada. */
$doom_level6=FMB_Doom_Data::get_approved_level(6);
$doom_copy6=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel06.json'),true,512,JSON_THROW_ON_ERROR);
if (!$doom_level6 || ($doom_level6['nivel_total']??null)!==6 ||
    ($doom_level6['status_aprovacao']??'')!=='APROVADO_MECANICAMENTE' ||
    ($doom_level6['publicacao_autorizada']??true)!==false ||
    ($doom_copy6['schema']??'')!=='forja-doom-level-editorial/1.0' ||
    ($doom_copy6['build_id']??'')!=='doutor-destino' || ($doom_copy6['nivel_total']??null)!==6 ||
    ($doom_copy6['publicacao_autorizada']??true)!==false ||
    count($doom_copy6['combat']??[])!==4) {
    throw new RuntimeException('Nível 6 sem contrato mecânico/editorial para prévia.');
}
$doom6=$doom_level6['mecanica'];$doom6_slots=$doom6['espacos_magia_por_circulo'];
$doom6_book=$doom6['magias_grimorio_adicionadas'];$doom6_prep=$doom6['preparacao_padrao_mago'];
if ($doom6['artifice']!==3 || $doom6['mago']!==3 || $doom6['pv_fixos']!==48 ||
    $doom6['bonus_proficiencia']!==3 || $doom6['atributos']['INT']!==17 ||
    ($doom6['protecao_arcana_maxima']??null)!==9 || $doom6_slots!==[4,3,2] ||
    ($doom6['total_magias_grimorio']??null)!==12 ||
    ($doom6['magias_mago_preparadas_regulares']??null)!==6 ||
    count($doom6_book)!==4 || count($doom6_prep)!==6 ||
    count($doom6['wishlist_novas_prioridades']??[])!==0 ||
    ($doom6['classe_armadura']['ca_referencia']??null)!==18 ||
    ($doom6['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']??null)!==2 ||
    ($doom6['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']??null)!==3 ||
    ($doom6['arte_editorial']['identificadores'][0]??null)!=='DOOM-ART-02B') {
    throw new RuntimeException('Nível 6 não corresponde ao consolidado aprovado v1.2.');
}
$doom6_intmod=(int)floor(($doom6['atributos']['INT']-10)/2);
$doom6_dc=8+$doom6['bonus_proficiencia']+$doom6_intmod;
$doom6_atk=$doom6['bonus_proficiencia']+$doom6_intmod;
$doom6_wishlist_source=FMB_Doom_Data::get_approved_level(5)['mecanica']['wishlist_novas_prioridades'];
if (count($doom6_wishlist_source)!==2 || $doom6_wishlist_source[0]['pt']!=='Armadura Segmentada' ||
    $doom6_wishlist_source[1]['pt']!=='Manto de Proteção') throw new RuntimeException('Wishlist de continuidade inconsistente.');
foreach ($doom6_wishlist_source as $w) if (($w['estado_aquisicao']??'')!=='NAO_CONFIRMADO' ||
    ($w['aplicar_bonus_no_personagem_automaticamente']??true)!==false) throw new RuntimeException('Wishlist não é inventário.');
?>
<div class="fmb-block fmb-block-6 doom-level-six" data-fmb-block="6">
 <div class="preview"><section class="level" id="doom-nivel-6" data-fmb-level="6" data-fmb-phase="II · O Conhecimento Arcano" aria-labelledby="doom-n6-title">
   <aside class="progress-side">
     <div class="phase"><?php echo esc_html($doom_copy6['phase']); ?></div>
     <div class="level-no" aria-label="Nível total 6">6</div><div class="timeline" aria-hidden="true"></div>
     <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02b-mascara-ii-aprovada.webp'); ?>" alt="Máscara da segunda fase de Victor" width="1024" height="1536" loading="lazy"></div>
     <div class="fm-side-sheet">
       <div class="fm-side-section"><span class="fm-side-label">Atributos · sem mudança</span><div class="fm-stats-grid">
         <?php foreach($doom6['atributos'] as $abbr=>$value): ?><div class="fm-stat"><small><?php echo esc_html($abbr); ?></small><strong><?php echo esc_html($value); ?></strong><span><?php echo esc_html($doom_mod($value)); ?></span></div><?php endforeach; ?>
       </div></div>
       <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · situações distintas</span>
         <div class="fm-row"><small>CA de base (equipamento inicial)</small><strong>17</strong></div>
         <div class="fm-row"><small>Com Escudo +1 replicado/ativo</small><strong><?php echo esc_html($doom6['classe_armadura']['ca_referencia']); ?></strong></div>
         <div class="fm-row"><small>Proteção Arcana · máx. de PV</small><strong><?php echo esc_html($doom6['protecao_arcana_maxima']); ?></strong></div>
       </div>
       <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n6-resource">
          <?php foreach($doom6_slots as $i=>$n): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($n); ?></strong></div><?php endforeach; ?>
       </div></div>
     </div>
     <div class="wish-section doom-wish-section doom-n6-wishlist" role="note" aria-label="Melhor opção de armadura não mágica a partir do nível 6">
       <span class="wish-title">Melhor armadura · a partir do nível 6</span><div class="doom-wish-item"><div class="wish-head"><strong>Armadura de Placas (Plate Armor)</strong></div>
         <p>Melhor opção não mágica para o slot: CA base 18 quando equipada. Recomendada a partir deste nível, conforme recursos e disponibilidade na campanha. Não pressupõe fusão com outra armadura mágica, aquisição automática nem altera a CA atual da ficha. Armadura Segmentada (Splint Armor) continua alternativa econômica.</p></div>
     </div>
     <div class="fm-timeline-resume" aria-hidden="true"></div>
   </aside>
   <div class="content doom-n6-content">
     <div class="kicker"><?php echo esc_html($doom_copy6['kicker']); ?> · PHB 2024 / Eberron 2025</div>
     <h2 id="doom-n6-title" class="doom-n6-title"><?php echo esc_html($doom_copy6['title']); ?></h2>
     <p class="lead doom-n6-lead"><?php echo esc_html($doom_copy6['intro']); ?></p>
     <div class="doom-n6-strip" aria-label="Indicadores do nível 6">
       <span><strong><?php echo esc_html($doom6['pv_fixos']); ?> PV</strong></span>
       <span><strong>CA 18*</strong> com réplica ativa</span>
       <span><strong><?php echo esc_html($doom6['protecao_arcana_maxima']); ?> PV</strong> barreira máx.</span>
       <span><strong>4×1º · 3×2º · 2×3º</strong> espaços</span>
       <span><strong>CD <?php echo esc_html($doom6_dc); ?></strong> · Ataque +<?php echo esc_html($doom6_atk); ?></span>
     </div>
     <section class="doom-n6-feature" aria-labelledby="doom-n6-ward">
       <div class="mini-label">Subclasse · Abjurador (Abjurer) · Mago 3</div>
       <h3 id="doom-n6-ward"><?php echo esc_html($doom_copy6['ward_title']); ?></h3>
       <div class="doom-n6-feature-grid"><div class="doom-n6-ward-value"><strong><?php echo esc_html($doom6['protecao_arcana_maxima']); ?></strong><span>PV máximos da barreira</span><small>2 × Mago 3 + INT +3</small></div><div><p><?php echo esc_html($doom_copy6['ward_detail']); ?></p><p><?php echo esc_html($doom_copy6['ward_trigger']); ?></p></div></div>
       <p class="doom-n6-rule"><strong>Regra de ativação:</strong> <?php echo esc_html($doom_copy6['ward_warning']); ?></p>
     </section>
     <section class="doom-n6-feature" aria-labelledby="doom-n6-book">
       <div class="mini-label">Grimório · Especialista em Abjuração (Abjuration Savant)</div>
       <h3 id="doom-n6-book">Doze magias inscritas · seis preparadas</h3>
       <p><?php echo esc_html($doom_copy6['savant_note']); ?></p>
       <div class="doom-n6-spell-grid">
         <?php foreach($doom6_book as $book): ?>
         <article class="doom-n6-spell"><small><?php echo ($book['origem_aprendizado']==='especialista_abjuracao_bonus')?'EXTRA · ABJURAÇÃO':'ESCOLHA NORMAL · MAGO'; ?></small><strong><?php echo $doom_fmt($book); ?></strong><span><?php echo in_array($book['pt'],['Teia','Passo Nebuloso','Vigor Arcano'],true)?'Preparação padrão':'Inscrita no grimório · não preparada'; ?></span></article>
         <?php endforeach; ?>
       </div>
       <div class="doom-n6-prepared"><strong>Preparação padrão de Mago · <?php echo count($doom6_prep); ?></strong><ul><?php foreach($doom6_prep as $spell): ?><li><?php echo esc_html($spell); ?></li><?php endforeach; ?></ul></div>
       <p class="doom-n6-note"><strong>Multiclasse:</strong> <?php echo esc_html($doom_copy6['magic_note']); ?> Magias de Artífice, Armeiro e Origem continuam separadas.</p>
     </section>
     <section class="doom-n6-combat" aria-labelledby="doom-n6-combat-title">
       <div class="mini-label">Na mesa · um único campo de combate</div>
       <h3 id="doom-n6-combat-title"><?php echo esc_html($doom_copy6['combat_title']); ?></h3><p><?php echo esc_html($doom_copy6['combat_intro']); ?></p>
       <ol><?php foreach($doom_copy6['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol>
       <div class="doom-n6-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy6['priority']); ?></div>
       <?php $doom_tactical = $doom_copy6['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
     </section>
   </div>
   <footer class="doom-n6-footer"><span>Fim do nível total 6 · A Abjuração toma forma</span></footer>
 </section></div>
</div>
