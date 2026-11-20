<?php
/**
 * Ledger durável de operações. Mantém registros para impedir criação duplicada
 * após repetição de workflow, timeout ou resposta perdida.
 */
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

final class FWB_Ledger {
    const KEY_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9_-]{11,79}$/D';

    public static function begin( $key, $operation, $fields, $post_id = 0, $expected = '' ) {
        if ( ! is_string( $key ) || ! preg_match( self::KEY_PATTERN, $key ) ) {
            return new WP_Error( 'fwb_idempotency_required', 'Cabeçalho de idempotência obrigatório (12–80 caracteres).', array( 'status' => 400 ) );
        }
        if ( ! in_array( $operation, array( 'create', 'update' ), true ) ) {
            return new WP_Error( 'fwb_operation_invalid', 'Operação não autorizada.', array( 'status' => 400 ) );
        }

        ksort( $fields );
        $fingerprint = hash( 'sha256', wp_json_encode(
            array(
                'operation' => $operation,
                'post_id' => (int) $post_id,
                'expected_modified_gmt' => (string) $expected,
                'fields' => $fields,
            )
        ) );
        $token_hash = hash_hmac( 'sha256', $key, wp_salt( 'auth' ) );
        $option = 'fwb_op_' . $token_hash;
        $initial = array(
            'state' => 'processing',
            'hash' => $fingerprint,
            'operation' => $operation,
            'created_at' => gmdate( 'Y-m-d H:i:s' ),
        );

        if ( add_option( $option, $initial, '', false ) ) {
            return array(
                'action' => 'acquired',
                'option' => $option,
                'hash' => $fingerprint,
                'token_hint' => substr( $token_hash, 0, 12 ),
            );
        }

        $prior = get_option( $option, false );
        if ( ! is_array( $prior ) ) {
            return new WP_Error( 'fwb_ledger_unavailable', 'Reserva da operação inconclusiva.', array( 'status' => 503 ) );
        }
        if ( ! hash_equals( (string) ( $prior['hash'] ?? '' ), $fingerprint ) ) {
            return new WP_Error( 'fwb_key_conflict', 'Identificador já utilizado em outra operação.', array( 'status' => 409 ) );
        }
        if ( 'completed' === ( $prior['state'] ?? '' ) && isset( $prior['response']['id'] ) ) {
            return array(
                'action' => 'replay',
                'response' => $prior['response'],
            );
        }
        return new WP_Error( 'fwb_operation_pending', 'Operação anterior sem recibo seguro; inspecione antes de repetir.', array( 'status' => 409 ) );
    }

    public static function audit( $post_id, $operation, $receipt ) {
        $event = array(
            'timestamp_gmt' => gmdate( 'Y-m-d H:i:s' ),
            'operation' => $operation,
            'actor_id' => get_current_user_id(),
            'request_hint' => $receipt['token_hint'],
        );
        return (bool) add_post_meta( (int) $post_id, '_fwb_audit_event', wp_json_encode( $event ), false );
    }

    public static function complete( $receipt, $response ) {
        $existing = get_option( $receipt['option'], false );
        if ( ! is_array( $existing ) ||
            'processing' !== ( $existing['state'] ?? '' ) ||
            ! hash_equals( (string) ( $existing['hash'] ?? '' ), $receipt['hash'] )
        ) {
            return false;
        }
        $existing['state'] = 'completed';
        $existing['response'] = $response;
        $existing['finished_at'] = gmdate( 'Y-m-d H:i:s' );
        return (bool) update_option( $receipt['option'], $existing, false );
    }

    public static function mark_uncertain( $receipt ) {
        $existing = get_option( $receipt['option'], false );
        if ( ! is_array( $existing ) || 'processing' !== ( $existing['state'] ?? '' ) ) {
            return false;
        }
        $existing['state'] = 'uncertain';
        $existing['finished_at'] = gmdate( 'Y-m-d H:i:s' );
        return (bool) update_option( $receipt['option'], $existing, false );
    }
}
