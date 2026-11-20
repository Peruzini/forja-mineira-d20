<?php
/**
 * API restrita: nenhum endpoint publica posts, altera plugins, temas ou SEO.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class FWB_REST_Controller {
    const NAMESPACE = 'forja-bridge/v1';

    public static function register_routes() {
        register_rest_route(
            self::NAMESPACE,
            '/status',
            array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array( __CLASS__, 'status' ),
                'permission_callback' => array( __CLASS__, 'can_edit' ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/drafts/validate',
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array( __CLASS__, 'validate_draft' ),
                'permission_callback' => array( __CLASS__, 'can_edit' ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/drafts',
            array(
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => array( __CLASS__, 'create_draft' ),
                'permission_callback' => array( __CLASS__, 'can_edit' ),
            )
        );

        register_rest_route(
            self::NAMESPACE,
            '/drafts/(?P<id>[0-9]+)',
            array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array( __CLASS__, 'get_draft' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array( __CLASS__, 'update_draft' ),
                    'permission_callback' => array( __CLASS__, 'can_edit' ),
                ),
            )
        );
    }

    public static function can_edit() {
        return is_user_logged_in() && current_user_can( 'edit_posts' );
    }

    private static function writes_enabled() {
        return defined( 'FWB_ENABLE_DRAFT_WRITES' ) && true === FWB_ENABLE_DRAFT_WRITES;
    }

    public static function status() {
        return rest_ensure_response(
            array(
                'version' => FWB_VERSION,
                'policy' => 'draft_only',
                'authenticated' => true,
                'writes_enabled' => self::writes_enabled(),
                'can_upload_media' => current_user_can( 'upload_files' ),
                'can_publish_posts' => current_user_can( 'publish_posts' ),
            )
        );
    }

    private static function payload_from_request( $request, $mode ) {
        if ( false === strpos( (string) $request->get_header( 'content-type' ), 'application/json' ) ) {
            return new WP_Error( 'fwb_json_required', 'Envie Content-Type: application/json.', array( 'status' => 415 ) );
        }

        $validation = FWB_Validator::validate( $request->get_json_params(), $mode );
        if ( ! $validation['valid'] ) {
            return new WP_Error(
                'fwb_invalid_payload',
                'Payload editorial inválido.',
                array( 'status' => 400, 'fields' => $validation['errors'] )
            );
        }
        return $validation;
    }

    private static function require_editable_draft( $id ) {
        $post = get_post( $id );
        if ( ! $post || 'post' !== $post->post_type || 'draft' !== $post->post_status ) {
            return new WP_Error( 'fwb_draft_not_found', 'Rascunho não disponível.', array( 'status' => 404 ) );
        }
        if ( ! current_user_can( 'edit_post', $id ) ) {
            return new WP_Error( 'fwb_forbidden', 'Sem permissão para editar este rascunho.', array( 'status' => 403 ) );
        }
        return $post;
    }

    private static function editorial_fields( $fields ) {
        $result = array();
        if ( array_key_exists( 'title', $fields ) ) {
            $result['post_title'] = wp_slash( sanitize_text_field( $fields['title'] ) );
        }
        if ( array_key_exists( 'content', $fields ) ) {
            // Preserva marcação Gutenberg/shortcodes. O WordPress aplica KSES conforme capacidade do usuário.
            $result['post_content'] = wp_slash( $fields['content'] );
        }
        if ( array_key_exists( 'excerpt', $fields ) ) {
            $result['post_excerpt'] = wp_slash( wp_kses_post( $fields['excerpt'] ) );
        }
        if ( array_key_exists( 'slug', $fields ) ) {
            $result['post_name'] = sanitize_title( $fields['slug'] );
        }
        return $result;
    }

    public static function validate_draft( $request ) {
        $validation = self::payload_from_request( $request, 'create' );
        if ( is_wp_error( $validation ) ) {
            return $validation;
        }
        // Esta rota nunca grava, mesmo se o usuário enviou dry_run=false.
        return rest_ensure_response(
            array(
                'valid' => true,
                'operation' => 'create_draft',
                'dry_run' => true,
                'would_change' => array_keys( $validation['fields'] ),
                'writes_enabled' => self::writes_enabled(),
            )
        );
    }

    public static function create_draft( $request ) {
        $validation = self::payload_from_request( $request, 'create' );
        if ( is_wp_error( $validation ) ) {
            return $validation;
        }

        if ( $validation['dry_run'] ) {
            return rest_ensure_response(
                array(
                    'valid' => true,
                    'dry_run' => true,
                    'operation' => 'create_draft',
                    'would_change' => array_keys( $validation['fields'] ),
                )
            );
        }
        if ( ! self::writes_enabled() ) {
            return new WP_Error( 'fwb_writes_disabled', 'Escrita de rascunhos não habilitada.', array( 'status' => 403 ) );
        }

        $postarr = array_merge(
            array(
                'post_type' => 'post',
                'post_status' => 'draft',
                'post_author' => get_current_user_id(),
            ),
            self::editorial_fields( $validation['fields'] )
        );
        $id = wp_insert_post( $postarr, true );
        if ( is_wp_error( $id ) ) {
            return $id;
        }

        do_action( 'fwb_draft_written', array( 'id' => $id, 'operation' => 'create', 'user_id' => get_current_user_id() ) );
        return new WP_REST_Response( array( 'id' => $id, 'status' => 'draft', 'dry_run' => false ), 201 );
    }

    public static function get_draft( $request ) {
        $id = absint( $request['id'] );
        $post = self::require_editable_draft( $id );
        if ( is_wp_error( $post ) ) {
            return $post;
        }

        return rest_ensure_response(
            array(
                'id' => $post->ID,
                'status' => $post->post_status,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt,
                'slug' => $post->post_name,
                'modified_gmt' => $post->post_modified_gmt,
            )
        );
    }

    public static function update_draft( $request ) {
        $id = absint( $request['id'] );
        $post = self::require_editable_draft( $id );
        if ( is_wp_error( $post ) ) {
            return $post;
        }

        $validation = self::payload_from_request( $request, 'update' );
        if ( is_wp_error( $validation ) ) {
            return $validation;
        }

        if ( $validation['dry_run'] ) {
            return rest_ensure_response(
                array(
                    'valid' => true,
                    'dry_run' => true,
                    'operation' => 'update_draft',
                    'id' => $id,
                    'would_change' => array_keys( $validation['fields'] ),
                )
            );
        }
        if ( ! self::writes_enabled() ) {
            return new WP_Error( 'fwb_writes_disabled', 'Escrita de rascunhos não habilitada.', array( 'status' => 403 ) );
        }
        if ( ! hash_equals( (string) $post->post_modified_gmt, (string) $request->get_json_params()['expected_modified_gmt'] ) ) {
            return new WP_Error( 'fwb_version_conflict', 'Rascunho alterado desde a leitura; consulte novamente.', array( 'status' => 409 ) );
        }

        $postarr = array_merge( array( 'ID' => $id, 'post_status' => 'draft' ), self::editorial_fields( $validation['fields'] ) );
        $result = wp_update_post( $postarr, true );
        if ( is_wp_error( $result ) ) {
            return $result;
        }

        do_action( 'fwb_draft_written', array( 'id' => $id, 'operation' => 'update', 'user_id' => get_current_user_id() ) );
        return rest_ensure_response( array( 'id' => $id, 'status' => 'draft', 'dry_run' => false ) );
    }
}
