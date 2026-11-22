<?php

define('ABSPATH', __DIR__);
define('FWB_ALT02_ENABLED', true);
define('FWB_ALT02_AUTHOR_ID', 42);
define('FWB_ALT02_SIGNING_KEY', str_repeat('ab', 32));
define('FWB_ALT02_APPROVAL_EXPIRES', time() + 60);
$body = '{"title":"Rascunho de teste","content":"A < B"}';
define('FWB_ALT02_APPROVED_DIGEST', hash('sha256', $body));

class WP_Error {
    public $code;
    public function __construct($code, $message, $data) { $this->code = $code; }
}
class WP_REST_Response {
    public $status;
    public function __construct($data, $status, $headers) { $this->status = $status; }
}
class Request {
    private $body;
    private $signature;
    public function __construct($body, $signature) { $this->body = $body; $this->signature = $signature; }
    public function get_body() { return $this->body; }
    public function get_header($name) { return $this->signature; }
}

$wpdb = new class {
    public $options = 'wp_options';
    private $used = false;
    public function prepare($sql, ...$args) { return $args; }
    public function query($query) {
        check($query === ['fwb_alt02_used_' . FWB_ALT02_APPROVED_DIGEST, 'used']);
        if ($this->used) return 0;
        $this->used = true;
        return 1;
    }
};
$insertions = 0;
function add_action($tag, $callback) { check($tag === 'rest_api_init'); }
function get_userdata($id) { return $id === 42; }
function user_can($id, $cap) { return $id === 42 && $cap === 'edit_posts'; }
function wp_slash($data) { return $data; }
function esc_html($text) { return htmlspecialchars($text); }
function wp_insert_post($data, $error) {
    global $insertions;
    check($data['post_type'] === 'post' && $data['post_status'] === 'draft' && $data['post_author'] === 42);
    check($data['post_content'] === 'A &lt; B');
    $insertions++;
    return 418;
}
function get_post($id) { return (object) ['post_status' => 'draft', 'post_author' => '42']; }
function check($condition) {
    if (!$condition) throw new RuntimeException('Draft approval assertion failed');
}

require __DIR__ . '/../forja-draft-approval.php';
$signature = hash_hmac('sha256', "forja-draft-v1\n" . $body, hex2bin(FWB_ALT02_SIGNING_KEY));
$request = new Request($body, $signature);
check(Forja\DraftApproval\authorize(new Request($body, 'invalid')) instanceof WP_Error);
check(Forja\DraftApproval\authorize(new Request($body . ' ', $signature)) instanceof WP_Error);
check(Forja\DraftApproval\authorize($request) === true);
check(Forja\DraftApproval\create($request)->status === 201);
check(Forja\DraftApproval\create($request)->code === 'forja_draft_claim_unavailable');
check($insertions === 1);
echo "PASS: signed payload, immutable approval, draft status, existing author and replay guard\n";
