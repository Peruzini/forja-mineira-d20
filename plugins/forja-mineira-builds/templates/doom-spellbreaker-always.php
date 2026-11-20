<?php
/** DOOM-FINAL-01: separa magias sempre preparadas das vagas regulares de Mago. */
if (!defined('ABSPATH')) { exit; }
$doom_spellbreaker = $d['quebra_feiticos_2024'] ?? null;
if (is_array($doom_spellbreaker) && ($doom_spellbreaker['ocupam_preparacoes_regulares'] ?? true) === false): ?>
<p class="doom-always-prepared" role="note"><strong>Quebra-Feitiços (Spell Breaker) — sempre preparadas:</strong> <?php echo esc_html(implode(' · ', $doom_spellbreaker['sempre_preparadas'])); ?>. <em>Não ocupam as preparações regulares do Mago.</em></p>
<?php endif; ?>
