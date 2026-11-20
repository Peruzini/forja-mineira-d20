# FWB-04C — Configuração administrativa e primeira autenticação real

Data: 20/11/2026.
Estado: código em PR draft; **primeira autenticação contra o domínio real ainda PENDENTE**, sem conta/segredos administrativos autorizados.
Base empilhada: PR #18 FWB-04B, dependente dos PRs #17, #16 e #15.
Branch: audit/fwb-04c-primeira-autenticacao-20261120.
**Produção não alterada.**

## 1. Fatos verificados

- WordPress público: /wp-json/ e /wp/v2/types retornaram HTTP 200, /wp/v2/users/me?context=edit anônimo retornou 401 e REST index anunciou Application Passwords (FWB-04B). Isso não autentica um usuário.
- WPVibe: somente domínio público conectado, cota 114/100, reset NÃO gasto.
- GitHub: PRs #15–#18 em draft, sem merge. Staging externo não confirmado.
- Conector GitHub disponível não possui ações para administrar environments, cadastrar secrets ou criar usuários WordPress. Nenhuma dessas alterações foi feita.

## 2. Segurança: separar conta de leitura e de escrita

**Leitura FWB-04C:** conta dedicada fwb-read (ou nome equivalente) com papel nativo Assinante / Subscriber; read=true, edit_posts ausente/false, publish_posts ausente/false. Senha de aplicação exclusiva, revogável, destinada apenas ao ambiente fwb-wp-read. O cliente exige introspecção da credencial por GET /wp/v2/users/me/application-passwords/introspect e NÃO imprime UUID ou dados da identidade.

**Escrita futura:** conta SEPARADA fwb-draft, papel Contribuidor / Contributor, edit_posts=true e publish_posts ausente/false. Nenhum segredo ou habilitação de escrita deve ser criado agora. Application Password herda as capacidades do usuário, não contém escopo granular só-leitura; por isso a conta inicial é Assinante.

## 3. Procedimento WordPress — exige sessão do proprietário

1. Acessar wp-admin > Usuários > Adicionar novo, criar fwb-read com e-mail controlado, papel Assinante e senha forte. Não promover a Editor/Administrador.
2. Entrar como fwb-read em outra sessão, abrir Usuários > Perfil > Senhas de aplicação (Application Passwords).
3. Criar senha chamada FWB GitHub Read e copiar DIRETAMENTE para o secret protegido GitHub. Nunca colar em ChatGPT, issue, PR, arquivo, log ou artefato.
4. Se Senhas de aplicação estiver indisponível, verificar HTTPS, políticas do host, WAF e plugins; NÃO usar senha principal do WordPress.

## 4. Procedimento GitHub — exige administrador

1. Abrir https://github.com/Peruzini/forja-mineira-d20/settings/environments
2. Criar environment fwb-wp-read. Configurar Required reviewers, Prevent self-review e restringir Deployment branches and tags à main, antes de armazenar segredos. Usar revisor confiável diferente de quem dispara o job.
3. Criar Environment secrets (não Repository secrets): FWB_WP_USERNAME = usuário Assinante; FWB_WP_APP_PASSWORD = senha revogável.
4. Sem revisor independente ou controle de branch, manter credenciais fora do GitHub e adiar teste remoto.
5. NÃO cadastrar secrets no fwb-wp-draft-write, NÃO configurar FWB_WRITE_ENABLED, NÃO habilitar FWB_ENABLE_DRAFT_WRITES em WordPress.

## 5. Primeira autenticação real (após review e merge autorizado)

1. Aprovar PRs #15 → #16 → #17 → #18 → #19 nesta ordem. Não realizar merge automático; aprovações separadas.
2. Após FWB-03 estar na main, abrir GitHub Actions > FWB-03 — WordPress REST integration (manual/gated) > Run workflow.
3. Branch main; mode=probe. Deixar os demais inputs em branco. Aprovar o job de leitura no ambiente fwb-wp-read.
4. O cliente executa APENAS dois GETs via HTTPS, em host fixo:
   - GET /wp-json/wp/v2/users/me?context=edit
   - GET /wp-json/wp/v2/users/me/application-passwords/introspect
5. Esperar log: FWB PROBE: conta somente leitura e Application Password confirmadas; permissões PASS; zero escrita.
6. Se HTTP 401/403, revisar conta, senha, Authorization encaminhado pela hospedagem, WAF/CDN. Não aumentar privilégios para passar.

Nenhum Bridge precisa estar instalado para executar os dois GETs oficiais.

## 6. Controles implementados no código

- Probe exige Assinante: read=true, sem edit_posts/publish_posts. Conta privilegiada falha.
- Endpoint oficial introspect comprova a Application Password sem registrar seu UUID.
- Rotas core de identidade aceitam GET apenas; POST/PUT/DELETE recusados no cliente.
- Futuro modo apply exige Contribuidor e Application Password próprios, além dos demais gates existentes.
- Teste em WordPress descartável prova as duas contas com capacidades separadas, e preserva política de zero publicação.
- Job probe restrito à main e não acessível por PR. Sem segredos novos.

## 7. Aceite e limites

- [ ] CI Python e WordPress descartável PASS.
- [ ] PR draft revisado, nenhum deploy.
- [ ] PENDENTE criar conta Assinante + senha de aplicação e environment protegido real.
- [ ] PENDENTE executar autenticação no domínio público por GitHub Actions após aprovações.
- [ ] Staging na Hostinger continua obrigatório antes de instalar o plugin ou habilitar qualquer escrita.
- [ ] Nenhum POST ao WordPress público; nenhuma operação WPVibe nem reset.

Resultado: código e laboratório em FWB-04C; autenticação real fica em HOLD até proteção, credenciais e autorização verificáveis.

Referências:
- https://developer.wordpress.org/rest-api/reference/application-passwords/
- https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
