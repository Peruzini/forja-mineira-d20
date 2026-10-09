<?php
/**
 * Plugin Name: Forja Mineira D20 — Clusters
 * Plugin URI: https://forjamineirad20.com.br/
 * Description: Centraliza links internos estruturais entre conteúdos relacionados da Forja Mineira D20.
 * Version: 1.0.5
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-clusters
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'FMC_VERSION', '1.0.5' );
define( 'FMC_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMC_URL', plugin_dir_url( __FILE__ ) );

require_once FMC_PATH . 'includes/class-registry.php';
require_once FMC_PATH . 'includes/class-resolver.php';
require_once FMC_PATH . 'includes/class-relations.php';
require_once FMC_PATH . 'includes/class-renderer.php';
require_once FMC_PATH . 'includes/class-audit.php';

final class Forja_Mineira_Clusters {
    private static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( 'FMC_Renderer', 'register' ) );
        add_action( 'forja_d20_cluster_slot', array( 'FMC_Renderer', 'render_action' ), 10, 3 );
        add_action( 'save_post_page', array( 'FMC_Resolver', 'invalidate_cache' ) );
        add_action( 'admin_menu', array( 'FMC_Audit', 'register_admin_page' ) );
    }
}

Forja_Mineira_Clusters::instance();
