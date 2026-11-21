# FWB-ALT-01B/01C — Auth0 no gateway MCP

**Estado em 21/11/2026 (Brasília)** — preparação técnica e testes locais **PASS**. Autenticação real no tenant do projeto e no ChatGPT **pendente**. Base [PR #45](https://github.com/Peruzini/forja-mineira-d20/pull/45).

## Implementação

- `mcp/fwb05-poc/alt01/auth0.mjs` acrescenta um perfil estrito Auth0 RS256 / RFC 9068. Valida assinatura, `iss` exato (inclusive barra final), audiência canônica, expiração, `iat`, `nbf` quando presente, `jti`, escopo `posts:read`, sujeito e client ID autorizados.
- `alt01/gateway.mjs` reutiliza o transporte Streamable HTTP e o adaptador editorial. `forja_auth0_status` funciona sem WordPress. O modo opcional de leitura usa um vínculo estático e exclusivo por sujeito assinado, verifica autoria no upstream e registra apenas leitura. A aplicação não usa a Auth0 Management API.
- `alt01/egress.mjs` restringe JWKS à origem Auth0 configurada e reutiliza a validação dos IPs públicos no ponto da conexão. O gateway limita a leitura de WordPress às rotas REST de posts dos hosts configurados. Certificados TLS são verificados e redirecionamentos são rejeitados.
- `app/api/gateway-mcp/route.js` e o metadata por recurso despacham para o Auth0 somente com a opção explícita do bloco. Se o Auth0 e um perfil anterior forem habilitados simultaneamente, a configuração falha. As implementações Keycloak, PostgreSQL e as rotas antigas independentes seguem nas bases existentes.
- `alt01/preflight.mjs` valida metadata real quando ambos os endpoints estiverem disponíveis. `alt01/mcp.cimd.example.json` e `alt01/mcp.dcr.example.json` configuram os dois modos no cliente. O Auth0 é responsável pelo registro, authorization code, consentimento e validação do PKCE. O gateway verifica o token resultante e anuncia o recurso pelo RFC 9728. O preflight de discovery jamais atesta a troca real.

## Evidências locais

| Verificação | Resultado |
| --- | --- |
| Suíte MCP e regressões | **PASS** — 97 passaram, 0 falharam, 2 ignorados por exigirem serviços reais Keycloak/WordPress/PostgreSQL. Inclui 25 casos Auth0, contando subtestes. |
| Contrato do PR #45 | **PASS** — 15 passaram, 0 falharam. |
| Build Next.js e smoke das duas rotas | **PASS** — configuração desligada e conflito retornam 503. Perfil exclusivo anuncia o Auth0 e retorna 401 com descoberta para pedido sem credencial. |
| CIMD público ChatGPT | **PASS** — o documento público real passou na validação do contrato legado `private_key_jwt` / RS256. |
| Egress HTTPS e JWKS público Auth0 | **PASS** — HTTP 200 através do resolvedor novo, usando um endpoint público do Auth0. |
| Tenant Free do projeto, CIMD/DCR real, PKCE real, token real e ChatGPT | **PENDENTE** — o Dashboard exibiu a tela de login. Os casos locais usam metadata, tokens e WordPress sintéticos. |

Testes executados no Windows local com Node v26.13.1. O primeiro teste de egress com o helper herdado retornou `ERR_INVALID_IP_ADDRESS`. O adaptador exclusivo do Auth0 passou a respeitar o formato de callback que o Node pede para seleção de família de IP e a segunda leitura HTTPS passou. As workflows existentes usam eventos push/PR e o commit tem `[skip ci]`, conforme a restrição de Actions hospedadas.

## Mínimo para a homologação real

1. Acesse o [Dashboard Auth0](https://manage.auth0.com/) e selecione um **tenant Free dedicado de teste**. Use o hostname padrão `*.auth0.com`, sem domínio personalizado. Confirme a disponibilidade de CIMD, do perfil RFC 9068 e do Resource Parameter Compatibility Profile nessa conta. Crie um usuário descartável de laboratório com acesso ao login e anote o **User ID** do Dashboard.
2. Defina uma URL HTTPS de staging com `/api/gateway-mcp`, acessível ao ChatGPT. Crie uma **Custom API** cujo Identifier seja essa URL exata. Configure **RS256**, perfil **IETF JWT (RFC 9068)**, validade do access token de até **600 segundos** e permissão `posts:read`. Ative Resource Parameter Compatibility Profile nas opções avançadas do tenant. Habilite acesso delegado de usuário e conceda o escopo à conexão/app de teste conforme as políticas da API.
3. Comece por **CIMD**. Registre o documento oficial `https://chatgpt.com/oauth/client.json` no painel quando a opção de criar pelo Client ID Metadata URL estiver disponível. Compare o callback anunciado com o exibido na conexão do ChatGPT e revise o método de autenticação negociado. Use o client ID emitido pela Auth0 para o claim RFC 9068 `client_id`; o URL do CIMD pode ser o identificador externo, diferente do ID interno. Guarde ambos no ambiente de homologação somente se precisar validar essa diferença. O callback estável exige o suporte de identificação do emissor anunciado na descoberta.
4. Se CIMD falhar, use **DCR** apenas no tenant de laboratório e teste a inscrição real no cliente. Verifique se o Auth0 anuncia `registration_endpoint`, se o cliente dinâmico tem uma conexão habilitada e se a API concede `posts:read`. Autorize o client ID de teste que efetivamente foi registrado. Se a primeira conexão parar após DCR por falta dessa autorização, reaproveite a mesma conexão do ChatGPT após habilitar o ID registrado. Mantenha o escopo e o usuário de teste restritos.
5. Com o staging autorizado, aplique a configuração abaixo por variáveis de ambiente. Execute o preflight e conecte o plugin de teste usando o manifesto do modo escolhido. Faça login pelo ChatGPT, aceite o consentimento de laboratório e execute **`forja_auth0_status` no ChatGPT**. O resultado esperado é `{"authenticated":true,"provider":"auth0","scope":"posts:read"}`. Registre o modo de registro, sucesso do login e da troca de código com PKCE S256 e resposta da ferramenta. Preserve fora do relatório os tokens, códigos, senhas e credenciais individuais.

| Variável | Valor do ambiente de teste |
| --- | --- |
| `FWB_ALT_AUTH0_STAGING` | `enabled` |
| `FWB_ALT_AUTH0_ISSUER` | `https://SEU-TENANT.REGIAO.auth0.com/`, com barra final |
| `FWB_ALT_AUTH0_RESOURCE` | A URL canônica HTTPS do gateway, igual ao Identifier da Custom API |
| `FWB_ALT_AUTH0_REGISTRATION` | `cimd` ou `dcr` |
| `FWB_ALT_AUTH0_SUBJECTS_JSON` | Lista JSON com o User ID do usuário permitido |
| `FWB_ALT_AUTH0_CLIENT_IDS_JSON` | Lista JSON com os IDs permitidos no claim `client_id` do access token |
| `FWB_ALT_AUTH0_TENANTS_JSON` | Opcional. Omitir para a primeira prova, que usa apenas `forja_auth0_status`. |
| `FWB_REG03_STAGING` e `FWB_REG04_STAGING` | Desabilitadas no deploy independente de Auth0 |

Verificação de descoberta, a partir de `mcp/fwb05-poc`:

```sh
node alt01/preflight.mjs
```

Use `--stable-callback` se o callback configurado for o estável. O comando consulta apenas metadata público, sem credenciais ou registros. Para repetir a validação sem conta, execute `npm test` e `npm run build` em `mcp/fwb05-poc` e `node --test infra/fwb-alt-01/discovery-contract.test.mjs` na raiz.

**Próximo bloco — FWB-ALT-01C-LIVE.** Conectar o tenant Auth0 Free ao staging e obter prova de registro CIMD ou DCR, Authorization Code + PKCE S256, token RS256 com audiência esperada e chamada real no ChatGPT. Depois disso, registrar o parecer FWB-ALT-01D. Cloudflare Workers/D1 permanece fora desta entrega.

[OpenAI OAuth](https://developers.openai.com/plugins/build/auth) · [Auth0 Auth for MCP](https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/) · [Auth0 Resource Parameter](https://support.auth0.com/center/s/article/mcp-audience-error-with-auth0) · [RFC 9068 no Auth0](https://support.auth0.com/center/s/article/receive-the-client-id-claim-instead-of-the-azp-claim-in-an-auth0-access-token).
