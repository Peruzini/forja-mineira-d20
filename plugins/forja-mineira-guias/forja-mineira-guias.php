<?php
/**
 * Plugin Name: Forja Mineira D20 — Guias
 * Description: Guias editoriais e Hub de Guias da Forja Mineira D20.
 * Version: 1.1.0
 * Author: Forja Mineira D20
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'FMG_VERSION', '1.1.0' );
define( 'FMG_PATH', plugin_dir_path( __FILE__ ) );
define( 'FMG_URL', plugin_dir_url( __FILE__ ) );

function fmg_page_has_shortcode( $shortcode ) {
    if ( ! is_singular() ) {
        return false;
    }

    global $post;
    return $post && has_shortcode( $post->post_content, $shortcode );
}

function fmg_has_warlock_items_guide() {
    return fmg_page_has_shortcode( 'forja_guia_itens_bruxo_1_5' );
}

function fmg_has_guides_hub() {
    return fmg_page_has_shortcode( 'forja_guias_hub' );
}

function fmg_find_page_by_shortcode( $shortcode, $fallback = '' ) {
    global $wpdb;

    $needle = '%[' . $wpdb->esc_like( $shortcode ) . '%';
    $page_id = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT ID
             FROM {$wpdb->posts}
             WHERE post_type = 'page'
               AND post_status = 'publish'
               AND post_content LIKE %s
             ORDER BY post_modified_gmt DESC
             LIMIT 1",
            $needle
        )
    );

    if ( $page_id ) {
        return get_permalink( (int) $page_id );
    }

    return $fallback;
}

function fmg_enqueue_assets() {
    wp_enqueue_style(
        'forja-mineira-guias',
        FMG_URL . 'assets/css/guide-warlock-items.css',
        array(),
        FMG_VERSION
    );
}

function fmg_enqueue_hub_assets() {
    wp_enqueue_style(
        'forja-mineira-guias-hub',
        FMG_URL . 'assets/css/guides-hub.css',
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

function fmg_render_guides_hub( $atts = array() ) {
    $atts = shortcode_atts(
        array(
            'invocacoes_url' => '',
            'itens_url'      => '',
        ),
        $atts,
        'forja_guias_hub'
    );

    fmg_enqueue_hub_assets();

    $hub_invocations_url = ! empty( $atts['invocacoes_url'] )
        ? esc_url_raw( $atts['invocacoes_url'] )
        : fmg_find_page_by_shortcode(
            'forja_guia_invocacoes_bruxo_2024',
            add_query_arg( 's', 'Invocações Místicas Bruxo', home_url( '/' ) )
        );

    $hub_items_url = ! empty( $atts['itens_url'] )
        ? esc_url_raw( $atts['itens_url'] )
        : home_url( '/melhores-itens-para-bruxo-dnd-5e/' );

    $hub_invocations_image = FMG_URL . 'assets/images/guia-invocacoes-bruxo-2024.webp?ver=' . FMG_VERSION;
    $hub_items_image       = FMG_URL . 'assets/images/guia-itens-bruxo-1-5.webp?ver=' . FMG_VERSION;

    ob_start();
    include FMG_PATH . 'templates/guides-hub.php';
    return ob_get_clean();
}
add_shortcode( 'forja_guias_hub', 'fmg_render_guides_hub' );

/* SEO básico apenas nas páginas dos shortcodes deste plugin. */
add_filter( 'document_title_parts', function( $parts ) {
    if ( fmg_has_guides_hub() ) {
        $parts['title'] = 'Guias de RPG para D&D 5e 2024';
    } elseif ( fmg_has_warlock_items_guide() ) {
        $parts['title'] = 'Melhores Itens para Bruxo D&D 5e: Níveis 1–5';
    }
    return $parts;
} );

add_action( 'wp_head', function() {
    if ( fmg_has_guides_hub() ) {
        $description = 'Guias de RPG da Forja Mineira D20: D&D 5e 2024, Bruxo, Invocações Místicas, itens e conteúdo prático para levar direto à mesa.';
        echo "\n<meta name=\"description\" content=\"" . esc_attr( $description ) . "\">\n";

        $data = array(
            '@context' => 'https://schema.org',
            '@type' => 'CollectionPage',
            'name' => 'Guias de RPG — Forja Mineira D20',
            'description' => $description,
            'inLanguage' => 'pt-BR',
            'publisher' => array(
                '@type' => 'Organization',
                'name' => 'Forja Mineira D20',
            ),
        );

        echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
        return;
    }

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
