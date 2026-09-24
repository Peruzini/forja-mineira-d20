<?php
/**
 * Plugin Name: Forja Mineira — Builds
 * Plugin URI: https://forjamineirad20.com.br/
 * Description: Build completa de Bruxo 1–20 para o Forja Mineira D20, com progressão visual, magias, invocações, Arcanos Místicos e wishlist de itens.
 * Version: 2.3.21
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-builds
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'FMB_VERSION', '2.3.21' );
define( 'FMB_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMB_URL', plugin_dir_url( __FILE__ ) );

require_once FMB_PATH . 'includes/class-forja-builds.php';
require_once FMB_PATH . 'includes/class-build-shortcode.php';
require_once FMB_PATH . 'includes/class-build-voting.php';

Forja_Mineira_Builds::instance();
FMB_Build_Voting::init();
