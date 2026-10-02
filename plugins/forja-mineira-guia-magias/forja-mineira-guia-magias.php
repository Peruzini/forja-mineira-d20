<?php
/**
 * Plugin Name: Forja Mineira D20 — Guia de Magias
 * Plugin URI: https://forjamineirad20.com.br/
 * Description: Guia interativo das melhores Magias para Bruxo em D&D 5e 2024, com 94 magias, filtros e análise mestre–detalhe.
 * Version: 1.0.5
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-guia-magias
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'FMMG_VERSION', '1.0.5' );
define( 'FMMG_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMMG_URL', plugin_dir_url( __FILE__ ) );

function fmmg_has_guide() {
    if ( ! is_singular() ) { return false; }
    global $post;
    return $post && has_shortcode( $post->post_content, 'forja_guia_magias_bruxo_2024' );
}

add_filter( 'body_class', function( $classes ) {
    if ( fmmg_has_guide() ) { $classes[] = 'fmmg-guide-page'; }
    return $classes;
} );

function fmmg_enqueue_assets() {
    $css = FMMG_PATH . 'assets/css/guide-spells.css';
    $js  = FMMG_PATH . 'assets/js/guide-spells.js';

    wp_enqueue_style(
        'forja-mineira-guia-magias',
        FMMG_URL . 'assets/css/guide-spells.css',
        array(),
        file_exists( $css ) ? (string) filemtime( $css ) : FMMG_VERSION
    );

    wp_enqueue_script(
        'forja-mineira-guia-magias',
        FMMG_URL . 'assets/js/guide-spells.js',
        array(),
        file_exists( $js ) ? (string) filemtime( $js ) : FMMG_VERSION,
        true
    );
}

add_action( 'wp_enqueue_scripts', function() {
    if ( fmmg_has_guide() ) {
        fmmg_enqueue_assets();
    }
} );

function fmmg_render_guide( $atts = array() ) {
    $atts = shortcode_atts(
        array(
            'items_url'  => 'https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/',
            'build_url'  => 'https://forjamineirad20.com.br/voldemort-dnd-5e-build-bruxo/',
            'guides_url' => 'https://forjamineirad20.com.br/guias/',
        ),
        $atts,
        'forja_guia_magias_bruxo_2024'
    );

    fmmg_enqueue_assets();

    $items_url  = esc_url_raw( $atts['items_url'] );
    $build_url  = esc_url_raw( $atts['build_url'] );
    $guides_url = esc_url_raw( $atts['guides_url'] );
    $asset_base = FMMG_URL . 'assets/';

    ob_start();
    include FMMG_PATH . 'templates/guide-spells.php';
    return ob_get_clean();
}
add_shortcode( 'forja_guia_magias_bruxo_2024', 'fmmg_render_guide' );

add_filter( 'document_title_parts', function( $parts ) {
    if ( fmmg_has_guide() ) {
        $parts['title'] = 'Melhores Magias para Bruxo D&D 5e 2024';
    }
    return $parts;
} );

add_action( 'wp_head', function() {
    if ( ! fmmg_has_guide() ) { return; }

    $description = 'Compare 94 Magias para Bruxo em D&D 5e 2024 por nível, função, escola, fonte e prioridade, com mecânicas, sinergias e análise contextual.';

    echo "\n<meta name=\"description\" content=\"" . esc_attr( $description ) . "\">\n";

    $article = array(
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => 'Melhores Magias para Bruxo D&D 5e 2024',
        'description' => $description,
        'inLanguage' => 'pt-BR',
        'publisher' => array(
            '@type' => 'Organization',
            'name' => 'Forja Mineira D20',
            'url' => 'https://forjamineirad20.com.br/',
        ),
        'mainEntityOfPage' => get_permalink(),
        'image' => FMMG_URL . 'assets/images/guia-magias-bruxo-hero-aprovado.webp',
    );

    echo '<script type="application/ld+json">' .
        wp_json_encode( $article, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) .
        '</script>' . "\n";
}, 20 );