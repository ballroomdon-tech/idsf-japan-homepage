/**
 * events-notion.js
 * Netlify Function (/.netlify/functions/get-events) からデータを取得し、
 * カードグリッド形式で描画。カードクリックでモーダルを表示する。
 */

(function () {
  'use strict';

  const API_URL = '/.netlify/functions/get-events';

  const DOMESTIC_CATEGORIES = ['国内大会', '全日本選手権', '練習会'];
  const INTL_CATEGORIES     = ['国際大会', 'CSIT'];

  /* ---- フォールバック静的データ ---- */
  const FALLBACK = [
    {
      id: 'fb-1', title: 'Star Cup 新宿',
      dateStart: '2026-05-10', dateEnd: null,
      category: '国内大会', division: ['スタンダード', 'ラテン'],
      entryFee: 'エントリー費詳細は別途案内', entryDeadline: null, entryUrl: null,
      venue: '新宿コズミックセンター　東京都新宿区大久保3-1-2',
      region: '東京都 新宿区',
      description: 'IDSF Japan 主催のオープン大会。スタンダード・ラテン各部門で開催。初心者クラスからオープンクラスまで幅広い部門をご用意しています。',
      flyerImage: null,
      documents: [
        { label: 'シラバス（競技クラス別フィガー一覧）', type: 'シラバス', url: '/rules.html#syllabus' },
        { label: '大会ルール（年齢・クラス・審査方式 等）', type: '大会規程', url: '/rules.html' },
      ],
      isFallback: true,
    },
    {
      id: 'fb-2', title: '全日本ダンススポーツ選手権',
      dateStart: '2026-06-07', dateEnd: null,
      category: '全日本選手権', division: ['スタンダード', 'ラテン', '10ダンス'],
      entryFee: 'エントリー費詳細は別途案内', entryDeadline: null, entryUrl: null,
      venue: '東京ドームホテル B1F「天空」　東京都文京区後楽1-3-61',
      region: '東京都 文京区',
      description: 'IDSF Japan 主催の全日本選手権大会。日本一を決める最高峰の舞台。上位入賞者にはIDSF国際大会への推薦資格が与えられます。',
      flyerImage: null,
      documents: [
        { label: 'シラバス（競技クラス別フィガー一覧）', type: 'シラバス', url: '/rules.html#syllabus' },
        { label: '大会ルール（年齢・クラス・審査方式 等）', type: '大会規程', url: '/rules.html' },
      ],
      isFallback: true,
    },
    {
      id: 'fb-3', title: 'FEINDA — Italian Open 2026',
      dateStart: '2026-06-15', dateEnd: '2026-06-21',
      category: '国際大会', division: ['スタンダード', 'ラテン', '10ダンス'],
      entryFee: '詳細はお問い合わせください', entryDeadline: null, entryUrl: null,
      venue: 'Palacongressi di Cervia　Cervia (RA), Italia',
      region: 'Italy / Cervia',
      description: 'Festival Internazionale e Nazionale della Danza Sportiva。IDSF Japan が日本選手の出場をサポートします。',
      flyerImage: null,
      documents: [
        { label: 'IDSF シラバス（国際大会共通）', type: 'シラバス', url: '/rules.html#syllabus' },
      ],
      isFallback: true,
    },
  ];

  /* ========== ユーティリティ ========== */

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fmtDate(start, end) {
    if (!start) return '';
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const s = new Date(start + 'T00:00:00');
    const base = `${MONTHS[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
    if (end && end !== start) {
      const e = new Date(end + 'T00:00:00');
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${MONTHS[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
      }
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
    }
    return base;
  }

  function fmtDateJP(str) {
    if (!str) return '';
    const d = new Date(str + 'T00:00:00');
    const DAYS = ['日','月','火','水','木','金','土'];
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}（${DAYS[d.getDay()]}）`;
  }

  function isUrgent(deadline) {
    if (!deadline) return false;
    const diff = new Date(deadline + 'T00:00:00') - Date.now();
    return diff > 0 && diff < 30 * 86400 * 1000;
  }

  function badgeClass(category) {
    if (category === '全日本選手権') return 'ev-card__badge--championship';
    if (category === '国際大会' || category === 'CSIT') return 'ev-card__badge--international';
    return '';
  }

  function modalBadgeClass(category) {
    if (category === '全日本選手権') return 'ev-modal__badge--championship';
    if (category === '国際大会' || category === 'CSIT') return 'ev-modal__badge--international';
    return '';
  }

  /* ========== カードHTML ========== */

  function cardHTML(ev) {
    const dateStr = fmtDate(ev.dateStart, ev.dateEnd);

    // 地域バッジ（画像右下）
    const regionBadge = ev.region
      ? `<span class="ev-card__region" title="${esc(ev.region)}">
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
             <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
           </svg>
           ${esc(ev.region)}
         </span>`
      : '';

    const imgArea = ev.flyerImage
      ? `<div class="ev-card__img">
           <img src="${esc(ev.flyerImage)}" alt="${esc(ev.title)} フライヤー" loading="lazy">
           <span class="ev-card__badge ${badgeClass(ev.category)}">${esc(ev.category)}</span>
           ${regionBadge}
         </div>`
      : `<div class="ev-card__img">
           <div class="ev-card__img-placeholder">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
               <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
               <polyline points="21 15 16 10 5 21"/>
             </svg>
             <span>FLYER COMING SOON</span>
           </div>
           <span class="ev-card__badge ${badgeClass(ev.category)}">${esc(ev.category)}</span>
           ${regionBadge}
         </div>`;

    const divTags = (ev.division || []).map(d =>
      `<span class="ev-card__div-tag">${esc(d)}</span>`).join('');

    const docCount = (ev.documents || []).length;
    const docBadge = docCount > 0
      ? `<span class="ev-card__doc-icon" title="資料 ${docCount} 件">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
           </svg>
           資料 ${docCount}
         </span>`
      : '';

    return `
    <article class="ev-card" tabindex="0" role="button"
      aria-label="${esc(ev.title)}の詳細を見る"
      data-event-id="${esc(ev.id)}">
      ${imgArea}
      <div class="ev-card__body">
        <p class="ev-card__date">${esc(dateStr)}${docBadge}</p>
        <h3 class="ev-card__title">${esc(ev.title)}</h3>
        ${ev.venue ? `<p class="ev-card__venue">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          ${esc(ev.venue)}
        </p>` : ''}
        ${divTags ? `<div class="ev-card__divisions">${divTags}</div>` : ''}
      </div>
    </article>`.trim();
  }

  /* ========== グリッド描画 ========== */

  function renderGrid(containerId, loadingId, events, emptyMsg) {
    const container = document.getElementById(containerId);
    const loading   = document.getElementById(loadingId);
    if (!container) return;
    if (loading) loading.remove();

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="events-status">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>${emptyMsg}</p>
        </div>`;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'events-grid';
    grid.innerHTML = events.map(cardHTML).join('');
    container.innerHTML = '';
    container.appendChild(grid);

    // カードクリック → モーダル
    grid.querySelectorAll('.ev-card').forEach(card => {
      const id = card.dataset.eventId;
      const ev = events.find(e => e.id === id);
      if (!ev) return;

      const open = () => openModal(ev);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    // reveal アニメーション
    if (window.revealObserver) {
      grid.querySelectorAll('.ev-card').forEach(el => window.revealObserver.observe(el));
    }
  }

  function showError(containerId, loadingId) {
    const container = document.getElementById(containerId);
    const loading   = document.getElementById(loadingId);
    if (loading) loading.remove();
    if (!container) return;
    container.innerHTML = `
      <div class="events-status error" role="alert">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>データの取得に失敗しました。しばらく経ってから再読み込みしてください。</p>
        <button class="btn btn--outline btn--sm" style="margin-top:1rem" onclick="location.reload()">再読み込み</button>
      </div>`;
  }

  /* ========== モーダル ========== */

  let _prevFocus = null;

  function openModal(ev) {
    const overlay = document.getElementById('ev-modal-overlay');
    const content = document.getElementById('ev-modal-content');
    if (!overlay || !content) return;

    _prevFocus = document.activeElement;

    // 画像（メイン + ポスターギャラリー）
    const imgHTML = ev.flyerImage
      ? `<a class="ev-modal__img-link" href="${esc(ev.flyerImage)}" target="_blank" rel="noopener noreferrer" aria-label="画像を原寸で開く">
           <img class="ev-modal__img" src="${esc(ev.flyerImage)}" alt="${esc(ev.title)} ポスター" loading="lazy">
           <span class="ev-modal__img-zoom" aria-hidden="true">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
           </span>
         </a>`
      : `<div class="ev-modal__img-placeholder">
           <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.8" aria-hidden="true">
             <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`;

    // ポスターが複数枚ある場合のサムネギャラリー（2枚目以降）
    const extraPosters = (ev.posterImages || []).slice(1);
    const galleryHTML = extraPosters.length
      ? `<div class="ev-modal__gallery" role="region" aria-label="追加のポスター画像">
           ${extraPosters.map((url, i) => `
             <a class="ev-modal__gallery-item" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="ポスター ${i + 2} を開く">
               <img src="${esc(url)}" alt="${esc(ev.title)} ポスター ${i + 2}" loading="lazy">
             </a>`).join('')}
         </div>`
      : '';

    // 期間
    const dateStr = fmtDate(ev.dateStart, ev.dateEnd);

    // 締切
    const deadlineHTML = ev.entryDeadline
      ? `<tr>
           <th>締切</th>
           <td><span class="ev-modal__deadline-badge${isUrgent(ev.entryDeadline) ? ' urgent' : ''}">
             ${fmtDateJP(ev.entryDeadline)}${isUrgent(ev.entryDeadline) ? '　⚠ まもなく締切' : ''}
           </span></td>
         </tr>` : '';

    // 参加費
    const feeHTML = ev.entryFee
      ? `<tr><th>参加費</th><td>${esc(ev.entryFee)}</td></tr>` : '';

    // 区分
    const divHTML = (ev.division || []).length
      ? `<tr><th>種目</th><td>
           <div class="ev-modal__divisions">
             ${ev.division.map(d => `<span class="ev-modal__div-tag">${esc(d)}</span>`).join('')}
           </div>
         </td></tr>` : '';

    // 地域
    const regionHTML = ev.region
      ? `<tr><th>地域</th><td>
           <span class="ev-modal__region">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
             </svg>
             ${esc(ev.region)}
           </span>
         </td></tr>` : '';

    // 会場
    const venueHTML = ev.venue
      ? `<tr><th>会場</th><td>${esc(ev.venue)}</td></tr>` : '';

    // 資料セクション（シラバス・大会要項・その他PDF等）
    const docs = (ev.documents || []).filter(d => d && d.url);
    const docsHTML = docs.length
      ? `<div class="ev-modal__docs" role="region" aria-label="大会資料">
           <div class="ev-modal__docs-title">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
               <polyline points="14 2 14 8 20 8"/>
             </svg>
             大会資料
           </div>
           <ul class="ev-modal__docs-list">
             ${docs.map(d => {
               const isPdf = /\.pdf($|\?)/i.test(d.url);
               const icon = isPdf
                 ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <text x="7" y="17" font-size="6" font-weight="700" stroke="none" fill="currentColor">PDF</text>
                    </svg>`
                 : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>`;
               return `
                 <li>
                   <a class="ev-modal__doc-link" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">
                     <span class="ev-modal__doc-icon">${icon}</span>
                     <span class="ev-modal__doc-meta">
                       <span class="ev-modal__doc-label">${esc(d.label || d.type || 'ドキュメント')}</span>
                       ${d.type ? `<span class="ev-modal__doc-type">${esc(d.type)}${isPdf ? ' · PDF' : ''}</span>` : ''}
                     </span>
                     <svg class="ev-modal__doc-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                       <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
                     </svg>
                   </a>
                 </li>`;
             }).join('')}
           </ul>
         </div>`
      : '';

    // ボタン
    const entryBtn = ev.entryUrl
      ? `<a href="${esc(ev.entryUrl)}" class="ev-modal__entry-btn" target="_blank" rel="noopener noreferrer">
           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
             <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
           </svg>
           エントリーする
         </a>`
      : '';

    const fallbackNote = ev.isFallback
      ? `<p style="font-size:0.75rem;color:var(--color-text-light);margin-top:1rem;">
           ※ Notion接続設定後に最新情報へ自動更新されます。
         </p>` : '';

    content.innerHTML = `
      ${imgHTML}
      ${galleryHTML}
      <div class="ev-modal__body">
        <span class="ev-modal__badge ${modalBadgeClass(ev.category)}">${esc(ev.category)}</span>
        <h2 class="ev-modal__title" id="ev-modal-title">${esc(ev.title)}</h2>
        <table class="ev-modal__info" aria-label="大会詳細情報">
          <tbody>
            ${dateStr ? `<tr><th>開催日</th><td>${esc(dateStr)}</td></tr>` : ''}
            ${regionHTML}
            ${venueHTML}
            ${divHTML}
            ${feeHTML}
            ${deadlineHTML}
          </tbody>
        </table>
        ${ev.description ? `<p class="ev-modal__desc">${esc(ev.description)}</p>` : ''}
        ${docsHTML}
        <div class="ev-modal__actions">
          ${entryBtn}
          <a href="contact.html" class="ev-modal__contact-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            お問い合わせ
          </a>
        </div>
        ${fallbackNote}
      </div>`;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // フォーカスを閉じるボタンへ
    requestAnimationFrame(() => {
      document.getElementById('ev-modal-close')?.focus();
    });
  }

  function closeModal() {
    const overlay = document.getElementById('ev-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    _prevFocus?.focus();
  }

  function initModal() {
    const overlay = document.getElementById('ev-modal-overlay');
    const closeBtn = document.getElementById('ev-modal-close');
    const modal   = document.getElementById('ev-modal');
    if (!overlay || !closeBtn || !modal) return;

    overlay.setAttribute('aria-hidden', 'true');

    closeBtn.addEventListener('click', closeModal);

    // オーバーレイ背景クリックで閉じる
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    // Escキーで閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });

    // フォーカストラップ
    modal.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll(
        'a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ========== タブ ========== */

  function initTabs() {
    document.querySelectorAll('.events-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.events-tab-btn').forEach(b => {
          b.classList.remove('active'); b.setAttribute('aria-selected','false');
        });
        document.querySelectorAll('.events-tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected','true');
        const panel = document.getElementById(`tab-${btn.dataset.tab}`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ========== データ取得 ========== */

  async function loadEvents() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = await res.json();
      if (!Array.isArray(events)) throw new Error('unexpected format');

      const domestic = events.filter(e => DOMESTIC_CATEGORIES.includes(e.category));
      const intl     = events.filter(e => INTL_CATEGORIES.includes(e.category));

      renderGrid('events-domestic',      'loading-domestic',      domestic, '現在登録されている国内大会はありません。');
      renderGrid('events-international', 'loading-international', intl,     '現在登録されている国際大会はありません。');

      const meta = document.getElementById('events-meta');
      if (meta) {
        const now = new Date();
        meta.textContent = `最終更新: ${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      }

    } catch (err) {
      console.warn('API failed, using fallback:', err.message);
      const domestic = FALLBACK.filter(e => DOMESTIC_CATEGORIES.includes(e.category));
      const intl     = FALLBACK.filter(e => INTL_CATEGORIES.includes(e.category));
      renderGrid('events-domestic',      'loading-domestic',      domestic, '現在登録されている国内大会はありません。');
      renderGrid('events-international', 'loading-international', intl,     '現在登録されている国際大会はありません。');
      const meta = document.getElementById('events-meta');
      if (meta) meta.textContent = '（暫定表示中 — Notion接続設定後に自動更新）';
    }
  }

  /* ========== 初期化 ========== */

  function init() {
    initTabs();
    initModal();
    loadEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
