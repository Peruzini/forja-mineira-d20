#!/usr/bin/env python3
"""Disposable R2B1: end-user OAuth PKCE and account-profile field denial."""
import importlib.util
import os
from pathlib import Path
import requests

p=Path(__file__).parents[1]/"fwb-reg04b"/"keycloak-oauth-e2e.py"
spec=importlib.util.spec_from_file_location("fwb_lab_login",p)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
s=mod.s
issuer=mod.ISSUER
discovery=s.get(issuer+"/.well-known/openid-configuration",timeout=25).json()
code,verifier=mod.begin_flow(discovery)
response=mod.exchange(discovery,code,verifier)
assert response.status_code==200,"keycloak user OAuth PKCE exchange failed"
user_token=response.json()["access_token"]
assert user_token and len(user_token)>100
print("REG04D_R2B1_REAL_END_USER_OAUTH_PKCE_PASS")

realm=issuer.split("/")[-1]
root="https://auth-lab.example.org/admin/realms/"+realm
master=s.post("https://auth-lab.example.org/realms/master/protocol/openid-connect/token",
 data={"grant_type":"password","client_id":"admin-cli",
       "username":"lab-admin","password":"only-temporary-ci-admin"},timeout=25)
assert master.status_code==200
admin_token=master.json()["access_token"]
admin_headers={"Authorization":"Bearer "+admin_token}
user_headers={"Authorization":"Bearer "+user_token}
user=s.get(root+"/users?username=fwb-lab-user&exact=true",
 headers=admin_headers,timeout=25).json()[0]
user_id=user["id"]
denial=s.get(root+"/users/"+user_id,headers=user_headers,timeout=25)
assert denial.status_code in (401,403),"regular user reached admin REST"
account_url=issuer+"/account/"
account=s.get(account_url,headers=user_headers,timeout=25)
print("REG04D_R2B1_ACCOUNT_GET_HTTP",account.status_code)
assert account.status_code==200,"Keycloak self-service account API unavailable"
profile=account.json()
profile["attributes"]={
 "fwb_site_id":["rogue_site"],
 "fwb_connection_id":["rogue_connection_12345678901234"]
}
attempt=s.post(account_url,headers=user_headers,json=profile,timeout=25)
assert attempt.status_code in (200,204,400,401,403,405)
checked=s.get(root+"/users/"+user_id,headers=admin_headers,timeout=25).json()
assert checked.get("attributes",{}).get("fwb_site_id") is None
assert checked.get("attributes",{}).get("fwb_connection_id") is None
print("REG04D_R2B1_REAL_END_USER_ADMIN_ONLY_FIELDS_BLOCKED_PASS")
