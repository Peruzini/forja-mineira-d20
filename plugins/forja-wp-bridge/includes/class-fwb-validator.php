<?php
/**
 * Validação estrita, sem dependências de WordPress, para os payloads editoriais.
 */

if ( ! class_exists( 'FWB_Validator', false ) ) {
    final class FWB_Validator {
        const MAX_CONTENT_BYTES = 250000;

        /**
         * @param mixed  $payload Corpo JSON decodificado.
         * @param string $mode    create ou update.
         * @return array{valid:bool,errors:array,dry_run:bool,fields:array}
         */
        public static function validate( $payload, $mode = 'create' ) {
            if ( ! is_array( $payload ) || array_is_list( $payload ) ) {
                return array(
                    'valid' => false,
                    'errors' => array( 'body' => 'É necessário enviar um objeto JSON.' ),
                    'dry_run' => true,
                    'fields' => array(),
                );
            }

            if ( ! in_array( $mode, array( 'create', 'update' ), true ) ) {
                return array(
                    'valid' => false,
                    'errors' => array( 'mode' => 'Operação desconhecida.' ),
                    'dry_run' => true,
                    'fields' => array(),
                );
            }

            $allowed = array( 'title', 'content', 'excerpt', 'slug', 'dry_run' );
            if ( 'update' === $mode ) {
                $allowed[] = 'expected_modified_gmt';
            }
            $errors = array();
            foreach ( $payload as $name => $value ) {
                if ( ! in_array( $name, $allowed, true ) ) {
                    $errors[ $name ] = 'Campo não permitido.';
                }
            }

            if ( array_key_exists( 'dry_run', $payload ) && ! is_bool( $payload['dry_run'] ) ) {
                $errors['dry_run'] = 'Use true ou false como booleano JSON.';
            }
            // Falha fechada: sem confirmação explícita de false, não escreve.
            $dry_run = ! array_key_exists( 'dry_run', $payload ) || true !== ( false === $payload['dry_run'] );

            $limits = array(
                'title' => 500,
                'content' => self::MAX_CONTENT_BYTES,
                'excerpt' => 5000,
                'slug' => 200,
            );
            $fields = array();
            foreach ( $limits as $field => $limit ) {
                if ( ! array_key_exists( $field, $payload ) ) {
                    continue;
                }
                if ( ! is_string( $payload[ $field ] ) ) {
                    $errors[ $field ] = 'O valor deve ser uma string.';
                    continue;
                }
                if ( strlen( $payload[ $field ] ) > $limit ) {
                    $errors[ $field ] = 'O campo excede o limite de bytes.';
                    continue;
                }
                $fields[ $field ] = $payload[ $field ];
            }

            if ( 'create' === $mode && ( ! isset( $fields['title'] ) || '' === trim( $fields['title'] ) ) ) {
                $errors['title'] = 'Título é obrigatório para novo rascunho.';
            }
            if ( 'update' === $mode && 0 === count( $fields ) ) {
                $errors['fields'] = 'Informe ao menos um campo editorial para alteração.';
            }
            if ( isset( $fields['title'] ) && '' === trim( $fields['title'] ) ) {
                $errors['title'] = 'Título não pode ficar vazio.';
            }

            if ( 'update' === $mode ) {
                $stamp = $payload['expected_modified_gmt'] ?? null;
                if ( ! $dry_run && ! is_string( $stamp ) ) {
                    $errors['expected_modified_gmt'] = 'Obrigatório para atualização real.';
                } elseif ( null !== $stamp && ( ! is_string( $stamp ) || ! preg_match( '/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $stamp ) ) ) {
                    $errors['expected_modified_gmt'] = 'Formato exigido: YYYY-MM-DD HH:MM:SS (UTC).';
                }
            }

            return array(
                'valid' => empty( $errors ),
                'errors' => $errors,
                'dry_run' => $dry_run,
                'fields' => $fields,
            );
        }
    }
}
