import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateEvidence, validateInputs, TARGET } from './oci-evidence.mjs';

const input = {
  tenancy: 'ocid1.tenancy.oc1..aaaa',
  compartment: 'ocid1.compartment.oc1..bbbb',
  region: 'sa-saopaulo-1',
  availabilityDomain: 'Qaaa:SA-SAOPAULO-1-AD-1',
  armImage: 'ocid1.image.oc1..cccc'
};
const evidence = () => ({
  regions: [{'region-name':'sa-saopaulo-1','is-home-region':true}],
  ads: [{name:input.availabilityDomain}],
  shapes: [{shape:'VM.Standard.A1.Flex'}],
  ocpu: {available:2},
  memory: {available:12}
});

test('P2 preflight accepts only real-shaped values and rejects injection', () => {
  assert.deepEqual(validateInputs(input), input);
  assert.throws(() => validateInputs({...input, region:'sa-saopaulo-1;oci iam user list'}));
  assert.throws(() => validateInputs({...input, availabilityDomain:'AD-1 && echo leaked'}));
  assert.throws(() => validateInputs({...input, armImage:'ocid1.image.oc1;rm -rf /'}));
  assert.throws(() => validateInputs({...input, tenancy:''}));
});

test('P2 accepts read-only evidence but NEVER grants apply', () => {
  const result = evaluateEvidence(input,evidence());
  assert.equal(result.status,'PRECHECK_PASS_MANUAL_REVIEW_REQUIRED');
  assert.equal(result.provisioned,false);
  assert.equal(result.terraformApplyAuthorized,false);
  assert.ok(result.unresolved.includes('EXPLICIT_APPLY_AUTHORIZATION_NOT_GIVEN'));
  assert.equal(TARGET.shape,'VM.Standard.A1.Flex');
  assert.equal(TARGET.bootGB,50);
});

test('P2 rejects wrong region, missing AD, insufficient A1 quotas and missing shape', () => {
  const cases = [
    {...evidence(), regions: [{'region-name':input.region, 'is-home-region':false}]},
    {...evidence(), ads: []},
    {...evidence(), shapes: [{shape:'VM.Standard.E4.Flex'}]},
    {...evidence(), ocpu: {available:1}},
    {...evidence(), memory: {available:11.9}},
    {...evidence(), memory: {}}
  ];
  for (const e of cases) {
    const d = evaluateEvidence(input,e);
    assert.equal(d.status,'NO_GO');
    assert.equal(d.terraformApplyAuthorized,false);
  }
});

test('P2 code only invokes OCI CLI read-only endpoints; never runs Terraform', () => {
  const source=readFileSync('infra/fwb-reg04d-r2b2-ops-p2/oci-readonly-preflight.mjs','utf8');
  for (const name of ['region-subscription','availability-domain','shape','resource-availability']) {
    assert.ok(source.includes("'" + name + "'"), 'expected read-only resource: '+name);
  }
  assert.doesNotMatch(source, /['"](?:launch|create|delete|update|terminate|apply|destroy)['"]/);
  assert.doesNotMatch(source, /shell:\s*true\s*,?\s*$/m);
  assert.match(source, /shell: process\.platform === 'win32'/);
  assert.match(source, /terraformApplyAuthorized:\s*false/);
});
