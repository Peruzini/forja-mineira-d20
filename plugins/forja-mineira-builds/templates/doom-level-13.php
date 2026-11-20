<?php
/** Doutor Destino — nível total 13, proposta da fonte v1.2. Não publicar. */
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH.'includes/class-doom-proposal.php';
$d=FMB_Doom_Proposal::get_for_preview(13);
$copy=json_decode((string)file_get_contents(FMB_PATH.'data/doom-editorial-nivel13.json'),true,512,JSON_THROW_ON_ERROR);
$wish=$d['wishlist_novas_prioridades'][0]??null;
$spells=$d['magias_grimorio_adicionadas'];
$prepared=$d['preparacao_padrao_mago'];
$always=$d['quebra_feiticos_2024']['sempre_preparadas'];
if (($copy['schema']??'')!=='forja-doom-level-editorial/1.0' || ($copy['build_id']??'')!=='doutor-destino' ||
 ($copy['nivel_total']??null)!==13 || ($copy['publicacao_autorizada']??true)!==false ||
 count($copy['combat']??[])!==4 || count($copy['features']??[])!==3 ||
 ($d['nivel_total']??null)!==13 || ($d['artifice']??null)!==3 || ($d['mago']??null)!==10 ||
 ($d['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
 $d['pv_fixos']!==97 || $d['bonus_proficiencia']!==5 || $d['atributos']['INT']!==20 ||
 $d['protecao_arcana_maxima']!==25 || $d['total_magias_grimorio']!==29 ||
 $d['magias_mago_preparadas_regulares']!==15 || count($prepared)!==15 ||
 $d['espacos_magia_por_circulo']!==[4,3,3,3,2,1] ||
 array_column($spells,'pt')!==['Vidência','Círculo Mágico'] ||
 $d['caracteristicas_e_talentos']!==['Quebra-Feitiços (Spell Breaker)','Luz (Light) — novo truque'] ||
 $always!==['Contramágica (Counterspell)','Dissipar Magia (Dispel Magic)'] ||
 ($d['quebra_feiticos_2024']['ocupam_preparacoes_regulares']??true)!==false ||
 ($wish['identificador']??'')!=='staff_of_power' || ($wish['estado_aquisicao']??'')!=='NAO_CONFIRMADO' ||
 ($wish['aplicar_bonus_no_personagem_automaticamente']??true)!==false ||
 ($wish['sintonizacao_exigida']??false)!==true ||
 ($d['arte_editorial']['identificadores']??[])!==['DOOM-ART-03C'] ||
 ($d['arte_editorial']['posicao_nivel_pendente_de_homologacao']??false)!==true ||
 ($d['arte_editorial']['preview_homologado']??true)!==false) {
 throw new RuntimeException('Nível 13 bloqueado: dados ou estado divergem da fonte v1.2.');
}
$n=13; include FMB_PATH . 'templates/doom-combat-mechanics-overlay-13-16.php';
$mod=(int)floor(($d['atributos']['INT']-10)/2);
$dc=8+$d['bonus_proficiencia']+$mod;$attack=$d['bonus_proficiencia']+$mod;
if($dc!==18 || $attack!==10 || $d['protecao_arcana_maxima']!==(2*$d['mago']+$mod)) throw new RuntimeException('Derivados N13 incorretos.');
$ca_ref=(int)FMB_Doom_Data::get_approved_level(10)['mecanica']['classe_armadura']['ca_referencia'];
$slots=implode(' · ',array_map(static function($i,$q){return $q.'×'.($i+1).'º';},array_keys($d['espacos_magia_por_circulo']),$d['espacos_magia_por_circulo']));
?>
<div class="fmb-block fmb-block-13 doom-level-13 doom-level-proposal" data-fmb-block="13">
 <div class="preview"><section class="level" id="doom-nivel-13" data-fmb-level="13" data-fmb-phase="IV · O Quebra-Feitiços" data-fmb-approval="<?php echo FMB_Doom_Release::is_public_level(13) ? 'APROVADO_PRODUCAO' : 'PROPOSTA_NAO_APROVADA'; ?>" aria-labelledby="doom-n13-title">
  <div class="phase-open doom-n13-phase-open">
   <aside class="doom-n13-art-rail" aria-label="Arte do novo marco narrativo e Wishlist">
    <figure class="doom-n13-figure">
     <img src="<?php echo esc_url($doom_art.'doom-art-03c-combate-magico-aprovada.webp'); ?>" alt="Victor de armadura esmeralda erguendo uma manopla mágica em combate, pintura" width="1086" height="1448" loading="lazy">
     <span class="doom-n13-phase-stamp"><?php echo esc_html($copy['fase']); ?></span>
     <span class="doom-n13-level-number" aria-label="Nível 13">13</span>
     <figcaption class="doom-n13-art-caption"><strong><?php echo esc_html($copy['art_caption']); ?></strong></figcaption>
    </figure>
    <div class="doom-n13-rail-data" aria-label="Ficha resumida">
     <div><span>PV</span><strong><?php echo esc_html($d['pv_fixos']); ?></strong></div>
     <div><span>Proteção Arcana</span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?></strong></div>
     <div><span>CD / Ataque</span><strong><?php echo esc_html($dc.' / +'.$attack); ?></strong></div>
     <div><span>CA condicional*</span><strong><?php echo esc_html($ca_ref); ?></strong></div>
    </div>
    <div class="doom-n13-wishlist wish-section doom-wish-section" role="note" aria-label="Wishlist nível 13, item ainda não adquirido"><span class="wish-title">Próximo item desejável</span><div class="doom-wish-item"><div class="wish-head"><strong><?php echo $doom_fmt($wish); ?></strong><span class="wish-tag">NÃO ADQUIRIDO</span></div><p><?php echo esc_html($copy['wishlist_note']); ?></p></div></div>
   </aside>
   <div class="doom-n13-content content">
    <div class="kicker"><?php echo esc_html($copy['kicker']); ?> · PHB 2024 / Eberron 2025</div>
    <h2 class="doom-n13-title" id="doom-n13-title"><?php echo esc_html($copy['title']); ?></h2>
    <p class="doom-n13-subtitle"><?php echo esc_html($copy['subtitle']); ?></p>
    <p class="doom-n13-lead"><?php echo esc_html($copy['intro']); ?></p>
    <div class="doom-n13-strip" aria-label="Indicadores do nível 13">
     <span><strong><?php echo esc_html($d['pv_fixos']); ?> PV</strong> Artífice 3 / Mago 10</span>
     <span><strong>INT <?php echo esc_html($d['atributos']['INT']); ?></strong> (+<?php echo esc_html($mod); ?>)</span>
     <span><strong>PB +<?php echo esc_html($d['bonus_proficiencia']); ?></strong> total 13</span>
     <span><strong><?php echo esc_html($d['protecao_arcana_maxima']); ?> PV</strong> barreira máxima</span>
     <span><strong><?php echo esc_html($slots); ?></strong> espaços</span>
     <span><strong>29</strong> grimório · <strong>15/15</strong> preparadas</span>
    </div>
    <section class="doom-n13-feature" aria-labelledby="doom-n13-feature-title">
     <div class="mini-label"><?php echo esc_html($copy['feature_label']); ?></div>
     <h3 id="doom-n13-feature-title"><?php echo esc_html($copy['feature_title']); ?></h3>
     <p><?php echo esc_html($copy['feature_intro']); ?></p>
     <div class="doom-n13-feature-grid">
      <?php foreach($copy['features'] as $f): ?><article><strong><?php echo esc_html($f['label']); ?></strong><p><?php echo esc_html($f['text']); ?></p></article><?php endforeach; ?>
     </div>
     <p class="doom-n13-rule"><strong>Proteção Arcana:</strong> <?php echo esc_html($copy['ward_detail']); ?></p>
    </section>
    <section class="doom-n13-spells" aria-labelledby="doom-n13-spells-title">
     <div class="mini-label">Grimório e repertório</div><h3 id="doom-n13-spells-title">Duas inscrições, um novo truque</h3>
     <p><?php echo esc_html($copy['spells_intro']); ?></p>
     <div class="doom-n13-spell-grid"><?php foreach($spells as $s): ?>
       <?php $note='';foreach($copy['spell_notes'] as $c)if($c['pt']===$s['pt'])$note=$c['note']; ?>
       <article class="doom-n13-spell"><small>GRIMÓRIO</small><strong><?php echo $doom_fmt($s); ?></strong><span><?php echo esc_html($note); ?></span></article>
      <?php endforeach; ?></div>
     <div class="doom-n13-cantrip"><strong>Truque novo:</strong> Luz (Light) · <?php echo esc_html($copy['cantrip_note']); ?></div>
     <div class="doom-n13-prepared"><strong>Preparação regular de Mago · 15/15 preparadas</strong><ul><?php foreach($prepared as $s):?><li><?php echo esc_html($s); ?><?php if (strpos($s,"Raulothim")!==false): ?> <span class="doom-legacy-label">LEGACY</span><?php endif; ?><?php if (strpos($s,"Teletransporte")!==false): ?> <span class="doom-essential-label">ESSENCIAL</span><?php endif; ?></li><?php endforeach;?></ul></div>
    <?php include FMB_PATH.'templates/doom-spellbreaker-always.php'; ?>
     <p class="doom-n13-rule"><?php echo esc_html($copy['prep_note']); ?> Os espaços de 6º círculo não habilitam magias aprendidas de Mago desse círculo no nível 13.</p>
    </section>
    <section class="doom-n13-combat" aria-labelledby="doom-n13-combat-title"><span class="mini-label">Na mesa · estratégia provisória</span><h3 id="doom-n13-combat-title"><?php echo esc_html($copy['combat_title']); ?></h3><p><?php echo esc_html($copy['combat_intro']); ?></p><ol><?php foreach($copy['combat'] as $step):?><li><strong><?php echo esc_html($step['label']); ?>:</strong> <?php echo esc_html($step['text']); ?></li><?php endforeach;?></ol><div class="doom-n13-priority"><strong>Prioridade:</strong> <?php echo esc_html($copy['priority']); ?></div><?php $doom_tactical=$copy['combat_context']; include FMB_PATH . 'templates/doom-combat-context.php'; ?></section>
   </div>
  </div>
  <footer class="doom-n13-footer"><span>Fim do nível total 13 · O Quebra-Feitiços</span></footer>
 </section></div>
</div>
