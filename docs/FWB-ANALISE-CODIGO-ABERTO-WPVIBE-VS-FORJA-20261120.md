# FWB — Por que WPVibe funciona no ChatGPT e Forja WP Bridge não?

**Data da investigação:** 20/11/2026  
**Objetivo obrigatório:** plugin **pessoal/privado**, somente em **ChatGPT Chat normal**, custo adicional **R$ 0**, sem Work, Worker ou GitHub Actions por solicitação.  
**Conclusão:** o bloqueio não está na conexão HTTP/MCP de nosso servidor, mas no **registro e roteamento do aplicativo MCP dentro do ChatGPT**. Não há correção demonstrada que seja apenas trocar manifestos e continue atendendo a todas essas restrições na conta Plus.

## 1. Material inspecionado

### WPVibe — código público (fonte primária)

- Repositório oficial: https://github.com/awesomemotive/wpvibe-ai-mcp
- HEAD inspecionado: `f592a9a1cc8d9b780f3c88f0be0bafba11bde091` (19/11/2026).
- `README.md`: explica expressamente que este repositório contém **somente o plugin WordPress**; o **gateway MCP hospedado, OAuth e tool registration** são um produto separado de código fechado em `wpvibe.ai`.
- `includes/class-wpvibe-dashboard-widget.php` linha 17: `CHATGPT_APP_URL` usa **`plugin_asdk_app_6a244fb509e481918985fee76373b0f9`** — identificador de app reconhecido pela plataforma.
- `includes/class-wpvibe-admin.php` linha ~204: URL de MCP anunciada `https://mcp.wpvibe.ai/mcp`.
- `includes/class-wpvibe-rest.php` linhas ~260–760: rotas `wpvibe/v1/*` com `permission_callback`, capacidades diferenciadas e REST de arquivos, posts, CLI emulado, autorização, logs e operações de temas.
- `includes/class-wpvibe-cli.php` linhas ~99+: allowlist de comandos executados em PHP, não shell irrestrito; capacidades e classes de risco por comando.
- `includes/class-wpvibe-abilities.php`: expõe Abilities com verificações de descoberta e permissão.
- `includes/class-wpvibe-ping.php`: `/wpvibe/v1/ping` e `/health` para preflight do WordPress.
- `LICENSE` e `README.md`: GPL-2.0-or-later para o componente WordPress. Se reutilizado num fork, preservar termos, atribuição e avisos; não presumir que os serviços hospedados estão sob GPL.
- Página WordPress.org: https://wordpress.org/plugins/vibe-ai/ — descreve a aplicação no diretório de apps ChatGPT, autenticação por Application Password criada após aprovação no WordPress e relay através do serviço WPVibe.

**Separar o que é comprovado do que não é:** a URL e o registro do aplicativo, os arquivos PHP e as rotas são verificáveis no código aberto; **não** temos o código do backend proprietário, OAuth ou do servidor que define e roteia as 36 ferramentas.

### OpenAI — exemplos públicos

- Repositório oficial: https://github.com/openai/plugins, HEAD `981b02c0c44058b595f3b4180002c3ae3c806d40`.
- `plugins/notion/.codex-plugin/plugin.json`: campo `apps: "./.app.json"`.
- `plugins/notion/.app.json`: campo `apps.notion.id` com `asdk_app_...` válido e já registrado.
- `plugins/github/.codex-plugin/plugin.json`: usa igualmente `apps: "./.app.json"`.
- `plugins/github/.app.json`: associa `connector_...` e `templated_apps_...`, que são integrações **já registradas**, não URLs descobertas de forma automática pelo arquivo.

O exemplo demonstra duas coisas: (a) pacote plugin e aplicativo MCP são conceitos distintos; (b) a referência em `.app.json` não cria aplicativo — ela deve apontar para um ID real e elegível.

### Nossa implementação — GitHub e plugin instalado

- Repositório `Peruzini/forja-mineira-d20`, ramo `main`: `mcp/fwb05-poc/server.mjs` define `forja_ping` e `forja_wp_public_status`.
- Endpoint em Vercel: `https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp`; deploy `dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN`, confirmado READY.
- CI #44810212077: um **cliente MCP externo** executou `tools/list`, `forja_ping` e `forja_wp_public_status` com sucesso. Isso valida o servidor, **não** o ChatGPT.
- Plugin pessoal `plugins_6b00ab6c63cc8191a29479b2636633cc`, versão 0.1.0, possui `plugin.json`, `mcp.json`, `.codex-plugin/plugin.json`, `.mcp.json`; **não possui `.app.json` / app registrado**.
- `mcp.json` aponta ao servidor correto, com `type=streamable-http` e `auth=none` (apenas PoC pública read-only).
- Na interface, o proprietário mostrou o plugin como instalado, mas o teste independente do Chat normal retornou **`MATCHING_EXECUTABLE_TOOLS=[]`** e nenhuma execução de `forja_ping`. A menção `@` não prova rota MCP.
- Inspeção do catálogo de ferramentas da conversa: **36 ferramentas `mcp__WPVibe__*` e zero ferramentas Forja**.
- Checagem de permissões do catálogo de apps nesta sessão: `WPVibe` retorna `status=found` e controle de permissão específico; para `plugins_6b00ab6c63cc8191a29479b2636633cc` retorna `status=not_installed`. **Não é uma prova de que o usuário nunca instalou o pacote:** demonstra uma discrepância entre instalação do **bundle** e presença como **app executável** nesta superfície.
- `plugins/forja-wp-bridge` versão 0.2.0, apenas nos PRs draft #15–#19, implementa validação, criação e edição controlada de **rascunhos** com ledger e auditoria. **Não instalado em produção**, sem Rank Math, mídia, publicação ou administração.
- `fwb-read` tem papel Subscriber e serve somente para testes de leitura; não permite escrita.

## 2. Comparação de camadas

| Camada | WPVibe | Forja WP Bridge | Consequência |
| --- | --- | --- | --- |
| Registro ChatGPT | App publicado `plugin_asdk_app_...` | Apenas pacote pessoal `plugins_...` | **Bloqueio principal**: Chat não expõe Forja |
| Manifesto app | App já registrado/associado pelo fornecedor | `mcp.json` e `.mcp.json`, sem `.app.json` | URL em JSON **não cria** app remoto no Web |
| Servidor MCP | Gateway próprio `mcp.wpvibe.ai/mcp`, código não público | Node MCP remoto Vercel, com 2 ferramentas read-only | Ambos têm servidor; Forja foi validado externamente |
| Identidade e conexão | Serviço WPVibe implementa OAuth e gestão de sites | Sem OAuth MCP nem conta WordPress de escrita | Escrita não pode ser acrescentada ao endpoint anônimo |
| WordPress instalado | Plugin WPVibe `wpvibe/v1` em instalação do usuário segundo diagnóstico | FWB PHP 0.2.0 somente nos PRs | Sem paridade administrativa |
| Operações | 36 ferramentas do WPVibe vistas nesta sessão | 2 ferramentas de leitura e ping em backend | Funções faltantes após solucionar o registro |
| Limite diário | WPVibe oferece plano com cota própria | Nenhuma cota arbitrária própria foi adicionada | Limites de ChatGPT/Vercel/WP continuam possíveis |

## 3. Fluxos reais

**WPVibe:**
`Chat normal → app registrado e ferramentas reconhecidas → mcp.wpvibe.ai/mcp → gateway/OAuth WPVibe → REST WordPress assinada com Application Password → plugin WPVibe (permission_callback/capability) → WordPress`.

**Forja hoje:**
`Chat normal → [nenhum app Forja registrado] → (sem tools/call)`.
A partir de **outro cliente MCP**:
`Cliente MCP externo → Vercel /api/mcp → GET /wp-json/ público → WordPress` (PASS).

O teste de servidor não pode pular o registro de aplicativo por definição: o modelo Chat só pode invocar ferramentas expostas pela plataforma na sessão.

## 4. Por que trocar o ZIP ou copiar o WPVibe não resolve

1. `mcp.json` define um MCP server para **clientes/hosts que carregam essa configuração**. O ChatGPT Web não registra automaticamente URLs desse manifesto; importações com servidor remoto podem ser rotuladas **Desktop only**.
2. Um `.app.json` exige um `asdk_app_...` **existente e elegível**. Inventar um ou usar o ID do WPVibe/Notion/GitHub aponta para a integração **dos outros**, não para a Forja.
3. `Plugin Creator` que usamos cria um **pacote pessoal privado**; não constitui evidência de que o backend registrou o servidor como app MCP no ChatGPT Web.
4. O teste externo comprovou `tools/list`, portanto reescrever SDK, endpoint ou reexecutar CI não corrige a falha de descobrimento **dentro do Chat**.
5. Mesmo clonar toda a parte aberta de WPVibe (GPL) não clona o gateway fechado nem seu registro no diretório de apps da OpenAI.
6. O cliente ChatGPT Desktop compartilha configuração MCP com host Codex, mas o teste **Chat normal** do proprietário falhou. Não misturar funcionar em Codex com funcionar em Chat.
7. O próprio WordPress MCP Adapter oficial alerta que o Web exige OAuth e que o Adapter não fornece um servidor OAuth. Application Password pode autenticar o backend ao WordPress, mas **não registra a ferramenta no ChatGPT**.

## 5. Vias documentadas e aderência às restrições

**A. Plugin remoto personalizado no ChatGPT Web (Private app):** OpenAI documenta conexão MCP privada com escrita em **Business/Enterprise/Edu**. **Não atende** à restrição de custo adicional R$ 0 e conta Plus atual. Referência https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt.

**B. ChatGPT Sites:** Site pode hospedar MCP e gerar app/pluguin no Chat normal após publicação. Entretanto, criação/publicação inicial exige fluxo **Work**; o usuário rejeitou Work/Worker inclusive para esta solução. **Não atende** sem relaxar o fluxo de configuração. Referência https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites.

**C. Plugin da diretoria pública (mesmo caminho comercial do WPVibe):** o OpenAI Platform permite submeter MCP remoto através de **With MCP**, com HTTPS estável, verificação de domínio, autenticação suportada, verificação de identidade do desenvolvedor, avaliações, revisão e aprovação **não garantida**. Depois de aprovado e publicado, um usuário Plus pode instalar o app público em Chat normal. É tecnicamente uma rota **sem assinatura Business obrigatória documentada**, mas o app fica **publicamente listado**, mesmo que o servidor proteja os dados privados e permita autenticação somente do proprietário. **NÃO atende à exigência de plugin pessoal não publicado.** A documentação não informa uma taxa geral de publicação; ainda assim **não garantir custo total R$ 0** (domínio, verificação, hospedagem, limites e requisitos podem ter custos). Referência https://developers.openai.com/plugins/deploy/submission.

**D. Plugin pessoal com `mcp.json` no Desktop Chat:** já testado e resultou zero ferramentas na sessão. Não é caminho homologado. Uma configuração local no host MCP do Desktop, se ainda não checada, não prova disponibilização no Chat normal; não continuar como se passasse.

**E. Servidor MCP via WordPress MCP Adapter / gateway alternativo:** tecnicamente viável para clientes que podem configurá-lo, mas ainda falta **camada de registro do ChatGPT**. Não atende isoladamente.

**F. Reutilizar gateway WPVibe/ID registrado:** usa o fornecedor e sua cota, logo não atende à independência. Não utilizar IDs de aplicativos de terceiros como suposto bypass.

## 6. Desenvolvimento correto se a via de registro for liberada

### Fase 0 — Registro em Chat normal (gate inegociável)

- Manter duas ferramentas apenas: `forja_ping`, `forja_wp_public_status`.
- Registrar o servidor `/api/mcp` como app **Forja**, em via autorizada da OpenAI.
- Receber **ID real** `asdk_app_...` ou `plugin_asdk_app_...`; referenciar esse app em `.app.json` caso o pacote também seja usado.
- No Chat normal, invocar `forja_ping` e observar o resultado real da ferramenta, sem web/GitHub/CI como substitutos.
- Repetir `forja_wp_public_status` pela conversa. Só então GO para funcionalidades WordPress.

### Fase 1 — Autenticação dupla

- **ChatGPT → MCP:** OAuth 2.1 suportado pela conexão ou mecanismo de identidade/autorização aprovado; não expor ferramentas privilegiadas no MCP público anônimo.
- **MCP → WordPress:** serviço usa Application Password em secret server-side via HTTPS, com conta técnica de permissões mínimas; manter `fwb-read` read-only.
- Conectar identidade autorizada ao site/escopo; revogação, logs sem segredos, proteção contra SSRF e replay.

### Fase 2 — Equivalência editorial

- Reaproveitar `wp/v2` nativo, validação, idempotência e auditoria dos PRs da Forja.
- Buscar, criar, editar, publicar, agendar posts/páginas, taxonomias, mídia, metadados. Confirmar persistência e URLs.
- Rank Math exige verificar explicitamente quais metas estão expostas; eventual rota Forja com `permission_callback` e escopos definidos.

### Fase 3 — Manutenção e paridade WPVibe

- Adicionar endpoints próprios/Abilities para temas, arquivos, CLI restrito, diagnósticos e revisão.
- Aprender do código público do WPVibe: allowlist de comandos, `current_user_can`, restrições a paths, hashes para concorrência, dry-run e backup.
- Não copiar o gateway fechado ou alegar acesso a seu código.
- Se aproveitar PHP GPL do WPVibe, cumprir licença/avisos/atribuição, evitando confusão de marca e nunca acoplar acesso indevido ao serviço deles.
- Manter sem cota diária **arbitrária própria**, mas não prometer uso ilimitado de ChatGPT ou hospedagem.

## 7. Decisão técnica

**A causa estrutural está identificada com alta confiança:** WPVibe tem app MCP registrado no ChatGPT, a Forja não. A ausência de app registrado no pacote e de ferramentas expostas na sessão é verificada. Não há evidência de problema na implementação MCP base da Vercel.

**Com todas as restrições simultâneas** (Plus pessoal, Chat normal, private-only, sem Work/Worker, custo adicional zero) **não foi encontrada via oficialmente documentada, operacional e comprovada** para registrar um servidor próprio com ferramentas de escrita no ChatGPT Web em 20/11/2026.

O **único caminho potencialmente sem nova assinatura de ChatGPT e que imita a distribuição do WPVibe** é submeter um plugin remoto à **diretoria pública**, com backend protegido por OAuth para um único usuário; isso exigiria aceitar que **o plugin/listagem fosse público**, enquanto os dados e acesso WordPress permanecessem privados. Depende de revisão/aceite e não tem custo zero garantido. **NÃO fazer essa submissão ou preparar publicação pública sem autorização expressa** — o pedido atual exige privacidade.

**Ação útil agora:** congelar a ampliação de funções até definir uma via real de registro, manter servidor/POCs e documentação, não reinstalar plugin indiscriminadamente, não mover credenciais para o endpoint anônimo, não gastar cota WPVibe nem contratar nada.

## 8. Fontes técnicas

- https://github.com/awesomemotive/wpvibe-ai-mcp
- https://github.com/awesomemotive/wpvibe-ai-mcp/blob/main/includes/class-wpvibe-dashboard-widget.php
- https://github.com/awesomemotive/wpvibe-ai-mcp/blob/main/includes/class-wpvibe-rest.php
- https://github.com/awesomemotive/wpvibe-ai-mcp/blob/main/includes/class-wpvibe-cli.php
- https://github.com/awesomemotive/wpvibe-ai-mcp/blob/main/includes/class-wpvibe-abilities.php
- https://github.com/openai/plugins/blob/main/plugins/notion/.codex-plugin/plugin.json
- https://github.com/openai/plugins/blob/main/plugins/notion/.app.json
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/deploy/submission
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- https://learn.chatgpt.com/docs/extend/mcp
- https://learn.chatgpt.com/docs/enterprise/plugin-management
- https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md
