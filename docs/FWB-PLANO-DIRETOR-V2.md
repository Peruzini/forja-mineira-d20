# Plano Diretor — Forja WP Bridge 2.0

**Projeto:** Forja Mineira D20 · **Data-base:** 20/11/2026 · **Status:** planejamento aprovado como direção de produto; implementação do novo conector ainda não iniciada.

**Repositório:** https://github.com/Peruzini/forja-mineira-d20 · **Site:** https://forjamineirad20.com.br/

> **Objetivo em uma frase:** permitir que o responsável peça, em linguagem natural no ChatGPT, tarefas de conteúdo, SEO, mídia e administração, e que o assistente as execute de fato no WordPress por uma integração própria, sem depender da cota diária do WPVibe nem exigir GitHub Actions manual para cada operação.

## 1. Decisão de produto e motivação

O problema inicial é a cota operacional diária do WPVibe; não é a ausência de acesso ao WordPress. O WPVibe já estava conectado e oferecia ampla capacidade de execução. Desenvolver outro sistema apenas para criar rascunhos e exigir múltiplas aprovações não atende ao pedido.

O Forja WP Bridge 2.0 deve:
1. ser **acionável diretamente nas conversas** com o ChatGPT por ferramentas conectadas, quando o plano e a plataforma permitirem;
2. permitir **consultar e operar** posts, páginas, Rank Math, mídia, plugins, temas e diagnósticos conforme os módulos forem entregues;
3. usar o **GitHub como código-fonte, histórico, CI e implantação técnica**, não como um painel manual para cada pedido editorial;
4. manter **uma configuração de conexão reutilizável** e o mínimo de intervenções humanas;
5. fazer **verificação após cada operação**, retornando ID, estado, URL e evidência relevante;
6. preservar autenticação segura, permissão compatível com a operação, backup e recuperação proporcionais ao risco.

**Não objetivos:** recriar um editor WordPress inteiro na conversa; prometer acesso administrativo sem permissões; contornar políticas da OpenAI; garantir custo total zero; eliminar o WPVibe antes de confirmar cobertura funcional.

## 2. Experiência pretendida e fluxos de aceite

| Comando do usuário na conversa | Resultado esperado |
| --- | --- |
| “Atualize o artigo X com novas informações.” | Localizar, ler, editar e confirmar versão/URL. |
| “Revise o Rank Math deste artigo.” | Consultar e alterar metadados SEO compatíveis e verificar persistência. |
| “Crie um artigo, inclua a imagem e publique.” | Criar conteúdo, tratar mídia e publicar quando o usuário autorizar. |
| “Atualize a página Y.” | Alterar a página correta sem criar duplicata. |
| “Cheque plugins, erros e performance.” | Diagnosticar o estado, explicar e executar correção compatível, quando autorizada. |
| “Ajuste o tema e confira a aparência.” | Preparar alteração recuperável, validar e aplicar sem rotinas manuais desnecessárias. |

O padrão de interação é **pedido no chat → escolha de ferramentas → execução → confirmação do resultado**. Para impacto elevado, o assistente pode solicitar confirmação contextual; não se cria uma cadeia de revisores para qualquer edição simples. Confirmações exigidas pela plataforma devem ser respeitadas.

## 3. Inventário técnico existente — fatos verificáveis

No GitHub, os cinco blocos estão em PRs **draft ainda não integrados à main** em 20/11/2026:
- FWB-02, [PR #15](https://github.com/Peruzini/forja-mineira-d20/pull/15): plugin WordPress Forja WP Bridge 0.1.0, API de rascunhos e validação.
- FWB-03, [PR #16](https://github.com/Peruzini/forja-mineira-d20/pull/16): plugin 0.2.0, ledger de idempotência, auditoria, cliente Python e fluxo GitHub Actions.
- FWB-04, [PR #17](https://github.com/Peruzini/forja-mineira-d20/pull/17): WordPress/MariaDB descartáveis em CI, testes de permissões e rascunhos.
- FWB-04B, [PR #18](https://github.com/Peruzini/forja-mineira-d20/pull/18): testes REST públicos de leitura e verificação da exposição de Application Passwords.
- FWB-04C, [PR #19](https://github.com/Peruzini/forja-mineira-d20/pull/19): teste de conta Assinante para leitura, introspecção de senha de aplicação e conta Contribuidor separada para escrita futura.

**Evidência do último bloco:** [CI #44802040573](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44802040573) concluiu 31 verificações REST em WordPress descartável, 2 eventos de auditoria e zero publicações indevidas. Isso **não valida instalação em produção nem acionamento MCP nesta conversa**.

| Ativo existente | Destino na versão 2.0 |
| --- | --- |
| Validador de payload / REST WordPress | Reaproveitar e ampliar por domínio. |
| Auditoria de operações / idempotência | Reaproveitar, corrigindo concorrência, retenção e recuperação. |
| Suite PHP + WordPress de laboratório | Reaproveitar como regressão contínua. |
| Cliente Python e preflight público | Preservar como diagnóstico e fallback técnico. |
| Workflows de criação de rascunhos no Actions | Retirar do fluxo diário; manter CI/implantação. |
| Restrição exclusiva a drafts | Substituir por operações editoriais completas com capacidades diferenciadas. |
| Usuário fwb-read / Application Password | Já criados pelo proprietário; **nunca armazenar a senha no Git ou no chat**; papel de leitura não permite escrita. |
| WPVibe conectado | Manter como contingência até equivalência funcional suficiente. |

**Observação de integridade:** A main contém código de produção de outros plugins, e há divergências históricas entre partes do WordPress ao vivo e do repositório. Consolidar FWB separadamente; não copiar por acidente versões de outros plugins nem mesclar os cinco PRs cegamente.

## 4. Arquitetura-alvo e decisões ainda abertas

Arquitetura lógica:

    Usuário no ChatGPT
       ↓ comando em linguagem natural
    Conector MCP do Forja WP Bridge (compatível com a conta e permissões)
       ↓ ferramentas e respostas estruturadas
    WordPress Abilities API / MCP Adapter oficial / capacidades FWB
       ↓ APIs nativas e integrações específicas
    WordPress Forja + Gutenberg + Rank Math + mídia + administração

O **WordPress MCP Adapter oficial** converte capacidades registradas na Abilities API em ferramentas MCP e suporta transporte HTTP. O FWB deve registrar capacidades próprias e aproveitar APIs WordPress existentes, sem reinventar todo o protocolo. Referências:
- https://github.com/WordPress/mcp-adapter
- https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md
- https://developer.wordpress.org/news/2026/02/from-abilities-to-ai-agents-introducing-the-wordpress-mcp-adapter/

**Dependência crítica do produto:** verificar a capacidade real de **conectar e executar uma ferramenta própria com escrita nesta conta ChatGPT** antes de desenvolver o restante. A documentação oficial atual indica suporte pleno a servidores MCP personalizados principalmente em Business e Enterprise/Edu e restrições em planos pessoais; Plugin Creator / Apps SDK ou outro caminho suportado devem ser examinados sem prometer compatibilidade antecipada:
- https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt

**Possíveis caminhos de FWB-05 (a selecionar por prova):**
- **A — Plugin privado próprio no ChatGPT:** verificar o mecanismo de criação e a capacidade de ação permitida para esta conta.
- **B — MCP personalizado:** usar servidor remoto/ponte OAuth e permissões adequadas, apenas se o acesso real da conta permitir.
- **C — alternativa operacional temporária:** manter WPVibe enquanto a conexão direta de escrita não for viável; não fingir que acionar GitHub Actions em segundo plano resolve o objetivo.

As opções A e B são alternativas a testar, **não implementações concluídas**. Segurança de transporte, autenticação HTTPS/OAuth/credenciais, exposição de capacidades e custos de hospedagem serão definidos depois da prova.

## 5. Escopo funcional priorizado

| Área / módulo | Leituras | Escritas |
| --- | --- | --- |
| Conteúdo / FWB-07 | Posts, páginas, categorias, tags, revisões | Criar, editar, duplicar, agendar, publicar, atualizar status |
| Rank Math / FWB-08 | SEO title, description, dados sociais, redirects | Atualizar metadados, corrigir redirecionamentos compatíveis |
| Mídia / FWB-08 | Biblioteca, imagens, textos alternativos | Upload, imagem destacada, ALT, organização |
| Administração / FWB-09 | Plugins, temas, versões, WP-CLI/diagnóstico quando permitido | Atualização e correções permitidas, com recuperação |
| Performance / FWB-09 | Cache, logs permitidos, auditoria, PageSpeed | Purga/configuração e alterações comprováveis |
| Orquestração / FWB-10 | Descoberta de ferramentas e checagem de resultados | Fluxos compostos numa conversa |

As ações descritas são **requisitos**, não capacidades já presentes no Bridge. O módulo Rank Math será implementado contra a versão instalada real; não presumir metacampos liberados via REST.

## 6. Roadmap executável (FWB-05 a FWB-11)

### FWB-05 — Prova de conexão direta e decisão de viabilidade · PRIORIDADE 0

**Objetivo:** provar que esta conversa consegue chamar uma ferramenta própria com resultado observável e, se a plataforma suportar, uma escrita de teste autorizada. Identificar planos, permissões, custos e a menor configuração inicial possível.

**Execução:** inventariar capacidades da conta e Plugin Creator; testar descoberta de uma ferramenta de leitura inofensiva; verificar se ferramenta de escrita é permitida; registrar alternativa escolhida e impeditivos. Se o caminho escolhido exigir servidor/OAuth, montar prova mínima com endpoint de teste, sem instalar nada no WordPress público.

**Pronto quando:** ferramenta acionada **desta conversa**, resposta estruturada verificável, limites documentados; decisão explícita de GO/NO-GO para escrita direta. Caso bloqueada por plano, registrar NO-GO e alternativa realista — **não começar FWB-07**.

### FWB-06 — Núcleo 2.0 e consolidação do legado

**Objetivo:** transformar o plugin existente em catálogo de capacidades compatível com o caminho confirmado em FWB-05.

**Execução:** reconciliar PRs #15–#19 sem tocar nos plugins de produção alheios; registrar categorias/abilities, schemas, permission callbacks, auditoria e idempotência; substituir orquestração manual do GitHub por ferramentas invocáveis no chat; testes unitários + ambiente descartável.

**Pronto quando:** as operações de status, pesquisa e leitura de conteúdo funcionam pela integração escolhida; testes PASS e versão rastreável. O merge em main pode ser realizado quando aprovado e verificado; não há veto genérico à main.

### FWB-07 — Conteúdo editorial completo

**Objetivo:** cobrir posts e páginas, com Gutenberg, mídia destacada, categorias, tags, agendamento e publicação autorizada.

**Pronto quando:** executar via chat a consulta, edição e publicação de um artigo de teste, confirmando ID, URL, status e conteúdo persistido, sem intervenções GitHub Actions.

### FWB-08 — SEO Rank Math e biblioteca de mídia

**Objetivo:** realizar atualizações editoriais, SEO e imagens em fluxo único.

**Pronto quando:** um pedido composto altera post + metadados Rank Math + imagem destacada; leituras subsequentes conferem a persistência e a renderização.

### FWB-09 — Administração, integridade e performance

**Objetivo:** inspecionar e, dentro das capacidades efetivamente disponíveis, operar plugins, temas, cache, diagnósticos e manutenção.

**Pronto quando:** identificar e corrigir um problema controlado com backup/retorno possíveis, preservando o estado do site; ações de alto impacto têm confirmação proporcional.

### FWB-10 — Experiência conversacional e fluxos compostos

**Objetivo:** interpretar comandos naturais de várias etapas, descobrir ferramentas pertinentes, executar, verificar e reportar resultados.

**Pronto quando:** dez cenários completos, incluindo falhas tratadas, executados sem copiar comandos ou disparar workflows manualmente.

### FWB-11 — Migração operacional e contingência

**Objetivo:** tornar o Bridge a conexão principal em tarefas prioritárias, mantendo o WPVibe temporariamente como fallback.

**Pronto quando:** matriz de paridade relevante aprovada, procedimentos operacionais e recuperação documentados; tarefas prioritárias executadas sem consumo da cota do WPVibe.

## 7. Indicadores e gates objetivos

| Indicador | Meta / critério |
| --- | --- |
| Viabilidade | Pelo menos 1 ferramenta própria chamada no ChatGPT; escrita testada ou bloqueio formalmente identificado em FWB-05. |
| Experiência | Após configuração inicial, **zero uso manual de GitHub Actions** por tarefa WordPress comum. |
| Paridade | Cobrir pelo menos 90% de uma lista congelada de dez cenários prioritários do usuário em FWB-11. |
| Confiabilidade | Meta inicial: >=95% de sucesso em cenários repetíveis de teste, sem publicação ou alteração indevida. |
| Evidência | 100% das mutações retornam confirmação do ID, estado e verificação pós-escrita ou erro explícito. |
| Dependência WPVibe | Zero chamadas ao WPVibe durante os cenários aceitos do Bridge. |
| Segurança | Segredos fora do repositório e chat; permissões compatíveis; confirmações quando houver risco relevante. |
| Custo | Estimar custo mensal incremental e manutenção antes da opção por servidor/proxy/conta adicional. |

O escopo aceita liberação incremental. Operações editoriais comuns não exigem cinco etapas de aprovação; modificações em tema, plugins, usuários, permissões ou exclusões exigem avaliação e recuperação compatíveis com o risco.

## 8. Política operacional simplificada

- **Solicitação e execução:** usuário descreve objetivo no chat; o assistente usa ferramentas conectadas e retorna o resultado.
- **Leitura:** executar diretamente, conforme permissões.
- **Edição comum:** executar conforme solicitação e permissões, com checagem pós-escrita.
- **Publicação:** executar quando solicitada e autorizada; confirmações que a plataforma exigir continuam válidas.
- **Operações de risco elevado:** explicar efeito, preservar recuperação e obter confirmação apropriada quando necessária.
- **GitHub/main:** permitido atualizar a main quando houver decisão de implementação, testes e compatibilidade. PR não é requisito para toda rotina.
- **Credenciais:** jamais expor a Application Password ou registrar seu valor na documentação; conta fwb-read existente é leitura, não “credencial de administrador”.
- **WPVibe:** não desinstalar até aprovação da paridade. Não utilizar reset de cota sem pedido do usuário.

## 9. Dependências, riscos e decisões

| Risco / dependência | Tratamento |
| --- | --- |
| ChatGPT atual não aceitar ferramentas MCP próprias de escrita | Resolver em FWB-05 antes de desenvolver funcionalidades; registrar GO/NO-GO. |
| Autenticação WordPress e conexão ChatGPT incompatíveis | Escolher autenticação/ponte suportada, sem colocar senha em texto. |
| Uso de hospedagem/serviço adicional gerar custo | Comparar alternativas e apresentar custo real antes de contratar. |
| Diferenças GitHub ↔ WordPress ativo | Inventariar versões; não substituir plugins existentes indevidamente. |
| Rank Math exigir integração especial | Validar versão e metadados antes de escrever. |
| Ações administrativas sensíveis | Usar capacidades WordPress, backup, registro e recuperação. |
| Escopo muito amplo | Entregar prioritariamente conexão → editorial → SEO/mídia → administração. |

**Decisões em aberto:** (1) mecanismo de conexão ChatGPT que efetivamente suporte leitura e escrita nesta conta; (2) credencial de edição/administração apropriada; (3) local de hospedagem/bridge, se necessário; (4) estratégia de empacotamento e implantação no WordPress; (5) lista dos dez cenários prioritários para paridade.

## 10. Próxima execução autorizável

**Começar por FWB-05.** Não construir mais endpoints antes de provar o acionamento direto. O resultado de FWB-05 deve responder: **“Consigo pedir aqui e o ChatGPT realmente executar no WordPress, sem WPVibe?”** Se a resposta técnica for negativa para a conta atual, propor a alternativa real com custos e restrições, sem prometer uma conexão inexistente.

### Referências do histórico e documentação

- [FWB-02 PR #15](https://github.com/Peruzini/forja-mineira-d20/pull/15)
- [FWB-03 PR #16](https://github.com/Peruzini/forja-mineira-d20/pull/16)
- [FWB-04 PR #17](https://github.com/Peruzini/forja-mineira-d20/pull/17)
- [FWB-04B PR #18](https://github.com/Peruzini/forja-mineira-d20/pull/18)
- [FWB-04C PR #19](https://github.com/Peruzini/forja-mineira-d20/pull/19)
- [OpenAI — Connecting custom MCP servers](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt)
- [WordPress — MCP Adapter](https://github.com/WordPress/mcp-adapter)
- [WordPress — Creating abilities](https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md)

*Este documento é o plano diretor vigente para novos blocos FWB. As decisões anteriores de “somente rascunhos”, “GitHub Actions para cada operação” e “main proibida” não são requisitos do produto 2.0.*
