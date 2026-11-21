#!/usr/bin/env node
// READ-ONLY OCI CLI preflight. No plan/apply, VM creation, write operations,
// secrets or raw account data printed. Execute only on operator's own machine.
import { spawnSync } from 'node:child_process';
import { validateInputs, evaluateEvidence } from './oci-evidence.mjs';

const config = {
  tenancy: process.env.FWB_P2_TENANCY_OCID,
  compartment: process.env.FWB_P2_COMPARTMENT_OCID,
  region: process.env.FWB_P2_REGION,
  availabilityDomain: process.env.FWB_P2_AVAILABILITY_DOMAIN,
  armImage: process.env.FWB_P2_ARM_IMAGE_OCID
};

function ociJson(args, region) {
  // Arguments are selected from a hard-coded read-only command table below
  // and inputs validated before executing. No credentials in command line.
  const bin = process.env.FWB_P2_OCI_BIN || 'oci';
  if (!/^(oci|oci\.exe|oci\.cmd)$/i.test(bin)) throw new Error('CLI_BIN_NOT_ALLOWED');
  const result = spawnSync(bin, [...args, '--region', region, '--output', 'json', '--no-retry'], {
    encoding: 'utf8',
    timeout: 35000,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
    shell: process.platform === 'win32'
  });
  if (result.error || result.status !== 0) {
    // Never relay raw CLI stderr: it may include account IDs or request metadata.
    throw new Error('OCI_CLI_READ_FAILED');
  }
  const body = JSON.parse(result.stdout || '{}');
  if (!body || typeof body !== 'object' || !Array.isArray(body.data) && !body.data) {
    throw new Error('OCI_CLI_INVALID_JSON_DATA');
  }
  return body.data;
}

let status = 2;
try {
  const input = validateInputs(config);
  // All commands below are GET/LIST. No OCI API mutate/create calls.
  const regions = ociJson(
    ['iam', 'region-subscription', 'list', '--tenancy-id', input.tenancy], input.region
  );
  // Fail early if this is not the home region.
  if (!Array.isArray(regions) || !regions.some(
    r => r['region-name'] === input.region && r['is-home-region'] === true
  )) throw new Error('HOME_REGION_NOT_VERIFIED');
  const ads = ociJson(
    ['iam', 'availability-domain', 'list', '--compartment-id', input.tenancy], input.region
  );
  if (!Array.isArray(ads) || !ads.some(a => a.name === input.availabilityDomain)) {
    throw new Error('AD_NOT_VERIFIED');
  }
  const shapes = ociJson(
    ['compute', 'shape', 'list',
      '--compartment-id', input.compartment,
      '--availability-domain', input.availabilityDomain,
      '--image-id', input.armImage,
      '--shape', 'VM.Standard.A1.Flex', '--all'], input.region
  );
  const ocpu = ociJson(
    ['limits', 'resource-availability', 'get',
      '--compartment-id', input.compartment,
      '--availability-domain', input.availabilityDomain,
      '--service-name', 'compute',
      '--limit-name', 'standard-a1-core-count'], input.region
  );
  const memory = ociJson(
    ['limits', 'resource-availability', 'get',
      '--compartment-id', input.compartment,
      '--availability-domain', input.availabilityDomain,
      '--service-name', 'compute',
      '--limit-name', 'standard-a1-memory-count'], input.region
  );
  const decision = evaluateEvidence(input, {regions, ads, shapes, ocpu, memory});
  // Output contains only fixed gate names, booleans and planned shape specs.
  console.log(JSON.stringify(decision, null, 2));
  status = decision.status.startsWith('PRECHECK_PASS_') ? 0 : 2;
} catch (error) {
  console.log(JSON.stringify({
    block: 'R2B2-OPS-P2',
    status: 'NO_GO',
    reasonCode: String(error.message).match(/^[A-Z0-9_]+$/) ? error.message : 'UNEXPECTED_READ_FAILURE',
    provisioned: false,
    terraformApplyAuthorized: false
  }, null, 2));
}
process.exitCode = status;
