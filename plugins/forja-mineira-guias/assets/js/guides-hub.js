(() => {
  const hub = document.querySelector('[data-fmg-guides-hub]');
  if (!hub) return;

  const search = hub.querySelector('#guideSearch');
  const system = hub.querySelector('#filterSystem');
  const category = hub.querySelector('#filterCategory');
  const klass = hub.querySelector('#filterClass');
  const level = hub.querySelector('#filterLevel');

  const cards = [...hub.querySelectorAll('.fmg-guides-hub__guide-card')];
  const filterMain = hub.querySelector('.fmg-guides-hub__filter-main');
  const activeWrap = hub.querySelector('#activeFilters');
  const resultCount = hub.querySelector('#resultCount');
  const emptyState = hub.querySelector('#emptyState');
  const guideGrid = hub.querySelector('#guideGrid');
  const moreBtn = hub.querySelector('#moreFilters');
  const advanced = hub.querySelector('#advancedFilters');
  const advancedContent = hub.querySelector('.fmg-guides-hub__advanced-content');
  const styleChipsWrap = hub.querySelector('#styleChips');
  const clearBtn = hub.querySelector('#clearFilters');
  const emptyClear = hub.querySelector('#emptyClear');
  const levelLabel = hub.querySelector('#levelLabel');

  const fields = {
    system: hub.querySelector('[data-filter-field="system"]'),
    category: hub.querySelector('[data-filter-field="category"]'),
    class: hub.querySelector('[data-filter-field="class"]'),
    level: hub.querySelector('[data-filter-field="level"]')
  };

  const selectedStyles = new Set();

  const normalize = value => (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'');

  const humanLevel = value => ({
    '1-5':'Níveis 1–5',
    '6-10':'Níveis 6–10',
    '11-16':'Níveis 11–16',
    '17-20':'Níveis 17–20'
  }[value] || value);

  function unique(values) {
    return [...new Set(values.filter(Boolean))].sort((a,b) =>
      a.localeCompare(b,'pt-BR',{numeric:true})
    );
  }

  function valuesFromCards(key) {
    if (key === 'level') {
      return unique(cards.flatMap(card =>
        (card.dataset.levels || '').split(' ').filter(Boolean)
      ));
    }
    if (key === 'style') {
      return unique(cards.flatMap(card =>
        (card.dataset.styles || '').split(' ').filter(Boolean)
      ));
    }
    const dataKey = key === 'class' ? 'class' : key;
    return unique(cards.map(card => card.dataset[dataKey] || ''));
  }

  function rebuildSelect(select, values, placeholder, formatter = v => v) {
    const current = select.value;
    select.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = placeholder;
    select.appendChild(all);

    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = formatter(value);
      select.appendChild(option);
    });

    if (values.includes(current)) select.value = current;
    else select.value = '';
  }

  function buildAvailableFilters() {
    const systems = valuesFromCards('system');
    const categories = valuesFromCards('category');
    const classes = valuesFromCards('class');
    const levels = valuesFromCards('level');
    const styles = valuesFromCards('style');

    rebuildSelect(system, systems, 'Todos os sistemas');
    rebuildSelect(category, categories, 'Todas as categorias');
    rebuildSelect(klass, classes, 'Todas as classes');
    rebuildSelect(level, levels, 'Todos os níveis', humanLevel);

    // A control with only one possible content value adds no useful decision.
    // It appears automatically later when the library gains a second real value.
    const visibility = {
      system: systems.length > 1,
      category: categories.length > 1,
      class: classes.length > 1,
      level: levels.length > 1
    };

    let visibleCount = 0;
    Object.entries(visibility).forEach(([key, show]) => {
      fields[key].classList.toggle('is-unavailable', !show);
      if (!show) {
        const select = key === 'system' ? system :
                       key === 'category' ? category :
                       key === 'class' ? klass : level;
        select.value = '';
      } else {
        visibleCount++;
      }
    });

    filterMain.style.setProperty('--fmg-visible-filter-count', Math.max(1, visibleCount));

    styleChipsWrap.innerHTML = '';
    styles.forEach(style => {
      const btn = document.createElement('button');
      btn.className = 'fmg-guides-hub__style-chip';
      btn.type = 'button';
      btn.dataset.style = style;
      btn.textContent = style;
      btn.addEventListener('click', () => {
        if (selectedStyles.has(style)) {
          selectedStyles.delete(style);
          btn.classList.remove('is-active');
        } else {
          selectedStyles.add(style);
          btn.classList.add('is-active');
        }
        apply();
      });
      styleChipsWrap.appendChild(btn);
    });

    const advancedAvailable = styles.length > 1;
    moreBtn.classList.toggle('is-unavailable', !advancedAvailable);
    advancedContent.classList.toggle('is-unavailable', !advancedAvailable);
    if (!advancedAvailable) {
      selectedStyles.clear();
      moreBtn.setAttribute('aria-expanded','false');
      advanced.classList.remove('is-open');
    }
  }

  function updateLevelLabel() {
    levelLabel.textContent =
      category.value === 'Spells' ? 'Nível da magia' :
      category.value === 'Itens' ? 'Faixa de nível' :
      'Nível';
  }

  function matchesBase(card, ignoreKey = null) {
    const q = normalize(search.value.trim());

    const haystack = normalize([
      card.dataset.title,
      card.dataset.search,
      card.dataset.system,
      card.dataset.category,
      card.dataset.class,
      card.dataset.levels,
      card.dataset.styles
    ].join(' '));

    if (ignoreKey !== 'search' && q && !haystack.includes(q)) return false;
    if (ignoreKey !== 'system' && system.value && card.dataset.system !== system.value) return false;
    if (ignoreKey !== 'category' && category.value && card.dataset.category !== category.value) return false;
    if (ignoreKey !== 'class' && klass.value && card.dataset.class !== klass.value) return false;
    if (ignoreKey !== 'level' && level.value &&
        !(card.dataset.levels || '').split(' ').includes(level.value)) return false;

    if (ignoreKey !== 'style' && selectedStyles.size) {
      const cardStyles = new Set((card.dataset.styles || '').split(' ').filter(Boolean));
      if (![...selectedStyles].some(style => cardStyles.has(style))) return false;
    }

    return true;
  }

  function refreshOptionAvailability() {
    const configs = [
      {key:'system', select:system, getter:c=>[c.dataset.system]},
      {key:'category', select:category, getter:c=>[c.dataset.category]},
      {key:'class', select:klass, getter:c=>[c.dataset.class]},
      {key:'level', select:level, getter:c=>(c.dataset.levels || '').split(' ').filter(Boolean)}
    ];

    configs.forEach(({key, select, getter}) => {
      const available = new Set(
        cards.filter(card => matchesBase(card,key)).flatMap(getter).filter(Boolean)
      );
      [...select.options].forEach((option,index) => {
        if (index === 0) {
          option.disabled = false;
          return;
        }
        option.disabled = !available.has(option.value) && option.value !== select.value;
      });
    });

    [...styleChipsWrap.querySelectorAll('.fmg-guides-hub__style-chip')].forEach(btn => {
      const style = btn.dataset.style;
      const exists = cards.some(card => {
        if (!matchesBase(card,'style')) return false;
        return (card.dataset.styles || '').split(' ').includes(style);
      });
      btn.disabled = !exists && !selectedStyles.has(style);
      btn.style.display = exists || selectedStyles.has(style) ? '' : 'none';
    });
  }

  function renderActive() {
    activeWrap.innerHTML = '';

    const defs = [
      ['search', search.value.trim(), 'Busca'],
      ['system', system.value, 'Sistema'],
      ['category', category.value, 'Categoria'],
      ['class', klass.value, 'Classe'],
      ['level', level.value ? humanLevel(level.value) : '', 'Nível']
    ];

    defs.forEach(([key,value,label]) => {
      if (!value) return;
      const chip = document.createElement('span');
      chip.className = 'fmg-guides-hub__active-chip';
      chip.innerHTML = `<span>${label}: ${value}</span><button type="button" aria-label="Remover ${label}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        if (key === 'search') search.value = '';
        if (key === 'system') system.value = '';
        if (key === 'category') category.value = '';
        if (key === 'class') klass.value = '';
        if (key === 'level') level.value = '';
        apply();
      });
      activeWrap.appendChild(chip);
    });

    selectedStyles.forEach(style => {
      const chip = document.createElement('span');
      chip.className = 'fmg-guides-hub__active-chip';
      chip.innerHTML = `<span>Estilo: ${style}</span><button type="button" aria-label="Remover estilo ${style}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        selectedStyles.delete(style);
        const btn = styleChipsWrap.querySelector(`[data-style="${CSS.escape(style)}"]`);
        if (btn) btn.classList.remove('is-active');
        apply();
      });
      activeWrap.appendChild(chip);
    });

    if (!activeWrap.children.length) {
      activeWrap.innerHTML = '<span class="fmg-guides-hub__active-empty">Nenhum filtro aplicado.</span>';
    }
  }

  function apply() {
    updateLevelLabel();

    let visible = 0;
    cards.forEach(card => {
      const ok = matchesBase(card);
      card.classList.toggle('is-hidden', !ok);
      if (ok) visible++;
    });

    resultCount.textContent = `${visible} ${visible === 1 ? 'resultado' : 'resultados'}`;
    guideGrid.style.display = visible ? 'grid' : 'none';
    emptyState.classList.toggle('is-visible', !visible);

    refreshOptionAvailability();
    renderActive();

    const hasFilters =
      !!search.value.trim() ||
      !!system.value ||
      !!category.value ||
      !!klass.value ||
      !!level.value ||
      selectedStyles.size > 0;

    clearBtn.style.visibility = hasFilters ? 'visible' : 'hidden';
  }

  function clearAll() {
    search.value = '';
    system.value = '';
    category.value = '';
    klass.value = '';
    level.value = '';
    selectedStyles.clear();
    [...styleChipsWrap.querySelectorAll('.fmg-guides-hub__style-chip')]
      .forEach(btn => btn.classList.remove('is-active'));
    apply();
  }

  [search,system,category,klass,level].forEach(el => {
    el.addEventListener(el === search ? 'input' : 'change', apply);
  });

  moreBtn.addEventListener('click', () => {
    const isOpen = moreBtn.getAttribute('aria-expanded') === 'true';
    moreBtn.setAttribute('aria-expanded', String(!isOpen));
    moreBtn.textContent = isOpen ? '+ Mais filtros' : '− Menos filtros';
    advanced.classList.toggle('is-open', !isOpen);
  });

  clearBtn.addEventListener('click', clearAll);
  emptyClear.addEventListener('click', clearAll);

  buildAvailableFilters();
  apply();
})();
