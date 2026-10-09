<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMC_Renderer {
    private static $assets_loaded = false;

    public static function register() {
        add_shortcode( 'forja_cluster', array( __CLASS__, 'shortcode' ) );
    }

    public static function shortcode( $atts ) {
        $atts = shortcode_atts(
            array(
                'cluster' => 'bruxo',
                'atual' => '',
                'titulo' => '',
            ),
            $atts,
            'forja_cluster'
        );

        return self::render(
            sanitize_key( $atts['cluster'] ),
            sanitize_key( $atts['atual'] ),
            sanitize_text_field( $atts['titulo'] )
        );
    }

    public static function render_action( $cluster = 'bruxo', $current = '', $args = array() ) {
        $title = is_array( $args ) && ! empty( $args['title'] ) ? sanitize_text_field( $args['title'] ) : '';
        echo self::render( sanitize_key( $cluster ), sanitize_key( $current ), $title ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    public static function render( $cluster_id = 'bruxo', $current_node = '', $custom_title = '' ) {
        $cluster = FMC_Registry::get_cluster( $cluster_id );
        if ( ! $cluster ) { return ''; }

        if ( ! $current_node ) {
            $current_node = FMC_Resolver::current_node( $cluster_id );
        }
        if ( ! $current_node || ! FMC_Registry::get_node( $cluster_id, $current_node ) ) { return ''; }

        $related = FMC_Relations::related( $cluster_id, $current_node );
        if ( empty( $related ) ) { return ''; }

        self::enqueue_assets();

        $cluster_label = ! empty( $cluster['label'] ) ? $cluster['label'] : ucfirst( $cluster_id );
        $title = $custom_title ? $custom_title : 'Continue explorando seu Bruxo.';

        ob_start();
        include FMC_PATH . 'templates/related-content.php';
        return ob_get_clean();
    }

    public static function icon_url( $item ) {
        $icon = ! empty( $item['icon'] ) ? sanitize_file_name( $item['icon'] ) : '';
        if ( ! $icon ) { return ''; }

        $path = FMC_PATH . 'assets/images/' . $icon;
        if ( ! file_exists( $path ) ) { return ''; }

        return FMC_URL . 'assets/images/' . $icon . '?ver=' . FMC_VERSION;
    }

    public static function card_variant( $item ) {
        if ( ! empty( $item['variant'] ) ) {
            return sanitize_html_class( $item['variant'] );
        }
        return 'guide';
    }

    private static function enqueue_assets() {
        if ( self::$assets_loaded ) { return; }
        $css = FMC_PATH . 'assets/css/clusters.css';
        wp_enqueue_style(
            'forja-mineira-clusters',
            FMC_URL . 'assets/css/clusters.css',
            array(),
            file_exists( $css ) ? (string) filemtime( $css ) : FMC_VERSION
        );
        self::$assets_loaded = true;
    }
}
