=== Forja Mineira — Builds ===
Contributors: forjamineirad20
Tags: dnd, dungeons-and-dragons, build, warlock, rpg
Requires at least: 6.0
Tested up to: 7.1.5
Requires PHP: 7.4
Stable tag: 2.3.32
License: GPLv2 or later

Builds temáticas da Forja Mineira D20: Voldemort e Doutor Destino 1–20. Release estável 2.3.32, autorizada em DOOM-PROD-01. Dados históricos de revisão mantidos intactos; a autorização de produção é definida por data/doom-release.json e verificada contra seus hashes.


== 2.3.32-rc.1 — INTEGRAÇÃO B2 + HUB (CANDIDATO DE TESTE) ==
- Base do pacote: ZIP B2 enviado em 13/10/2026. Os módulos, dados, 20 templates e SEO da B2 foram preservados.
- Novo Hero Doutor Destino no Hub e card adicional; Voldemort permanece acessível.
- Mantida otimização CSS da Home 2.3.29-rc.1 (Home: home.css, Hub/Build: builds.css).
- O Hub descobre URL de página publicada com [forja_build nome="doutor-destino"] ou aceita doom_url explícita.
- Arquivos 11–20 são PROPOSTAS de revisão; o B2 os mostra somente em FMB_DOOM_REVIEW_MODE. NÃO libera para produção.
- Uso: [forja_builds_hub] e [forja_build nome="doutor-destino"] em páginas SEPARADAS.
- A instalação não cria página do Doutor Destino automaticamente e não publica a build de teste.
- Clusters: nenhum código alterado.

== 2.3.28 — PRODUÇÃO ==
- Hub de Builds aprovado visualmente no WordPress real e promovido para produção em 05/10/2026.
- Hub de Builds: reduz espaços verticais excessivos sem alterar Home ou Build Voldemort.
- Arte panorâmica do destaque ganha mais altura e enquadramento inferior para preservar “Tom Riddle” e o texto da composição.
- Remove do Hub o bloco editorial público “Próxima evolução / filtros”.
- Adiciona “Continue na Forja” com Guias, Ferramentas e Escolha a próxima Build.
- Usa ícones oficiais da Biblioteca, empacotados em WebP otimizado sem alteração visual: forja-bussola-institucional.webp, regras.webp e builds.webp.
- Divisor canônico: linha fina esquerda + dois losangos concêntricos no centro + linha fina direita, com fade somente nas extremidades externas.
- v2.3.27 passa a ser o rollback imediato.

== 2.3.27 — PRODUÇÃO ==
- Ajuste isolado na Home para alinhar o início dos títulos “Voldemort — Bruxo 1–20” e “Você consegue descobrir quem é?”.
- Em desktop/tablet, as duas áreas de imagem usam 390px e os dois blocos de texto começam pelo topo.
- Mobile não é alterado.
- Validada na Home real e promovida para produção em 04/10/2026.
- v2.3.26 permanece como rollback imediato.

== Instalação ==
1. No WordPress: Plugins > Adicionar plugin > Enviar plugin.
2. Para testes em staging, envie o ZIP 2.3.32-rc.1-B2-HUB. NÃO substitua a versão de produção sem homologação.
3. Se a versão anterior estiver instalada, use a opção do WordPress para substituir a versão atual pela enviada.
4. Ative o plugin.
5. Na página da build, use:
   [forja_build nome="voldemort"]

Para definir manualmente o link do botão "Guia da classe Bruxo":
   [forja_build nome="voldemort" guia_url="https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/"]

== Observações ==
- Os níveis com arte grande continuam sem a sidebar compacta.
- Os demais níveis usam a sidebar de atributos, defesa, magia, Arcanos Místicos e item desejável quando aplicável.
- A wishlist não altera automaticamente a ficha: ela representa o item que o personagem está procurando.
- O CSS é escopado por bloco para impedir conflitos entre os layouts dos diferentes níveis.
- A Build Voldemort expõe o slot estrutural `forja_d20_cluster_slot` no fechamento, com contexto `bruxo` / `voldemort`.
- Se o plugin Forja Mineira D20 — Clusters estiver desativado, a Build continua funcional e apenas o módulo de continuidade deixa de aparecer.

== Shortcodes ==
[forja_build nome="voldemort"]
[forja_builds_hub]

Shortcode da Home:
[forja_home_featured_build]

Shortcode do Hero da Home:
[forja_home_hero]

Shortcode do teaser da próxima build:
[forja_home_next_build]

Shortcode do bloco Build Atual + Próxima Build + Votação:
[forja_home_build_cycle]

Campos opcionais de imagem:
current_image=""
next_image=""
guts_image=""
duncan_image=""
trevor_image=""

Shortcode do Guia em Destaque da Home:
[forja_home_featured_guide]

URLs opcionais dos guias em destaque:
[forja_home_featured_guide guide_url="https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/" spells_url="..." invocations_url="..."]

Se spells_url não for informado, o plugin localiza automaticamente a página publicada com [forja_guia_magias_bruxo_2024].

Votação real:
- O voto da Home é registrado no WordPress via REST.
- O visitante não recebe as contagens parciais.
- A escolha é lembrada por localStorage + cookie.
- Administração: menu WordPress "Forja Mineira".
- O administrador pode abrir/encerrar a votação e iniciar uma nova rodada.


== DOCUMENTAÇÃO DESTA INTEGRAÇÃO ==
- Ver docs/FORJA_BUILDS_B2_HUB_DOOM_ESTADO_ATUAL_2026-10-13.md para escopo, rastreabilidade, restrições e gates.
- A mera presença dos arquivos nível 11–20 não os libera publicamente.
- As alterações de SEO do pacote B2 são preservadas, mas não há validação de indexação no Google nesta etapa.
