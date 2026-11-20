# FWB-05C — Hospedagem do MCP e conexão do plugin privado

Data-base: 20/11/2026 · Estado: servidor remoto hospedado e testado; plugin pessoal privado criado; ativação na conversa pendente.

## Objetivo

Tornar o protótipo MCP FWB-05A acessível por HTTPS e comprovar sua descoberta e invocação diretamente nesta conversa por um plugin privado. **Servidor hospedado não é sinônimo de plugin conectado.**

## Via de hospedagem

A conta Vercel conectada possui equipe **UR-25** no plano Hobby. Como o acesso direto à criação/publicação de ChatGPT Sites não é fornecido pelas ferramentas conectadas a esta conversa, uma hospedagem de prova alternativa usa Vercel e o código existente em mcp/fwb05-poc.

**Configuração técnica da PoC hospedada (deploy por arquivos, sem vínculo Git automático):**
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


## Execução concluída nesta etapa — 20/11/2026

### A. Build e hospedagem

- Código FWB-05C incorporado à main: commit `b7ec32ed7377fe1e3b87ac304ce3d119c9fdbe4e`.
- CI/Next.js: https://github.com/Peruzini/forja-mineira-d20/actions/runs/44809792059 — **SUCCESS**, incluindo 3/3 testes locais e compilação do endpoint.
- Equipe Vercel usada: UR-25 (plano Hobby). Projeto: `forja-wp-bridge-mcp-poc`, ID `prj_Dq5BOigwoemzXhAyHqaMXrdx9bqp`.
- Deploy: `dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN`, READY; endpoint HTTPS `https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp`.
- A tentativa de vincular automaticamente o repositório à Vercel encontrou ausência de GitHub Login Connection na Vercel. **Contorno aplicado:** envio direto dos 6 arquivos da PoC a partir do commit versionado no GitHub, sem credenciais de WordPress ou alteração no site.
- A Vercel informou target `production` para **o projeto de demonstração Vercel**, não para o site WordPress. Deploy não instalou nada em `forjamineirad20.com.br`.
- Proteção Vercel Authentication desabilitada exclusivamente neste projeto demonstrativo para permitir teste remoto não autenticado de funções que exibem apenas dados públicos. **Nunca incorporar ferramentas privilegiadas a este endpoint antes de adicionar autenticação e controles adequados.**

### B. Teste de protocolo por cliente remoto

- Workflow: https://github.com/Peruzini/forja-mineira-d20/actions/runs/44810212077 — **SUCCESS**.
- Log confirmado: `FWB-05C: MCP REMOTO PASS; 2 ferramentas descobertas; ping e status WordPress público confirmados; zero escrita.`
- A chamada foi realmente feita por cliente MCP externo via HTTPS ao deploy Vercel, e a ferramenta consultou a REST pública do WordPress, sem consumir a cota WPVibe.

### C. Plugin privado ChatGPT

- Criado via Plugin Creator como plugin pessoal não público `forja-wp-bridge` versão **0.1.0**.
- Identificador: `plugins_6b00ab6c63cc8191a29479b2636633cc`.
- URL: https://chatgpt.com/plugins/plugins_6b00ab6c63cc8191a29479b2636633cc
- Categoria: pessoal `USER`; discoverability: `PRIVATE`.
- Plugin empacota configuração MCP remota HTTPS e duas funções de leitura sem acesso a dados privados.
- **Limite comprovado:** a criação do plugin foi confirmada; não há ferramenta do novo plugin disponível na lista de ferramentas **desta conversa em andamento**. Portanto, instalação/conexão/execução no ChatGPT ainda não estão validadas, mesmo que o servidor e o pacote existam.

### D. Gating atualizado

| Etapa | Resultado |
| --- | --- |
| FWB-05C-1: Next.js build | **PASS** |
| FWB-05C-2: cliente MCP real via HTTPS | **PASS** |
| FWB-05C-3a: criação de plugin pessoal privado | **PASS** |
| FWB-05C-3b: ferramenta invocada diretamente pelo ChatGPT | **PENDENTE** |
| FWB-05C-4: status REST público WordPress remoto | **PASS** |
| FWB-05D: autenticação de conteúdo privado e autorização de escrita | **PENDENTE** |

Próxima ação objetiva: abrir o link do plugin pessoal, confirmar instalação/conexão quando a interface solicitar, iniciar uma nova conversa que disponibilize suas ferramentas e executar `forja_ping` pelo próprio ChatGPT. Não copiar ou divulgar senha de aplicação WordPress; este protótipo não a utiliza.

**Status final honesto: hospedagem remota e criação de plugin privado realizadas; chamada originada nesta conversa ainda não comprovada.**


## Correção de diagnóstico — FWB-05C.1, 20/11/2026

**A instalação do plugin 0.1.0, sozinha, não é suficiente para oferecer ferramentas MCP no ChatGPT Web.** O pacote instalado declara o servidor remoto em \`mcp.json\`/\`.mcp.json\`, mas não contém vínculo com um aplicativo MCP registrado \`plugin_asdk_app_...\`. É necessário usar ChatGPT Sites ou registrar um aplicativo MCP personalizado onde houver suporte, e então habilitar suas ferramentas. O servidor Vercel foi validado; a conexão web continua HOLD. **Não insistir em reinstalar o plugin atual** como solução.

Ver procedimento e referências em [FWB-05C.1 — Ativação no ChatGPT Web](FWB-05C1-ATIVACAO-CHATGPT-WEB-2026-11-20.md).
