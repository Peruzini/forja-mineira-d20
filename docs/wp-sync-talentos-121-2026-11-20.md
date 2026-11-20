# SYNC-02 — Guia de Talentos 1.2.1 (20/11/2026)

## Origem
- ZIP de produção **Forja_Mineira_Guia_Talentos_1.2.1_PRODUCAO_INSTALAVEL.zip** do Google Drive oficial Forja Mineira D20.
- URL original: https://drive.google.com/file/d/1ru_sRIrgTXKu1SSdun5ERWhLNXzLA_ME/view
- WordPress declarava `forja-mineira-guia-talentos` versão **1.2.1** como instalada/ativa em 20/11/2026.
- A leitura administrativa integral dos 21 arquivos da instalação **não foi concluída** devido ao limite diário do WPVibe: igualdade byte a byte *ZIP vs WordPress* **não afirmada**.

## Escopo da sincronização
- Conteúdo do ZIP oficial importado integralmente como `plugins/forja-mineira-guia-talentos/`: 21 entradas (PHP/CSS/JS, 15 WebP, changelog e readme).
- **21/21 hashes Git das entradas coincidem com os calculados do ZIP original**. Imagens de conteúdo duplicado mantêm seus caminhos e referenciam hashes idênticos.
- Integridade ZIP: `testzip()` sem erros; PHP `php -l` PASS em 2/2; `node --check` PASS em 1/1.
- Plugin é sincronizado **sem alterar o conteúdo ou a versão**, evitando mudança de vencedores, filtros e UX por esta sincronização.

## Gate pendente antes de merge
- Comparar a instalação WordPress com o pacote 1.2.1 por hash quando o acesso administrativo permitir; checar shortcode, dependências, catálogo, imagens e responsividade.
- Rever diff e executar CI/checks completos. Não instalar este ZIP em WordPress (já existe plugin ativo da versão).
- Resolver ajustes editoriais (título administrativo/H1) por outro bloco, sem alterações de conteúdo neste PR.
- Preservar a URL canônica `/melhores-talentos-para-bruxo-dnd-2024/`.

**Nenhum merge na `main` nem alteração no WordPress foi autorizado/executado por esta sincronização.**