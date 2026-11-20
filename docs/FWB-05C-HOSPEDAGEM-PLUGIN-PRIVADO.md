# FWB-05C — Hospedagem do MCP e conexão do plugin privado

Data-base: 20/11/2026 · Estado: implementação técnica da hospedagem de demonstração, sem credenciais WordPress.

## Objetivo

Tornar o protótipo MCP FWB-05A acessível por HTTPS e comprovar sua descoberta e invocação diretamente nesta conversa por um plugin privado. **Servidor hospedado não é sinônimo de plugin conectado.**

## Via de hospedagem

A conta Vercel conectada possui equipe **UR-25** no plano Hobby. Como o acesso direto à criação/publicação de ChatGPT Sites não é fornecido pelas ferramentas conectadas a esta conversa, uma hospedagem de prova alternativa usa Vercel e o código existente em mcp/fwb05-poc.

**Configuração prevista de Git deploy:**
- repositório: Peruzini/forja-mineira-d20;
- rootDirectory: mcp/fwb05-poc;
- framework: Next.js 16;
- endpoint: /api/mcp (Streamable HTTP);
- catálogo: forja_ping, forja_wp_public_status;
- status público: GET ao índice WP /wp-json, sem credenciais;
- escrita: nenhuma; sem instalação ou alteração em WordPress.

Esta é uma PoC deliberadamente pública apenas com informações já públicas do WordPress. **NÃO adicionar Application Password, tokens, rotas de escrita, acesso a dados privados ou ferramentas administrativas sem autenticação apropriada.**

## Evidências técnicas

- FWB-05A: 3/3 testes do cliente MCP oficial, CI #44809243349.
- FWB-05C: empacotamento Next.js e testes de build/HTTP deverão ser registrados após execução.
- Conector ChatGPT: pendente, até o plugin pessoal referenciar o servidor compatível e a conversa executar forja_ping.

## Como funcionaria a conexão com ChatGPT

**Opção preferencial — Sites:** segundo a documentação oficial, criar um Site próprio, incluir ferramentas MCP, publicar o Site como proprietário, instalar e conectar o plugin gerado. A disponibilização do Site para publicação exige o fluxo do produto, não fornecido pelas ferramentas de GitHub/Plugin Creator nesta conversa. Para leitura/edição de WordPress, será necessária configuração de autenticação externa própria.

**Opção externa — servidor HTTPS Vercel:** a URL MCP pode servir para um app MCP remoto personalizado, mas sua adição ao ChatGPT depende das opções/permissões efetivamente disponíveis na conta. Plugin Creator aceita plugin ZIP, **não registra nem conecta um app MCP remoto apenas por declarar uma URL no manifesto**; não criar um falso plugin funcional.

Referências:
- https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites
- https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel

## Critérios de aceite

1. **FWB-05C-1 — Build:** projeto compilado em CI; servidor MCP exposto no HTTPS da hospedagem.
2. **FWB-05C-2 — Cliente remoto:** cliente MCP real descobre ferramentas pelo HTTPS e chama forja_ping; resultado verificável.
3. **FWB-05C-3 — Plugin privado:** plugin instalado e conectado na conta do usuário; forja_ping invocado pela conversa.
4. **FWB-05C-4 — WordPress:** ferramenta de status público retorna resultado verdadeiro, sem WPVibe.
5. **FWB-05C-5 — FWB-05D:** autenticação adequada para conteúdo privado/ações de escrita antes de novos módulos.

**Não encerrar como concluído apenas com 1 e 2.** Resultado parcial deve separar claramente servidor funcional de plugin ChatGPT vinculado.

## Operação cotidiana desejada

Uma vez homologado e conectado, o usuário escreve o pedido em linguagem natural; o assistente executa a ferramenta apropriada e verifica o resultado. GitHub serve para o desenvolvimento do conector, **não para disparar cada tarefa comum**.
