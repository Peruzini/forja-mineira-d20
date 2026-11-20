<?php
/** Forja Mineira — Doutor Destino, nível 17 em proposta. Somente preview. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(17);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel17.json'),true,512,JSON_THROW_ON_ERROR);
$wish=$d['wishlist_novas_prioridades'][0]??null;
$second_wish=$d['wishlist_novas_prioridades'][1]??null;
$spells=$d['magias_grimorio_adicionadas'];$prepared=$d['preparacao_padrao_mago'];
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==17 || ($copy['publicacao_autorizada']??true)!==false ||
 count($copy['combat']??[])!==4 || count($copy['features']??[])!==2 || count($copy['spell_notes']??[])!==2 ||
 ($d['nivel_total']??null)!==17 || ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 ($d['artifice']??null)!==3 || ($d['mago']??null)!==14 ||
 $d['pv_fixos']!==125 || $d['bonus_proficiencia']!==6 || $d['atributos']['INT']!==20 || $d['atributos']['SAB']!==11 ||
 $d['protecao_arcana_maxima']!==33 || $d['total_magias_grimorio']!==39 ||
 $d['magias_mago_preparadas_regulares']!==18 || count($prepared)!==18 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,2,1,1,1] ||
 array_column($spells,'pt')!==['Viagem Planar','Projetar Imagem'] ||
 $d['caracteristicas_e_talentos']!==['Resistência a Magias (Spell Resistance)'] ||
 ($d['resistencia_a_magias_2024']['nivel_mago']??null)!==14 ||
 ($wish['identificador']??null)!=='tome_of_clear_thought' || ($wish['estado_aquisicao']??null)!=='NAO_CONFIRMADO' ||
 ($wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false ||
 ($second_wish['identificador']??null)!=='robe_of_the_archmagi' || ($second_wish['estado_aquisicao']??null)!=='NAO_CONFIRMADO' ||
 ($second_wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-03D'] ||
 ($d['arte_editorial']['posicao_nivel_pendente_de_homologacao']??false)!==true ||
 ($d['arte_editorial']['preview_homologado']??true)!==false) {
 throw new RuntimeException('Nível 17: contrato da proposta mecânica ou editorial divergente.');
}
$n=17; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-17-20.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);
$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if ($dc!==19 || $attack!==11 || $d['protecao_arcana_maxima']!==2*$d['mago']+$mod) throw new RuntimeException('Derivados do Nível 17 divergentes.');
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-17 doom-level-17 doom-level-proposal" data-fmb-block="17">
 <div class="preview"><section class="level" id="doom-nivel-17" data-fmb-level="17" data-fmb-phase="V · O Poder do Soberano" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(17) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n17-title">
  <div class="phase-open doom-n17-phase-open">
   <aside class="doom-n17-art-rail" aria-label="Arte do marco narrativo e Wishlist do Nível 17">
    <figure class="doom-n17-figure">
     <img src="<?php echo esc_url($doom_art.'doom-art-03d-victor-em-ruinas-aprovada.webp'); ?>" width="1086" height="1448" loading="lazy" alt="Victor de armadura esmeralda entre ruínas">
     <span class="doom-n17-phase-stamp"><?php echo esc_html($copy['fase']); ?></span><span class="doom-n17-level-number" aria-label="Nível 17">17</span>
     <figcaption class="doom-n17-art-caption"><strong><?php echo esc_html($copy['art_caption']); ?></strong></figcaption>
    </figure>
    <div class="doom-n17-rail-data" aria-label="Ficha resumida">
     <div><span>PV do personagem</span><strong><?php echo esc_html($d['pv_fixos']); ?></strong></div>
     <div><span>Proteção Arcana · máximo</span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?></strong></div>
     <div><span>CD / Ataque</span><strong><?php echo esc_html($dc.' / +'.$attack); ?></strong></div>
     <div><span>CA condicional*</span><strong><?php echo esc_html($ca_ref); ?></strong></div>
    </div>
    <div class="doom-n17-wishlist wish-section doom-wish-section" role="note" aria-label="Wishlist do Nível 17, não adquirida">
     <span class="wish-title">Próximo item desejável</span>
     <div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']); ?></p></div>
     <p class="doom-n17-secondary-wish"><strong>Objetivo adicional:</strong> <?php echo $doom_fmt($second_wish); ?> — não adquirido; compatibilidade com armadura pendente.</p>
    </div>
   </aside>
   <div class="doom-n17-content content">
    <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
    <h2 class="doom-n17-title" id="doom-n17-title"><?php echo esc_html($copy['title']); ?></h2>
    <p class="doom-n17-subtitle"><?php echo esc_html($copy['subtitle']); ?></p>
    <p class="doom-n17-lead"><?php echo esc_html($copy['intro']); ?></p>
    <div class="doom-n17-strip" aria-label="Indicadores do Nível 17">
     <span><strong><?php echo esc_html($d['pv_fixos']); ?> PV</strong> Artífice 3 / Mago 14</span>
     <span><strong>INT <?php echo esc_html($d['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod); ?>)</span>
     <span><strong>PB +<?php echo esc_html($d['bonus_proficiencia']); ?></strong> nível total 17</span>
     <span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
     <span><strong>CD <?php echo esc_html($dc); ?></strong> · ataque +<?php echo esc_html($attack); ?></span>
     <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
     <span><strong><?php echo esc_html($d['total_magias_grimorio']); ?></strong> grimório · <strong><?php echo esc_html($d['magias_mago_preparadas_regulares']); ?></strong> preparadas</span>
    </div>
    <section class="doom-n17-feature" aria-labelledby="doom-n17-feature-title">
     <div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div>
     <h3 id="doom-n17-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3><p><?php echo esc_html($copy['feature_intro']); ?></p>
     <div class="doom-n17-feature-grid"><?php foreach($copy['features'] as $f): ?><article><strong><?php echo esc_html($f['label']); ?></strong><p><?php echo esc_html($f['text']); ?></p></article><?php endforeach; ?></div>
     <p class="doom-n17-rule"><strong>Proteção Arcana:</strong> <?php echo esc_html($copy['ward_detail']); ?></p>
    </section>
    <section class="doom-n17-spells" aria-labelledby="doom-n17-spells-title">
     <div class="mini-label">Grimório e repertório</div><h3 id="doom-n17-spells-title">Dois caminhos para além do horizonte</h3>
     <div class="doom-n17-spell-grid"><?php foreach($spells as $spell): ?>
      <?php $note='';foreach($copy['spell_notes'] as $entry)if($entry['pt']===$spell['pt'])$note=$entry['note']; ?>
      <article class="doom-n17-spell"><small>MAGIA DE 7º CÍRCULO</small><strong><?php echo $doom_fmt($spell); ?></strong><span><?php echo esc_html($note); ?></span></article><?php endforeach; ?></div>
     <div class="doom-n17-prepared"><strong>Preparação regular de Mago · 18</strong><ul><?php foreach($prepared as $spell): ?><li><?php echo esc_html($spell); ?><?php if (strpos($spell,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($spell,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach; ?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
     <p class="doom-n17-rule"><?php echo esc_html($copy['prep_note']); ?></p>
     <p class="doom-n17-rule"><?php echo esc_html($copy['slot_note']); ?></p>
    </section>
    <section class="doom-n17-combat" aria-labelledby="doom-n17-combat-title"><span class="mini-label">Na mesa · estratégia provisória</span><h3 id="doom-n17-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step): ?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach; ?></ol><div class="doom-n17-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
   </div>
  </div>
  <footer class="doom-n17-footer"><span>Fim do nível total 17 · A Magia já Não o Dobra</span></footer>
 </section></div>
</div>
