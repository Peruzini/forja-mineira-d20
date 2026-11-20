<?php
/** Nível total 7 — Artífice 3 / Mago 4. Só preview isolado, sem publicação. */
$doom_level7=FMB_Doom_Data::get_approved_level(7);
$doom_copy7=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel07.json'),true,512,JSON_THROW_ON_ERROR);
if (!$doom_level7 || ($doom_level7['nivel_total']??null)!==7 ||
  ($doom_level7['status_aprovacao']??'')!=='APROVADO_MECANICAMENTE' ||
  ($doom_level7['publicacao_autorizada']??true)!==false ||
  ($doom_copy7['schema']??'')!=='forja-doom-level-editorial/1.0' ||
  ($doom_copy7['build_id']??'')!=='doutor-destino' || ($doom_copy7['nivel_total']??null)!==7 ||
  ($doom_copy7['publicacao_autorizada']??true)!==false || count($doom_copy7['combat']??[])!==4)
  throw new RuntimeException('Nível 7 não aprovado para a renderização técnica.');
$doom7=$doom_level7['mecanica'];$doom7_slots=$doom7['espacos_magia_por_circulo'];
$doom7_book=$doom7['magias_grimorio_adicionadas'];$doom7_prep=$doom7['preparacao_padrao_mago'];
if ($doom7['artifice']!==3 || $doom7['mago']!==4 || $doom7['pv_fixos']!==55 ||
    $doom7['bonus_proficiencia']!==3 || $doom7['atributos']['INT']!==18 ||
    $doom7['protecao_arcana_maxima']!==12 || $doom7_slots!==[4,3,3] ||
    $doom7['total_magias_grimorio']!==14 || $doom7['magias_mago_preparadas_regulares']!==7 ||
    count($doom7_book)!==2 || count($doom7_prep)!==7 ||
    $doom7_book[0]['pt']!=='Imagem Espelhada' || $doom7_book[1]['pt']!=='Sugestão' ||
    $doom7['truques_adquiridos_no_nivel'][0]['nome']!=='Mensagem (Message)' ||
    $doom7['caracteristicas_e_talentos'][0]!=='Conjurador de Guerra (War Caster)' ||
    $doom7['classe_armadura']['ca_referencia']!==18 ||
    $doom7['circulos_de_magia']['maior_circulo_acessivel_com_magias_de_mago']!==2 ||
    $doom7['circulos_de_magia']['maior_circulo_de_espaco_compartilhado']!==3 ||
    $doom7['arte_editorial']['identificadores'][0]!=='DOOM-ART-02B')
  throw new RuntimeException('Nível 7 divergiu dos dados aprovados v1.2 ou da errata Arcane Ward.');
$doom7_wish=$doom7['wishlist_novas_prioridades'];
$doom7_prior=FMB_Doom_Data::get_approved_level(5)['mecanica']['wishlist_novas_prioridades'];
if (count($doom7_wish)!==1 || $doom7_wish[0]['pt']!=='Botas Aladas' ||
    $doom7_wish[0]['estado_aquisicao']!=='NAO_CONFIRMADO' ||
    $doom7_wish[0]['sintonizacao_exigida']!==true ||
    $doom7_wish[0]['aplicar_bonus_no_personagem_automaticamente']!==false ||
    count($doom7_prior)!==2 || $doom7_prior[0]['pt']!=='Armadura Segmentada')
  throw new RuntimeException('Wishlist do nível 7 não está separada do inventário.');
$doom7_intmod=(int)floor(($doom7['atributos']['INT']-10)/2);
$doom7_dc=8+$doom7['bonus_proficiencia']+$doom7_intmod;
$doom7_atk=$doom7['bonus_proficiencia']+$doom7_intmod;
?>
<div class="fmb-block fmb-block-7 doom-level-seven" data-fmb-block="7">
 <div class="preview"><section class="level" id="doom-nivel-7" data-fmb-level="7" data-fmb-phase="II · O Conhecimento Arcano" aria-labelledby="doom-n7-title">
   <aside class="progress-side">
     <div class="phase"><?php echo esc_html($doom_copy7['phase']); ?></div>
     <div class="level-no" aria-label="Nível total 7">7</div><div class="timeline" aria-hidden="true"></div>
     <div class="snake-wrap doom-mask-wrap"><img src="<?php echo esc_url($doom_art.'doom-art-02b-mascara-ii-aprovada.webp'); ?>" alt="Máscara da fase II do Doutor Destino, arte" width="1024" height="1536" loading="lazy"></div>
     <div class="fm-side-sheet">
       <div class="fm-side-section"><span class="fm-side-label">Atributos · INT +1</span><div class="fm-stats-grid">
         <?php foreach($doom7['atributos'] as $abbr=>$value): ?><div class="fm-stat"><small><?php echo esc_html($abbr); ?></small><strong><?php echo esc_html($value); ?></strong><span><?php echo esc_html($doom_mod($value)); ?></span></div><?php endforeach; ?>
       </div></div>
       <div class="fm-side-section fm-panel"><span class="fm-side-label">Defesa · ganhos reais e condicionais</span>
         <div class="fm-row"><small>CA inicial, sem réplica ativa</small><strong>17</strong></div>
         <div class="fm-row"><small>Escudo +1 replicado e ativo</small><strong><?php echo esc_html($doom7['classe_armadura']['ca_referencia']); ?></strong></div>
         <div class="fm-row"><small>Proteção Arcana · PV máximos</small><strong><?php echo esc_html($doom7['protecao_arcana_maxima']); ?></strong></div>
       </div>
       <div class="fm-side-section fm-panel"><span class="fm-side-label">Espaços compartilhados</span><div class="fm-resource-mini doom-n7-resource">
         <?php foreach($doom7_slots as $i=>$n): ?><div><small><?php echo esc_html(($i+1).'º círculo'); ?></small><strong><?php echo esc_html($n); ?></strong></div><?php endforeach; ?>
       </div></div>
     </div>
     <div class="wish-section doom-wish-section doom-n7-wishlist" role="note" aria-label="Wishlist pendente e aquisição não confirmada">
       <span class="wish-title">Wishlist · próxima prioridade</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($doom7_prior[0]); ?></strong><span class="wish-tag">NÃO ADQUIRIDA</span></div>
         <p>Sem compra confirmada. Manto de Proteção (Cloak of Protection) segue pendente. Novo desejo opcional no nível 7: <?php echo $doom_fmt($doom7_wish[0]); ?>, com sintonização, não obtidas automaticamente.</p></div>
     </div>
     <div class="fm-timeline-resume" aria-hidden="true"></div>
   </aside>
   <div class="content doom-n7-content">
     <div class="kicker"><?php echo esc_html($doom_copy7['kicker']); ?> · PHB 2024 / Eberron 2025</div>
     <h2 id="doom-n7-title" class="doom-n7-title"><?php echo esc_html($doom_copy7['title']); ?></h2>
     <p class="lead doom-n7-lead"><?php echo esc_html($doom_copy7['intro']); ?></p>
     <div class="doom-n7-strip" aria-label="Indicadores de nível 7">
       <span><strong><?php echo esc_html($doom7['pv_fixos']); ?> PV</strong></span>
       <span><strong>INT <?php echo esc_html($doom7['atributos']['INT']); ?></strong> (+<?php echo esc_html($doom7_intmod); ?>)</span>
       <span><strong><?php echo esc_html($doom7['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
       <span><strong>4×1º · 3×2º · 3×3º</strong> espaços</span>
       <span><strong>CD <?php echo esc_html($doom7_dc); ?></strong> · ataque +<?php echo esc_html($doom7_atk); ?></span>
       <span><strong><?php echo esc_html($doom7['total_magias_grimorio']); ?> magias</strong> no grimório</span>
     </div>
     <section class="doom-n7-feature" aria-labelledby="doom-n7-feat">
       <div class="mini-label">Talento Geral · Mago 4</div>
       <h3 id="doom-n7-feat"><?php echo esc_html($doom_copy7['feat_title']); ?></h3>
       <div class="doom-n7-ability"><strong>INT 17 → 18</strong><span><?php echo esc_html($doom_copy7['feat_intro']); ?></span></div>
       <ul class="doom-n7-feat-list"><li><strong>Concentração:</strong> <?php echo esc_html($doom_copy7['feat_concentration']); ?></li>
         <li><strong>Componentes:</strong> <?php echo esc_html($doom_copy7['feat_components']); ?></li>
         <li><strong>Reação:</strong> <?php echo esc_html($doom_copy7['feat_opportunity']); ?></li></ul>
     </section>
     <section class="doom-n7-feature" aria-labelledby="doom-n7-ward">
       <div class="mini-label">Abjurador (Abjurer) · Proteção Arcana</div>
       <h3 id="doom-n7-ward"><?php echo esc_html($doom_copy7['ward_title']); ?></h3>
       <div class="doom-n7-feature-grid"><div class="doom-n7-ward-value"><strong><?php echo esc_html($doom7['protecao_arcana_maxima']); ?></strong><span>PV máximos da barreira</span><small>2 × Mago 4 + INT +4</small></div><div><p><?php echo esc_html($doom_copy7['ward_detail']); ?></p><p><strong>CA:</strong> 18 somente quando Escudo +1 foi efetivamente replicado e está ativo; CA 19–21 dependem de compras ou tesouros pendentes.</p></div></div>
     </section>
     <section class="doom-n7-feature" aria-labelledby="doom-n7-book">
       <div class="mini-label">Grimório · Mago (Wizard) 4</div>
       <h3 id="doom-n7-book">Quatorze magias inscritas · sete preparadas</h3>
       <p><?php echo esc_html($doom_copy7['spell_note']); ?></p>
       <div class="doom-n7-spell-grid">
         <?php foreach($doom7_book as $index=>$book): ?>
         <article class="doom-n7-spell"><small><?php echo $index===0 ? 'PREPARAÇÃO PADRÃO' : 'ALTERNATIVA NO GRIMÓRIO'; ?></small><strong><?php echo $doom_fmt($book); ?></strong><span><?php echo $index===0 ? 'Preparada neste nível' : 'Inscrita, ainda não preparada'; ?></span></article>
         <?php endforeach; ?>
       </div>
       <div class="doom-n7-prepared"><strong>Preparação padrão de Mago · <?php echo count($doom7_prep); ?></strong><ul><?php foreach($doom7_prep as $spell): ?><li><?php echo esc_html($spell); ?></li><?php endforeach; ?></ul></div>
       <p class="doom-n7-spell-meta"><strong>Novo truque:</strong> <?php echo esc_html($doom7['truques_adquiridos_no_nivel'][0]['nome']); ?> (Mago). <?php echo esc_html($doom_copy7['cantrip_note']); ?></p>
       <p class="doom-n7-note"><strong>Multiclasse:</strong> <?php echo esc_html($doom_copy7['multi_note']); ?> Magias preparadas de Artífice, sempre preparadas de Armeiro e Iniciado em Magia (Magic Initiate) permanecem em listas distintas.</p>
     </section>
     <section class="doom-n7-combat" aria-labelledby="doom-n7-combat-title">
       <div class="mini-label">Na mesa · um único campo de combate</div>
       <h3 id="doom-n7-combat-title"><?php echo esc_html($doom_copy7['combat_title']); ?></h3><p><?php echo esc_html($doom_copy7['combat_intro']); ?></p>
       <ol><?php foreach($doom_copy7['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol>
       <div class="doom-n7-priority"><strong>Prioridade:</strong> <?php echo esc_html($doom_copy7['priority']); ?></div>
       <?php $doom_tactical = $doom_copy7['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?>
     </section>
   </div>
   <footer class="doom-n7-footer"><span>Fim do nível total 7 · A Vontade Não se Quebra</span></footer>
 </section></div>
</div>
