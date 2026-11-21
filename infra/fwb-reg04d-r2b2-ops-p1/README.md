# FWB-REG-04D-R2B2-OPS-P1 — Provedor e infraestrutura privada de staging

**Seleção: Oracle Cloud Infrastructure (OCI), somente recursos Always Free elegíveis.**
**Estado: Terraform candidato no GitHub; conta OCI não conectada e nenhuma VM/VCN criada. LAB/CI somente, OPS NO-GO.**
**Não realizar compras, upgrade para PAYG ou utilização de recursos sujeitos a cobrança sem aprovação independente.**

## Decisão de provedor — 21/11/2026

A infraestrutura disponível verificada é Vercel UR-25 Hobby, com o shell `forja-wp-bridge-staging-r2a`. Esse shell é adequado para a borda HTTPS/MCP, mas não fornece, no projeto inspecionado, uma máquina Linux de longa duração para Keycloak, PostgreSQL, acesso administrativo interno e recuperação de estado. Não foi encontrada uma conta OCI conectada; a presente entrega **não prova posse de conta, quota ou capacidade disponível**.

A Oracle documenta no Always Free **1.500 OCPU-h e 9.000 GB-h por mês** de Ampere A1, equivalentes a **2 OCPUs/12 GB RAM** continuadamente, além de **200 GB** de volumes de inicialização/bloco no **home region** da tenancy e até 5 backups de volume. O candidato usa apenas **uma instância ARM A1 Flex com 2 OCPUs, 12 GB RAM e volume 50 GB**. Essa quantidade ocupa toda a quota gratuita A1 de uma tenancy não utilizada; se houver outros recursos A1, a implantação deve ser negada. Não usa DB gerenciada, load balancer pago, NAT, IP reservado nem volume adicional. A quota e preço são **requisitos a verificar na conta real**; Terraform sozinho não garante custo zero.

Fontes oficiais:
- [OCI Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [Oracle Cloud Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)
- [OCI Resource Manager, Terraform](https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/resource-manager-and-terraform.htm)
- [OCI Terraform oci_core_instance](https://docs.oracle.com/en-us/iaas/tools/terraform-provider-oci/latest/docs/r/core_instance.html)

**Restrições operacionais:** cadastro pode exigir cartão com retenção temporária de verificação; ausência de SLA de Always Free; shapes A1 podem estar sem capacidade na região; Oracle pode recuperar instâncias ociosas. Isso é **staging**, não produção nem solução HA. Se não houver elegibilidade/capacidade, encerrar como NO-GO; **não** substituir automaticamente por VM ou região paga.

## Arquitetura candidata

```text
Cliente ChatGPT (futuro R3) ---> Vercel staging MCP shell (ainda 503)
                                          |
                         apenas OIDC/JWKS públicos (futuro)
                                          v
                              DNS HTTPS próprio de staging
                                          |
                                     OCI NSG
                            80/443 NEGADOS por padrão
                                          |
                                  VM A1 Arm 2/12
                 +------------------------+--------------------+
                 | Caddy allowlist realm  |                  |
                 |   /realms/fwb_stage/*  |                  |
                 +-----------+------------+                  |
                             | rede auth-restricted           |
                          Keycloak 26.8.2                     |
                             | rede admin-private             |
                       PostgreSQL do Keycloak                 |
                             |                                |
                          Worker R2B2 privado (a integrar)    |
                             |                                |
                       journal PostgreSQL privado            |
                 +--------------------------------------------+
                  admin/master/8080/5432 NUNCA publicados
```

A OCI VCN isola o tráfego na interface da VM por Network Security Group, com subnet ligada a uma security list **sem regras**. O Keycloak, seu banco e journal **ainda dependem de deploy separado e aprovação de vault e TLS** na VM; serão isolados também pelas redes internas Docker do R2B2-OPS. Uma VM de uma única interface pública não equivale a segregação multi-host ou rede privada criptografada ponta a ponta; R2C exige testes de bloqueio a partir de fora e auditoria interna real.

## Arquivos

- `oci-free/main.tf`: recursos OCI e parâmetros necessários, sem credenciais; versão de provider fixada.
- `validate-oci.test.mjs`: negativa de tipos de recurso não autorizados, shape/cota fora do limite, portas públicas sem gate, auto provisionamento.
- `.github/workflows/fwb-reg04d-r2b2-ops-p1-oci.yml`: instala provider, `terraform validate`, testes estáticos. **Não** recebe OCI credentials, não executa `plan`, `apply`, upload de estado, terraform destroy ou deploy.

## Travamentos obrigatórios antes de qualquer `apply`

1. A conta deve ser **do operador**, criada legitimamente e com MFA. Não registrar nova conta, cartão ou consentir em termos em nome do operador; nunca colocar credenciais OCI em chat, PR, log ou Git.
2. Confirmar a tenancy `Free Tier / Always Free`, o **home region**, o compartment dedicado, A1 Arm com **pelo menos 2 OCPUs/12 GB livres**, 50 GB de boot livre e disponibilidade de capacidade. Para recursos Always Free em OCI, o home region precisa coincidir; `oci_region` e `home_region` têm gate de igualdade.
3. Conferir que a imagem OCI Arm escolhida é marcada **Always Free Eligible** no console. Não fornecer OCID falso ou copiar imagem de outra região.
4. Configurar API de autenticação via OCI Resource Manager/IAM ou credenciais locais protegidas, com principal de privilégios mínimos e ambiente separado. Nenhum segredo em Terraform `tfvars`. O `ssh_public_key` é somente a chave **pública**.
5. Executar `terraform init -backend=false` para validação local ou criar stack no OCI Resource Manager para estado privado e locking. Com `provision_authorized=false` (default), um `plan`/ `apply` deve **falhar fechado** por precondição; nenhuma conta é provisionada por este repositório.
6. Apresentar um plano revisado por humano, conferindo **1 A1/2 OCPU/12 GB/50 GB** e VCN, subnet, IGW, route, security list e NSG. Não permitir recursos, addons ou taxa que não sejam comprovadamente gratuitos. Só então obter aprovação explícita e alterar `provision_authorized=true` **em variável externa ao Git**, não no código.
7. Porta 22 só pode ser aberta provisoriamente para um IP IPv4 **/32** autorizado; default `ssh_allow_cidr=""`, sem entrada SSH. Os 80/443 só podem ser habilitados após DNS, Caddy e credenciais terem sido homologados; default `enable_public_oidc=false`.
8. Ao ativar a VM, não presumir que `FWB_PUBLIC_BIND_IP` no Compose seja o IP público OCI: na VM o bind deve apontar para o **IPv4 privado da VNIC** ou interface local revisada. A OCI associa o IP público via NAT à VNIC.
9. Keycloak, PostgreSQL e Worker precisam ser instalados depois por um procedimento controlado de deploy: host firewall, mTLS/TLS conforme fronteira de confiança, um vault real, permissões SQL mínimas, backups e restore testado. `docker compose --profile candidate up` **não está autorizado por esta etapa**.
10. Executar probes do R2B2-OPS de **fora e de dentro** da rede, incluindo negativas públicas para `/admin`, `/realms/master`, 5432, 8080, auditoria, bloqueio após crash e revalidação do realm nativo. Só então abrir R2C.

## Parâmetros necessários em execução autenticada (não preencher Git)

| Variável Terraform | Condição obrigatória |
| --- | --- |
| `oci_region`, `home_region` | Iguais, região inicial da tenancy |
| `compartment_ocid` | Compartimento staging dedicado e aprovado |
| `availability_domain` | Domínio real com capacidade A1 |
| `arm_image_ocid` | Imagem Arm64 Always Free Eligible, na região correta |
| `ssh_public_key` | Somente chave pública |
| `ssh_allow_cidr` | Vazio por padrão, ou IPv4 /32 temporário |
| `enable_public_oidc` | `false` até TLS/DNS/segredos/probes aprovados |
| `provision_authorized` | `false` até revisão do plano e aprovação do usuário |

## Gate de saída do P1

- **Provider selected:** OCI Always Free como candidato aprovado tecnicamente sob condição de elegibilidade.
- **Infraestrutura codificada:** Terraform e testes no GitHub; CI de laboratório deve passar.
- **Provisionamento real:** PENDENTE. Só será GO após conta OCI autenticada, limites do home region confirmados, plano sem gastos e aprovação de criação de recursos.
- **R2B2-OPS full / R2C / ChatGPT normal:** NO-GO até Keycloak, worker, vault e Postgres realmente isolados com TLS, ACL e auditoria, além da correção CIMD do Keycloak.

Não transferir recursos de produção. Não fazer merge automático nem assumir que um `apply` gratuito fornece SLA ou aptidão de produção.
