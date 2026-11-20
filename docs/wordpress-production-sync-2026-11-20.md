# FORJA-SYNC-20261120 — WordPress → GitHub (inventário de reconciliação)

**Data-base:** 20/11/2026, UTC (consulta autenticada somente de leitura).  
**Repositório:** \`Peruzini/forja-mineira-d20\`.  
**Política:** WordPress instalado é a referência do código efetivamente executado; GitHub \`main\` pode conter versões anteriores. Preservar versões homologadas, URL canônica, assets e rollback. Sem deploy WordPress ou merge automático.

## Resultado desta branch — Clusters

- **WordPress:** \`Forja Mineira D20 — Clusters\` **1.0.6-TESTE, ativa e homologada** (confirmação expressa do responsável em 16/10/2026). O sufixo \`TESTE\` faz parte do identificador da versão e **não** significa falta de homologação.
- **GitHub \`main\` anterior:** 1.0.5, que permanece preservado como referência de rollback. Artefato anterior também arquivado na Biblioteca em \`Projeto/Plugins/forja-mineira-clusters-v1.0.5-PRODUCAO.zip\`.
- **Fonte de recuperação:** ZIP homologado \`Projeto/Plugins/Testes/forja-mineira-clusters-v1.0.6-TESTE-Conjuradores-Doutor-Destino.zip\` (13/10/2026). O pacote passou na verificação de integridade ZIP e seus 9 arquivos PHP passaram em \`php -l\` local.
- **Arquivos reconciliados:** os 11 arquivos \`.php\`, \`.css\` e \`.txt\` do plugin na branch têm os hashes Git de conteúdo do ZIP homologado. Dez foram lidos da instalação WordPress (e conferidos contra o arquivo do ZIP). O \`includes/class-resolver.php\` foi recuperado do ZIP porque a leitura adicional esbarrou na cota do conector; seu hash Git confere com o ZIP. Os 5 arquivos WebP já presentes em \`main\` também têm hashes Git idênticos aos do ZIP. **Não foi feita uma comparação binária HTTP das imagens instaladas no WordPress nesta operação.**
- A origem instalada contém \`clusters/conjuradores.php\`, novas regras de Resolver/Renderer, CSS e README. Comentários históricos no README ainda chamam a versão de candidata; a classificação operacional correta é **homologada e ativa**, conforme a decisão datada.
- **Gate de promoção:** revisar diff do PR e executar regressão funcional (Bruxo, Conjuradores, cache, destinos draft/publish, HTML, sem links vazios) antes do merge. Não reinstalar a versão em WordPress: já está ativa.

## Demais divergências — ainda não sincronizadas por este PR

| Plugin / frente | WordPress ativo em 20/11 | GitHub \`main\` observado | Estado da reconciliação |
|---|---|---|---|
| Builds | 2.3.32-rc.1 | 2.3.28 | **Pendente:** obter árvore integral da instalação, templates Doom, assets, CSS e rollback; PR #6/#7 são candidatos antigos, não pacote completo atual |
| Guias / Hub | 1.2.6 | 1.2.4 | **Pendente:** fonte, assets, cadastro dinâmico de Talentos e rollback |
| Guia de Talentos | 1.2.1 | Caminho do plugin não localizado em \`main\` | **Pendente:** preservar ZIP exato, dados/catálogo, CSS/JS e imagens |
| Talentos UX Candidato | 1.1.2-ux-hero-r2-candidata | Não inventariado | Cópia isolada; não misturar com o plugin público |
| Itens para Conjuradores | 1.0.7 | Não inventariado | ZIP 1.0.7 e rollback 1.0.6 estão arquivados na Biblioteca; conferir correspondência com a instalação antes de subir |
| Radar D&D | 0.1.5-R5-CANDIDATO | Não inventariado | Plugin ativo; coletar fonte/QA e reconciliar sem alterar feed |
| Clusters de Notícias | 0.1.2-R5-CANDIDATO | Não inventariado | Plugin separado do Clusters principal; não fundir sem decisão |
| Home B3 Hotfix | 1.0.0 | Não inventariado | Preservar templates e chain de filtros do Builds |
| Home B4 Vencedor | 1.0.1 | Não inventariado | Preservar exibição Dunk/Egg e rollback por desativação |
| Correção da página inicial | 1.0.0 | Não inventariado | Verificar compatibilidade de \`template_include\` |
| Guia de Subclasses | 1.0.3 | Não inventariado | Plugin ativo; página editorial ainda \`draft\` na consulta |
| Guia de Invocações | 1.3.9-TESTE | 1.3.9 | Comparação de código pendente; não decidir pelo sufixo |
| Guia de Magias | 1.0.9 | 1.0.9 | Comparação de código pendente |
| Duncan | 0.1.12 | 0.1.12 | Versão equivalente declarada, comparação integral de hashes pendente; código final adicionado em commit de 14/11 |

Os plugins terceiros (Rank Math, LiteSpeed, Hostinger, etc.) não precisam ser incorporados ao repositório próprio.

## Restrições

- **Não promover para \`main\` sem revisão e testes.** Não atualizar números de versão em arquivos antigos como substituto do código efetivo.
- Não tocar no WordPress nem aplicar PRs #6–#10 automaticamente.
- Antes de sincronizar cada plugin restante: inventariar a árvore instalada, localizar ZIP/rollback, comparar hashes, capturar somente assets aprovados, testar lint e shortcodes, gerar PR independente e registrar resultados.
- **Conector WPVibe:** cota de leitura foi atingida durante esta reconciliação. Não consumir o reset de uso reservado sem solicitação expressa do responsável.

**Resultado atual:** uma sincronização de fonte completa **do Clusters** foi preparada nesta branch; a sincronização de **todos os demais plugins** não está concluída e não deve ser anunciada como concluída.
