# FWB-05 — Prova de conexão direta: execução e critérios

Data-base: 20/11/2026.
Projeto: Forja WP Bridge 2.0.
Condição: **prova técnica em execução; conexão ChatGPT ↔ WordPress AINDA NÃO VALIDADA**.

## Objetivo

Confirmar que um plugin próprio consegue ser invocado diretamente por uma conversa no ChatGPT, inicialmente em leitura e depois em escrita autorizada, sem uso de WPVibe ou disparo manual de GitHub Actions.

## Evidências encontradas

1. O WordPress público em https://forjamineirad20.com.br expõe a REST API /wp-json, como comprovado por FWB-04B; o Bridge WordPress v0.2.0 só existe em branches e não está instalado em produção.
2. A documentação atual da OpenAI limita conexões MCP personalizadas com ferramentas de escrita essencialmente a Business/Enterprise/Edu; isso não implica que uma conta pessoal possua o mesmo recurso.
3. ChatGPT Sites permite hospedar servidores MCP vinculáveis a plugins; documentação informa hospedagem incluída em Plus/Pro, sujeita a limites. É o candidato principal, mas esta conversa não tem ferramenta de criação/deploy de Sites.
4. A documentação do WordPress MCP Adapter declara que ChatGPT web não aceita inserir Application Password diretamente e que o Adapter sozinho não oferece OAuth; é necessária ponte de autenticação apropriada.
5. Foi tentada uma chamada somente leitura a um plugin privado já existente (VTT Visual MCP Test), mas a execução retornou erro HTTP 429; isso não comprova a viabilidade operacional.
6. Plugin Creator permite empacotar plugins privados, mas empacotar um plugin **não registra nem hospeda automaticamente** um servidor MCP e não substitui a conexão do app.

Fontes oficiais:
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/testing.md

## PoC mínimo implementado no repositório

Em mcp/fwb05-poc:
- server.mjs: servidor MCP stateless com duas ferramentas próprias e read-only, usando SDK oficial v2.
- forja_ping: prova do roteamento de ferramentas sem qualquer acesso WordPress.
- forja_wp_public_status: consulta somente GET /wp-json/ do domínio fixo da Forja; não lê conteúdos privados.
- tests/mcp.test.mjs: cliente MCP de verdade em processo, descoberta, chamada ping, status WordPress simulado por injeção e tratamento de falha.
- .github/workflows/fwb-05-mcp-poc.yml: CI automatizado offline; **não conecta o plugin à conta ChatGPT**.

Essa PoC **não** inclui Application Password, POST, instalação no WordPress, OAuth, publicação ou acesso a dados privados.

## Gates e resultado esperado

| Gate | Evidência necessária | Status |
| --- | --- | --- |
| 05-A SDK MCP | Cliente MCP real descobre e executa forja_ping localmente | **PASS — CI #44809243349** |
| 05-B WordPress público | ferramenta retorna status validado do WordPress sem WPVibe | TESTE FALSO/MOCK em CI; externa já validada no FWB-04B |
| 05-C ChatGPT | plugin/site hospedado conectado; chamada de forja_ping **desta conversa** | PENDENTE |
| 05-D Autenticação | ponte OAuth/credencial compatível, sem segredo no chat ou repo | PENDENTE |
| 05-E Escrita | alteração reversível autorizada via ferramenta própria e checagem de persistência | PENDENTE |

**Regra GO/NO-GO:** só iniciar implementação extensa dos módulos editoriais depois do gate 05-C e de uma estratégia demonstrável para 05-D/05-E; GitHub Actions passando não basta.

## Próximo passo, após SDK MCP PASS

Criar/abrir um ChatGPT Site privado para hospedar a ponte, registrar o app como plugin próprio e invocar forja_ping em uma conversa. A criação do Site requer uma capacidade de execução/implantação do produto que não está acessível por estas ferramentas atuais. Não reutilizar senha WordPress no código ou por chat. Caso essa via não esteja disponível, registrar o bloqueio e não consumir mais desenvolvimento editorial.

## Política de simplicidade

Uma conexão inicial e, depois, pedidos diretos no chat. GitHub para código e testes, não para cada edição. Permissões do WordPress continuam valendo; alterações sensíveis podem exigir confirmação e backup. A main pode receber mudanças isoladas e verificadas, sem PR obrigatório para atualizações documentais ou de PoC.


## Resultado registrado do FWB-05A — 20/11/2026

- Commit da PoC na main: c9a1c5145673ab7fc0d7598a8cd878aeb05fc18c.
- Run CI: https://github.com/Peruzini/forja-mineira-d20/actions/runs/44809243349 — **SUCCESS**.
- Testes do cliente MCP oficial contra o handler real, em processo: **3/3 PASS**.
- Descoberta das duas ferramentas: forja_ping e forja_wp_public_status — PASS.
- Chamada do forja_ping e resposta estruturada — PASS.
- Consulta WordPress via GET público fixo, sem credenciais, simulada por injeção para teste reproduzível — PASS.
- Erro remoto não vaza conteúdo do serviço nem dispara retry automático — PASS.
- WordPress produção: sem instalação, sem alteração, sem criação de conteúdo e sem uso de WPVibe.

**Interpretação precisa:** o protocolo MCP e o catálogo de ferramentas foram validados localmente; **a conexão do plugin ao ChatGPT e a chamada feita de uma conversa ainda não ocorreram**. Conclusão parcial **FWB-05A PASS / FWB-05C HOLD**. Não implementar módulo editorial amplo antes do FWB-05C.
