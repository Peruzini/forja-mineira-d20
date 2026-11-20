# FWB-05C.1 — Ativação do Forja WP Bridge no ChatGPT Web

**Data:** 20/11/2026  
**Status:** diagnóstico técnico concluído; **ativação das ferramentas na conversa PENDENTE por conexão de aplicativo não registrada**.  
**Escopo:** somente leitura, sem WordPress admin, sem novas credenciais, sem uso do WPVibe.

## Objetivo operacional

Permitir que o usuário acione diretamente no ChatGPT Web as ferramentas \`forja_ping\` e \`forja_wp_public_status\`, usando o servidor MCP remoto que já passou no teste externo em FWB-05C.

## Fatos inspecionados

| Elemento | Evidência | Estado |
| --- | --- | --- |
| Fonte do MCP | \`mcp/fwb05-poc/\` na \`main\` | Implementado |
| Deploy Vercel | \`dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN\`, projeto \`forja-wp-bridge-mcp-poc\` | **READY** |
| Teste do cliente MCP remoto | GitHub Actions run \`44810212077\` | **PASS**, duas ferramentas descobertas/executadas |
| Plugin privado | \`plugins_6b00ab6c63cc8191a29479b2636633cc\`, versão 0.1.0 | Criado e instalado conforme captura do proprietário |
| Manifesto do plugin | \`plugin.json\`, \`mcp.json\`, \`.codex-plugin/plugin.json\`, \`.mcp.json\` | Declara servidor remoto, **não declara aplicativo registrado** |
| App MCP registrado no ChatGPT | Nenhum ID \`plugin_asdk_app_...\` identificado para Forja | **Não comprovado** |
| Ferramentas disponíveis nesta sessão | Nenhum \`mcp__Forja...\`, \`forja_ping\` ou \`forja_wp_public_status\` | **PENDENTE** |
| Runtime Vercel | consulta de logs no período; sem eventos disponíveis na consulta | Não é prova de ausência de tráfego |
| WordPress público | diagnóstico anterior via WPVibe + teste REST remoto | Funciona; não confundir com ativação do Bridge |

A presença do botão **Desinstalar** na captura confirma instalação do plugin, **não** confirmação de autorização/configuração de seu app MCP.

## Diagnóstico técnico

O pacote instalado usa a configuração MCP **portável** \`mcp.json\` e \`.mcp.json\`. Isso é válido para clientes compatíveis, sobretudo fluxos locais/desktop, mas não registra automaticamente uma conexão remota na superfície web do ChatGPT.

A documentação oficial exige, para o caminho de app MCP registrado:
1. registrar o servidor MCP em ChatGPT **Plugins → Adicionar servidor MCP personalizado** (quando a conta/ambiente permitir);
2. receber um identificador de aplicativo registrado começando com \`plugin_asdk_app_...\`;
3. criar um \`.app.json\` contendo o vínculo com esse ID;
4. fazer \`.codex-plugin/plugin.json\` apontar \`apps\` para \`./.app.json\`;
5. atualizar o plugin privado existente e testar a ferramenta em nova conversa.

O plugin VTT Visual MCP Test existente na conta demonstra esse formato de \`.app.json\` / \`apps\`. Não copiar seu ID para a Forja: ele identifica **outro serviço** e é inválido para a integração do WordPress.

**Importante:** o recurso de registro manual de servidores MCP personalizados no ChatGPT Web, segundo a documentação de 20/11/2026, é disponibilizado principalmente a **Business/Enterprise/Edu**; não presumir que existe para um usuário Plus. Além disso, esta conversa tem ferramentas para empacotar/atualizar plugins, mas **não** para registrar um servidor como app MCP na conta. Portanto, produzir um novo ZIP contendo apenas \`mcp.json\` ou atualizar a versão do plugin sem \`plugin_asdk_app\` não resolve a ausência de ferramentas web.

## Caminho recomendado à conta pessoal: ChatGPT Sites

A documentação oficial descreve ChatGPT Sites como um caminho elegível a contas Plus/Pro para **hospedar ferramentas MCP e associá-las a um plugin web**. Exige criação/publicação do Site e a associação do plugin pelo fluxo do produto. Não é equivalente a Vercel READY.

Execução mínima, **uma única vez**, quando o produto Sites estiver disponível:
1. Abrir o fluxo \`@Sites\` no ChatGPT e criar um Site privado para **Forja WP Bridge** com ferramentas MCP read-only.
2. Aproveitar as definições e o endpoint público comprovado na Vercel como referência: \`https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp\`. Se Sites não suportar conectar diretamente esse endpoint, implementar \`forja_ping\` e \`forja_wp_public_status\` na hospedagem Sites com a mesma semântica, sem duplicar o WordPress.
3. Publicar o Site e concluir a instalação/conexão do plugin criado pela plataforma; o fluxo Sites é separado do plugin privado importado \`forja-wp-bridge\` v0.1.0.
4. Solicitar na conversa \`forja_ping\` e \`forja_wp_public_status\` e conferir resultados.
5. Somente com as ferramentas na conversa, avançar ao FWB-05D de autenticação segura de WordPress.

**Não pedir ao usuário para reinstalar repetidamente o plugin atual, não utilizar senha de aplicação em URL, chat ou GitHub e não habilitar funções privadas no endpoint público sem autenticação.**

Alternativa: caso a conta/ambiente permita registrar **servidor MCP personalizado** diretamente, seguir as etapas de app registrado acima e atualizar a identidade de plugin privado existente com \`.app.json\` após ter o ID real. Não inventar esse identificador.

## Resultado e critérios de aceite

| Marco | Estado |
| --- | --- |
| Servidor MCP Vercel operacional | PASS |
| Ferramentas descobertas e chamadas por cliente MCP externo | PASS |
| Plugin importado instalado | PASS |
| Aplicativo MCP registrado e vinculado ao ChatGPT Web | **PENDENTE** |
| \`forja_ping\` invocado pela conversa usando o app Forja | **PENDENTE** |
| \`forja_wp_public_status\` invocado pela conversa usando o app Forja | **PENDENTE** |

**Conclusão:** FWB-05C.1 diagnosticado, mas **NÃO homologado**. Bloqueio está no registro/vinculação de app na superfície web, não no servidor MCP nem na saúde básica do WordPress. Nenhuma modificação no WordPress público, nenhuma alteração nos secrets e nenhum custo novo assumido.

## Referências oficiais verificadas em 20/11/2026

- https://developers.openai.com/plugins/build/plugins — procedimento \`Add custom MCP server\`, app ID \`plugin_asdk_app\` e \`.app.json\`.
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt — escopo por planos e permissões.
- https://help.openai.com/en/articles/20001256-plugins-in-chatgpt — instalação não equivale a app conectado; limitações Desktop only.
- https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites — uso web de ferramentas MCP via Site publicado.
- https://learn.chatgpt.com/docs/sites/creating-a-site — iniciar via \`@Sites\`.
- https://agent-plugins.org/plugin-authors/mcp-servers — documentação do \`mcp.json\` portável.

**Não encerrar o FWB-05C/05C.1 só porque o plugin instalado mostra botão “Desinstalar”.**
