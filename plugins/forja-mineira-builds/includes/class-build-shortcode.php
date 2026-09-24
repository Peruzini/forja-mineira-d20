<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMB_Build_Shortcode {
    private static $assets_loaded = false;

    public static function register() {
        add_shortcode( 'forja_build', array( __CLASS__, 'render' ) );
        add_shortcode( 'forja_builds_hub', array( __CLASS__, 'render_hub' ) );
        add_shortcode( 'forja_home_featured_build', array( __CLASS__, 'render_home_featured' ) );
        add_shortcode( 'forja_home_hero', array( __CLASS__, 'render_home_hero' ) );
        add_shortcode( 'forja_home_next_build', array( __CLASS__, 'render_home_next_build' ) );
        add_shortcode( 'forja_home_build_cycle', array( __CLASS__, 'render_home_build_cycle' ) );
        add_shortcode( 'forja_home_featured_guide', array( __CLASS__, 'render_home_featured_guide' ) );
    }

    private static function enqueue_assets() {
        if ( self::$assets_loaded ) { return; }
        $css = FMB_PATH . 'assets/css/builds.css';
        wp_enqueue_style(
            'forja-mineira-builds',
            FMB_URL . 'assets/css/builds.css',
            array(),
            file_exists( $css ) ? (string) filemtime( $css ) : FMB_VERSION
        );

        $js = FMB_PATH . 'assets/js/builds.js';
        wp_enqueue_script(
            'forja-mineira-builds',
            FMB_URL . 'assets/js/builds.js',
            array(),
            file_exists( $js ) ? (string) filemtime( $js ) : FMB_VERSION,
            true
        );

        self::$assets_loaded = true;
    }

    private static function default_guide_url() {
        $slugs = array( 'guia-bruxo-5e-2024', 'bruxo-5e-2024', 'guia-do-bruxo' );
        foreach ( $slugs as $slug ) {
            $page = get_page_by_path( $slug );
            if ( $page ) { return get_permalink( $page ); }
        }
        return home_url( '/?s=Bruxo' );
    }


    public static function render_hub( $atts ) {
        $atts = shortcode_atts(
            array(
                'voldemort_url' => '',
                'guia_url'      => '',
            ),
            $atts,
            'forja_builds_hub'
        );

        self::enqueue_assets();

        $hub_build_url = ! empty( $atts['voldemort_url'] )
            ? esc_url_raw( $atts['voldemort_url'] )
            : home_url( '/voldemort-dnd-5e-build-bruxo/' );

        $hub_guide_url = ! empty( $atts['guia_url'] )
            ? esc_url_raw( $atts['guia_url'] )
            : self::default_guide_url();

        ob_start();
        include FMB_PATH . 'templates/builds-hub.php';
        return ob_get_clean();
    }

    public static function render_home_featured_guide( $atts ) {
        $atts = shortcode_atts(
            array(
                'guide_url'   => '',
                'guide_image' => '',
            ),
            $atts,
            'forja_home_featured_guide'
        );

        self::enqueue_assets();

        $featured_guide_url = ! empty( $atts['guide_url'] )
            ? esc_url_raw( $atts['guide_url'] )
            : '';

        $featured_guide_image = ! empty( $atts['guide_image'] )
            ? esc_url_raw( $atts['guide_image'] )
            : FMB_URL . 'assets/images/home-featured-guide-warlock-items.webp?ver=' . FMB_VERSION;

        ob_start();
        include FMB_PATH . 'templates/home-featured-guide.php';
        return ob_get_clean();
    }

    public static function render_home_build_cycle( $atts ) {
        $atts = shortcode_atts(
            array(
                'current_url'   => '',
                'current_image' => '',
                'next_image'    => '',
                'guts_image'    => '',
                'duncan_image'  => '',
                'trevor_image'  => '',
            ),
            $atts,
            'forja_home_build_cycle'
        );

        self::enqueue_assets();

        $cycle_current_url = ! empty( $atts['current_url'] )
            ? esc_url_raw( $atts['current_url'] )
            : home_url( '/voldemort-dnd-5e-build-bruxo/' );

        $cycle_current_image = ! empty( $atts['current_image'] )
            ? esc_url_raw( $atts['current_image'] )
            : FMB_URL . 'assets/images/voldemort-l17-img1-bffe22434a23.webp?ver=' . FMB_VERSION;

        $cycle_next_image = ! empty( $atts['next_image'] )
            ? esc_url_raw( $atts['next_image'] )
            : FMB_URL . 'assets/images/home-next-build-mystery-final.webp?ver=' . FMB_VERSION;

        $cycle_guts_image = ! empty( $atts['guts_image'] )
            ? esc_url_raw( $atts['guts_image'] )
            : FMB_URL . 'assets/images/home-vote-guts.webp?ver=' . FMB_VERSION;

        $cycle_duncan_image = ! empty( $atts['duncan_image'] )
            ? esc_url_raw( $atts['duncan_image'] )
            : FMB_URL . 'assets/images/home-vote-duncan.webp?ver=' . FMB_VERSION;

        $cycle_trevor_image = ! empty( $atts['trevor_image'] )
            ? esc_url_raw( $atts['trevor_image'] )
            : FMB_URL . 'assets/images/home-vote-trevor.webp?ver=' . FMB_VERSION;

        $cycle_poll_id       = class_exists( 'FMB_Build_Voting' ) ? FMB_Build_Voting::get_poll_id() : 1;
        $cycle_poll_open     = class_exists( 'FMB_Build_Voting' ) ? FMB_Build_Voting::is_open() : true;
        $cycle_vote_endpoint = class_exists( 'FMB_Build_Voting' ) ? FMB_Build_Voting::endpoint() : '';

        ob_start();
        include FMB_PATH . 'templates/home-build-cycle.php';
        return ob_get_clean();
    }

    public static function render_home_next_build( $atts ) {
        self::enqueue_assets();

        ob_start();
        include FMB_PATH . 'templates/home-next-build.php';
        return ob_get_clean();
    }

    public static function render_home_hero( $atts ) {
        $atts = shortcode_atts(
            array(
                'build_url'      => '',
                'builds_url'     => '',
                'tools_url'      => '',
                'guide_url'      => '',
            ),
            $atts,
            'forja_home_hero'
        );

        self::enqueue_assets();

        $home_build_url = ! empty( $atts['build_url'] )
            ? esc_url_raw( $atts['build_url'] )
            : home_url( '/voldemort-dnd-5e-build-bruxo/' );

        $home_builds_url = ! empty( $atts['builds_url'] )
            ? esc_url_raw( $atts['builds_url'] )
            : home_url( '/builds/' );

        $home_tools_url = ! empty( $atts['tools_url'] )
            ? esc_url_raw( $atts['tools_url'] )
            : home_url( '/ferramentas/' );

        $home_guide_url = ! empty( $atts['guide_url'] )
            ? esc_url_raw( $atts['guide_url'] )
            : home_url( '/melhores-itens-para-bruxo-dnd-5e/' );

        ob_start();
        include FMB_PATH . 'templates/home-hero.php';
        return ob_get_clean();
    }

    public static function render_home_featured( $atts ) {
        $atts = shortcode_atts(
            array(
                'build_url'  => '',
                'builds_url' => '',
            ),
            $atts,
            'forja_home_featured_build'
        );

        self::enqueue_assets();

        $home_build_url = ! empty( $atts['build_url'] )
            ? esc_url_raw( $atts['build_url'] )
            : home_url( '/voldemort-dnd-5e-build-bruxo/' );

        $home_builds_url = ! empty( $atts['builds_url'] )
            ? esc_url_raw( $atts['builds_url'] )
            : home_url( '/builds/' );

        ob_start();
        include FMB_PATH . 'templates/home-featured-build.php';
        return ob_get_clean();
    }

    public static function render( $atts ) {
        $atts = shortcode_atts(
            array(
                'nome'     => 'voldemort',
                'guia_url' => '',
            ),
            $atts,
            'forja_build'
        );

        if ( 'voldemort' !== sanitize_key( $atts['nome'] ) ) {
            return current_user_can( 'edit_posts' )
                ? '<div class="fmb-notice">Build não encontrada.</div>'
                : '';
        }

        self::enqueue_assets();
        $guide_url = ! empty( $atts['guia_url'] ) ? esc_url_raw( $atts['guia_url'] ) : self::default_guide_url();

        ob_start();
        include FMB_PATH . 'templates/voldemort.php';
        return ob_get_clean();
    }
}
