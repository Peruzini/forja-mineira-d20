# DOOM-PROD-01 — produção concluída

Data: 20/11/2026. Release estável: **2.3.32**. WordPress **7.1.5**, PHP **8.3.37**.

Página pública: https://forjamineirad20.com.br/doutor-destino-dnd-5e-build/
Página existente #351, shortcode `[forja_build nome="doutor-destino"]`; URL, canonical e robots index/follow preservados. Nenhuma edição da página foi necessária.

## Fonte, backup e implantação

Fonte obrigatória: ZIP completo DOOM-FINAL-01 rc.2 do Drive, ID `1LhzY-ByMGLFQPmrPIPUIG5b3r_yZycEE` (129 arquivos). O PR draft #13 não foi usado como substituto nem mesclado.

- SHA256 da fonte: `7ab14d1c926ee731ebb84a089a8033356b850fd27456ce0c5eadc79ad5c7be7f`.
- Backup integral do plugin instalado 2.3.32-rc.1: `backup-instalado-2.3.32-rc.1.zip`, 10.972.767 bytes, 125 arquivos, integridade ZIP validada e conteúdo extraído.
- SHA256 do backup: `8dda3aab525cf547e7567786bfcf0eed61589f5bc80d6ed1616e10233f36030f`.
- Release instalada: `forja-mineira-builds-v2.3.32-DOOM-PROD-01.zip`, 10.978.874 bytes.
- SHA256 da release: `609a1482c14a7a1985de43c62b76c76070d1f654525882c690f88f18ff50b53e`.
- Atualização normal pelo WordPress, substituindo o plugin existente, sem desinstalação. WordPress confirmou sucesso e lista a versão 2.3.32 ativa.
- LiteSpeed confirmou a limpeza de todas as entradas LSCache; não foi feita alteração de configuração de outros plugins.

Restauração disponível: enviar o ZIP de backup em Plugins > Adicionar plugin > Enviar plugin e substituir a versão atual; em caso de indisponibilidade do painel, restaurar somente a pasta `public_html/wp-content/plugins/forja-mineira-builds` pelo gerenciador Hostinger autenticado. O backup foi validado e extraído; não foi executado rollback em produção após o sucesso da atualização.

## Alterações

Integração dos dados homologados da fonte completa. Liberação pública dos níveis 11–20 pelo manifesto `data/doom-release.json`, com verificação de hashes das fontes e versão. `FMB_DOOM_REVIEW_MODE` continua disponível para revisão, sem ser requisito para a release pública. Contratos JSON históricos do candidato permanecem imutáveis, inclusive seus campos de teste; a autorização de produção está no novo manifesto e substitui o estado histórico para esta release.

Cabeçalho, constante de versão, readme e changelog atualizados. Metadescrição do Doom deixa de dizer que os níveis não foram publicados. Removidos rótulos operacionais de revisão dos templates finais; indicador de preparação do nível 13 corrigido para 15/15. Nenhuma nova arte foi gerada.

Níveis 1–9, assets aprovados, Hero, máscaras e banner panorâmico do nível 18 preservados. Revisões dos níveis 10 e 11 e escolhas dos níveis 13, 19 e 20 mantidas. Quebra-Feitiços e magias sempre preparadas preservados. Lança Psíquica de Raulothim permanece **LEGACY**, com autorização do Mestre. Configurações, votos e dados existentes não foram migrados nem reinicializados. Duncan permanece no plugin separado 0.1.12.

A relação exata de arquivos alterados em comparação com a instalação está em `release-manifest.json`.

## Evidências essenciais

- PHP 8.3.37, mesma versão do servidor: 41 arquivos PHP sem erros de sintaxe; 36 JSON válidos.
- Renderização do template com revisão desligada: níveis 1–20; sem avisos; contagens 15/15, 21/21 e 22/22; Legacy presente; nível 21 bloqueado. Revisão ligada também renderiza os 20 níveis.
- HTTP anônimo após limpeza de cache: página Doom retorna 200 e os 20 níveis no HTML; canonical preservado. Sem shortcode literal nem erro fatal.
- Navegação real de desktop pelos níveis 1, 10, 11, 13, 18, 19 e 20: dock e destino corretos; imagens desses níveis carregadas. Menu com 20 botões e 20 pares de navegação entre níveis.
- Celular 390 × 844: navegação anterior/próximo entre 19 e 20 funciona, máscara do nível 20 carregada, sem imagem visível quebrada e sem transbordamento horizontal (largura de documento 383 px).
- Console do Doom sem erros/avisos capturados.
- Home, Hub e Voldemort retornam 200 anonimamente; conteúdo, CSS e imagens visíveis também conferidos no navegador. Nenhum shortcode aparece como texto.

Evidências JSON anexas: `producao-http.json`, `niveis-desktop.json`, `celular.json` e `smoke-browser.json`. Capturas locais: `doom-n18-desktop.jpg` e `doom-n20-celular.jpg`.

## Observações de verificação

O teste móvel foi feito na sessão administrativa. Nela, o botão “Pergunte à IA” se sobrepõe ao atalho do dock; o responsável confirmou que esse botão existe somente no acesso de administração. A resposta HTTP anônima não contém “Pergunte à IA”, `wpadminbar` nem `hostinger-ai`. Portanto, a sobreposição observada não é registrada como bloqueio público. Os links anterior/próximo foram efetivamente testados entre os níveis 19 e 20.

Há linguagem histórica de proposta em trechos editoriais homologados; as escolhas e regras foram preservadas, sem reabrir revisão editorial.

O envio opcional de uma cópia extra do backup ao Drive foi rejeitado pela revisão automática por falta de autorização específica para transmitir essa cópia. O backup verificado permanece local, no diretório desta entrega. A restauração está disponível por esse ZIP; não depende do envio ao Drive.

## Registro oficial

ZIP final substituído no mesmo ID do Drive `1LhzY-ByMGLFQPmrPIPUIG5b3r_yZycEE`, com nome de produção e 10.978.874 bytes confirmados. A documentação consolidada usa o mesmo ID `11sBZ0i1XcM52Q1Vu6gkVvshxdQbvmgY8`, preservando abaixo o relatório histórico DOOM-FINAL-01.

Commit do código instalado: `42326136ce805e5aee83352025e93ab73b3ace2a`, enviado a `main`: https://github.com/Peruzini/forja-mineira-d20/commit/42326136ce805e5aee83352025e93ab73b3ace2a

A regra de atributos Git preserva os bytes do plugin, pois o manifesto valida SHA256 dos JSON. Todos os 131 arquivos do plugin no índice Git foram comparados byte a byte com a release instalada. Alteração preexistente no README do plugin de invocações ficou fora do commit; nenhum merge do PR #13 foi realizado.
