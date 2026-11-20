import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, evaluateCurrent } from './readiness.mjs';

const manifest = {
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  extensions: { 'com.openai': { interface: {
    websiteURL:'https://example.org', privacyPolicyURL:'https://example.org/privacy',
    termsOfServiceURL:'https://example.org/terms', supportURL:'https://example.org/support'
  } } }
};
const goodServer = { mcpServers: { service: {
  type: 'streamable-http', url: 'https://mcp.example.org/api/mcp',
  extensions: { 'com.openai': { auth: { type: 'oauth' } } }
} } };
const twoTools = "registerTool('read_posts' registerTool('create_draft'";

test('existing production PoC is blocked and does not pretend it is submission-ready', () => {
  const result = evaluateCurrent();
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.submissionAutomated, false);
  assert.equal(result.productionWritesEnabled, false);
  assert.ok(result.blockers.some(x => x.id === 'AUTH_METHOD'));
  assert.ok(result.blockers.some(x => x.id === 'REAL_FUNCTIONALITY'));
});
test('anonymous MCP cannot pass publication even with all attestations', () => {
  const server = structuredClone(goodServer);
  server.mcpServers.service.extensions['com.openai'].auth.type = 'none';
  const allEvidence = Object.fromEntries([
    'developerIdentityVerified','domainChallengeVerified','oauthPKCEVerified',
    'tenantIsolationAudited','wpReadWriteVerified','privacyAndTermsPublished',
    'reviewerLoginVerified','reviewCasesRun','demoRecordingReady',
    'desktopMobileVerified','zeroExtraCostRechecked'
  ].map(x => [x,true]));
  const result = evaluate({ plugin:manifest, mcp:server, evidence:allEvidence, source:twoTools });
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.blockers.some(x => x.id === 'AUTH_METHOD'));
});
test('non-HTTPS MCP, embedded credentials and app references are blocked', () => {
  const server = structuredClone(goodServer);
  server.mcpServers.service.url='http://localhost:3000/api/mcp';
  server.mcpServers.service.headers={ Authorization:'Bearer SECRET_EXAMPLE' };
  const result = evaluate({ plugin:manifest, mcp:server, evidence:{}, source:twoTools, packageFiles:['.app.json'] });
  for (const id of ['ONE_REMOTE_MCP','NO_STATIC_HEADERS','NO_APP_REFERENCES']) {
    assert.ok(result.blockers.some(x => x.id === id), id);
  }
});
test('empty evidence never yields approval', () => {
  const result=evaluate({plugin:manifest, mcp:goodServer, evidence:{}, source:twoTools});
  assert.equal(result.status,'BLOCKED');
  assert.equal(result.blockers.filter(x=>x.id==='REVIEW_CASES').length,1);
});
