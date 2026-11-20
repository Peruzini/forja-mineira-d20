# SPELL-05E — Adaptador e preview isolado
Este pacote é **somente uma proposta em branch**. Nenhum dado de `SPELL_Catalogo`, `SPELL_Versoes`, WordPress ou conteúdo aprovado foi alterado.

## Artefatos
- `plugins/forja-mineira-guia-magias/assets/js/spell-adapter.js`: API opt-in, sem chamadas HTTP, integrações com Google Sheets ou WordPress, preservando registros originais e rejeitando conteúdo fora do Core 2024.
- `qa/spell-05e/index.html`: prévia HTML autossuficiente com CSS/JS incorporados para revisão desktop/mobile. A cópia do adaptador no HTML está congelada neste pacote.
- `qa/spell-05e/adapter.test.cjs`: testes unitários por `node --test qa/spell-05e/adapter.test.cjs`.

## Escopo
Sete cenários: Sonho (Dream), Estática Sináptica (Synaptic Static), Caldeirão Borbulhante de Tasha (Tasha's Bubbling Cauldron), Polimorfia Verdadeira (True Polymorph) como dados do Guia editorial; Destruição Banidora (Banishing Smite), Conjurar Elemental (Conjure Elemental), Inseto Gigante (Giant Insect) como **fixtures isoladas, não adicionadas ao Guia de 94**.

## Separação entre teste e produção
O arquivo JS do Guia de Magias v1.0.9 continua com 94 registros e não foi modificado. O adaptador ainda não está carregado pelo shortcode. O `index.html` é **maquete interativa da conversão**, não execução do layout real do WordPress. Revisão estática do repositório confirmou 91 Core e 3 HoF preservados.

## Gates de promoção
1. Homologar visual real (DOM e PHP) em staging após planejar a inclusão controlada no shortcode.
2. Confirmar fonte normativa final para Drawmij e demais bloqueios do SPELL-05D.
3. Homologar schema de salvaguarda condicional, alcance e escalonamento antes de gravar base Core.
4. Não aplicar correções nem merge automaticamente; preservar URLs, shortcodes e os 94 itens.
5. A UX só será alterada em produção após aprovação da prévia e versão definitiva do plugin.

Base `main`: `6b2f0e36cb099c602eefbc5c99f6101cb2ee9fe6`.
