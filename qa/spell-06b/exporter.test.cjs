'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildSnapshot,exportSnapshot}=require('./exporter.cjs');
function fixture(){
 const cat=(id,name)=>({spellId:id,spellVersionId:'SPV-XPHB-'+id,stableKey:'XPHB|'+name.toLowerCase(),nameEN:name,namePT:name,spellLevel:1,sourceCode:'XPHB',sourceCategory:'CORE_2024'});
 const ver=id=>({spellId:id,spellVersionId:'SPV-XPHB-'+id,sourceCode:'XPHB',versionCategory:'FINAL_CORE_2024',spellLevel:1,castingTimeJSON:'[]',rangeJSON:'{"type":"special"}',componentsJSON:'{}',durationJSON:'[]',savingThrowJSON:'[]',spellAttackJSON:'[]',damageTypesJSON:'[]',areaTagsJSON:'[]',conditionTagsJSON:'[]',scalingJSON:'{}',concentration:'FALSE',ritual:'FALSE'});
 return {SPELL_Catalogo:[cat('MAG-0001','Alpha'),cat('MAG-0063','Dream')],SPELL_Versoes:[ver('MAG-0063'),ver('MAG-0001')],SPELL_Classes:[{spellId:'MAG-0001',spellVersionId:'SPV-XPHB-MAG-0001',classId:'CLASS-1'}],SPELL_Acessos:[],SPELL_Fontes:[{sourceId:'SRC-XPHB',sourceCode:'XPHB',sourceCategory:'CORE_2024'}]};
}
const opts={expectedCoreCount:2};
test('stable output independent of row and object key ordering',()=>{
 const a=fixture(),b=fixture();b.SPELL_Catalogo.reverse();b.SPELL_Versoes.reverse();
 b.SPELL_Catalogo=b.SPELL_Catalogo.map(r=>Object.fromEntries(Object.entries(r).reverse()));
 assert.deepEqual(exportSnapshot(a,opts),exportSnapshot(b,opts));
});
test('manifest hashes exact payload, no timestamp or publish permission',()=>{
 const e=exportSnapshot(fixture(),opts),m=JSON.parse(e.manifest),d=JSON.parse(e.payload);
 assert.equal(m.sha256,require('node:crypto').createHash('sha256').update(e.payload).digest('hex'));
 assert.equal(m.byteLength,Buffer.byteLength(e.payload));
 assert.equal(d.publicationAllowed,false);
 assert.equal(d.spells.find(x=>x.spellId==='MAG-0063').publicationGate,'BLOCKED');
});
test('reject malformed mechanics',()=>{
 const a=fixture();a.SPELL_Versoes[0].rangeJSON='{bad';
 assert.throws(()=>buildSnapshot(a,opts),/invalid rangeJSON/);
});
test('reject duplicates, orphan links and invalid version relationships',()=>{
 const a=fixture();a.SPELL_Catalogo[1].spellId='MAG-0001';
 assert.throws(()=>buildSnapshot(a,opts),/duplicate spellId/);
 const b=fixture();b.SPELL_Classes[0].spellVersionId='wrong';
 assert.throws(()=>buildSnapshot(b,opts),/orphan class link/);
 const c=fixture();c.SPELL_Versoes[0].spellId='MAG-XYZ';
 assert.throws(()=>buildSnapshot(c,opts),/mismatch|orphan/);
});
test('default 391 Core gate blocks incomplete snapshots',()=>{
 assert.throws(()=>buildSnapshot(fixture()),/Core count mismatch/);
});
test('Core only; supplemental names do not count toward 391',()=>{
 const a=fixture();a.SPELL_Catalogo.push({...a.SPELL_Catalogo[0],spellId:'MAG-HOF',sourceCode:'FRHoF',sourceCategory:'SUPLEMENTO_2025'});
 const d=buildSnapshot(a,opts);
 assert.equal(d.spells.length,2);
});
test('source input is immutable across export',()=>{
 const data=fixture(),before=JSON.stringify(data);
 exportSnapshot(data,opts);assert.equal(JSON.stringify(data),before);
});
