<?php
/**
 * Testes offline do ledger. Não acessam WordPress, rede ou banco.
 */
define( 'ABSPATH', '/offline/' );
$store = array();
$meta = array();
class WP_Error {
    private $code;
    public function __construct( $code, $message, $data = array() ) { $this->code = $code; }
    public function get_error_code() { return $this->code; }
}
function wp_json_encode( $payload ) { return json_encode( $payload ); }
function wp_salt( $context ) { return 'local-test-fixture-not-production'; }
function add_option( $name, $value, $unused = '', $autoload = false ) {
    global $store;
    if ( array_key_exists( $name, $store ) ) { return false; }
    $store[ $name ] = $value;
    return true;
}
function get_option( $name, $default = false ) {
    global $store;
    return $store[ $name ] ?? $default;
}
function update_option( $name, $value, $autoload = false ) {
    global $store;
    $store[ $name ] = $value;
    return true;
}
function get_current_user_id() { return 42; }
function add_post_meta( $id, $key, $value, $unique = false ) {
    global $meta;
    $meta[] = array( $id, $key, $value );
    return count( $meta );
}
require_once __DIR__ . '/../includes/class-fwb-ledger.php';

$fails = 0;
function verify_case( $description, $ok ) {
    global $fails;
    echo ( $ok ? 'PASS: ' : 'FAIL: ' ) . $description . "\n";
    if ( ! $ok ) { ++$fails; }
}
$fields = array( 'title' => 'Novo rascunho', 'content' => 'Texto' );
$invalid = FWB_Ledger::begin( 'x', 'create', $fields );
verify_case( 'chave curta rejeitada', $invalid instanceof WP_Error && 'fwb_idempotency_required' === $invalid->get_error_code() );
$claim = FWB_Ledger::begin( 'fwb_news14_20261120', 'create', $fields );
verify_case( 'primeira operação reserva chave', is_array( $claim ) && 'acquired' === $claim['action'] );
$inflight = FWB_Ledger::begin( 'fwb_news14_20261120', 'create', $fields );
verify_case( 'repetição pendente falha fechada', $inflight instanceof WP_Error && 'fwb_operation_pending' === $inflight->get_error_code() );
verify_case( 'auditoria privada registrada', FWB_Ledger::audit( 123, 'create', $claim ) && count( $meta ) === 1 && $meta[0][1] === '_fwb_audit_event' );
verify_case( 'completar operação', FWB_Ledger::complete( $claim, array( 'id' => 123, 'status' => 'draft', 'dry_run' => false ) ) );
$replay = FWB_Ledger::begin( 'fwb_news14_20261120', 'create', array( 'content' => 'Texto', 'title' => 'Novo rascunho' ) );
verify_case( 'repetição idêntica recupera recibo', is_array( $replay ) && $replay['action'] === 'replay' && $replay['response']['id'] === 123 );
$collision = FWB_Ledger::begin( 'fwb_news14_20261120', 'create', array( 'title' => 'Outro' ) );
verify_case( 'chave não pode mudar conteúdo', $collision instanceof WP_Error && 'fwb_key_conflict' === $collision->get_error_code() );
$other = FWB_Ledger::begin( 'fwb_news15_20261120', 'update', array( 'title' => 'Ajuste' ), 123, '2026-11-20 17:00:00' );
verify_case( 'atualização diferente reserva chave', is_array( $other ) && $other['action'] === 'acquired' );
verify_case( 'falha fica marcada indeterminada', FWB_Ledger::mark_uncertain( $other ) );
$pending = FWB_Ledger::begin( 'fwb_news15_20261120', 'update', array( 'title' => 'Ajuste' ), 123, '2026-11-20 17:00:00' );
verify_case( 'não repetir operação indeterminada', $pending instanceof WP_Error && 'fwb_operation_pending' === $pending->get_error_code() );
verify_case( 'sem credenciais nem conteúdo no identificador do registro', ! str_contains( $claim['option'], 'news14' ) );
if ( $fails ) { fwrite( STDERR, "$fails failures\n" ); exit( 1 ); }
echo "Ledger: 11 testes aprovados.\n";
