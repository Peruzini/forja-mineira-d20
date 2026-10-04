=== Forja Mineira D20 — Guia de Magias ===
Contributors: forjamineirad20
Requires at least: 6.0
Requires PHP: 7.4
Stable tag: 1.0.6
License: Proprietary / projeto Forja Mineira D20

Guia interativo das melhores Magias para Bruxo em D&D 5e 2024.

== Uso ==

1. Instale e ative o plugin.
2. Crie ou edite a página do Guia de Magias.
3. Insira o shortcode:

[forja_guia_magias_bruxo_2024]

URLs relacionadas podem ser sobrescritas:

[forja_guia_magias_bruxo_2024 items_url="..." build_url="..." guides_url="..."]

== Estrutura ==

- 94 magias auditadas.
- 91 Core 2024 + 3 Heroes of Faerûn.
- Filtros por Busca, Função, Escola, Fonte, Nível e Prioridade.
- Lista mestre + painel detalhado.
- Bottom sheets no mobile.
- Hero editorial.
- Continuidade estrutural fornecida pelo plugin Forja Mineira D20 — Clusters via hook desacoplado.

== Integração Cluster — 1.0.6 ==

O bloco manual antigo “Continue na Forja” foi substituído pelo slot:

do_action( 'forja_d20_cluster_slot', 'bruxo', 'magias' );

O shortcode principal do guia permanece:
[forja_guia_magias_bruxo_2024]

O shortcode manual de teste do Cluster NÃO deve permanecer na página:
[forja_cluster cluster="bruxo" atual="magias"]

Se o plugin Clusters estiver desativado, o Guia de Magias continua funcionando; apenas o módulo de continuidade deixa de aparecer.

== Produção 1.0.6 ==

- Integração nativa do Cluster aprovada em 04/10/2026.
- Um único módulo de continuidade na página.
- Sem autorreferência para Magias.
- Destinos: Invocações, Voldemort e Itens.
- Canonical preservada em /melhores-magias-para-bruxo-dd-5e-2024/.
- Rollback imediato: v1.0.5.
