(() => {
  'use strict';

  const phases = [
    { roman: 'I',   name: 'O Estudante',          short: 'Estudante',         start: 1,  end: 4 },
    { roman: 'II',  name: 'As Primeiras Sombras', short: 'Primeiras Sombras',start: 5,  end: 8 },
    { roman: 'III', name: 'A Transformação',      short: 'Transformação',     start: 9,  end: 12 },
    { roman: 'IV',  name: 'O Senhor das Trevas',  short: 'Senhor das Trevas',start: 13, end: 16 },
    { roman: 'V',   name: 'O Poder Absoluto',     short: 'Poder Absoluto',    start: 17, end: 20 }
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function phaseFor(level) {
    return phases.find(p => level >= p.start && level <= p.end) || phases[0];
  }

  function scrollToTarget(root, level) {
    const target = level === 0 ? root : root.querySelector(`#nivel-${level}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function levelTitle(root, level) {
    const section = root.querySelector(`#nivel-${level}`);
    const h1 = section ? section.querySelector('h1') : null;
    if (!h1) return `Nível ${level}`;
    return h1.textContent.replace(/\s+/g, ' ').trim();
  }

  function createStepper(root, level) {
    const block = root.querySelector(`.fmb-block[data-fmb-block="${level}"]`);
    if (!block || block.querySelector(':scope > .fmb-level-stepper')) return;

    const nav = document.createElement('nav');
    nav.className = 'fmb-level-stepper';
    nav.setAttribute('aria-label', `Navegação do nível ${level}`);

    const prevLevel = level - 1;
    const nextLevel = level + 1;

    const prev = document.createElement('a');
    prev.className = 'fmb-level-step fmb-level-step--prev';
    prev.href = prevLevel >= 1 ? `#nivel-${prevLevel}` : '#forja-build-voldemort';
    prev.innerHTML = `
      <span class="fmb-level-step-arrow" aria-hidden="true">←</span>
      <span class="fmb-level-step-copy">
        <small>${prevLevel >= 1 ? `Nível ${prevLevel}` : 'Início da build'}</small>
        <strong>${prevLevel >= 1 ? levelTitle(root, prevLevel) : 'Voltar ao topo'}</strong>
      </span>`;
    prev.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToTarget(root, prevLevel >= 1 ? prevLevel : 0);
    });

    const next = document.createElement('a');
    next.className = 'fmb-level-step fmb-level-step--next';
    next.href = nextLevel <= 20 ? `#nivel-${nextLevel}` : '#forja-build-voldemort';
    next.innerHTML = `
      <span class="fmb-level-step-copy">
        <small>${nextLevel <= 20 ? `Nível ${nextLevel}` : 'Build completa'}</small>
        <strong>${nextLevel <= 20 ? levelTitle(root, nextLevel) : 'Voltar ao topo'}</strong>
      </span>
      <span class="fmb-level-step-arrow" aria-hidden="true">${nextLevel <= 20 ? '→' : '↑'}</span>`;
    next.addEventListener('click', (event) => {
      event.preventDefault();
      scrollToTarget(root, nextLevel <= 20 ? nextLevel : 0);
    });

    nav.append(prev, next);
    block.appendChild(nav);
  }

  function initBuild(root) {
    if (root.dataset.fmbNavReady === '1') return;
    root.dataset.fmbNavReady = '1';

    const mascot = root.dataset.fmbMascot || '';
    const sections = Array.from({ length: 20 }, (_, i) => root.querySelector(`#nivel-${i + 1}`)).filter(Boolean);
    if (!sections.length) return;

    for (let level = 1; level <= 20; level++) createStepper(root, level);

    const shell = document.createElement('div');
    shell.className = 'fmb-nav-shell';
    shell.innerHTML = `
      <nav class="fmb-journey-dock" aria-label="Navegação rápida da build">
        <div class="fmb-dock-status" aria-live="polite">
          <span class="fmb-dock-phase">Fase I · O Estudante</span>
          <span class="fmb-dock-level">Nível 1 de 20</span>
        </div>

        <div class="fmb-progress-wrap" aria-hidden="true">
          <div class="fmb-progress-track">
            <span class="fmb-progress-fill"></span>
          </div>
          ${mascot ? `<img class="fmb-progress-cheese" src="${mascot}" alt="">` : `<span class="fmb-progress-cheese fmb-progress-cheese--fallback" aria-hidden="true">◈</span>`}
        </div>

        <button class="fmb-level-menu-toggle" type="button" aria-expanded="false">
          Ir para o nível ▾
        </button>

        <div class="fmb-level-menu" aria-hidden="true">
          <div class="fmb-level-menu-head">
            <strong>Escolha onde continuar</strong>
            <button class="fmb-level-menu-close" type="button" aria-label="Fechar menu">×</button>
          </div>
          <div class="fmb-phase-jumps"></div>
          <div class="fmb-level-grid"></div>
          <p class="fmb-level-menu-tip">O Pão de Queijo D20 acompanha seu progresso pela build.</p>
        </div>
      </nav>`;

    const scrollLine = document.createElement('div');
    scrollLine.className = 'fmb-scroll-line';
    scrollLine.setAttribute('aria-hidden', 'true');
    scrollLine.innerHTML = '<span></span>';

    const backTop = document.createElement('button');
    backTop.type = 'button';
    backTop.className = 'fmb-backtop';
    backTop.setAttribute('aria-label', 'Voltar ao topo da build');
    backTop.innerHTML = `
      ${mascot ? `<img src="${mascot}" alt="">` : `<span class="fmb-backtop-fallback" aria-hidden="true">◈</span>`}
      <span class="fmb-backtop-arrow" aria-hidden="true">↑</span>
      <span class="fmb-backtop-label">Voltar à forja</span>`;

    document.body.append(scrollLine, shell, backTop);

    const menu = shell.querySelector('.fmb-level-menu');
    const toggle = shell.querySelector('.fmb-level-menu-toggle');
    const close = shell.querySelector('.fmb-level-menu-close');
    const phaseWrap = shell.querySelector('.fmb-phase-jumps');
    const levelGrid = shell.querySelector('.fmb-level-grid');
    const phaseLabel = shell.querySelector('.fmb-dock-phase');
    const levelLabel = shell.querySelector('.fmb-dock-level');
    const cheese = shell.querySelector('.fmb-progress-cheese');

    phases.forEach(phase => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fmb-phase-jump';
      button.dataset.phaseStart = String(phase.start);
      button.innerHTML = `<strong>${phase.roman}</strong><span>${phase.short}</span>`;
      button.addEventListener('click', () => {
        scrollToTarget(root, phase.start);
        closeMenu();
      });
      phaseWrap.appendChild(button);
    });

    for (let level = 1; level <= 20; level++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(level);
      button.dataset.level = String(level);
      button.setAttribute('aria-label', `Ir para o nível ${level}: ${levelTitle(root, level)}`);
      button.addEventListener('click', () => {
        scrollToTarget(root, level);
        closeMenu();
      });
      levelGrid.appendChild(button);
    }

    function openMenu() {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = 'Fechar níveis ×';
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Ir para o nível ▾';
    }

    toggle.addEventListener('click', () => {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    close.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (menu.classList.contains('is-open') && !shell.contains(event.target)) closeMenu();
    });

    backTop.addEventListener('click', () => scrollToTarget(root, 0));

    let currentLevel = 1;
    let raf = 0;

    function update() {
      raf = 0;
      const viewportPoint = window.innerHeight * 0.36;
      let nextLevel = 1;
      let activeSection = sections[0];

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= viewportPoint) {
          nextLevel = index + 1;
          activeSection = section;
        }
      });

      const rect = activeSection.getBoundingClientRect();
      const local = clamp((viewportPoint - rect.top) / Math.max(rect.height, 1), 0, 1);
      const progress = clamp((((nextLevel - 1) + local) / 20) * 100, 0, 100);

      shell.style.setProperty('--fmb-progress', `${progress}%`);
      scrollLine.style.setProperty('--fmb-progress', `${progress}%`);

      const phase = phaseFor(nextLevel);
      phaseLabel.textContent = `Fase ${phase.roman} · ${phase.name}`;
      levelLabel.textContent = `Nível ${nextLevel} de 20`;

      const hasEnteredGuide = sections[0].getBoundingClientRect().top < window.innerHeight * 0.72;
      shell.classList.toggle('is-visible', hasEnteredGuide);
      backTop.classList.toggle('is-visible', hasEnteredGuide);

      if (nextLevel !== currentLevel) {
        currentLevel = nextLevel;
        cheese.classList.remove('is-bouncing');
        void cheese.offsetWidth;
        cheese.classList.add('is-bouncing');
      }

      levelGrid.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('is-current', Number(btn.dataset.level) === nextLevel);
      });

      phaseWrap.querySelectorAll('.fmb-phase-jump').forEach(btn => {
        const start = Number(btn.dataset.phaseStart);
        const p = phases.find(item => item.start === start);
        btn.classList.toggle('is-current', p && nextLevel >= p.start && nextLevel <= p.end);
      });
    }

    function requestUpdate() {
      if (!raf) raf = window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    update();
  }

  function boot() {
    document.querySelectorAll('.fmb-build-root--voldemort').forEach(initBuild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();


/* ===== Forja Mineira · votação persistente da Home ===== */
document.addEventListener('DOMContentLoaded', function () {
  const labels = {
    guts: 'Guts',
    duncan: 'Duncan, o Alto',
    trevor: 'Trevor Belmont'
  };

  function readCookie(name) {
    const prefix = name + '=';
    const found = document.cookie.split(';').map(function (part) {
      return part.trim();
    }).find(function (part) {
      return part.indexOf(prefix) === 0;
    });

    return found ? decodeURIComponent(found.slice(prefix.length)) : '';
  }

  function writeCookie(name, value) {
    document.cookie =
      name + '=' + encodeURIComponent(value) +
      '; path=/; max-age=31536000; samesite=lax';
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key) || '';
    } catch (error) {
      return '';
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Cookie remains as fallback. */
    }
  }

  document.querySelectorAll('[data-fmb-vote]').forEach(function (voteRoot) {
    const radios = Array.from(voteRoot.querySelectorAll('input[name="fmb-next-character"]'));
    const button = voteRoot.querySelector('[data-fmb-vote-button]');
    const status = voteRoot.querySelector('[data-fmb-vote-status]');
    const note = voteRoot.querySelector('[data-fmb-vote-note]');
    const endpoint = voteRoot.dataset.voteEndpoint || '';

    if (!radios.length || !button || !status || !note || !endpoint) return;

    let pollId = String(voteRoot.dataset.pollId || '1');
    let pollOpen = voteRoot.dataset.voteOpen !== '0';
    let submitting = false;

    function storageKey() {
      return 'forja_mineira_build_vote_' + pollId;
    }

    function cookieKey() {
      return 'fmb_build_vote_' + pollId;
    }

    function storedVote() {
      const value = safeStorageGet(storageKey()) || readCookie(cookieKey());
      return labels[value] ? value : '';
    }

    function clearVisualSelection() {
      radios.forEach(function (radio) {
        radio.checked = false;
        const candidate = radio.closest('.fmb-cycle-candidate');
        if (candidate) candidate.classList.remove('is-selected');
      });
      voteRoot.classList.remove('has-selection', 'is-confirmed', 'is-loading', 'is-closed');
    }

    function setRadiosDisabled(disabled) {
      radios.forEach(function (radio) {
        radio.disabled = disabled;
      });
    }

    function selectCard(candidateKey) {
      radios.forEach(function (radio) {
        const selected = radio.value === candidateKey;
        radio.checked = selected;
        const candidate = radio.closest('.fmb-cycle-candidate');
        if (candidate) candidate.classList.toggle('is-selected', selected);
      });
    }

    function showReady() {
      clearVisualSelection();
      setRadiosDisabled(false);

      status.innerHTML =
        '<span class="fmb-cycle-vote-status-dot" aria-hidden="true"></span>' +
        '<strong>ESCOLHA 1 DE 3</strong>';

      button.disabled = true;
      button.classList.remove('is-confirmed', 'is-loading');
      button.textContent = 'Escolha um candidato';

      note.innerHTML =
        '<span aria-hidden="true">🔒</span> ' +
        'O resultado permanece oculto até o encerramento da votação.';
    }

    function showClosed() {
      clearVisualSelection();
      voteRoot.classList.add('is-closed');
      setRadiosDisabled(true);

      status.innerHTML =
        '<span class="fmb-cycle-vote-status-dot" aria-hidden="true"></span>' +
        '<strong>VOTAÇÃO ENCERRADA</strong>';

      button.disabled = true;
      button.classList.remove('is-confirmed', 'is-loading');
      button.textContent = 'Votação encerrada';

      note.innerHTML =
        '<span aria-hidden="true">🔒</span> ' +
        'A votação desta rodada foi encerrada.';
    }

    function showStoredVote(candidateKey) {
      const label = labels[candidateKey];
      if (!label) return;

      clearVisualSelection();
      selectCard(candidateKey);
      voteRoot.classList.add('has-selection', 'is-confirmed');
      setRadiosDisabled(true);

      status.innerHTML =
        '<span class="fmb-cycle-vote-status-dot" aria-hidden="true"></span>' +
        '<strong>VOCÊ VOTOU · ' + label + '</strong>';

      button.disabled = true;
      button.classList.add('is-confirmed');
      button.textContent = '✓ Voto registrado';

      note.innerHTML =
        '<span aria-hidden="true">🔒</span> ' +
        'Seu voto está salvo. As parciais continuam ocultas.';
    }

    function applyCurrentState() {
      const saved = storedVote();

      if (saved) {
        showStoredVote(saved);
        return;
      }

      if (!pollOpen) {
        showClosed();
        return;
      }

      showReady();
    }

    radios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (!pollOpen || submitting || storedVote()) return;

        const candidateKey = radio.value;
        const label = labels[candidateKey] || 'candidato';

        voteRoot.classList.remove('is-confirmed', 'is-closed');
        voteRoot.classList.add('has-selection');

        selectCard(candidateKey);

        status.innerHTML =
          '<span class="fmb-cycle-vote-status-dot" aria-hidden="true"></span>' +
          '<strong>SELECIONADO · ' + label + '</strong>';

        button.disabled = false;
        button.classList.remove('is-confirmed', 'is-loading');
        button.innerHTML = 'Votar em ' + label + ' <span aria-hidden="true">→</span>';

        note.innerHTML =
          '<span aria-hidden="true">🔒</span> ' +
          'Sua escolha está pronta. As parciais continuam ocultas.';
      });
    });

    button.addEventListener('click', async function () {
      const selected = voteRoot.querySelector('input[name="fmb-next-character"]:checked');

      if (!selected || submitting || !pollOpen || storedVote()) return;

      submitting = true;
      setRadiosDisabled(true);
      button.disabled = true;
      button.classList.add('is-loading');
      button.textContent = 'Registrando voto…';

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            candidate: selected.value,
            poll_id: Number(pollId)
          })
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok || !data.registered) {
          if (data.code === 'poll_closed') {
            pollOpen = false;
            showClosed();
            return;
          }

          if (data.code === 'poll_changed') {
            note.textContent = data.message || 'A votação foi atualizada. Recarregue a página.';
            button.textContent = 'Recarregue a página';
            return;
          }

          throw new Error(data.message || 'Não foi possível registrar o voto.');
        }

        safeStorageSet(storageKey(), selected.value);
        writeCookie(cookieKey(), selected.value);
        showStoredVote(selected.value);
      } catch (error) {
        setRadiosDisabled(false);
        button.disabled = false;
        button.classList.remove('is-loading');
        button.innerHTML = 'Tentar registrar novamente';

        note.innerHTML =
          '<span aria-hidden="true">⚠</span> ' +
          (error && error.message ? error.message : 'Não foi possível registrar o voto. Tente novamente.');
      } finally {
        submitting = false;
      }
    });

    /* Consulta somente ID/status da rodada. Nenhuma parcial é enviada ao navegador. */
    fetch(endpoint, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('status');
        return response.json();
      })
      .then(function (data) {
        if (data && data.poll_id) {
          pollId = String(data.poll_id);
        }
        if (data && typeof data.open === 'boolean') {
          pollOpen = data.open;
        }
        applyCurrentState();
      })
      .catch(function () {
        /* Fallback para os dados já renderizados pelo WordPress. */
        applyCurrentState();
      });
  });
});

