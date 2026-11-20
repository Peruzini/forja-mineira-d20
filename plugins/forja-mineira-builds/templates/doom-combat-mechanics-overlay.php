<?php
/** Preview-only local overlay: preserves canonical v1.2 source, modifies only in-memory rendering. */
if (!defined('ABSPATH')) { exit; }
$doom_overlay_all=json_decode((string)file_get_contents(FMB_PATH.'data/doom-combat-overlay-09-12-v1.3.json'),true,512,JSON_THROW_ON_ERROR);
if (($doom_overlay_all['schema']??'')!=='forja-doom-tactical-mechanics-overlay/1.3' || ($doom_overlay_all['publicacao_autorizada']??true)!==false) throw new RuntimeException('Overlay não autorizado.');
$doom_patch=$doom_overlay_all['niveis'][(string)$n]??null;
if (!is_array($doom_patch) || $doom_patch['nivel_total']!==$n || $doom_patch['publicacao_autorizada']!==false) throw new RuntimeException('Overlay de nível inválido.');
if (count($doom_patch['magias_grimorio_adicionadas'])!==count($d['magias_grimorio_adicionadas']) ||
    count($doom_patch['preparacao_padrao_mago'])!==$d['magias_mago_preparadas_regulares'] ||
    $doom_patch['preparacoes_regulares_previstas']!==$d['magias_mago_preparadas_regulares']) throw new RuntimeException('Contagens do overlay inválidas.');
$d['magias_grimorio_adicionadas']=$doom_patch['magias_grimorio_adicionadas'];
$d['preparacao_padrao_mago']=$doom_patch['preparacao_padrao_mago'];
unset($doom_overlay_all,$doom_patch);
