"""FWB-03 offline regression tests — no network, no WordPress access."""
import json
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import fwb_client as fwb


def create_manifest():
    return {
        "operation_id": "fwb_news14_20261120",
        "operation": "create",
        "fields": {"title": "Título de teste", "content": "<p>Texto</p>"},
    }


class ManifestTests(unittest.TestCase):
    def test_create_valid(self):
        self.assertEqual(fwb.validate_manifest(create_manifest())["operation"], "create")

    def test_dryrun_by_default(self):
        self.assertIs(fwb.build_payload(create_manifest(), dry_run=True)["dry_run"], True)

    def test_reject_publish_status(self):
        m = create_manifest()
        m["fields"]["status"] = "publish"
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_reject_meta_and_author(self):
        for key in ("meta", "author", "post_status", "dry_run"):
            m = create_manifest()
            m["fields"][key] = "bad"
            with self.subTest(key=key), self.assertRaises(fwb.FWBError):
                fwb.validate_manifest(m)

    def test_reject_extra_operation(self):
        m = create_manifest()
        m["operation"] = "publish"
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_reject_missing_idempotency(self):
        m = create_manifest()
        m.pop("operation_id")
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_reject_extra_top_level(self):
        m = create_manifest()
        m["foo"] = True
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_update_requires_expected(self):
        m = create_manifest()
        m["operation"] = "update"
        m["post_id"] = 234
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)
        m["expected_modified_gmt"] = "2026-11-20 18:00:00"
        self.assertTrue(fwb.validate_manifest(m))

    def test_reject_oversized_text(self):
        m = create_manifest()
        m["fields"]["content"] = "x" * 250001
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_reject_bool_as_postid(self):
        m = create_manifest()
        m.update(operation="update", post_id=True, expected_modified_gmt="2026-11-20 18:00:00")
        with self.assertRaises(fwb.FWBError):
            fwb.validate_manifest(m)

    def test_reject_duplicate_keys(self):
        with self.assertRaises(fwb.FWBError):
            json.loads('{"operation":"create","operation":"publish"}', object_pairs_hook=fwb._no_duplicate_keys)

    def test_probe_rejects_privileged_account(self):
        with patch.object(fwb, "wp_request", return_value={"id": 7, "capabilities": {"edit_posts": True, "publish_posts": True}}):
            with self.assertRaises(fwb.FWBError):
                fwb.probe()

    def test_probe_rejects_missing_capabilities(self):
        with patch.object(fwb, "wp_request", return_value={"id": 7}):
            with self.assertRaises(fwb.FWBError):
                fwb.probe()

    def test_probe_accepts_least_privileged_account(self):
        with patch.object(fwb, "wp_request", return_value={"id": 7, "capabilities": {"edit_posts": True, "publish_posts": False}}):
            fwb.probe()

    def test_apply_rejects_no_approval_without_network(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(fwb.FWBError):
            fwb.require_github_approval()

    def test_reject_redirect(self):
        handler = fwb.NoRedirect()
        with self.assertRaises(fwb.FWBError):
            handler.redirect_request(None, None, 302, "redirect", {}, "https://evil.example/")

    def test_reject_unsupported_route_before_credentials(self):
        with self.assertRaises(fwb.FWBError):
            fwb.wp_request("/wp-json/wp/v2/posts", method="POST", payload={})

    def test_plan_without_path_rejected(self):
        with self.assertRaises(fwb.FWBError):
            fwb.load_manifest("../secrets.json")


if __name__ == "__main__":
    unittest.main()
