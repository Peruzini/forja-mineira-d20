#!/usr/bin/env python3
"""R2B1-C1-R1: end-user Account REST enforcement in an ephemeral Keycloak realm."""
import base64
import copy
import hashlib
import importlib.util
import os
import secrets
import ssl
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse
import jwt
from bs4 import BeautifulSoup

helper = Path(__file__).parents[1] / "fwb-reg04b" / "keycloak-oauth-e2e.py"
spec = importlib.util.spec_from_file_location("fwb_r1_oauth", helper)
oauth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oauth)
session = oauth.s
issuer = oauth.ISSUER
origin = "https://auth-lab.example.org"
admin_base = origin + "/admin/realms/fwb-reg04b-lab"
client_id = "fwb-account-selfservice-ci"
account_endpoint = issuer + "/account/v1/"


def require(ok, message):
    if not ok:
        raise AssertionError(message)


def admin_request(path, method="GET", data=None):
    headers = {"Authorization": "Bearer " + administrator_token,
               "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    return session.request(method, admin_base + path, headers=headers, json=data,
                           timeout=25, allow_redirects=False)


def admin_get(path):
    response = admin_request(path)
    require(response.status_code == 200, "ADMIN_HTTP_" + str(response.status_code))
    return response.json()


def prepare_account_client():
    global subject_id
    original = admin_get("/clients?clientId=fwb-reg04b-lab-client")
    require(len(original) == 1, "ORIGINAL_CLIENT_MISSING")
    original_client = admin_get("/clients/" + original[0]["id"])

    client = admin_get("/clients?clientId=account")
    require(len(client) == 1, "BUILTIN_ACCOUNT_CLIENT_MISSING")
    account_id = client[0]["id"]
    names = ("manage-account", "view-profile")
    roles = [admin_get("/clients/" + account_id + "/roles/" + n) for n in names]
    user = admin_get("/users?username=fwb-lab-user&exact=true")
    require(len(user) == 1, "LAB_USER_MISSING")
    subject_id = user[0]["id"]
    existing = admin_get("/users/" + subject_id +
                         "/role-mappings/clients/" + account_id)
    pending = [r for r in roles if r["name"] not in {v["name"] for v in existing}]
    if pending:
        result = admin_request("/users/" + subject_id +
                               "/role-mappings/clients/" + account_id,
                               "POST", pending)
        require(result.status_code == 204, "LAB_ACCOUNT_ROLE_GRANT_FAILED")

    definition = {
        "clientId": client_id, "name": "R2B1-C1 isolated Account REST probe",
        "enabled": True, "protocol": "openid-connect",
        "publicClient": True, "standardFlowEnabled": True,
        "implicitFlowEnabled": False, "directAccessGrantsEnabled": False,
        "serviceAccountsEnabled": False, "fullScopeAllowed": False,
        "consentRequired": True,
        "redirectUris": [oauth.REDIRECT], "webOrigins": [],
        "attributes": {"pkce.code.challenge.method": "S256"},
        "protocolMappers": [
            {"name": "r1-account-audience", "protocol": "openid-connect",
             "protocolMapper": "oidc-audience-mapper", "consentRequired": False,
             "config": {"included.custom.audience": "account",
                        "access.token.claim": "true", "id.token.claim": "false"}},
            {"name": "r1-account-role-mapper", "protocol": "openid-connect",
             "protocolMapper": "oidc-usermodel-client-role-mapper",
             "consentRequired": False,
             "config": {"usermodel.clientRoleMapping.clientId": "account",
                        "claim.name": "resource_access.account.roles",
                        "jsonType.label": "String", "multivalued": "true",
                        "access.token.claim": "true", "id.token.claim": "false"}}
        ]
    }
    result = admin_request("/clients", "POST", definition)
    require(result.status_code == 201, "LAB_ACCOUNT_CLIENT_CREATE_FAILED")
    created = admin_get("/clients?clientId=" + client_id)
    require(len(created) == 1, "LAB_ACCOUNT_CLIENT_NOT_FOUND")
    mapped = admin_request("/clients/" + created[0]["id"] +
                           "/scope-mappings/clients/" + account_id,
                           "POST", roles)
    require(mapped.status_code == 204, "LAB_ACCOUNT_SCOPE_MAPPING_FAILED")
    require(admin_get("/clients/" + original[0]["id"]) == original_client,
            "ORIGINAL_MCP_CLIENT_CHANGED")
    print("R2B1_C1_R1_ISOLATED_ACCOUNT_CLIENT_PASS", flush=True)


def authorize_account():
    info = session.get(issuer + "/.well-known/openid-configuration",
                       timeout=25).json()
    require(info.get("issuer") == issuer, "ISSUER_MISMATCH")
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(48)).decode().rstrip("=")
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    state = "r1-" + secrets.token_hex(16)
    values = {"response_type": "code", "client_id": client_id,
              "redirect_uri": oauth.REDIRECT, "scope": "openid",
              "code_challenge": challenge, "code_challenge_method": "S256",
              "state": state}
    response = session.get(info["authorization_endpoint"], params=values,
                           timeout=25, allow_redirects=False)
    require(response.status_code == 200, "OAUTH_LOGIN_NOT_AVAILABLE")
    action, body, _ = oauth.form(response, "form#kc-form-login")
    body.update({"username": "fwb-lab-user", "password": oauth.PASSWORD})
    response = session.post(action, data=body, timeout=25,
                            allow_redirects=False)
    callback = None
    consent_observed = False
    for hop in range(12):
        if response.status_code in (302, 303):
            target = urljoin(response.url, response.headers.get("Location", ""))
            if target.startswith(oauth.REDIRECT + "?"):
                callback = target
                break
            parsed = urlparse(target)
            require(parsed.scheme == "https" and
                    parsed.hostname == "auth-lab.example.org", "OAUTH_REDIRECT_ORIGIN")
            response = session.get(target, timeout=25, allow_redirects=False)
        elif response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            selector = ("form#kc-consent-form" if soup.select_one("form#kc-consent-form")
                        else "#kc-oauth form")
            require(soup.select_one(selector) is not None, "OAUTH_EXPECTED_CONSENT")
            action, body, form = oauth.form(response, selector)
            submit = (form.find("button", {"name": "accept"}) or
                      form.find("input", {"name": "accept"}))
            body["accept"] = (submit.get("value") or "Yes") if submit else "Yes"
            consent_observed = True
            response = session.post(action, data=body, timeout=25,
                                    allow_redirects=False)
        else:
            raise AssertionError("OAUTH_UNEXPECTED_HTTP_" + str(response.status_code))
    # A new client may return a code directly for scope=openid with no separate
    # consent screen. PKCE, state, audience, signature and role checks remain.
    require(callback is not None, "OAUTH_CALLBACK_MISSING_HTTP_" +
            str(response.status_code) + "_CONSENT_" + str(consent_observed))
    parameters = parse_qs(urlparse(callback).query)
    require(parameters.get("state", [""])[0] == state and
            len(parameters.get("code", [])) == 1, "OAUTH_STATE_CODE_INVALID")
    token_result = session.post(info["token_endpoint"],
        data={"grant_type": "authorization_code", "client_id": client_id,
              "redirect_uri": oauth.REDIRECT, "code_verifier": verifier,
              "code": parameters["code"][0]}, timeout=25)
    require(token_result.status_code == 200, "TOKEN_EXCHANGE_HTTP_" +
            str(token_result.status_code))
    access_token = token_result.json()["access_token"]
    trust = ssl.create_default_context(cafile=os.environ["FWB_LAB_TLS_CERT"])
    signing_key = jwt.PyJWKClient(
        info["jwks_uri"], ssl_context=trust).get_signing_key_from_jwt(access_token).key
    claims = jwt.decode(access_token, signing_key, algorithms=["RS256"],
                        audience="account", issuer=issuer)
    audiences = claims["aud"] if isinstance(claims["aud"], list) else [claims["aud"]]
    require(oauth.MCP not in audiences, "MCP_AUDIENCE_ADDED")
    require(claims["sub"] == subject_id and claims.get("azp") == client_id,
            "OAUTH_USER_OR_CLIENT_MISMATCH")
    resource = claims.get("resource_access", {})
    account_roles = resource.get("account", {}).get("roles", [])
    require(all(r in account_roles for r in ("manage-account", "view-profile")),
            "ACCOUNT_USER_ROLE_MISSING")
    require(not resource.get("realm-management", {}).get("roles", []),
            "ADMIN_ROLE_IN_ACCOUNT_TOKEN")
    print("R2B1_C1_R1_VERIFIED_ACCOUNT_PKCE_PASS", flush=True)
    return access_token


def verify_self_service(token):
    user_headers = {"Authorization": "Bearer " + token,
                    "Accept": "application/json",
                    "Content-Type": "application/json"}
    initial = admin_get("/users/" + subject_id)
    keys = ("id", "username", "email", "firstName", "lastName",
            "emailVerified", "enabled", "requiredActions")
    preserved = {key: initial[key] for key in keys if key in initial}
    stored = {"fwb_site_id": ["site_lab"],
              "fwb_connection_id": ["r1_original_connection_20261121"]}
    result = admin_request("/users/" + subject_id, "PUT",
                           {**preserved, "attributes": stored})
    require(result.status_code == 204, "TEST_FIXTURE_FAILED")
    actual = admin_get("/users/" + subject_id)
    require(all(actual.get("attributes", {}).get(key) == value
                for key, value in stored.items()), "FIXTURE_NOT_PERSISTED")
    got = session.get(account_endpoint, headers=user_headers, timeout=25)
    require(got.status_code == 200, "ACCOUNT_READ_HTTP_" + str(got.status_code))
    profile = got.json()
    require(all(key not in profile.get("attributes", {})
                for key in stored), "ACCOUNT_READ_ADMIN_FIELD_VISIBLE")
    print("R2B1_C1_R1_ADMIN_FIELDS_HIDDEN_PASS", flush=True)
    positive = copy.deepcopy(profile)
    positive["firstName"] = "R1-Verified"
    result = session.post(account_endpoint, headers=user_headers,
                          json=positive, timeout=25)
    require(result.status_code == 204, "ACCOUNT_POSITIVE_HTTP_" + str(result.status_code))
    readback = admin_get("/users/" + subject_id)
    require(readback.get("firstName") == "R1-Verified", "POSITIVE_EDIT_NOT_STORED")
    require(all(readback.get("attributes", {}).get(key) == value
                for key, value in stored.items()), "POSITIVE_EDIT_CHANGED_FWB")
    print("R2B1_C1_R1_SELF_EDIT_POSITIVE_PASS", flush=True)
    negative = copy.deepcopy(positive)
    negative["attributes"] = dict(negative.get("attributes", {}))
    negative["attributes"].update({
        "fwb_site_id": ["unauthorized_site"],
        "fwb_connection_id": ["unauthorized_connection"],
        "r1_undeclared_attribute": ["not_allowed"]})
    result = session.post(account_endpoint, headers=user_headers,
                          json=negative, timeout=25)
    require(result.status_code in (204, 400, 403), "NEGATIVE_HTTP_UNEXPECTED")
    readback = admin_get("/users/" + subject_id)
    require(all(readback.get("attributes", {}).get(key) == value
                for key, value in stored.items()), "PROTECTED_FIELD_MUTATED")
    require("r1_undeclared_attribute" not in readback.get("attributes", {}),
            "UNDECLARED_ATTRIBUTE_PERSISTED")
    print("R2B1_C1_R1_PROTECTED_WRITE_NEGATIVE_PASS", flush=True)
    result = admin_request("/users/" + subject_id, "PUT",
                           {**preserved, "attributes": stored})
    require(result.status_code == 204, "LAB_PROFILE_RESTORE_HTTP")
    restored = admin_get("/users/" + subject_id)
    require(all(restored.get(k) == initial.get(k) for k in keys),
            "LAB_BASIC_PROFILE_NOT_RESTORED")
    print("R2B1_C1_R1_CORE_PROFILE_PRESERVED_PASS", flush=True)


response = session.post(origin + "/realms/master/protocol/openid-connect/token",
    data={"grant_type": "password", "client_id": "admin-cli",
          "username": "lab-admin", "password": "only-temporary-ci-admin"},
    timeout=25)
require(response.status_code == 200, "LAB_ADMIN_NOT_READY")
administrator_token = response.json()["access_token"]
prepare_account_client()
access_token = authorize_account()
verify_self_service(access_token)
print("R2B1_C1_R1_ACCOUNT_REST_POLICY_PASS", flush=True)
