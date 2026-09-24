<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMB_Build_Voting {
    const COUNTS_OPTION = 'fmb_build_vote_counts';
    const OPEN_OPTION   = 'fmb_build_vote_open';
    const POLL_OPTION   = 'fmb_build_vote_poll_id';

    private static $candidates = array(
        'guts'   => 'Guts',
        'duncan' => 'Duncan, o Alto',
        'trevor' => 'Trevor Belmont',
    );

    public static function init() {
        add_action( 'init', array( __CLASS__, 'ensure_options' ) );
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
        add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
        add_action( 'admin_post_fmb_vote_settings', array( __CLASS__, 'save_settings' ) );
        add_action( 'admin_post_fmb_vote_reset', array( __CLASS__, 'reset_poll' ) );
    }

    public static function ensure_options() {
        add_option(
            self::COUNTS_OPTION,
            array(
                'guts'   => 0,
                'duncan' => 0,
                'trevor' => 0,
            ),
            '',
            false
        );
        add_option( self::OPEN_OPTION, '1', '', false );
        add_option( self::POLL_OPTION, 1, '', false );
    }

    public static function candidates() {
        return self::$candidates;
    }

    public static function get_poll_id() {
        return max( 1, absint( get_option( self::POLL_OPTION, 1 ) ) );
    }

    public static function is_open() {
        return '0' !== (string) get_option( self::OPEN_OPTION, '1' );
    }

    public static function get_counts() {
        $saved = get_option( self::COUNTS_OPTION, array() );
        $counts = array();

        foreach ( self::$candidates as $key => $label ) {
            $counts[ $key ] = isset( $saved[ $key ] ) ? max( 0, absint( $saved[ $key ] ) ) : 0;
        }

        return $counts;
    }

    public static function endpoint() {
        return rest_url( 'forja-mineira/v1/vote' );
    }

    public static function register_routes() {
        register_rest_route(
            'forja-mineira/v1',
            '/vote',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( __CLASS__, 'status' ),
                    'permission_callback' => '__return_true',
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( __CLASS__, 'submit_vote' ),
                    'permission_callback' => '__return_true',
                    'args'                => array(
                        'candidate' => array(
                            'required'          => true,
                            'sanitize_callback' => 'sanitize_key',
                        ),
                        'poll_id' => array(
                            'required'          => true,
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
            )
        );
    }

    public static function status() {
        return rest_ensure_response(
            array(
                'poll_id' => self::get_poll_id(),
                'open'    => self::is_open(),
            )
        );
    }

    private static function response_error( $code, $message, $status ) {
        return new WP_REST_Response(
            array(
                'registered' => false,
                'code'       => $code,
                'message'    => $message,
            ),
            $status
        );
    }

    public static function submit_vote( WP_REST_Request $request ) {
        $candidate = sanitize_key( (string) $request->get_param( 'candidate' ) );
        $poll_id   = absint( $request->get_param( 'poll_id' ) );
        $current   = self::get_poll_id();

        if ( $poll_id !== $current ) {
            return self::response_error(
                'poll_changed',
                'A votação foi atualizada. Recarregue a página e tente novamente.',
                409
            );
        }

        if ( ! self::is_open() ) {
            return self::response_error(
                'poll_closed',
                'A votação já foi encerrada.',
                403
            );
        }

        if ( ! isset( self::$candidates[ $candidate ] ) ) {
            return self::response_error(
                'invalid_candidate',
                'Candidato inválido.',
                400
            );
        }

        $counts = self::get_counts();
        $counts[ $candidate ] = $counts[ $candidate ] + 1;
        update_option( self::COUNTS_OPTION, $counts, false );

        return rest_ensure_response(
            array(
                'registered' => true,
                'candidate'  => $candidate,
                'poll_id'    => $current,
                'message'    => 'Voto registrado com sucesso.',
            )
        );
    }

    public static function admin_menu() {
        add_menu_page(
            'Forja Mineira — Votação',
            'Forja Mineira',
            'manage_options',
            'forja-mineira-votacao',
            array( __CLASS__, 'render_admin_page' ),
            'dashicons-chart-bar',
            58
        );
    }

    public static function save_settings() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Você não tem permissão para fazer isso.' );
        }

        check_admin_referer( 'fmb_vote_settings' );

        $open = isset( $_POST['poll_open'] ) && '1' === sanitize_text_field( wp_unslash( $_POST['poll_open'] ) )
            ? '1'
            : '0';

        update_option( self::OPEN_OPTION, $open, false );

        wp_safe_redirect(
            add_query_arg(
                array(
                    'page'    => 'forja-mineira-votacao',
                    'updated' => '1',
                ),
                admin_url( 'admin.php' )
            )
        );
        exit;
    }

    public static function reset_poll() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Você não tem permissão para fazer isso.' );
        }

        check_admin_referer( 'fmb_vote_reset' );

        update_option(
            self::COUNTS_OPTION,
            array(
                'guts'   => 0,
                'duncan' => 0,
                'trevor' => 0,
            ),
            false
        );

        update_option( self::POLL_OPTION, self::get_poll_id() + 1, false );
        update_option( self::OPEN_OPTION, '1', false );

        wp_safe_redirect(
            add_query_arg(
                array(
                    'page'  => 'forja-mineira-votacao',
                    'reset' => '1',
                ),
                admin_url( 'admin.php' )
            )
        );
        exit;
    }

    public static function render_admin_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $counts = self::get_counts();
        $total  = array_sum( $counts );
        $open   = self::is_open();
        $poll   = self::get_poll_id();
        ?>
        <div class="wrap">
            <h1>Forja Mineira — Votação da próxima Build</h1>

            <?php if ( isset( $_GET['updated'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p>Status da votação atualizado.</p></div>
            <?php endif; ?>

            <?php if ( isset( $_GET['reset'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p>Nova rodada criada e contadores zerados.</p></div>
            <?php endif; ?>

            <p>
                Os números abaixo aparecem apenas para administradores.
                A Home não publica parciais enquanto a votação estiver aberta.
            </p>

            <div style="display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:14px;max-width:980px;margin:24px 0;">
                <?php foreach ( self::$candidates as $key => $label ) : ?>
                    <div style="background:#fff;border:1px solid #dcdcde;border-radius:10px;padding:18px;">
                        <div style="font-size:12px;color:#646970;"><?php echo esc_html( $label ); ?></div>
                        <div style="font-size:32px;font-weight:700;line-height:1.2;margin-top:6px;"><?php echo esc_html( $counts[ $key ] ); ?></div>
                    </div>
                <?php endforeach; ?>
                <div style="background:#10271e;color:#fff;border-radius:10px;padding:18px;">
                    <div style="font-size:12px;color:#d0d8d3;">Total</div>
                    <div style="font-size:32px;font-weight:700;line-height:1.2;margin-top:6px;"><?php echo esc_html( $total ); ?></div>
                </div>
            </div>

            <table class="form-table" role="presentation" style="max-width:760px;">
                <tr><th scope="row">Rodada atual</th><td><strong>#<?php echo esc_html( $poll ); ?></strong></td></tr>
                <tr>
                    <th scope="row">Status</th>
                    <td><strong style="color:<?php echo $open ? '#18794e' : '#b32d2e'; ?>;"><?php echo $open ? 'ABERTA' : 'ENCERRADA'; ?></strong></td>
                </tr>
            </table>

            <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="margin-top:20px;">
                <input type="hidden" name="action" value="fmb_vote_settings">
                <?php wp_nonce_field( 'fmb_vote_settings' ); ?>
                <fieldset>
                    <legend class="screen-reader-text">Status da votação</legend>
                    <label style="margin-right:18px;"><input type="radio" name="poll_open" value="1" <?php checked( $open ); ?>> Votação aberta</label>
                    <label><input type="radio" name="poll_open" value="0" <?php checked( ! $open ); ?>> Votação encerrada</label>
                </fieldset>
                <?php submit_button( 'Salvar status', 'primary', 'submit', false ); ?>
            </form>

            <hr style="margin:30px 0;max-width:980px;">

            <h2>Iniciar uma nova rodada</h2>
            <p>
                Zera Guts, Duncan e Trevor, cria um novo ID de votação e abre a nova rodada.
                Os navegadores deixam de considerar o voto da rodada anterior.
            </p>

            <form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post">
                <input type="hidden" name="action" value="fmb_vote_reset">
                <?php wp_nonce_field( 'fmb_vote_reset' ); ?>
                <button type="submit" class="button button-secondary" onclick="return confirm('Zerar todos os votos e iniciar uma nova rodada?');">
                    Zerar votos e criar nova rodada
                </button>
            </form>
        </div>
        <?php
    }
}
