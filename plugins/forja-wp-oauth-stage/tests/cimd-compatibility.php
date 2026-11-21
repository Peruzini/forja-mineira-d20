<?php
declare(strict_types=1);
// Test upstream code itself via reflection AFTER applying patch; no WP network.
function wp_parse_url( $url, $component = -1 ) { return parse_url( $url, $component ); }
function esc_url_raw( $url ) { return $url; }
function sanitize_text_field( $value ) { return $value; }
require_once dirname(__DIR__) . '/vendor/autoload.php';
$cid='https://chatgpt.com/oauth/client.json';
$doc=[
 'client_id'=>$cid,
 'token_endpoint_auth_method'=>'private_key_jwt',
 'token_endpoint_auth_methods_supported'=>['none','private_key_jwt'],
 'redirect_uris'=>['https://chatgpt.com/connector_platform_oauth_redirect'],
 'grant_types'=>['authorization_code','refresh_token'],
 'client_name'=>'ChatGPT'
];
$r=(new ReflectionClass(\WPMedia\MCP\OAuth\Auth\CimdResolver::class))->newInstanceWithoutConstructor();
$m=(new ReflectionClass(\WPMedia\MCP\OAuth\Auth\CimdResolver::class))->getMethod('validate_document');
$resolved=$m->invoke($r,$doc,$cid);
if(!is_array($resolved)||($resolved['token_endpoint_auth_method']??null)!=='none')exit("FAIL method intersection\n");
$v=(new ReflectionClass(\WPMedia\MCP\OAuth\Auth\ClaudeClientVerifier::class))->newInstanceWithoutConstructor();
$vm=(new ReflectionClass(\WPMedia\MCP\OAuth\Auth\ClaudeClientVerifier::class))->getMethod('matches_publisher');
$cfg=['client_ids'=>[$cid],'host'=>'chatgpt.com'];
if(true!==$vm->invoke($v,$cid,$doc,$cfg))exit("FAIL trusted client\n");
$bad=$doc;$bad['token_endpoint_auth_methods_supported']=['private_key_jwt'];
if(null!==$m->invoke($r,$bad,$cid))exit("FAIL private-only method accepted\n");
if(false!==$vm->invoke($v,$cid,$bad,$cfg))exit("FAIL private-only trusted\n");
$bad=$doc;$bad['client_id']='https://attacker.example.org/client.json';
if(null!==$m->invoke($r,$bad,$cid))exit("FAIL client ID mismatch\n");
echo "FWB_REG02B_CIMD_PATCH 5/5 PASS\n";
