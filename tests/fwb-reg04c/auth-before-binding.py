#!/usr/bin/env python3
"""Real Keycloak user login and PKCE, before user/site identity federation."""
import importlib.util, os, json, ssl
from pathlib import Path
name='fwb_reg04b_verified_flow'
p='tests/fwb-reg04b/keycloak-oauth-e2e.py'
spec=importlib.util.spec_from_file_location(name,p)
auth=importlib.util.module_from_spec(spec);spec.loader.exec_module(auth)
auth.s.verify=os.environ['FWB_LAB_TLS_CERT']
discovery=auth.s.get(auth.ISSUER+'/.well-known/openid-configuration',timeout=25).json()
code,verifier=auth.begin_flow(discovery)
resp=auth.exchange(discovery,code,verifier)
assert resp.status_code==200,'keycloak PKCE token exchange failed'
tokens=resp.json()
import jwt
from jwt import PyJWKClient
key=PyJWKClient(discovery['jwks_uri'],
  ssl_context=ssl.create_default_context(cafile=os.environ['FWB_LAB_TLS_CERT'])
).get_signing_key_from_jwt(tokens['access_token']).key
claims=jwt.decode(tokens['access_token'],key,algorithms=['RS256'],
  audience=auth.MCP,issuer=auth.ISSUER)
assert claims.get('sub'),'missing real subject'
assert 'site_id' not in claims and 'connection_id' not in claims, 'site already bound'
assert 'sites:connect' in claims.get('scope','').split()
assert 'refresh_token' in tokens
path=Path('/tmp/fwb-reg04c-before-binding.json')
path.write_text(json.dumps({'access_token':tokens['access_token'],
  'refresh_token':tokens['refresh_token']}),encoding='utf8')
path.chmod(0o600)
print('REG04C_KEYCLOAK_REAL_UNBOUND_SUBJECT_PASS')
