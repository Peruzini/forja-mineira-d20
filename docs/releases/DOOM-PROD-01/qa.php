<?php
error_reporting(E_ALL);
set_error_handler(static function($severity,$message,$file,$line){throw new ErrorException($message,0,$severity,$file,$line);});
define('ABSPATH', '/tmp/wordpress/');
define('FMB_PATH', $argv[1].'/');
define('FMB_VERSION', '2.3.32');
define('FMB_URL', 'https://forjamineirad20.com.br/wp-content/plugins/forja-mineira-builds/');
if (($argv[2]??'')==='review') { define('FMB_DOOM_REVIEW_MODE', true); }
function esc_html($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function esc_attr($v){return esc_html($v);}
function esc_url($v){return esc_html($v);}
function current_user_can($v){return false;}
ob_start();
include FMB_PATH.'templates/doutor-destino-stage2.php';
$html=ob_get_clean();
preg_match_all('/data-fmb-level="(\d+)"/',$html,$matches);
$levels=array_map('intval',$matches[1]);
if($levels!==range(1,20))throw new RuntimeException('Níveis renderizados divergentes: '.json_encode($levels));
foreach([13=>15,19=>21,20=>22] as $n=>$count){
    $overlay=json_decode(file_get_contents(FMB_PATH.'data/doom-combat-overlay-'.($n<17?'13-16':'17-20').'-v1.3.json'),true,512,JSON_THROW_ON_ERROR)['niveis'][(string)$n];
    if(count($overlay['preparacao_padrao_mago'])!==$count || $overlay['preparacoes_pendentes']!==0)throw new RuntimeException('Preparações N'.$n);
    if($overlay['magias_sempre_preparadas_spell_breaker']!==['Contramágica (Counterspell)','Dissipar Magia (Dispel Magic)'])throw new RuntimeException('Quebra-Feitiços N'.$n);
}
if(strpos($html,'14 + 1 pendente')!==false)throw new RuntimeException('Indicador desatualizado N13');
if(strpos($html,'LEGACY')===false || strpos($html,'requer Mestre')===false)throw new RuntimeException('Aviso Legacy ausente');
if(FMB_Doom_Release::is_public_level(21))throw new RuntimeException('Nível não homologado liberado');
$mode=defined('FMB_DOOM_REVIEW_MODE')?'review':'public';
file_put_contents('/work/render-'.$mode.'.html',$html);
echo json_encode(['php'=>PHP_VERSION,'mode'=>$mode,'levels'=>$levels,'bytes'=>strlen($html),'warnings'=>0,'preparacoes'=>'15/15, 21/21, 22/22','legacy'=>true,'unknown_level_blocked'=>true],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE),"\n";
