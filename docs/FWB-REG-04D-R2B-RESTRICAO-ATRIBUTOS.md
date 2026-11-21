# FWB-REG-04D-R2B — Restrição de atributos de vínculo (21/11/2026)

**Estado: INTERFACE PRIVADA LAB PASS; perfil nativo Keycloak FAIL em experimento; staging real NO-GO.**

Base: PR #36 R2A, PR draft #37. Nenhum merge, deploy ou alteração no WordPress de produção.

## Decisão de segurança

O FGAP v2 do Keycloak 26.8.2 limita os **usuários elegíveis**, mas a permissão `manage` na Admin REST não oferece isoladamente ACL por atributo. Além disso, `PUT /admin/realms/{realm}/users/{id}` **substitui atributos personalizados**, podendo apagar campos não incluídos. Uma integração que envie apenas os novos campos sem verificar o estado atual não é segura.

Este bloco acrescenta uma interface **privada** (`mcp/fwb05-poc/reg04d-r2b/restricted-attributes.mjs`) que aceita exclusivamente:
- `attach(sub, siteId, connectionId)`: exige usuário permitido e perfil dedicado sem atributos personalizados fora de `fwb_site_id`/`fwb_connection_id`; nega vínculo existente.
- `detach(sub, siteId, connectionId)`: exige vínculo exato no Keycloak, remove apenas esses campos e verifica a remoção.
- Não exporta método para atualizar perfil arbitrário, papéis, grupos, clientes ou o realm. O corpo de atualização do Keycloak tem **somente** a propriedade `attributes` com as duas chaves permitidas, ou objeto vazio na revogação.
- Recusa perfis contendo qualquer atributo personalizado extra em vez de apagar esses dados, e recusa vínculo parcial, values malformados e usuário fora da allowlist privada.
- Após atualizar, verifica o vínculo e snapshots das propriedades principais do usuário. Falha fechada se detectar divergência; emissão de auditoria restrita a códigos fixos, sem token, usuário, email, conexão ou senha.
- Cada operação obtém token `client_credentials` curto pelo módulo R1; o Keycloak Admin aplica assinatura, audiência `kc-admin-api`, papéis e FGAP. O acesso à API deve ser **exclusivamente interno**, não via navegador ou MCP público.

A camada `makeVerifiedFieldRestrictedOnboarding` obriga entrada com **JWT Keycloak assinado**, escopo `sites:connect`, emissor/audiência válidos e sujeito do token na allowlist. O cliente não escolhe `sub`: o `connection_id` vem de `service.connect`, reusando o rollback e a revogação do REG-04C.

## Evidências auditadas

- [CI R2B #44920109611](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44920109611): **2 jobs success**, `npm test` com **69 descobertos, 67 PASS, 0 FAIL, 2 SKIP**, Next.js build PASS.
- Keycloak 26.8.2 real + FGAP V2, `client_credentials` e `kc-admin-api`, em CI descartável:
  - `REG04D_R2B_REAL_FOREIGN_USER_REFUSED_BEFORE_ADMIN_IO_PASS`
  - `REG04D_R2B_REAL_UNRELATED_ATTRIBUTE_NOT_OVERWRITTEN_PASS`
  - `REG04D_R2B_REAL_FIELD_ONLY_WRITES_AND_CORE_PROFILE_UNCHANGED_PASS`
  - `REG04D_R2B_REAL_ATTACH_DETACH_READBACK_PASS`
- Testes unitários exigem rejeição de JWT inválido/forjado, usuário externo, vínculo parcial, campos inválidos, perfil estranho, mutação inesperada do perfil, destino admin trocado e persistência sem escrita não autorizada.

## Limites que impedem homologação de produção

1. A restrição por campo é **da aplicação**. Um operador que extraia o token de serviço ou invoque diretamente a Admin REST pode usar permissões `manage` no usuário elegível para operações fora dos dois atributos. FGAP não é, por si, uma ACL de coluna. Só liberar staging após proteger a credencial e a Admin API atrás de ACL de rede privada e política Keycloak de atributos administrados, ou mecanismo equivalente validado.
2. Identidades com outros atributos personalizados são rejeitadas: solução segura para **realm/conta de teste dedicados**, não solução automática multi-tenant para usuários de Keycloak com atributos preexistentes.
3. GET seguido de PUT é read-modify-write e **não é transação**; alterações concorrentes entre as duas operações podem perder atualização. Um fluxo com mutação atômica ou mecanismo server-side precisará ser demonstrado para uso geral.
4. A comparação de perfil após atualizar detecta algumas alterações inesperadas, mas não reverte automaticamente mudanças já aplicadas. Se a escrita falhar depois do envio, registrar reconciliação manual; não fazer retry cego.
5. A interface não foi conectada a nenhum endpoint HTTP externo. O shell Vercel R2A continua respondendo 503 para MCP; não foi feito OAuth ChatGPT nem alteração no site real.
6. Configuração gerenciada nativa `unmanagedAttributePolicy=DISABLED` **FAIL em experimento**: o Keycloak 26.8.2 devolveu HTTP 400 `unknown_error` tanto ao adicionar os dois campos quanto ao testar a política `DISABLED` sem adicionar nenhum campo. Não houve fallback permissivo. Evidência: [CI #44920801631](https://github.com/Peruzini/forja-mineira-d20/actions/runs/44920801631), etapa nativa FAIL. O script exploratório permanece em `tests/fwb-reg04d-r2b/managed-profile-e2e.mjs` para análise futura, separado do gate da interface privada.

## Próximos gates

- **Nativo Keycloak:** confirmar esquema de dois atributos administráveis, `unmanagedAttributePolicy=DISABLED`, usuários sem permissão de edição dos vínculos; provar que um cliente com token de serviço não consegue persistir atributo não declarado.
- **Rede:** hospedar a interface privada junto do Keycloak, TLS interno, secret vault, segmentação e egress. Expor publicamente somente o MCP, nunca a Admin REST.
- **Concorrência e auditoria:** proteger transições simultâneas, adicionar auditoria vinculada a evento sem dados pessoais, testar reconciliação após timeouts.
- **R2C:** testar WordPress de staging, PostgreSQL TLS real, expiração de JWT e revogação da Application Password.
- **CIMD:** continuar NO-GO até corrigir o bug do parser do Keycloak e homologar autenticação real do ChatGPT.

Referência: [Keycloak — User Profile e política de atributos](https://www.keycloak.org/docs/26.8.0/server_admin/) e [Keycloak — partial update de atributos não suportado](https://www.keycloak.org/docs/26.2.5/upgrading/).
