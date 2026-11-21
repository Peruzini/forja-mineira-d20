// OCI P2: pure, unprivileged evidence evaluator. Never guesses paid-plan status.
export const TARGET = Object.freeze({ shape: 'VM.Standard.A1.Flex', ocpus: 2, memoryGB: 12, bootGB: 50 });

export function validateInputs(input) {
  const { tenancy, compartment, region, availabilityDomain, armImage } = input;
  if (!/^ocid1\.tenancy\.[a-z0-9.]+$/i.test(tenancy || '')) throw new Error('TENANCY_OCID_REQUIRED');
  if (!/^ocid1\.(compartment|tenancy)\.[a-z0-9.]+$/i.test(compartment || '')) throw new Error('COMPARTMENT_OCID_REQUIRED');
  if (!/^[a-z]{2}-[a-z-]+-[0-9]+$/.test(region || '')) throw new Error('REGION_REQUIRED');
  if (!/^[a-zA-Z0-9:._-]{5,120}$/.test(availabilityDomain || '')) throw new Error('AVAILABILITY_DOMAIN_REQUIRED');
  if (!/^ocid1\.image\.[a-z0-9.]+$/i.test(armImage || '')) throw new Error('ARM_IMAGE_OCID_REQUIRED');
  return { tenancy, compartment, region, availabilityDomain, armImage };
}

export function evaluateEvidence(input, evidence) {
  const checks = {
    home_region: Array.isArray(evidence.regions)
      && evidence.regions.some(r => r['region-name'] === input.region && r['is-home-region'] === true),
    availability_domain: Array.isArray(evidence.ads)
      && evidence.ads.some(a => a.name === input.availabilityDomain),
    arm_image_compatible: Array.isArray(evidence.shapes)
      && evidence.shapes.some(s => s.shape === TARGET.shape),
    a1_ocpu_limit_available: Number.isFinite(evidence.ocpu?.available)
      && evidence.ocpu.available >= TARGET.ocpus,
    a1_memory_limit_available: Number.isFinite(evidence.memory?.available)
      && evidence.memory.available >= TARGET.memoryGB
  };
  const allChecksPassed = Object.values(checks).every(Boolean);
  return {
    block: 'R2B2-OPS-P2',
    status: allChecksPassed ? 'PRECHECK_PASS_MANUAL_REVIEW_REQUIRED' : 'NO_GO',
    checks,
    target: TARGET,
    unresolved: [
      'ACCOUNT_TYPE_ALWAYS_FREE_ELIGIBILITY_NOT_VERIFIABLE_HERE',
      'TENANCY_WIDE_A1_USAGE_AND_STORAGE_MUST_BE_AUDITED',
      'IMAGE_ALWAYS_FREE_CONSOLE_LABEL_NOT_ATTESTED',
      'REGIONAL_PHYSICAL_HOST_CAPACITY_NOT_GUARANTEED',
      'BILLING_FORECAST_AND_TERRAFORM_PLAN_NOT_REVIEWED',
      'EXPLICIT_APPLY_AUTHORIZATION_NOT_GIVEN',
      'PERSISTENT_VAULT_TLS_BACKUP_AND_ADMIN_ISOLATION_NOT_PROVED'
    ],
    provisioned: false,
    terraformApplyAuthorized: false
  };
}
