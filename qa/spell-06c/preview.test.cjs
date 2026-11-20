'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {exportSnapshot}=require('../spell-06b/exporter.cjs');
const adapter=require('../../plugins/forja-mineira-guia-magias/assets/js/spell-adapter.js');
const bridge=require('./preview-bridge.js');
const source=require('./source-fixture.json');
const editorial=require('./editorial-fixture.js');
const fixture=require('./demo-export.js');
const options={expectedCoreCount:4,blockedIds:['MAG-0063','MAG-0076']};
test('06B export exactly matches the browser fixture from Sheets',()=>{
 const exported=JSON.parse(exportSnapshot(source,options).payload);
 assert.deepEqual(fixture,exported);
});
test('06B manifest checksum verified before bridge; tamper fails closed',async()=>{
 const {payload,manifest}=exportSnapshot(source,options);
 assert.deepEqual(await bridge.verifyManifest(payload,manifest),JSON.parse(payload));
 await assert.rejects(bridge.verifyManifest(payload+' ',manifest),/tamanho divergente|SHA-256 divergente/);
 const m=JSON.parse(manifest);m.publicationAllowed=true;
 await assert.rejects(bridge.verifyManifest(payload,m),/manifesto inválido/);
});
test('94 cards retained: 91 Core and 3 HoF, source immutability',()=>{
 const before=JSON.stringify(editorial), b=JSON.stringify(fixture);
 const view=bridge.prepare(fixture,editorial,adapter,{fixtureMode:true});
 assert.equal(view.cards.length,94);
 assert.deepEqual({core:view.summary.core,hof:view.summary.hof},{core:91,hof:3});
 assert.equal(view.summary.blocked,2);assert.equal(view.summary.previewable,2);
 assert.equal(JSON.stringify(editorial),before);assert.equal(JSON.stringify(fixture),b);
 assert.deepEqual(view.cards.filter(x=>x.base.tagFonte==='HoF').map(x=>x.preview),editorial.filter(x=>x.tagFonte==='HoF'));
});
test('Dream and Tasha blocked by publication gate; no range rewrite',()=>{
 const view=bridge.prepare(fixture,editorial,adapter,{fixtureMode:true});
 const dream=view.cards.find(x=>x.id==='MAG-0063');
 assert.equal(dream.status,'BLOQUEADO');
 assert.equal(dream.candidate,'Pessoal');
 assert.equal(dream.preview.alcance,dream.base.alcance);
 const cauldron=view.cards.find(x=>x.id==='MAG-0076');
 assert.equal(cauldron.status,'BLOQUEADO');
 assert.equal(cauldron.candidate,'5 pés');
 assert.equal(cauldron.preview.alcance,cauldron.base.alcance);
});
test('no implicit production/full-catalogue promotion',()=>{
 assert.throws(()=>bridge.prepare(fixture,editorial,adapter),/snapshot incompleto/);
 const c=structuredClone(fixture);c.publicationAllowed=true;
 assert.throws(()=>bridge.prepare(c,editorial,adapter,{fixtureMode:true}),/não autorizado/);
 const d=structuredClone(fixture);d.spells[0].publicationGate='APPROVED';
 assert.throws(()=>bridge.prepare(d,editorial,adapter,{fixtureMode:true}),/gate inválido/);
});
test('name/version mismatch aborts preview, preserving original',()=>{
 const c=structuredClone(fixture);c.spells[0].nameEN='Outro Feitiço';
 assert.throws(()=>bridge.prepare(c,editorial,adapter,{fixtureMode:true}),/mapeamento editorial inválido/);
 const e=[...editorial];e[0]={...e[0],tagFonte:'HoF'};
 assert.throws(()=>bridge.prepare(fixture,e,adapter,{fixtureMode:true}),/regressão nos filtros/);
});
test('HTML is independent from WordPress and user controls exist',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'index.html'),'utf8');
 for(const id of ['filtroBusca','filtroFonte','filtroNivel','limparFiltros','listaMagias','detalheMagia']) assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(html,/<script[^>]*src=["'][^"']*https?:\/\//);
});
