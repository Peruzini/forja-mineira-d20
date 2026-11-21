"""Check Keycloak admission against the live ChatGPT CIMD, without a ChatGPT login."""
import base64
import hashlib
import json
from pathlib import Path
import secrets
import sys
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit, parse_qs
from urllib.request import HTTPRedirectHandler, Request, build_opener

CLIENT = 'https://chatgpt.com/oauth/client.json'
CALLBACK = 'https://chatgpt.com/connector_platform_oauth_redirect'
JWKS = 'https://chatgpt.com/oauth/jwks.json'
ORIGIN = 'http://127.0.0.1:8080'
REALM = 'fwb-reg04d-ci'
ISSUER = f'{ORIGIN}/realms/{REALM}'
RESOURCE = 'https://mcp-reg04d.example.org/api/mcp'


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(url, form=None, *, retries=0):
    req = Request(url, data=urlencode(form).encode() if form is not None else None)
    for attempt in range(retries + 1):
        try:
            with build_opener(NoRedirect()).open(req, timeout=20) as response:
                return response.status, response.headers, response.read(64_001)
        except HTTPError as error:
            result = error.code, error.headers, error.read(64_001)
            if attempt == retries or error.code not in {429, 502, 503, 504}:
                return result


def require(condition, msg):
    if not condition:
        raise SystemExit(msg)


def realm_config(output):
    profile = 'fwb-chatgpt-cimd'
    realm = {
        'realm': REALM,
        'enabled': True,
        'sslRequired': 'external',
        'registrationAllowed': False,
        'defaultSignatureAlgorithm': 'RS256',
        'clientProfiles': {'profiles': [{
            'name': profile,
            'executors': [
                {'executor': 'client-id-metadata-document', 'configuration': {
                    'cimd-allow-http-scheme': False,
                    'cimd-allow-permitted-domains': ['chatgpt.com', 'persistent.oaistatic.com'],
                    'cimd-restrict-same-domain': False,
                    'cimd-required-properties': [
                        'client_id', 'redirect_uris', 'token_endpoint_auth_method',
                        'token_endpoint_auth_signing_alg', 'jwks_uri',
                    ],
                    'only-allow-confidential-client': True,
                    'accept-public-client-with-confidential-client-only-grant': False,
                    'cimd-resource-indicator-allow-list': [RESOURCE],
                }},
                {'executor': 'pkce-enforcer', 'configuration': {'auto-configure': True}},
            ],
        }]},
        'clientPolicies': {'policies': [{
            'name': 'fwb-chatgpt-cimd-only', 'enabled': True, 'profiles': [profile],
            'conditions': [{'condition': 'client-id-uri', 'configuration': {
                'client-id-uri-scheme': ['https'],
                'client-id-uri-allow-permitted-domains': ['chatgpt.com'],
            }}],
        }]},
    }
    Path(output).write_text(json.dumps(realm), encoding='utf-8')


def read_document(url, label):
    status, _, body = request(url, retries=2)
    require(status == 200 and len(body) <= 64_000, f'{label}: HTTP {status} or oversized response')
    try:
        return json.loads(body)
    except ValueError:
        raise SystemExit(f'{label}: invalid JSON') from None


def check_live():
    doc = read_document(CLIENT, 'ChatGPT CIMD')
    require(
        doc.get('client_id') == CLIENT
        and doc.get('redirect_uris') == [CALLBACK]
        and doc.get('token_endpoint_auth_method') == 'private_key_jwt'
        and doc.get('token_endpoint_auth_signing_alg') == 'RS256'
        and doc.get('jwks_uri') == JWKS,
        'ChatGPT CIMD: expected client ID, callback, auth, signing algorithm and JWKS',
    )
    keys = read_document(JWKS, 'ChatGPT JWKS').get('keys', [])
    require(any(k.get('kty') == 'RSA' and k.get('kid') and k.get('use', 'sig') == 'sig'
                and k.get('alg', 'RS256') == 'RS256' for k in keys), 'ChatGPT JWKS: no RSA signing key')
    print('REG04D_CHATGPT_PUBLIC_CIMD_AND_JWKS_PASS', flush=True)

    discovery = read_document(
        ISSUER + '/.well-known/openid-configuration', 'Keycloak discovery')
    require(discovery.get('client_id_metadata_document_supported') is True
            and discovery.get('authorization_response_iss_parameter_supported') is True
            and 'S256' in discovery.get('code_challenge_methods_supported', [])
            and 'private_key_jwt' in discovery.get('token_endpoint_auth_methods_supported', []),
            'Keycloak discovery: CIMD, response issuer, S256 or private_key_jwt missing')

    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(secrets.token_urlsafe(48).encode()).digest()).decode().rstrip('=')
    params = {
        'client_id': CLIENT, 'redirect_uri': CALLBACK, 'response_type': 'code',
        'scope': 'openid', 'resource': RESOURCE, 'state': secrets.token_urlsafe(24),
        'code_challenge': challenge, 'code_challenge_method': 'S256',
    }
    auth = ISSUER + '/protocol/openid-connect/auth'

    def authorize(values):
        return request(auth + '?' + urlencode(values))

    status, _, body = authorize(params)
    require(status == 200 and b'login-actions/authenticate' in body,
            f'Keycloak CIMD: canonical client failed to reach login (HTTP {status})')
    print('REG04D_KEYCLOAK_LIVE_CIMD_AUTHORIZATION_PASS', flush=True)

    cases = [
        ('client origin', {**params, 'client_id': 'https://example.org/cimd.json'}),
        ('callback', {**params, 'redirect_uri': 'https://example.org/callback'}),
        ('audience', {**params, 'resource': 'https://example.org/other-resource'}),
        ('missing PKCE', {k: v for k, v in params.items() if not k.startswith('code_challenge')}),
        ('plain PKCE', {**params, 'code_challenge_method': 'plain'}),
    ]
    for label, values in cases:
        status, headers, body = authorize(values)
        location = urlsplit(headers.get('Location', ''))
        safe_error_redirect = (
            status in {302, 303}
            and f'{location.scheme}://{location.netloc}{location.path}' == CALLBACK
            and bool(parse_qs(location.query).get('error'))
        )
        require((400 <= status < 500 and b'login-actions/authenticate' not in body)
                or safe_error_redirect, f'Keycloak CIMD: expected rejection for {label} (HTTP {status})')
    print('REG04D_KEYCLOAK_RESTRICTIVE_AUTHORIZATION_PASS', flush=True)
    print('REG04D_CHATGPT_TOKEN_EXCHANGE_NOT_RUN', flush=True)


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'write-realm':
        realm_config(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == 'check-live':
        check_live()
    else:
        raise SystemExit('Use write-realm OUTPUT or check-live')
