'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '../..');
const GUIDE = 'plugins/forja-mineira-guia-magias/';
const JS = path.join(ROOT, GUIDE, 'assets/js/guide-spells.js');
const CSS = path.join(ROOT, GUIDE, 'assets/css/guide-spells.css');
const TEMPLATE = path.join(ROOT, GUIDE, 'templates/guide-spells.php');
const PLUGIN = path.join(ROOT, GUIDE, 'forja-mineira-guia-magias.php');
const src = fs.readFileSync(JS, 'utf8');
const css = fs.readFileSync(CSS, 'utf8');
const php = fs.readFileSync(TEMPLATE, 'utf8');
const plugin = fs.readFileSync(PLUGIN, 'utf8');
const editorial = require('../spell-06c/editorial-fixture.js');
const exportFixture = require('../spell-06c/demo-export.js');
const bridge = require('../spell-06c/preview-bridge.js');
const adapter = require('../../plugins/forja-mineira-guia-magias/assets/js/spell-adapter.js');

function blobSha(content) {
  return crypto.createHash('sha1').update('blob ' + Buffer.byteLength(content) + '\0' + content).digest('hex');
}
class FakeElement {
  constructor(tag='div') {
    this.tagName = tag;
    this.dataset = {};
    this.children = [];
    this._html = '';
    this.outerHTML = '';
    this.value = '';
    this.textContent = '';
    this.listeners = {};
    this._classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(n => this._classes.add(n)),
      remove: (...names) => names.forEach(n => this._classes.delete(n)),
      contains: n => this._classes.has(n),
      toggle: (n, force) => {
        const next = force === undefined ? !this._classes.has(n) : Boolean(force);
        if (next) this._classes.add(n);
        else this._classes.delete(n);
        return next;
      }
    };
  }
  set innerHTML(html) { this._html = String(html); this.children = []; this._rows = []; }
  get innerHTML() { return this._html; }
  appendChild(node) { this.children.push(node); return node; }
  querySelectorAll(selector) {
    if (selector !== '.spell-row') return [];
    this._rows = [...this._html.matchAll(/<button class="spell-row [^"]*" data-id="([^"]+)"/g)]
      .map(m => { const button = new FakeElement('button'); button.dataset.id = m[1]; return button; });
    return this._rows;
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  trigger(name, value) {
    if (value !== undefined) this.value = value;
    assert.equal(typeof this.listeners[name], 'function', 'missing listener for ' + name);
    this.listeners[name]({ target: this });
  }
}
function harness(mobile=false) {
  const nodes = new Map();
  const closers = [new FakeElement('button'), new FakeElement('button')];
  const document = {
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, new FakeElement()); return nodes.get(id); },
    createElement(tag) { return new FakeElement(tag); },
    querySelectorAll(query) { return query === '[data-close]' ? closers : []; }
  };
  const window = { matchMedia: query => ({ matches: mobile && query === '(max-width:820px)' }) };
  const context = vm.createContext({ document, window });
  vm.runInContext(src, context, { filename: 'guide-spells.js', timeout: 5000 });
  const evalJs = expression => vm.runInContext(expression, context);
  return { get: document.getElementById, closers, evalJs, spells: evalJs('SPELLS'), filters: evalJs('FILTERS'), state: evalJs('state'), run: expression => evalJs(expression) };
}
function clickPill(h, id, value) {
  const el = h.get(id).children.find(c => c.dataset.value === value);
  assert.ok(el, 'missing pill ' + id + ':' + value);
  assert.equal(typeof el.onclick, 'function');
  el.onclick();
}
function rows(h) { return h.get('fmmg-spellList')._rows || []; }
function renderNames(h) { return rows(h).map(b => b.dataset.id); }
function json(x) { return JSON.parse(JSON.stringify(x)); }

test('hashes: actual 1.0.9 production assets unchanged vs reference audited on 20/11/2026', () => {
  assert.equal(blobSha(src), '6892a172aa4d847f294fba1f0c6431d6121008a8');
  assert.equal(blobSha(css), 'ee2adc87acd707e68d77ce326cb36193056143df');
  assert.equal(blobSha(php), '0e1df4280f0448c475e15d13155811250e007ec0');
  assert.equal(blobSha(plugin), 'b29a7d99dcff198987e6d2f9966fcbd21c26edfc');
});

test('identity, order, source mix and unchanged 94-card editorial fixture', () => {
  const h = harness(), spells = json(h.spells);
  assert.equal(spells.length, 94);
  assert.equal(new Set(spells.map(s => s.id)).size, 94);
  assert.equal(spells.filter(s => s.tagFonte === 'Core 2024').length, 91);
  assert.equal(spells.filter(s => s.tagFonte === 'HoF').length, 3);
  const fields=['id','nomePt','nomeEn','nivel','tagFonte','grupo','prioridadeN','classificacao',
    'alcance','conjuracao','duracao','componentes','escalonamento','material','funcao1'];
  const picked=spells.map(s => Object.fromEntries(fields.map(f => [f,s[f] ?? null])));
  assert.deepEqual(picked, json(editorial));
  assert.deepEqual(renderNames(h), spells.map(s => s.id));
  assert.equal(h.get('fmmg-resultCount').textContent, '94 resultados');
});

test('filter options remain 5 independent dimensions plus search', () => {
  const h=harness();
  const f=json(h.filters);
  assert.deepEqual(f.sources, ['Todas','Core 2024','HoF']);
  assert.deepEqual(f.functions, ['Todas','Dano','Controle','Defesa','Utilidade','Exploração','Social']);
  assert.deepEqual(f.levels, ['Todos','Truques','1º','2º','3º','4º','5º','6º','7º','8º','9º']);
  assert.deepEqual(f.priorities, ['Todas','ESSENCIAL','PRIORIDADE','ÓTIMO','SITUACIONAL']);
  for(const id of ['fmmg-functionPills','fmmg-schoolPills','fmmg-sourcePills','fmmg-levelPills','fmmg-priorityPills',
    'fmmg-mFunctionPills','fmmg-mSchoolPills','fmmg-mSourcePills','fmmg-mLevelPills','fmmg-mPriorityPills'])
    assert.ok(h.get(id).children.length > 0,id+' empty');
});

test('source filter Core/HoF never leaks records or loses selection', () => {
  const h=harness();
  clickPill(h,'fmmg-sourcePills','HoF');
  assert.equal(renderNames(h).length,3);
  assert.ok(renderNames(h).every(id => h.spells.find(s => s.id===id).tagFonte === 'HoF'));
  assert.equal(h.get('fmmg-resultCount').textContent, '3 resultados');
  assert.equal(h.state.selected,renderNames(h)[0]);
  clickPill(h,'fmmg-sourcePills','Core 2024');
  assert.equal(renderNames(h).length,91);
  assert.ok(!renderNames(h).some(id => h.spells.find(s => s.id===id).tagFonte === 'HoF'));
  clickPill(h,'fmmg-sourcePills','Todas');
  assert.equal(renderNames(h).length,94);
});

test('search on Portuguese/English name + effects, and combined filters are AND', () => {
  const h=harness();
  h.get('fmmg-search').trigger('input','Synaptic STATIC');
  assert.deepEqual(renderNames(h),['MAG-0069']);
  h.get('fmmg-search').trigger('input','');
  clickPill(h,'fmmg-functionPills','Dano');
  clickPill(h,'fmmg-sourcePills','Core 2024');
  clickPill(h,'fmmg-levelPills','Truques');
  const expected=h.spells.filter(s => s.funcoes.includes('Dano') && s.tagFonte === 'Core 2024' && s.nivel===0).map(s=>s.id);
  assert.deepEqual(renderNames(h),json(expected));
  assert.ok(h.get('fmmg-activeState').textContent.includes('Dano'));
  assert.ok(h.get('fmmg-activeState').textContent.includes('Core 2024'));
  assert.ok(h.get('fmmg-activeState').textContent.includes('Truques'));
  assert.ok(h.get('fmmg-clearFilters').classList.contains('visible'));
});

test('school and priority combinations produce correct results', () => {
  const h=harness();
  clickPill(h,'fmmg-schoolPills','Evocação');
  clickPill(h,'fmmg-priorityPills','PRIORIDADE');
  const expected=h.spells.filter(s=>s.escola==='Evocação'&&s.classificacao==='PRIORIDADE').map(s=>s.id);
  assert.deepEqual(renderNames(h),json(expected));
});

test('empty result exposes reset and returns exactly 94 without stale pills', () => {
  const h=harness();
  h.get('fmmg-search').trigger('input','__spell06d-no-match__');
  assert.equal(renderNames(h).length,0);
  assert.ok(h.get('fmmg-emptyState').classList.contains('show'));
  assert.equal(h.get('fmmg-resultCount').textContent, '0 resultados');
  h.get('fmmg-emptyReset').onclick();
  assert.equal(renderNames(h).length,94);
  assert.equal(h.get('fmmg-search').value,'');
  assert.equal(h.state.source,'Todas');
  assert.equal(h.state.priority,'Todas');
  assert.equal(h.get('fmmg-activeState').textContent,'Todos os filtros');
  assert.ok(!h.get('fmmg-clearFilters').classList.contains('visible'));
  assert.ok(!h.get('fmmg-emptyState').classList.contains('show'));
});

test('mobile filter sheet, manual card selection, detail sheet and backdrop remain functional', () => {
  const h=harness(true);
  h.get('fmmg-openFilters').onclick();
  assert.ok(h.get('fmmg-filterSheet').classList.contains('open'));
  assert.ok(h.get('fmmg-backdrop').classList.contains('open'));
  clickPill(h,'fmmg-mSourcePills','HoF');
  assert.equal(renderNames(h).length,3);
  assert.ok(!h.get('fmmg-filterSheet').classList.contains('open'));
  assert.ok(!h.get('fmmg-backdrop').classList.contains('open'));
  assert.equal(h.state.selected,renderNames(h)[0]);
  const second=rows(h)[1];
  assert.equal(typeof second.onclick,'function');
  second.onclick();
  assert.equal(h.state.selected,second.dataset.id);
  assert.ok(h.get('fmmg-detailSheet').classList.contains('open'));
  assert.ok(h.get('fmmg-backdrop').classList.contains('open'));
  assert.ok(h.get('fmmg-mobileDetail').innerHTML.includes('fmmg-detail'));
  h.get('fmmg-backdrop').onclick();
  assert.ok(!h.get('fmmg-detailSheet').classList.contains('open'));
  h.get('fmmg-mClearFilters').onclick();
  assert.equal(renderNames(h).length,94);
});

test('desktop uses same detail contents, but never opens a mobile detail sheet', () => {
  const h=harness(false), all=rows(h);
  assert.ok(all.length>1);
  all[1].onclick();
  assert.equal(h.state.selected,all[1].dataset.id);
  assert.ok(!h.get('fmmg-detailSheet').classList.contains('open'));
  const desktop=h.get('fmmg-detail').outerHTML;
  const mobile=h.get('fmmg-mobileDetail').innerHTML;
  assert.ok(desktop.includes(h.spells[1].nomePt));
  assert.ok(mobile.includes(h.spells[1].nomePt));
  assert.equal(desktop.replace(' id="fmmg-detail"',''), mobile);
});

test('all 94 cards can render detail templates; user-facing values escaped', () => {
  const h=harness();
  const detail=h.evalJs('detailTemplate');
  for(const s of h.spells){
    const html=detail(s);
    assert.ok(html.includes('Leitura Forja:'),s.id);
    assert.ok(html.includes('Consultar fonte'),s.id);
    assert.ok(html.includes(h.evalJs('esc')(s.nomePt)),s.id);
  }
  const testSpell={...h.spells[0],notas:'<img src=x onerror="alert(1)">',nomePt:'<script>alert(1)</script>'};
  const unsafe=detail(testSpell);
  assert.ok(unsafe.includes('&lt;script&gt;'));
  assert.ok(unsafe.includes('&lt;img'));
  assert.ok(!unsafe.includes('<script>'));
  assert.ok(!unsafe.includes('<img src=x'));
});

test('06C integration still preserves 94 records, blocked editorial decisions and HoF', () => {
  const h=harness();
  const before=JSON.stringify(editorial);
  const results=bridge.prepare(exportFixture,editorial,adapter,{fixtureMode:true,blockedIds:['MAG-0063','MAG-0076']});
  assert.equal(results.summary.total,94);
  assert.equal(results.summary.core,91);
  assert.equal(results.summary.hof,3);
  const dream=results.cards.find(c=>c.id==='MAG-0063');
  const tasha=results.cards.find(c=>c.id==='MAG-0076');
  assert.equal(dream.status,'BLOQUEADO');
  assert.equal(tasha.status,'BLOQUEADO');
  assert.equal(dream.preview.alcance,dream.base.alcance);
  assert.equal(tasha.preview.alcance,tasha.base.alcance);
  for(const c of results.cards.filter(c=>c.base.tagFonte==='HoF')) assert.deepEqual(c.preview,c.base);
  assert.equal(JSON.stringify(editorial),before);
  assert.equal(h.spells.length,94);
});

test('PHP template, shortcode and CSS preserve legacy contracts and responsive breakpoint', () => {
  const expectedIds=[
    'fmmg-search','fmmg-resultCount','fmmg-activeState','fmmg-clearFilters','fmmg-spellList',
    'fmmg-emptyState','fmmg-emptyReset','fmmg-detail','fmmg-backdrop','fmmg-openFilters',
    'fmmg-filterSheet','fmmg-mClearFilters','fmmg-detailSheet','fmmg-mobileDetail'
  ];
  for(const id of expectedIds) assert.ok(php.includes('id="' + id + '"'),id+' missing from PHP template');
  assert.ok(css.includes('@media(max-width:820px)'));
  assert.match(plugin, /Version:\s*1\.0\.9/);
  assert.match(plugin, /add_shortcode\(\s*'forja_guia_magias_bruxo_2024'/);
  assert.match(plugin, /wp_enqueue_script\(/);
  assert.match(plugin, /melhores-itens-para-bruxo-dnd-5e/);
  assert.match(plugin, /voldemort-dnd-5e-build-bruxo/);
  assert.doesNotMatch(plugin, /spell-adapter\.js/);
});

test.todo('A11Y mobile: sincronizar aria-hidden dos sheets com classe open (necessita aprovação UX)');
test.todo('Visual/browser: screenshots e fluxos com DOM/CSS real, sem WordPress, aguardam ambiente de browser');
test.todo('WordPress real: PHP, shortcode e responsividade do site aguardam acesso ao staging');
