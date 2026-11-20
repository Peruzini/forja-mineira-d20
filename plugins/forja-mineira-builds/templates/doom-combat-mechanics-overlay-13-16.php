<?php
/** Preview only: retain proposal source v1.2, apply approved tactical editorial selections in memory. */
if (!defined('ABSPATH')) { exit; }
$overlay=json_decode((string)file_get_contents(FMB_PATH.'data/doom-combat-overlay-13-16-v1.3.json'),true,512,JSON_THROW_ON_ERROR);
if (($overlay['schema']??'')!=='forja-doom-tactical-mechanics-overlay/1.3' || ($overlay['publicacao_autorizada']??true)!==false) throw new RuntimeException('Overlay editorial inválido.');
$patch=$overlay['niveis'][(string)$n]??null;
if (!is_array($patch) || ($patch['nivel_total']??0)!==$n || ($patch['publicacao_autorizada']??true)!==false ||
 $patch['preparacoes_regulares_previstas']!==$d['magias_mago_preparadas_regulares'] ||
 $patch['preparacoes_identificadas']+ $patch['preparacoes_pendentes'] !==$d['magias_mago_preparadas_regulares'] ||
 count($patch['preparacao_padrao_mago'])!==$patch['preparacoes_identificadas'] ||
 count($patch['magias_grimorio_adicionadas'])!==count($d['magias_grimorio_adicionadas']) ||
 array_column($patch['magias_grimorio_adicionadas'],'pt')!==array_column($d['magias_grimorio_adicionadas'],'pt')) throw new RuntimeException('Inconsistência na revisão de preparações.');
$d['quebra_feiticos_2024']=['nome'=>'Quebra-Feitiços (Spell Breaker)','sempre_preparadas'=>$patch['magias_sempre_preparadas_spell_breaker'],'ocupam_preparacoes_regulares'=>false];
$d['preparacao_padrao_mago']=$patch['preparacao_padrao_mago'];
$prepared=$d['preparacao_padrao_mago'];
// N13 remains 14 identified out of 15, with the final slot explicitly unresolved.
$doom_prep_pending=$patch['preparacoes_pendentes'];
unset($overlay,$patch);
