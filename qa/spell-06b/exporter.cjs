'use strict';
/** SPELL-06B: deterministic, read-only export of an explicit Google Sheets snapshot. */
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const FIELDS = Object.freeze({
  SPELL_Catalogo: ['spellId','nameEN','namePT','spellLevel','sourceCode','sourceCategory','spellVersionId','stableKey'],
  SPELL_Versoes: ['spellVersionId','spellId','sourceCode','versionCategory','spellLevel','castingTimeJSON','rangeJSON','componentsJSON','durationJSON','concentration','ritual','savingThrowJSON','spellAttackJSON','damageTypesJSON','areaTagsJSON','conditionTagsJSON','scalingJSON'],
  SPELL_Classes: ['spellVersionId','spellId','classId'],
  SPELL_Acessos: ['accessId','spellId','spellVersionId','subclassId'],
  SPELL_Fontes: ['sourceId','sourceCode','sourceCategory']
});
const JSON_FIELDS = ['castingTimeJSON','rangeJSON','componentsJSON','durationJSON','savingThrowJSON','spellAttackJSON','damageTypesJSON','areaTagsJSON','conditionTagsJSON','scalingJSON'];
const DEFAULT_BLOCKED = ['MAG-0063']; // Dream; editorial/source conflict. Additional blocks supplied by QA input.
function fail(msg) { throw new Error('SPELL-06B: ' + msg); }
function nonempty(x) { return typeof x === 'string' && x.trim().length > 0; }
function normalizedRows(input, tab) {
  if (!Array.isArray(input)) fail(tab + ': missing rows');
  if (input.length && Array.isArray(input[0])) {
    const [headers,...rows] = input;
    if (new Set(headers).size !== headers.length) fail(tab + ': duplicate headers');
    return rows.filter(r => r.some(x => x !== '' && x !== null && x !== undefined)).map((r,i) => {
      if (!Array.isArray(r) || r.length > headers.length) fail(tab + ': invalid row ' + (i+2));
      return Object.fromEntries(headers.map((k,j) => [k, r[j] ?? '']));
    });
  }
  return input.map(r => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) fail(tab + ': invalid object');
    return r;
  });
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function serialize(data) { return JSON.stringify(stable(data), null, 2) + '\n'; }
function sha(content) { return crypto.createHash('sha256').update(content,'utf8').digest('hex'); }
function sortById(rows, field) { return [...rows].sort((a,b)=>String(a[field]).localeCompare(String(b[field]),'en') || serialize(a).localeCompare(serialize(b),'en')); }
function unique(rows, field, tab) {
  const ids = new Set();
  for (const r of rows) {
    if (!nonempty(r[field])) fail(tab + ': missing ' + field);
    if (ids.has(r[field])) fail(tab + ': duplicate ' + field + ' ' + r[field]);
    ids.add(r[field]);
  }
}
function parseJson(value, field, id) {
  if (value === '' || value === null || value === undefined) return null;
  try { return typeof value === 'string' ? JSON.parse(value) : value; }
  catch { fail(id + ': invalid ' + field); }
}
function buildSnapshot(input, { expectedCoreCount=391, blockedIds=DEFAULT_BLOCKED }={}) {
  if (!input || typeof input !== 'object') fail('snapshot missing');
  const data = {};
  for (const [tab,fields] of Object.entries(FIELDS)) {
    data[tab] = normalizedRows(input[tab],tab);
    for (const r of data[tab]) for (const f of fields) if (!Object.hasOwn(r,f)) fail(tab + ': missing column ' + f);
  }
  const catalog = data.SPELL_Catalogo.filter(r=>r.sourceCategory==='CORE_2024' && r.sourceCode==='XPHB');
  const versions = data.SPELL_Versoes.filter(r=>r.sourceCode==='XPHB' && r.versionCategory==='FINAL_CORE_2024');
  if (catalog.length!==expectedCoreCount || versions.length!==expectedCoreCount) fail('Core count mismatch: '+catalog.length+'/'+versions.length+' expected '+expectedCoreCount);
  unique(catalog,'spellId','SPELL_Catalogo');
  unique(catalog,'stableKey','SPELL_Catalogo');
  unique(versions,'spellVersionId','SPELL_Versoes');
  unique(versions,'spellId','SPELL_Versoes');
  const byVersion = new Map(versions.map(v=>[v.spellVersionId,v]));
  const bySpell = new Map(catalog.map(v=>[v.spellId,v]));
  const blocked = new Set(blockedIds);
  for (const id of blocked) if (!nonempty(id)) fail('invalid blocked ID');
  const spells = sortById(catalog,'spellId').map(c=>{
    const v = byVersion.get(c.spellVersionId);
    if (!v || v.spellId!==c.spellId || v.spellLevel!==c.spellLevel) fail(c.spellId+': catalogue-version mismatch');
    const mechanics = {};
    for (const field of JSON_FIELDS) mechanics[field] = parseJson(v[field],field,c.spellId);
    const concentration = String(v.concentration).toUpperCase();
    const ritual = String(v.ritual).toUpperCase();
    if (!['TRUE','FALSE'].includes(concentration) || !['TRUE','FALSE'].includes(ritual)) fail(c.spellId+': invalid booleans');
    if (!Number.isInteger(Number(c.spellLevel)) || Number(c.spellLevel)<0 || Number(c.spellLevel)>9) fail(c.spellId+': invalid spell level');
    return {spellId:c.spellId,spellVersionId:v.spellVersionId,stableKey:c.stableKey,
      nameEN:c.nameEN,namePT:c.namePT,spellLevel:Number(c.spellLevel),sourceCode:c.sourceCode,
      concentration:concentration==='TRUE',ritual:ritual==='TRUE',mechanics,
      publicationGate:blocked.has(c.spellId)?'BLOCKED':'REVIEW_REQUIRED'};
  });
  for (const v of versions) if (!bySpell.has(v.spellId)) fail(v.spellId+': orphan version');
  const classLinks = data.SPELL_Classes.filter(r=>bySpell.has(r.spellId)).map(r=>{
    if (!byVersion.has(r.spellVersionId) || byVersion.get(r.spellVersionId).spellId!==r.spellId) fail(r.spellId+': orphan class link');
    return {spellId:r.spellId,spellVersionId:r.spellVersionId,classId:r.classId};
  });
  const accessLinks = data.SPELL_Acessos.filter(r=>bySpell.has(r.spellId)).map(r=>{
    if (!byVersion.has(r.spellVersionId) || byVersion.get(r.spellVersionId).spellId!==r.spellId) fail(r.spellId+': orphan access link');
    return {accessId:r.accessId,spellId:r.spellId,spellVersionId:r.spellVersionId,subclassId:r.subclassId};
  });
  unique(accessLinks,'accessId','SPELL_Acessos');
  const sources = data.SPELL_Fontes.filter(r=>r.sourceCode==='XPHB').map(r=>({sourceId:r.sourceId,sourceCode:r.sourceCode,sourceCategory:r.sourceCategory}));
  if (sources.length!==1) fail('expected exactly one XPHB source');
  return {schemaVersion:'spell-export/1.0.0-preview',publicationAllowed:false,source:'Google Sheets explicit snapshot',
    counts:{core:spells.length,classes:classLinks.length,accesses:accessLinks.length,blocked:spells.filter(s=>s.publicationGate==='BLOCKED').length},
    spells,classLinks:sortById(classLinks,'spellVersionId'),accessLinks:sortById(accessLinks,'accessId'),sources};
}
function exportSnapshot(input,options) {
  const snapshot=buildSnapshot(input,options);
  const payload=serialize(snapshot);
  const manifest=serialize({schemaVersion:'spell-export-manifest/1',publicationAllowed:false,
    dataFile:'spells-core-2024.preview.json',sha256:sha(payload),byteLength:Buffer.byteLength(payload),counts:snapshot.counts});
  return {payload,manifest};
}
function cli(args) {
  if(args.length!==2) fail('usage: node exporter.cjs <snapshot.json> <output-directory>');
  const source=JSON.parse(fs.readFileSync(args[0],'utf8'));
  const {payload,manifest}=exportSnapshot(source);
  fs.mkdirSync(args[1],{recursive:true});
  fs.writeFileSync(path.join(args[1],'spells-core-2024.preview.json'),payload);
  fs.writeFileSync(path.join(args[1],'manifest.json'),manifest);
}
if (require.main===module) cli(process.argv.slice(2));
module.exports={buildSnapshot,exportSnapshot,serialize,sha};
