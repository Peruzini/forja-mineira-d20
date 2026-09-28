Forja Mineira D20 — Guias v1.2.1

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
- Melhores Invocações Místicas para Bruxo
- Melhores Itens para Bruxo nos Níveis 1–5

URLS
O Hub localiza automaticamente a página publicada que contém:
[forja_guia_invocacoes_bruxo_2024]

Guia de itens canônico:
https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/

Atributos opcionais:
[forja_guias_hub invocacoes_url="" itens_url="" builds_url="" ferramentas_url=""]

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
