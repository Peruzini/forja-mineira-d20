# FWB — Viabilidade de um plugin WordPress pessoal no ChatGPT normal

**Data:** 20/11/2026 · **Escopo:** Forja WP Bridge 2.0 · **Requisito incontornável:** operar no ChatGPT **Chat** normal, sem Work, Worker ou GitHub Actions por operação; plugin privado/pessoal, sem cota artificial própria.

## Resultado executivo

**Existe uma via oficialmente suportada para um único usuário operar um MCP privado no ChatGPT Web, sem Work**: criar um workspace **ChatGPT Business Standard com uma licença**, atuando como seu proprietário, e conectar o servidor em **Plugins → (+) → Add custom MCP server**. A documentação Business atualizada em 20/11/2026 permite uma licença paga e o recurso de MCP personalizado é próprio de Business/Enterprise/Edu.

**Compromisso financeiro da opção Business:** US$ 25/mês por uma licença Standard na cobrança mensal, ou US$ 20/mês com cobrança anual, segundo documentação atual (podem variar impostos, moeda e ofertas). A assinatura Plus pessoal é separada: não presumir migração de histórico ou cancelamento automático. Confirmar preço final e condições no checkout; **não contratar sem autorização explícita**.

**Outra via a testar sem troca de plano:** usar o plugin MCP no **ChatGPT Desktop para Windows, modo Chat**. A documentação prevê plugins com servidores MCP locais/desktops, mas esta conta ainda não demonstrou se o plugin remoto instalado expõe ferramentas em Chat normal no desktop; a configuração MCP compartilha o host Codex, portanto esta hipótese não deve ser homologada sem chamada real no modo Chat. O desktop é obrigatório para esse caminho, e ferramentas instaladas localmente não ficam disponíveis automaticamente no ChatGPT Web/mobile.

**Sem ampliar planos nem usar desktop ou Work**, não há hoje um caminho comprovado para manter um plugin MCP próprio com **escrita** na conta Plus pessoal via ChatGPT Web. Não prometer o contrário.

## Requisitos conferidos com o usuário

| Requisito | Interpretação de aceite |
| --- | --- |
| Uso pessoal | Administrado por uma pessoa, plugin não publicado ao público |
| ChatGPT normal | Prompt no modo Chat, sem Work/Worker/Codex |
| Sem limite WPVibe | Nenhum consumo de cota do conector WPVibe |
| Sem cota própria | Nosso backend não implementa artificialmente 100 chamadas por dia |
| Sem prometer infinito | Permanecem limites e custos do ChatGPT, Vercel, rede e WordPress |
| Equivalência de recursos | Posts, páginas, Rank Math, mídia, status e, depois, administração segura |
| Operação cotidiana | Chat → ferramenta MCP própria → WordPress → prova de persistência |
| Sem revisão excessiva | Ações rotineiras com permissão; confirmações quando exigidas pela plataforma ou risco |
| Segurança | Credenciais fora de chat/GitHub; servidor MCP autenticado ANTES de adicionar escrita |

## Verificações deste estudo (fatos)

- WPVibe disponível na conta apresenta **36 ferramentas** em sua integração: site_info, rest_api, discover_abilities, run_ability, arquivos (list/read/edit/write/delete), mídia, WP-CLI, temas, snippets, navegação, auditoria de página e atualização de plugins/tema/core, entre outras. **Paridade não se limita a REST editorial**.
- Plugin Forja privado instalado: \`plugins_6b00ab6c63cc8191a29479b2636633cc\`, versão \`0.1.0\`, scope USER/PRIVATE.
- Pacote da Forja possui \`mcp.json\` e \`.mcp.json\` apontando para \`https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp\`. **Não contém \`.app.json\` com mapeamento de um aplicativo MCP registrado.**
- O servidor da Vercel \`dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN\` está **READY** e um cliente MCP externo validou descoberta e chamada das ferramentas (run \`44810212077\`).
- Ainda **não há prova** de execução das ferramentas próprias dentro de Chat normal web.
- Conta WordPress \`fwb-read\`: papel Subscriber, **não permite publicação/escrita**; não promover a Editor/Admin apenas para superar uma falha de integração.
- Plugin WP FWB 0.2.0 com idempotência/auditoria existe em PRs draft e **não está comprovadamente instalado na produção**.

## Comparação de opções

| Caminho | Chat normal | Web | Pessoal/privado | Sem Work | Escrita autorizada | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Business Standard (1 licença) + servidor MCP registrado | SIM | SIM | SIM (workspace pessoal de um usuário) | SIM | SIM, com app e servidor seguros | **Principal opção suportada**; depende de assinatura e validação |
| Plus + plugin MCP no ChatGPT Desktop Windows | A verificar em modo Chat | NÃO (Desktop only) | SIM | SIM | Depende do cliente e autenticação | **Experimento sem troca de plano** |
| Plus Web + Site gerando plugin | SIM após publicar Site | SIM | SIM | **NÃO: criação/edição exige Work** | Potencialmente, com backend seguro | Excluída pelos requisitos atuais |
| Plus Web + pacote pessoal \`mcp.json\` importado | Plugin instalado, mas sem ferramenta | NÃO comprovado | SIM | SIM | Não no chat web atual | **Reprovado no FWB-05C.1** |
| Novo GPT personalizado + Actions | Não aplicável | — | — | — | — | Não criar: contas pessoais não permitem mais novos GPTs |
| Publicação no diretório de plugins | SIM após revisão/aprovação | SIM | **NÃO: distribuição pública** | SIM | Possível com aprovação | Inadequada à exigência de plugin pessoal privado |
| Assistente próprio via OpenAI API/UI externo | Chat próprio, **não ChatGPT normal** | Externo | SIM | SIM | Possível | Inadequado à experiência exigida |

## Plano de validação aplicável sem escrever no WordPress

### Rota A — Teste sem trocar de plano: Desktop Chat

1. Instalar/abrir a versão atual do **ChatGPT Desktop Windows** com a mesma conta.
2. Usar explicitamente **Chat** (não Work, Codex ou Worker).
3. Em Plugins pessoais, procurar Forja WP Bridge. Se marcado **Desktop only**, instalar e habilitar ali; se necessário, em Settings → MCP servers, configurar o servidor remoto via **Streamable HTTP** usando exclusivamente \`https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp\` e reiniciar.
4. Em conversa nova de **Chat**, chamar \`@Forja WP Bridge\` e pedir execução de \`forja_ping\` e \`forja_wp_public_status\`.
5. GO **somente** se o próprio modo Chat executar as duas ferramentas. Não aceitar resultado executado em Codex/Work, CLI, GitHub Actions ou simulado.
6. NO-GO: se o MCP só funcionar no host Codex/Work, ou se não houver ferramentas no Chat. Não escalar credenciais/escrita; não insistir em instalação repetida.

### Rota B — Plugin privado no ChatGPT Web, sem Work: Business Standard

**Pré-condição comercial:** autorização explícita para contratar workspace Business de **1 licença** se o usuário desejar. Não iniciar/cobrar de forma automática. Manter o Plus pessoal separado até definir o destino do histórico.

1. Criar workspace Business Standard, com o usuário como proprietário único.
2. No **ChatGPT Web normal**, em Plugins, selecionar **+ → Add custom MCP server** (fluxo oficial Business).
3. Nomear \`Forja WP Bridge — MCP Direto\` e usar \`https://forja-wp-bridge-mcp-96zafqia3-ur-25.vercel.app/api/mcp\`.
4. Na **PoC estritamente de leitura**, configuração sem autenticação é admissível porque apenas ping e índice REST público estão expostos. Aceitar aviso de risco consciente e usar **Create as a plugin**.
5. Revisar ferramentas descobertas \`forja_ping\` e \`forja_wp_public_status\`; instalar plugin gerado na workspace.
6. Abrir **Chat** normal, selecionar o plugin \`@\` e executar ambas. Registrar ID do plugin criado, confirmação real e latência.
7. Após GO, preparar uma **nova versão de backend autenticada** antes de permitir escrita: o endpoint MCP deve exigir uma autenticação própria adequada (OAuth ou solução suportada pelo conector), além de armazenar as credenciais WordPress em secrets do host. **Nunca adicionar escrita ao endpoint público anônimo atual.**

### Segurança do backend para FWB-06+

- Não confundir autenticação entre ChatGPT ↔ MCP com WordPress ↔ MCP. Ambas precisam controle.
- Usar usuário WordPress de serviço com capacidades mínimas. Para editar/publicar, conta separada com papel e recursos adequados, não \`fwb-read\`.
- Sem senha em querystring, source, prompt, documentação, GitHub, logs, outputs ou componentes cliente.
- HTTPS; sem redirecionamento para hosts terceiros; restrições de host/caminho; validação de payload, idempotência, ledger, auditoria sem PII, timeout e rate limits de defesa contra abuso.
- Exigir confirmação contextual antes de publicação, deletes, alterações de PHP/plugins/tema e mudanças administrativas de alto impacto.
- Testar primeiro rascunho reversível; comprovar persistência, diff e restauração. Nunca considerar uma solicitação concluída por mera resposta 200 não confirmada.
- Planejar separadamente mídia, Rank Math (metadados não necessariamente expostos pela REST padrão), funções Abilities e WP-CLI; WP-CLI e alterações de arquivo requerem capacidade de servidor que REST nativa, sozinha, não oferece.

## Backlog por valor, *somente após provar rota A ou B em Chat normal*

1. **FWB-06A — Auth/permissions MCP ↔ WordPress** e validação de leitura real sem WPVibe.
2. **FWB-06B — Editorial**: buscar, criar rascunho, editar, publicar e agendar com persistência; URLs, categorias, tags.
3. **FWB-06C — SEO Rank Math**, schema, metadados e links internos.
4. **FWB-06D — Mídia**: upload, imagens destacadas, alt text, biblioteca.
5. **FWB-06E — Manutenção**: diagnósticos e operações administrativas em camadas, backup e recuperação.
6. **FWB-06F — Equivalência WPVibe**: mapa das 36 ferramentas reais versus cobertura/homologação, sem duplicar interfaces de baixo valor.

## Decisão

- **GO técnico condicional** para **Business Standard + MCP privado em Chat normal Web**, com uma licença e uma configuração inicial. Resolve a barreira de registro do plugin que o Plus Web não resolve sem Sites/Work. **NÃO é GO para escrita até haver autenticação no endpoint.**
- **GO para uma prova gratuita** via **ChatGPT Desktop Chat**, sem alterar plano, mas com resultado ainda **não comprovado** no host Chat.
- **NO-GO** para desenvolver mais 30 ferramentas, consumir WPVibe, criar novo GPT, reinstalar plugin sem app ou repetir testes remotos da Vercel sem prova no Chat normal.
- **Sem compra, upgrade, segredo ou alteração WordPress executados neste estudo.**

## Documentação oficial (revisitada em 20/11/2026)

- Business 1 licença e preço (artigos atualizados em 20/11): https://help.openai.com/en/articles/8542115-chatgpt-business-general-faq
- Faturamento/licença: https://help.openai.com/en/articles/8792536-managing-billing-and-seats-in-chatgpt-business
- Registro MCP no ChatGPT Plugins: https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
- Plugins Web/Desktop e rótulo Desktop only: https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- MCP e limitações de \`mcp.json\` no ChatGPT Web: https://learn.chatgpt.com/docs/extend/mcp
- ChatGPT Sites cria com Work: https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- Novos GPTs não disponíveis em contas pessoais: https://help.openai.com/en/articles/8554397-creating-and-editing-gpts
- Publicar plugin com revisão pública (não para uso privado): https://developers.openai.com/plugins/deploy/submission
- WordPress REST API: https://developer.wordpress.org/rest-api/
