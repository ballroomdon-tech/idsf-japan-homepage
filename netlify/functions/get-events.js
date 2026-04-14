/**
 * Netlify Function: get-events
 * Notion「IDSF Japan 大会管理」データベースのプロキシ。
 * APIキーをサーバーサイドで保持し、フロントエンドに公開しない。
 *
 * Notionデータベース: collection://32c76c6b-6e51-4136-8a31-760498fd4c6c
 * データベースID: 7478a4a5-3e4b-42c1-8359-fe336f9546ee
 *
 * 環境変数（Netlify Dashboard > Site settings > Environment variables）:
 *   NOTION_API_KEY       : Notion Integration Token (secret_xxx...)
 *   NOTION_DATABASE_ID   : 7478a4a53e4b42c18359fe336f9546ee
 */

const NOTION_API_URL = 'https://api.notion.com/v1';

function extractText(richTextArray) {
  if (!richTextArray || richTextArray.length === 0) return '';
  return richTextArray.map(b => b.plain_text).join('');
}

function extractImageUrl(filesArray) {
  if (!filesArray || filesArray.length === 0) return null;
  const file = filesArray[0];
  if (file.type === 'file')     return file.file.url;
  if (file.type === 'external') return file.external.url;
  return null;
}

/**
 * Notion Files & Media型プロパティから、全ファイルを配列で取得する。
 * ページ単位のドキュメント（PDF等）を複数扱う用途。
 * 戻り値: [{ name, url }]
 */
function extractFiles(filesArray) {
  if (!filesArray || filesArray.length === 0) return [];
  return filesArray.map(f => {
    const url = f.type === 'file' ? f.file?.url
              : f.type === 'external' ? f.external?.url
              : null;
    return url ? { name: f.name || 'document', url } : null;
  }).filter(Boolean);
}

/**
 * Notionの各ページを、フロントエンドが期待する形式に変換する。
 * プロパティ名は「IDSF Japan 大会管理」データベースの実際の日本語名に対応。
 */
function transformEvent(page) {
  const p = page.properties;

  // ---- 開催日 ----
  const dateStart = p['開催日']?.date?.start || null;
  const dateEnd   = p['開催日']?.date?.end   || null;

  // ---- エントリー締切 ----
  const entryDeadline = p['エントリー締切']?.date?.start || null;

  // ---- カテゴリ (Select) ----
  // Notion値: 選手権大会 / オープン大会 / 国際大会 / 練習会・交流会
  const categoryRaw = p['カテゴリ']?.select?.name || '';

  // フロントエンドの表示用にマッピング
  const CATEGORY_MAP = {
    '選手権大会':    '全日本選手権',
    'オープン大会':  '国内大会',
    '国際大会':      '国際大会',
    '練習会・交流会': '練習会',
  };
  const category = CATEGORY_MAP[categoryRaw] || categoryRaw;

  // ---- 区分 (Multi-select) ----
  const division = (p['区分']?.multi_select || []).map(s => s.name);

  // ---- テキスト系 ----
  const entryFee   = extractText(p['エントリー費用']?.rich_text || []);
  const venue      = p['会場名']?.rich_text
    ? extractText(p['会場名'].rich_text)
    : (extractText(p['会場名']?.title || []));
  const venueText  = p['会場名']?.type === 'title'
    ? extractText(p['会場名'].title || [])
    : (extractText(p['会場名']?.rich_text || []));
  const address    = extractText(p['会場住所']?.rich_text || []);
  const fullVenue  = [venueText, address].filter(Boolean).join('　');
  const description = extractText(p['大会詳細']?.rich_text || []);
  const title      = extractText(p['大会名']?.title || []);

  // ---- URL ----
  const entryUrl  = p['エントリーURL']?.url || null;

  // ---- 画像（ポスター / バナー / サムネイル）----
  // 優先順:
  //   1. 「ポスター画像」(Files & Media型) — Notionに直接アップロードされた画像
  //   2. 「バナー画像URL」(URL型) — 外部URL
  //   3. 「サムネイル画像URL」(URL型) — 外部URL
  const posterFiles  = extractFiles(p['ポスター画像']?.files || []);
  const posterImage  = posterFiles[0]?.url || null;
  const flyerImage   = posterImage
                     || p['バナー画像URL']?.url
                     || p['サムネイル画像URL']?.url
                     || null;

  // ポスターギャラリー（複数枚ある場合はモーダル内でスライダー表示用）
  const posterImages = posterFiles.map(f => f.url);

  // ---- 表示順 ----
  const sortOrder = p['表示順']?.number ?? 999;

  // ---- 地域（国内: 都道府県+市区町村 / 国際: 国+都市）----
  const region = extractText(p['地域']?.rich_text || []);

  // ---- 資料（シラバス・大会要項等）----
  // Notion側のプロパティ対応:
  //   「シラバス」  Files & Media型 — 複数ファイル可
  //   「大会要項」  Files & Media型 — 複数ファイル可
  //   「資料URL」   URL型          — 外部リンク（NotionページやGoogle Drive）
  const documents = [];
  const syllabusFiles = extractFiles(p['シラバス']?.files || []);
  syllabusFiles.forEach(f => documents.push({
    label: f.name || 'シラバス',
    type:  'シラバス',
    url:   f.url,
  }));
  const guidelineFiles = extractFiles(p['大会要項']?.files || []);
  guidelineFiles.forEach(f => documents.push({
    label: f.name || '大会要項',
    type:  '大会要項',
    url:   f.url,
  }));
  const docsFiles = extractFiles(p['資料']?.files || []);
  docsFiles.forEach(f => documents.push({
    label: f.name || '資料',
    type:  '資料',
    url:   f.url,
  }));
  const docsUrl = p['資料URL']?.url || null;
  if (docsUrl) {
    documents.push({ label: '大会資料ページ', type: 'リンク', url: docsUrl });
  }

  return {
    id: page.id,
    title,
    dateStart,
    dateEnd,
    category,
    categoryRaw,
    division,
    entryFee,
    entryDeadline,
    entryUrl,
    venue: fullVenue,
    region,
    description,
    flyerImage,
    posterImages,
    sortOrder,
    documents,
    notionUrl: page.url,
  };
}

exports.handler = async function (event, context) {
  // CORS
  const origin = event.headers.origin || '';
  const allowedOrigins = [
    'https://idsf-japan.com',
    'https://www.idsf-japan.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8888',   // Netlify Dev
  ];
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://idsf-japan.com';

  const corsHeaders = {
    'Access-Control-Allow-Origin':  corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  const NOTION_API_KEY     = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    const response = await fetch(
      `${NOTION_API_URL}/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization:    `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type':   'application/json',
        },
        body: JSON.stringify({
          filter: {
            property: '公開ステータス',
            select: { equals: '公開' },
          },
          sorts: [
            { property: '表示順', direction: 'ascending' },
            { property: '開催日', direction: 'ascending' },
          ],
          page_size: 100,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Notion API error:', response.status, errText);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Notion API error', detail: errText }),
      };
    }

    const data   = await response.json();
    const events = data.results.map(transformEvent);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(events),
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
