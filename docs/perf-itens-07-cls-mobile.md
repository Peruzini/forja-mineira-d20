# PERF-ITENS-07 — Diagnóstico e patch de CLS mobile

**Data da auditoria:** 07/11/2026  
**Site:** https://forjamineirad20.com.br/itens-magicos-conjuradores-dnd-2024/  
**Status:** patch documentado e testado localmente; **não aplicado em produção**.

## Contexto e causa

A página do Guia de Itens utiliza o plugin oficial **Forja Mineira D20 — Itens para Conjuradores v1.0.6**. Após a consolidação PERF-ITENS-06, o Lighthouse indicava mobile **79/100**, LCP **3,7 s**, CLS **0,218**, com desktop **97/100** e CLS **0**.

A investigação encontrou um mecanismo provável para o CLS no **tema WordPress** (versão 0.1.0), e não no plugin de Itens:

- O tema carrega `assets/navigation.js` no rodapé (`in_footer=true`).
- O CSS mobile só exibe o botão Menu pela regra `.js .menu-toggle` e esconde `.js .site-nav[hidden]` após a inicialização.
- O script adiciona a classe `js`, detecta `max-width: 600px` e então executa `nav.hidden = true`.
- Antes de essa rotina rodar, o menu pode ocupar espaço vertical; quando recolhe, a altura do cabeçalho diminui e desloca o Hero.

A reprodução local comprovou **esse mecanismo**, mas não é um rastreamento individual dos layout shifts no site público; portanto, não garante que seja a única causa do CLS real.

## Correção proposta

Patch cirúrgico de apenas **wp-content/themes/forja-mineira-d20/header.php**. O código adiciona, antes de `wp_head()`, CSS crítico e um script inline mínimo para aplicar a classe `fmd20-nav-early` antes da primeira pintura. No mobile (até 600 px), o botão aparece e `#menu-principal` inicia oculto enquanto `aria-expanded="false"`; o código existente de navegação continua responsável por abrir, fechar e sincronizar o menu.

**Sem JavaScript, o menu permanece visível e seus links continuam acessíveis.** Não são alterados `navigation.js`, `style.css`, plugins, shortcode ou permalinks.

## QA local no Chromium

O teste retardou artificialmente o script de navegação em 1,2 segundo e comparou o cabeçalho anterior com o corrigido, reaproveitando o HTML aprovado do guia 1.0.6.

| Viewport | Hero moveu antes | Hero com patch | CLS simulado antes | CLS simulado com patch |
|---|---:|---:|---:|---:|
| 360 px | -183 px | 0 px | 0,19841 | 0 |
| 390 px | -183 px | 0 px | 0,18960 | 0 |
| 600 px | -183 px | 0 px | 0,18327 | 0 |
| 601 px | 0 px | 0 px | 0 | 0 |
| 768 px | 0 px | 0 px | 0 | 0 |
| 1440 px | 0 px | 0 px | 0 | 0 |

Aprovados em ambiente local: clique para abrir/fechar; tecla Escape; fechamento ao escolher link; redimensionamento 390→850→390 px; navegação acessível sem JS; ausência de erros JS; sintaxe PHP. A logo da prévia é ilustrativa, não modificando o arquivo original.

## Arquivos neste repositório

- [Patch do header](../patches/perf-itens-07/header.php)
- [Cópia anterior para rollback](../patches/perf-itens-07/header.php.rollback)
- [Manifesto com hashes SHA-256](../patches/perf-itens-07/manifest.json)

A estrutura completa do tema **não está versionada neste repositório**; por isso, a mudança fica em `patches/`, não como um tema WordPress instalável. A cópia do rollback representa o arquivo visto na auditoria em 07/11/2026: antes de qualquer aplicação, compare novamente com o servidor para não sobrescrever alterações posteriores.

Documentação/evidências da Biblioteca:
- [Patch ZIP](https://drive.google.com/file/d/10l9cdukIcio0R1VrhJJ8_TdztE6IiGFe/view)
- [QA e prévia ZIP](https://drive.google.com/file/d/1RwUSBMo8M3xp-WFBE98MiVuO7PkuYH22/view)
- [Relatório completo](https://drive.google.com/file/d/1E1ifwXtnJMzgfH9cyoF7mvb8JPlM36Gf/view)

## Publicação controlada e reversão

1. **Não mesclar nem publicar sem validação da versão atual do header em hospedagem.** O plugin Itens 1.0.6 permanece intacto.
2. Obter backup recuperável do tema; confirmar que o arquivo atual corresponde ao hash original no manifesto.
3. Aplicar apenas as linhas novas ao `header.php`, preferencialmente via fluxo de deploy controlado. Este material **não é um ZIP de instalação pelo WordPress**.
4. Limpar LiteSpeed; testar menu em 360/390/600/768/1440 px, com e sem JS, e PageSpeed mobile/desktop.
5. Confirmar CLS real e ausência de regressões antes de declarar homologação.
6. Em regressão, restaurar `header.php.rollback` (somente se corresponder ao backup real pré-deploy), limpar cache e repetir teste.

**Estado verificado no momento deste registro:** patch pronto, produção não alterada; Lighthouse público pós-patch pendente.
