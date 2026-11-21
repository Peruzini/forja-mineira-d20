<?php
declare(strict_types=1);
// Isolated WordPress-shape contract with no HTTP, real WordPress or database.
define('ABSPATH','/tmp/fwb-test/');
define('FWB_REG02B_OAUTH_STAGING',true);
define('FWB_REG02B_CIMD_COMPAT_PATCHED',true);
define('FWB_REG02B_CHATGPT_CIMD_URL','https://chatgpt.com/oauth/client.json');
$environment='staging';
$hostname='preview.example.org';
$logged_in=true;
$can_edit=true;
$callbacks=[];
$abilities=[];
function wp_get_environment_type(){return $GLOBALS['environment'];}
function home_url(){return 'https://'.$GLOBALS['hostname'];}
function wp_parse_url($url,$component){return parse_url($url,$component);}
function add_filter($name,$callback,$priority=10){$GLOBALS['callbacks']['filter'][$name][]=$callback;}
function add_action($name,$callback,$priority=10){$GLOBALS['callbacks']['action'][$name][]=$callback;}
function is_user_logged_in(){return $GLOBALS['logged_in'];}
function current_user_can($name,$id=null){return $GLOBALS['can_edit'];}
function get_current_user_id(){return 17;}
function wp_register_ability_category($name,$data){$GLOBALS['abilities']['category'][$name]=$data;}
function wp_register_ability($name,$data){$GLOBALS['abilities']['tools'][$name]=$data;}
function absint($value){return abs((int)$value);}
function get_post($id){return (object)[
    'ID'=>$id,'post_type'=>'post','post_author'=>($id===9?18:17),'post_status'=>'draft',
    'post_title'=>'Fixture','post_content'=>'Some content','post_modified_gmt'=>'2026-11-20 00:00:00'
];}
class WP_Query{
 public $posts=[];
 public function __construct($args){
   if($args['author']!==17 || $args['post_type']!=='post' || $args['posts_per_page']>10)throw new Exception('unsafe query');
   $this->posts=[(object)['ID'=>4,'post_title'=>'Example','post_status'=>'draft']];
 }
}
class WP_Error {
 public $code;
 public function __construct($code,$message,$data=[]){$this->code=$code;}
}
require dirname(__DIR__).'/forja-wp-oauth-stage.php';
function ensure($assert,$message){if(!$assert)exit("FAIL ".$message."\n");}
ensure(fwb_reg02b_enabled(),'staging enabled');
ensure(fwb_reg02b_client_id()==='https://chatgpt.com/oauth/client.json','exact client id');
$trusted=fwb_reg02b_trusted_publishers([]);
ensure($trusted['chatgpt-forja']['host']==='chatgpt.com','trusted publisher pin');
FWB_REG02B_Abilities::register_category();
FWB_REG02B_Abilities::register();
ensure(count($GLOBALS['abilities']['tools'])===3,'3 abilities registered');
ensure(FWB_REG02B_Abilities::permitted(),'permission allowed');
ensure(FWB_REG02B_Abilities::list_posts(['limit'=>3])['posts'][0]['id']===4,'list own posts');
ensure(FWB_REG02B_Abilities::get_post(['id'=>9]) instanceof WP_Error,'deny foreign post');
ensure(FWB_REG02B_Abilities::get_post(['id'=>8])['id']===8,'allow owned post');
ensure(FWB_REG02B_Abilities::validate_draft(['title'=>'Test'])['dry_run']===true,'only dry-run');
ensure(FWB_REG02B_Abilities::validate_draft(['title'=>'Test','status'=>'publish']) instanceof WP_Error,'deny publish fields');
$GLOBALS['can_edit']=false;
ensure(FWB_REG02B_Abilities::list_posts([]) instanceof WP_Error,'deny readonly WordPress user');
$GLOBALS['can_edit']=true;
$GLOBALS['environment']='production';
ensure(!fwb_reg02b_enabled(),'fail closed production environment');
$GLOBALS['environment']='staging';
$GLOBALS['hostname']='forjamineirad20.com.br';
ensure(!fwb_reg02b_enabled(),'fail closed live production host');
ensure(count($GLOBALS['abilities']['tools'])===3,'no extra capabilities');
echo "FWB_REG02B_STAGING_PERMISSIONS PASS\n";
