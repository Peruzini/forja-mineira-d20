Forja Mineira D20 — Guias v1.2.2 — TESTE

SHORTCODE DO HUB
[forja_guias_hub]

Página recomendada:
Título: Guias
Slug: guias

A versão 1.2.0 atualiza o Hub de Guias para a estrutura aprovada:
Hero editorial → Guia em Destaque → Busca/Filtros → Todos os Guias → Explore mais na Forja.

REGRAS DO HUB
- O Guia de Invocações é o destaque editorial atual.
- O destaque não é afetado pelos filtros.
- Os filtros são montados automaticamente a partir dos guias publicados no próprio Hub.
- Sistema/Classe só aparecem quando houver mais de uma opção real disponível.
- Sem cards artificiais de conteúdo “em breve”.
- Hero mantém Classes, Spells, Feats, Backgrounds e Itens como legendas editoriais, não como botões.

GUIAS ATUAIS
- Melhores Magias para Bruxo D&D 5e 2024
- Melhores Invocações Místicas para Bruxo
- Melhores Itens para Bruxo nos Níveis 1–5

URLS
O Hub localiza automaticamente a página publicada que contém:
[forja_guia_invocacoes_bruxo_2024]

Guia de itens canônico:
https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/

Atributos opcionais:
[forja_guias_hub magias_url="" invocacoes_url="" itens_url="" builds_url="" ferramentas_url=""]

SHORTCODE DO GUIA DE ITENS
[forja_guia_itens_bruxo_1_5]

Página recomendada:
Título: Melhores Itens para Bruxo D&D 5e: Níveis 1–5
Slug: melhores-itens-para-bruxo-dnd-5e

INSTALAÇÃO
1. No WordPress, vá em Plugins → Adicionar plugin → Enviar plugin.
2. Envie o ZIP deste pacote.
3. Se a versão anterior já estiver instalada, confirme a substituição/atualização.
4. Ative o plugin.
5. Na página Guias, mantenha o shortcode [forja_guias_hub].
6. Limpe cache do WordPress/Hostinger/CDN antes da validação visual.

VALIDAÇÃO RECOMENDADA
- Desktop e mobile.
- Hero e ícones.
- CTA do Guia de Invocações.
- CTA do Guia de Itens.
- Busca e filtros.
- “Limpar filtros”.
- Estado vazio.
- Links de Builds/Ferramentas.
- Ausência de H1 duplicado do tema.

Este pacote preserva o shortcode e o Guia de Itens existentes da v1.1.0.

NOVIDADES DA v1.2.1 — RANK MATH
- Integração oficial com a Content Analysis API do Rank Math para a página do Hub.
- O analisador passa a considerar o conteúdo editorial renderizado por [forja_guias_hub].
- Quando o Rank Math está ativo, ele assume título SEO, meta description, canonical, Open Graph e Schema.
- O SEO básico próprio do plugin continua apenas como fallback quando o Rank Math não está ativo.
- Nenhuma alteração visual no Hero, cards, filtros, assets ou layout da v1.2.0.
- Rollback seguro: tag Git v1.2.0 e ZIP v1.2.0 validado.

VALIDAÇÃO DA v1.2.1
1. Instalar/substituir o plugin no WordPress.
2. Abrir a página Guias no editor.
3. Confirmar que o Rank Math reconhece texto, headings e links do Hub além do shortcode.
4. Abrir /guias/ e confirmar que o visual permanece idêntico à v1.2.0.
5. Conferir o código-fonte e garantir uma única saída de meta description/Schema sob controle do Rank Math.


NOVIDADES DA v1.2.2 — TESTE MAGIAS
- Adiciona “Melhores Magias para Bruxo” em “Todos os Guias”.
- Ordem da biblioteca: Magias → Invocações → Itens.
- Nova arte aprovada da Elyra abrindo um portal, sem texto rasterizado.
- Categoria “Magias” entra automaticamente nos filtros derivados da biblioteca.
- Guia em Destaque permanece Invocações Místicas com Maera, sem alteração.
- Bloco final “Continue na Forja” e seus links permanecem inalterados.
- Integração do Hub com Rank Math passa a considerar também o Guia de Magias.
- Esta é uma candidata de TESTE; não substitui automaticamente a v1.2.1.
- Rollback seguro: forja-mineira-guias-v1.2.1-ROLLBACK.zip.


AJUSTE DE INTERAÇÃO — CANDIDATA v1.2.2
- O banner inteiro de “Guia em Destaque” passa a ser clicável e leva ao Guia de Invocações.
- Cada card de “Todos os Guias” passa a ser um único link acessível para o respectivo guia.
- “Ler guia →” permanece como CTA visual, sem link aninhado.
- Hover/focus do card inteiro reforça a interação com borda, elevação e zoom mínimo da arte.
- Badges e metadados continuam informativos e não viram links independentes.

AJUSTE FINAL DA v1.2.2 — CARDS CLICÁVEIS SEM SUBLINHADO
- Banner inteiro do Guia em Destaque permanece clicável.
- Cards de Magias, Invocações e Itens permanecem clicáveis por inteiro.
- Remove sublinhados herdados do tema WordPress em títulos, descrição, edição, metadados e CTAs internos.
- Mantém hover, foco por teclado, bordas, botões e identidade visual do Hub.
- Nenhuma mudança na v1.2.1 de rollback.

- Hotfix de compatibilidade: remove sublinhado herdado do tema WordPress em todos os links do Hub, preservando cards inteiros clicáveis.
