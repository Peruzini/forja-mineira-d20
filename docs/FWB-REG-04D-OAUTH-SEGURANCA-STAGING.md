# FWB-REG-04D · OAuth e segurança pré-publicação

Base [PR #33](https://github.com/Peruzini/forja-mineira-d20/pull/33), commit `decfd5241edc3b1754af24492a2d5c2777b90641`. Decisão de liberação: **NO-GO para publicação e conexão no ChatGPT normal**.

| Critério | Estado | Evidência exigida ou disponível |
| --- | --- | --- |
| Documento CIMD e JWKS do ChatGPT | Documento público consultado | Identidade e callback estáveis, preferência `private_key_jwt`, algoritmo RS256 e URI JWKS publicados. O documento também anuncia `none`; a política de staging deve exigir cliente confidencial. |
| Keycloak com CIMD real, PKCE S256 e política restritiva | Executado pelo job `keycloak-live-cimd` quando a CI estiver disponível | A admissão só recebe PASS quando o Keycloak sem cliente pré-cadastrado chega à tela de login com o documento ao vivo e rejeita origem, callback, resource e PKCE fora da política. Consulte o resultado do run para o commit do PR. |
| Troca `private_key_jwt` real e MCP no ChatGPT | Bloqueado | Fluxo real iniciado por uma conta de teste do ChatGPT contra staging público, assertiva assinada e aceita, token com emissor e audiência validados e chamada MCP na interface normal. |
| Onboarding e revogação | PASS no laboratório REG-04C; bloqueado em staging | [CI do PR #33](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44912809777) com WordPress, Keycloak e PostgreSQL reais. O cliente MCP do teste e o administrador de laboratório faziam parte do ambiente local. |
| Conta de serviço de privilégio mínimo | Bloqueado | Realm de staging e acesso de provisionamento indisponíveis. O adaptador herdado usa `FWB_REG04C_ADMIN_BEARER` como primitiva de laboratório. |
| HTTPS público, segredos, isolamento, egress/DNS e logs | Bloqueado | A consulta Vercel encontrou apenas `forja-wp-bridge-mcp-poc`. Faltam host de staging autorizado, Keycloak, PostgreSQL privado, WordPress de teste, gerenciador de segredos e controle de egress. |

## Keycloak

`tests/fwb-reg04d/check-cimd.py` gera um realm descartável para Keycloak 26.8.2 com `cimd,resource-indicators`. Os nomes de configuração no realm são os da API dessa versão. O teste do PR #33 valida um contrato local com nomes abreviados, insuficiente como evidência de importação ou aplicação da política. O job usa o documento público original, sem pré-cadastrar o client ID, espelhar as chaves ou seguir o callback externo.

No staging, use um realm dedicado, domínio público exclusivo e admin em rede privada. O proxy deve permitir o client ID CIMD exato `https://chatgpt.com/oauth/client.json` nas rotas OAuth pertinentes, aceitar somente o callback estável para esse cliente e exigir o `resource` igual à URL canônica do MCP na autorização. A condição do Keycloak filtra por domínio, e a lista de resource do executor só atua quando a requisição envia esse parâmetro. Confirme que a descoberta do emissor anuncia CIMD, PKCE S256 e RFC 9207. Valide assinatura, emissor, audiência, expiração e escopos na entrada do gateway.

## Provisionamento da conta de onboarding

1. Crie um cliente confidencial dedicado `fwb-onboarding` no realm isolado com service account e grant `client_credentials`. Desative fluxos interativos e password grant. Mantenha a credencial do cliente no gerenciador de segredos, com autorização de leitura exclusiva do onboarding.
2. Aplique gestão delegada com FGAP v2 no grupo dedicado de contas vinculáveis. Vincule a política à identidade da service account. Comece com a capacidade necessária para ler o usuário por ID e atualizar os atributos de vínculo. Valide o escopo efetivo antes de ligar o serviço. Roles administrativas globais, inclusive `manage-users` e `realm-admin`, furam essa barreira e ficam fora da configuração.
3. O endpoint administrativo de usuário pode permitir alterações mais amplas do que dois atributos. Se o privilégio efetivo permitir ações fora do escopo, mantenha NO-GO e implemente uma interface restrita aos dois campos `fwb_site_id` e `fwb_connection_id`, vinculada ao `sub` verificado. Apenas após o teste de autorização, substitua o bearer estático pelo token de serviço de curta duração obtido no backend.
4. Colete evidências com duas contas elegíveis e uma externa. A conta de serviço deve conseguir operar sobre a elegível e receber negativa explícita para conta externa, administração de clientes e roles. A API de onboarding deve impedir que o usuário A modifique o vínculo do usuário B, mesmo quando ambos são elegíveis.

## Aceite de staging

1. Disponibilize Keycloak e gateway em TLS confiável com nomes separados da produção. Isole PostgreSQL, WordPress descartável, volumes, rede e credenciais. Mantenha a API administrativa do Keycloak acessível apenas para os serviços autorizados.
2. Restrinja conexões de saída do Keycloak à origem do CIMD e do JWKS por TLS. Aplique allowlist de hosts WordPress de teste no gateway, valide os IPs efetivamente usados na conexão e bloqueie destinos de rede privada, loopback, link-local e metadados de infraestrutura. Rejeite redirecionamentos e DNS que resolva para faixas proibidas. Prove que as negativas ocorrem antes de qualquer conexão.
3. Injete segredos em runtime, criptografe os vínculos e verifique rotação. Revise logs do proxy, Keycloak, gateway e onboarding para garantir ausência de cabeçalhos de autenticação, códigos OAuth, assertivas, cookies, tokens e senhas de aplicativo.
4. Faça a conexão do plugin privado em modo Chat normal e registre apenas eventos sanitizados de descoberta, autorização, troca assinada e execução MCP. Teste acesso ao rascunho do autor e negativa cruzada. Revogue o vínculo e a Application Password no WordPress e comprove que o token anterior não acessa o MCP e a credencial anterior não autentica no WordPress. Registre status e IDs de eventos sem registrar credenciais.

Próximo passo: disponibilizar um host de staging autorizado, DNS/TLS e acesso de provisionamento ao ambiente isolado. Usar um gerenciador de segredos para as credenciais. Com o staging disponível, provisionar a conta de serviço, validar seu escopo e executar o fluxo real no ChatGPT normal.

Referências: [OpenAI · Autenticação](https://developers.openai.com/plugins/build/auth), [ChatGPT · CIMD](https://chatgpt.com/oauth/client.json), [Keycloak · MCP/CIMD](https://www.keycloak.org/securing-apps/mcp-authz-server), [Keycloak 26.8.2 · constantes da API](https://www.keycloak.org/docs-api/26.8.2/javadocs/constant-values.html).
