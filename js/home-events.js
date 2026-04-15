/**
 * home-events.js
 * トップページ「Upcoming Events」セクション用。
 * Events と同じ Netlify Function (/.netlify/functions/get-events) から
 * データを取得し、本日以降の開催日の直近3件を描画する。
 * 取得に失敗した場合は静的フォールバックデータを表示する。
 */

(function () {
  'use strict';

  console.log('[home-events] script loaded, readyState=', document.readyState);
  const API_URL = '/.netlify/functions/get-events';
  const MAX_ITEMS = 3;

  const FALLBACK = [
    {
      id: 'home-fb-1',
      title: 'Star Cup 新宿',
      dateStart: '2026-05-10', dateEnd: null,
      category: '国内大会',
      venue: '新宿コズミックセンター',
      description: 'IDSF公認の国内コンペティション。スタンダード・ラテン各種目を実施します。',
    },
    {
      id: 'home-fb-2',
      title: '全日本ダンススポーツ選手権',
      dateStart: '2026-06-07', dateEnd: null,
      category: '全日本選手権',
      venue: '東京ドームホテル B1F「天空」',
      description: 'IDSF Japan 主催の全日本選手権大会。日本一を決める最高峰の舞台です。',
    },
    {
      id: 'home-fb-3',
      title: 'FEINDA — Italian Open 2026',
      dateStart: '2026-06-15', dateEnd: '2026-06-21',
      category: '国際大会',
      venue: 'イタリア',
      description: 'IDSF National & International Championships の2部構成。7日間の大規模国際大会です。',
    },
  ];

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDateJP(start, end) {
    if (!start) return '';
    const pad = n => String(n).padStart(2, '0');
    const s = new Date(start + 'T00:00:00');
    const sStr = `${s.getFullYear()}.${pad(s.getMonth() + 1)}.${pad(s.getDate())}`;
    if (end && end !== start) {
      const e = new Date(end + 'T00:00:00');
      if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
        return `${sStr}-${pad(e.getDate())}`;
      }
      return `${sStr} – ${e.getFullYear()}.${pad(e.getMonth() + 1)}.${pad(e.getDate())}`;
    }
    return sStr;
  }

  /** 未来（今日以降）かつ開催日昇順で直近 MAX_ITEMS 件を返す */
  function pickUpcoming(events) {
    const todayStr = (() => {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    })();

    return (events || [])
      .filter(ev => ev && ev.dateStart)
      .filter(ev => (ev.dateEnd || ev.dateStart) >= todayStr)
      .sort((a, b) => (a.dateStart < b.dateStart ? -1 : a.dateStart > b.dateStart ? 1 : 0))
      .slice(0, MAX_ITEMS);
  }

  function cardHTML(ev, idx) {
    const dateStr = fmtDateJP(ev.dateStart, ev.dateEnd);
    const venueLine = ev.venue
      ? `会場：${esc(ev.venue)}<br>`
      : '';
    const desc = ev.description ? esc(ev.description) : '';
    return `
      <div class="card" data-reveal data-reveal-delay="${idx}">
        <div class="card-meta">
          <span>${esc(dateStr)}</span>
          <span>|</span>
          <span>${esc(ev.category || '大会')}</span>
        </div>
        <h3>${esc(ev.title)}</h3>
        <p>${venueLine}${desc}</p>
      </div>`;
  }

  function render(events) {
    const container = document.getElementById('home-events-grid');
    if (!container) return;
    const items = pickUpcoming(events);
    if (items.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:var(--color-text-on-dark-muted);grid-column: 1 / -1;">現在、公開中の大会情報はありません。</p>`;
      return;
    }
    container.innerHTML = items.map(cardHTML).join('');
    // reveal
    if (window.revealObserver) {
      container.querySelectorAll('[data-reveal]').forEach(el => window.revealObserver.observe(el));
    }
  }

  async function load() {
    try {
      const res = await fetch(API_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = await res.json();
      if (!Array.isArray(events)) throw new Error('unexpected format');
      render(events);
    } catch (err) {
      console.warn('[home-events] API failed, using fallback:', err.message);
      render(FALLBACK);
    }
  }

  // 実行タイミングを確実にする：DOMContentLoaded を待たず即実行
  // （script はページ末尾にあるため DOM は既に揃っている想定）
  function start() {
    try {
      load();
    } catch (e) {
      console.error('[home-events] start failed:', e);
      render(FALLBACK);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    // 既にDOM構築済み → 即実行
    start();
  }
})();
