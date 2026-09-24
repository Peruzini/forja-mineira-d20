<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class Forja_Mineira_Builds {
    private static $instance = null;
    private $active = false;
    private $hub_active = false;

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
        $this->hub_active = (bool) ( $post && has_shortcode( $post->post_content, 'forja_builds_hub' ) );
    }

    public function document_title( $title ) {
        if ( $this->active ) {
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

        echo "\n<meta name=\"description\" content=\"" . esc_attr( $desc ) . "\">\n";
    }
}
