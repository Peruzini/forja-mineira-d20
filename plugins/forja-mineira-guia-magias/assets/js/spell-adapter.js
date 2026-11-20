/* SPELL-05E — isolated, opt-in preview adapter. No WordPress or spreadsheet writes. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ForjaSpell05EAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function obj(value, label) {
    var v = typeof value === 'string' ? JSON.parse(value) : value;
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new TypeError(label + ': expected object');
    return v;
  }
  function integer(n, label) {
    if (!Number.isInteger(n) || n < 0) throw new TypeError(label + ': expected nonnegative integer');
    return n;
  }
  function formatRange(input) {
    var r = obj(input, 'range');
    if (r.type === 'special') return 'Especial';
    if (r.type !== 'point' || !r.distance) throw new TypeError('Unsupported range type');
    var d = obj(r.distance, 'distance');
    if (d.type === 'self') return 'Pessoal';
    if (d.type === 'touch') return 'Toque';
    if (d.type === 'feet' && Number.isFinite(d.amount) && d.amount > 0) return d.amount + ' pés';
    if (d.type === 'miles' && Number.isFinite(d.amount) && d.amount > 0) return d.amount + ' milha(s)';
    throw new TypeError('Unsupported range distance');
  }
  function formatCasting(input) {
    var c = obj(input, 'casting');
    if (c.action !== 'bonus' || !c.trigger || c.trigger.event !== 'attack_hit' || c.trigger.timing !== 'immediately_after') throw new TypeError('Unsupported conditional casting');
    var kinds = c.trigger.attackKinds || [];
    if (!Array.isArray(kinds) || kinds.length !== 2 || !kinds.includes('melee_weapon') || !kinds.includes('unarmed_strike')) throw new TypeError('Unsupported attack kinds');
    return 'Ação Bônus — imediatamente após acertar um ataque corpo a corpo com arma ou Golpe Desarmado (Unarmed Strike)';
  }
  function formatSave(input) {
    var s = obj(input, 'save');
    var one = Array.isArray(s.savingThrows) && s.savingThrows.length === 1 ? s.savingThrows[0] : null;
    if (!one || one.ability !== 'charisma' || !one.when || one.when.afterAttackDamage !== true || one.when.targetHpAtMost !== 50) throw new TypeError('Unsupported conditional save');
    return 'Salvaguarda de Carisma apenas se, após o dano do ataque, o alvo tiver 50 PV ou menos';
  }
  function slotScaling(input) {
    var s = obj(input, 'scaling');
    if (s.basis !== 'spell_slot') throw new TypeError('Unsupported scaling basis');
    integer(s.baseSlotLevel, 'baseSlotLevel');
    if (s.baseSlotLevel < 1 || s.baseSlotLevel > 9) throw new TypeError('Invalid base slot level');
    if (s.metric === 'damage_dice') {
      var match = /^(\d+)d(\d+)$/.exec(s.deltaPerSlotLevel || '');
      if (!match || Number(match[1]) < 1 || Number(match[2]) < 1) throw new TypeError('Invalid damage delta');
      return {
        label: '+' + s.deltaPerSlotLevel + ' por círculo de espaço acima do ' + s.baseSlotLevel + 'º',
        evaluate: function (level) {
          integer(level, 'slotLevel');
          if (level < s.baseSlotLevel || level > 9) throw new RangeError('Slot out of scaling bounds');
          var count = (level - s.baseSlotLevel) * Number(match[1]);
          return count === 0 ? '0' : count + 'd' + match[2];
        }
      };
    }
    if (s.metric === 'summon_hit_points') {
      integer(s.baseValue, 'baseValue');
      integer(s.incrementPerSlotLevel, 'incrementPerSlotLevel');
      return {
        label: 'PV da criatura = ' + s.baseValue + ' + ' + s.incrementPerSlotLevel + ' × (círculo do espaço − ' + s.baseSlotLevel + ')',
        evaluate: function (level) {
          integer(level, 'slotLevel');
          if (level < s.baseSlotLevel || level > 9) throw new RangeError('Slot out of scaling bounds');
          return s.baseValue + s.incrementPerSlotLevel * (level - s.baseSlotLevel);
        }
      };
    }
    throw new TypeError('Unsupported scaling metric');
  }
  function adaptEditorial(base, spec) {
    var b = obj(base, 'editorial record');
    var p = obj(spec, 'preview spec');
    if (!b.id || b.id !== p.spellId) throw new Error('spellId mismatch: fail closed');
    if (b.tagFonte !== 'Core 2024') throw new Error('HoF/Legacy is outside SPELL-05E');
    var out = Object.assign({}, b);
    var diagnostics = [];
    if (p.rangeJSON !== undefined) out.alcance = formatRange(p.rangeJSON);
    if (p.castingSchema !== undefined) out.conjuracao = formatCasting(p.castingSchema);
    if (p.scalingSchema !== undefined) out.escalonamento = slotScaling(p.scalingSchema).label;
    if (p.saveSchema !== undefined) diagnostics.push(formatSave(p.saveSchema));
    if (p.previewObs2024 !== undefined) {
      if (typeof p.previewObs2024 !== 'string' || !p.previewObs2024.trim()) throw new TypeError('Invalid preview annotation');
      out.obs2024 = p.previewObs2024;
    }
    return { record: out, diagnostics: diagnostics, previewOnly: true };
  }
  return Object.freeze({ version: '0.1.0-preview', formatRange: formatRange, formatCasting: formatCasting, formatSave: formatSave, slotScaling: slotScaling, adaptEditorial: adaptEditorial });
});
