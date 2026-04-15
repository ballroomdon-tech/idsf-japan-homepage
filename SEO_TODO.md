# IDSF Japan — SEO 残タスク

最終更新: 2026-04-16

即時対応済み（今回実施）:
- A. OG画像（og-image.jpg/png, 1200×630, 日本語対応）
- B. 各ページの title / meta description 最適化（社交ダンス / ダンススポーツ / Star Cup / Italian Open 等のキーワード）
- D. FAQ構造化データ（FAQPage JSON-LD）と可視FAQセクション（contact.html）
- F. sitemap.xml の lastmod 更新（2026-04-16）

---

## 要対応（優先度順）

### 1. Google Search Console / Bing Webmaster Tools 登録
- デプロイ後、Search Console にドメイン所有権登録（DNS TXT か HTML tag）
- sitemap.xml を送信: https://idsf-japan.com/sitemap.xml
- Bing Webmaster にも同様に登録
- カバレッジ / パフォーマンスの週次チェック体制を作る

### 2. 個別イベント詳細ページの生成（C）
- 現在 events.html はタブ式一覧のみ。個別URL（例: /events/star-cup-shinjuku-2026）がない
- Netlify Build 時に Notion API から静的ページを生成する方式が有力
  - 候補: eleventy / astro / 自前の Node スクリプト
  - 各イベントに SportsEvent JSON-LD、独自 OG、sitemap.xml への自動追加
- 目的: イベント名の検索流入、リッチリザルト、SNS共有時の個別カード

### 3. 既存画像の WebP 化（E）
- /images 以下の .jpg / .png を WebP に変換（cwebp -q 80）
- `<picture>` で fallback を残す形
- og-image は FB/Twitter 互換のため jpg を残す

### 4. コンテンツマーケティング（ブログ / 記事）
想定トピック:
- 社交ダンスとダンススポーツの違い
- IDSF シラバスとは何か
- 海外ダンス大会への参加方法（パスポート、エントリー、服装）
- 車いすダンス入門
- Star Cup 新宿 観戦ガイド
- 全日本選手権の見どころ
- ダンス初心者のための最初の一歩
- ジュニア / シニアのダンス
- 審査基準の読み方
- ドレスコード早わかり（クラス別）

### 5. 内部リンク強化
- トップ → 各主要ページへの導線はあるが、ページ間クロスリンクが弱い
- rules.html の各セクションから events.html へ / events から rules#syllabus へ など相互参照を増やす
- footer にサイトマップ的リンクを追加検討

### 6. ローカルSEO / LocalBusiness schema / Google ビジネスプロフィール
- 法人登記完了後、所在地を公開できる段階で LocalBusiness JSON-LD を追加
- Google ビジネスプロフィール登録（SportsClub カテゴリ）
- NAP（Name / Address / Phone）の一貫性

### 7. パンくず（Breadcrumbs）の統一
- 現在 events / about にはパンくずあり、rules / contact には未設置
- BreadcrumbList JSON-LD もセットで追加

### 8. hreflang / 英語ページ
- IDSF は国際組織なので英語圏からの被リンク獲得可能性あり
- トップページだけでも /en/ を用意し、`<link rel="alternate" hreflang="en">` を相互設定
- 代表挨拶・理念・大会情報の英語化

### 9. Core Web Vitals モニタリング
- Lighthouse / PageSpeed Insights で月次計測
- LCP画像（hero）に `fetchpriority="high"` 付与済みか確認
- 未使用CSS/JSの削減、font-display: swap 確認

### 10. 被リンク戦略
- ダンス関連メディア、スポーツ団体、自治体の文化事業ページへの掲載依頼
- プレスリリース配信（PR TIMES 等）をイベント前に
- SNSからのソーシャルシグナル強化

---

## 運用ルール
- 大きなコンテンツ変更時は sitemap.xml の lastmod を更新
- 新規ページ追加時は sitemap.xml / footer / breadcrumbs の3点をセット更新
- タイトル・ディスクリプションは60字 / 120字を目安に
