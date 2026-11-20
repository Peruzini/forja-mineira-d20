/* ETAPA 2 — navegação local e independente; não toca em builds.js / Voldemort. */
(() => {
  'use strict';
  function init(root) {
    if (root.dataset.doomStage2Ready === '1') return;
    const sections = Array.from(root.querySelectorAll('[data-fmb-level][id]'))
      .filter(section => /^\d+$/.test(section.dataset.fmbLevel))
      .sort((a, b) => Number(a.dataset.fmbLevel) - Number(b.dataset.fmbLevel));
    if (!sections.length) return;
    const nav = document.createElement('nav');
    nav.className = 'fmb-doom-stage2-nav';
    nav.setAttribute('aria-label', 'Níveis implementados desta build');
    const topLink = document.createElement('a');
    topLink.href = '#' + root.id;
    topLink.textContent = 'Início';
    nav.appendChild(topLink);
    sections.forEach(section => {
      const a = document.createElement('a');
      a.href = '#' + section.id;
      a.textContent = 'Nível ' + section.dataset.fmbLevel;
      a.dataset.fmbTargetLevel = section.dataset.fmbLevel;
      nav.appendChild(a);
    });
    root.insertBefore(nav, sections[0]);
    root.dataset.doomStage2Ready = '1';
  }
  function boot() {
    document.querySelectorAll('.fmb-doom-stage2-root[data-fmb-build="doutor-destino"]')
      .forEach(init);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }
})();
