#!/usr/bin/env python3
"""Real Keycloak login/consent/PKCE via disposable HTTPS proxy. Never uses ChatGPT credentials."""
import base64
import hashlib
import json
import os
import secrets
import sys
from urllib.parse import urljoin, urlparse, parse_qs

import requests
import jwt
from bs4 import BeautifulSoup

ISSUER='https://auth-lab.example.org/realms/fwb-reg04b-lab'
MCP='https://mcp.example.org/api/gateway-mcp'
CLIENT='fwb-reg04b-lab-client'
REDIRECT='https://callback-lab.example.org/complete'
PASSWORD='ephemeral-lab-password-not-real'
s=requests.Session()
s.verify=os.environ['FWB_LAB_TLS_CERT']
checked=[]

def check(condition,name):
    if not condition:
        raise AssertionError(name+' FAILED')
    checked.append(name)
    print('PASS',name)

def form(response,selector=None):
    soup=BeautifulSoup(response.text,'html.parser')
    el=soup.select_one(selector) if selector else soup.find('form')
    if el is None:
        raise AssertionError('keycloak_html_form_missing')
    action=urljoin(response.url,el.get('action',''))
    if not action.startswith('https://auth-lab.example.org/'):
        raise AssertionError('invalid_form_action')
    data={}
    for item in el.find_all('input'):
        name=item.get('name')
        if name: data[name]=item.get('value','')
    return action,data,el

def begin_flow(discovery,wrong=False):
    verifier=base64.urlsafe_b64encode(secrets.token_bytes(48)).decode().rstrip('=')
    challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
    state='fwb-ci-'+secrets.token_hex(16)
    params={'response_type':'code','client_id':CLIENT,'redirect_uri':REDIRECT,
       'scope':'openid posts:read sites:connect','code_challenge':challenge,
       'code_challenge_method':'S256','state':state,'resource':MCP}
    r=s.get(discovery['authorization_endpoint'],params=params,allow_redirects=False,timeout=25)
    check(r.status_code==200,'keycloak-real-authorization-page')
    action,body,_=form(r,'form#kc-form-login')
    body.update({'username':'fwb-lab-user','password':PASSWORD})
    r=s.post(action,data=body,allow_redirects=False,timeout=25)
    check(r.status_code in (200,302,303),'keycloak-real-user-login')
    location=''
    consent_seen=False
    for hop in range(8):
        if r.status_code in (302,303):
            location=urljoin(r.url,r.headers.get('Location',''))
            if location.startswith(REDIRECT+'?'): break
            parsed=urlparse(location)
            if parsed.scheme!='https' or parsed.netloc!='auth-lab.example.org':
                raise AssertionError('unexpected_redirect_origin')
            r=s.get(location,allow_redirects=False,timeout=25)
            continue
        if r.status_code==200:
            soup=BeautifulSoup(r.text,'html.parser')
            # Keycloak 26.8 default theme uses #kc-oauth form WITHOUT a form id.
            consent=soup.select_one('form#kc-consent-form') or soup.select_one('#kc-oauth form')
            if consent is None:
                forms=[el.get('id','') for el in soup.find_all('form')]
                title=soup.title.get_text(' ',strip=True)[:100] if soup.title else 'no-title'
                message=soup.select_one('#kc-error-message, .alert-error, #kc-info-message')
                note=message.get_text(' ',strip=True)[:140] if message else 'no-feedback'
                page=urlparse(r.url).path
                message_text=soup.select_one('#kc-content-wrapper, #kc-page-title, main')
                detail=(message_text.get_text(' ',strip=True) if message_text else soup.get_text(' ',strip=True))[:280]
                controls=[]
                for el in soup.select('button, input[type=submit], a[href]')[:12]:
                    controls.append(el.name+':'+el.get('id','')+':'+el.get('name','')+
                                    ':'+el.get_text(' ',strip=True)[:32])
                # Never log href values, query strings, codes, browser cookies or form inputs.
                raise AssertionError('unexpected_keycloak_page forms='+','.join(forms)[:80]+' title='+title+' note='+note+' path='+page[:90]+' detail='+detail+' controls='+'|'.join(controls)[:240])
            action,body,el=form(r,'form#kc-consent-form' if soup.select_one('form#kc-consent-form') else '#kc-oauth form')
            submit=el.find('button',{'name':'accept'}) or el.find('input',{'name':'accept'})
            body['accept']=(submit.get('value') or 'Yes') if submit else 'Yes'
            consent_seen=True
            r=s.post(action,data=body,allow_redirects=False,timeout=25)
            continue
        raise AssertionError('keycloak_unexpected_response_'+str(r.status_code))
    check(consent_seen,'keycloak-real-consent-granted')
    check(location.startswith(REDIRECT+'?'),'keycloak-authorized-callback')
    query=parse_qs(urlparse(location).query)
    check(query.get('state',[''])[0]==state and bool(query.get('code',[''])[0]),
      'authorization-code-state-pinned')
    return query['code'][0],verifier

def exchange(discovery,code,verifier):
    return s.post(discovery['token_endpoint'],data={
       'grant_type':'authorization_code','client_id':CLIENT,'code':code,
       'redirect_uri':REDIRECT,'code_verifier':verifier,'resource':MCP
    },timeout=25)

def run():
    discovery=s.get(ISSUER+'/.well-known/openid-configuration',timeout=25).json()
    check(discovery['issuer']==ISSUER,'actual-keycloak-issuer-discovery')
    check('S256' in discovery.get('code_challenge_methods_supported',[]),
      'real-keycloak-pkce-s256-advertised')
    check('code' in discovery.get('response_types_supported',[]),
      'real-keycloak-authorization-code-advertised')
    code,verifier=begin_flow(discovery)
    tok=exchange(discovery,code,verifier)
    check(tok.status_code==200,'real-keycloak-code-pkce-exchange')
    body=tok.json()
    access=body['access_token']
    header=jwt.get_unverified_header(access)
    check(header.get('alg')=='RS256' and header.get('typ')=='at+jwt',
      'keycloak-real-rs256-at-jwt-header')
    signing_key=jwt.PyJWKClient(discovery['jwks_uri']).get_signing_key_from_jwt(access).key
    claims=jwt.decode(access,signing_key,algorithms=['RS256'],audience=MCP,issuer=ISSUER)
    check(claims.get('site_id')=='site_lab','keycloak-signed-site-binding')
    check(claims.get('connection_id')=='exampleconnectionId0123456789',
      'keycloak-signed-connection-binding')
    check('posts:read' in claims.get('scope','').split() and
      'sites:connect' in claims.get('scope','').split(),'keycloak-scoped-access')
    check(claims.get('sub') and isinstance(claims.get('exp'),int),'real-user-subject-and-exp')
    replay=exchange(discovery,code,verifier)
    check(replay.status_code==400,'real-keycloak-code-replay-denied')
    other_code,other_verifier=begin_flow(discovery,True)
    wrong=exchange(discovery,other_code,'definitely-incorrect-pkce-verifier-123456789012')
    check(wrong.status_code==400,'real-keycloak-pkce-mismatch-denied')
    refresh=body.get('refresh_token')
    check(bool(refresh),'keycloak-refresh-token-issued')
    refresh_result=s.post(discovery['token_endpoint'],data={
      'grant_type':'refresh_token','client_id':CLIENT,'refresh_token':refresh,'resource':MCP
    },timeout=25)
    check(refresh_result.status_code==200,'keycloak-real-refresh-success')
    refreshed=refresh_result.json()
    check(bool(refreshed.get('access_token')),'keycloak-refresh-access-token-issued')
    revocation=s.post(discovery['revocation_endpoint'],data={
      'client_id':CLIENT,'token':refreshed.get('refresh_token',refresh),
      'token_type_hint':'refresh_token'
    },timeout=25)
    check(revocation.status_code==200,'keycloak-refresh-token-revoked')
    with open('/tmp/fwb-reg04b-access-token.jwt','w',encoding='utf-8') as fh:
        fh.write(access)
    os.chmod('/tmp/fwb-reg04b-access-token.jwt',0o600)
    print('REG04B_REAL_KEYCLOAK_OAUTH_PASS',len(checked))

if __name__=='__main__':
    try:run()
    except Exception as e:
        print('REG04B_REAL_KEYCLOAK_OAUTH_FAIL',type(e).__name__,str(e)[:220],file=sys.stderr)
        sys.exit(2)
