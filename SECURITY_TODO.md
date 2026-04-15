# IDSF Japan — セキュリティ対策 TODO

最終更新: 2026-04-16

## ✅ 実装完了

### インフラ・ドメイン・メール
- **Cloudflare Registrar 取得**：idsf-japan.com（2026-04-02取得）
- **Transfer Lock**：ロック済み（ICANN規則により60日間解除不可、標準状態）
- **WHOIS Privacy**：有効（登録者情報の非公開）
- **自動更新**：ON
- **DNSSEC**：有効化済み
- **Cloudflare Email Routing**：設定済み（受信→Gmail転送）
- **SPF レコード**：`v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all`
- **DKIM**：Cloudflare発行済み、Gmail送信時はGmailが自動署名
- **DMARC**：`p=none`（モニタリングモード）、Cloudflare DMARC Managementで集計中
- **Gmail送信エイリアス**：`@idsf-japan.com` 追加済み、アプリパスワード設定済み
- **mail-tester.com スコア**：**10/10 パーフェクト**

### アカウント
- **Cloudflareアカウント 2FA**：（有効化済みの想定・未確認なら再確認）
- **GitHubアカウント 2FA + パスキー**：有効化済み

### コード・セキュリティヘッダー
- **HSTS**（31536000秒・includeSubDomains・preload）
- **CSP**：以下まで厳格化済み
  - `script-src 'self'`（`'unsafe-inline'` 削除完了、JSON-LDは対象外なので問題なし）
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`（インラインstyle属性のため当面`'unsafe-inline'`維持）
  - `object-src 'none'`
  - `upgrade-insecure-requests`
  - `frame-ancestors 'none'`
  - `form-action 'self'`
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy（カメラ・マイク・位置情報・FLoC等すべて無効化）
- COOP/CORP: same-origin
- `.env` / `.git/*` のアクセスブロック
- インラインJS排除（rules.htmlのタブ → `js/rules-tabs.js`）
- `onclick` 等のインラインイベントハンドラ全廃

### お問い合わせフォーム
- **Formspreeから Netlify Forms へ移行**（外部依存削減・CSP厳格化・月100通無料枠）
- Honeypot（`bot-field`）実装
- `data-netlify-honeypot` 属性でNetlify標準のbot対策も適用
- `thanks.html`（送信完了ページ）作成

### プライバシーポリシー
- 外部サービス（Netlify / Cloudflare / Google / Notion）明示
- 海外への情報移転について明記
- 保管期間（3年）明記
- 未成年者対応、開示・訂正・削除手続き明記

---

## 🔴 残タスク：Daigoさん側で対応が必要

### 1. Netlify デプロイ（最優先）

コード修正を反映するため本番デプロイが必要。Netlify Formsは**デプロイ時にHTMLを解析して有効化**されるため、ローカルでは動作確認できない。

### 2. Netlify Forms 通知設定

デプロイ後：
- Netlifyダッシュボード → 対象サイト → Forms タブ
- `contact` フォームが認識されているか確認
- Settings & usage → Form notifications → Email notification
- 通知先：`info@idsf-japan.com` または受信したいアドレス

### 3. 本番動作確認

- デプロイ済みサイトの `/contact.html` からテスト送信
- `/thanks.html` に遷移するか確認
- Netlifyダッシュボードで送信内容が記録されているか確認
- Gmailに通知メールが届くか確認

### 4. Formspree アカウント整理（任意）

不要になったので：
- https://formspree.io/forms にログイン
- `IDSF Japan Contact Form`（ID: xgoronya）を削除
- アカウント削除も可（無料なので放置でも費用負担はなし）

---

## 🟡 優先度2：今週〜来週で対応

### パスワードマネージャー導入
1Password / Bitwarden / Dashlane 等で：
- サービスごとに異なる強いパスワード
- 復旧コード・2FAバックアップも安全に保管

### DMARC ポリシーの段階的厳格化
1. 現在 `p=none`（モニタリング）
2. Cloudflare DMARC Management で1〜2週間レポート観察
3. 異常なし → `p=quarantine`（疑わしいメールを隔離）
4. さらに1ヶ月観察 → `p=reject`（失敗メールを拒否）

---

## 🟢 優先度3：中長期で改善

### Google Fonts の self-host 化
現状：Google Fonts を外部CDNから読み込み
- 改善案：Noto Sans JP / Raleway を `fonts/` にダウンロード、ローカル配信
- メリット：
  - プライバシー（Googleにアクセスログが残らない）
  - パフォーマンス（DNS解決・接続削減）
  - CSP厳格化（`https://fonts.googleapis.com` を削除可能）
  - SRI（Subresource Integrity）適用可能
- デメリット：フォントファイル合計 400KB〜1MB 程度の追加、全9ページのlink書き換え

### インラインstyle属性の排除
- 各HTMLに残っている `style="..."` をCSSクラス化
- これが完了すれば `style-src` からも `'unsafe-inline'` を削除可能

### プライバシーポリシーの継続的見直し
- 新たな外部サービス追加時の追記
- Google Analytics 導入時にCookie同意バナー追加検討

### Netlify Functions のセキュリティ
`netlify/functions/` で Notion API を使用中：
- 環境変数（APIキー）はNetlifyダッシュボードの「Environment variables」で管理
- ソースコードにハードコードしない
- Rate limiting（IPごとの呼出制限）を実装検討

---

## 🔁 定期点検（年1〜2回）

- [ ] [securityheaders.com](https://securityheaders.com/) でヘッダーチェック（A+目標）
- [ ] [Mozilla Observatory](https://observatory.mozilla.org/) で総合診断
- [ ] [SSL Labs](https://www.ssllabs.com/ssltest/) でTLS設定確認（A+目標）
- [ ] [mail-tester.com](https://www.mail-tester.com/) でメール送信スコア再確認
- [ ] ドメイン有効期限の確認（自動更新ON推奨）
- [ ] Netlify / GitHub / Cloudflare の請求・ログイン履歴確認
- [ ] DMARC レポートの確認（Cloudflare DMARC Management）
- [ ] 依存ライブラリのバージョン確認（Netlify Functions）

---

## 📝 インシデント発生時の連絡先メモ

- Netlifyサポート：https://www.netlify.com/support/
- Cloudflareサポート：https://www.cloudflare.com/support/
- 日本のサイバー警察（都道府県警サイバー犯罪相談窓口）
- 個人情報保護委員会：https://www.ppc.go.jp/

---

## 📄 参考：デプロイ時のチェック

デプロイ後、以下のチェックリストで確認：

- [ ] 全ページが正しく表示される
- [ ] ナビゲーションが全ページで機能
- [ ] お問い合わせフォーム送信テスト
- [ ] thanks.html への遷移
- [ ] Netlify Dashboard の Forms タブでフォーム認識
- [ ] 通知メール受信確認
- [ ] 開発者ツールの Console にCSPエラーが出ていない
- [ ] securityheaders.com で A+ スコア取得
