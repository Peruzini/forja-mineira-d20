#!/usr/bin/env python3
"""FWB-04B: public read-only WordPress API readiness check.

Three GET requests to the FIXED production host, no authentication, no writes,
no cookies, no secret access and no redirects. This is NOT an auth probe.
"""
from __future__ import annotations

import json
import ssl
import sys
import urllib.error
import urllib.request

BASE = "https://forjamineirad20.com.br"
ROUTES = (
    "/wp-json/",
    "/wp-json/wp/v2/types?context=view",
    "/wp-json/wp/v2/users/me?context=edit",
)
MAX_BYTES = 2_000_000
TIMEOUT_SECONDS = 12


class PreflightError(Exception):
    pass


class DenyRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise PreflightError(f"Redirecionamento HTTP {code} bloqueado; validar configuração do site.")


def fetch_public(route: str):
    """Return (HTTP status, JSON object). Never transmits Authorization."""
    if route not in ROUTES:
        raise PreflightError("Rota fora da allowlist de leitura.")
    request = urllib.request.Request(
        BASE + route,
        headers={"Accept": "application/json", "User-Agent": "Forja-WP-Bridge-FWB04B-readonly/0.1"},
        method="GET",
    )
    opener = urllib.request.build_opener(
        DenyRedirects(),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
    )
    try:
        try:
            response = opener.open(request, timeout=TIMEOUT_SECONDS)
        except urllib.error.HTTPError as err:
            response = err
        with response:
            status = response.status
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise PreflightError(f"Resposta HTTP {status} excede limite de tamanho.")
            if status not in (200, 401, 403):
                # Never print response body, it may include private server diagnostics.
                raise PreflightError(f"HTTP {status} no endpoint de leitura.")
            try:
                payload = json.loads(raw.decode("utf-8"))
            except (UnicodeError, json.JSONDecodeError):
                raise PreflightError(f"HTTP {status}: resposta não é JSON REST válido.") from None
            if not isinstance(payload, dict):
                raise PreflightError(f"HTTP {status}: resposta REST inválida.")
            return status, payload
    except urllib.error.URLError as err:
        raise PreflightError(f"Falha de rede ou TLS ({type(err.reason).__name__}); sem credenciais utilizadas.") from None


def run_preflight():
    status, root = fetch_public(ROUTES[0])
    if status != 200 or "wp/v2" not in root.get("namespaces", []):
        raise PreflightError("REST index externo não respondeu com namespace wp/v2.")
    print("PASS: WordPress REST index acessível externamente (GET anônimo).")
    auth = root.get("authentication")
    advertises_app_password = isinstance(auth, dict) and "application-passwords" in auth
    print(f"INFO: REST index anuncia Application Passwords: {advertises_app_password}.")
    # This is merely advertised capability, not proof of credentials working.
    status, types = fetch_public(ROUTES[1])
    if status != 200 or "post" not in types:
        raise PreflightError("GET público /wp/v2/types não confirmou tipo post.")
    print("PASS: endpoint WordPress de tipos públicos acessível.")
    status, me = fetch_public(ROUTES[2])
    if status not in (401, 403):
        raise PreflightError("ALERTA: /users/me retornou status inesperado para usuário anônimo.")
    print(f"PASS: /users/me não revela identidade de usuário anônimo (HTTP {status}).")
    print("FWB04B: Conectividade REST pública PASS. Autenticação e escrita NÃO testadas.")


if __name__ == "__main__":
    try:
        run_preflight()
    except PreflightError as exc:
        print(f"FWB04B HOLD: {exc}", file=sys.stderr)
        sys.exit(1)
