<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }
?>
<div class="fmmg-guide" id="forja-guia-magias-bruxo-2024">
<div class="site-shell">
  <section class="hero" aria-label="Hero do guia">
    <div class="hero-copy">
      <div class="eyebrow">Forja Mineira D20 · Guia de Bruxo</div>
      <h1>Melhores Magias para Bruxo</h1>
      <p>Um navegador prático para comparar as magias de Bruxo de D&D 5e 2024: regras, função, sinergias, custo de oportunidade e o momento em que cada escolha realmente entrega valor.</p>
      <div class="hero-badges"><span>D&D 5e 2024</span><span>91 Core</span><span>3 Heroes of Faerûn</span><span>94 magias</span></div>
    </div>
  </section>

<div class="catalog-intro">
    <span class="section-kicker">CATÁLOGO INTERATIVO</span>
  </div>

  <section class="catalog" id="fmmg-catalogo">
    <div class="catalog-head">
      <div class="catalog-top">
        <div class="search-wrap"><input class="search" id="fmmg-search" placeholder="Buscar magia, função ou efeito…" autocomplete="off"></div>
        <button class="mobile-filter-btn" id="fmmg-openFilters">Filtros</button>
        <div class="result-meta"><strong id="fmmg-resultCount">94 resultados</strong><span id="fmmg-activeState">Todos os filtros</span></div>
        <button class="clear-btn" id="fmmg-clearFilters">Limpar filtros</button>
      </div>

      <div class="filter-groups" id="fmmg-desktopFilters">
        <div class="function-school-row">
          <div class="filter-row"><div class="filter-label">Função</div><div class="pills" id="fmmg-functionPills"></div></div>
          <div class="filter-row"><div class="filter-label">Escola</div><div class="pills" id="fmmg-schoolPills"></div></div>
        </div>
        <div class="filter-row"><div class="filter-label">Fonte</div><div class="pills" id="fmmg-sourcePills"></div></div>
        <div class="desktop-level-priority">
          <div class="filter-row"><div class="filter-label">Nível</div><div class="pills" id="fmmg-levelPills"></div></div>
          <div class="filter-row"><div class="filter-label">Prioridade</div><div class="pills" id="fmmg-priorityPills"></div></div>
        </div>
      </div>
    </div>

    <div class="workspace">
      <div class="master">
        <div class="master-head"><span>Magia</span><span>Nível</span><span>Prioridade</span></div>
        <div class="spell-list" id="fmmg-spellList"></div>
        <div class="empty" id="fmmg-emptyState"><strong>Nenhuma magia encontrada</strong><p>Os filtros atuais não encontram registros na base.</p><button id="fmmg-emptyReset">Limpar filtros</button></div>
      </div>
      <div class="detail-wrap"><article class="fmmg-detail-card"><div class="detail" id="fmmg-detail"></div></article></div>
    </div>
  </section>
<?php
/**
 * Slot estrutural do Cluster de Bruxo.
 * O Guia continua funcional se o plugin Clusters estiver desativado;
 * nesse caso, do_action() simplesmente não renderiza o módulo.
 */
do_action( 'forja_d20_cluster_slot', 'bruxo', 'magias' );
?>

</div>

<div class="sheet-backdrop" id="fmmg-backdrop"></div>

<div class="mobile-filter-sheet" id="fmmg-filterSheet" aria-hidden="true">
  <div class="sheet-grip"></div>
  <div class="sheet-header"><strong>Filtros</strong><button class="sheet-close" data-close="filters">×</button></div>
  <div class="sheet-body">
    <div class="filter-row"><div class="filter-label">Função</div><div class="pills" id="fmmg-mFunctionPills"></div></div>
    <div class="filter-row"><div class="filter-label">Escola</div><div class="pills" id="fmmg-mSchoolPills"></div></div>
    <div class="filter-row"><div class="filter-label">Fonte</div><div class="pills" id="fmmg-mSourcePills"></div></div>
    <div class="filter-row"><div class="filter-label">Nível</div><div class="pills" id="fmmg-mLevelPills"></div></div>
    <div class="filter-row"><div class="filter-label">Prioridade</div><div class="pills" id="fmmg-mPriorityPills"></div></div>
    <button class="clear-btn" id="fmmg-mClearFilters" style="width:100%;justify-content:center">Limpar filtros</button>
  </div>
</div>

<div class="mobile-detail-sheet" id="fmmg-detailSheet" aria-hidden="true">
  <div class="sheet-grip"></div>
  <div class="sheet-header"><strong>Detalhes da magia</strong><button class="sheet-close" data-close="detail">×</button></div>
  <div id="fmmg-mobileDetail"></div>
</div>
</div>