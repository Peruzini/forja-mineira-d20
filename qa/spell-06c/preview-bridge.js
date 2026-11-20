/* SPELL-06C — Experimento isolado. Nunca atualiza guia, WordPress ou fonte. */
(function (root,factory) {
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ForjaSpell06CBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function fail(s){ throw new Error('SPELL-06C: '+s); }
  function norm(s){ return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLocaleLowerCase('en').replace(/[^a-z0-9]/g,''); }
  function check(snapshot,editorial,opts){
    if(!snapshot||snapshot.schemaVersion!=='spell-export/1.0.0-preview'||snapshot.publicationAllowed!==false) fail('snapshot não autorizado');
    if(!Array.isArray(snapshot.spells)||snapshot.spells.length!==snapshot.counts?.core) fail('contagem do snapshot inválida');
    const fixture=opts?.fixtureMode===true;
    if(!fixture && snapshot.spells.length!==391) fail('snapshot incompleto: 391 Core exigidos');
    if(!Array.isArray(editorial)||editorial.length!==94) fail('94 cards editoriais obrigatórios');
    const ids=new Set();
    for(const s of snapshot.spells){
      if(!/^MAG-\d{4}$/.test(s.spellId)||ids.has(s.spellId)||s.sourceCode!=='XPHB') fail('identidade Core inválida');
      ids.add(s.spellId);
      if(!['BLOCKED','REVIEW_REQUIRED'].includes(s.publicationGate)) fail('gate inválido: '+s.spellId);
    }
    const eids=new Set();let core=0,hof=0;
    for(const r of editorial){
      if(!r||!r.id||eids.has(r.id)) fail('card duplicado ou inválido');
      eids.add(r.id);
      if(r.tagFonte==='Core 2024') core++;
      else if(r.tagFonte==='HoF') hof++;
      else fail('tag editorial não prevista');
    }
    if(core!==91||hof!==3) fail('regressão nos filtros Core/HoF');
    return new Map(snapshot.spells.map(s=>[s.spellId,s]));
  }
  function prepare(snapshot,editorial,adapter,options){
    const lookup=check(snapshot,editorial,options);
    if(!adapter||typeof adapter.adaptEditorial!=='function'||typeof adapter.formatRange!=='function') fail('adaptador SPELL-05E ausente');
    const extraBlock=new Set(options?.blockedIds||[]);
    const cards=editorial.map(base=>{
      const original=Object.assign({},base);
      const v=lookup.get(base.id);
      if(!v){
        return {id:base.id,base:original,preview:Object.assign({},original),status:'SEM_SNAPSHOT',candidate:null};
      }
      if(base.tagFonte!=='Core 2024') fail('snapshot tentando sobrescrever HoF');
      if(norm(base.nomeEn)!==norm(v.nameEN)||Number(base.nivel)!==v.spellLevel) fail('mapeamento editorial inválido: '+base.id);
      const blocked=v.publicationGate==='BLOCKED'||extraBlock.has(v.spellId);
      let candidate;
      try { candidate=adapter.formatRange(v.mechanics?.rangeJSON); }
      catch { return {id:base.id,base:original,preview:Object.assign({},original),status:'SEM_CONVERSAO',candidate:null}; }
      if(blocked) return {id:base.id,base:original,preview:Object.assign({},original),status:'BLOQUEADO',candidate};
      const adapted=adapter.adaptEditorial(original,{spellId:base.id,rangeJSON:v.mechanics.rangeJSON});
      if(adapted.previewOnly!==true||adapted.record.id!==base.id) fail('adaptador não-isolado');
      return {id:base.id,base:original,preview:adapted.record,status:'PREVIA_SOMENTE_LEITURA',candidate};
    });
    return {cards,summary:{total:cards.length,core:91,hof:3,fixture:options?.fixtureMode===true,blocked:cards.filter(c=>c.status==='BLOQUEADO').length,previewable:cards.filter(c=>c.status==='PREVIA_SOMENTE_LEITURA').length}};
  }
  async function verifyManifest(payload,manifest){
    if(typeof payload!=='string') fail('payload deve ser texto bruto');
    const m=typeof manifest==='string'?JSON.parse(manifest):manifest;
    if(!m||m.publicationAllowed!==false||m.schemaVersion!=='spell-export-manifest/1'||m.dataFile!=='spells-core-2024.preview.json') fail('manifesto inválido');
    const bytes=new TextEncoder().encode(payload);
    if(bytes.byteLength!==m.byteLength) fail('tamanho divergente');
    let digest;
    if(typeof module==='object'&&module.exports){
      digest=require('node:crypto').createHash('sha256').update(payload,'utf8').digest('hex');
    }else{
      if(!globalThis.crypto?.subtle) fail('WebCrypto indisponível; prévia sem verificação');
      const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
      digest=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
    }
    if(digest!==m.sha256) fail('SHA-256 divergente');
    const snapshot=JSON.parse(payload);
    if(snapshot.publicationAllowed!==false||snapshot.counts?.core!==m.counts?.core) fail('manifesto e exportação divergentes');
    return snapshot;
  }
  return Object.freeze({version:'0.1.0-preview',prepare,verifyManifest});
});
