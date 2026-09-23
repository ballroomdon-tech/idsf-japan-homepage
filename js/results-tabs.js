// 大会結果ページ: 大会タブ切り替え・カテゴリーフィルタ
// CSP (script-src 'self') によりインラインスクリプトは実行されないため外部ファイル化
(function() {
  // ========== 大会タブ切り替え ==========
  const meetTabs = document.querySelectorAll('.meet-tab');
  const meetSections = document.querySelectorAll('.meet-section');
  if (!meetTabs.length || !meetSections.length) return;

  // 非表示セクション内の data-reveal は IntersectionObserver が発火しないため、
  // 表示に切り替えたタイミングで強制的に .revealed を付与する。
  function revealSection(section) {
    if (!section) return;
    section.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
  }

  // 指定セクションのフィルタを All にリセット（カードを全表示に戻す）
  function resetSectionFilter(section) {
    if (!section) return;
    section.querySelectorAll('.results-filter__btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'all');
    });
    section.querySelectorAll('.result-card').forEach(c => { c.style.display = ''; });
    section.querySelectorAll('.results-grid').forEach(g => { g.style.display = ''; });
    section.querySelectorAll('.results-section-title').forEach(t => { t.style.display = ''; });
    const empty = section.querySelector('.results-empty');
    if (empty) empty.hidden = true;
  }

  function showMeet(target) {
    meetSections.forEach(sec => {
      const isTarget = sec.id === 'meet-' + target;
      sec.style.display = isTarget ? '' : 'none';
      if (isTarget) {
        revealSection(sec);
        resetSectionFilter(sec);
      }
    });
  }

  // 初期状態: 最新大会（第6回 STAR CUP）を表示
  meetTabs.forEach(t => {
    const on = t.dataset.meet === 'starcup20260922';
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  showMeet('starcup20260922');

  meetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.meet;
      meetTabs.forEach(t => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      showMeet(target);
    });
  });

  // ========== カテゴリーフィルタ ==========
  function applyFilter(filterBtns, meetId) {
    const section = document.getElementById('meet-' + meetId);
    if (!section) return;
    const emptyMsg = section.querySelector('.results-empty');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cards = section.querySelectorAll('.result-card');
        let visibleCount = 0;

        cards.forEach(card => {
          const tags = (card.dataset.tags || '').split(' ');
          const show = filter === 'all' || tags.includes(filter);
          card.style.display = show ? '' : 'none';
          if (show) visibleCount++;
        });

        section.querySelectorAll('.results-grid').forEach(grid => {
          const visible = Array.from(grid.querySelectorAll('.result-card'))
            .some(c => c.style.display !== 'none');
          const prev = grid.previousElementSibling;
          if (prev && prev.classList.contains('results-section-title')) {
            prev.style.display = visible ? '' : 'none';
          }
          grid.style.display = visible ? '' : 'none';
        });

        // 該当なしメッセージの表示制御
        if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
      });
    });
  }

  applyFilter(document.querySelectorAll('#meet-starcup20260922 .results-filter__btn'), 'starcup20260922');
  applyFilter(document.querySelectorAll('#meet-jc2026 .results-filter__btn'), 'jc2026');
  applyFilter(document.querySelectorAll('#meet-starcup2026 .results-filter__btn'), 'starcup2026');
})();
