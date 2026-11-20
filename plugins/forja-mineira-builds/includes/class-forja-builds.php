<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class Forja_Mineira_Builds {
    private static $instance = null;
    private $active = false;
    private $hub_active = false;
    private $active_build = 'voldemort';

    public static function instance() {
        if ( null === self::$instance ) { self::$instance = new self(); }
        return self::$instance;
    }

    private function __construct() {
        add_action( 'init', array( 'FMB_Build_Shortcode', 'register' ) );
        add_action( 'wp', array( $this, 'detect_shortcode' ) );
        add_filter( 'pre_get_document_title', array( $this, 'document_title' ) );
        add_action( 'wp_head', array( $this, 'meta_description' ), 5 );
    }

    public function detect_shortcode() {
        if ( ! is_singular() ) { return; }
        global $post;
        $this->active = (bool) ( $post && has_shortcode( $post->post_content, 'forja_build' ) );
        $this->active_build = 'voldemort';
        // Detectar o shortcode real; a presença do hub não ativa SEO de build.
        if ( $this->active && preg_match( '/' . get_shortcode_regex( array( 'forja_build' ) ) . '/s', $post->post_content, $match ) ) {
            $attrs = shortcode_parse_atts( $match[3] );
            $name = sanitize_key( isset( $attrs['nome'] ) ? $attrs['nome'] : 'voldemort' );
            if ( 'doutor-destino' === $name ) {
                $this->active_build = 'doutor-destino';
            }
        }
        $this->hub_active = (bool) ( $post && has_shortcode( $post->post_content, 'forja_builds_hub' ) );
    }

    public function document_title( $title ) {
        if ( $this->active ) {
            if ( 'doutor-destino' === $this->active_build ) {
                return 'Doutor Destino D&D 5e: Build Artífice 3 / Mago 17 | Forja Mineira D20';
            }
            return 'Voldemort D&D 5e: Build de Bruxo 1–20 | Forja Mineira D20';
        }
        if ( $this->hub_active ) {
            return 'Builds de D&D 5e | Forja Mineira D20';
        }
        return $title;
    }

    public function meta_description() {
        if ( ! $this->active && ! $this->hub_active ) { return; }

        $desc = $this->hub_active
            ? 'Builds completas de D&D 5e no Forja Mineira D20, com progressão do nível 1 ao 20, estratégia, magias, talentos e equipamentos.'
            : 'Voldemort D&D 5e em uma build completa de Bruxo 2024 do nível 1 ao 20, com magias, invocações, talentos, estratégia e itens recomendados.';

        if ( $this->active && 'doutor-destino' === $this->active_build ) {
            $desc = 'Doutor Destino em D&D 2024/2025: build completa de Artífice 3 / Mago 17, do nível 1 ao 20, com magias, estratégias e equipamentos desejáveis.';
        }

        echo "\n<meta name=\"description\" content=\"" . esc_attr( $desc ) . "\">\n";
    }
}
