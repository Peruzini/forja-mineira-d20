"""FWB-04B: offline tests for public REST probe (no network)."""
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import fwb_public_preflight as preflight


class FakeResponse:
    def __init__(self, status, body):
        self.status = status
        self.body = body
        self.closed = False
    def read(self, count):
        return self.body[:count]
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, traceback):
        self.closed = True


class FakeOpener:
    def __init__(self, status=200, body=b'{"ok":true}'):
        self.response = FakeResponse(status, body)
        self.calls = []
    def open(self, request, timeout):
        self.calls.append((request, timeout))
        return self.response


class PublicPreflightTests(unittest.TestCase):
    def test_allowlist_only(self):
        for route in ("/wp-json/wp/v2/posts", "//evil.example", "http://evil.example"):
            with self.subTest(route=route), self.assertRaises(preflight.PreflightError):
                preflight.fetch_public(route)

    def test_uses_fixed_https_host_get_and_no_auth(self):
        opener = FakeOpener()
        with patch.object(preflight.urllib.request, "build_opener", return_value=opener):
            status, payload = preflight.fetch_public(preflight.ROUTES[0])
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])
        request, timeout = opener.calls[0]
        self.assertTrue(request.full_url.startswith("https://forjamineirad20.com.br/wp-json/"))
        self.assertEqual(request.get_method(), "GET")
        self.assertNotIn("Authorization", request.headers)
        self.assertEqual(timeout, preflight.TIMEOUT_SECONDS)

    def test_rejects_redirect(self):
        with self.assertRaises(preflight.PreflightError):
            preflight.DenyRedirects().redirect_request(None, None, 302, "moved", {}, "https://evil.example/")

    def test_non_json_fails_closed(self):
        opener = FakeOpener(body=b"<html>blocked</html>")
        with patch.object(preflight.urllib.request, "build_opener", return_value=opener):
            with self.assertRaises(preflight.PreflightError):
                preflight.fetch_public(preflight.ROUTES[0])

    def test_503_fails_closed(self):
        opener = FakeOpener(status=503)
        with patch.object(preflight.urllib.request, "build_opener", return_value=opener):
            with self.assertRaises(preflight.PreflightError):
                preflight.fetch_public(preflight.ROUTES[0])

    def test_anonymous_probe_requires_denial(self):
        data = {
            preflight.ROUTES[0]: (200, {"namespaces": ["wp/v2"], "authentication": {}}),
            preflight.ROUTES[1]: (200, {"post": {"slug": "post"}}),
            preflight.ROUTES[2]: (200, {"id": 1}),
        }
        with patch.object(preflight, "fetch_public", side_effect=lambda p: data[p]):
            with self.assertRaises(preflight.PreflightError):
                preflight.run_preflight()

    def test_success_public_readiness_does_not_prove_auth(self):
        data = {
            preflight.ROUTES[0]: (200, {"namespaces": ["wp/v2"], "authentication": {"application-passwords": {}}}),
            preflight.ROUTES[1]: (200, {"post": {"slug": "post"}}),
            preflight.ROUTES[2]: (401, {"code": "rest_not_logged_in"}),
        }
        with patch.object(preflight, "fetch_public", side_effect=lambda p: data[p]):
            preflight.run_preflight()


if __name__ == "__main__":
    unittest.main()
