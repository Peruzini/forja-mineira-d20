<?php
/**
 * Plugin Name: Forja Mineira D20 — Itens para Conjuradores
 * Description: Guia modular e independente de itens mágicos Core 2024 (UX-IC-05-R6), com shortcode reutilizável para novas telas.
 * Version: 1.0.7
 * Author: Forja Mineira D20
 * Text Domain: forja-itens-conjuradores
 */
if (!defined('ABSPATH')) { exit; }

define('FMIC_VERSION','1.0.7');
define('FMIC_PATH', plugin_dir_path(__FILE__));
define('FMIC_URL', plugin_dir_url(__FILE__));

/** Extensible screen registry compatible with published v1.0.5. */
function fmic_screens() {
    return array(
        'itens-conjuradores-r6'=>array(
            'shortcode'=>'forja_itens_conjuradores_2024',
            'template'=>'screens/itens-conjuradores-r6/content.php',
            'css'=>'assets/r6-perf.css',
            'js'=>'assets/r6.js',
        ),
    );
}
function fmic_enqueue_screen($screen_id) {
    $screens=fmic_screens();
    if(!isset($screens[$screen_id])) return;
    $screen=$screens[$screen_id];
    wp_enqueue_style('fmic-'.$screen_id, FMIC_URL.$screen['css'], array(), FMIC_VERSION);
    wp_enqueue_script('fmic-'.$screen_id, FMIC_URL.$screen['js'], array(), FMIC_VERSION, true);
}
function fmic_render_screen($screen_id) {
    $screens=fmic_screens();
    if(!isset($screens[$screen_id])) return '';
    static $rendered=array();
    if(isset($rendered[$screen_id])) return '<!-- Guia já renderizado nesta página: evita IDs e listeners duplicados -->';
    $rendered[$screen_id]=true;
    fmic_enqueue_screen($screen_id);
    ob_start();
    echo '<div class="fmic-screen-shell">';
    include FMIC_PATH.$screens[$screen_id]['template'];
    echo '</div>';
    // Reuse the existing Clusters plugin. Never duplicate its cards or registry.
    if ($screen_id === 'itens-conjuradores-r6' && shortcode_exists('forja_cluster')) {
        echo '<div class="fmic-related-slot">';
        echo do_shortcode('[forja_cluster cluster="bruxo" atual="itens" titulo="Continue explorando os guias da Forja"]');
        echo '</div>';
    }
    return ob_get_clean();
}
add_action('init',function(){
    foreach(fmic_screens() as $id=>$screen){
        add_shortcode($screen['shortcode'], static function() use($id) {return fmic_render_screen($id);});
    }
});
// Enqueue styles/scripts early, including the published page 334.
add_action('wp_enqueue_scripts', function(){
    if(!is_singular())return;
    $post=get_post();
    if(!$post instanceof WP_Post)return;
    foreach(fmic_screens() as $id=>$screen){
       if(has_shortcode($post->post_content,$screen['shortcode']))fmic_enqueue_screen($id);
    }
});

/** Preload the approved mobile Hero image only on pages using this shortcode.
 * The asset and media query exactly match the approved hotfix 0.1.3.
 * Do not affect other pages/plugins.
 */
add_action('wp_head', function() {
    if (!is_singular()) return;
    $post = get_post();
    if (!$post instanceof WP_Post || !has_shortcode($post->post_content, 'forja_itens_conjuradores_2024')) return;
    $url = esc_url(FMIC_URL . 'assets/hero-vaeros-mobile-960-v1.0.7.webp');
    echo '<link rel="preload" as="image" href="' . $url . '" media="(max-width: 850px)" fetchpriority="high" />' . "\n";
}, 1);
