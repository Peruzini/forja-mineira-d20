(function (window, wp) {
  'use strict';

  if (!wp || !wp.hooks || !window.fmgRankMathAnalysis) {
    return;
  }

  const analysisContent = window.fmgRankMathAnalysis.content || '';

  wp.hooks.addFilter(
    'rank_math_content',
    'forja-mineira-guias/hub-content',
    function (content) {
      if (!analysisContent) {
        return content;
      }

      return (content || '') + '\n' + analysisContent;
    }
  );

  function refreshRankMathContent() {
    if (
      window.rankMathEditor &&
      typeof window.rankMathEditor.refresh === 'function'
    ) {
      window.rankMathEditor.refresh('content');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(refreshRankMathContent, 250);
    });
  } else {
    window.setTimeout(refreshRankMathContent, 250);
  }
})(window, window.wp);
