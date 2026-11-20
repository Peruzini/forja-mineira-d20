#!/usr/bin/env python3
"""FWB-04 disposable WordPress integration regression suite.

ONLY runs against loopback WordPress containers. Never calls the real site.
CI populates an ephemeral contributor Application Password and discards it.
"""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import quote

BASE = "http://127.0.0.1:18080"
USERNAME = "fwb-ci"
ALLOWED_PREFIX = "http://127.0.0.1:18080/wp-json/"
PASSWORD = os.environ.get("FWB_STAGING_APP_PASSWORD", "")
passed = 0


def check(desc, ok):
    global passed
    if not ok:
        raise AssertionError(desc)
    passed += 1
    print(f"PASS: {desc}")


def request(route, method="GET", payload=None, key=None, auth=True):
    if not route.startswith("/wp-json/") or not BASE.startswith("http://127.0.0.1:"):
        raise AssertionError("Only loopback WordPress REST is allowed")
    if not PASSWORD:
        raise AssertionError("Missing ephemeral application password")
    url = BASE + route
    headers = {"Accept": "application/json"}
    if auth:
        token = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
        headers["Authorization"] = "Basic " + token
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if key:
        headers["X-FWB-Idempotency-Key"] = key
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, json.loads(response.read(200000).decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read(200000).decode("utf-8"))


def main():
    status, _ = request("/wp-json/forja-bridge/v1/status", auth=False)
    check("anonymous status denied", status in (401, 403))

    status, info = request("/wp-json/forja-bridge/v1/status")
    check("authenticated bridge status", status == 200 and info["version"] == "0.2.0")
    check("draft-only enforcement enabled in local CI", info["policy"] == "draft_only" and info["writes_enabled"] is True)
    check("contributor cannot publish", info["can_publish_posts"] is False)

    other_draft = os.environ.get("FWB_STAGING_ADMIN_DRAFT_ID", "")
    published_id = os.environ.get("FWB_STAGING_PUBLISHED_ID", "")
    check("admin test fixture IDs provided", other_draft.isdigit() and published_id.isdigit())
    status, denied = request(f"/wp-json/forja-bridge/v1/drafts/{other_draft}")
    check("cannot read another author's draft", status == 403)
    status, denied = request(
        f"/wp-json/forja-bridge/v1/drafts/{other_draft}",
        "POST",
        {"title": "Unauthorized", "dry_run": False, "expected_modified_gmt": "2001-01-01 00:00:00"},
        "fwb04_other_author_denied",
    )
    check("cannot modify another author's draft", status == 403)
    status, denied = request(f"/wp-json/forja-bridge/v1/drafts/{published_id}")
    check("published post hidden from Bridge", status == 404)
    status, denied = request(
        f"/wp-json/forja-bridge/v1/drafts/{published_id}",
        "POST",
        {"title": "No publishing", "dry_run": False, "expected_modified_gmt": "2001-01-01 00:00:00"},
        "fwb04_published_denied",
    )
    check("published post cannot be modified", status == 404)
    status, denied = request("/wp-json/wp/v2/posts", "POST", {"title": "No publish through core REST", "status": "publish"})
    check("contributor cannot publish through native REST", status in (400, 401, 403))

    payload = {"title": "FWB integration fixture", "content": "<!-- wp:paragraph --><p>Exemplo de teste CI</p><!-- /wp:paragraph -->"}
    status, preview = request("/wp-json/forja-bridge/v1/drafts", "POST", payload)
    check("no-write default dry_run", status == 200 and preview["dry_run"] is True and "id" not in preview)

    status, invalid = request("/wp-json/forja-bridge/v1/drafts", "POST", {**payload, "dry_run": False, "status": "publish"}, "fwb04_invalid_publish")
    check("explicit publish rejected", status == 400 and invalid.get("code") == "fwb_invalid_payload")

    status, invalid = request("/wp-json/forja-bridge/v1/drafts", "POST", {**payload, "dry_run": False}, None)
    check("real write without idempotency key rejected", status == 400 and invalid.get("code") == "fwb_idempotency_required")

    create_payload = {**payload, "dry_run": False}
    key = "fwb04_create_fixture_01"
    status, result = request("/wp-json/forja-bridge/v1/drafts", "POST", create_payload, key)
    check("new operation created only draft", status == 201 and result["status"] == "draft" and result["dry_run"] is False)
    draft_id = result["id"]

    status, saved = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}")
    check("read own draft", status == 200 and saved["id"] == draft_id and saved["status"] == "draft")
    check("Gutenberg content retained", "wp:paragraph" in saved["content"])

    status, repeat = request("/wp-json/forja-bridge/v1/drafts", "POST", create_payload, key)
    check("idempotent same request replays receipt", status == 200 and repeat["id"] == draft_id and repeat["replayed"] is True)

    status, conflict = request("/wp-json/forja-bridge/v1/drafts", "POST", {**create_payload, "title": "Outro"}, key)
    check("same key different payload rejected", status == 409 and conflict.get("code") == "fwb_key_conflict")

    update_payload = {"title": "FWB fixture editada", "dry_run": False, "expected_modified_gmt": saved["modified_gmt"]}
    update_key = "fwb04_update_fixture_01"
    status, updated = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}", "POST", update_payload, update_key)
    check("update own draft only", status == 200 and updated["status"] == "draft")

    status, replay_update = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}", "POST", update_payload, update_key)
    check("idempotent update replayed", status == 200 and replay_update.get("replayed") is True)

    status, after = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}")
    check("updated title persisted", status == 200 and after["title"] == "FWB fixture editada")

    stale_payload = {"title": "Should not write", "dry_run": False, "expected_modified_gmt": "2001-01-01 00:00:00"}
    status, stale = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}", "POST", stale_payload, "fwb04_update_stale_01")
    check("stale version rejected", status == 409 and stale.get("code") == "fwb_version_conflict")

    status, invalid = request(f"/wp-json/forja-bridge/v1/drafts/{draft_id}", "POST", {**update_payload, "status": "publish"}, "fwb04_update_publish")
    check("update publish rejected", status == 400 and invalid.get("code") == "fwb_invalid_payload")

    status, readonly = request(f"/wp-json/wp/v2/posts/{draft_id}?context=edit")
    check("native WP API confirms draft", status == 200 and readonly["status"] == "draft")

    # CI WP-CLI independently verifies audited event count and creates a published fixture.
    print(f"FWB04_DRAFT_ID={draft_id}")
    print(f"FWB04_PASSED={passed}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Do not print credentials or raw server data.
        print(f"FWB-04 ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
