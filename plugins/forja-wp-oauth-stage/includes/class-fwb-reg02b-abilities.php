<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Abilities exposed exclusively over the OAuth MCP adapter in staging.
 * No post creation, updates, publication, plugins, themes or file access.
 */
final class FWB_REG02B_Abilities {
	public static function permitted() {
		return fwb_reg02b_enabled() && '' !== fwb_reg02b_client_id() &&
			is_user_logged_in() && current_user_can( 'edit_posts' );
	}

	public static function register_category() {
		if ( ! fwb_reg02b_enabled() || ! function_exists( 'wp_register_ability_category' ) ) {
			return;
		}
		wp_register_ability_category( 'forja-bridge', array(
			'label' => 'Forja WP Bridge',
			'description' => 'Staging-only read and draft validation tools.',
		) );
	}

	private static function expose( $name, $description, $schema, $callback ) {
		wp_register_ability( 'forja-bridge/' . $name, array(
			'label' => ucwords( str_replace( '-', ' ', $name ) ),
			'description' => $description,
			'category' => 'forja-bridge',
			'input_schema' => $schema,
			'output_schema' => array( 'type' => 'object' ),
			'execute_callback' => $callback,
			'permission_callback' => array( __CLASS__, 'permitted' ),
			'meta' => array(
				'mcp' => array( 'public' => true, 'type' => 'tool' ),
				'annotations' => array( 'readOnlyHint' => true ),
			),
		) );
	}

	public static function register() {
		if ( ! fwb_reg02b_enabled() || ! function_exists( 'wp_register_ability' ) ||
			'' === fwb_reg02b_client_id() ) {
			return;
		}
		self::expose( 'list-posts', 'List posts authored by the authorized WordPress staging user.',
			array( 'type' => 'object', 'properties' => array(
				'limit' => array( 'type' => 'integer', 'minimum' => 1, 'maximum' => 10 ),
			), 'additionalProperties' => false ),
			array( __CLASS__, 'list_posts' ) );
		self::expose( 'get-post', 'Read one post by ID, only if the authorized staging user owns it.',
			array( 'type' => 'object', 'properties' => array(
				'id' => array( 'type' => 'integer', 'minimum' => 1 ),
			), 'required' => array( 'id' ), 'additionalProperties' => false ),
			array( __CLASS__, 'get_post' ) );
		self::expose( 'validate-draft', 'Validate draft content safely without writing.',
			array( 'type' => 'object', 'properties' => array(
				'title' => array( 'type' => 'string', 'maxLength' => 500 ),
				'content' => array( 'type' => 'string', 'maxLength' => 30000 ),
			), 'required' => array( 'title' ), 'additionalProperties' => false ),
			array( __CLASS__, 'validate_draft' ) );
	}

	public static function list_posts( $input = array() ) {
		if ( ! self::permitted() ) {
			return new WP_Error( 'fwb_forbidden', 'Unauthorized.', array( 'status' => 403 ) );
		}
		$input = is_array( $input ) ? $input : array();
		$limit = isset( $input['limit'] ) ? (int) $input['limit'] : 5;
		if ( $limit < 1 || $limit > 10 ) {
			return new WP_Error( 'fwb_invalid_limit', 'Invalid limit.', array( 'status' => 400 ) );
		}
		$query = new WP_Query( array(
			'post_type' => 'post', 'post_status' => array( 'publish', 'draft' ),
			'author' => get_current_user_id(), 'posts_per_page' => $limit,
			'no_found_rows' => true,
		) );
		$items = array();
		foreach ( $query->posts as $item ) {
			$items[] = array(
				'id' => (int) $item->ID,
				'status' => (string) $item->post_status,
				'title' => (string) $item->post_title,
			);
		}
		return array( 'environment' => 'staging', 'count' => count( $items ), 'posts' => $items );
	}

	public static function get_post( $input = array() ) {
		if ( ! self::permitted() ) {
			return new WP_Error( 'fwb_forbidden', 'Unauthorized.', array( 'status' => 403 ) );
		}
		$id = isset( $input['id'] ) ? absint( $input['id'] ) : 0;
		$post = $id ? get_post( $id ) : null;
		if ( ! $post || 'post' !== $post->post_type ||
			! in_array( $post->post_status, array( 'publish', 'draft' ), true ) ||
			(int) $post->post_author !== (int) get_current_user_id() ||
			! current_user_can( 'edit_post', $id ) ) {
			return new WP_Error( 'fwb_post_unavailable', 'Post unavailable.', array( 'status' => 404 ) );
		}
		return array(
			'environment' => 'staging',
			'id' => $id,
			'status' => (string) $post->post_status,
			'title' => (string) $post->post_title,
			'content' => (string) $post->post_content,
			'modified_gmt' => (string) $post->post_modified_gmt,
		);
	}

	public static function validate_draft( $input = array() ) {
		if ( ! self::permitted() ) {
			return new WP_Error( 'fwb_forbidden', 'Unauthorized.', array( 'status' => 403 ) );
		}
		if ( ! is_array( $input ) || array_diff( array_keys( $input ), array( 'title', 'content' ) ) ) {
			return new WP_Error( 'fwb_bad_payload', 'Invalid draft fields.', array( 'status' => 400 ) );
		}
		$title = isset( $input['title'] ) && is_string( $input['title'] ) ? $input['title'] : '';
		$content = isset( $input['content'] ) && is_string( $input['content'] ) ? $input['content'] : '';
		if ( '' === trim( $title ) || strlen( $title ) > 2000 || strlen( $content ) > 100000 ) {
			return new WP_Error( 'fwb_bad_payload', 'Invalid draft values.', array( 'status' => 400 ) );
		}
		return array( 'valid' => true, 'dry_run' => true, 'would_change' =>
			isset( $input['content'] ) ? array( 'title', 'content' ) : array( 'title' ) );
	}
}
