# FWB-05 — Teste de ferramentas MCP no Chat normal (desktop)

**Data de registro:** 20/11/2026. **Fonte:** relatório de teste fornecido pelo proprietário em outra conversa do ChatGPT, não execução direta deste registro. **Veredito:** **FAIL / NO-GO para ampliar funções de escrita**.

## Restrições do proprietário
- ChatGPT **normal**, não Work, não Worker, não Codex.
- Uso pessoal e plugin privado Forja WP Bridge.
- **Custo adicional R$ 0**; não contratar Business, APIs ou hospedagem paga.
- Sem cota arbitrária própria, mas os limites existentes de ChatGPT/infraestrutura permanecem.
- Não depender do WPVibe nem de GitHub Actions por operação editorial.

## Teste informado pelo usuário

**Contexto do relatório:** ChatGPT Desktop em modo Chat normal; plugin `Forja WP Bridge` 0.1.0 mencionado via `@`; servidor `forja_bridge`; endpoint Vercel já comprovado por teste MCP remoto anterior.

**Descoberta na outra conversa:**
```
MATCHING_EXECUTABLE_TOOLS=[]
POSSIBLE_PLUGIN_STATUS_ACTIONS=[]
```

| Critério | Resultado | Evidência |
| --- | --- | --- |
| Menção do plugin no Chat | Observada; não comprova conexão | `@Forja WP Bridge` na mensagem |
| `forja_ping` presente e executável | FAIL | zero ferramentas correspondentes |
| `forja_wp_public_status` presente e executável | FAIL | zero ferramentas correspondentes |
| REST WordPress consultada por plugin neste teste | Não testada | Nenhuma invocação de ferramenta |
| Modificações no WordPress | Nenhuma | Relatório informa sem alterações |
| FWB-05C/05E requisito real de Chat normal | **NÃO ATENDIDO** | Nenhuma ferramenta disponibilizada |

O relatório informa um horário de 19h02 de Brasília; tratá-lo como **informação transcrita do relatório**, não como timestamp de servidor validado.

**Verificação adicional na conversa que documenta:** ferramenta Forja não figura no catálogo de ferramentas disponibilizado; confirma que também não está acessível nesta sessão, mas não prova indisponibilidade em todos os ambientes.

## Evidências que não devem ser confundidas

- `dpl_6XYPTJWctAJqjrTRUBkLfaTKEUrN`: servidor MCP Vercel **READY** (verificação anterior).
- GitHub Actions #44810212077: cliente MCP **externo** descobriu duas ferramentas e executou `ping` e consulta REST pública; PASS **externo**, NÃO teste no Chat.
- Plugin pessoal `plugins_6b00ab6c63cc8191a29479b2636633cc`, versão 0.1.0: pacote instalado/registrado, com `mcp.json` e `.mcp.json`. A presença no catálogo não comprova acesso do Chat normal.
- Diagnóstico WPVibe anterior: WordPress respondeu via integração independente; não comprova Forja WP Bridge.

## Interpretação técnica e limite de certeza

**Causa observada:** o host da conversa não disponibilizou as ferramentas MCP do plugin.

**Possíveis mecanismos — ainda não demonstrados:**
1. Configuração `forja_bridge` não habilitada/registrada no host MCP local do aplicativo desktop.
2. Plugin classificado como **Desktop only**, mas a conversa não foi executada em contexto que herda as ferramentas do host local, mesmo que o usuário esteja no aplicativo desktop.
3. Ausência de aplicativo MCP registrado para ChatGPT Web; o manifesto portável `mcp.json` **não cria essa associação**.

**Não concluir sem prova** que o endpoint falhou, que a WordPress REST falhou ou que existe um erro no SDK. Não atualizar o plugin sem evidência de alteração que resolva o host de ferramentas.

A documentação oficial distingue conexão MCP do host Codex/Desktop da disponibilização em ChatGPT Web e afirma que um servidor MCP remoto sozinho não torna o plugin web-compatible.

## Verificação residual única e sem custo

**No aplicativo desktop** (não enviar segredos), abrir **Settings → MCP servers**, se essa seção estiver disponível, e conferir `forja_bridge`:
- Se **ausente**, a configuração do servidor não está ativa naquele host; avaliar cadastrar o endpoint remoto já pronto **sem credenciais** e testar de novo em Chat.
- Se **desabilitado/erro**, registrar mensagem, corrigir configuração sem refazer servidor.
- Se **Connected/Enabled**, mas a conversa Chat normal não expõe `forja_ping`, registrar limitação do host/superfície e encerrar esse caminho.

Essa é uma **verificação opcional e decisiva**, não uma obrigação de instalar outro produto ou usar Codex.

## Decisão GO / NO-GO

**NO-GO agora:** desenvolver/publicar/instalar ferramentas administrativas, habilitar escritura no MCP anônimo, migrar serviços WordPress, consumir WPVibe ou criar novos ZIPs sem alteração de capacidade comprovada.

**GO somente com nova evidência real:** um pedido no Chat normal que chama `forja_ping` por ferramenta do Forja, seguido de `forja_wp_public_status`. Depois disso, iniciar autenticação separada e segura do MCP e do WordPress; escrita exclusivamente após as duas camadas estarem protegidas e homologadas.

**Se o Chat normal não suportar as ferramentas no plano/superfície atual:** declarar o objetivo inviável **nas restrições atuais**, preservar artefatos e interromper novos blocos até surgir suporte de plataforma compatível. Não sugerir plano pago ou Work/Worker, pois o usuário rejeitou essas alternativas.

## Fontes oficiais (verificadas em 20/11/2026)

- https://learn.chatgpt.com/docs/extend/mcp
- https://help.openai.com/en/articles/20001256-plugins-in-chatgpt
- https://help.openai.com/en/articles/20001497-troubleshooting-plugins-and-apps-in-chatgpt
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt
