<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMC_Registry {
    public static function clusters() {
        $clusters = array(
            'bruxo' => require FMC_PATH . 'clusters/bruxo.php',
        );

        /**
         * Permite registrar ou alterar clusters sem editar o núcleo.
         *
         * @param array $clusters Estrutura completa de clusters e nós.
         */
        return apply_filters( 'forja_d20_cluster_nodes', $clusters );
    }

    public static function get_cluster( $cluster_id ) {
        $clusters = self::clusters();
        $cluster_id = sanitize_key( $cluster_id );
        return isset( $clusters[ $cluster_id ] ) ? $clusters[ $cluster_id ] : null;
    }

    public static function get_node( $cluster_id, $node_id ) {
        $cluster = self::get_cluster( $cluster_id );
        $node_id = sanitize_key( $node_id );
        if ( ! $cluster || empty( $cluster['nodes'][ $node_id ] ) ) {
            return null;
        }
        return $cluster['nodes'][ $node_id ];
    }
}
