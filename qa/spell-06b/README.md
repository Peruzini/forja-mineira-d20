# SPELL-06B — Exportação determinística (prévia, sem publicação)

## Dependência e isolamento
Branch empilhada em `feature/spell-05e-adapter-preview-20261120`; PR deste bloco deve ter **essa branch como base**. O adaptador `spell-adapter.js` do SPELL-05E não é substituído nem carregado no WordPress. A branch-base está divergente da main; reconciliar antes de eventual promoção, sem merge automático.

## Entradas
Um snapshot **explicitamente fornecido** em JSON, com chaves `SPELL_Catalogo`, `SPELL_Versoes`, `SPELL_Classes`, `SPELL_Acessos`, `SPELL_Fontes`. Cada chave aceita objetos com os cabeçalhos exatos da planilha ou matriz [cabeçalhos, ...linhas]. A ferramenta não usa credenciais nem consulta a API do Sheets. Toda leitura da origem, a escolha do snapshot, a verificação de proveniência e sua aprovação são etapas externas.

```sh
node --test qa/spell-06b/exporter.test.cjs
node qa/spell-06b/exporter.cjs /caminho/snapshot.json /caminho/saida
```

## Saídas
- `spells-core-2024.preview.json`: Core XPHB (esperado: 391 identidades, 391 versões), com links de classe/subclasse, fontes e campos mecânicos parseados sem converter para texto editorial.
- `manifest.json`: SHA-256 e tamanho em bytes **do arquivo exportado**, formato e contagens. Sem relógio, UUID aleatório ou posição de linha.
- Ordenação por ID, serialização determinística e bloqueio de IDs normativamente pendentes.

## Gates e limites
- `publicationAllowed=false` SEMPRE; as magias são `REVIEW_REQUIRED` e bloqueios informados recebem `BLOCKED`. O bloqueio padrão de `MAG-0063` é um exemplo do caso Sonho, **não uma enumeração definitiva de pendências**. Forneça todos os IDs bloqueados a partir do QA antes de exportações reais. Drawmij também está pendente; não considerar ausência de bloqueio automático como liberação.
- Não seleciona 94 cards, não substitui Core/HoF do plugin, não altera traduções, não interpreta regras/erratas, não homologa campos e não escreve no Sheets/GitHub/WordPress.
- Uso de bibliotecas nativas Node; sem GETs de fontes externas. `expectedCoreCount=391` no CLI. Os testes usam 2 registros sintéticos exclusivamente por fixture.
- Erros de integridade falham fechados; relações não-Core são excluídas por filtro, não importadas como Core. Repetições de linhas de classes são permitidas; cada `accessId` é único.
- Não usar os arquivos como base normativa até homologação do contrato/QA e prévia real de WordPress.

## Próximo bloco
SPELL-06C: integrar exportação de teste ao adaptador **somente em preview**, com validação de equivalência editorial e testes WordPress adiados por limite do plugin.
