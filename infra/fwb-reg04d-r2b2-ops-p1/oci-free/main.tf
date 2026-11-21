terraform {
  required_version = ">= 1.7.0, < 2.0.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "= 7.26.1"
    }
  }
}

# Authentication is supplied by OCI Resource Manager or the operator's local
# OCI SDK configuration. No API key, token, private key or password in Git.
provider "oci" {
  region = var.oci_region
}

variable "provision_authorized" {
  description = "Must be explicitly enabled only after reviewing the actual OCI tenancy, limits and plan. NEVER set in CI."
  type        = bool
  default     = false
}

variable "oci_region" {
  description = "OCI HOME region. Must match home_region exactly; never deploy Always Free outside it."
  type        = string
}

variable "home_region" {
  description = "Independently verified tenancy home region."
  type        = string
}

variable "compartment_ocid" {
  description = "Dedicated staging compartment OCID (or tenancy OCID if expressly approved)."
  type        = string
  validation {
    condition     = can(regex("^ocid1\\.(compartment|tenancy)\\.", var.compartment_ocid))
    error_message = "OCI compartment/tenancy OCID is required."
  }
}

variable "availability_domain" {
  description = "Exact availability domain from the authenticated OCI console."
  type        = string
  validation {
    condition     = length(trimspace(var.availability_domain)) > 3
    error_message = "A real availability domain is required."
  }
}

variable "arm_image_ocid" {
  description = "Operator-selected ARM64 Ubuntu/Oracle Linux image verified 'Always Free Eligible' in the HOME region."
  type        = string
  validation {
    condition     = can(regex("^ocid1\\.image\\.", var.arm_image_ocid))
    error_message = "A validated OCI platform image OCID is required."
  }
}

variable "ssh_public_key" {
  description = "SSH PUBLIC key only. Never upload a private key to Terraform state or Git."
  type        = string
  sensitive   = true
  validation {
    condition     = can(regex("^ssh-(ed25519|rsa) [A-Za-z0-9+/=]+( .*)?$", var.ssh_public_key))
    error_message = "An SSH PUBLIC key is required."
  }
}

variable "ssh_allow_cidr" {
  description = "Optional administrator IPv4 /32 address; blank means no SSH ingress. Never use 0.0.0.0/0."
  type        = string
  default     = ""
  validation {
    condition     = var.ssh_allow_cidr == "" || (can(cidrhost(var.ssh_allow_cidr, 0)) && endswith(var.ssh_allow_cidr, "/32"))
    error_message = "SSH allowlist must be empty or exactly one IPv4 /32."
  }
}

variable "enable_public_oidc" {
  description = "False until Caddy allowlist, realm, DNS, public TLS, audits, vault and probes are configured."
  type        = bool
  default     = false
}

# Hard stop for 'terraform plan' and 'terraform apply' before account review.
# OCI instances are NOT created by terraform validate in CI.
resource "terraform_data" "manual_approval_gate" {
  lifecycle {
    precondition {
      condition     = var.provision_authorized && var.oci_region == var.home_region
      error_message = "NO-GO: explicit provisioning authorization and verified OCI HOME region required."
    }
  }
}

locals {
  # Exactly one ARM VM; no paid database, load balancer or other compute shape.
  shape                 = "VM.Standard.A1.Flex"
  ocpus                 = 2
  memory_gb             = 12
  boot_volume_gb        = 50
  instance_display_name = "fwb-r2b2-stage-private"
}

resource "oci_core_vcn" "stage" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.93.0.0/16"]
  display_name   = "fwb-stage-vcn"
  dns_label      = "fwbstage"
  depends_on     = [terraform_data.manual_approval_gate]
}

resource "oci_core_internet_gateway" "stage" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.stage.id
  display_name   = "fwb-stage-igw"
  enabled        = true
}

resource "oci_core_route_table" "stage" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.stage.id
  display_name   = "fwb-stage-public-egress"
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.stage.id
  }
}

# Do not inherit OCI default security list (which may allow SSH).
# This security list has NO ingress/egress rules. NSG below is the sole
# network policy for the VM's public interface.
resource "oci_core_security_list" "subnet_deny" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.stage.id
  display_name   = "fwb-stage-empty-security-list"
}

resource "oci_core_subnet" "stage" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.stage.id
  cidr_block          = "10.93.10.0/24"
  display_name        = "fwb-stage-vm-subnet"
  dns_label           = "fwbvm"
  route_table_id      = oci_core_route_table.stage.id
  security_list_ids   = [oci_core_security_list.subnet_deny.id]
  prohibit_public_ip_on_vnic = false
}

resource "oci_core_network_security_group" "stage" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.stage.id
  display_name   = "fwb-stage-deny-default"
}

# Public 80/443 remain CLOSED by default. Do not enable before OIDC
# allowlist+real HTTPS+independent external denial tests are ready.
resource "oci_core_network_security_group_security_rule" "oidc_public" {
  for_each                  = var.enable_public_oidc ? toset(["80", "443"]) : toset([])
  network_security_group_id = oci_core_network_security_group.stage.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  tcp_options {
    destination_port_range {
      min = tonumber(each.value)
      max = tonumber(each.value)
    }
  }
}

# SSH is prohibited by default. If a temporary /32 is explicitly supplied,
# the operator must also enforce an OS firewall, MFA IAM and key rotation.
resource "oci_core_network_security_group_security_rule" "ssh" {
  count                     = var.ssh_allow_cidr == "" ? 0 : 1
  network_security_group_id = oci_core_network_security_group.stage.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = var.ssh_allow_cidr
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }
}

# Minimum outbound web ports for image updates/ACME; not a replacement for
# application-level egress pinning / DNS rebinding protections in R1.
resource "oci_core_network_security_group_security_rule" "web_egress" {
  for_each                  = toset(["80", "443"])
  network_security_group_id = oci_core_network_security_group.stage.id
  direction                 = "EGRESS"
  protocol                  = "6"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
  tcp_options {
    destination_port_range {
      min = tonumber(each.value)
      max = tonumber(each.value)
    }
  }
}

resource "oci_core_network_security_group_security_rule" "dns_egress" {
  network_security_group_id = oci_core_network_security_group.stage.id
  direction                 = "EGRESS"
  protocol                  = "17"
  destination               = "169.254.169.254/32"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
  udp_options {
    destination_port_range {
      min = 53
      max = 53
    }
  }
}

resource "oci_core_instance" "stage" {
  compartment_id      = var.compartment_ocid
  availability_domain = var.availability_domain
  display_name        = local.instance_display_name
  shape               = local.shape

  shape_config {
    ocpus         = local.ocpus
    memory_in_gbs = local.memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = var.arm_image_ocid
    boot_volume_size_in_gbs = local.boot_volume_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.stage.id
    assign_public_ip = true
    nsg_ids          = [oci_core_network_security_group.stage.id]
    display_name     = "fwb-stage-vnic"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
  }

  # There is no cloud-init that downloads/installs Keycloak automatically:
  # release is separate, needs a real secret manager and operator approval.
  freeform_tags = {
    project = "fwb-r2b2-ops-p1"
    scope   = "nonproduction"
    billing = "always-free-eligible-review-required"
  }

  lifecycle {
    prevent_destroy = true
  }
}

output "staging_vcn_ocid" {
  value = oci_core_vcn.stage.id
}

output "staging_nsg_ocid" {
  value = oci_core_network_security_group.stage.id
}

output "staging_public_ipv4" {
  value       = oci_core_instance.stage.public_ip
  description = "No inbound ports by default. Not a published service."
}
