# 大会関連ドキュメント（シラバス・要項）

このディレクトリは、各大会のシラバスPDF、大会要項、参加案内などの資料を配置する場所です。

## 使い方

### 1. 静的ファイルを直接配置する場合

1. PDFファイルをこのディレクトリに配置（例: `star-cup-shinjuku-2026-syllabus.pdf`）
2. `js/events-notion.js` 内の `FALLBACK` データ、または Notion DB の「資料」プロパティから
   `/docs/events/star-cup-shinjuku-2026-syllabus.pdf` のようなパスで参照する

### 2. Notion DBから参照する場合（推奨）

Notion「IDSF Japan 大会管理」DBに以下のプロパティを追加してください:

- **資料URL**（URL型） — 複数ファイルを扱う場合は1つのURLのみ（例: Notionページ、Google Driveフォルダ）
- **シラバス** （Files & Media型）— 直接PDFをアップロード
- **要項** （Files & Media型）— 直接PDFをアップロード

上記のいずれか設定されていれば、イベント詳細モーダルに「資料」セクションとして表示されます。

## 命名規則の推奨

```
{event-slug}-{year}-{doc-type}.pdf

例:
  star-cup-shinjuku-2026-syllabus.pdf
  star-cup-shinjuku-2026-guideline.pdf
  all-japan-championship-2026-syllabus.pdf
  italian-open-2026-info.pdf
```

## 注意事項

- ファイルサイズは可能な限り10MB以下に圧縮
- PDF/A形式またはWeb最適化PDFを推奨
- ファイル名に日本語・スペース・特殊文字を使用しない（URLエンコード問題回避）
