<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMC_Relations {
    public static function related( $cluster_id, $current_node ) {
        $cluster = FMC_Registry::get_cluster( $cluster_id );
        if ( ! $cluster ) { return array(); }

        $relations = ! empty( $cluster['relations'] ) ? $cluster['relations'] : array();

        /**
         * Permite alterar a malha editorial de relações.
         */
        $relations = apply_filters( 'forja_d20_cluster_relations', $relations, $cluster_id );

        $current_node = sanitize_key( $current_node );
        $targets = isset( $relations[ $current_node ] ) ? (array) $relations[ $current_node ] : array();
        $result = array();

        foreach ( $targets as $target_id ) {
            $target_id = sanitize_key( $target_id );
            if ( $target_id === $current_node ) { continue; }
            $resolved = FMC_Resolver::resolve( $cluster_id, $target_id );
            if ( ! $resolved || empty( $resolved['url'] ) ) { continue; }
            if ( false === $resolved['published'] ) { continue; }
            $resolved['id'] = $target_id;
            $result[] = $resolved;
        }

        return array_slice( $result, 0, 3 );
    }
}
