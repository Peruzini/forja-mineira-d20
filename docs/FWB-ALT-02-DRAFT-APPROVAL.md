# FWB-ALT-02 - Primeiro rascunho com aprova��o

O ChatGPT continua autenticando no Auth0. O WordPress atribui o rascunho ao ID da conta j� existente da Forja. O gateway n�o recebe senha do WordPress nem assume a sess�o desse usu�rio.

## Prepara��o e ativa��o

Para disponibilizar s� a pr�via antes da etapa de escrita, use `FWB_ALT02_DRAFT_PREVIEW=enabled`. A pr�via exige uma lista Auth0 com um �nico sujeito permitido e o escopo `posts:read`. Ela n�o precisa de chave de assinatura, n�o anuncia `drafts:write` e n�o faz requisi��es ao WordPress. Depois do deploy, atualize as ferramentas na conex�o do ChatGPT.

1. Revise o PR e confirme separadamente a instala��o do plugin `plugins/forja-draft-approval/` e a concess�o de escrita no gateway. A rota � fechada por padr�o. Identifique o ID da conta autora no painel WordPress.
2. Configure `FWB_ALT02_SUBJECT` com o sujeito Auth0 j� autorizado. Conceda `drafts:write` apenas ao cliente ChatGPT, para acesso delegado. Gere um par RSA de 2048 bits exclusivo da opera��o. A chave privada PKCS#8 em PEM fica na vari�vel sens�vel `FWB_ALT02_SIGNING_KEY` no Vercel. O WordPress recebe apenas a chave p�blica PEM em `FWB_ALT02_PUBLIC_KEY`.
3. Envie t�tulo e conte�do em texto simples para `forja_wp_preview_draft` e confira os dois campos. Ap�s a aprova��o do propriet�rio, configure `FWB_ALT02_APPROVED_DIGEST` com o hash mostrado no gateway e no WordPress. No WordPress, inclua `FWB_ALT02_AUTHOR_ID` como inteiro, `FWB_ALT02_APPROVAL_EXPIRES` como timestamp Unix futuro e `FWB_ALT02_ENABLED` como booleano `true`. O arquivo opcional `approval.php` do plugin suporta esses valores p�blicos e deve ser montado fora do Git. Habilite `FWB_ALT02_DRAFTS=enabled` no gateway, atualize o cat�logo e reautorize a conex�o quando solicitado.
4. Chame `forja_wp_create_draft` uma vez, com o mesmo t�tulo e conte�do. Confirme o ID, o estado `draft` e a autoria no painel da Forja. O WordPress consome a aprova��o antes da grava��o. Se a resposta for incerta, confira o painel antes de emitir nova aprova��o. Ap�s a verifica��o, remova a aprova��o e desligue `FWB_ALT02_ENABLED`.

O primeiro corte tem aprova��o manual de uma opera��o por conte�do, uma rota fixa, uma chave revog�vel e v�nculo com um sujeito Auth0. Altera��es no texto exigem nova aprova��o. O endpoint aceita apenas t�tulo e conte�do, ignora sess�es administrativas e verifica o autor e o status ap�s a grava��o. A rota��o ou remo��o da chave desativa o acesso da integra��o.

## Valida��o

- Gateway: `npm test` e `npm run build` em `mcp/fwb05-poc`.
- WordPress: `php -l plugins/forja-draft-approval/forja-draft-approval.php` e `php plugins/forja-draft-approval/tests/approval-test.php`. O teste isolado substitui o banco e a API WordPress por stubs; o teste real depende da autoriza��o de ativa��o e cria��o.
