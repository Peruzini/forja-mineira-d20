<?php
/**
 * Plugin Name: Forja Mineira D20 — Duncan, o Alto (TESTE)
 * Description: Build experimental Duncan 1–20. Shortcode proprio [forja_build_duncan], sem alterar o plugin original de Builds/Voldemort.
 * Version: 0.1.9
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Forja Mineira D20
 * Text Domain: forja-mineira-duncan
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! class_exists( 'FMD_Duncan_Test' ) ) {
    final class FMD_Duncan_Test {
        const VERSION = '0.1.9';
        const SHORTCODE = 'forja_build_duncan';

        public static function boot() {
            add_action( 'init', array( __CLASS__, 'register_shortcode' ) );
            add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_assets' ) );
        }

        public static function register_shortcode() {
            add_shortcode( self::SHORTCODE, array( __CLASS__, 'render' ) );
        }

        private static function enqueue_assets() {
            $style_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan.css';
            $script_path = plugin_dir_path( __FILE__ ) . 'assets/js/duncan.js';
            wp_enqueue_style(
                'fmd-duncan-test-style',
                plugins_url( 'assets/css/duncan.css', __FILE__ ),
                array(),
                file_exists( $style_path ) ? (string) filemtime( $style_path ) : self::VERSION
            );
            // CSS corretivo separado: evita o aninhamento legado que tornava
            // regras posteriores inoperantes no CSS original.
            $fix_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-10.css';
            wp_enqueue_style(
                'fmd-duncan-ux-10',
                plugins_url( 'assets/css/duncan-ux-10.css', __FILE__ ),
                array( 'fmd-duncan-test-style' ),
                file_exists( $fix_path ) ? (string) filemtime( $fix_path ) : self::VERSION
            );
            // DUNCAN-UX-11: fundo natural de transição e preenchimento dos
            // painéis de abertura 5/9/17, sem tocar nas fichas aprovadas.
            $block1_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-11.css';
            wp_enqueue_style(
                'fmd-duncan-ux-11',
                plugins_url( 'assets/css/duncan-ux-11.css', __FILE__ ),
                array( 'fmd-duncan-ux-10' ),
                file_exists( $block1_path ) ? (string) filemtime( $block1_path ) : self::VERSION
            );
            // DUNCAN-UX-09: apenas Hero do nivel 1 (faixa superior e margem da arte).
            // Carregar por ultimo, apos as correcoes aprovadas dos niveis 5/9/17.
            $hero_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-09-level1.css';
            wp_enqueue_style(
                'fmd-duncan-ux-09-level1',
                plugins_url( 'assets/css/duncan-ux-09-level1.css', __FILE__ ),
                array( 'fmd-duncan-ux-11' ),
                file_exists( $hero_path ) ? (string) filemtime( $hero_path ) : self::VERSION
            );
            // DUNCAN-UX-12: escudos aprovados e padronização da Wishlist.
            // Arquivos WebP locais; sem alterar a lógica ou os dados da build.
            $side_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-12-block2.css';
            wp_enqueue_style(
                'fmd-duncan-ux-12-block2',
                plugins_url( 'assets/css/duncan-ux-12-block2.css', __FILE__ ),
                array( 'fmd-duncan-ux-09-level1' ),
                file_exists( $side_path ) ? (string) filemtime( $side_path ) : self::VERSION
            );
            // DUNCAN-UX-10 / Bloco 1: somente a coluna verde das fases 5/9/17.
            $colors_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-10-block1-colors.css';
            wp_enqueue_style(
                'fmd-duncan-ux-10-block1-colors',
                plugins_url( 'assets/css/duncan-ux-10-block1-colors.css', __FILE__ ),
                array( 'fmd-duncan-ux-12-block2' ),
                file_exists( $colors_path ) ? (string) filemtime( $colors_path ) : self::VERSION
            );
            // DUNCAN-UX-10: complementação do Bloco 1 no nível 13.
            // A ficha rápida é montada com dados já aprovados, sem alterar o conteúdo principal.
            $level13_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-10-block1-level13.css';
            wp_enqueue_style(
                'fmd-duncan-ux-10-block1-level13',
                plugins_url( 'assets/css/duncan-ux-10-block1-level13.css', __FILE__ ),
                array( 'fmd-duncan-ux-10-block1-colors' ),
                file_exists( $level13_path ) ? (string) filemtime( $level13_path ) : self::VERSION
            );
            // DUNCAN-UX-10 · Bloco 2: acabamento de heroes 13 e 20.
            $heroes_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-10-block2-heroes.css';
            wp_enqueue_style(
                'fmd-duncan-ux-10-block2-heroes',
                plugins_url( 'assets/css/duncan-ux-10-block2-heroes.css', __FILE__ ),
                array( 'fmd-duncan-ux-10-block1-level13' ),
                file_exists( $heroes_path ) ? (string) filemtime( $heroes_path ) : self::VERSION
            );
            // DUNCAN-UX-10 / Bloco 3, Rodada 2 — ritmo lateral (referências 16/13).
            $r2_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux-10-block3-r2-spacing.css';
            wp_enqueue_style(
                'fmd-duncan-ux-10-block3-r2',
                plugins_url( 'assets/css/duncan-ux-10-block3-r2-spacing.css', __FILE__ ),
                array( 'fmd-duncan-ux-10-block2-heroes' ),
                file_exists( $r2_path ) ? (string) filemtime( $r2_path ) : self::VERSION
            );
            // DUNCAN-UX-10 / Bloco final — acabamento escopado aos níveis 18–20.
            $last_path = plugin_dir_path( __FILE__ ) . 'assets/css/duncan-ux10-final-18-20.css';
            wp_enqueue_style(
                'fmd-duncan-ux10-final-18-20',
                plugins_url( 'assets/css/duncan-ux10-final-18-20.css', __FILE__ ),
                array( 'fmd-duncan-ux-10-block3-r2' ),
                file_exists( $last_path ) ? (string) filemtime( $last_path ) : self::VERSION
            );
            wp_enqueue_script(
                'fmd-duncan-test-script',
                plugins_url( 'assets/js/duncan.js', __FILE__ ),
                array(),
                file_exists( $script_path ) ? (string) filemtime( $script_path ) : self::VERSION,
                true
            );
        }

        public static function maybe_enqueue_assets() {
            if ( ! is_singular() ) { return; }
            global $post;
            if ( $post && isset( $post->post_content ) && has_shortcode( $post->post_content, self::SHORTCODE ) ) {
                self::enqueue_assets();
            }
        }

        public static function render( $atts = array() ) {
            // Fallback para editores que executam o shortcode fora de post_content.
            self::enqueue_assets();
            $template = plugin_dir_path( __FILE__ ) . 'templates/duncan.html';
            if ( ! is_readable( $template ) ) {
                return current_user_can( 'edit_posts' )
                    ? '<p>Forja Duncan: arquivo de template ausente.</p>'
                    : '';
            }
            // HTML de visualizacao revisado em v2.5, sem cabecalho/rodape de teste.
            $html = file_get_contents( $template );
            return false === $html ? '' : $html;
        }
    }
    FMD_Duncan_Test::boot();
}
