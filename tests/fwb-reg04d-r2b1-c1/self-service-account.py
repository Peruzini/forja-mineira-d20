#!/usr/bin/env python3
"""C1: real Keycloak Account REST self-service security probe in disposable CI only.

Uses a separate PKCE client, exact account audience and only account client roles.
Never changes the FWB MCP client's audience, scopes or permissions.
"""
import base64
import copy
import hashlib
import importlib.util
import json
import secrets
from pathlib import Path
from urllib.parse import parse_qs, urljoin, urlparse

import jwt
from bs4 import BeautifulSoup

helper_path = Path(__file__).parents[1] / "fwb-reg04b" / "keycloak-oauth-e2e.py"
spec = importlib.util.spec_from_file_location("fwb_lab_account_login", helper_path)
oauth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oauth)
s, issuer = oauth.s, oauth.ISSUER
origin = "https://auth-lab.example.org"
realm = "fwb-reg04b-lab"
admin_root = origin + "/admin/realms/" + realm
account_url = issuer + "/account/v1/"
client_id = "fwb-account-selfservice-ci"
redirect = oauth.REDIRECT


def ensure(condition, code):
    if not condition:
        raise AssertionError(code)


def admin_request(path, *, method="GET", payload=None):
    headers = {"Authorization": "Bearer " + admin_token,
               "Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    return s.request(method, admin_root + path, headers=headers,
                     json=payload, timeout=25, allow_redirects=False)


def admin_json(path):
    response = admin_request(path)
    ensure(response.status_code == 200, "ADMIN_READ_" + str(response.status_code))
    return response.json()


def configure_probe():
    global user_id
    # Create only in the disposable realm, with no realm-management role.
    original = admin_json("/clients?clientId=fwb-reg04b-lab-client")
    ensure(len(original) == 1, "MCP_CLIENT_NOT_FOUND")
    original_client = admin_json("/clients/" + original[0]["id"])

    account = admin_json("/clients?clientId=account")
    ensure(len(account) == 1, "ACCOUNT_CLIENT_NOT_FOUND")
    account_id = account[0]["id"]
    roles = [admin_json("/clients/" + account_id + "/roles/" + name)
             for name in ("manage-account", "view-profile")]
    ensure([r["name"] for r in roles] == ["manage-account", "view-profile"],
           "ACCOUNT_ROLE_CONFIGURATION_FAILED")

    user = admin_json("/users?username=fwb-lab-user&exact=true")
    ensure(len(user) == 1, "USER_NOT_FOUND")
    user_id = user[0]["id"]
    existing_roles = admin_json("/users/" + user_id +
                                "/role-mappings/clients/" + account_id)
    absent = [r for r in roles if r["name"] not in {x["name"] for x in existing_roles}]
    if absent:
        grant = admin_request("/users/" + user_id +
                              "/role-mappings/clients/" + account_id,
                              method="POST", payload=absent)
        ensure(grant.status_code == 204, "ACCOUNT_ROLES_GRANT_FAILED")

    probe = {
        "clientId": client_id,
        "name": "FWB CI only Account REST security probe",
        "protocol": "openid-connect",
        "enabled": True, "publicClient": True,
        "standardFlowEnabled": True, "implicitFlowEnabled": False,
        "directAccessGrantsEnabled": False, "serviceAccountsEnabled": False,
        "consentRequired": True, "fullScopeAllowed": False,
        "redirectUris": [redirect], "webOrigins": [],
        "attributes": {"pkce.code.challenge.method": "S256"},
        "protocolMappers": [{
            "name": "ci-account-only-audience",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-audience-mapper",
            "consentRequired": False,
            "config": {"included.custom.audience": "account",
                       "access.token.claim": "true",
                       "id.token.claim": "false"}
        }, {
            "name": "ci-account-only-roles",
            "protocol": "openid-connect",
            "protocolMapper": "oidc-usermodel-client-role-mapper",
            "consentRequired": False,
            "config": {"usermodel.clientRoleMapping.clientId": "account",
                       "claim.name": "resource_access.account.roles",
                       "jsonType.label": "String", "multivalued": "true",
                       "access.token.claim": "true", "id.token.claim": "false"}
        }]
    }
    created = admin_request("/clients", method="POST", payload=probe)
    ensure(created.status_code == 201,
           "ACCOUNT_PROBE_CLIENT_CREATE_" + str(created.status_code))
    entries = admin_json("/clients?clientId=" + client_id)
    ensure(len(entries) == 1, "ACCOUNT_PROBE_CLIENT_MISSING")
    probe_id = entries[0]["id"]

    # Scope is limited to two end-user account roles. No realm-management.
    mapped = admin_request("/clients/" + probe_id +
                           "/scope-mappings/clients/" + account_id,
                           method="POST", payload=roles)
    ensure(mapped.status_code == 204, "ACCOUNT_PROBE_ROLE_SCOPE_FAILED")

    # No changes to the original FWB MCP PKCE client.
    ensure(admin_json("/clients/" + original[0]["id"]) == original_client,
           "MCP_CLIENT_WAS_MODIFIED")
    print("REG04D_R2B1_C1_SEPARATE_ACCOUNT_ONLY_OAUTH_CLIENT_PASS")


def authenticate():
    discovery = s.get(issuer + "/.well-known/openid-configuration",
                      timeout=25).json()
    ensure(discovery["issuer"] == issuer, "ISSUER_MISMATCH")
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(48)).decode().rstrip("=")
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    state = "c1-" + secrets.token_hex(16)
    params = {"response_type": "code", "client_id": client_id,
              "redirect_uri": redirect, "scope": "openid",
              "code_challenge_method": "S256", "code_challenge": challenge,
              "state": state}
    # Critically: no resource=MCP here. This token is for account self-service.
    r = s.get(discovery["authorization_endpoint"], params=params,
              timeout=25, allow_redirects=False)
    ensure(r.status_code == 200, "USER_LOGIN_PAGE_NOT_RENDERED")
    action, body, _ = oauth.form(r, "form#kc-form-login")
    body.update({"username": "fwb-lab-user", "password": oauth.PASSWORD})
    r = s.post(action, data=body, allow_redirects=False, timeout=25)
    consent_seen = False
    callback = None
    for _ in range(12):
        if r.status_code in (302, 303):
            location = urljoin(r.url, r.headers.get("Location", ""))
            if location.startswith(redirect + "?"):
                callback = location
                break
            parsed = urlparse(location)
            ensure(parsed.scheme == "https" and
                   parsed.netloc == "auth-lab.example.org", "OAUTH_REDIRECT_ORIGIN")
            r = s.get(location, allow_redirects=False, timeout=25)
        elif r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            selector = ("form#kc-consent-form" if soup.select_one("form#kc-consent-form")
                        else "#kc-oauth form")
            ensure(soup.select_one(selector) is not None, "OAUTH_CONSENT_FORM_MISSING")
            action, body, el = oauth.form(r, selector)
            submit = el.find("button", {"name": "accept"}) or el.find("input", {"name": "accept"})
            body["accept"] = (submit.get("value") or "Yes") if submit else "Yes"
            consent_seen = True
            r = s.post(action, data=body, allow_redirects=False, timeout=25)
        else:
            raise AssertionError("OAUTH_UNEXPECTED_HTTP_" + str(r.status_code))
    ensure(consent_seen and callback is not None, "PKCE_CONSENT_CALLBACK_MISSING_HTTP_" + str(r.status_code) + "_PATH_" + urlparse(r.url).path)
    values = parse_qs(urlparse(callback).query)
    ensure(values.get("state", [""])[0] == state and
           len(values.get("code", [])) == 1, "OAUTH_STATE_OR_CODE_MISMATCH")
    exchange = s.post(discovery["token_endpoint"],
        data={"grant_type": "authorization_code", "client_id": client_id,
              "redirect_uri": redirect, "code_verifier": verifier,
              "code": values["code"][0]}, timeout=25)
    ensure(exchange.status_code == 200, "OAUTH_PKCE_TOKEN_HTTP_" +
           str(exchange.status_code))
    token = exchange.json()["access_token"]
    claims = jwt.decode(token, options={"verify_signature": False})
    aud = claims.get("aud", [])
    audiences = [aud] if isinstance(aud, str) else aud
    ensure("account" in audiences, "ACCOUNT_AUDIENCE_NOT_GRANTED")
    ensure(oauth.MCP not in audiences, "MCP_AUDIENCE_LEAKED_TO_ACCOUNT_PROBE")
    ensure(claims.get("azp") == client_id, "ACCOUNT_WRONG_AUTHORIZED_PARTY")
    ensure(claims.get("sub") == user_id, "ACCOUNT_WRONG_SUBJECT")
    account_roles = claims.get("resource_access", {}).get("account", {}).get("roles", [])
    ensure("manage-account" in account_roles and "view-profile" in account_roles,
           "ACCOUNT_SELF_SERVICE_ROLES_MISSING")
    ensure(not claims.get("resource_access", {}).get("realm-management", {}).get("roles"),
           "ADMIN_ROLES_ON_END_USER_TOKEN")
    print("REG04D_R2B1_C1_PKCE_ACCOUNT_AUDIENCE_NONADMIN_PASS")
    return token


def test_protected_write(token):
    headers = {"Authorization": "Bearer " + token,
               "Accept": "application/json", "Content-Type": "application/json"}
    initial = admin_json("/users/" + user_id)
    fields = ["id", "username", "email", "firstName", "lastName",
              "emailVerified", "enabled", "requiredActions"]
    core = {k: initial[k] for k in fields if k in initial}
    protected = {
        "fwb_site_id": ["site_lab"],
        "fwb_connection_id": ["c1_verified_connection_20261121"]
    }
    stored = admin_request("/users/" + user_id, method="PUT",
                           payload={**core, "attributes": protected})
    ensure(stored.status_code == 204, "ADMIN_TEST_FIXTURE_WRITE_FAILED")
    before = admin_json("/users/" + user_id)
    ensure(before.get("attributes", {}).get("fwb_site_id") ==
           protected["fwb_site_id"], "TEST_FIXTURE_FIELD_NOT_STORED")
    ensure(before.get("attributes", {}).get("fwb_connection_id") ==
           protected["fwb_connection_id"], "TEST_FIXTURE_CONNECTION_NOT_STORED")

    api_profile = s.get(account_url, headers=headers, timeout=25)
    ensure(api_profile.status_code == 200,
           "ACCOUNT_GET_HTTP_" + str(api_profile.status_code))
    profile = api_profile.json()
    ensure("fwb_site_id" not in profile.get("attributes", {}),
           "ADMIN_ONLY_SITE_FIELD_EXPOSED_TO_USER")
    ensure("fwb_connection_id" not in profile.get("attributes", {}),
           "ADMIN_ONLY_CONNECTION_FIELD_EXPOSED_TO_USER")
    print("REG04D_R2B1_C1_ACCOUNT_REST_REAL_READ_ADMIN_FIELDS_HIDDEN_PASS")

    # Positive control: a permitted profile field actually changes through
    # the Account REST. Without this the negative probe could be a false PASS.
    positive = copy.deepcopy(profile)
    positive["firstName"] = "C1-Proof"
    good = s.post(account_url, headers=headers, json=positive, timeout=25)
    ensure(good.status_code == 204, "ACCOUNT_POSITIVE_EDIT_HTTP_" +
           str(good.status_code))
    after_positive = admin_json("/users/" + user_id)
    ensure(after_positive["firstName"] == "C1-Proof",
           "ACCOUNT_POSITIVE_EDIT_DID_NOT_PERSIST")
    ensure(all(after_positive["attributes"].get(k) == v
               for k, v in protected.items()), "ACCOUNT_POSITIVE_EDIT_MUTATED_FWB")
    print("REG04D_R2B1_C1_ACCOUNT_REST_REAL_ALLOWED_EDIT_PERSISTS_PASS")

    # Attempt overwrite of already populated admin-only managed fields.
    attack = copy.deepcopy(positive)
    attack["firstName"] = "C1-Attempt"
    attack["attributes"] = {**attack.get("attributes", {}),
        "fwb_site_id": ["attacker_site"],
        "fwb_connection_id": ["attacker_connection"],
        "unmanaged_c1_probe": ["must_not_store"]}
    denied = s.post(account_url, headers=headers, json=attack, timeout=25)
    ensure(denied.status_code in (204, 400, 403),
           "ACCOUNT_ATTACK_HTTP_UNEXPECTED_" + str(denied.status_code))
    after_attack = admin_json("/users/" + user_id)
    ensure(all(after_attack.get("attributes", {}).get(k) == v
               for k, v in protected.items()),
           "SECURITY_FAILURE_ACCOUNT_EDITED_ADMIN_ONLY_ATTRIBUTE")
    ensure(after_attack.get("attributes", {}).get("unmanaged_c1_probe") is None,
           "SECURITY_FAILURE_UNMANAGED_ATTRIBUTE_PERSISTED")
    print("REG04D_R2B1_C1_ACCOUNT_REST_REAL_PROTECTED_WRITES_NOT_PERSISTED_PASS")

    # Cleanup is confined to the disposable user; ensure original core profile.
    restore = admin_request("/users/" + user_id, method="PUT",
        payload={**core, "attributes": protected})
    ensure(restore.status_code == 204, "LAB_CORE_PROFILE_RESTORE_FAILED")
    final = admin_json("/users/" + user_id)
    ensure(all(final.get(k) == initial.get(k) for k in fields),
           "LAB_CORE_PROFILE_NOT_RESTORED")
    ensure(all(final.get("attributes", {}).get(k) == v
               for k, v in protected.items()), "LAB_PROTECTED_VALUES_CHANGED")
    print("REG04D_R2B1_C1_CORE_USER_PROFILE_RESTORED_PASS")


login = s.post(origin + "/realms/master/protocol/openid-connect/token",
    data={"grant_type": "password", "client_id": "admin-cli",
          "username": "lab-admin", "password": "only-temporary-ci-admin"},
    timeout=25)
ensure(login.status_code == 200, "CI_ADMIN_LAB_AUTH_FAILED")
admin_token = login.json()["access_token"]
configure_probe()
token = authenticate()
test_protected_write(token)
print("REG04D_R2B1_C1_SELF_SERVICE_ACCOUNT_POLICY_PASS")
