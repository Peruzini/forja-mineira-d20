<?php
/**
 * Plugin Name: Forja Mineira D20 — Guia de Invocações
 * Plugin URI: https://forjamineirad20.com.br/
 * Description: Guia editorial das melhores Invocações Místicas para Bruxo em D&D 5e 2024, organizado por nível, função e mini builds navegáveis.
 * Version: 1.2.0
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-guia-invocacoes
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'FMGI_VERSION', '1.2.0' );
define( 'FMGI_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMGI_URL', plugin_dir_url( __FILE__ ) );

function fmgi_has_guide() {
    if ( ! is_singular() ) { return false; }
    global $post;
    return $post && has_shortcode( $post->post_content, 'forja_guia_invocacoes_bruxo_2024' );
}

/* Marca apenas a página do guia para neutralizar o título nativo do tema. */
add_filter( 'body_class', function( $classes ) {
    if ( fmgi_has_guide() ) {
        $classes[] = 'fmgi-guide-page';
    }
    return $classes;
} );

function fmgi_enqueue_assets() {
    $css = FMGI_PATH . 'assets/css/guide-invocations.css';
    $js  = FMGI_PATH . 'assets/js/guide-invocations.js';

    wp_enqueue_style(
        'forja-mineira-guia-invocacoes',
        FMGI_URL . 'assets/css/guide-invocations.css',
        array(),
        file_exists( $css ) ? (string) filemtime( $css ) : FMGI_VERSION
    );

    wp_enqueue_script(
        'forja-mineira-guia-invocacoes',
        FMGI_URL . 'assets/js/guide-invocations.js',
        array(),
        file_exists( $js ) ? (string) filemtime( $js ) : FMGI_VERSION,
        true
    );
}

function fmgi_render_guide( $atts = array() ) {
    $atts = shortcode_atts(
        array(
            'build_url' => 'https://forjamineirad20.com.br/voldemort-dnd-5e-build-bruxo/',
            'items_url' => 'https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/',
        ),
        $atts,
        'forja_guia_invocacoes_bruxo_2024'
    );

    fmgi_enqueue_assets();

    $build_url = esc_url_raw( $atts['build_url'] );
    $items_url = esc_url_raw( $atts['items_url'] );
    $blueprint_images = array(
        'rajada'   => FMGI_URL . 'assets/images/blueprints/rajada-blueprint.webp?ver=' . FMGI_VERSION,
        'lamina'   => FMGI_URL . 'assets/images/blueprints/lamina-blueprint.webp?ver=' . FMGI_VERSION,
        'tomo'     => FMGI_URL . 'assets/images/blueprints/tomo-blueprint.webp?ver=' . FMGI_VERSION,
        'corrente' => FMGI_URL . 'assets/images/blueprints/corrente-blueprint.webp?ver=' . FMGI_VERSION,
    );

    $corrente_images = array(
        'sphinx' => FMGI_URL . 'assets/images/corrente/corrente-sphinx.webp?ver=' . FMGI_VERSION,
        'raven'  => FMGI_URL . 'assets/images/corrente/corrente-raven-skill.webp?ver=' . FMGI_VERSION,
    );

    ob_start();
    include FMGI_PATH . 'templates/guide-invocations.php';
    return ob_get_clean();
}
add_shortcode( 'forja_guia_invocacoes_bruxo_2024', 'fmgi_render_guide' );

add_filter( 'document_title_parts', function( $parts ) {
    if ( fmgi_has_guide() ) {
        $parts['title'] = 'Melhores Invocações Místicas para Bruxo D&D 5e 2024 — Guia por Nível e Build';
    }
    return $parts;
} );

add_action( 'wp_head', function() {
    if ( ! fmgi_has_guide() ) { return; }

    $description = 'Guia de Invocações Místicas para Bruxo em D&D 5e 2024: filtros por nível, estilo e função, análises contextuais e mini builds de Rajada, Lâmina, Tomo e Corrente.';

    echo "\n<meta name=\"description\" content=\"" . esc_attr( $description ) . "\">\n";

    $article = array(
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => 'Melhores Invocações Místicas para Bruxo D&D 5e 2024 — Guia por Nível e Build',
        'description' => $description,
        'inLanguage' => 'pt-BR',
        'publisher' => array(
            '@type' => 'Organization',
            'name' => 'Forja Mineira D20',
            'url' => 'https://forjamineirad20.com.br/',
        ),
        'mainEntityOfPage' => get_permalink(),
    );

    echo '<script type="application/ld+json">' .
        wp_json_encode( $article, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) .
        '</script>' . "\n";
}, 20 );