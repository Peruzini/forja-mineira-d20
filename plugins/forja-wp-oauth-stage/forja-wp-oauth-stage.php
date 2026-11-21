<?php
/**
 * Plugin Name: Forja WP Bridge — OAuth Staging Adapter
 * Description: OAuth 2.1 + WordPress MCP Abilities test adapter. Disabled unless explicit staging gates pass.
 * Version: 0.1.0
 * Requires at least: 6.9
 * Requires PHP: 8.1
 * License: GPL-2.0-or-later
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Integration gate: never run on the live Forja site, even if someone sets
 * a constant in production. Staging must have explicit compatibility proof.
 */
function fwb_reg02b_enabled() {
	if ( ! defined( 'FWB_REG02B_OAUTH_STAGING' ) || true !== FWB_REG02B_OAUTH_STAGING ) {
		return false;
	}
	if ( ! defined( 'FWB_REG02B_CIMD_COMPAT_PATCHED' ) || true !== FWB_REG02B_CIMD_COMPAT_PATCHED ) {
		return false;
	}
	if ( ! function_exists( 'wp_get_environment_type' ) ||
		! in_array( wp_get_environment_type(), array( 'staging', 'local' ), true ) ) {
		return false;
	}
	if ( ! function_exists( 'home_url' ) || ! function_exists( 'wp_parse_url' ) ) {
		return false;
	}
	$host = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
	if ( '' === $host || in_array( $host, array( 'forjamineirad20.com.br', 'www.forjamineirad20.com.br' ), true ) ) {
		return false;
	}
	return true;
}

/** Only accept an EXACT ChatGPT CIMD URL supplied after OpenAI reveals the callback mode. */
function fwb_reg02b_client_id() {
	if ( ! defined( 'FWB_REG02B_CHATGPT_CIMD_URL' ) || ! is_string( FWB_REG02B_CHATGPT_CIMD_URL ) ) {
		return '';
	}
	$client = FWB_REG02B_CHATGPT_CIMD_URL;
	return preg_match( '~^https://chatgpt\.com/oauth/(?:client\.json|[a-zA-Z0-9_-]+/client\.json)$~D', $client ) ? $client : '';
}

function fwb_reg02b_trusted_publishers( $publishers ) {
	if ( ! fwb_reg02b_enabled() || '' === fwb_reg02b_client_id() ) {
		return $publishers;
	}
	$publishers['chatgpt-forja'] = array(
		'client_ids' => array( fwb_reg02b_client_id() ),
		'host'       => 'chatgpt.com',
	);
	return $publishers;
}

// Make absolutely no changes to other MCP plugins when this addon is disabled.
if ( fwb_reg02b_enabled() && '' !== fwb_reg02b_client_id() ) {
	add_filter( 'wpmedia_mcp_oauth_server_enabled', 'fwb_reg02b_enabled', PHP_INT_MAX );
	add_filter( 'wpmedia_mcp_oauth_allow_untrusted_providers', '__return_false', PHP_INT_MAX );
	add_filter( 'wpmedia_mcp_oauth_trusted_publishers', 'fwb_reg02b_trusted_publishers', PHP_INT_MAX );
	// Disable the standard MCP Adapter Basic-auth endpoint in this staging only.
	add_filter( 'mcp_adapter_create_default_server', '__return_false', PHP_INT_MAX );
}

add_action( 'plugins_loaded', function () {
	if ( ! fwb_reg02b_enabled() || '' === fwb_reg02b_client_id() ) {
		return;
	}
	// Explicitly fail closed if a compiled vendor tree isn't present.
	$autoload = __DIR__ . '/vendor/autoload.php';
	if ( ! is_file( $autoload ) ) {
		return;
	}
	require_once $autoload;
	if ( class_exists( '\\WPMedia\\MCP\\OAuth\\Bootstrap' ) &&
		class_exists( '\\WP\\MCP\\Core\\McpAdapter' ) ) {
		\WPMedia\MCP\OAuth\Bootstrap::instance();
	}
}, 10 );

// WordPress canonical redirects must not rewrite OAuth discovery paths.
// Disabled outside of the explicit staging-only REG-02B gate.
if ( fwb_reg02b_enabled() && '' !== fwb_reg02b_client_id() ) {
	add_filter( 'redirect_canonical', static function ( $redirect, $requested_url ) {
		$path = (string) wp_parse_url( $requested_url, PHP_URL_PATH );
		if ( in_array( $path, array(
			'/.well-known/oauth-protected-resource',
			'/.well-known/oauth-authorization-server',
			'/oauth/authorize',
			'/oauth/authorize-callback',
			'/oauth/consent',
			'/oauth/token',
			'/oauth/revoke',
		), true ) ) {
			return false;
		}
		return $redirect;
	}, PHP_INT_MAX, 2 );
}

require_once __DIR__ . '/includes/class-fwb-reg02b-abilities.php';
add_action( 'wp_abilities_api_categories_init', array( 'FWB_REG02B_Abilities', 'register_category' ) );
add_action( 'wp_abilities_api_init', array( 'FWB_REG02B_Abilities', 'register' ) );
