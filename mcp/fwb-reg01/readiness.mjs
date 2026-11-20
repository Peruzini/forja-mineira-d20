/**
 * FWB-REG-01 — read-only submission preflight.
 * No network, credentials, publication, deployment or WordPress writes.
 * "evidence.json" is a manual attestation, never a substitute for live review.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CANDIDATE = resolve(HERE, '../fwb05-poc/chatgpt-plugin');
const SERVER_SOURCE = resolve(HERE, '../fwb05-poc/server.mjs');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
function check(id, passed, detail) {
  return { id, passed: Boolean(passed), detail };
}
function hasAnyWriteOrPrivateScope(auth) {
  return auth?.type === 'oauth' || auth?.type === 'mixed';
}
function validHttps(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(u.hostname)
      && !u.username && !u.password && !u.search && !u.hash;
  } catch {
    return false;
  }
}
export function evaluate({ plugin, mcp, evidence, source, packageFiles = [] }) {
  const ext = plugin?.extensions?.['com.openai'] ?? {};
  const ui = ext.interface ?? {};
  const entries = Object.entries(mcp?.mcpServers ?? {});
  const target = entries.length === 1 ? entries[0][1] : null;
  const auth = target?.extensions?.['com.openai']?.auth;
  const toolNames = [...source.matchAll(/registerTool\s*\(\s*['"]([^'"]+)['"]/g)].map(x => x[1]);
  const useful = toolNames.filter(name => !['forja_ping', 'forja_wp_public_status'].includes(name));
  const immutable = [
    check('ZIP_PORTABLE', plugin?.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'Raiz deve seguir schema Agent Plugins'),
    check('ONE_REMOTE_MCP', entries.length === 1 && target?.type === 'streamable-http' && validHttps(target?.url), 'Exatamente um servidor HTTPS público e estável'),
    check('NO_APP_REFERENCES', !existsSync(join(CANDIDATE, '.app.json')) && !ext.apps && !packageFiles.includes('.app.json'), 'ZIP público não pode conter app mappings ou hooks'),
    check('NO_STATIC_HEADERS', target && (!target.headers || Object.keys(target.headers).length === 0), 'Não colocar credenciais ou headers no pacote'),
    check('AUTH_METHOD', hasAnyWriteOrPrivateScope(auth), 'MCP publicado com dados privados/escrita exige OAuth; auth:none da PoC é insuficiente'),
    check('LISTING_METADATA', Boolean(ui.websiteURL && ui.privacyPolicyURL && ui.termsOfServiceURL && ui.supportURL), 'Política, termos e contato acessíveis exigidos'),
    check('REAL_FUNCTIONALITY', useful.length >= 2, 'Plugin de demonstração ping/status não pode ser submetido como produto completo')
  ];
  const required = [
    ['IDENTITY_VERIFIED', 'developerIdentityVerified', 'Identidade de desenvolvedor verificada no portal'],
    ['DOMAIN_VERIFIED', 'domainChallengeVerified', 'Desafio do domínio MCP respondido na origem correta'],
    ['AUTH_E2E_VERIFIED', 'oauthPKCEVerified', 'OAuth 2.1, PKCE e rotação/revogação homologados'],
    ['TENANT_ISOLATION', 'tenantIsolationAudited', 'Isolamento de sites, allowlist SSRF, auditoria e escopos'],
    ['WORDPRESS_PERSISTENCE', 'wpReadWriteVerified', 'Operações úteis em WordPress de teste, sem dados de produção'],
    ['PRIVACY_PUBLISHED', 'privacyAndTermsPublished', 'Política e termos publicados e verídicos'],
    ['REVIEWER_LOGIN', 'reviewerLoginVerified', 'Conta de teste com dados fictícios, sem MFA/código externo'],
    ['REVIEW_CASES', 'reviewCasesRun', 'Cinco testes positivos e três negativos efetivamente executados'],
    ['DEMO_RECORDING', 'demoRecordingReady', 'Vídeo de demonstração acessível para avaliadores'],
    ['DESKTOP_MOBILE', 'desktopMobileVerified', 'Experiência no ChatGPT desktop e mobile verificada'],
    ['NO_COST_CHANGE', 'zeroExtraCostRechecked', 'Revisão de despesas e quotas reais antes da publicação']
  ].map(([id, key, detail]) => check(id, evidence?.[key] === true, detail));
  const checks = [...immutable, ...required];
  return {
    status: checks.every(x => x.passed) ? 'READY_FOR_MANUAL_REVIEW' : 'BLOCKED',
    verifiedCount: checks.filter(x => x.passed).length,
    total: checks.length,
    blockers: checks.filter(x => !x.passed),
    checks,
    submissionAutomated: false,
    productionWritesEnabled: false
  };
}
export function evaluateCurrent() {
  return evaluate({
    plugin: loadJson(join(CANDIDATE, 'plugin.json')),
    mcp: loadJson(join(CANDIDATE, 'mcp.json')),
    evidence: loadJson(join(HERE, 'release-evidence.json')),
    source: readFileSync(SERVER_SOURCE, 'utf8')
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = evaluateCurrent();
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--release') && result.status !== 'READY_FOR_MANUAL_REVIEW') process.exitCode = 2;
  if (process.argv.includes('--assert-blocked') && result.status !== 'BLOCKED') process.exitCode = 3;
}
