<?php
/**
 * Testes offline do validador. Não dependem de WordPress nem tocam produção.
 */
require_once __DIR__ . '/../includes/class-fwb-validator.php';

$failures = 0;
function check( $name, $condition ) {
    global $failures;
    if ( ! $condition ) {
        ++$failures;
        fwrite( STDERR, "FAIL: {$name}\n" );
    } else {
        fwrite( STDOUT, "PASS: {$name}\n" );
    }
}
$base = array( 'title' => 'Notícia sobre D&D', 'content' => '<!-- wp:paragraph --><p>Texto</p><!-- /wp:paragraph -->' );
$r = FWB_Validator::validate( $base, 'create' );
check( 'criação mínima válida', $r['valid'] );
check( 'dry-run por padrão', $r['dry_run'] === true );
check( 'preserva conteúdo Gutenberg no validador', $r['fields']['content'] === $base['content'] );
check( 'rejeita publicação', ! FWB_Validator::validate( array_merge( $base, array( 'status' => 'publish' ) ) )['valid'] );
check( 'rejeita edição de author', ! FWB_Validator::validate( array_merge( $base, array( 'author' => 1 ) ) )['valid'] );
check( 'rejeita metadados arbitrários', ! FWB_Validator::validate( array_merge( $base, array( 'meta' => array() ) ) )['valid'] );
check( 'rejeita flag ambígua', ! FWB_Validator::validate( array_merge( $base, array( 'dry_run' => 'false' ) ) )['valid'] );
check( 'false booleano explícito sinaliza escrita', FWB_Validator::validate( array_merge( $base, array( 'dry_run' => false ) ) )['dry_run'] === false );
check( 'rejeita título em branco', ! FWB_Validator::validate( array( 'title' => '  ' ) )['valid'] );
check( 'rejeita corpo lista', ! FWB_Validator::validate( array( $base ) )['valid'] );
check( 'rejeita corpo nulo', ! FWB_Validator::validate( null )['valid'] );
check( 'rejeita conteúdo acima do limite', ! FWB_Validator::validate( array( 'title' => 'X', 'content' => str_repeat( 'A', FWB_Validator::MAX_CONTENT_BYTES + 1 ) ) )['valid'] );
check( 'atualização dry-run válida', FWB_Validator::validate( array( 'title' => 'Ajuste' ), 'update' )['valid'] );
check( 'atualização real exige versão', ! FWB_Validator::validate( array( 'title' => 'Ajuste', 'dry_run' => false ), 'update' )['valid'] );
check( 'versão inválida rejeitada', ! FWB_Validator::validate( array( 'title' => 'Ajuste', 'dry_run' => false, 'expected_modified_gmt' => 'ontem' ), 'update' )['valid'] );
check( 'atualização real com versão', FWB_Validator::validate( array( 'title' => 'Ajuste', 'dry_run' => false, 'expected_modified_gmt' => '2026-11-20 16:00:00' ), 'update' )['valid'] );
check( 'rejeita atualização sem campos', ! FWB_Validator::validate( array( 'dry_run' => true ), 'update' )['valid'] );

if ( $failures > 0 ) {
    fwrite( STDERR, "{$failures} teste(s) falharam.\n" );
    exit( 1 );
}
fwrite( STDOUT, "Validador: 17 testes aprovados.\n" );
