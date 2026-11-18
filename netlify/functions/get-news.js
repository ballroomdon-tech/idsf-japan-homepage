/**
 * Netlify Function: get-news
 * Notion「IDSF Japan お知らせ」データベースのプロキシ。
 * APIキーをサーバーサイドで保持し、フロントエンドに公開しない。
 *
 * Notionデータベース: collection://f870bc5f-8f0a-467f-8e61-bfe026a2f8ac
 * データベースID: c281738e5a1647cca31db2896d9e7dce
 *
 * 環境変数（Netlify Dashboard > Site settings > Environment variables）:
 *   NOTION_API_KEY            : Notion Integration Token（get-events.jsと共通）
 *   NOTION_NEWS_DATABASE_ID   : c281738e5a1647cca31db2896d9e7dce
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
 * Notionの各ページを、フロントエンドが期待する形式に変換する。
 * プロパティ名は「IDSF Japan お知らせ」データベースの実際の日本語名に対応。
 */
function transformNews(page) {
  const p = page.properties;

  const title = extractText(p['タイトル']?.title || []);
  const date  = p['日付']?.date?.start || null;
  const tags  = (p['タグ']?.multi_select || []).map(t => t.name);
  const summary = extractText(p['概要']?.rich_text || []);
  const linkUrl = p['詳細リンクURL']?.url || null;
  const thumbnail = extractImageUrl(p['サムネイル']?.files || []);
  const featured = p['注目記事']?.checkbox === true;

  return {
    id: page.id,
    title,
    date,
    tags,
    summary,
    linkUrl,
    thumbnail,
    featured,
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

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_NEWS_DATABASE_ID = process.env.NOTION_NEWS_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_NEWS_DATABASE_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_NEWS_DATABASE_ID');
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  try {
    const response = await fetch(
      `${NOTION_API_URL}/databases/${NOTION_NEWS_DATABASE_ID}/query`,
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
            { property: '日付', direction: 'descending' },
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

    const data = await response.json();
    const news = data.results.map(transformNews);

    // 注目記事を先頭に、それ以外は日付降順（Notion側のsortsで既に降順）
    news.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(news),
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
