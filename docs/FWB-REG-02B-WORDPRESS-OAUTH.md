# FWB-REG-02B — Integração OAuth WordPress (somente staging)

**Data:** 21/11/2026 UTC · **Branch:** feature/fwb-reg-02b-wordpress-oauth-20261120 · **Base:** PR #26 · **Status:** integração em revisão, login real não homologado.

## Decisão

O caminho de menor custo é hospedar OAuth **no WordPress** com a biblioteca [wp-media/mcp-oauth](https://github.com/wp-media/mcp-oauth) GPL-2.0-or-later v2.0, junto com [WordPress MCP Adapter](https://github.com/WordPress/mcp-adapter). O servidor oferece OAuth/PKCE, consentimento, CIMD, revogação, token HS256 e a rota `/wp-json/mcp/mcp-oauth-server`. O usuário e permissões WordPress são verificados localmente, sem mandar Application Password para a Vercel.

**Não é login do MCP Vercel REG-02**: tokens HS256 cujo audience é o endpoint WordPress são incompatíveis com o gateway RS256 `/api/secure-mcp`. Sem integração real na Vercel e sem aplicação ChatGPT registrada, não afirmar operação no Chat normal.

## Incompatibilidade exata encontrada na versão v2.0

O ChatGPT publica `token_endpoint_auth_methods_supported: ["none","private_key_jwt"]` e o campo legado `token_endpoint_auth_method: "private_key_jwt"`. A biblioteca exige que o singular seja `none`; rejeita antes de gerar consentimento. O build aplica um patch **somente** em `CimdResolver.php` e `ClaudeClientVerifier.php` para negociar `none` se a lista plural realmente o incluir, mantendo verificação exata do `client_id` e sem aceitar clientes que ofereçam apenas `private_key_jwt`.

O patch é aplicado **somente ao vendor da compilação**, com detecção de versão incompatível e testes em PHP por reflexão nos métodos reais. Sem segredo, sem alteração de servidores e sem alterar o código do fornecedor em GitHub. A licença GPL original permanece no vendor do ZIP de teste.

## Plugin de testes

Diretório `plugins/forja-wp-oauth-stage/` (não instalado). Para habilitar OAuth: `FWB_REG02B_OAUTH_STAGING=true`, `FWB_REG02B_CIMD_COMPAT_PATCHED=true`, `WP_ENVIRONMENT_TYPE=staging` e URL da instância diferente do site de produção. O `FWB_REG02B_CHATGPT_CIMD_URL` deve ser **exatamente** o documento client ID do portal, como a URL estável `https://chatgpt.com/oauth/client.json` quando elegível. Não aceitar cliente genérico, não publicar senha, não ligar em produção.

Instalar também o MCP Adapter oficial no staging, pois a biblioteca WP Media v2.0 não o inclui. OAuth e o servidor default Basic devem ser expostos apenas no staging autorizado. Há três WordPress Abilities MCP: listar posts próprios, consultar post próprio, validar rascunho **sem escrita**. Todas checam permissões e ambiente. O plugin não publica nem altera conteúdos.

## Limitação de arquitetura para publicação

A publicação do aplicativo exige endpoint MCP **único e estável**. A rota MCP diretamente no WordPress é um protótipo útil para o proprietário e teste do OAuth, mas não atende automaticamente ao requisito de vários usuários conectarem seus próprios sites por um mesmo aplicativo. Isso exige gateway central, autorização de sites e proteção multi-tenant em outra etapa; não maquiar o piloto como pronto.

## Gates ainda fechados

- WordPress staging com HTTPS, MCP Adapter instalado e permissões controladas — **não existe ambiente homologado**.
- Endpoint de OAuth efetivamente acessível e fluxo Authorization Code PKCE S256 realizado com ChatGPT — **não comprovado**.
- Verificação de domínio do plugin e revisão OpenAI — **não realizadas**.
- Compatibilidade da biblioteca/patch testada em CI — **aguardar resultados**.
- Uso no Chat normal, WordPress produção e autorização de publicação — **bloqueados**.

## Fontes primárias

- https://developers.openai.com/plugins/build/auth
- https://github.com/wp-media/mcp-oauth
- https://packagist.org/packages/wp-media/mcp-oauth
- https://github.com/WordPress/mcp-adapter
- https://github.com/WordPress/mcp-adapter/blob/trunk/docs/guides/creating-abilities.md

## Resultado da integração de laboratório (CI validada)

- **GitHub Actions run:** https://github.com/Peruzini/forja-mineira-d20/actions/runs/44842368779 — **PASS**.
- Composer instalou `wp-media/mcp-oauth v2.0` e `wp-media/apply-filters-typed v1.2`.
- Lint do plugin e das classes PHP: **PASS**.
- Permissões simuladas de staging: **PASS**, incluindo bloqueio do domínio principal, autor diferente e tentativa de campo `status=publish`.
- Patch CIMD de interseção de métodos aplicado ao vendor: **PASS**; cinco verificações na implementação real, incluindo documentação ChatGPT com método singular `private_key_jwt` + lista plural `none`, rejeição de cliente que oferece só `private_key_jwt` e cliente ID divergente.
- ZIP compilado **somente para staging**: https://github.com/Peruzini/forja-mineira-d20/actions/runs/44842368779/artifacts/14681532130, com lib PHP e notices GPL. **NÃO instalar em produção.** O artifact expira automaticamente.

**Bloqueios que permanecem:** não houve WordPress real, servidor OAuth real, envio/recebimento de bearer token real, entrada no Chat normal, Vercel OAuth integrada ao WP, teste de callback da OpenAI nem publicação do plugin. O próximo teste deve usar WordPress descartável/staging, jamais o site público da Forja.
