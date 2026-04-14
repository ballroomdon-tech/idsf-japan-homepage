# Notion連携 — 残りの手順（Daigoさん作業）

**現状（2026-04-14 時点）**

サイト側の実装・Notionデータベース・レコード投入はすべて完了済みです。
あとは **Notionと Netlify を API キーで接続** するだけで、Events ページに自動反映されます。

---

## 残作業（3ステップ・所要約10分）

### ステップ1. Notion Integration を作成して API キーを取得

1. https://www.notion.so/my-integrations を開く
2. 「**+ New integration**」をクリック
3. 名前を入力（例: `IDSF Japan Website`）
4. Associated workspace: Daigoさんのワークスペースを選択
5. Type: **Internal**（デフォルト）のまま「Save」
6. 次の画面で **Internal Integration Secret**（`secret_` または `ntn_` で始まる文字列）が表示される → **コピー**

---

### ステップ2. データベースに Integration を接続

1. Notion で「**IDSF Japan 大会管理**」データベースを開く
   - 場所: DanceBoard > IDSF Japanサイト最終レビュー・公開準備 > タスク・TODO > IDSF Japan 大会管理
2. 右上「**…**」→「**接続を追加**」(Connections)
3. ステップ1で作成した `IDSF Japan Website` を選択して承認

---

### ステップ3. Netlify に環境変数を設定

1. Netlify Dashboard → IDSF Japan サイト → **Site settings** → **Environment variables**
2. 「**Add a variable**」で以下を2つ追加:

| Key | Value |
|---|---|
| `NOTION_API_KEY` | ステップ1でコピーした secret キー |
| `NOTION_DATABASE_ID` | `7478a4a53e4b42c18359fe336f9546ee` |

3. **Deploys** タブ →「**Trigger deploy**」→「Clear cache and deploy site」でデプロイ

---

## 確認方法

デプロイ完了後、https://idsf-japan.com/events を開いて以下を確認:

- 「読み込んでいます…」が消えて大会カードが表示される
- **国内大会タブ**: Star Cup 新宿 / 全日本ダンススポーツ選手権
- **国際大会タブ**: FEINDA Italian Open / Koper / CSIT World Championships × 3
- カードをクリックするとモーダルで詳細が開く

もしカードが表示されず「暫定表示中」と出る場合は、Netlify Functions のログ（Netlify Dashboard → Functions → `get-events` → Recent invocations）でエラー内容を確認。

---

## 運用（大会情報の更新）

Netlify接続後は、**Notion の DB を編集するだけ**で自動反映されます（最大5分キャッシュ）。

- **新しい大会を追加**: DBに新規行を追加し、公開ステータスを「公開」に
- **一時非表示**: 公開ステータスを「非公開」または「準備中」に
- **並び順変更**: 「表示順」の数字を変更（小さい数字が先）
- **フライヤー画像**: 画像を外部URL（Google Drive公開リンク等）にして「バナー画像URL」に貼付
  - ⚠ Notion内アップロードは7日で失効するため外部URL推奨

即時反映したい場合は Netlify Dashboard → Deploys →「Trigger deploy」で手動デプロイ。

---

## 投入済みレコード（7件）

| 表示順 | 大会名 | 開催日 | カテゴリ |
|---|---|---|---|
| 1 | Star Cup 新宿 | 2026/5/10 | オープン大会 |
| 2 | 全日本ダンススポーツ選手権 | 2026/6/7 | 選手権大会 |
| 3 | FEINDA — Italian Open 2026 | 2026/6/15–21 | 国際大会 |
| 4 | International Championships — Koper | 2026/10/8–11 | 国際大会 |
| 5 | CSIT World Championships & World Cup (Section 1) | 2026/10/16–17 | 国際大会 |
| 6 | CSIT World Championships (Section 2) | 2026/10/30–11/1 | 国際大会 |
| 7 | CSIT World Championships (Section 3) | 2026/11/20–22 | 国際大会 |
