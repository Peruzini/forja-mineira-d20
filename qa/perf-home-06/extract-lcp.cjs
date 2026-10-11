#!/usr/bin/env node
/*
 * PERF-HOME-06: read-only report extraction from the Lighthouse JSON.
 * It does not modify the site, install WordPress plugins, or change assets.
 */
const fs = require('node:fs');
const input = process.argv[2] || 'reports/perf-home-06-mobile.json';
if (!fs.existsSync(input)) throw new Error('Lighthouse JSON not found: ' + input);
const lhr = JSON.parse(fs.readFileSync(input, 'utf8'));
const audits = lhr.audits || {};
const metric = id => audits[id] ? {
  display: audits[id].displayValue || null,
  numeric: audits[id].numericValue ?? null
} : null;
function extractNode(x) {
  if (!x || typeof x !== 'object') return null;
  if (x.node && typeof x.node === 'object') return {
    snippet: x.node.snippet || null,
    selector: x.node.selector || null,
    nodeLabel: x.node.nodeLabel || null,
    path: x.node.path || null
  };
  return null;
}
const ids = [
  'largest-contentful-paint-element',
  'lcp-breakdown-insight',
  'lcp-discovery-insight',
  'render-blocking-resources',
  'render-blocking-insight',
  'server-response-time',
  'network-dependency-tree-insight',
  'font-display-insight'
];
function briefAudit(id) {
  const a = audits[id];
  if (!a) return {id, available: false};
  const items = a.details?.items || [];
  let nodes = [];
  function walk(value, depth = 0) {
    if (depth > 7 || !value || typeof value !== 'object' || nodes.length > 15) return;
    const node = extractNode(value);
    if (node) nodes.push(node);
    if (Array.isArray(value)) value.slice(0, 30).forEach(v => walk(v, depth+1));
    else for (const [key, v] of Object.entries(value)) {
      if (key !== 'node' && key !== 'debugData' && key !== 'criticalRequest' && typeof v === 'object') walk(v,depth+1);
    }
  }
  walk(items);
  return {
    id, available: true, title: a.title, display: a.displayValue || null,
    description: (a.description || '').slice(0, 400),
    nodes, items: JSON.parse(JSON.stringify(items.slice(0, 6))).map(v => {
      const s = JSON.stringify(v);
      return s.length > 2200 ? s.slice(0, 2200) + ' [truncated]' : v;
    })
  };
}
const requests = audits['network-requests']?.details?.items || [];
const resources = requests.filter(x =>
  /forja-mineira-builds|home-hero-castelo|pao-de-queijo|style\.css|complemento\.css|calculator\.css/i
  .test(x.url || '')
).map(x => ({
  url: x.url, resourceType: x.resourceType, transferSize: x.transferSize,
  resourceSize: x.resourceSize, startTime: x.startTime, endTime: x.endTime,
  duration: x.endTime != null && x.startTime != null ? x.endTime-x.startTime : null,
  statusCode: x.statusCode
}));
const report = {
  id: 'PERF-HOME-06',
  generatedAt: lhr.fetchTime || null, requestedUrl: lhr.requestedUrl || null,
  finalUrl: lhr.finalUrl || null,
  score: lhr.categories?.performance?.score ?? null,
  metrics: {
    fcp: metric('first-contentful-paint'),
    lcp: metric('largest-contentful-paint'),
    tbt: metric('total-blocking-time'),
    cls: metric('cumulative-layout-shift'),
    speedIndex: metric('speed-index'),
    ttfb: metric('server-response-time')
  },
  audits: ids.map(briefAudit),
  matchedResourceRequests: resources
};
const output = 'reports/perf-home-06-summary.json';
fs.mkdirSync('reports', {recursive: true});
fs.writeFileSync(output, JSON.stringify(report, null, 2));
const summary = [
  '# PERF-HOME-06 — Home mobile Lighthouse (diagnóstico, sem deploy)',
  'URL: ' + (report.finalUrl || 'indeterminada'),
  'Performance: ' + (report.score == null ? 'não medido' : Math.round(report.score*100) + '/100'),
  'LCP: ' + (report.metrics.lcp?.display || 'desconhecido'),
  'FCP: ' + (report.metrics.fcp?.display || 'desconhecido'),
  'TBT: ' + (report.metrics.tbt?.display || 'desconhecido'),
  'CLS: ' + (report.metrics.cls?.display || 'desconhecido'),
  '',
  'Auditorias LCP:',
  ...report.audits.filter(a=>a.id.includes('lcp') || a.id.includes('largest-contentful')).map(a=>
    '- ' + a.id + ': ' + (a.available ? 'presente' : 'ausente') +
    (a.nodes?.length ? ' node='+JSON.stringify(a.nodes[0]) : '')
  ),
  '',
  'Recursos relacionados:',
  ...resources.map(x=>'- '+x.url+' transferSize='+x.transferSize+' duration='+x.duration),
  '',
  'Relatório bruto e JSON resumido: artefatos desta run. Nenhuma alteração foi feita no WordPress.'
].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
