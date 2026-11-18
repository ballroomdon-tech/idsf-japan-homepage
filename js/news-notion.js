/**
 * news-notion.js
 * Netlify Function (/.netlify/functions/get-news) からデータを取得し、
 * 一覧形式で描画。カードクリックでモーダルを表示する。
 */

(function () {
  'use strict';

  const API_URL = '/.netlify/functions/get-news';

  let _allNews = [];
  let _activeTag = 'all';

  /* ========== ユーティリティ ========== */

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function dateParts(str) {
    if (!str) return { year: '', month: '', day: '' };
    const d = new Date(str + 'T00:00:00');
    return { year: d.getFullYear(), month: MONTHS[d.getMonth()], day: d.getDate() };
  }

  function fmtDateJP(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    const DAYS = ['日','月','火','水','木','金','土'];
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${DAYS[d.getDay()]}）`;
  }

  /* ========== カードHTML ========== */

  function cardHTML(item) {
    const dp = dateParts(item.date);

    const tagsHTML = (item.tags || []).map(t =>
      `<span class="nw-card__tag">${esc(t)}</span>`).join('');
    const featuredBadge = item.featured
      ? `<span class="nw-card__featured-badge">PICKUP</span>` : '';

    const thumbHTML = item.thumbnail
      ? `<div class="nw-card__thumb"><img src="${esc(item.thumbnail)}" alt="" loading="lazy"></div>`
      : '';

    return `
    <article class="nw-card${item.featured ? ' nw-card--featured' : ''}" tabindex="0" role="button"
      aria-label="${esc(item.title)}の詳細を見る"
      data-news-id="${esc(item.id)}">
      <div class="nw-card__date">
        <span class="nw-card__date-year">${dp.year}</span>
        <span class="nw-card__date-day">${dp.day}</span>
        <span class="nw-card__date-month">${dp.month}</span>
      </div>
      ${thumbHTML}
      <div class="nw-card__body">
        <div class="nw-card__tags">${featuredBadge}${tagsHTML}</div>
        <h3 class="nw-card__title">${esc(item.title)}</h3>
        ${item.summary ? `<p class="nw-card__excerpt">${esc(item.summary)}</p>` : ''}
      </div>
      <svg class="nw-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </article>`.trim();
  }

  /* ========== 一覧描画 ========== */

  function emptyStateHTML(msg) {
    return `
      <div class="nw-status">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <path d="M22 6l-10 7L2 6"/>
        </svg>
        <p>${msg}</p>
      </div>`;
  }

  function showError() {
    const container = document.getElementById('nw-list-container');
    const loading = document.getElementById('nw-loading');
    if (loading) loading.remove();
    if (!container) return;
    container.innerHTML = `
      <div class="nw-status error" role="alert">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>お知らせを読み込めませんでした。しばらく経ってから再読み込みしてください。</p>
        <button class="btn btn--outline btn--sm" style="margin-top:1rem" onclick="location.reload()">再読み込み</button>
      </div>`;
  }

  function renderList() {
    const container = document.getElementById('nw-list-container');
    const loading = document.getElementById('nw-loading');
    if (!container) return;
    if (loading) loading.remove();

    const filtered = _activeTag === 'all'
      ? _allNews
      : _allNews.filter(n => (n.tags || []).includes(_activeTag));

    if (!filtered.length) {
      container.innerHTML = emptyStateHTML(
        _activeTag === 'all'
          ? '現在、お知らせはありません。'
          : '該当するタグのお知らせはまだありません。'
      );
      return;
    }

    const list = document.createElement('div');
    list.className = 'nw-list';
    list.innerHTML = filtered.map(cardHTML).join('');

    list.querySelectorAll('.nw-card').forEach(card => {
      const id = card.dataset.newsId;
      const item = filtered.find(n => n.id === id);
      if (!item) return;
      const open = () => openModal(item);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    container.innerHTML = '';
    container.appendChild(list);

    if (window.revealObserver) {
      list.querySelectorAll('.nw-card').forEach(el => window.revealObserver.observe(el));
    }
  }

  /* ========== フィルター ========== */

  function initFilters() {
    document.querySelectorAll('.nw-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nw-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _activeTag = btn.dataset.tag;
        renderList();
      });
    });
  }

  /* ========== モーダル ========== */

  let _prevFocus = null;

  function openModal(item) {
    const overlay = document.getElementById('nw-modal-overlay');
    const content = document.getElementById('nw-modal-content');
    if (!overlay || !content) return;

    _prevFocus = document.activeElement;

    const imgHTML = item.thumbnail
      ? `<img class="nw-modal__img" src="${esc(item.thumbnail)}" alt="${esc(item.title)}" loading="lazy">`
      : '';

    const tagsHTML = (item.tags || []).map(t =>
      `<span class="nw-modal__tag">${esc(t)}</span>`).join('');
    const featuredBadge = item.featured
      ? `<span class="nw-modal__featured-badge">PICKUP</span>` : '';

    const linkBtn = item.linkUrl
      ? `<a href="${esc(item.linkUrl)}" class="nw-modal__link-btn" target="_blank" rel="noopener noreferrer">
           詳しく見る
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
             <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
           </svg>
         </a>`
      : '';

    content.innerHTML = `
      ${imgHTML}
      <div class="nw-modal__body">
        <div class="nw-modal__tags">${featuredBadge}${tagsHTML}</div>
        ${item.date ? `<p class="nw-modal__date">${esc(fmtDateJP(item.date))}</p>` : ''}
        <h2 class="nw-modal__title" id="nw-modal-title">${esc(item.title)}</h2>
        ${item.summary ? `<p class="nw-modal__desc">${esc(item.summary)}</p>` : ''}
        ${linkBtn}
      </div>`;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      document.getElementById('nw-modal-close')?.focus();
    });
  }

  function closeModal() {
    const overlay = document.getElementById('nw-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    _prevFocus?.focus();
  }

  function initModal() {
    const overlay = document.getElementById('nw-modal-overlay');
    const closeBtn = document.getElementById('nw-modal-close');
    const modal = document.getElementById('nw-modal');
    if (!overlay || !closeBtn || !modal) return;

    overlay.setAttribute('aria-hidden', 'true');
    closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll(
        'a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ========== データ取得 ========== */

  async function loadNews() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const news = await res.json();
      if (!Array.isArray(news)) throw new Error('unexpected format');

      _allNews = news;
      renderList();

      const meta = document.getElementById('nw-meta');
      if (meta) {
        const now = new Date();
        meta.textContent = `最終更新: ${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      }
    } catch (err) {
      console.warn('get-news failed:', err.message);
      showError();
    }
  }

  /* ========== 初期化 ========== */

  function init() {
    initFilters();
    initModal();
    loadNews();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
