#!/usr/bin/env python3
"""Real HTTP E2E against disposable WordPress; not a real ChatGPT UI session."""
import base64
import hashlib
import html
import json
import os
import re
import secrets
import sys
from urllib.parse import urlparse, parse_qs

import requests

BASE = os.environ.get('FWB_E2E_BASE', 'http://localhost:8888').rstrip('/')
CLIENT = 'https://chatgpt.com/oauth/client.json'
CALLBACK = 'https://chatgpt.com/connector_platform_oauth_redirect'
USERNAME = 'e2eauthor'
PASSWORD = os.environ.get('FWB_E2E_PASSWORD', 'ephemeral-test-only-do-not-reuse')
s = requests.Session()
s.headers['User-Agent'] = 'FWB-REG-02C-E2E/1.0'
checked = []

def check(value, name, detail=''):
    if not value:
        raise AssertionError(f'{name} FAILED: {detail[:250]}')
    checked.append(name)
    print('PASS', name)

def send(method, path, **kwargs):
    url = path if path.startswith('http') else BASE + path
    return s.request(method, url, timeout=30, allow_redirects=False, **kwargs)

def json_response(response):
    try:
        return response.json()
    except Exception:
        raise AssertionError(f'Non-JSON response status={response.status_code}: {response.text[:300]}')

def query_part(location, key):
    result = parse_qs(urlparse(location).query)
    return result.get(key, [''])[0]

def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')

def metadata():
    r = send('GET', '/.well-known/oauth-protected-resource')
    check(r.status_code == 200, 'protected-resource-metadata', f'{r.status_code} location={r.headers.get("Location", "")} {r.text[:180]}')
    m = json_response(r)
    check(m.get('resource') == BASE + '/wp-json/mcp/mcp-oauth-server', 'resource-audience-bound')
    r = send('GET', '/.well-known/oauth-authorization-server')
    check(r.status_code == 200, 'authorization-server-metadata', f'{r.status_code} {r.text[:180]}')
    a = json_response(r)
    check(a.get('code_challenge_methods_supported') == ['S256'], 'pkce-s256-advertised')
    check(a.get('client_id_metadata_document_supported') is True, 'cimd-advertised')
    return a

def sign_in():
    r = send('GET', '/wp-login.php')
    check(r.status_code == 200, 'wordpress-login-page')
    r = send('POST', '/wp-login.php', data={
        'log': USERNAME, 'pwd': PASSWORD, 'wp-submit': 'Log In',
        'redirect_to': BASE + '/wp-admin/', 'testcookie': '1'
    }, headers={'Referer': BASE + '/wp-login.php'})
    check(r.status_code in [302, 303] and '/wp-admin' in r.headers.get('Location', ''),
          'wordpress-authenticated-session', str(r.status_code) + r.headers.get('Location', '')[:150])
    r = send('GET','/wp-admin/profile.php')
    check(r.status_code == 200 and 'profile' in r.text.lower(), 'wordpress-user-session-active')

def authorize(a, purpose, state=None):
    verifier = b64url(secrets.token_bytes(48))
    challenge = b64url(hashlib.sha256(verifier.encode()).digest())
    state = state or ('fwb-' + secrets.token_hex(14))
    r = send('GET', a['authorization_endpoint'], params={
        'response_type': 'code', 'client_id': CLIENT,
        'redirect_uri': CALLBACK, 'code_challenge': challenge,
        'code_challenge_method': 'S256', 'state': state,
        'resource': BASE + '/wp-json/mcp/mcp-oauth-server'
    })
    check(r.status_code in (302, 303) and '/oauth/authorize-callback' in r.headers.get('Location',''),
          purpose+'-authorization-redirect', str(r.status_code) + ' ' + r.text[:160])
    r = send('GET', r.headers['Location'])
    check(r.status_code == 200 and 'mcp_consent_nonce' in r.text,
          purpose+'-consent-visible', f'{r.status_code} {r.text[:150]}')
    nonce_match = re.search(r'name=["\']mcp_consent_nonce["\']\s+value=["\']([^"\']+)["\']', r.text)
    check(nonce_match is not None, purpose+'-nonce-provided')
    r = send('POST', '/oauth/consent', data={
        'state': state, 'mcp_consent_nonce': html.unescape(nonce_match.group(1)),
        'mcp_action': 'allow',
    }, headers={'Referer': BASE + '/oauth/authorize-callback'})
    check(r.status_code in (302,303) and r.headers.get('Location','').startswith(CALLBACK),
          purpose+'-consent-redirect', str(r.status_code) + r.headers.get('Location','')[:190])
    code = query_part(r.headers['Location'], 'code')
    check(len(code) >= 40 and query_part(r.headers['Location'], 'state') == state,
          purpose+'-code-and-state-bound')
    return {'code':code,'verifier':verifier,'state':state}

def exchange(a, pair, verifier=None):
    return send('POST',a['token_endpoint'],data={
       'grant_type':'authorization_code',
       'client_id':CLIENT,
       'code':pair['code'],
       'code_verifier': verifier or pair['verifier'],
       'redirect_uri':CALLBACK
    })

def decode_mcp(response):
    check(response.status_code == 200,'mcp-http-200',f'{response.status_code} {response.text[:250]}')
    body=response.text.strip()
    if 'text/event-stream' in response.headers.get('Content-Type',''):
        chunks = [line[len('data:'):].strip() for line in body.splitlines()
                  if line.startswith('data:') and line[len('data:'):].strip() != '[DONE]']
        check(bool(chunks),'mcp-sse-event-present')
        body=chunks[-1]
    try:
        obj=json.loads(body)
    except Exception:
        raise AssertionError('MCP non-JSON payload: ' + body[:250])
    check(obj.get('jsonrpc') == '2.0' and ('result' in obj or 'error' in obj), 'mcp-jsonrpc-envelope')
    if 'error' in obj:
        raise AssertionError('MCP JSON-RPC ERROR: '+str(obj['error'])[:350])
    return obj['result']

def mcp_call(token, action, params, number, session_id=None):
    data={'jsonrpc':'2.0','id':number,'method':action,'params':params}
    h={
        'Authorization':'Bearer '+token,
        'Content-Type':'application/json',
        'Accept':'application/json, text/event-stream',
        'MCP-Protocol-Version':'2025-11-25'
    }
    if session_id:
        h['MCP-Session-Id']=session_id
    response=send('POST','/wp-json/mcp/mcp-oauth-server', json=data, headers=h)
    return decode_mcp(response), response.headers.get('Mcp-Session-Id',session_id)

def e2e():
    a=metadata()
    no_token=send('POST','/wp-json/mcp/mcp-oauth-server',
                  json={'jsonrpc':'2.0','id':1,'method':'tools/list','params':{}},
                  headers={'Accept':'application/json, text/event-stream'})
    check(no_token.status_code == 401, 'unauthenticated-mcp-rejected', f'{no_token.status_code} {no_token.text[:200]}')
    check('resource_metadata' in no_token.headers.get('WWW-Authenticate',''),
          'mcp-bearer-challenge')
    sign_in()
    good=authorize(a,'positive')
    token_result=exchange(a,good)
    check(token_result.status_code == 200, 'pkce-good-code-exchange',f'{token_result.status_code} {token_result.text[:190]}')
    body=json_response(token_result)
    token=body.get('access_token','')
    check(token and body.get('token_type','').lower()=='bearer', 'oauth-access-token-issued')
    jwt_parts=token.split('.')
    check(len(jwt_parts)==3, 'signed-jwt-issued')
    header=json.loads(base64.urlsafe_b64decode(jwt_parts[0]+'=='))
    check(header.get('alg')=='HS256', 'wordpress-issued-hs256-token')
    replay=exchange(a,good)
    check(replay.status_code==400 and json_response(replay).get('error')=='invalid_grant',
          'auth-code-replay-blocked',f'{replay.status_code} {replay.text[:150]}')
    invalid=authorize(a,'negative-pkce')
    negative=exchange(a,invalid,verifier=b64url(secrets.token_bytes(48)))
    check(negative.status_code==400 and json_response(negative).get('error')=='invalid_grant',
          'wrong-pkce-blocked',f'{negative.status_code} {negative.text[:170]}')

    init, session=mcp_call(token,'initialize',{
        'protocolVersion':'2025-11-25','capabilities':{},
        'clientInfo':{'name':'fwb-reg02c-e2e','version':'0.1.0'}
    },101)
    check(init.get('protocolVersion') in ['2025-11-25','2026-07-28'],
          'mcp-initialize-negotiated')
    result,session=mcp_call(token,'tools/list',{},102,session)
    tools={x.get('name') for x in result.get('tools',[])}
    check('mcp-adapter-discover-abilities' in tools and
          'mcp-adapter-execute-ability' in tools,
          'mcp-wordpress-tools-discovered',str(tools))
    discovered,session=mcp_call(token,'tools/call',{
        'name':'mcp-adapter-discover-abilities','arguments':{}
    },103,session)
    check(bool(discovered), 'mcp-abilities-discovery')
    print('MCP_DISCOVERY_SUMMARY',json.dumps(discovered,ensure_ascii=False)[:1250])
    print('REG02C_END_TO_END_LOCAL_HTTP_PASS',len(checked))

if __name__ == '__main__':
    try: e2e()
    except Exception as exc:
        print('REG02C_END_TO_END_LOCAL_HTTP_FAIL', str(exc),file=sys.stderr)
        sys.exit(2)
