<?php
/**
 * Plugin Name: Forja Draft Approval
 * Description: Creates a single preapproved draft attributed to the configured Forja author.
 * Version: 0.1.0
 * Requires PHP: 7.4
 */

namespace Forja\DraftApproval;

defined('ABSPATH') || exit;

function denied() {
    return new \WP_Error('forja_draft_denied', 'Draft authorization rejected.', ['status' => 403]);
}

function authorize($request) {
    if (!defined('FWB_ALT02_ENABLED') || FWB_ALT02_ENABLED !== true ||
        !defined('FWB_ALT02_SIGNING_KEY') || !is_string(FWB_ALT02_SIGNING_KEY) ||
        !preg_match('/\A[a-f0-9]{64}\z/', FWB_ALT02_SIGNING_KEY) ||
        !defined('FWB_ALT02_APPROVED_DIGEST') || !is_string(FWB_ALT02_APPROVED_DIGEST) ||
        !defined('FWB_ALT02_APPROVAL_EXPIRES') || !is_int(FWB_ALT02_APPROVAL_EXPIRES) ||
        FWB_ALT02_APPROVAL_EXPIRES <= time()) {
        return denied();
    }

    $body = $request->get_body();
    if (strlen($body) > 75000 || !hash_equals(FWB_ALT02_APPROVED_DIGEST, hash('sha256', $body))) {
        return denied();
    }
    $signature = hash_hmac('sha256', "forja-draft-v1\n" . $body, hex2bin(FWB_ALT02_SIGNING_KEY));
    return hash_equals($signature, (string) $request->get_header('x-forja-draft-signature')) ? true : denied();
}

function create($request) {
    global $wpdb;
    $input = json_decode($request->get_body(), true);
    if (!is_array($input) || array_keys($input) !== ['title', 'content'] ||
        !is_string($input['title']) || !is_string($input['content']) ||
        $input['title'] === '' || $input['content'] === '' ||
        strlen($input['title']) > 720 || strlen($input['content']) > 48000 ||
        preg_match('/[<>\x00-\x1f\x7f]/', $input['title']) ||
        preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $input['content'])) {
        return new \WP_Error('forja_draft_invalid', 'Invalid draft.', ['status' => 400]);
    }

    if (!defined('FWB_ALT02_AUTHOR_ID') || !is_int(FWB_ALT02_AUTHOR_ID) || FWB_ALT02_AUTHOR_ID < 1 ||
        !get_userdata(FWB_ALT02_AUTHOR_ID) || !user_can(FWB_ALT02_AUTHOR_ID, 'edit_posts')) {
        return denied();
    }

    // The options table has a unique option_name. Claim before inserting the post to prevent replay.
    $claim = 'fwb_alt02_used_' . FWB_ALT02_APPROVED_DIGEST;
    $claimed = $wpdb->query($wpdb->prepare(
        "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')",
        $claim,
        'used'
    ));
    if ($claimed !== 1) {
        return new \WP_Error('forja_draft_claim_unavailable', 'Draft approval could not be claimed.', ['status' => 409]);
    }

    $post_id = wp_insert_post(wp_slash([
        'post_type' => 'post',
        'post_status' => 'draft',
        'post_author' => FWB_ALT02_AUTHOR_ID,
        'post_title' => $input['title'],
        'post_content' => esc_html($input['content']),
        'meta_input' => ['_forja_approval_digest' => FWB_ALT02_APPROVED_DIGEST],
    ]), true);
    $post = is_int($post_id) && $post_id > 0 ? get_post($post_id) : null;
    if (!$post || $post->post_status !== 'draft' || (int) $post->post_author !== FWB_ALT02_AUTHOR_ID) {
        // An uncertain insert burns the approval. Check WordPress before issuing another one.
        return new \WP_Error('forja_draft_unconfirmed', 'Draft creation could not be confirmed.', ['status' => 502]);
    }

    return new \WP_REST_Response(['id' => $post_id, 'status' => 'draft'], 201, ['Cache-Control' => 'no-store']);
}

add_action('rest_api_init', static function () {
    register_rest_route('forja-drafts/v1', '/create', [
        'methods' => \WP_REST_Server::CREATABLE,
        'permission_callback' => __NAMESPACE__ . '\\authorize',
        'callback' => __NAMESPACE__ . '\\create',
    ]);
});
