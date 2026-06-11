<div align="center">

<img src="./assets/banner.gif" alt="VisaLark — open-source US visa appointment monitor" width="100%" />

# VisaLark · 签证云雀

[English](./README.md) · **日本語** · [한국어](./README.ko.md) · [中文](./README.zh.md)

**オープンソースの、アカウント安全な米国ビザ予約モニター。パスワードを保存せず、CAPTCHA を回避せず、プロキシ軍拡競争に参加しない。**

[![tests](https://img.shields.io/badge/tests-101%20passing-2fae6a)]() [![license](https://img.shields.io/badge/license-Apache--2.0-6b8cff)](./LICENSE) [![made with](https://img.shields.io/badge/TypeScript-strict-3178c6)]()

[機能](#-機能) · [アカウントを守る仕組み](#%EF%B8%8F-アカウントを守る仕組み) · [インストール](#-インストール) · [qmq との比較](#-正直な比較) · [免責事項](#%EF%B8%8F-免責事項)

</div>

---

## これは何か

VisaLark は `ais.usvisa-info.com`（CGI Federal）上の<strong>あなた自身</strong>のビザ予約の空き枠を監視します。条件に合う枠が見つかると WeChat / iOS / Telegram に<strong>即座に通知</strong>し、オプションで<strong>ワンタップで予約変更</strong>、または厳格なセーフティロックの下で<strong>自動予約変更</strong>ができます。

できること・できないことを<strong>正直に</strong>伝えます：

- ✅ 見逃していたはずの枠を捕捉します —— 特に混雑の少ない領事館、より早い任意の日付、緊急枠など。
- ✅ 複数の領事館を同時に監視し、「受け入れ可能な都市の中で最も早い枠」を取ります。
- ✅ アカウント安全第一：ブラウザでログイン済みのセッションを再利用します。パスワードを保存せず、フィンガープリントを偽装せず、CAPTCHA を回避しません。
- ❌ 最も人気の枠を「秒速で確保」することは<strong>約束しません</strong>。30 秒で消えるような枠は、有料の住宅用プロキシ群でしか勝てません —— それは qmq が月に巨額を投じ、有料化を強いられ、アカウント停止やリポジトリ削除を招く軍拡競争です。<strong>私たちはその戦いに参加しません。</strong>

> なぜこの設計なのか？ [アカウントを守る仕組み](#%EF%B8%8F-アカウントを守る仕組み) を参照。完全な脅威モデルは [DESIGN.md](./DESIGN.md) にあります。

## ✨ 機能

| 機能 | 説明 |
|------|------|
| 🎯 **複数領事館の最早枠** | 1 つのモニターで複数の領事館を監視し、フィルタに合う最早日を自動取得 |
| 🔔 **ワンタップ確認** | 通知にボタンが付き、タップするとログイン済みのウォームセッションで <1 秒で予約変更（人間が関与・コンプライアント） |
| 🤖 **自動予約変更（オプション）** | デフォルト無効。有効化時は複数のロックで保護：より早い枠のみ・許可した領事館のみ・最初の N 回は手動確認・1 日上限・キルスイッチ・ドライラン |
| 📅 **日付 / 曜日 / 時間帯フィルタ** | 受け入れ可能な範囲だけ通知し、ノイズを排除 |
| 📡 **マルチチャネル通知** | Bark (iOS) · ServerChan (WeChat) · Telegram · Webhook (WeCom/Discord) · ブラウザネイティブ。高優先度は全チャネルへ同時送信 |
| 🚑 **緊急枠の監視** | 緊急渡航向けに expedite カレンダーを監視 |
| 🔑 **セッション健全性チェック** | セッション期限切れ / チャレンジ検出 → 直ちに停止し再同期を依頼。決して強行しない |
| 📊 **空き履歴 + ヒートマップ** | オプションのコントロールパネルが空き履歴を記録し、「どの時間帯に枠が出やすいか」を学習 |

## 🛡️ アカウントを守る仕組み

米国ビザシステムは<strong>ユーザー単位の行動 ML</strong> + Cloudflare + reCAPTCHA を使用します。最も致命的な停止シグナルはポーリング頻度<strong>ではなく</strong>、<strong>ASN / 不可能な移動の不一致</strong>です：

> 住宅用ネットワークからログインしたのに、同じセッションが米国のデータセンター IP から `/days/*.json` を叩く —— これは教科書的な「アカウント乗っ取り / 自動化」の兆候で、<strong>あなたの本物のビザアカウントを速やかに停止</strong>させます（異議申し立ては遅く、渡航を逃し、ビザ費用を無駄にする恐れ）。

そこで VisaLark は<strong>2 層アーキテクチャ</strong>を採用します：

```
┌─── あなたの住宅用ネットワーク（データプレーン：ビザサイトに触れる唯一の部分）───┐
│  ブラウザ拡張（推奨・初心者向け）  または  ローカル Agent（24x7 のギーク向け）  │
│  → 本物のログインセッション・住宅用 IP・本物のブラウザ指紋を再利用              │
│  → パスワード保存ゼロ・CAPTCHA 解読ゼロ・プロキシゼロ                          │
└────────────────────────────────┬──────────────────────────────────────────┘
                                 │ (任意) 空き履歴の報告 / 通知の中継
                                 ▼
┌──────── コントロールパネル（ビザサイトに触れない・資格情報ゼロ）────────┐
│  Vercel のランディング/ドキュメント/デモ   +   無料サーバー(Oracle Free) で    │
│  履歴 / ヒートマップ / 通知中継                                              │
└──────────────────────────────────────────────────────────────────────┘
```

3 つの<strong>絶対ルール</strong>（コードに組み込み、テストで保護）：

1. **データプレーンは住宅用 IP のみで実行** —— Agent は送信元 IP を確認し、データセンター ASN を検出するとデフォルトで起動を拒否します。
2. **回避コードはゼロ** —— プロキシのローテーションなし、TLS 偽装なし、CAPTCHA 解読なし。これは<strong>法的な盾</strong>であり<strong>アカウントの盾</strong>でもあります。
3. **失敗即停止** —— チャレンジ / 401 / 1015 に遭遇したら直ちに停止し、人間に通知します。決して強行しません。

## 📦 インストール

### 方法 A：ブラウザ拡張（推奨・大多数の方向け）

1. [Releases](https://github.com/appleweiping/visa-lark/releases) から拡張をダウンロード、または自分でビルド：
   ```bash
   pnpm install && pnpm --filter @visa-lark/extension build
   # dist は apps/extension/dist —— Chrome/Edge → 拡張機能 → パッケージ化されていない拡張機能を読み込む
   ```
2. <strong>あなた自身のブラウザ</strong>で `ais.usvisa-info.com` にログインし、予約 / 予約変更ページを開きます。
3. 拡張アイコンをクリック → 「現在のセッションを同期」（領事館とスケジュール ID を自動読み取り・手入力不要）。
4. 設定でモニター（領事館・ビザ種別・日付範囲・モード）と通知チャネルを追加します。
5. 完了。拡張はバックグラウンドであなたのセッションを使い、ジッター付きのスケジュールで確認し、枠が出たら通知します。

### 方法 B：ローカル Agent（ギーク向け —— ブラウザを開きっぱなしにせず 24x7）

```bash
pnpm install && pnpm --filter @visa-lark/agent build
cp apps/agent/visalark.config.example.json apps/agent/visalark.config.json
# 編集：ログイン済みブラウザからエクスポートした _yatri_session cookie + 領事館 + スケジュール ID + チャネルを貼り付け
node apps/agent/dist/index.js apps/agent/visalark.config.json
```

> ⚠️ <strong>自宅のネットワーク</strong>（自宅 PC / Raspberry Pi）で実行してください。クラウドサーバーでは<strong>実行しないで</strong>ください —— 上記のセーフティモデルを参照。Agent はデータセンター IP を自動検出し、起動を拒否します。

### 任意：コントロールパネル（履歴 / ヒートマップ / 通知中継・資格情報ゼロ）

無料の [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) VM にデプロイし、ランディング/ドキュメントは Vercel にデプロイします。詳細は [apps/control-plane/README](./apps/control-plane) と [DESIGN.md](./DESIGN.md) を参照。

## 🤝 正直な比較

| | **VisaLark** | qmq.app | OSS の visa_rescheduler 系 |
|--|--|--|--|
| オープンソース | ✅ Apache-2.0 | ❌ クローズド | ✅ |
| 価格 | 無料 | 有料 VIP | 無料 |
| アカウント安全性 | ✅ 住宅用 IP + 本物のセッション再利用 | ⚠️ プロキシ群、レート制限 / リスク制御に抵触の恐れ | ⚠️ データセンターで動作することが多く停止リスク |
| パスワードを保存 | ❌ 一切しない | ? | ⚠️ 平文保存が多い |
| CAPTCHA/プロキシ回避 | ❌ ゼロ回避 | ✅ 軍拡競争に資金を投入 | ⚠️ 一部 |
| 中国到達の通知 | ✅ WeChat/Bark | ⚠️ Telegram のみ | ⚠️ 主に Telegram/メール |
| 最も人気の瞬殺枠の確保 | ❌ 約束しない（正直） | ✅ 売り（プロキシ群による） | ❌ |
| マルチチャネル + ワンタップ確認 + ロック | ✅ | 一部 | ❌ |

<strong>一言で</strong>：「より早い枠 / 混雑の少ない領事館 / 緊急枠」が欲しいなら、VisaLark は無料・オープンソースで、あなたを BAN させません。30 秒で消える最上位の瞬殺枠にこだわるなら、責任ある自己ホスト型ツールではその戦いに勝てません —— それは BAN リスクを背負う有料事業者の戦いです。私たちはそれについて嘘をつきません。

## 🧩 モノレポ

```
packages/shared              # アダプター非依存のコア：型 + エンジン + 安全 + ロック + 通知インターフェース（36 tests）
packages/adapter-usvisa-info # usvisa-info に触れる唯一のコード：エンドポイント/解析/予約変更/失敗即停止（16 tests）
packages/notify              # Bark / ServerChan / Telegram / Webhook チャネル（5 tests）
apps/extension               # MV3 ブラウザ拡張（主データプレーン・初心者向け；15 tests）
apps/agent                   # ローカル Node Agent（ギーク向けデータプレーン・住宅用 IP 保護；7 tests）
apps/control-plane           # Fastify + better-sqlite3 コントロールパネル（資格情報ゼロ、22 tests）
apps/web                     # Next.js ランディング/ドキュメント/デモ（Vercel にデプロイ）
```

## ⚖️ 免責事項

VisaLark は<strong>教育および個人利用</strong>のためのオープンソースツールであり、<strong>CGI Federal や米国国務省とは一切無関係</strong>です。

- 本ツールでビザシステムにアクセスすることは<strong>利用規約に違反する可能性</strong>があり、自動化アクセスは<strong>ビザアカウントの制限や停止を招く可能性</strong>があります。<strong>アカウントおよび法的リスクはすべて自己責任です。</strong>
- 本プロジェクトには<strong>CAPTCHA 回避 / ボット対策回避 / プロキシ</strong>のコードは<strong>一切含まれず</strong>、マルチテナントのホスティングを<strong>明確に禁止</strong>します（誰のビザ資格情報も保持しません）。
- 本プロジェクトはホスティングサービスを<strong>提供せず</strong>、予約の確保を<strong>一切約束しません</strong>。
- これは法的助言ではありません。商用またはホスティング利用の前に弁護士に相談してください。
- `auto` 予約変更は破壊的操作（既存の予約を置き換える）であり、デフォルトで無効です —— 有効化前にすべてのロックを理解してください。
- **予約変更/予約機能は実験的**です：usvisa-info の予約変更フォームのフィールドと確認フローは実アカウントで完全には検証されていません。結果が不明確な場合、ツールは `failed` とマークして<strong>手動確認</strong>を求め、成功を偽ることはありません。監視/通知が中核で最も信頼できる部分です。自動/ワンタップ予約変更はまず<strong>ドライランモード</strong>で検証してください。

[Apache-2.0](./LICENSE) ライセンス。No warranty.

---

<div align="center">
<sub>Built with 🐦 by the VisaLark contributors · アカウント安全性 > 確保スピード</sub>
</div>
