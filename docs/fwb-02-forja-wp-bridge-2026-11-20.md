# FWB-02 — Forja WP Bridge v0.1.0

**Estado:** implementação em branch isolada, candidata para revisão; **NÃO INSTALADA**; sem merge/deploy.
**Repositório:** Peruzini/forja-mineira-d20
**Base:** main, commit 6b2f0e36cb099c602eefbc5c99f6101cb2ee9fe6
**Branch:** feature/fwb-02-forja-wp-bridge-20261120

## Escopo implementado

1. Novo plugin de integração separado de Builds/Guias/Clusters e do tema.
2. Rotas REST autenticadas para status, validação, leitura de rascunho, simulação de criação e edição.
3. Escrita de rascunhos implementada mas **desabilitada por padrão** com FWB_ENABLE_DRAFT_WRITES.
4. Payload allowlist: title, content, excerpt, slug, dry_run; update real exige expected_modified_gmt.
5. Nenhuma rota para publicação, páginas, alteração SEO, mídia, plugins, tema ou administração.
6. Testes offline de validação e workflow de lint + pacote ZIP; não contém deploy.

## Requisitos de segurança antes de ativar

- NÃO habilitar FWB_ENABLE_DRAFT_WRITES em produção no FWB-02.
- Confirmar versão e integridade dos arquivos realmente instalados; existem divergências entre WordPress e main (ARQ-01B).
- Criar conta técnica WordPress com privilégios mínimos, preferencialmente sem publish_posts, e Application Password somente via HTTPS.
- Guardar credenciais em secrets de ambiente protegido, nunca em branch ou artefato.
- Adicionar idempotência, rastreamento persistente e dupla aprovação em FWB-03 antes de uso automatizado real.
- Testar as permissões, 401/403, versões concorrentes, HTML Gutenberg, draft, cache e Rank Math em staging no FWB-04.
- WPVibe permanece conectado; não consumir reset de cota. Produção sem alterações.

## Gates

- [ ] PHP lint e testes offline aprovados no GitHub Actions.
- [ ] Revisão de diff e segurança no PR draft.
- [ ] Verificar ZIP gerado e ausência de segredos.
- [ ] Homologar staging e aprovação de instalação (FWB-04).

A aprovação do PR de código não equivale à aprovação para instalação, ativação ou publicação.
