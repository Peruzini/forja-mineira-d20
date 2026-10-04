# Forja Mineira D20

Projeto WordPress da **Forja Mineira D20**, com builds temáticas, guias editoriais, ferramentas e conteúdo de RPG com foco principal em **D&D 5e 2024**.

Site: https://forjamineirad20.com.br/

## Estrutura

- `plugins/forja-mineira-builds/` — builds, Home, Hub de Builds e votação da próxima build.
- `plugins/forja-mineira-guias/` — guias editoriais e Hub de Guias.
- `plugins/forja-mineira-guia-invocacoes/` — Guia de Invocações Místicas para Bruxo D&D 5e 2024.
- `plugins/forja-mineira-guia-magias/` — Guia interativo de Magias para Bruxo D&D 5e 2024.

## Versões atuais

- **Forja Mineira — Builds:** v2.3.26
- **Forja Mineira D20 — Guias:** v1.2.4
- **Forja Mineira D20 — Guia de Invocações:** v1.3.0
- **Forja Mineira D20 — Guia de Magias:** v1.0.6

## Estado operacional em 04/10/2026

O GitHub mantém as versões canônicas de produção. Candidatas TESTE ativas no WordPress continuam fora do `main` até promoção explícita.

- **Builds:** GitHub/produção canônica em v2.3.26; v2.3.25 preservada como rollback imediato. A Build Voldemort integra o Clusters nativamente.
- **Guia de Invocações:** GitHub/produção canônica em v1.3.0; v1.3.8 TESTE está ativa no WordPress e validada com Clusters.
- **Guia de Magias:** GitHub/produção canônica em v1.0.6; integração nativa do Cluster aprovada e v1.0.5 preservada como rollback imediato.
- **Clusters:** v1.0.5 TESTE está ativo no WordPress para integração gradual, mas ainda não foi promovido para o GitHub.
- **Guias / Itens:** plugin Guias v1.2.4 em produção/GitHub; preserva a integração nativa do Cluster em Itens e consolida no próprio plugin o padrão visual da navegação geral do Hub. v1.2.3 é o rollback imediato.
- **Rollback do tema:** `forja-mineira-d20-wpvibe-backup`.
- **Voldemort:** integração nativa do Cluster concluída na Builds v2.3.26. O plugin Clusters v1.0.5 continua TESTE até a auditoria/promoção final.

## URLs canônicas consolidadas

- Home: https://forjamineirad20.com.br/
- Build Voldemort: https://forjamineirad20.com.br/voldemort-dnd-5e-build-bruxo/
- Guia de Itens para Bruxo: https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/

Evitar criar páginas duplicadas para o mesmo conteúdo.

## Shortcodes principais

### Builds / Home

- `[forja_build nome="voldemort"]`
- `[forja_builds_hub]`
- `[forja_home_hero]`
- `[forja_home_build_cycle]`
- `[forja_home_featured_guide guide_url="https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/"]`

O shortcode `[forja_home_featured_guide]` atualmente renderiza os destaques do Guia de Itens e do Guia de Invocações no mesmo componente.

### Guias

- `[forja_guia_itens_bruxo_1_5]`
- `[forja_guias_hub]`

Página recomendada para o Hub de Guias:

- Título: **Guias**
- Slug: `/guias/`
- Conteúdo: `[forja_guias_hub]`

### Guia de Invocações

- `[forja_guia_invocacoes_bruxo_2024]`

O plugin preserva o shortcode acima como identificador principal da página do guia.

### Guia de Magias

- `[forja_guia_magias_bruxo_2024]`

Base atual: 94 magias, sendo 91 Core 2024 + 3 Heroes of Faerûn (HoF), com catálogo mestre–detalhe e filtros por função, escola, fonte, nível e prioridade.

## Conteúdo atual

### Build Voldemort

Build temática completa de **Bruxo (Warlock) 1–20**, com progressão visual, magias, Invocações Místicas (Eldritch Invocations), Arcanos Místicos e itens desejáveis.

### Guia de Itens para Bruxo

Guia editorial para os níveis iniciais, com foco em defesa, foco arcano, consumíveis e prioridades práticas.

### Guia de Invocações Místicas

Guia de **D&D 5e 2024** organizado por nível, estilo e função, com filtros, análise contextual e quatro mini-builds:

- Rajada & Controle
- Pacto da Lâmina (Pact of the Blade)
- Pacto do Tomo (Pact of the Tome)
- Pacto da Corrente (Pact of the Chain)

A versão v1.3.0 usa a arquitetura compacta final das quatro mini-builds, com seletor manual e um painel principal por vez.

### Guia de Magias para Bruxo

Guia de **D&D 5e 2024** com 94 magias auditadas, Hero editorial, filtros e painel detalhado em card pai próprio (`.fmmg-detail-card`). A versão v1.0.6 é a referência de plugin para futuras bases de magias da Forja, incluindo o slot desacoplado do Clusters.

### Hub de Guias

O plugin de Guias v1.2.4 inclui o Hub publicado e validado no WordPress por meio de `[forja_guias_hub]`, com integração ao Rank Math, cards e banner de destaque inteiros clicáveis, o Guia de Magias incorporado em `Todos os Guias`, integração nativa do Cluster no Guia de Itens e navegação geral final com linguagem visual irmã do Clusters. Atualmente destaca:

- Melhores Magias para Bruxo
- Melhores Invocações Místicas para Bruxo
- Melhores Itens para Bruxo nos Níveis 1–5

## Home

A Home usa componentes próprios da Forja. No bloco **“Na Forja Agora”**, a ordem atual é:

1. Melhores Invocações Místicas para Bruxo
2. Voldemort — Bruxo 1–20
3. Melhores Itens para Bruxo

Os banners de guias ainda pertencem ao plugin Builds. A separação futura desses destaques em um plugin dedicado pode ser feita sem alterar os conteúdos individuais.

## Identidade visual

Direção consolidada:

- fantasia sombria editorial/pictórica;
- estética acadêmica/gótica;
- preto, grafite, verde-esmeralda e dourado discreto;
- textura de grimório/livro antigo;
- áreas claras/creme para leitura quando necessário;
- evitar cartoon e aparência genérica de card game.

## Biblioteca e produção

- **Biblioteca Forja Mineira D20** = referência-mestre de artes aprovadas, manifestos e decisões visuais.
- **GitHub** = código e assets efetivamente usados em produção.
- Artes rejeitadas não devem voltar como referência.
- Antes de promover uma nova arte para produção, salvar na pasta correta da Biblioteca e atualizar o manifesto correspondente.

## Nomenclatura editorial

Quando aplicável, usar sempre o nome em português seguido do original em inglês entre parênteses.

Exemplos:

- Bruxaria (Hex)
- Rajada Mística (Eldritch Blast)
- Pacto da Lâmina (Pact of the Blade)

Material anterior ao conjunto-base 2024 deve ser identificado como **Legacy** quando relevante.
