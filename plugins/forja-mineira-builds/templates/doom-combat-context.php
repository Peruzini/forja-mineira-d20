<?php
/** Compact decision support inside an existing single combat panel. Combat editorial overlay v1.3. */
if (!defined('ABSPATH')) { exit; }
if (!is_array($doom_tactical ?? null) ||
    !isset($doom_tactical['contra_chefe'],$doom_tactical['contra_grupo'],$doom_tactical['erro_evitar'])) {
    throw new RuntimeException('Contexto tático de combate incompleto.');
}
?>
<div class="doom-tactics-context" aria-label="Decisões de combate por cenário">
  <div class="doom-tactics-scenarios">
    <p><strong>Contra chefes</strong><span><?php echo esc_html($doom_tactical['contra_chefe']); ?></span></p>
    <p><strong>Contra grupos</strong><span><?php echo esc_html($doom_tactical['contra_grupo']); ?></span></p>
  </div>
  <p class="doom-tactics-caution"><strong>Evite:</strong> <?php echo esc_html($doom_tactical['erro_evitar']); ?></p>
</div>
