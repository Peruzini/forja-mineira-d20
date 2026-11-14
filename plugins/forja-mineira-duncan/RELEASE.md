# Duncan, o Alto — release final v0.1.12 (14/11/2026)

**Status:** aprovado visualmente pelo responsável como build final; envio ao repositório autorizado. **Não significa publicação no WordPress**.

**ZIP canônico no Drive:** https://drive.google.com/file/d/1VBSkWkx67v3v8Ug0mzV1kLKB9TfKlH68/view

**Nome:** `forja-mineira-duncan-v0.1.12-FINAL.zip`  
**Tamanho:** 8.095.374 bytes  
**SHA-256:** `a876a970607e906b125d542a1964f63d4320f7c35318e0c606f8effaa5aedce3`  
**Shortcode:** `[forja_build_duncan]`  
**Regras:** D&D 5e 2024; progressão 1–20 de Guerreiro (Fighter), Mestre de Batalha (Battle Master).

## Alterações consolidadas

- v0.1.10: bloco lateral 18–20 reorganizado, cartões de atributos, espaçamento e eliminação dos trechos editoriais excedentes no nível 20.
- v0.1.11: seção Recursos dos níveis 18–20 igual ao layout do nível 16, preservando os valores de cada nível.
- v0.1.12: cartão Defesa/CA dos níveis 18–20 igual ao nível 16; CA=19 preservada; layout conferido em desktop e mobile.

## Fonte e integridade

O ZIP homologado é a referência da release. Para disponibilizar o código integral neste repositório sem exceder os limites de upload do conector, **dois arquivos maiores estão fragmentados byte a byte** em `source-parts/`. Isso NÃO cria versões diferentes do plugin. Após clonar, executar:

```bash
python plugins/forja-mineira-duncan/scripts/reconstruir.py
```

O comando recria `assets/css/duncan.css` e `templates/duncan.html` e confere seus hashes. Os demais arquivos são armazenados normalmente. Para instalar, preferir o ZIP oficial do Drive; não instalar checkout incompleto sem reconstruir os arquivos.

A nomenclatura interna `TESTE` em alguns arquivos e no cabeçalho foi mantida para preservar exatamente os bytes da v0.1.12 aprovada. O estado **FINAL APROVADO** é uma decisão de homologação, não uma modificação oculta do pacote.

## Publicação

Código/documentação sincronizados no GitHub. **WordPress não modificado**; instalar/publicar requer etapa separada de QA e autorização.
