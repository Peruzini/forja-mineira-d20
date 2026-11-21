# FWB-REG-04D-R2B2-OPS-P2 — Verificação da conta OCI e provisionamento controlado

**Estado em 21/11/2026: READ-ONLY PRECHECK PREPARADO; PROVISIONAMENTO REAL NO-GO.**

Este bloco continua o [P1](../fwb-reg04d-r2b2-ops-p1/README.md) e preserva o candidato Terraform existente. Nenhuma conta OCI está conectada às ferramentas desta conversa. Portanto, não há evidência de tenancy, home region, disponibilidade de Ampere A1, cotas restantes, plano financeiro ou VM em execução.

## O que foi implementado

- `oci-evidence.mjs`: valida entradas e avalia evidências reais, sem conceder autorização de criação.
- `oci-readonly-preflight.mjs`: coleta **exclusivamente consultas OCI GET/LIST** a partir da OCI CLI já autenticada na **máquina do operador**, sem realizar chamadas CREATE/UPDATE/DELETE, Terraform plan/apply ou deploy.
- `oci-readonly-preflight.test.mjs`: casos unitários sintéticos para região errada, AD ausente, quota insuficiente, forma/imagem incompatível, valores inválidos e ausência de permissão automática de provisionamento.

Não criamos workflow GitHub Actions para P2. Testes executados **localmente** ou, se GitHub Actions for indispensável futuramente, apenas após configurar um runner self-hosted confiável. Não alterar os workflows P1/P2 preexistentes sem necessidade.

## Executar no Windows — somente após login OCI do operador

1. Acesse [Oracle Cloud Console](https://cloud.oracle.com/) com sua própria conta e confira **tipo de conta**, região inicial, uso/cotas e se a imagem aparece como **Always Free Eligible**. Não copie senha, token, chave privada, cartão ou arquivo da CLI para o ChatGPT/GitHub.
2. Instale/configure a [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm) no computador de confiança, com um perfil read-only IAM; confirme `oci --version`. O operador deve manter credenciais somente localmente.
3. Escolha um compartimento de staging autorizado, um AD e uma imagem Arm64 compatível no **home region**.
4. No PowerShell local, substitua os identificadores pela sua própria conta (não cole o bloco preenchido no chat):

```powershell
$env:FWB_P2_TENANCY_OCID = "ocid1.tenancy.oc1..PREENCHA_LOCALMENTE"
$env:FWB_P2_COMPARTMENT_OCID = "ocid1.compartment.oc1..PREENCHA_LOCALMENTE"
$env:FWB_P2_REGION = "sa-saopaulo-1" # exemplo, NAO presumir sua regiao inicial
$env:FWB_P2_AVAILABILITY_DOMAIN = "AD_REAL_DO_CONSOLE"
$env:FWB_P2_ARM_IMAGE_OCID = "ocid1.image.oc1..PREENCHA_LOCALMENTE"

node infra/fwb-reg04d-r2b2-ops-p2/oci-readonly-preflight.mjs
node --test infra/fwb-reg04d-r2b2-ops-p2/oci-readonly-preflight.test.mjs
```

É permitido usar um `FWB_P2_COMPARTMENT_OCID` da tenancy raiz somente se for aprovado explicitamente. Prefira compartimento dedicado para staging. A validação do script **não cria** recursos, **não lista** a configuração de autenticação nem exibe os OCIDs.

## Consultas externas exatas feitas pelo script

1. `oci iam region-subscription list --tenancy-id ...` → verifica `is-home-region=true` para região especificada.
2. `oci iam availability-domain list --compartment-id <tenancy>` → verifica que o AD existe.
3. `oci compute shape list --compartment-id ... --availability-domain ... --image-id ... --shape VM.Standard.A1.Flex` → verifica compatibilidade entre imagem específica e shape; não prova a etiqueta Always Free do Console.
4. `oci limits resource-availability get` de `compute/standard-a1-core-count` e `compute/standard-a1-memory-count` no AD/compartimento → exige no mínimo 2 OCPUs e 12 GB disponíveis segundo a API; **não prova** disponibilidade física de host, nem o uso combinado de cotas da tenancy.

Sem credenciais OCI ou sem permissão de leitura, o resultado é `NO_GO`. **Não usar dados sintéticos como evidência de capacidade real**. Nunca enviar `--debug`, `terraform.tfstate` ou arquivos `~/.oci` para canais públicos.

O resultado `PRECHECK_PASS_MANUAL_REVIEW_REQUIRED` ainda exige avaliação manual do plano financeiro. Ele **não** permite `terraform apply`.

## Gates manuais adicionais antes de criar VM

| Gate | Verificação obrigatória |
| --- | --- |
| A — Conta/cobrança | Conta Free Tier/Always Free elegível, **sem** upgrade PAYG nem uso de crédito trial para encobrir cobranças |
| B — Tenancy/AD | Home region real, AD com shape/imagem Always Free Eligible e disponibilidade prática |
| C — Uso global | Conferir **todas** as instâncias A1 e volumes existentes em todos os compartments relevantes; soma projetada dentro de **2 OCPUs/12 GB e 200 GB** |
| D — Plano Terraform | `terraform plan` com identidade de permissão mínima, estado remoto protegido/locking e inventário de recursos a criar; **revisão de custos detalhada e autorização separada** |
| E — Rede | Entrada OIDC 80/443 desligada, SSH restrito a /32 ou fechado, 8080/5432 fechados, IP público egress avaliados |
| F — Administração segura | Conta MFA, backup/restore, segredos em vault real, acesso interno ao Keycloak separado do ingresso público e conta de runtime SQL restrita |

O P1 mantém por padrão `provision_authorized=false`. Não fornecer um script `apply` automático. A OCI Resource Manager pode ser usada posteriormente para o estado do Terraform, após aprovação de configurações e custos.

## Critério de saída

- **P2 preparado:** preflight de leitura no repositório, sem alterações no ambiente externo.
- **P2 conta verificada:** somente após execução da CLI na conta real, evidências sanitizadas e confirmação manual dos gates A–C. Não afirmar esta condição sem dados.
- **P2 VM provisionada:** somente depois da revisão de plano e aprovação explícita para criar recursos. Ainda exigirá implantação privada R2B2-OPS e posterior R2C.
- **Estado atual:** `NO_GO` operacional. A CI de P1 já passou; nenhuma nova GitHub Actions hospedada foi usada neste bloco.

## Fontes oficiais consultadas

- [OCI Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI CLI: region-subscription list](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/iam/region-subscription/list.html)
- [OCI CLI: shape list](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/compute/shape/list.html)
- [OCI CLI: resource-availability get](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/limits/resource-availability/get.html)
