<?php
/**
 * Plugin Name: Forja Mineira D20 — Guia de Talentos
 * Plugin URI: https://forjamineirad20.com.br/
 * Description: Guia interativo de Talentos para Bruxo D&D 2024/5.5e. Inclui catálogo de 195 talentos, filtros Core/Arcana, progressão, escolhas por build e comparador de armas. Visual responsivo homologado.
 * Version: 1.2.1
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-guia-talentos
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! defined( 'FMTG_VERSION' ) ) { define( 'FMTG_VERSION', '1.2.1' ); }
if ( ! defined( 'FMTG_PATH' ) ) { define( 'FMTG_PATH', plugin_dir_path( __FILE__ ) ); }
if ( ! defined( 'FMTG_URL' ) ) { define( 'FMTG_URL', plugin_dir_url( __FILE__ ) ); }

/** Identifies guide pages without relying on a hard-coded page ID. */
function fmtg_has_guide() {
    if ( ! is_singular() ) { return false; }
    $post = get_post();
    return $post && ! empty( $post->post_content ) && has_shortcode( $post->post_content, 'forja_guia_talentos_bruxo_2024' );
}

/** Compatibility wrapper: keeps the original public function name. */
function fmtg_enqueue_assets() {
    $base = FMTG_PATH . 'assets/';
    $url  = FMTG_URL . 'assets/';
    $css  = $base . 'css/guia-talentos.css';
    $js   = $base . 'js/guia-talentos.js';

    if ( is_readable( $css ) ) {
        wp_enqueue_style(
            'forja-mineira-guia-talentos',
            $url . 'css/guia-talentos.css',
            array(),
            (string) filemtime( $css )
        );
    }
    if ( is_readable( $js ) ) {
        wp_enqueue_script(
            'forja-mineira-guia-talentos',
            $url . 'js/guia-talentos.js',
            array(),
            (string) filemtime( $js ),
            true
        );
    }
}

/** Keeps the canonical shortcode; template and assets are bundled locally. */
function fmtg_render_guide( $atts = array() ) {
    $template = FMTG_PATH . 'templates/guia-talentos.php';
    if ( ! is_readable( $template ) ) { return ''; }
    fmtg_enqueue_assets();
    ob_start();
    include $template;
    return (string) ob_get_clean();
}

add_shortcode( 'forja_guia_talentos_bruxo_2024', 'fmtg_render_guide' );

add_action( 'wp_enqueue_scripts', function() {
    if ( fmtg_has_guide() ) { fmtg_enqueue_assets(); }
}, 20 );

add_filter( 'body_class', function( $classes ) {
    if ( fmtg_has_guide() ) { $classes[] = 'fmtg-guide-page'; }
    return $classes;
} );

add_filter( 'document_title_parts', function( $parts ) {
    if ( fmtg_has_guide() ) {
        $parts['title'] = 'Melhores Talentos para Bruxo D&D 2024/5.5e';
    }
    return $parts;
} );
