<?php
/**
 * REG-02C test-only CIMD fixture. Loaded ONLY by disposable wp-env installation.
 * No production use; this substitutes the public client metadata response
 * with the exact, reviewed ChatGPT fields to remove network flakes.
 */
if ( ! defined( 'ABSPATH' ) || wp_get_environment_type() !== 'local' ) {
	return;
}
add_filter( 'pre_http_request', static function ( $response, $args, $url ) {
	if ( $url !== 'https://chatgpt.com/oauth/client.json' ) {
		return $response;
	}
	$metadata = array(
		'client_id' => 'https://chatgpt.com/oauth/client.json',
		'client_uri' => 'https://chatgpt.com/',
		'redirect_uris' => array( 'https://chatgpt.com/connector_platform_oauth_redirect' ),
		'token_endpoint_auth_method' => 'private_key_jwt',
		'token_endpoint_auth_methods_supported' => array( 'none', 'private_key_jwt' ),
		'grant_types' => array( 'authorization_code', 'refresh_token', 'urn:ietf:params:oauth:grant-type:jwt-bearer' ),
		'response_types' => array( 'code' ),
		'client_name' => 'ChatGPT',
		'jwks_uri' => 'https://chatgpt.com/oauth/jwks.json',
	);
	return array(
		'headers' => array( 'content-type' => 'application/json' ),
		'body' => wp_json_encode( $metadata ),
		'response' => array( 'code' => 200, 'message' => 'OK' ),
		'cookies' => array(),
		'filename' => null,
	);
}, 10, 3 );
