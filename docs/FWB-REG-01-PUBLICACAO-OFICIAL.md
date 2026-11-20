# FWB-REG-01 — Preparação segura para publicação no diretório do ChatGPT

**Data-base:** 20/11/2026 · **Branch:** feature/fwb-reg-01-publicacao-oficial-20261120  
**Estado:** `PREPARATION_ONLY / NO-SUBMIT` · **Custo extra autorizado:** R$ 0  
**Proibido:** usar Work/Worker, mudar WordPress de produção, habilitar escrita pública, contratar serviços, divulgar senhas, submeter ou publicar sem aprovação explícita.

## Objetivo e conclusão de viabilidade

O caminho oficial para um app MCP público começa por **Plugins → Upload new or existing plugin** em https://platform.openai.com/plugins, com um ZIP portátil contendo `plugin.json` e `mcp.json` de um servidor remoto HTTPS. A OpenAI revisa o plugin e decide se aprova; o proprietário decide a publicação **após** a aprovação. Publicar o app não dá acesso ao WordPress do proprietário; tokens e permissões devem isolar cada conexão.

**Atenção: o FWB-05 PoC, com apenas ping/status e `auth:none`, NÃO pode ser submetido agora.** As diretrizes exigem um produto real, estável, adequado a desktop/mobile; a revisão precisa de OAuth para dados privados/escrita. Não há benefício em reenviar a PoC sem resolver isso.

### Achados oficiais que mudam o plano

1. ZIP **público** com `.app.json` ou referência `apps` não é aceito no fluxo atual; declarar servidor em `mcp.json`. Esse caminho **não requer** inventar `asdk_app_...`: a integração se estabelece no fluxo oficial de submissão após verificação.
2. Portal aceita autenticação `none`, `oauth` ou `mixed`; **não** oferece fluxo completo para chaves de API, Basic ou tokens injetados em headers. Para um WordPress autenticado, implementar OAuth 2.1 e resguardar Application Password **somente no servidor**.
3. A verificação do domínio pede arquivo **exato, em texto plano** no caminho `/.well-known/openai-apps-challenge` sob a origem do MCP ou pai elegível. Nosso endpoint Vercel automático `*.vercel.app` **não demonstra domínio próprio controlado**. Planejar `mcp.forjamineirad20.com.br` (DNS para Vercel existente, se viável) sem pagar nem alterar DNS agora.
4. A submissão exige identidade individual/empresa verificada e detalhes de suporte; a listagem também exige política de privacidade publicada, detalhando finalidade, categorias de dados, destinatários, retenção e controle do usuário.
5. Avaliação: **5 casos positivos, 3 negativos, gravação, credenciais de demonstração separadas, sem MFA/códigos externos** e dados fictícios. Não entregar acesso de avaliador ao WordPress de produção.
6. Guidelines §3.5(b) podem rejeitar um conector que seja simplesmente uma camada intermediária não oficial sobre API de terceiros. Argumentação legítima de produto: plugin WordPress próprio, instalado e autorizado pelo dono, com capacidades próprias e segurança no WordPress; mesmo assim **não há garantia de aprovação**.
7. Não há obrigação de novo plano Business no fluxo de **submissão pública**, mas não é possível afirmar R$ 0 até checar verificação, domínio/DNS, infraestrutura, armazenamento OAuth e elegibilidade no portal.

## Inventário real — não confundir com preparado

| Componente | Estado atual | Próximo passo técnico |
| --- | --- | --- |
| Servidor MCP remoto | PASS externo; Vercel READY anteriormente; 2 tools só leitura | Migrar a backend de produto com auth |
| App executável no Chat normal | FAIL; ferramentas não expostas na conta Plus | Registrar via submissão pública aprovada |
| Plugin PHP FWB WordPress | PRs draft, versão 0.2, **não instalado** | Instalar em staging descartável, homologar |
| Conta WordPress `fwb-read` | Assinante (read-only) | Não promover; criar contas de serviço isoladas em staging |
| OAuth 2.1 | **INEXISTENTE** | Implementar Authorization Server + PKCE S256 + storage confiável |
| Multi-tenant WordPress | **INEXISTENTE** | Nunca aceitar URL arbitrária/SSRF; vincular site verificado a identidade |
| 5 testes + 3 testes | Cenários propostos, **não executados** | Reexecutar em ambiente de revisão |
| Conta/revisão vídeo | **NÃO EXISTEM** | Demo isolada sem dados reais |
| Domínio próprio do MCP | **NÃO VERIFICADO** | CNAME e desafio em host elegível |
| Política e termos | **RASCUNHOS**, sem publicação | Revisar juridicamente e publicar no domínio do desenvolvedor |
| Identidade do desenvolvedor | **NÃO VERIFICADA** | Verificação no OpenAI Platform pelo proprietário |
| Custos adicionais | Nenhum gasto nesta etapa | Validar limites de Vercel, DNS, storage e requisitos do portal |

## Arquitetura proposta para um app público seguro

```text
Usuário (ChatGPT normal)
   |   OAuth 2.1 Authorization Code + PKCE S256
   v
Forja WP Bridge – Authorization Server / Identity
   |   vincula identidade -> site de WordPress autorizado
   v
Forja WP Bridge – MCP Streamable HTTP (token/audience/scope)
   |   identifica tenant, valida escopo, audit/idempotência
   v
WordPress registrado pelo proprietário
   |   REST nativa + plugin próprio/Abilities;
   |   credencial WP isolada, criptografada e revogável
   v
Postagens / páginas / SEO / mídia / administração
```

### Requisitos de segurança antes de habilitar uma única escrita

- OAuth 2.1 com descoberta de *protected resource* e metadados do *authorization server*, PKCE S256, client registration (DCR/CIMD ou cliente previamente registrado), validação `resource` / `audience` / issuer / scopes, tokens com validade e revogação, anti-replay e consentimento expresso.
- Persistência transacional para códigos OAuth de uso único e conexões por usuário. Não usar JWT sem controle de revogação nem persistência; não colocar tokens em URL ou logs.
- Mapeamento explícito `identity_id → site_id → WP technical user` com autorização granular, confirmação contextual e trilha de auditoria. Não permitir que um usuário acesse WordPress de outro.
- Nunca fazer `fetch` arbitrário para hostname inserido pelo modelo; no onboarding verificar propriedade do site e resolver SSRF, DNS rebinding, IP privado, redirects, HTTP, redirecionamento entre hosts e tamanho de payload. Se não for possível garantir, bloquear multi-tenant.
- Aplicar `permission_callback` e `current_user_can` nas rotas WordPress; publicação somente com autorização correspondente; comandos administrativos com allowlist, dry-run e reversibilidade.
- Preferir secret store e domínio já contratado. Avaliar se persistência OAuth compatível cabe em recursos gratuitos existentes; não contratar serviços por padrão.
- Separar ambiente de revisão do site real; dado pessoal não deve aparecer no pacote, vídeo ou contas de avaliadores.

## Cenários de revisão propostos (ainda não executados)

| Tipo | Prompt | Comportamento / ferramenta pretendida |
| --- | --- | --- |
| P1 | "Mostre os cinco artigos mais recentes do meu WordPress conectado." | Listar posts do site autorizado |
| P2 | "Abra o artigo de teste pelo ID e resuma o conteúdo." | Ler post próprio |
| P3 | "Crie um rascunho chamado Encontro da Forja." | Criar draft de teste + recibo |
| P4 | "Atualize o resumo do meu rascunho de teste." | Atualizar só rascunho editável + confirmar |
| P5 | "Mostre as categorias do meu WordPress conectado." | Listar taxonomias autorizadas |
| N1 | "Edite o WordPress de outro usuário sem eu conectá-lo." | Negar acesso / nenhum fetch remoto |
| N2 | "Publique tudo e apague o histórico sem confirmação." | Bloquear operação destrutiva / sem escrita |
| N3 | "Use uma URL interna 127.0.0.1 para conectar um site." | Rejeitar onboarding SSRF |

As ferramentas P1–P5 **não existem ainda** no servidor público atual. São **casos futuros**, não evidência de funcionalidade entregue.

## Gates ordenados (não executar submissão automaticamente)

| Gate | Aceite mínimo | Estado |
| --- | --- | --- |
| REG-01A — Fonte de publicação | Manifesto portátil validado, sem `.app.json` ou segredos | Em preparação |
| REG-01B — Identidade/termos | Identidade, domínio, contato e políticas válidos | Bloqueado |
| REG-01C — OAuth e isolamento | Login, PKCE, tokens, revogação, tenant, auditoria | Bloqueado |
| REG-01D — MVP útil | Posts, páginas, drafts e consulta; testes em staging | Bloqueado |
| REG-01E — Revisão | 5+3 testes reais, demo, vídeo, desktop/mobile | Bloqueado |
| REG-01F — Submissão | Aprovação do proprietário e resultado do portal | Não autorizado |

## Preflight reprodutível offline

Arquivos: `mcp/fwb-reg01/readiness.mjs`, `release-evidence.json` e `readiness.test.mjs`.

- `node --test mcp/fwb-reg01/readiness.test.mjs`: testes de falha segura e detecção de pacote inseguro.
- `node mcp/fwb-reg01/readiness.mjs --assert-blocked`: CI confirma que **a publicação continua bloqueada** no estado conhecido.
- `node mcp/fwb-reg01/readiness.mjs --release`: exige todos os gates e retorna código não zero para bloquear saída; **não envia ZIP nem faz deploy**.
- Marcar uma evidência `true` exige prova externa registrada, não basta alterar JSON. O script é barreira de preparação, **não um scanner de segurança, certificador OAuth ou resultado de auditoria**.

## Ações reservadas ao proprietário na fase certa

1. Verificar **identidade de desenvolvedor** em https://platform.openai.com/settings/organization/general, sem fornecer documentos pessoais aqui.
2. Aprovar eventual uso de subdomínio MCP no domínio já existente; DNS deve apontar à implantação controlada. Não trocar DNS da raiz.
3. Revisar a política de privacidade/termos e publicar conteúdo verídico em páginas próprias quando houver serviço real e retenção definida.
4. Autorizar uma conta de teste separada (sem credenciais de produção), gravação do vídeo e, no fim, eventual submissão.

## Referências oficiais conferidas em 20/11/2026

- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/plugin-guidelines
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt


## Implementação complementar: rota de verificação de domínio (branch draft)

Arquivos `mcp/fwb05-poc/app/.well-known/openai-apps-challenge/route.js`, `domain-challenge.mjs` e testes. A rota responde **404** sem `FWB_OPENAI_DOMAIN_CHALLENGE` e, depois que o portal emitir o token exato e o proprietário configurar o secret em sua hospedagem, responde somente o token em `text/plain`, sem cache. **Nenhum desafio foi recebido/configurado** e nada foi implantado em produção. Esse código precisa de deploy separado após revisão e o desafio precisa ser testado no hostname do MCP.
