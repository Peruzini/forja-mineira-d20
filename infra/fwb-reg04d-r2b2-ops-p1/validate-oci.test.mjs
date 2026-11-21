import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tf=readFileSync('infra/fwb-reg04d-r2b2-ops-p1/oci-free/main.tf','utf8');
const resources=[...tf.matchAll(/resource\s+"([^"]+)"\s+"([^"]+)"/g)].map(x=>x[1]);
const allow=new Set([
 'terraform_data',
 'oci_core_vcn',
 'oci_core_internet_gateway',
 'oci_core_route_table',
 'oci_core_security_list',
 'oci_core_subnet',
 'oci_core_network_security_group',
 'oci_core_network_security_group_security_rule',
 'oci_core_instance'
]);

test('R2B2 OPS-P1 creates only one Always Free eligible Arm compute shape',()=>{
 assert.equal(resources.filter(x=>x==='oci_core_instance').length,1);
 assert.ok(resources.every(x=>allow.has(x)), 'paid/unknown OCI resource is forbidden');
 assert.match(tf,/shape\s*=\s*"VM\.Standard\.A1\.Flex"/);
 assert.match(tf,/ocpus\s*=\s*2\b/);
 assert.match(tf,/memory_gb\s*=\s*12\b/);
 assert.match(tf,/boot_volume_gb\s*=\s*50\b/);
 assert.doesNotMatch(tf,/resource\s+"(oci_database_|oci_load_balancer_|oci_core_nat_gateway|oci_core_volume|oci_objectstorage_)/);
 console.log('REG04D_R2B2_OPS_P1_ALWAYS_FREE_RESOURCE_ALLOWLIST_PASS');
});

test('operator approval, home region and live image selection required before plan/apply',()=>{
 assert.match(tf,/variable\s+"provision_authorized"\s*\{[\s\S]*?default\s*=\s*false/);
 assert.match(tf,/condition\s*=\s*var\.provision_authorized\s*&&\s*var\.oci_region\s*==\s*var\.home_region/);
 assert.match(tf,/depends_on\s*=\s*\[terraform_data\.manual_approval_gate\]/);
 assert.match(tf,/source_id\s*=\s*var\.arm_image_ocid/);
 assert.match(tf,/prevent_destroy\s*=\s*true/);
 assert.match(tf,/ssh_authorized_keys\s*=\s*var\.ssh_public_key/);
 assert.doesNotMatch(tf,/resource\s+"oci_identity_/);
 console.log('REG04D_R2B2_OPS_P1_MANUAL_APPROVAL_GATE_PASS');
});

test('all public ports off by default and no default VCN security list',()=>{
 assert.match(tf,/variable\s+"enable_public_oidc"\s*\{[\s\S]*?default\s*=\s*false/);
 assert.match(tf,/for_each\s*=\s*var\.enable_public_oidc\s*\?/);
 assert.match(tf,/variable\s+"ssh_allow_cidr"\s*\{[\s\S]*?default\s*=\s*""/);
 assert.match(tf,/for_each\s*=\s*toset\(\["80", "443"\]\)/);
 assert.match(tf,/security_list_ids\s*=\s*\[oci_core_security_list\.subnet_deny\.id\]/);
 assert.match(tf,/nsg_ids\s*=\s*\[oci_core_network_security_group\.stage\.id\]/);
 assert.doesNotMatch(tf,/\b(8080|5432|8443):/);
 console.log('REG04D_R2B2_OPS_P1_PUBLIC_PORTS_DENY_BY_DEFAULT_PASS');
});

test('no credentials or implicit apply in committed OCI files',()=>{
 assert.doesNotMatch(tf,/private_key\s*=|fingerprint\s*=|user_ocid\s*=|password\s*=|token\s*=/i);
 assert.doesNotMatch(tf,/local-exec|remote-exec|user_data|cloud-init/);
 assert.doesNotMatch(tf,/oci_core_instance\.stage\.private_ip/);
});
