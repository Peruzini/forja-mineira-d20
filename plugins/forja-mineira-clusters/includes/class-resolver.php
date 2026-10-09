<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMC_Resolver {
    const CACHE_VERSION = 1;
    const CACHE_TTL = DAY_IN_SECONDS;

    public static function invalidate_cache() {
        $clusters = FMC_Registry::clusters();
        foreach ( $clusters as $cluster_id => $cluster ) {
            if ( empty( $cluster['nodes'] ) ) { continue; }
            foreach ( array_keys( $cluster['nodes'] ) as $node_id ) {
                delete_transient( self::cache_key( $cluster_id, $node_id ) );
            }
        }
    }

    public static function resolve( $cluster_id, $node_id ) {
        $cluster_id = sanitize_key( $cluster_id );
        $node_id = sanitize_key( $node_id );
        $node = FMC_Registry::get_node( $cluster_id, $node_id );
        if ( ! $node ) { return null; }

        $cache_key = self::cache_key( $cluster_id, $node_id );
        $cached = get_transient( $cache_key );
        if ( is_array( $cached ) && ! empty( $cached['url'] ) ) {
            return array_merge( $node, $cached );
        }

        $resolved = self::resolve_uncached( $node );
        set_transient( $cache_key, $resolved, self::CACHE_TTL );
        return array_merge( $node, $resolved );
    }

    public static function current_node( $cluster_id ) {
        $cluster = FMC_Registry::get_cluster( $cluster_id );
        if ( ! $cluster || empty( $cluster['nodes'] ) ) { return ''; }

        $current_id = get_queried_object_id();
        $current_url = $current_id ? get_permalink( $current_id ) : '';

        foreach ( array_keys( $cluster['nodes'] ) as $node_id ) {
            $resolved = self::resolve( $cluster_id, $node_id );
            if ( ! $resolved ) { continue; }
            if ( $current_id && ! empty( $resolved['page_id'] ) && (int) $resolved['page_id'] === (int) $current_id ) {
                return $node_id;
            }
            if ( $current_url && ! empty( $resolved['url'] ) && untrailingslashit( $current_url ) === untrailingslashit( $resolved['url'] ) ) {
                return $node_id;
            }
        }

        return '';
    }

    private static function resolve_uncached( $node ) {
        $page_id = 0;
        $source = 'fallback';

        if ( ! empty( $node['page_id'] ) ) {
            $candidate = get_post( (int) $node['page_id'] );
            if ( $candidate && 'page' === $candidate->post_type && 'publish' === $candidate->post_status ) {
                $page_id = (int) $candidate->ID;
                $source = 'page_id';
            }
        }

        if ( ! $page_id && ! empty( $node['shortcode'] ) ) {
            $page_id = self::find_page_by_shortcode( $node['shortcode'] );
            if ( $page_id ) { $source = 'shortcode'; }
        }

        if ( ! $page_id && ! empty( $node['fallback_path'] ) ) {
            $candidate_id = url_to_postid( home_url( $node['fallback_path'] ) );
            if ( $candidate_id && 'publish' === get_post_status( $candidate_id ) ) {
                $page_id = (int) $candidate_id;
                $source = 'path';
            }
        }

        if ( $page_id ) {
            return array(
                'page_id' => $page_id,
                'url' => get_permalink( $page_id ),
                'published' => true,
                'source' => $source,
            );
        }

        if ( ! empty( $node['fallback_path'] ) ) {
            return array(
                'page_id' => 0,
                'url' => home_url( $node['fallback_path'] ),
                'published' => null,
                'source' => 'fallback_path',
            );
        }

        if ( ! empty( $node['fallback_query'] ) ) {
            return array(
                'page_id' => 0,
                'url' => add_query_arg( 's', rawurlencode( $node['fallback_query'] ), home_url( '/' ) ),
                'published' => null,
                'source' => 'fallback_query',
            );
        }

        return array(
            'page_id' => 0,
            'url' => '',
            'published' => false,
            'source' => 'unresolved',
        );
    }

    private static function find_page_by_shortcode( $shortcode ) {
        global $wpdb;
        $needle = '%[' . $wpdb->esc_like( sanitize_key( $shortcode ) ) . '%';
        $page_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts}\n                 WHERE post_type = 'page'\n                   AND post_status = 'publish'\n                   AND post_content LIKE %s\n                 ORDER BY post_modified_gmt DESC\n                 LIMIT 1",
                $needle
            )
        );
        return $page_id ? (int) $page_id : 0;
    }

    private static function cache_key( $cluster_id, $node_id ) {
        return 'fmc_' . self::CACHE_VERSION . '_' . md5( sanitize_key( $cluster_id ) . '|' . sanitize_key( $node_id ) );
    }
}
