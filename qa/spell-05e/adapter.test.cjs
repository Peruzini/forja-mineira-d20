'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../../plugins/forja-mineira-guia-magias/assets/js/spell-adapter.js');
test('alcance especial e atual', () => {
  assert.equal(A.formatRange({type:'special'}),'Especial');
  assert.equal(A.formatRange({type:'point',distance:{type:'self'}}),'Pessoal');
  assert.equal(A.formatRange({type:'point',distance:{type:'touch'}}),'Toque');
  assert.equal(A.formatRange({type:'point',distance:{type:'feet',amount:120}}),'120 pés');
  assert.throws(()=>A.formatRange({type:'unknown'}));
});
const trigger = {action:'bonus',trigger:{event:'attack_hit',timing:'immediately_after',attackKinds:['melee_weapon','unarmed_strike']}};
test('gatilho de Ação Bônus após acerto', () => {
  assert.match(A.formatCasting(trigger),/imediatamente após acertar/);
  assert.throws(()=>A.formatCasting({action:'bonus'}));
});
test('salvaguarda condicional de Carisma', () => {
  assert.match(A.formatSave({savingThrows:[{ability:'charisma',when:{afterAttackDamage:true,targetHpAtMost:50}}]}),/50 PV ou menos/);
  assert.throws(()=>A.formatSave({savingThrows:[{ability:'charisma'}]}));
});
test('escalonamento de Conjurar Elemental', () => {
  const x=A.slotScaling({basis:'spell_slot',metric:'damage_dice',baseSlotLevel:5,deltaPerSlotLevel:'1d8'});
  assert.deepEqual([x.evaluate(5),x.evaluate(6),x.evaluate(7)],['0','1d8','2d8']);
  assert.throws(()=>x.evaluate(10),RangeError);
});
test('PV de Inseto Gigante não são dano', () => {
  const x=A.slotScaling({basis:'spell_slot',metric:'summon_hit_points',baseSlotLevel:4,baseValue:30,incrementPerSlotLevel:10});
  assert.deepEqual([x.evaluate(4),x.evaluate(5),x.evaluate(9)],[30,40,80]);
  assert.match(x.label,/PV da criatura/);
});
test('adaptação não altera origem nem HoF', () => {
  const original={id:'MAG-0063',tagFonte:'Core 2024',alcance:'Pessoal',nomePt:'Sonho'};
  const x=A.adaptEditorial(original,{spellId:'MAG-0063',rangeJSON:{type:'special'}});
  assert.equal(x.record.alcance,'Especial');
  assert.equal(original.alcance,'Pessoal');
  assert.equal(x.previewOnly,true);
  assert.throws(()=>A.adaptEditorial(original,{spellId:'MAG-0002'}));
  assert.throws(()=>A.adaptEditorial({...original,tagFonte:'HoF'},{spellId:'MAG-0063'}));
});
