<?php
/**
 * Plugin Name: Forja WP Bridge
 * Description: Interface restrita e autenticada para preparar rascunhos editoriais da Forja Mineira D20.
 * Version: 0.1.0
 * Requires at least: 6.9
 * Requires PHP: 8.1
 * Author: Forja Mineira D20
 * Text Domain: forja-wp-bridge
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'FWB_VERSION', '0.1.0' );

require_once __DIR__ . '/includes/class-fwb-validator.php';
require_once __DIR__ . '/includes/class-fwb-rest-controller.php';

add_action( 'rest_api_init', array( 'FWB_REST_Controller', 'register_routes' ) );
