#!/usr/bin/env python3
"""FWB-03: WordPress REST client, independent of WPVibe. Python stdlib only.

Modes:
- plan: offline validation of a reviewed JSON manifest; NO network.
- probe: authenticated read-only WP REST check; NO writes.
- apply: *draft only*, behind GitHub environment approval and server-side safeguards.

Never print credentials, raw WordPress error bodies, or full editorial content.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request

SITE = "https://forjamineirad20.com.br"
REPO_ROOT = Path(__file__).resolve().parents[1]
REQUEST_DIR = REPO_ROOT / "editorial" / "fwb" / "requests"
PATH_PATTERN = re.compile(r"^editorial/fwb/requests/[a-z0-9][a-z0-9_.-]*\.json$")
ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{11,79}$")
SHA_PATTERN = re.compile(r"^[a-f0-9]{64}$")
UTC_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$")
EDIT_FIELDS = {"title": 500, "content": 250_000, "excerpt": 5000, "slug": 200}


class FWBError(Exception):
    """An operational error safe for logs."""


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise FWBError("Redirecionamento HTTP proibido; verificar URL/TLS sem enviar credenciais.")


def _no_duplicate_keys(pairs):
    obj = {}
    for k, v in pairs:
        if k in obj:
            raise FWBError("JSON possui chaves duplicadas.")
        obj[k] = v
    return obj


def validate_manifest(value):
    """Validate proposal data strictly, without logging or transforming content."""
    if type(value) is not dict:
        raise FWBError("Manifesto deve ser objeto JSON.")
    if set(value) - {"operation_id", "operation", "fields", "post_id", "expected_modified_gmt"}:
        raise FWBError("Manifesto possui campos não autorizados.")
    op = value.get("operation")
    if op not in ("create", "update"):
        raise FWBError("Operação deve ser create ou update.")
    op_id = value.get("operation_id")
    if not isinstance(op_id, str) or not ID_PATTERN.fullmatch(op_id):
        raise FWBError("operation_id deve ter 12–80 caracteres alfanuméricos, _ ou -.")
    fields = value.get("fields")
    if type(fields) is not dict or not fields or set(fields) - set(EDIT_FIELDS):
        raise FWBError("fields deve conter apenas title, content, excerpt e/ou slug.")
    for key, content in fields.items():
        if not isinstance(content, str) or len(content.encode("utf-8")) > EDIT_FIELDS[key]:
            raise FWBError(f"Campo {key} deve ser string dentro do limite.")
    if "title" in fields and not fields["title"].strip():
        raise FWBError("Título não pode ficar vazio.")
    if op == "create":
        if set(value) & {"post_id", "expected_modified_gmt"}:
            raise FWBError("Criação não pode informar post_id nem expected_modified_gmt.")
        if not fields.get("title", "").strip():
            raise FWBError("Novo rascunho precisa de título.")
    else:
        if type(value.get("post_id")) is not int or value["post_id"] < 1:
            raise FWBError("Atualização precisa de post_id positivo.")
        stamp = value.get("expected_modified_gmt")
        if not isinstance(stamp, str) or not UTC_PATTERN.fullmatch(stamp):
            raise FWBError("Atualização precisa de expected_modified_gmt UTC.")
    return value


def load_manifest(path, expected_sha256="", require_digest=False):
    if not isinstance(path, str) or not PATH_PATTERN.fullmatch(path):
        raise FWBError("Arquivo deve estar em editorial/fwb/requests/ e ter nome permitido.")
    requested = REPO_ROOT / path
    try:
        actual = requested.resolve(strict=True)
    except (OSError, RuntimeError):
        raise FWBError("Arquivo solicitado não encontrado.") from None
    base = REQUEST_DIR.resolve()
    if actual.parent != base or not actual.is_file():
        raise FWBError("Caminho de manifesto fora da pasta autorizada.")
    raw = actual.read_bytes()
    if len(raw) > 260_000:
        raise FWBError("Manifesto acima do limite.")
    digest = hashlib.sha256(raw).hexdigest()
    if require_digest and not SHA_PATTERN.fullmatch(expected_sha256 or ""):
        raise FWBError("SHA-256 aprovado obrigatório em execução real.")
    if expected_sha256 and not hmac.compare_digest(digest, expected_sha256):
        raise FWBError("SHA-256 do arquivo diverge do valor aprovado.")
    try:
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=_no_duplicate_keys)
    except (UnicodeError, json.JSONDecodeError):
        raise FWBError("Manifesto precisa ser JSON UTF-8 válido.") from None
    return validate_manifest(value), digest


def build_payload(manifest, *, dry_run):
    fields = dict(manifest["fields"])
    fields["dry_run"] = dry_run
    if manifest["operation"] == "update":
        fields["expected_modified_gmt"] = manifest["expected_modified_gmt"]
    return fields


def _authorization_header():
    user = os.environ.get("FWB_WP_USERNAME")
    password = os.environ.get("FWB_WP_APP_PASSWORD")
    if not user or not password or ":" in user or "\n" in user or "\r" in user:
        raise FWBError("Conta técnica/segredo de aplicação não configurados.")
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return "Basic " + token


def wp_request(route, *, method="GET", payload=None, idempotency_key=None):
    if method not in ("GET", "POST") or not route.startswith("/wp-json/"):
        raise FWBError("Rota ou método não permitido.")
    allowed = (
        route == "/wp-json/wp/v2/users/me?context=edit"
        or route == "/wp-json/forja-bridge/v1/status"
        or route == "/wp-json/forja-bridge/v1/drafts"
        or bool(re.fullmatch(r"/wp-json/forja-bridge/v1/drafts/[1-9]\d*", route))
    )
    if not allowed:
        raise FWBError("Rota fora da allowlist.")
    headers = {"Authorization": _authorization_header(), "Accept": "application/json"}
    data = None
    if payload is not None:
        if method != "POST":
            raise FWBError("Corpo não permitido em GET.")
        headers["Content-Type"] = "application/json"
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if idempotency_key is not None:
        if not ID_PATTERN.fullmatch(idempotency_key):
            raise FWBError("Idempotency-Key inválida.")
        headers["X-FWB-Idempotency-Key"] = idempotency_key

    req = urllib.request.Request(SITE + route, data=data, headers=headers, method=method)
    opener = urllib.request.build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=20) as response:
            raw = response.read(32_000)
            if response.read(1):
                raise FWBError("Resposta da API excede o limite.")
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Never leak response body; it can contain private content or server diagnostics.
        raise FWBError(f"WordPress retornou HTTP {exc.code} (sem repetição automática).") from None
    except urllib.error.URLError:
        raise FWBError("Falha de rede/TLS; não repetir escrita automaticamente.") from None
    except (UnicodeError, json.JSONDecodeError):
        raise FWBError("Resposta WordPress não é JSON válido.") from None


def probe():
    profile = wp_request("/wp-json/wp/v2/users/me?context=edit")
    if type(profile) is not dict or type(profile.get("id")) is not int:
        raise FWBError("Não foi possível confirmar a identidade REST.")
    caps = profile.get("capabilities")
    can_edit = caps.get("edit_posts") if type(caps) is dict else None
    can_publish = caps.get("publish_posts") if type(caps) is dict else None
    if can_edit is not True or can_publish is not False:
        raise FWBError("Conta REST não tem perfil de serviço seguro (exigir edit_posts=true e publish_posts=false).")
    print("FWB PROBE: autenticação REST confirmada, permissões mínimas PASS (somente leitura).")
    # O plugin Bridge não precisa estar instalado para este diagnóstico.


def require_github_approval():
    if not (
        os.environ.get("GITHUB_ACTIONS") == "true"
        and os.environ.get("GITHUB_EVENT_NAME") == "workflow_dispatch"
        and os.environ.get("GITHUB_REF") == "refs/heads/main"
        and os.environ.get("FWB_ENABLE_ACTIONS_WRITE") == "true"
        and os.environ.get("FWB_APPROVAL_ASSERTION") == "CRIAR_RASCUNHO_SEM_PUBLICAR"
    ):
        raise FWBError("Execução real bloqueada pelos gates de autorização GitHub.")


def apply(manifest):
    require_github_approval()
    profile = wp_request("/wp-json/wp/v2/users/me?context=edit")
    caps = profile.get("capabilities") if type(profile) is dict else None
    if type(caps) is not dict or caps.get("edit_posts") is not True or caps.get("publish_posts") is not False:
        raise FWBError("Conta técnica deve comprovar edit_posts=true e publish_posts=false.")
    status = wp_request("/wp-json/forja-bridge/v1/status")
    if not (
        type(status) is dict
        and status.get("policy") == "draft_only"
        and status.get("writes_enabled") is True
        and status.get("idempotency_required_for_writes") is True
        and status.get("can_publish_posts") is False
    ):
        raise FWBError("Bridge instalado ainda não atende aos requisitos de segurança.")
    route = "/wp-json/forja-bridge/v1/drafts"
    if manifest["operation"] == "update":
        route += "/" + str(manifest["post_id"])
    result = wp_request(
        route,
        method="POST",
        payload=build_payload(manifest, dry_run=False),
        idempotency_key=manifest["operation_id"],
    )
    if type(result) is not dict or type(result.get("id")) is not int or result.get("status") != "draft" or result.get("dry_run") is not False:
        raise FWBError("Resposta de escrita inconclusiva: verificar estado antes de repetir.")
    print(f"FWB APPLY: operação de rascunho confirmada; post_id={result['id']}; replayed={result.get('replayed', False)!r}.")
    return result


def main():
    parser = argparse.ArgumentParser(description="Forja WP Bridge — GitHub Actions REST client")
    parser.add_argument("mode", choices=("plan", "probe", "apply"))
    parser.add_argument("--file", default=os.environ.get("FWB_REQUEST_FILE", ""))
    parser.add_argument("--sha256", default=os.environ.get("FWB_REQUEST_SHA256", ""))
    args = parser.parse_args()
    try:
        if args.mode == "probe":
            probe()
            return 0
        manifest, digest = load_manifest(
            args.file, args.sha256,
            require_digest=(args.mode == "apply"),
        )
        if args.mode == "plan":
            print(f"FWB PLAN: manifesto válido; operation={manifest['operation']}; sha256={digest}.")
            print("FWB PLAN: sem rede, sem escrita e sem conteúdo exposto nos logs.")
            return 0
        apply(manifest)
        return 0
    except FWBError as exc:
        print(f"FWB ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
