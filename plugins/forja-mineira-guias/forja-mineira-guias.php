<?php
/**
 * Plugin Name: Forja Mineira D20 — Guias
 * Description: Guias editoriais independentes da Forja Mineira D20.
 * Version: 1.0.0
 * Author: Forja Mineira D20
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'FMG_VERSION', '1.0.0' );
define( 'FMG_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMG_URL', plugin_dir_url( __FILE__ ) );

function fmg_has_warlock_items_guide() {
    if ( ! is_singular() ) {
        return false;
    }

    global $post;
    return $post && has_shortcode( $post->post_content, 'forja_guia_itens_bruxo_1_5' );
}

function fmg_enqueue_assets() {
    wp_enqueue_style(
        'forja-mineira-guias',
        FMG_URL . 'assets/css/guide-warlock-items.css',
        array(),
        FMG_VERSION
    );
}

function fmg_render_warlock_items_guide( $atts = array() ) {
    fmg_enqueue_assets();

    $guide_art = FMG_URL . 'assets/images/guia-itens-bruxo-1-5.webp?ver=' . FMG_VERSION;

    ob_start();
    include FMG_PATH . 'templates/guide-warlock-items.php';
    return ob_get_clean();
}
add_shortcode( 'forja_guia_itens_bruxo_1_5', 'fmg_render_warlock_items_guide' );

/* SEO básico apenas na página que usa este shortcode. */
add_filter( 'document_title_parts', function( $parts ) {
    if ( fmg_has_warlock_items_guide() ) {
        $parts['title'] = 'Melhores Itens para Bruxo D&D 5e: Níveis 1–5';
    }
    return $parts;
} );

add_action( 'wp_head', function() {
    if ( ! fmg_has_warlock_items_guide() ) {
        return;
    }

    $description = 'Guia de itens para Bruxo em D&D 5e 2024 nos níveis 1 a 5: equipamentos iniciais, melhorias de defesa, itens mágicos e prioridades para seus primeiros níveis.';
    echo "\n<meta name=\"description\" content=\"" . esc_attr( $description ) . "\">\n";

    $data = array(
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => 'Melhores Itens para Bruxo D&D 5e: Níveis 1–5',
        'description' => $description,
        'inLanguage' => 'pt-BR',
        'publisher' => array(
            '@type' => 'Organization',
            'name' => 'Forja Mineira D20',
        ),
    );

    echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
}, 20 );
