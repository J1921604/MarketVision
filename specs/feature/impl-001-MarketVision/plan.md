# 実装計画書: MarketVision 株価テクニカル分析ダッシュボード

**Branch**: `feature/impl-001-MarketVision` | **Date**: 2025-12-15 | **Spec**: [spec.md](https://github.com/J1921604/MarketVision/blob/main/specs/001-MarketVision/spec.md)  
**Input**: [機能仕様書](https://github.com/J1921604/MarketVision/blob/main/specs/001-MarketVision/spec.md)  
**Version**: 1.0.0

## 概要

東京電力HD（9501.T）・中部電力（9502.T）の株価データを視覚化し、テクニカル指標（SMA、RSI、MACD、ボリンジャーバンド）を重ね表示するインタラクティブなダッシュボードをGitHub Pages上で提供します。

**技術アプローチ**:
- フロントエンド: React 18 + TypeScript + Viteによる静的サイト生成
- データ取得: `pandas_datareader` (Stooq) をGitHub Actionsで定期実行
- テクニカル指標計算: Python 3.11 + pandas/numpyによるバッチ処理
- デプロイ: GitHub Pages（静的ホスティング）

---

## 技術コンテキスト

### フロントエンド

**言語/バージョン**: TypeScript 5.3 + React 18.2  
**ビルドツール**: Vite 5.0  
**主要依存関係**:
- `recharts` 2.10 - チャート描画ライブラリ
- `tailwindcss` 3.4 - スタイリングフレームワーク
- `papaparse` 5.4 - CSVパースライブラリ

**テスト**: Vitest (ユニット) + Playwright (E2E)  
**対象プラットフォーム**: モダンブラウザ（Chrome 90+、Firefox 88+、Safari 14+）  
**パフォーマンス目標**:
- LCP (Largest Contentful Paint) < 2.5秒
- TTI (Time to Interactive) < 2.0秒
- 初期バンドルサイズ（gzip後）< 200KB
- チャート再描画 < 200ms

**制約**:
- 静的サイトのため、サーバーサイドロジックなし
- すべてのデータはビルド時またはGitHub Actionsで事前生成
- ブラウザのローカルストレージを使用した期間フィルタ状態の永続化

**スケール/スコープ**:
- 2銘柄（9501.T、9502.T）
- 過去10年間の日次データ（約2500レコード/銘柄）
- 初期ロードサイズ < 500KB（全データ含む）

### バックエンド（データ処理）

**言語/バージョン**: Python 3.11  
**主要依存関係**:
- `pandas_datareader` 0.10.0 - Stooqからのデータ取得
- `pandas` 2.1 - データ処理と変換
- `numpy` 1.26 - テクニカル指標計算

**ストレージ**: ファイルシステム（CSV/JSON）
- `data/price/{symbol}.csv` - 株価データ
- `data/indicators/{symbol}_{indicator}.csv` - テクニカル指標
- `data/events/corporate_events.json` - イベントマーカー

**テスト**: pytest (ユニット) + データ検証スクリプト  
**実行環境**: GitHub Actions Ubuntu latest  
**パフォーマンス目標**:
- データ取得（2銘柄）< 60秒
- テクニカル指標計算（全指標）< 10秒
- データ検証 < 5秒

**制約**:
- Stooqの利用規約を遵守
- エラー時の最大リトライ回数: 3回（指数バックオフ）

**スケール/スコープ**:
- 定期バッチ処理（GitHub Actions Cron: 6時間ごと）
- 処理対象: 2銘柄
- 生成ファイル数: 約10ファイル（価格2 + 指標8）

### デザインシステム

**テーマ**: Cyberpunk Neumorphism  
**カラーパレット**:
- `--bg`: #0A0F0F（ダーク基調）
- `--fg`: #E6F5F1（フォアグラウンド）
- `--neon-green`: #00FF84（アクセント）
- `--cyber-blue`: #00D4FF（東京電力HD）
- `--warning-orange`: #FF6B35（アラート）

**アクセシビリティ**: WCAG 2.1 AA準拠
- コントラスト比: 4.5:1以上
- キーボードナビゲーション対応
- ARIAラベル設定

**レスポンシブ対応**:
- デスクトップ: 1280px以上
- タブレット: 768px～1279px（チャートを縦積み）
- モバイル: 768px未満（基本機能のみ）

---

## Constitution Check

*GATE: Phase 0調査前に通過必須。Phase 1設計後に再確認。*

### ✅ I. テスト駆動開発（TDD）の徹底

**遵守状況**: ✅ 合格
- すべてのテストケースを仕様書の受入シナリオから派生させる
- 実装前にユニットテスト（Vitest）とE2Eテスト（Playwright）を作成
- カバレッジ目標: 80%以上

**検証方法**:
- PRテンプレートにテストコード必須チェック項目を追加
- CI/CDでカバレッジ80%未満の場合はビルド失敗

---

### ✅ II. セキュリティ最優先

**遵守状況**: ✅ 合格
- `.env.local`ファイルは`.gitignore`で除外
- エラーログに機密情報を含めない設計
- StooqはAPIキー不要なので、機密情報の管理は不要

**検証方法**:
- コミット前に`git-secrets`でスキャン

---

### ✅ III. パフォーマンス基準の定量化

**遵守状況**: ✅ 合格
- LCP < 2.5秒、TTI < 2.0秒、初期ロード < 500KB、チャート再描画 < 200ms
- すべて仕様書（FR-012、SC-001～SC-003）で定量化済み

**検証方法**:
- Lighthouse CIでビルドごとに測定（スコア90以上必須）
- パフォーマンス基準未達成のPRはマージ拒否

---

### ✅ IV. データ品質の保証

**遵守状況**: ✅ 合格
- すべてのCSV/JSONにスキーマバージョンを記載
- データ更新後に`validate_data.py`でスキーマ検証を実行
- 異常値（株価0円以下、前日比500%超）を検出してアラート発行

**検証方法**:
- CI/CDでデータ検証ステップを必須化
- 検証失敗時はデプロイを中止

---

### ✅ V. API/ライブラリ仕様の遵守

**遵守状況**: ✅ 合格
- Stooq (pandas_datareader) の利用規約を遵守
- 過度なリクエストを避ける設計（GitHub Actionsでの6時間ごと実行のみ）
- エラー時の最大リトライ回数: 3回（指数バックオフ）

**検証方法**:
- GitHub Actionsワークフローで実行頻度を管理
- リトライロジックをユニットテストで検証

---

### ✅ VI. バージョン固定とメンテナンス性

**遵守状況**: ✅ 合格
- package.json および requirements.txt で厳密なバージョン指定を実施
- React 18.2、TypeScript 5.3、Vite 5.0、Recharts 2.10、Tailwind CSS 3.4 を固定
- Python 3.11、pandas_datareader 0.10.0、pandas 2.1、numpy 1.26 を固定
- バージョン更新時はテスト実行で互換性確認

**検証方法**:
- CI/CDで依存関係の脆弱性スキャンを定期実行
- バージョン更新は PR で管理し、テスト結果を確認してマージ

---

### ✅ VII. 仕様と実装の分離

**遵守状況**: ✅ 合格
- 仕様ブランチ（`001-MarketVision`）には仕様書、計画書、タスクリストのみを含む
- 実装ブランチ（`feature/impl-001-MarketVision`）にはソースコード、テスト、設定ファイルを含む
- レビューで仕様と実装の乖離を検知し、是正する

**検証方法**:
- PR レビューで仕様ブランチと実装ブランチの内容を確認
- 仕様と実装の乖離が検出された場合はマージを拒否

---

## プロジェクト構造

### ドキュメント（本機能）

```text
specs/001-MarketVision/
├── spec.md              # 機能仕様書
├── plan.md              # 実装計画書
├── tasks.md             # タスクリスト
└── checklists/
    └── requirements.md  # 仕様品質チェックリスト

specs/feature/impl-001-MarketVision/
├── plan.md              # 本実装計画書（実装ブランチ用）
├── research.md          # Phase 0調査結果
├── data-model.md        # Phase 1データモデル
├── quickstart.md        # Phase 1クイックスタート
└── contracts/           # Phase 1データ契約
    └── README.md
```

### ソースコード（リポジトリルート）

```text
MarketVision/
├── .github/
│   ├── workflows/
│   │   └── deploy-pages.yml          # GitHub Pagesデプロイ
│   └── copilot-commit-message-instructions.md
│
├── .specify/
│   ├── memory/
│   │   └── constitution.md           # プロジェクト憲法
│   ├── templates/
│   └── scripts/
│       └── powershell/
│           ├── setup-plan.ps1
│           └── update-agent-context.ps1
│
├── src/                              # フロントエンド（React）
│   ├── components/
│   │   ├── ChartCanvas.tsx          # チャート描画
│   │   ├── PeriodFilterPanel.tsx    # 期間選択UI
│   │   ├── TechnicalPanel.tsx       # テクニカル指標トグル
│   │   └── AlertBanner.tsx          # アラート表示
│   ├── hooks/
│   │   └── useMarketData.ts         # CSV読み込み + データ処理
│   ├── utils/
│   │   └── indicators.ts            # テクニカル指標計算
│   ├── types/
│   │   └── index.ts                 # 型定義
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── scripts/                          # データ取得（Python）
│   ├── fetch_price_data.py          # Stooq経由のデータ取得
│   ├── build_indicators.py          # テクニカル指標計算
│   ├── validate_data.py             # データ検証
│   └── requirements.txt             # Python依存関係
│
├── data/                             # CSVデータ（gitignore）
│   ├── price/
│   │   ├── 9501.T.csv
│   │   └── 9502.T.csv
│   ├── indicators/
│   │   ├── 9501.T_sma.csv
│   │   ├── 9501.T_rsi.csv
│   │   ├── 9501.T_macd.csv
│   │   ├── 9501.T_bb.csv
│   │   ├── 9502.T_sma.csv
│   │   ├── 9502.T_rsi.csv
│   │   ├── 9502.T_macd.csv
│   │   └── 9502.T_bb.csv
│   ├── events/
│   │   └── corporate_events.json
│   └── alerts.json
│
├── tests/
│   ├── unit/
│   │   ├── indicators.test.ts       # 指標計算ユニットテスト
│   │   └── validate_data.test.py    # データ検証ユニットテスト
│   └── e2e/
│       └── dashboard.spec.ts        # E2Eシナリオ
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── playwright.config.ts
└── README.md
```

**構造決定の理由**:
- **Web application構造**を採用（フロントエンド + バックエンドデータ処理）
- フロントエンドは静的サイトだが、バックエンドスクリプトが別途存在するため分離
- GitHub Actionsで`scripts/`を実行し、`data/`を更新
- フロントエンドは`data/`から静的ファイルとしてデータを読み込む

---

## 複雑性の追跡

本プロジェクトは憲法の7原則すべてに準拠しているため、このセクションは**不要**です。

---

## 関連ドキュメント

- **[機能仕様書](https://github.com/J1921604/MarketVision/blob/main/specs/001-MarketVision/spec.md)**: ユーザーストーリー、機能要件
- **[research.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/research.md)**: 技術選定の根拠（Phase 0）
- **[data-model.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/data-model.md)**: データモデル定義（Phase 1）
- **[quickstart.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/quickstart.md)**: クイックスタートガイド（Phase 1）
- **[contracts/](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/contracts/README.md)**: データ契約（Phase 1）

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-15  
**Repository**: https://github.com/J1921604/MarketVision
