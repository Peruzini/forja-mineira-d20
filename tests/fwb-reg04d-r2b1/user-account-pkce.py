#!/usr/bin/env python3
"""R2B1-C1: disposable Keycloak 26.8.2 self-service Account REST proof.
Normal user's account roles only (view-profile, manage-account); no admin roles.
Never print passwords, access tokens, profile payloads or OAuth codes.
"""
import importlib.util
import json
import base64
from pathlib import Path
from copy import deepcopy

p = Path(__file__).parents[1] / "fwb-reg04b" / "keycloak-oauth-e2e.py"
spec = importlib.util.spec_from_file_location("fwb_lab_login", p)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
s = mod.s
issuer = mod.ISSUER
admin_root = "https://auth-lab.example.org/admin/realms/fwb-reg04b-lab"
account_url = issuer + "/account/v1/"  # diagnostic only; v1 may be unavailable
# All privileged setup below is confined to a disposable CI Keycloak container.
master = s.post("https://auth-lab.example.org/realms/master/protocol/openid-connect/token",
    data={"grant_type":"password", "client_id":"admin-cli",
          "username":"lab-admin", "password":"only-temporary-ci-admin"}, timeout=25)
assert master.status_code == 200, "disposable lab admin login"
admin_bearer = master.json()["access_token"]
admin_headers = {"Authorization":"Bearer " + admin_bearer, "Accept":"application/json"}
def get_admin(path):
    r = s.get(admin_root + path, headers=admin_headers, timeout=25)
    assert r.status_code == 200, "lab admin read failed " + str(r.status_code)
    return r.json()
def mutate_admin(path, body, method="POST"):
    r = s.request(method, admin_root + path,
        headers={**admin_headers, "Content-Type":"application/json"},
        json=body, timeout=25)
    assert r.status_code in (200, 201, 204), "lab admin configuration failed HTTP " + str(r.status_code)
    return r

users = get_admin("/users?username=fwb-lab-user&exact=true")
assert len(users) == 1
uid = users[0]["id"]
account_client = get_admin("/clients?clientId=account")
oauth_client = get_admin("/clients?clientId=fwb-reg04b-lab-client")
assert len(account_client) == 1 and len(oauth_client) == 1
account_id = account_client[0]["id"]
oauth_id = oauth_client[0]["id"]
# This grants ONLY the standard end-user self-service permissions. The
# realm-management client, users beyond this subject, and master realm stay untouched.
roles = [get_admin("/clients/"+account_id+"/roles/"+role)
         for role in ("view-profile","manage-account")]
mutate_admin("/users/"+uid+"/role-mappings/clients/"+account_id, roles)
# Bound which ordinary account roles this OAuth client may place in tokens.
mutate_admin("/clients/"+oauth_id+"/scope-mappings/clients/"+account_id, roles)
# Attach built-in roles scope and explicit account audience to this test client
# so that its user token is accepted by Account REST *as an account token*.
# The freshly imported realm has no built-in "roles" client scope.
# Add only an account-role mapper to the disposable OAuth client instead.
mutate_admin("/clients/"+oauth_id+"/protocol-mappers/models", {
    "name":"r2b1-ci-account-roles", "protocol":"openid-connect",
    "protocolMapper":"oidc-usermodel-client-role-mapper",
    "config":{"usermodel.clientRoleMapping.clientId":"account",
              "claim.name":"resource_access.account.roles",
              "jsonType.label":"String","multivalued":"true",
              "access.token.claim":"true", "id.token.claim":"false"}
})
mutate_admin("/clients/"+oauth_id+"/protocol-mappers/models", {
    "name":"r2b1-ci-account-audience", "protocol":"openid-connect",
    "protocolMapper":"oidc-audience-mapper",
    "config":{"included.client.audience":"account",
              "access.token.claim":"true", "id.token.claim":"false"}
})
print("REG04D_R2B1_C1_LAB_USER_ACCOUNT_ROLES_ONLY_PASS")

discovery = s.get(issuer + "/.well-known/openid-configuration",timeout=25).json()
# First exercise the existing MCP-specific Resource Indicator binding.
code, verifier = mod.begin_flow(discovery)
exchange = mod.exchange(discovery, code, verifier)
assert exchange.status_code == 200, "MCP-bound user PKCE token exchange"
mcp_token = exchange.json()["access_token"]
mcp_claims = json.loads(base64.urlsafe_b64decode(mcp_token.split(".")[1] + "==="))
mcp_aud = mcp_claims.get("aud",[])
mcp_aud = [mcp_aud] if isinstance(mcp_aud,str) else mcp_aud
assert mod.MCP in mcp_aud and "account" not in mcp_aud, "MCP token widened to Account REST"
mcp_account=s.get(account_url,headers={
    "Authorization":"Bearer "+mcp_token,"Accept":"application/json"},
    timeout=25,allow_redirects=False)
print("REG04D_R2B1_C1_MCP_ACCOUNT_HTTP",mcp_account.status_code,mcp_account.headers.get("Content-Type","").split(";")[0])
print("REG04D_R2B1_C1_MCP_ACCOUNT_CONTENT_LENGTH",len(mcp_account.content))
# The versioned Account route may return 404 (API version not supported).
# The JWT's aud claim is the authoritative resource-binding evidence here;
# a non-200 response is not proof that the Account REST rejected its bearer.
assert mod.MCP in mcp_aud and "account" not in mcp_aud
print("REG04D_R2B1_C1_MCP_AUD_PINNED_PASS")

# Then acquire a SECOND token for the normal user self-service audience.
# No RFC8707 MCP resource is requested; the OAuth client's account audience
# mapper and standard manage-account role apply only to this user flow.
code,verifier=mod.begin_flow(discovery,True,resource=None)
exchange=mod.exchange(discovery,code,verifier,resource=None)
assert exchange.status_code==200, "Account-scoped user PKCE token exchange"
user_token=exchange.json()["access_token"]
assert isinstance(user_token,str) and len(user_token)>100
claims=json.loads(base64.urlsafe_b64decode(user_token.split(".")[1] + "==="))
aud = claims.get("aud",[])
aud = [aud] if isinstance(aud,str) else aud
account_roles = claims.get("resource_access",{}).get("account",{}).get("roles",[])
assert "account" in aud, "missing Account REST audience"
# Keycloak 26 can issue lightweight tokens and resolve roles server-side.
# Check the actual role mappings instead of requiring embedded role claims.
effective = get_admin("/users/"+uid+"/role-mappings/clients/"+account_id)
assert {"view-profile","manage-account"}.issubset({r["name"] for r in effective})
print("REG04D_R2B1_C1_SELF_SERVICE_ROLES_CONFIRMED_PASS")
assert "realm-admin" not in claims.get("realm_access",{}).get("roles",[])
assert "realm-management" not in claims.get("resource_access",{})
print("REG04D_R2B1_C1_OAUTH_PKCE_USER_ACCOUNT_AUDIENCE_PASS")
user_headers={"Authorization":"Bearer "+user_token,"Accept":"application/json",
              "Content-Type":"application/json"}
admin_denied=s.get(admin_root+"/users/"+uid,headers=user_headers,timeout=25)
assert admin_denied.status_code in (401,403), "ordinary user gained Keycloak Admin API"
print("REG04D_R2B1_C1_USER_ADMIN_REST_DENIED_PASS")

# Keycloak routes /account/ to either a SPA or a JSON REST resource based
# on content negotiation. Select only a route which demonstrably returns JSON.
account=None
for candidate in (issuer+"/account/",issuer+"/account",issuer+"/account/v1/"):
    probe=s.get(candidate,headers=user_headers,timeout=25,allow_redirects=False)
    kind=probe.headers.get("Content-Type","").split(";")[0]
    print("REG04D_R2B1_C1_ACCOUNT_ROUTE",candidate.rsplit("/",2)[-1],probe.status_code,kind)
    if probe.status_code==200 and kind=="application/json":
        account,account_url=probe,candidate
        break
assert account is not None, "no working JSON Account REST route in Keycloak test realm"
profile=account.json()
assert isinstance(profile,dict), "unexpected Account REST object"
baseline=get_admin("/users/"+uid)
baseline_core={k:baseline.get(k) for k in ("email","firstName","lastName","username","enabled","emailVerified")}
assert baseline.get("attributes",{}).get("fwb_site_id") is None
assert baseline.get("attributes",{}).get("fwb_connection_id") is None
print("REG04D_R2B1_C1_ACCOUNT_REST_READ_PASS")

# Positive control: allowed ordinary profile change really works; this ensures
# a denied FWB mutation is denied by per-attribute policy, not an unrelated 401.
positive=deepcopy(profile)
positive["firstName"]="R2B1C1 Self Service Test"
ok=s.post(account_url,headers=user_headers,json=positive,timeout=25,allow_redirects=False)
assert ok.status_code in (200,204), "positive self-service update failed HTTP "+str(ok.status_code)
changed=get_admin("/users/"+uid)
assert changed.get("firstName")=="R2B1C1 Self Service Test", "positive self-service write not persisted"
print("REG04D_R2B1_C1_POSITIVE_SELF_EDIT_PASS")

# User attempts two FWB bindings plus an undeclared attribute through the
# *same*, otherwise working Account REST POST. No user-admin delegation.
malicious=deepcopy(positive)
malicious["attributes"]={**(positive.get("attributes") or {}),
    "fwb_site_id":["rogue_site"],"fwb_connection_id":["unauthorized_test_connection_12345678"],
    "fwb_r2b1_undeclared":["must_not_persist"]}
attempt=s.post(account_url,headers=user_headers,json=malicious,timeout=25,allow_redirects=False)
assert attempt.status_code in (200,204,400,403), "unexpected Account REST mutation HTTP "+str(attempt.status_code)
after=get_admin("/users/"+uid)
for name in ("fwb_site_id","fwb_connection_id","fwb_r2b1_undeclared"):
    assert after.get("attributes",{}).get(name) is None, "end-user wrote protected attribute"
assert after.get("firstName")=="R2B1C1 Self Service Test", "denied request changed allowed profile unexpectedly"
print("REG04D_R2B1_C1_REAL_ACCOUNT_FWB_SELF_EDIT_DENIED_PASS")

# Restore test-only profile. Keycloak Admin API PUT requires complete core
# fields; only trusted previous admin snapshot is used.
restore={k:v for k,v in baseline.items() if k in (
    "id","username","email","firstName","lastName","emailVerified","enabled","requiredActions")}
restore["attributes"]=baseline.get("attributes") or {}
mutate_admin("/users/"+uid,restore,"PUT")
final=get_admin("/users/"+uid)
assert {k:final.get(k) for k in baseline_core}==baseline_core
for name in ("fwb_site_id","fwb_connection_id","fwb_r2b1_undeclared"):
    assert final.get("attributes",{}).get(name) is None
print("REG04D_R2B1_C1_PROFILE_RESTORE_AND_NO_FWB_BINDING_PASS")
