# Research: MarketVision 株価テクニカル分析ダッシュボード

**Branch**: `feature/impl-001-MarketVision`  
**Date**: 2025-12-15  
**Phase**: 0 - 調査・研究

## 概要

本ドキュメントは、MarketVisionプロジェクトで選択した技術スタックの根拠、ベストプラクティス、および代替案の評価結果をまとめたものです。

---

## 技術選定の根拠

### 1. フロントエンド: React 18.2 + TypeScript 5.3

#### 決定

- **React 18.2**: UIライブラリ
- **TypeScript 5.3**: 型安全性・開発体験向上

#### 根拠

- **React 18**の並行レンダリング機能により、チャート再描画中もUIが応答性を維持できる
- **TypeScript**により、株価データ型（PriceData、IndicatorData）の厳密な型チェックが可能で、実行時エラーを防止
- GitHub Pagesとの親和性が高く、静的サイトとして簡単にデプロイ可能
- チャートライブラリ（Recharts）との統合が容易

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **React 18** | 並行レンダリング、大規模エコシステム、Recharts統合 | バンドルサイズ大 | ✅ 採用 |
| Vue 3 | 小さいバンドル、学習容易 | チャートライブラリの選択肢が少ない | ❌ 不採用 |
| Svelte | 最小バンドル、高速 | エコシステムが未成熟 | ❌ 不採用 |

**結論**: React 18の並行レンダリングと豊富なチャートライブラリエコシステムが、パフォーマンス要件（チャート再描画<200ms）を満たすため採用。

---

### 2. ビルドツール: Vite 5.0

#### 決定

- **Vite 5.0**: 開発サーバー + ビルドツール

#### 根拠

- **HMR（Hot Module Replacement）**が高速で、開発体験が大幅に向上
- **Rollup**ベースのビルドにより、本番バンドルサイズを最適化（Tree Shaking）
- GitHub Pagesの`base`設定が簡単（`base: '/MarketVision/'`）
- TypeScript + Reactのゼロコンフィグサポート

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **Vite** | 高速HMR、小さいバンドル、ゼロコンフィグ | 比較的新しい | ✅ 採用 |
| Webpack | 成熟したエコシステム、プラグイン豊富 | 複雑な設定、遅いHMR | ❌ 不採用 |
| Parcel | ゼロコンフィグ | バンドルサイズ最適化が弱い | ❌ 不採用 |

**結論**: Viteの高速開発体験と本番最適化のバランスが、初期ロード<500KB要件を満たすため採用。

---

### 3. チャートライブラリ: Recharts 2.10

#### 決定

- **Recharts 2.10**: React用の宣言的チャートライブラリ

#### 根拠

- **宣言的API**により、ローソク足チャートを`<ComposedChart>`で簡単に構築可能
- **カスタムコンポーネント**で、テクニカル指標（SMA、RSI、MACD、ボリンジャーバンド）を柔軟に重ね表示
- **レスポンシブ設計**で、モバイルデバイスでも自動調整
- **アニメーション**がスムーズで、チャート再描画が視覚的に分かりやすい

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **Recharts** | 宣言的API、React統合、カスタマイズ容易 | パフォーマンス最適化が必要 | ✅ 採用 |
| Chart.js | 軽量、高速 | React統合が煩雑 | ❌ 不採用 |
| D3.js | 最も柔軟 | 学習曲線が急、コード量大 | ❌ 不採用 |
| LightweightCharts | 金融チャート特化、軽量 | カスタマイズ困難 | ❌ 不採用 |

**結論**: Rechartsの宣言的APIと柔軟性が、複数テクニカル指標の重ね表示要件に最適。パフォーマンス要件（再描画<200ms）は、データ量の制御（最大2500レコード）で達成可能。

---

### 4. スタイリング: Tailwind CSS 3.4

#### 決定

- **Tailwind CSS 3.4**: ユーティリティファーストCSSフレームワーク

#### 根拠

- **PurgeCSS統合**により、未使用CSSを自動削除してバンドルサイズを最小化
- **カスタムテーマ**で、Cyberpunk Neumorphismデザインを効率的に実装
- **JIT（Just-In-Time）モード**で、任意のユーティリティを動的生成
- **レスポンシブデザイン**が簡単（`sm:`、`md:`、`lg:`プレフィックス）

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **Tailwind CSS** | 小さいバンドル、高速開発、カスタマイズ容易 | HTMLが冗長になる | ✅ 採用 |
| CSS Modules | スコープ付きCSS、シンプル | グローバルテーマが困難 | ❌ 不採用 |
| Emotion/Styled-components | CSS-in-JS、型安全 | バンドルサイズ増加 | ❌ 不採用 |

**結論**: Tailwind CSSのPurgeCSSがバンドルサイズ要件（<200KB gzip後）を満たし、Cyberpunk Neumorphismテーマのカスタマイズが容易なため採用。

---

### 5. データ取得: pandas_datareader 0.10.0（Stooq）

#### 決定

- **pandas_datareader 0.10.0**: Stooq APIラッパー

#### 根拠

- **無料・APIキー不要**で、過去10年間の株価データを取得可能
- **pandas DataFrame互換**で、テクニカル指標計算（SMA、RSI、MACD）が容易
- **Stooq**は、東京電力HD（9501.T）・中部電力（9502.T）のデータを安定して提供
- **GitHub Actions**での自動実行に対応

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **Stooq (pandas_datareader)** | 無料、APIキー不要、10年分データ | レート制限あり | ✅ 採用 |
| yfinance | 無料、Yahoo Finance | 利用規約が不明確 | ❌ 不採用 |
| Alpha Vantage | 公式API、テクニカル指標提供 | 無料プラン制限厳しい（5req/分） | ❌ 不採用 |
| Quandl | 高品質データ | 無料プラン廃止 | ❌ 不採用 |

**結論**: Stooqの無料・APIキー不要が、運用コスト0円要件を満たし、pandas_datareaderの統合が簡単なため採用。

---

### 6. テクニカル指標計算: pandas 2.1 + numpy 1.26

#### 決定

- **pandas 2.1**: DataFrameベースのデータ処理
- **numpy 1.26**: 数値計算・配列操作

#### 根拠

- **pandas**の`rolling()`メソッドで、SMA（5/25/75日）を簡潔に計算可能
- **numpy**の配列演算で、RSI、MACD、ボリンジャーバンドを高速計算
- **CSV出力**が容易で、フロントエンドとのデータ連携がシンプル

#### ベストプラクティス

```python
# SMA計算例
df['sma_5'] = df['close'].rolling(window=5).mean()
df['sma_25'] = df['close'].rolling(window=25).mean()
df['sma_75'] = df['close'].rolling(window=75).mean()

# RSI計算例
delta = df['close'].diff()
gain = delta.where(delta > 0, 0).rolling(window=14).mean()
loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
rs = gain / loss
df['rsi'] = 100 - (100 / (1 + rs))

# MACD計算例
df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
df['macd'] = df['ema_12'] - df['ema_26']
df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
df['macd_hist'] = df['macd'] - df['macd_signal']

# ボリンジャーバンド計算例
df['bb_middle'] = df['close'].rolling(window=20).mean()
df['bb_std'] = df['close'].rolling(window=20).std()
df['bb_upper'] = df['bb_middle'] + (df['bb_std'] * 2)
df['bb_lower'] = df['bb_middle'] - (df['bb_std'] * 2)
```

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **pandas + numpy** | 高速、簡潔、標準的 | 大規模データで遅い | ✅ 採用 |
| TA-Lib | テクニカル指標専用ライブラリ | インストール複雑 | ❌ 不採用 |
| Backtrader | バックテスト統合 | 過剰機能 | ❌ 不採用 |

**結論**: pandas + numpyの標準的な計算手法が、パフォーマンス要件（指標計算<10秒）を満たし、学習コストが低いため採用。

---

### 7. CI/CD: GitHub Actions

#### 決定

- **GitHub Actions**: CI/CDパイプライン
- **GitHub Pages**: 静的サイトホスティング

#### 根拠

- **無料**で、プライベートリポジトリでも利用可能（月2000分）
- **ワークフロー統合**で、データ取得・ビルド・デプロイを一元管理
- **GitHub Pages**との親和性が高く、mainブランチプッシュで自動デプロイ

#### ワークフロー構成

```yaml
# .github/workflows/deploy-pages.yml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * *'  # 毎日17:00 JSTにデータ更新

jobs:
  fetch-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scripts/requirements.txt
      - run: python scripts/fetch_price_data.py
      - run: python scripts/build_indicators.py
      - uses: actions/upload-artifact@v4
        with:
          name: data
          path: data/

  build-deploy:
    needs: fetch-data
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: data
          path: data/
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/deploy-pages@v4
        with:
          artifact-name: github-pages
          folder: dist
```

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **GitHub Actions** | 無料、GitHub統合、簡単設定 | 実行時間制限あり | ✅ 採用 |
| Vercel | 高速デプロイ、プレビュー環境 | 無料プラン制限厳しい | ❌ 不採用 |
| Netlify | 簡単設定、ビルドプラグイン豊富 | データ更新に不向き | ❌ 不採用 |

**結論**: GitHub Actionsの無料枠とGitHub Pagesとの統合が、運用コスト0円要件を満たすため採用。

---

### 8. テスト: Vitest + Playwright

#### 決定

- **Vitest**: ユニットテスト・統合テスト
- **Playwright**: E2Eテスト

#### 根拠

- **Vitest**は、Viteとのゼロコンフィグ統合で、設定が簡単
- **Playwright**は、Chrome、Firefox、Safariのクロスブラウザテストに対応
- **カバレッジ目標**（ユニット80%以上、E2E主要フロー100%）を満たせる

#### テスト戦略

1. **ユニットテスト**（Vitest）:
   - テクニカル指標計算ロジック（SMA、RSI、MACD、ボリンジャーバンド）
   - データ検証ロジック（validate_data.py）
   - カスタムフック（useMarketData.ts）

2. **E2Eテスト**（Playwright）:
   - US1: 株価チャート表示（ローソク足、期間フィルタ）
   - US2: テクニカル指標の重ね表示（SMA、RSI、MACD、ボリンジャーバンド）
   - US3: 企業間比較表示

#### 代替案と比較

| 選択肢 | メリット | デメリット | 評価 |
|--------|---------|-----------|------|
| **Vitest** | Vite統合、高速、Jest互換 | エコシステムが小さい | ✅ 採用 |
| Jest | 成熟、エコシステム大 | Vite統合が複雑 | ❌ 不採用 |
| **Playwright** | クロスブラウザ、高速、安定 | 学習コスト | ✅ 採用 |
| Cypress | 開発体験良好 | 遅い | ❌ 不採用 |

**結論**: VitestのVite統合とPlaywrightのクロスブラウザテストが、憲法のテスト要件（カバレッジ80%以上）を満たすため採用。

---

## デザインシステム: Cyberpunk Neumorphism

### 決定

- **テーマ**: Cyberpunk Neumorphism
- **カラーパレット**:
  - ダーク基調: `#0A0F0F`（ほぼ黒）
  - ネオングリーン: `#00FF84`（上昇トレンド、ポジティブ）
  - サイバーブルー: `#00D4FF`（下降トレンド、情報）
  - 警告オレンジ: `#FF6B35`（アラート、警告）
  - 背景グラデーション: `#0A0F0F` → `#0D1414`

### 根拠

- **高コントラスト**により、チャートの視認性が向上
- **ネオン効果**で、重要情報（アラート、閾値）を強調
- **ニューモルフィズム**で、ボタンやパネルに深度感を追加

### Tailwind設定

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0A0F0F',
        'dark-panel': '#0D1414',
        'neon-green': '#00FF84',
        'cyber-blue': '#00D4FF',
        'warning-orange': '#FF6B35',
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(0, 255, 132, 0.5)',
        'cyber-blue': '0 0 10px rgba(0, 212, 255, 0.5)',
        'neumorphism': '5px 5px 15px #070A0A, -5px -5px 15px #0D1414',
      },
    },
  },
};
```

---

## パフォーマンス最適化戦略

### 1. バンドルサイズ削減

- **Code Splitting**: Viteの動的インポートで、チャートコンポーネントを遅延ロード
- **Tree Shaking**: Rechartsの未使用コンポーネントを自動削除
- **PurgeCSS**: Tailwindの未使用CSSを削除
- **Compression**: gzip/Brotli圧縮で、初期ロード<500KB（gzip後<200KB）

### 2. チャート再描画最適化

- **データ制限**: 表示データ量を最大2500レコード（10年分日次）に制限
- **React.memo**: チャートコンポーネントをメモ化して不要な再描画を防止
- **useMemo**: テクニカル指標の計算結果をキャッシュ

```typescript
// src/hooks/useMarketData.ts
const filteredData = useMemo(() => {
  return priceData.filter(d => {
    const date = new Date(d.date);
    return date >= filterStart && date <= filterEnd;
  });
}, [priceData, filterStart, filterEnd]);

const indicators = useMemo(() => {
  return calculateIndicators(filteredData);
}, [filteredData]);
```

### 3. Lighthouse CI統合

```yaml
# .github/workflows/lighthouse-ci.yml
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: treosh/lighthouse-ci-action@v10
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: './lighthouserc.json'
```

**基準**:
- LCP < 2.5秒
- TTI < 2.0秒
- Performance Score ≥ 90

---

## データ品質保証

### 1. スキーマ検証

```python
# scripts/validate_data.py
import pandas as pd
import json
from jsonschema import validate

# 株価データスキーマ
PRICE_SCHEMA = {
    "type": "object",
    "required": ["date", "open", "high", "low", "close", "volume"],
    "properties": {
        "date": {"type": "string", "format": "date"},
        "open": {"type": "number", "minimum": 0},
        "high": {"type": "number", "minimum": 0},
        "low": {"type": "number", "minimum": 0},
        "close": {"type": "number", "minimum": 0},
        "volume": {"type": "integer", "minimum": 0},
    }
}

def validate_csv(file_path, schema):
    df = pd.read_csv(file_path)
    for record in df.to_dict('records'):
        validate(instance=record, schema=schema)
    return True
```

### 2. 異常値検出

```python
def detect_anomalies(df):
    anomalies = []
    
    # 株価0円以下
    if (df['close'] <= 0).any():
        anomalies.append("Zero or negative prices detected")
    
    # 前日比500%超
    df['pct_change'] = df['close'].pct_change()
    if (df['pct_change'].abs() > 5).any():
        anomalies.append("Price change > 500% detected")
    
    return anomalies
```

---

## セキュリティ対策

### 1. 環境変数管理

- APIキーは不要（Stooqは無料・認証なし）
- 将来的に有料APIを使用する場合は、GitHub Secretsで管理

### 2. データ検証

- すべてのCSV/JSONファイルを、読み込み前にスキーマ検証
- 異常値を検出して、エラーログに記録

---

## まとめ

本調査により、以下の技術スタックが最適であることを確認しました：

| カテゴリ | 技術 | 根拠 |
|---------|------|------|
| フロントエンド | React 18.2 + TypeScript 5.3 | 並行レンダリング、型安全性 |
| ビルドツール | Vite 5.0 | 高速HMR、小さいバンドル |
| チャート | Recharts 2.10 | 宣言的API、柔軟性 |
| スタイリング | Tailwind CSS 3.4 | 小さいバンドル、カスタマイズ容易 |
| データ取得 | pandas_datareader (Stooq) | 無料、APIキー不要 |
| 指標計算 | pandas 2.1 + numpy 1.26 | 標準的、高速 |
| CI/CD | GitHub Actions + Pages | 無料、統合簡単 |
| テスト | Vitest + Playwright | Vite統合、クロスブラウザ |

すべての選択は、憲法の7原則（TDD、セキュリティ、パフォーマンス、データ品質、API遵守、バージョン固定、仕様と実装の分離）に準拠しています。

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-15
