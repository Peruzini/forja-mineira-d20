<?php
/** Wishlist canônica, um item de destaque por nível; proposta, não inventário. */
if (!defined('ABSPATH')) { exit; }
if (!isset($doom_wishlist_level) || !in_array((int)$doom_wishlist_level, [2,3,4,5], true)) {
    throw new RuntimeException('Nível da Wishlist fora do escopo homologado.');
}
$doom_wishlist_row = FMB_Doom_Data::get_approved_level((int)$doom_wishlist_level);
if (!$doom_wishlist_row || ($doom_wishlist_row['publicacao_autorizada'] ?? true) !== false) {
    throw new RuntimeException('Fonte da Wishlist sem homologação.');
}
$doom_wishlist_candidates = $doom_wishlist_row['mecanica']['wishlist_novas_prioridades'] ?? [];
if (!$doom_wishlist_candidates) { return; }
foreach ($doom_wishlist_candidates as $candidate) {
    if (($candidate['estado_aquisicao'] ?? '') !== 'NAO_CONFIRMADO' ||
        ($candidate['aplicar_bonus_no_personagem_automaticamente'] ?? true) !== false) {
        throw new RuntimeException('Wishlist não pode conceder item/bônus automaticamente.');
    }
}
// Apenas uma prioridade, igual à lógica visual de Voldemort. As demais
// permanecem na base/descrição do nível e não são apagadas nem concedidas.
$doom_wishlist = $doom_wishlist_candidates[0];
$doom_wishlist_meta = [
    2 => ['tag' => 'RÉPLICA PLANEJADA', 'note' => 'A CA só aumenta depois de replicar e equipar. A Bolsa de Carga continua no conjunto planejado.'],
    3 => ['tag' => 'COMPRA PROJETADA', 'note' => 'Só melhora a CA depois de ser comprada e equipada.'],
    4 => ['tag' => 'TESOURO · LEGACY', 'note' => 'Legacy: depende de aquisição e autorização do Mestre.'],
    5 => ['tag' => 'COMPRA PROJETADA', 'note' => 'Armadura Segmentada: CA só muda após compra e equipamento. Manto de Proteção é outra prioridade pendente.'],
][$doom_wishlist_level];
?>
<div class="wish-section doom-wish-section" role="note" aria-label="Próximo item desejável do nível <?php echo esc_attr((string)$doom_wishlist_level); ?>">
  <span class="wish-title">Próximo item desejável</span>
  <div class="wish-item doom-wish-item">
    <div class="wish-head"><strong><?php echo esc_html($doom_wishlist['pt']); ?></strong><span class="wish-tag"><?php echo esc_html($doom_wishlist_meta['tag']); ?></span></div>
    <small><?php echo esc_html($doom_wishlist['en']); ?></small>
    <p><?php echo esc_html($doom_wishlist_meta['note']); ?></p>
  </div>
  <p class="wish-note doom-wish-disclaimer">Não adquirido · sem bônus automático</p>
</div>
