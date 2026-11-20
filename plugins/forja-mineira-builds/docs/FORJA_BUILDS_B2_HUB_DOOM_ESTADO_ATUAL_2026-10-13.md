# FORJA MINEIRA D20 — BUILDS: B2 + HUB DO DOUTOR DESTINO

**Registro operacional / passagem de contexto**  
**Data:** 13/10/2026  
**Pacote candidato:** `forja-mineira-builds-v2.3.32-rc.1-B2-HUB-INTEGRADO-TESTE.zip`  
**Estado:** CANDIDATO DE TESTE. **Não homologado para produção**.

## 1. Objetivo e decisão visual aprovada

O Hub de Builds (`https://forjamineirad20.com.br/builds/`), renderizado pelo shortcode `[forja_builds_hub]`, deve destacar o **Doutor Destino (Doctor Doom)** no Hero e manter **Voldemort** como a outra build do catálogo. Não reconstruir a Home, o plugin Clusters ou o projeto do zero.

O Hero utiliza a arte panorâmica **cinco facetas / ascensão de Victor von Doom**, 1942 × 809 px, aprovada e arquivada em 13/10/2026. Dentro do plugin: `assets/images/doom-hub-panorama-cinco-facetas-aprovado.webp`. Textos, tags e botões são HTML/CSS (não rasterizados na imagem). O painel inclui: título **Doutor Destino**, subtítulo *A genialidade que une aço, magia e ambição.*, classes **Artífice (Artificer) 3 / Mago (Wizard) 17**, estilos Controle/Tecnomagia e CTA *Explorar build*. O catálogo apresenta as duas builds, sem filtros prematuros, e mantém **Continue na Forja**.

**Manifesto visual oficial:** [Doutor_Destino/manifest.md](https://drive.google.com/file/d/1E3Zj2PBIuunHCCdaAVBOLJcOMSpSO9oQ/view). 
**Imagem WebP arquivada:** [panorama das cinco facetas](https://drive.google.com/file/d/1DDd5Ld-Y3xE-eY-loAw8QLl_mWq41cQy/view). 
**PNG original arquivado:** [original das cinco facetas](https://drive.google.com/file/d/1kt1CJAMRnJu-jwBPX4vb2ohHh1ly9QQU/view).

## 2. Origem e rastreabilidade dos pacotes

- **Base fornecida pelo usuário:** `forja-mineira-builds-B2-WORDPRESS-TESTE-NAO-PRODUCAO(1).zip` (122 arquivos não diretórios). Essa base já incorpora a consolidação informada após ajustes de SEO, arquivos de progressão Doutor Destino dos níveis 1–20 e componentes da build Voldemort.
- **Integração criada:** `forja-mineira-builds-v2.3.32-rc.1-B2-HUB-INTEGRADO-TESTE.zip` (125 arquivos não diretórios; antes da adição deste relatório de documentação).
- **Comparação byte a byte:** nenhum dos 122 arquivos originais foi removido; três arquivos novos foram incluídos; somente cinco arquivos preexistentes foram alterados. Os demais 117 arquivos mantêm bytes idênticos.
- **Novos:** `assets/css/doom-hub.css`, `assets/css/home.css`, `assets/images/doom-hub-panorama-cinco-facetas-aprovado.webp`.
- **Modificados na integração:** `CHANGELOG.txt`, `forja-mineira-builds.php` (versão), `includes/class-build-shortcode.php` (roteamento do Hub e CSS Home), `readme.txt`, `templates/builds-hub.php`.
- **Ajustes SEO do B2:** preservados como base. Isso **não constitui auditoria SEO externa** e não significa que a indexação, canonical, robots e sitemap estejam validados em produção. O arquivo `includes/class-forja-builds.php` permanece idêntico ao original do B2.
- **CSS da Home:** preserva a otimização da linha `2.3.29-rc.1`, usando `home.css` na Home e `builds.css` em Builds/Hub; `doom-hub.css` é aplicado só ao Hub. Esse pacote não é homologação automática de PRs de performance em aberto.

## 3. Shortcodes e links

| Local | Shortcode / comportamento |
|---|---|
| Hub | `[forja_builds_hub]` |
| Hub com URL manual | `[forja_builds_hub doom_url="https://URL-CANONICA-VALIDADA/"]` — substituir pelo endereço real após confirmação; **não copiar URL de exemplo para produção** |
| Página individual Doutor Destino | `[forja_build nome="doutor-destino"]` |
| Página individual Voldemort | `[forja_build nome="voldemort"]` |
| Shortcodes da Home | `[forja_home_hero]`, `[forja_home_build_cycle]`, `[forja_home_featured_guide]` preservados |

A URL do Doutor Destino **não foi inventada**. O Hub tenta localizar página `publish` com o shortcode exato. Sem página válida nem `doom_url` informado, o CTA fica inativo. A instalação do ZIP **não cria nem publica** a página do Doutor Destino. A URL de Voldemort permanece `https://forjamineirad20.com.br/voldemort-dnd-5e-build-bruxo/`.

## 4. Conteúdo do Doutor Destino: presente versus liberado

O B2 contém templates e JSON da progressão editorial dos **níveis 1–20**, mas essa presença física **não equivale a liberação pública completa**. No comportamento de renderização identificado e testado no pacote:

- **Níveis 1–10:** disponíveis no caminho regular do template.
- **Níveis 11–20:** presentes como propostas e visíveis apenas sob `FMB_DOOM_REVIEW_MODE` no candidato B2; **não liberar silenciosamente**.
- A regra mecânica/editorial dos níveis pendentes precisa de homologação separada antes de promover o conteúdo público.
- **Clusters:** não modificar o plugin Clusters. A compatibilidade/slot de Voldemort preexistente foi mantida.

## 5. Testes realizados no candidato integrado

**Evidências locais da integração em 13/10/2026:**

- Verificação de sintaxe concluída para **39 arquivos PHP, 34 JSON e 3 JavaScript** (informada na entrega integrada).
- Renderização isolada dos shortcodes no ambiente de QA: Hub com duas builds; panorama encontrado; CSS do Hub e CSS compartilhado; comportamento do CTA sem e com página publicada; `doom_url` explícito; renderização de Doom níveis 1 e 10; nível 11 protegido; Voldemort renderiza; CSS dedicado Home preservado.
- Prévia de browser gerada nos tamanhos desktop e celular (`1440` e `390` px) e linkada abaixo.

**Limites da evidência:** são testes de pacote/renderização de QA, **não homologação real do WordPress/Hostinger nem validação de SEO pelo Google**. Permanecem necessários teste no staging, inspeção visual/crop, validação de URL canônica, cache, shortcodes e eventual correção de integração antes de produção.

**Preview:** [index.html](sandbox:/mnt/data/forja-builds-v2.3.32-B2-HUB-preview/index.html)  
**Capturas:** `hub-1440.png` e `hub-390.png` (evidências locais da entrega anterior).

## 6. Pendências e gates antes de produção

1. **Verificar página do Doutor Destino no WordPress:** confirmar `post_status`, URL canônica desejada, conteúdo, meta title/description e shortcode antes de tornar o CTA público.
2. **Homologar nível 11–20:** distinguir arquivos completos de liberação editorial/mecânica. Não depender de modo de revisão para público.
3. **Validar em staging:** desktop 1440, tablet 1024/768 e celular 390/320; inspecionar Hero, leitura do texto, recortes e cards, e ausência de rolagem horizontal.
4. **Regressão:** Home, Voldemort, votação, navegação, compatibilidade com Clusters e carregamento correto `home.css`/`builds.css`/`doom-hub.css`.
5. **SEO e publicação:** manter canônicas antigas; verificar canonical/noindex/robots, sitemap e Search Console depois da publicação. Não inventar slug ou promover página de teste.
6. **Governança de release:** obter aprovação no staging; identificar versão de produção, atualizar documentação e reter ZIP de rollback. Sem deploy do pacote `-TESTE` diretamente na produção.

## 7. Pendência SEO externa não confundida com o B2

O arquivo `PLANEJAMENTO DE PAGINAS.txt` anexado registra o **SEO-01 do Guia de Invocações** com links internos PASS e **sitemap ainda pendente**. Conferir no sitemap a nova URL `melhores-invocacoes-para-bruxo-dnd-2024` (esperado: 1) e a antiga `melhores-magias-para-bruxo-dd-5e-2024-2` (esperado: 0). Essa verificação **não foi executada por esta atualização documental** e não é dependência técnica específica do plugin B2/Hero.

## 8. Arquivos e fontes de verdade

1. Instruções do projeto Forja Mineira D20.
2. Biblioteca e manifestos aprovados, especialmente `Assets/02_Builds/Doutor_Destino/manifest.md` no Google Drive.
3. ZIP B2 fornecido pelo usuário em 13/10/2026, base de comparação.
4. ZIP integrado `2.3.32-rc.1`, candidato de teste, e respectivos QA e previews.
5. [GitHub de produção](https://github.com/Peruzini/forja-mineira-d20), que **não deve ser considerado atualizado por esta documentação** sem PR/merge e deploy confirmados.

**Próximo passo operacional recomendado:** instalar o candidato **somente em staging**, confirmar URL real da página do Doutor Destino, validar Hero/CTA e decidir formalmente a liberação editorial dos níveis 11–20. Somente depois preparar release de produção com documentação e rollback atualizados.
