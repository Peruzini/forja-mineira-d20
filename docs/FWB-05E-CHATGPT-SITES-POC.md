# FWB-05E — Prova de viabilidade no ChatGPT Sites

**Data-base:** 20/11/2026.  
**Projeto:** Forja WP Bridge 2.0.  
**Objetivo:** demonstrar acesso WordPress por MCP de um plugin **hospedado no Sites**, executado por uma conversa da conta pessoal Plus, sem WPVibe/GitHub Actions por pedido.

## Decisões técnicas verificadas

- ChatGPT Sites é disponibilizado para Plus/Pro, com limites de utilização/armazenamento e construção debitada de uso Codex.
- O Site pode hospedar MCP e um plugin correspondente; a primeira publicação pelo proprietário cria o plugin vinculado.
- O ChatGPT Web inicia a criação de Sites em **Work** usando `@Sites` ou descrevendo um website; não há nesta conversa ferramenta para criar/publicar um Site via API.
- Plugin privado importado pela versão FWB-05C (identificador `plugins_6b00ab6c63cc8191a29479b2636633cc`) **não é** o plugin gerado pelo Sites. Não desinstalar/apagar o anterior até a prova e não simular a conexão por ele.
- WordPress REST API permite Application Password em Basic Auth **somente por HTTPS**. Uma conta WordPress com papel Subscriber é suficiente para testar a identidade autenticada, mas não para editar posts.
- Esta etapa é **somente leitura**. Nenhuma credencial pode ser incluída em prompt, resposta do plugin, GitHub, logs ou código cliente.

Referências:
- https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites
- https://learn.chatgpt.com/docs/extend/mcp
- https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
- https://developer.wordpress.org/rest-api/reference/users/

## Artefato implementado em GitHub

`mcp/fwb05-site/site-tools.mjs`: funções de referência com três ferramentas, sem capacidade de escrita, sem dependências adicionais, controle de timeout, redirect=error, host WordPress fixo e sanitização de falhas.

`mcp/fwb05-site/tests/site-tools.test.mjs`: cinco cenários offline: ping; consulta pública; ausência de secrets; consulta autenticada simulada; falha sanitizada.

`.github/workflows/fwb-05e-sites-adapter.yml`: CI de referência. **PASS no GitHub não comprova Sites publicado nem plugin integrado.**

## Brief pronto para executar no ChatGPT Sites

> Crie no **ChatGPT Sites** um Site privado chamado **Forja WP Bridge — PoC de Integração**, com um MCP server hospedado **no próprio Site** e um plugin associado para ser usado por mim em conversas no ChatGPT Web. Não crie um site de conteúdo, uma landing page comercial nem publique o Site ao público.
>
> Contexto e código de referência no meu repositório GitHub privado `Peruzini/forja-mineira-d20`, caminhos `mcp/fwb05-site/` e `docs/FWB-05E-CHATGPT-SITES-POC.md`. A versão já hospedada na Vercel prova apenas que um servidor externo responde, mas **não** é o plugin/site que queremos homologar.
>
> Exponha **exatamente três ferramentas MCP read-only**, com respostas estruturadas e testes:
>
> - `forja_ping`: responde `{ok:true, operation:"ping", project:"Forja WP Bridge", read_only:true}`. Nunca chama WordPress.
> - `forja_wp_public_status`: GET ao URL fixo `https://forjamineirad20.com.br/wp-json/` com Accept JSON, retornando `site`, `rest_available` e `wordpress_api` se o índice contiver `wp/v2`.
> - `forja_wp_auth_probe`: GET ao URL fixo `https://forjamineirad20.com.br/wp-json/wp/v2/users/me?context=view` com Basic Auth **somente no runtime do servidor Sites**, usando `FWB_WP_USERNAME` e `FWB_WP_APP_PASSWORD` como **secrets do Site**. Retorne apenas flags `configured` e `authenticated`, sem dados do usuário e sem incluir credenciais, headers ou detalhes de erro.
>
> Não inclua credenciais no código, banco, repositório, configurações públicas, JavaScript cliente ou chat. Se os segredos ainda não estiverem configurados, `forja_wp_auth_probe` deve retornar `configured:false` sem chamar WordPress. Solicite que o proprietário cadastre os secrets pelo painel seguro do Site, sem compartilhá-los na conversa.
>
> Não crie funções de escrita, publicação, edição de conteúdo, SEO, mídia, plugins ou WP-CLI. Não altere permissões de usuários. Permita somente chamadas HTTPS GET ao domínio WordPress fixo; sem redirects, sem proxies arbitrários, sem retries automáticos, com timeout de 8 segundos e falhas sanitizadas. Mantenha todas as informações privadas na configuração do servidor.
>
> Execute testes com respostas simuladas antes de tocar WordPress. Gere preview privado e mostre as ferramentas. Depois publique **somente como Site privado** usando a conta proprietária, crie/instale/conecte o **plugin gerado pelo Sites** e execute `forja_ping` em uma conversa do ChatGPT. Não afirme homologação antes da chamada real do plugin.
>
> Ao concluir, informe URL do Site, ID/link do plugin gerado, três ferramentas encontradas, logs de execução sem credenciais, resultado das consultas pública e autenticada, e qualquer bloqueio de plano/permissão/runtime. Não substitua uma prova real por um CI externo.

## Matriz de aceite — exigir prova real no ChatGPT

| Gate | Comprovação | Estado |
| --- | --- | --- |
| 05E-A1 | Ferramentas com testes offline, sanitização e leitura exclusiva | **PASS — CI #44814347350 (5/5)** |
| 05E-A2 | Site criado em conta pessoal, preview privado funcional | **PENDENTE — criação via Work/Sites** |
| 05E-A3 | Site privado publicado, plugin Site-generated instalado/conectado | **PENDENTE** |
| 05E-A4 | `forja_ping` invocado por conversa com plugin Sites | **PENDENTE** |
| 05E-B1 | `forja_wp_public_status` invocado na conversa sem WPVibe | **PENDENTE** |
| 05E-B2 | Site secret configurado pelo proprietário em interface segura | **PENDENTE** |
| 05E-B3 | `forja_wp_auth_probe` invocado na conversa, sem revelar dados | **PENDENTE** |

## GO / NO-GO

**GO para FWB-05F (escrita reversível em rascunho):** 05E-A4, 05E-B1 e 05E-B3 aprovados por chamadas reais do plugin ChatGPT Sites. 

**NO-GO:** se a conta não permitir Site/plugin, se o runtime não conseguir fazer as chamadas permitidas ao WordPress ou se exigir segredos expostos ao chat. Preservar o WPVibe até validar substituição; nenhuma ferramenta pode alterar o WordPress neste bloco.

## Limitação operacional deste ambiente

Esta conversa dispõe de GitHub, Vercel e Plugin Creator (empacotamento), **mas não de um comando para criar e publicar Sites**. A documentação indica que o processo de criação é executado em **ChatGPT Work, com `@Sites`**. Não registrar Site, publicação, plugin Sites ou teste de conversa como concluídos sem evidência. O brief acima é a transferência direta e específica para essa etapa nativa de produto.

## Evidência de execução da implementação de referência — 20/11/2026

- Commit inicial do adaptador: `dad237df240340071684353defa92786811d51cb`.
- CI: https://github.com/Peruzini/forja-mineira-d20/actions/runs/44814347350 — **SUCCESS**; 5/5 testes passaram.
- Teste 1: ping não acessou a rede.
- Teste 2: somente GET REST público, sem Authorization.
- Teste 3: secrets ausentes impediram qualquer chamada externa autenticada.
- Teste 4: GET de identidade com Basic Auth em URL fixa retornou somente resultado booleano, sem PII.
- Teste 5: falha de upstream sanitizada, sem repetição de chamada.
- Todos os testes com respostas simuladas; **nenhuma credencial real utilizada**.
- A versão de referência **não é um Site publicado**, e o plugin Sites ainda **não foi criado**.
