=== Forja Mineira — Builds ===
Contributors: forjamineirad20
Tags: dnd, dungeons-and-dragons, build, warlock, rpg
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 2.3.22
License: GPLv2 or later

Build completa 1–20 para o Forja Mineira D20.

== Instalação ==
1. No WordPress: Plugins > Adicionar plugin > Enviar plugin.
2. Envie o ZIP forja-mineira-builds-v2.3.22.zip.
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

URL do guia em destaque:
[forja_home_featured_guide guide_url="https://forjamineirad20.com.br/melhores-itens-para-bruxo-dnd-5e/"]

Votação real:
- O voto da Home é registrado no WordPress via REST.
- O visitante não recebe as contagens parciais.
- A escolha é lembrada por localStorage + cookie.
- Administração: menu WordPress "Forja Mineira".
- O administrador pode abrir/encerrar a votação e iniciar uma nova rodada.
