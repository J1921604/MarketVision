# MarketVision

**株価テクニカル分析ダッシュボード**

MarketVisionは、東京電力ホールディングス（9501.T）と中部電力（9502.T）の株価データをテクニカル指標で分析するインタラクティブな価格分析環境を提供するWebアプリケーションです。

## プロジェクト概要

- **バージョン**: 1.0.0
- **リリース日**: 2025年12月15日
- **ステータス**: 実装完了
- **リポジトリ**: [https://github.com/J1921604/MarketVision](https://github.com/J1921604/MarketVision)

### プロジェクトドキュメント

- **[機能仕様書](https://github.com/J1921604/MarketVision/blob/main/specs/001-marketvision-implementation/spec.md)**: ユーザーストーリー、機能要件
- **[実装計画書](https://github.com/J1921604/MarketVision/blob/main/specs/001-marketvision-implementation/plan.md)**: 技術選定、アーキテクチャ設計
- **[タスクリスト](https://github.com/J1921604/MarketVision/blob/main/specs/001-marketvision-implementation/tasks.md)**: 実装タスク一覧

## 主要機能

### ✅ 実装済み（v1.0.0）

- **リアルタイム株価表示**
  - 東電・中電の最新株価タイル表示
  - 前日比・騰落率・出来高の可視化
  
- **テクニカルチャート**
  - ローソク足（日足）
  - 移動平均線（SMA: 5/25/75日）
  - RSI（14日）、MACD、ボリンジャーバンド
  
- **期間フィルタ**
  - 1M、3M、6M、1Y、3Y、5Y、カスタム期間選択

- **銘柄比較**
  - 東電vs中電の切り替え

## 技術スタック

### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **チャートライブラリ**: Recharts
- **スタイリング**: Tailwind CSS + CSS Variables
- **ホスティング**: GitHub Pages

### バックエンド（データ処理）
- **言語**: Python 3.10+
- **データ取得**: pandas_datareader（Stooq経由）
- **指標計算**: pandas, numpy
- **CI/CD**: GitHub Actions

### デザインシステム
- **テーマ**: Cyberpunk Neumorphism
- **カラー**: ダーク基調（#0A0F0F）+ ネオングリーン（#00FF84）

## プロジェクト構造

```
MarketVision/
├── .github/
│   ├── workflows/
│   │   ├── deploy-pages.yml      # GitHub Pagesデプロイ
│   │   └── update-data.yml       # データ更新
│   └── copilot-commit-message-instructions.md
├── .specify/
│   ├── memory/
│   │   └── constitution.md       # プロジェクト憲法（開発原則）
├── src/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── styles/
├── data/
│   ├── price/                    # 株価データ（CSV）
│   └── .metadata/                # データ更新履歴
├── scripts/
│   ├── fetch_price_data.py      # データ取得スクリプト（Stooq）
│   └── requirements.txt         # Python依存関係
├── tests/
│   ├── unit/
│   └── e2e/
└── README.md
```

## セットアップ

### 前提条件

- Node.js 20以上
- Python 3.10以上
- Git

### 1. リポジトリのクローン

```bash
git clone https://github.com/J1921604/MarketVision.git
cd MarketVision
```

### 2. 環境変数の設定

pandas_datareader（Stooq）は無料でAPIキー不要です。`.env.local`ファイルは必要ありません。

### 3. 依存関係のインストール

```bash
# フロントエンド
npm install

# バックエンド（Python）
pip install -r scripts/requirements.txt
```

### 4. 初回データ取得

```bash
python scripts/fetch_price_data.py --symbols "9502.T,9501.T"
```

Stooqから過去10年分のデータを取得します。

### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてください。

## 開発ガイドライン

### プロジェクト憲法

このプロジェクトは[憲法ドキュメント](https://github.com/J1921604/MarketVision/blob/main/.specify/memory/constitution.md)で定義された基本原則に従います。

### コミットメッセージ

[.github/copilot-commit-message-instructions.md](https://github.com/J1921604/MarketVision/blob/main/.github/copilot-commit-message-instructions.md)に従ってコミットメッセージを記述してください。

## テスト

### ユニットテスト

```bash
npm run test:unit
```

### E2Eテスト（Playwright）

```bash
npm run test:e2e
```

## デプロイ

### GitHub Pagesへの自動デプロイ

`main`ブランチへのpush時に自動的にデプロイされます。

手動デプロイ:
```bash
npm run build
# GitHub Actionsが自動的にdistをデプロイ
```

---

**Last Updated**: 2025-12-15
**Version**: 1.0.0
