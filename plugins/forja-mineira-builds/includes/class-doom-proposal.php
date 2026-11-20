<?php
if (!defined('ABSPATH')) { exit; }
require_once FMB_PATH . 'includes/class-doom-release.php';
final class FMB_Doom_Proposal {
 public static function get_for_preview($level) {
  if (!FMB_Doom_Release::is_public_level($level) && (!defined('FMB_DOOM_REVIEW_MODE') || FMB_DOOM_REVIEW_MODE !== true) || !in_array((int)$level,[11,12,13,14,15,16,17,18,19,20],true)) throw new RuntimeException('Proposta nao liberada fora do modo de revisao.');
  $path=FMB_PATH.'data/doom-proposal-'.((int)$level).'-preview.json';
  $row=json_decode((string)file_get_contents($path),true,512,JSON_THROW_ON_ERROR);
  if (($row['schema']??'')!=='forja-doom-level-proposal/1.0' || ($row['build_id']??'')!=='doutor-destino' ||
   ($row['nivel_total']??null)!==(int)$level || ($row['status']??'')!=='PROPOSTA_DISCUSSÃO_NÃO_HOMOLOGADA' ||
   ($row['publicacao_autorizada']??true)!==false || ($row['mecanica']['status']??'')!=='proposta_discutida_aguarda_consolidacao' ||
   ($row['mecanica']['nivel_total']??null)!==(int)$level) throw new RuntimeException('Proposta adulterada ou publicada, bloqueada.');
  return $row['mecanica'];
 }
}
