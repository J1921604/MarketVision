
# Master Spec-Kit v2.0 — Multi-App Suite（個別開発可能版）

## 改善の要約

本ドキュメントは、5つの独立アプリケーション（MarketVision、ValueScope、FinSight、EnergyChain、PulseWatch）を個別にspec-kit開発できるレベルまで詳細化したものです。各アプリケーションは完全に独立したリポジトリとして開発・デプロイ可能な仕様となっています。

---

## 第0章：共通基盤仕様

### 0.1 プラットフォームアーキテクチャ

本スイートは「Static-First Architecture」を採用しています。すべてのアプリケーションはGitHub Pagesでホスティングされ、データ更新はGitHub Actionsによる定期バッチ処理で実現されます。このアーキテクチャにより、サーバーレスでありながらも動的なダッシュボード機能を提供することが可能となります。

**ホスティング構成として**、GitHub Pages（Branch: `main`、Artifact: `dist`）を使用します。各アプリケーションは独立したリポジトリまたはモノレポのサブディレクトリとして構成でき、デプロイは自動化されています。

**CI/CDパイプラインは**GitHub Actionsで構築され、二種類のワークフローが存在します。デプロイ用の`deploy-pages.yml`はプッシュイベントおよび手動ディスパッチで起動し、データ更新用の各アプリ専用`update-*.yml`はcronスケジュールと手動トリガーの両方に対応しています。

**データストレージとして**リポジトリ内の`/data/`ディレクトリを使用します。サポートするフォーマットはCSV、JSON、ZIP、Parquetであり、Git履歴がそのままデータ変更ログとして機能します。これにより、外部データベースを必要とせず、バージョン管理されたデータ基盤を実現しています。

### 0.2 Secrets管理仕様

すべてのAPIキーと機密情報はGitHub Secretsで管理されます。登録手順は以下の通りです。

1. Repository → Settings → Secrets and variables → Actions
2. New repository secretを選択
3. Name欄に変数名、Secret欄に値を入力
4. Add secretで保存

**必須Secrets一覧：**

|Secret Name|用途|必須アプリ|
|---|---|---|
|`ALPHA_VANTAGE_API_KEY`|株価・為替データ取得|MarketVision|
|`EDINET_API_KEY`|EDINET API v2認証|ValueScope, FinSight, EnergyChain|
|`EDINET_BASE_URL`|EDINETエンドポイント（デフォルト: `https://api.edinet-fsa.go.jp/api/v2`）|ValueScope, FinSight, EnergyChain|
|`GH_PAT`|Issue自動起票用（オプション）|全アプリ|

### 0.3 デザインシステム仕様

**カラーパレット定義：**

```css
:root {
  /* ベースカラー */
  --bg-primary: #0A0F0F;
  --bg-secondary: #0D1414;
  --bg-tertiary: #111919;
  --fg-primary: #E6F5F1;
  --fg-secondary: #A8C5BE;
  --fg-muted: #6B8A82;

  /* ブランドカラー */
  --neon-green: #00FF84;
  --neon-green-dim: rgba(0, 255, 132, 0.15);
  --neon-green-glow: rgba(0, 255, 132, 0.65);
  
  /* 企業識別カラー */
  --tepco-cyan: #00D4FF;
  --tepco-cyan-glow: rgba(0, 212, 255, 0.5);
  --chubu-magenta: #FF2ECC;
  --chubu-magenta-glow: rgba(255, 46, 204, 0.5);

  /* セマンティックカラー */
  --status-positive: #00FF84;
  --status-warning: #FFB800;
  --status-negative: #FF4757;
  --status-neutral: #6B8A82;

  /* シャドウ */
  --shadow-light: rgba(255, 255, 255, 0.08);
  --shadow-dark: rgba(0, 0, 0, 0.55);
  --shadow-glow: rgba(0, 255, 132, 0.15);

  /* アニメーション */
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --duration-fast: 80ms;
  --duration-normal: 200ms;
  --duration-slow: 350ms;
}
```

**ニューモフィズムコンポーネント：**

```css
.neumorph-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow:
    -6px -6px 12px var(--shadow-light),
    6px 6px 12px var(--shadow-dark),
    0 0 12px var(--shadow-glow);
  padding: 1.5rem;
  transition: box-shadow var(--duration-normal) var(--ease-default);
}

.neumorph-card:hover {
  box-shadow:
    -8px -8px 16px var(--shadow-light),
    8px 8px 16px var(--shadow-dark),
    0 0 20px var(--neon-green-dim);
}

.neumorph-button {
  color: var(--fg-primary);
  background: var(--bg-secondary);
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow:
    -4px -4px 8px var(--shadow-light),
    4px 4px 8px var(--shadow-dark);
  transition: 
    box-shadow var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default),
    color var(--duration-fast),
    background var(--duration-fast);
}

.neumorph-button:hover {
  transform: translateY(-1px);
  box-shadow:
    -6px -6px 12px var(--shadow-light),
    6px 6px 12px var(--shadow-dark),
    0 0 8px var(--neon-green-dim);
}

.neumorph-button:active,
.neumorph-button--selected {
  background: var(--neon-green);
  color: var(--bg-primary);
  box-shadow:
    inset 2px 2px 4px rgba(0, 0, 0, 0.2),
    0 0 16px var(--neon-green-glow);
  transform: translateY(1px);
}
```

**アニメーション定義：**

```css
/* ページ遷移 */
@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateZ(-20px);
  }
  to {
    opacity: 1;
    transform: translateZ(0);
  }
}

.page-enter {
  animation: page-fade-in var(--duration-slow) var(--ease-default);
}

/* チャートライン */
.chart-line--tepco {
  stroke: var(--tepco-cyan);
  stroke-width: 2;
  filter: drop-shadow(0 0 6px var(--tepco-cyan-glow));
}

.chart-line--chubu {
  stroke: var(--chubu-magenta);
  stroke-width: 2;
  filter: drop-shadow(0 0 6px var(--chubu-magenta-glow));
}

/* パララックス（PCのみ） */
@media (min-width: 1024px) and (hover: hover) {
  .parallax-layer {
    will-change: transform;
    transition: transform var(--duration-slow) var(--ease-default);
  }
  
  .parallax-layer--slow {
    transform: translateY(calc(var(--scroll-y) * 0.1));
  }
  
  .parallax-layer--medium {
    transform: translateY(calc(var(--scroll-y) * 0.05));
  }
}
```

### 0.4 アクセシビリティ要件

WCAG 2.1 AA準拠を必須とし、以下の基準を満たすこと。

**コントラスト比として**、通常テキスト（14px未満）は4.5:1以上、大きなテキスト（18px以上または14px太字）は3:1以上を確保します。本デザインシステムのカラーパレットはこれらの基準を満たすよう設計されています。

**キーボード操作について**、すべてのインタラクティブ要素はTabキーでフォーカス可能であり、Enter/Spaceキーで操作可能です。フォーカスインジケーターは視認性の高いアウトラインで表示されます。

**スクリーンリーダー対応として**、チャートには`aria-label`と`role="img"`を付与し、データテーブルには適切なヘッダーマークアップを使用します。動的に更新されるコンテンツには`aria-live`リージョンを設定します。

### 0.5 パフォーマンス予算

|指標|目標値|測定方法|
|---|---|---|
|LCP (Largest Contentful Paint)|< 2.5秒|Lighthouse|
|TTI (Time to Interactive)|< 2.0秒|Lighthouse|
|FID (First Input Delay)|< 100ms|Web Vitals|
|CLS (Cumulative Layout Shift)|< 0.1|Lighthouse|
|バンドルサイズ（gzip後）|< 200KB|webpack-bundle-analyzer|
|初期データロード|< 500KB|Network tab|

---

## 第1章：MarketVision — 市場価格分析ダッシュボード

### 1.1 アプリケーション概要

MarketVisionは、東京電力ホールディングス（9501.T）および中部電力（9502.T）の株価データに為替レート（USD/JPY）を重ね合わせ、包括的なテクニカル分析機能を提供する市場分析ダッシュボードです。投資判断に必要な情報をリアルタイムに近い形で可視化し、価格変動アラート機能により重要な市場変動を即座に把握できます。

### 1.2 機能要件

**1.2.1 リアルタイム指標タイル**

ダッシュボード上部に配置される指標タイルは、以下の情報をリアルタイムに表示します。

- **現在値**：最新の株価（小数点以下2桁）
- **前日比**：前日終値との差額（+/-表記）
- **騰落率**：前日比のパーセンテージ（小数点以下2桁%）
- **出来高**：当日の取引量（カンマ区切り表示）
- **52週レンジ**：過去52週の高値・安値レンジとプログレスバー

**1.2.2 メインチャート**

ローソク足チャートを中心とした価格推移の可視化を行います。

- **表示期間オプション**：1M、3M、6M、1Y、3Y、5Y、カスタム（日付ピッカー）
- **時間軸粒度**：日足（1D）、週足（1W）、月足（1M）
- **移動平均線**：SMA 5（短期）、SMA 25（中期）、SMA 75（長期）を切替表示
- **出来高バー**：チャート下部に棒グラフで表示、価格上昇日は緑、下落日は赤
- **イベントマーカー**：決算発表日、権利落ち日、配当支払日をアイコンで表示

**1.2.3 テクニカル指標パネル**

チャート下部に配置されるサブチャートで、以下の指標を切替表示します。

- **RSI (Relative Strength Index)**：14日間、70/30水平線、オーバーボート/オーバーソールドゾーンの色分け
- **MACD**：12/26/9パラメータ、MACDライン、シグナルライン、ヒストグラム
- **ボリンジャーバンド**：20日移動平均、±2σバンド、バンド幅インジケーター

**1.2.4 比較分析機能**

TEPCO/CHUBUの比較分析機能を提供します。

- **オーバーレイモード**：両銘柄の価格推移を正規化して重ね合わせ
- **相関係数表示**：12ヶ月ローリング相関（週次計算）をサブチャートで表示
- **パフォーマンス比較**：指定期間の騰落率を横棒グラフで比較

**1.2.5 アラート機能**

価格変動に対するアラート機能を実装します。

- **閾値**：前日比±5%でアラート発動
- **表示方法**：画面上部にスライドイン通知バナー
- **永続化**：アラート履歴を`data/alerts/price_alerts.json`に保存
- **通知**：GitHub Issue自動起票（ラベル: `price-alert`）

### 1.3 データモデル定義

**1.3.1 株価データ（OHLCV）**

```
ファイルパス: data/price/{symbol}.csv
エンコーディング: UTF-8
ヘッダー: 必須
```

|カラム名|データ型|説明|例|
|---|---|---|---|
|date|string (ISO8601)|取引日|2025-11-26|
|open|number|始値|1234.00|
|high|number|高値|1250.00|
|low|number|安値|1220.00|
|close|number|終値|1245.00|
|volume|integer|出来高|100200|
|adjusted_close|number|調整後終値|1245.00|

**1.3.2 為替データ**

```
ファイルパス: data/fx/{pair}.csv
エンコーディング: UTF-8
ヘッダー: 必須
```

|カラム名|データ型|説明|例|
|---|---|---|---|
|date|string (ISO8601)|取引日|2025-11-26|
|rate|number|為替レート|151.23|
|high|number|日中高値|151.89|
|low|number|日中安値|150.78|

**1.3.3 テクニカル指標（計算済み）**

```
ファイルパス: data/indicators/{symbol}_indicators.json
```

```json
{
  "schema_version": "1.0.0",
  "symbol": "9501.T",
  "generated_at": "2025-11-26T10:00:00Z",
  "indicators": {
    "sma": {
      "sma5": [{"date": "2025-11-26", "value": 1240.5}],
      "sma25": [{"date": "2025-11-26", "value": 1235.2}],
      "sma75": [{"date": "2025-11-26", "value": 1220.8}]
    },
    "rsi14": [{"date": "2025-11-26", "value": 58.3}],
    "macd": [{
      "date": "2025-11-26",
      "macd_line": 12.5,
      "signal_line": 10.2,
      "histogram": 2.3
    }],
    "bollinger": [{
      "date": "2025-11-26",
      "middle": 1235.2,
      "upper": 1268.5,
      "lower": 1201.9,
      "bandwidth": 0.054
    }]
  }
}
```

**1.3.4 クォータ管理ファイル**

```
ファイルパス: data/.quota/alpha_vantage_daily.json
```

```json
{
  "date": "2025-11-26",
  "count": 12,
  "limit": 25,
  "requests": [
    {"time": "2025-11-26T01:00:00Z", "endpoint": "TIME_SERIES_DAILY", "symbol": "9501.T"},
    {"time": "2025-11-26T01:00:05Z", "endpoint": "TIME_SERIES_DAILY", "symbol": "9502.T"},
    {"time": "2025-11-26T01:00:10Z", "endpoint": "FX_DAILY", "pair": "USD/JPY"}
  ]
}
```

### 1.4 外部API統合仕様

**1.4.1 Alpha Vantage API**

Alpha Vantage APIは株価および為替データの取得に使用します。無料プランでは1日25リクエストの制限があるため、効率的なバッチ処理が必須となります。

**使用エンドポイント：**

|エンドポイント|用途|リクエスト/回|
|---|---|---|
|`TIME_SERIES_DAILY`|日次株価データ|1|
|`TIME_SERIES_DAILY_ADJUSTED`|調整済み日次株価|1|
|`FX_DAILY`|日次為替レート|1|
|`GLOBAL_QUOTE`|最新株価（リアルタイム）|1|

**クォータ管理戦略：**

1時間毎のバッチ実行で、1日の合計リクエスト数を25以下に制御します。具体的には、1時間毎のジョブで最大4リクエスト（TEPCO株価、CHUBU株価、USD/JPY、予備）を実行し、6回/日×4=24リクエストに収めます。

**エラーハンドリング：**

```python
# クォータ超過時の処理
if quota["count"] >= quota["limit"]:
    log_warning("Alpha Vantage daily quota exceeded")
    create_github_issue(
        title=f"[MarketVision] AV Quota Exceeded - {today}",
        body="Daily quota of 25 requests exceeded. Data update skipped.",
        labels=["alpha-quota", "data-failure"]
    )
    sys.exit(0)  # 正常終了（次回実行まで待機）
```

### 1.5 計算ロジック仕様

**1.5.1 移動平均線（SMA）**

$$SMA_n = \frac{1}{n} \sum_{i=0}^{n-1} P_{t-i}$$

ここで、$P_t$は時点$t$の終値、$n$は期間（5, 25, 75日）を表します。

**1.5.2 RSI (Relative Strength Index)**

$$RSI = 100 - \frac{100}{1 + RS}$$

$$RS = \frac{\text{Average Gain over } n \text{ periods}}{\text{Average Loss over } n \text{ periods}}$$

初回計算は単純平均、2回目以降は平滑化移動平均を使用します（$n = 14$）。

**1.5.3 MACD**

$$MACD = EMA_{12} - EMA_{26}$$

$$Signal = EMA_9(MACD)$$

$$Histogram = MACD - Signal$$

EMA（指数移動平均）の計算式：

$$EMA_t = P_t \times k + EMA_{t-1} \times (1 - k)$$

$$k = \frac{2}{n + 1}$$

**1.5.4 ボリンジャーバンド**

$$Middle = SMA_{20}$$

$$Upper = Middle + 2\sigma$$

$$Lower = Middle - 2\sigma$$

$$\sigma = \sqrt{\frac{1}{n} \sum_{i=0}^{n-1} (P_{t-i} - SMA_n)^2}$$

### 1.6 APIエンドポイント設計

MarketVisionはStatic Site Generatorとして動作するため、実際のAPIエンドポイントは存在しません。代わりに、静的JSONファイルへのパスがAPIエンドポイントとして機能します。

**チャートデータ取得：**

```
GET /data/price/{symbol}.csv
GET /data/indicators/{symbol}_indicators.json
```

**パラメータ付きクエリのエミュレート：**

フロントエンドでJavaScriptによるフィルタリングを実行します。

```javascript
// 期間フィルタリングの実装
async function getChartData(symbol, period, granularity) {
  const priceData = await fetch(`/data/price/${symbol}.csv`).then(parseCSV);
  const indicators = await fetch(`/data/indicators/${symbol}_indicators.json`).then(r => r.json());
  
  const filteredData = filterByPeriod(priceData, period);
  const aggregatedData = aggregateByGranularity(filteredData, granularity);
  
  return {
    price: aggregatedData,
    indicators: filterIndicators(indicators, period)
  };
}
```

### 1.7 UIコンポーネント仕様

**1.7.1 TickerTile コンポーネント**

```typescript
interface TickerTileProps {
  symbol: string;           // "TEPCO" | "CHUBU"
  currentPrice: number;
  previousClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
  companyColor: 'cyan' | 'magenta';
}

// スタイル仕様
.ticker-tile {
  /* ニューモフィズムベース */
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  min-width: 280px;
  
  /* 二重シャドウ＋グロウ */
  box-shadow:
    -6px -6px 12px var(--shadow-light),
    6px 6px 12px var(--shadow-dark),
    0 0 8px var(--shadow-glow);
}

.ticker-tile--tepco {
  border-left: 4px solid var(--tepco-cyan);
}

.ticker-tile--chubu {
  border-left: 4px solid var(--chubu-magenta);
}

.ticker-tile__price {
  font-size: 2.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ticker-tile__change--positive {
  color: var(--status-positive);
}

.ticker-tile__change--negative {
  color: var(--status-negative);
}
```

**1.7.2 CandlestickChart コンポーネント**

```typescript
interface CandlestickChartProps {
  data: OHLCVData[];
  overlayData?: OHLCVData[];  // 比較用
  smaLines: {
    sma5?: boolean;
    sma25?: boolean;
    sma75?: boolean;
  };
  events?: EventMarker[];
  onRangeSelect?: (start: Date, end: Date) => void;
}

interface EventMarker {
  date: string;
  type: 'earnings' | 'dividend' | 'ex-dividend';
  label: string;
}
```

### 1.8 ディレクトリ構成

```
marketvision/
├── src/
│   ├── components/
│   │   ├── TickerTile.tsx
│   │   ├── CandlestickChart.tsx
│   │   ├── TechnicalIndicators.tsx
│   │   ├── PeriodSelector.tsx
│   │   ├── ComparisonOverlay.tsx
│   │   └── AlertBanner.tsx
│   ├── hooks/
│   │   ├── useChartData.ts
│   │   ├── useIndicators.ts
│   │   └── usePriceAlert.ts
│   ├── utils/
│   │   ├── calculations.ts      # 指標計算ロジック
│   │   ├── dataTransform.ts     # CSV/JSONパース
│   │   └── formatters.ts        # 数値フォーマット
│   ├── styles/
│   │   ├── variables.css
│   │   ├── components.css
│   │   └── charts.css
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── favicon.ico
├── data/
│   ├── price/
│   │   ├── 9501.T.csv
│   │   └── 9502.T.csv
│   ├── fx/
│   │   └── usd_jpy.csv
│   ├── indicators/
│   │   ├── 9501.T_indicators.json
│   │   └── 9502.T_indicators.json
│   ├── events/
│   │   └── corporate_events.json
│   ├── alerts/
│   │   └── price_alerts.json
│   └── .quota/
│       └── alpha_vantage_daily.json
├── scripts/
│   ├── fetch_alpha_vantage.py
│   ├── build_indicators.py
│   ├── quota_manager.py
│   └── check_alerts.py
├── tests/
│   ├── unit/
│   │   ├── calculations.test.ts
│   │   └── indicators.test.py
│   └── e2e/
│       └── chart_interaction.spec.ts
├── .github/
│   └── workflows/
│       ├── update-data.yml
│       └── deploy-pages.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 1.9 GitHub Actions ワークフロー

**update-data.yml（データ更新）：**

```yaml
name: Update Market Data

on:
  schedule:
    - cron: '0 * * * *'  # 毎時0分（UTC）
  workflow_dispatch:
    inputs:
      force_update:
        description: 'Force update ignoring quota'
        required: false
        default: 'false'

env:
  ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}

jobs:
  fetch-market-data:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r scripts/requirements.txt

      - name: Check and update quota
        id: quota
        run: |
          python scripts/quota_manager.py --action check --limit 25
          echo "remaining=$(python scripts/quota_manager.py --action remaining)" >> $GITHUB_OUTPUT

      - name: Fetch market data
        if: steps.quota.outputs.remaining > 0 || github.event.inputs.force_update == 'true'
        run: |
          python scripts/fetch_alpha_vantage.py \
            --symbols "9501.T,9502.T" \
            --fx "USD/JPY" \
            --output-dir data/

      - name: Build indicators
        run: |
          python scripts/build_indicators.py \
            --input-dir data/price/ \
            --output-dir data/indicators/

      - name: Check price alerts
        run: |
          python scripts/check_alerts.py \
            --threshold 5.0 \
            --output data/alerts/price_alerts.json

      - name: Commit and push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update market data - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push

      - name: Create issue on quota exceeded
        if: failure() && steps.quota.outputs.remaining == 0
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[MarketVision] Alpha Vantage Quota Exceeded - ${new Date().toISOString().split('T')[0]}`,
              body: 'Daily API quota (25 requests) has been reached. Market data update was skipped.',
              labels: ['alpha-quota', 'data-failure']
            });
```

**deploy-pages.yml（デプロイ）：**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'vite.config.ts'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Copy data files
        run: cp -r data dist/data

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 1.10 スクリプト実装

**fetch_alpha_vantage.py：**

```python
#!/usr/bin/env python3
"""
Alpha Vantage API データ取得スクリプト
クォータ管理機能付き（1日25リクエスト制限対応）
"""

import os
import sys
import json
import time
import argparse
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Optional

import requests
import pandas as pd

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 定数
API_BASE_URL = "https://www.alphavantage.co/query"
QUOTA_FILE = Path("data/.quota/alpha_vantage_daily.json")
DAILY_LIMIT = 25
REQUEST_DELAY = 12  # 秒（無料枠: 5リクエスト/分 = 12秒間隔）


class QuotaManager:
    """API クォータ管理クラス"""
    
    def __init__(self, quota_path: Path = QUOTA_FILE, limit: int = DAILY_LIMIT):
        self.quota_path = quota_path
        self.limit = limit
        self._ensure_quota_file()
    
    def _ensure_quota_file(self):
        """クォータファイルの初期化"""
        self.quota_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.quota_path.exists():
            self._reset_quota()
    
    def _reset_quota(self):
        """クォータのリセット"""
        quota = {
            "date": str(date.today()),
            "count": 0,
            "limit": self.limit,
            "requests": []
        }
        self._save_quota(quota)
    
    def _load_quota(self) -> dict:
        """クォータファイルの読み込み"""
        with open(self.quota_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save_quota(self, quota: dict):
        """クォータファイルの保存"""
        with open(self.quota_path, 'w', encoding='utf-8') as f:
            json.dump(quota, f, ensure_ascii=False, indent=2)
    
    def check_and_increment(self, endpoint: str, params: dict) -> bool:
        """
        クォータをチェックし、余裕があれば1増加
        Returns: True if request allowed, False if quota exceeded
        """
        quota = self._load_quota()
        
        # 日付が変わっていたらリセット
        if quota["date"] != str(date.today()):
            self._reset_quota()
            quota = self._load_quota()
        
        if quota["count"] >= quota["limit"]:
            logger.warning(f"Quota exceeded: {quota['count']}/{quota['limit']}")
            return False
        
        # リクエスト記録
        quota["count"] += 1
        quota["requests"].append({
            "time": datetime.utcnow().isoformat() + "Z",
            "endpoint": endpoint,
            "params": {k: v for k, v in params.items() if k != "apikey"}
        })
        self._save_quota(quota)
        
        logger.info(f"Quota used: {quota['count']}/{quota['limit']}")
        return True
    
    def remaining(self) -> int:
        """残りクォータ数を返す"""
        quota = self._load_quota()
        if quota["date"] != str(date.today()):
            return self.limit
        return max(0, quota["limit"] - quota["count"])


class AlphaVantageClient:
    """Alpha Vantage API クライアント"""
    
    def __init__(self, api_key: str, quota_manager: QuotaManager):
        self.api_key = api_key
        self.quota = quota_manager
    
    def _request(self, params: dict) -> Optional[dict]:
        """API リクエストの実行"""
        params["apikey"] = self.api_key
        
        # クォータチェック
        if not self.quota.check_and_increment(params.get("function", "unknown"), params):
            return None
        
        try:
            response = requests.get(API_BASE_URL, params=params, timeout=60)
            
            # レート制限対応
            if response.status_code == 429:
                logger.warning("Rate limited. Waiting 60 seconds...")
                time.sleep(60)
                response = requests.get(API_BASE_URL, params=params, timeout=60)
            
            response.raise_for_status()
            data = response.json()
            
            # エラーチェック
            if "Error Message" in data:
                logger.error(f"API Error: {data['Error Message']}")
                return None
            if "Note" in data:
                logger.warning(f"API Note: {data['Note']}")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return None
    
    def get_daily_prices(self, symbol: str, outputsize: str = "compact") -> Optional[pd.DataFrame]:
        """日次株価データの取得"""
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": outputsize
        }
        
        data = self._request(params)
        if not data or "Time Series (Daily)" not in data:
            return None
        
        # DataFrameに変換
        ts = data["Time Series (Daily)"]
        df = pd.DataFrame.from_dict(ts, orient='index')
        df.index = pd.to_datetime(df.index)
        df.columns = ['open', 'high', 'low', 'close', 'volume']
        df = df.astype({
            'open': float, 'high': float, 'low': float, 
            'close': float, 'volume': int
        })
        df = df.sort_index()
        df.index.name = 'date'
        
        return df
    
    def get_fx_daily(self, from_symbol: str = "USD", to_symbol: str = "JPY") -> Optional[pd.DataFrame]:
        """日次為替レートの取得"""
        params = {
            "function": "FX_DAILY",
            "from_symbol": from_symbol,
            "to_symbol": to_symbol,
            "outputsize": "compact"
        }
        
        data = self._request(params)
        if not data or "Time Series FX (Daily)" not in data:
            return None
        
        ts = data["Time Series FX (Daily)"]
        df = pd.DataFrame.from_dict(ts, orient='index')
        df.index = pd.to_datetime(df.index)
        df.columns = ['open', 'high', 'low', 'close']
        df = df.astype(float)
        df = df.sort_index()
        df.index.name = 'date'
        df = df.rename(columns={'close': 'rate'})
        
        return df[['rate', 'high', 'low']]


def main():
    parser = argparse.ArgumentParser(description='Fetch market data from Alpha Vantage')
    parser.add_argument('--symbols', type=str, required=True, help='Comma-separated stock symbols')
    parser.add_argument('--fx', type=str, default='USD/JPY', help='FX pair (e.g., USD/JPY)')
    parser.add_argument('--output-dir', type=str, default='data/', help='Output directory')
    parser.add_argument('--outputsize', type=str, default='compact', choices=['compact', 'full'])
    args = parser.parse_args()
    
    # API キー取得
    api_key = os.environ.get('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        logger.error("ALPHA_VANTAGE_API_KEY environment variable not set")
        sys.exit(1)
    
    # クライアント初期化
    quota = QuotaManager()
    client = AlphaVantageClient(api_key, quota)
    
    output_dir = Path(args.output_dir)
    
    # 株価データ取得
    symbols = [s.strip() for s in args.symbols.split(',')]
    for symbol in symbols:
        logger.info(f"Fetching price data for {symbol}...")
        
        df = client.get_daily_prices(symbol, args.outputsize)
        if df is not None:
            price_dir = output_dir / 'price'
            price_dir.mkdir(parents=True, exist_ok=True)
            
            output_path = price_dir / f"{symbol}.csv"
            df.to_csv(output_path)
            logger.info(f"Saved {len(df)} records to {output_path}")
        else:
            logger.warning(f"Failed to fetch data for {symbol}")
        
        # レート制限対策
        time.sleep(REQUEST_DELAY)
    
    # 為替データ取得
    if args.fx:
        from_sym, to_sym = args.fx.split('/')
        logger.info(f"Fetching FX data for {args.fx}...")
        
        df = client.get_fx_daily(from_sym, to_sym)
        if df is not None:
            fx_dir = output_dir / 'fx'
            fx_dir.mkdir(parents=True, exist_ok=True)
            
            output_path = fx_dir / f"{from_sym.lower()}_{to_sym.lower()}.csv"
            df.to_csv(output_path)
            logger.info(f"Saved {len(df)} records to {output_path}")
    
    logger.info(f"Remaining quota: {quota.remaining()}")


if __name__ == '__main__':
    main()
```

**build_indicators.py：**

```python
#!/usr/bin/env python3
"""
テクニカル指標計算スクリプト
RSI, MACD, ボリンジャーバンド, SMA を計算
"""

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def calculate_sma(prices: pd.Series, period: int) -> pd.Series:
    """単純移動平均の計算"""
    return prices.rolling(window=period, min_periods=period).mean()


def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    """指数移動平均の計算"""
    return prices.ewm(span=period, adjust=False).mean()


def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """RSI (Relative Strength Index) の計算"""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0)
    loss = (-delta).where(delta < 0, 0)
    
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi


def calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
    """MACD の計算"""
    ema_fast = calculate_ema(prices, fast)
    ema_slow = calculate_ema(prices, slow)
    
    macd_line = ema_fast - ema_slow
    signal_line = calculate_ema(macd_line, signal)
    histogram = macd_line - signal_line
    
    return {
        'macd_line': macd_line,
        'signal_line': signal_line,
        'histogram': histogram
    }


def calculate_bollinger(prices: pd.Series, period: int = 20, std_dev: float = 2.0) -> Dict[str, pd.Series]:
    """ボリンジャーバンドの計算"""
    middle = calculate_sma(prices, period)
    std = prices.rolling(window=period, min_periods=period).std()
    
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    bandwidth = (upper - lower) / middle
    
    return {
        'middle': middle,
        'upper': upper,
        'lower': lower,
        'bandwidth': bandwidth
    }


def series_to_records(series: pd.Series, date_index: pd.DatetimeIndex) -> List[Dict[str, Any]]:
    """pd.Series を JSON用のレコードリストに変換"""
    records = []
    for date, value in zip(date_index, series):
        if pd.notna(value):
            records.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(float(value), 4)
            })
    return records


def build_indicators_for_symbol(price_file: Path) -> Dict[str, Any]:
    """指定銘柄の全指標を計算"""
    symbol = price_file.stem
    
    logger.info(f"Processing {symbol}...")
    
    df = pd.read_csv(price_file, index_col='date', parse_dates=True)
    close = df['close']
    
    # 各指標を計算
    indicators = {
        'sma': {
            'sma5': series_to_records(calculate_sma(close, 5), close.index),
            'sma25': series_to_records(calculate_sma(close, 25), close.index),
            'sma75': series_to_records(calculate_sma(close, 75), close.index),
        },
        'rsi14': series_to_records(calculate_rsi(close, 14), close.index),
        'macd': [],
        'bollinger': []
    }
    
    # MACD
    macd = calculate_macd(close)
    for date in close.index:
        if pd.notna(macd['macd_line'].loc[date]):
            indicators['macd'].append({
                'date': date.strftime('%Y-%m-%d'),
                'macd_line': round(float(macd['macd_line'].loc[date]), 4),
                'signal_line': round(float(macd['signal_line'].loc[date]), 4),
                'histogram': round(float(macd['histogram'].loc[date]), 4)
            })
    
    # ボリンジャーバンド
    bb = calculate_bollinger(close)
    for date in close.index:
        if pd.notna(bb['middle'].loc[date]):
            indicators['bollinger'].append({
                'date': date.strftime('%Y-%m-%d'),
                'middle': round(float(bb['middle'].loc[date]), 2),
                'upper': round(float(bb['upper'].loc[date]), 2),
                'lower': round(float(bb['lower'].loc[date]), 2),
                'bandwidth': round(float(bb['bandwidth'].loc[date]), 4)
            })
    
    return {
        'schema_version': '1.0.0',
        'symbol': symbol,
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'indicators': indicators
    }


def main():
    parser = argparse.ArgumentParser(description='Build technical indicators')
    parser.add_argument('--input-dir', type=str, required=True, help='Price data directory')
    parser.add_argument('--output-dir', type=str, required=True, help='Output directory')
    args = parser.parse_args()
    
    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for price_file in input_dir.glob('*.csv'):
        result = build_indicators_for_symbol(price_file)
        
        output_file = output_dir / f"{price_file.stem}_indicators.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved indicators to {output_file}")


if __name__ == '__main__':
    main()
```

### 1.11 テスト仕様

**ユニットテスト（calculations.test.ts）：**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSMA, calculateRSI, calculateMACD, calculateBollinger } from '../utils/calculations';

describe('Technical Indicators', () => {
  const samplePrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 112, 111, 113, 115];

  describe('SMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly for period 5', () => {
      const result = calculateSMA(samplePrices, 5);
      // First 4 values should be null (insufficient data)
      expect(result[0]).toBeNull();
      expect(result[3]).toBeNull();
      // 5th value: (100+102+101+103+105)/5 = 102.2
      expect(result[4]).toBeCloseTo(102.2, 1);
    });

    it('should return empty array for empty input', () => {
      expect(calculateSMA([], 5)).toEqual([]);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    it('should return values between 0 and 100', () => {
      const result = calculateRSI(samplePrices, 14);
      result.filter(v => v !== null).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should indicate overbought when prices continuously rise', () => {
      const risingPrices = Array.from({ length: 20 }, (_, i) => 100 + i);
      const result = calculateRSI(risingPrices, 14);
      const lastValue = result[result.length - 1];
      expect(lastValue).toBeGreaterThan(70); // Overbought threshold
    });
  });

  describe('MACD', () => {
    it('should calculate MACD line as EMA12 - EMA26', () => {
      const result = calculateMACD(samplePrices);
      // MACD should have macd_line, signal_line, and histogram
      expect(result).toHaveProperty('macd_line');
      expect(result).toHaveProperty('signal_line');
      expect(result).toHaveProperty('histogram');
    });

    it('should have histogram equal to macd_line - signal_line', () => {
      const result = calculateMACD(samplePrices);
      const lastIndex = result.macd_line.length - 1;
      if (result.macd_line[lastIndex] !== null && result.signal_line[lastIndex] !== null) {
        expect(result.histogram[lastIndex]).toBeCloseTo(
          result.macd_line[lastIndex] - result.signal_line[lastIndex],
          4
        );
      }
    });
  });

  describe('Bollinger Bands', () => {
    it('should have upper band > middle > lower band', () => {
      const result = calculateBollinger(samplePrices, 20, 2);
      const validIndex = result.middle.findIndex(v => v !== null);
      if (validIndex >= 0) {
        expect(result.upper[validIndex]).toBeGreaterThan(result.middle[validIndex]);
        expect(result.middle[validIndex]).toBeGreaterThan(result.lower[validIndex]);
      }
    });

    it('should have bandwidth > 0', () => {
      const result = calculateBollinger(samplePrices, 20, 2);
      result.bandwidth.filter(v => v !== null).forEach(value => {
        expect(value).toBeGreaterThan(0);
      });
    });
  });
});
```

**E2Eテスト（chart_interaction.spec.ts）：**

```typescript
import { test, expect } from '@playwright/test';

test.describe('MarketVision Chart Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="candlestick-chart"]');
  });

  test('should display ticker tiles with current prices', async ({ page }) => {
    const tepcoTile = page.locator('[data-testid="ticker-tile-tepco"]');
    await expect(tepcoTile).toBeVisible();
    await expect(tepcoTile.locator('.ticker-tile__price')).toHaveText(/\d+\.\d{2}/);
  });

  test('should switch time periods correctly', async ({ page }) => {
    // Click 1Y period button
    await page.click('[data-testid="period-1y"]');
    
    // Verify chart updates (check for loading state transition)
    await page.waitForSelector('[data-testid="candlestick-chart"]:not(.loading)');
    
    // Verify URL or state reflects the change
    await expect(page.locator('[data-testid="period-1y"]')).toHaveClass(/selected/);
  });

  test('should toggle SMA lines', async ({ page }) => {
    // Enable SMA25
    await page.click('[data-testid="toggle-sma25"]');
    
    // Check that SMA line appears in chart
    const smaLine = page.locator('[data-testid="sma-line-25"]');
    await expect(smaLine).toBeVisible();
    
    // Disable SMA25
    await page.click('[data-testid="toggle-sma25"]');
    await expect(smaLine).not.toBeVisible();
  });

  test('should display price alert when threshold exceeded', async ({ page }) => {
    // Mock data with >5% change
    await page.route('**/data/price/*.csv', async route => {
      const mockData = `date,open,high,low,close,volume
2025-11-25,1000,1010,990,1000,100000
2025-11-26,1000,1100,1000,1060,150000`;
      await route.fulfill({ body: mockData });
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="alert-banner"]');
    
    const alertBanner = page.locator('[data-testid="alert-banner"]');
    await expect(alertBanner).toBeVisible();
    await expect(alertBanner).toContainText(/6\.0%/);
  });

  test('should compare TEPCO and CHUBU overlay', async ({ page }) => {
    await page.click('[data-testid="compare-toggle"]');
    
    const tepcoLine = page.locator('[data-testid="chart-line-tepco"]');
    const chubuLine = page.locator('[data-testid="chart-line-chubu"]');
    
    await expect(tepcoLine).toBeVisible();
    await expect(chubuLine).toBeVisible();
  });
});
```

---

## 第2章：ValueScope — 企業価値分析ダッシュボード

### 2.1 アプリケーション概要

ValueScopeは、東京電力ホールディングスおよび中部電力の企業価値指標とKPIを包括的に可視化するダッシュボードです。EV（Enterprise Value）、EV/EBITDA、PER、PBR等の評価指標に加え、ROE、自己資本比率、DSCRといった財務健全性指標を信号機スタイルのスコアカードとゲージで直感的に表示します。

### 2.2 機能要件

**2.2.1 企業価値スコアカード**

各企業の主要な価値指標を一覧表示します。閾値に基づいて青（Good）、黄（Warning）、赤（Critical）の3色で状態を示します。

**表示指標：**

|指標|計算式|青（Good）|黄（Warning）|赤（Critical）|
|---|---|---|---|---|
|EV/EBITDA|EV ÷ EBITDA|< 8|8–12|> 12|
|PER|株価 ÷ EPS|< 15|15–25|> 25|
|PBR|株価 ÷ BPS|< 1.5|1.5–2.5|> 2.5|
|ROE|当期純利益 ÷ 自己資本 × 100|≥ 10%|5–10%|< 5%|
|自己資本比率|自己資本 ÷ 総資産 × 100|≥ 30%|20–30%|< 20%|
|DSCR|営業CF ÷ 元利支払額|≥ 1.5|1.2–1.5|< 1.2|

**2.2.2 KPIゲージパネル**

半円型ゲージで主要KPIの現在値と目標値を視覚的に表示します。

- **ゲージタイプ**：半円（180度）
- **表示情報**：現在値、目標値、前年同期値
- **カラーグラデーション**：赤→黄→緑の連続グラデーション
- **ターゲットライン**：目標値の位置に白い細線

**2.2.3 推移グラフ**

指標の時系列推移を折れ線グラフで表示します。

- **表示期間**：5年分（四半期単位）
- **比較モード**：TEPCO/CHUBU重ね合わせ
- **ベンチマーク**：業界平均線の表示オプション

**2.2.4 相関・レーダーチャート**

- **レーダーチャート**：6指標を正規化して六角形レーダーで表示
- **相関マトリックス**：指標間の相関係数をヒートマップで表示
- **同業比較**：電力業界他社との指標比較（水平棒グラフ）

### 2.3 データモデル定義

**2.3.1 企業価値データ**

```
ファイルパス: data/valuation.json
```

```json
{
  "schema_version": "1.0.0",
  "as_of": "2025-09-30",
  "companies": {
    "TEPCO": {
      "edinet_code": "E04498",
      "market_cap": 1234567890000,
      "total_debt": 789012345678,
      "cash_and_equivalents": 123456789012,
      "enterprise_value": 1900123446666,
      "ebitda": 234567890123,
      "net_income": 123456789012,
      "shareholders_equity": 456789012345,
      "total_assets": 1234567890123,
      "operating_cf": 345678901234,
      "debt_service": 234567890123,
      "shares_outstanding": 1609739999,
      "calculated": {
        "ev_ebitda": 8.10,
        "per": 10.02,
        "pbr": 2.70,
        "eps": 76.72,
        "bps": 283.83,
        "roe": 27.02,
        "equity_ratio": 37.00,
        "dscr": 1.47
      }
    },
    "CHUBU": {
      "edinet_code": "E04503",
      "market_cap": 987654321098,
      "total_debt": 654321098765,
      "cash_and_equivalents": 98765432109,
      "enterprise_value": 1543210987654,
      "ebitda": 198765432109,
      "net_income": 98765432109,
      "shareholders_equity": 398765432109,
      "total_assets": 987654321098,
      "operating_cf": 287654321098,
      "debt_service": 198765432109,
      "shares_outstanding": 762769999,
      "calculated": {
        "ev_ebitda": 7.76,
        "per": 10.00,
        "pbr": 2.48,
        "eps": 129.48,
        "bps": 522.74,
        "roe": 24.77,
        "equity_ratio": 40.38,
        "dscr": 1.45
      }
    }
  }
}
```

**2.3.2 閾値設定ファイル**

```
ファイルパス: data/kpi_thresholds.json
```

```json
{
  "schema_version": "1.0.0",
  "updated_at": "2025-11-01T00:00:00Z",
  "thresholds": {
    "ev_ebitda": {
      "good": { "max": 8 },
      "warning": { "min": 8, "max": 12 },
      "critical": { "min": 12 },
      "lower_is_better": true
    },
    "per": {
      "good": { "max": 15 },
      "warning": { "min": 15, "max": 25 },
      "critical": { "min": 25 },
      "lower_is_better": true
    },
    "pbr": {
      "good": { "max": 1.5 },
      "warning": { "min": 1.5, "max": 2.5 },
      "critical": { "min": 2.5 },
      "lower_is_better": true
    },
    "roe": {
      "good": { "min": 10 },
      "warning": { "min": 5, "max": 10 },
      "critical": { "max": 5 },
      "lower_is_better": false,
      "unit": "percent"
    },
    "equity_ratio": {
      "good": { "min": 30 },
      "warning": { "min": 20, "max": 30 },
      "critical": { "max": 20 },
      "lower_is_better": false,
      "unit": "percent"
    },
    "dscr": {
      "good": { "min": 1.5 },
      "warning": { "min": 1.2, "max": 1.5 },
      "critical": { "max": 1.2 },
      "lower_is_better": false
    }
  }
}
```

**2.3.3 スコアカード出力**

```
ファイルパス: data/scorecards.json
```

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2025-11-26T10:00:00Z",
  "scorecards": {
    "TEPCO": {
      "ev_ebitda": { "value": 8.10, "status": "warning", "trend": "improving" },
      "per": { "value": 10.02, "status": "good", "trend": "stable" },
      "pbr": { "value": 2.70, "status": "critical", "trend": "worsening" },
      "roe": { "value": 27.02, "status": "good", "trend": "improving" },
      "equity_ratio": { "value": 37.00, "status": "good", "trend": "stable" },
      "dscr": { "value": 1.47, "status": "warning", "trend": "stable" }
    },
    "CHUBU": {
      "ev_ebitda": { "value": 7.76, "status": "good", "trend": "stable" },
      "per": { "value": 10.00, "status": "good", "trend": "stable" },
      "pbr": { "value": 2.48, "status": "warning", "trend": "stable" },
      "roe": { "value": 24.77, "status": "good", "trend": "stable" },
      "equity_ratio": { "value": 40.38, "status": "good", "trend": "stable" },
      "dscr": { "value": 1.45, "status": "warning", "trend": "worsening" }
    }
  }
}
```

### 2.4 計算ロジック仕様

**2.4.1 企業価値（EV: Enterprise Value）**

$$EV = \text{時価総額} + \text{純有利子負債}$$

$$\text{純有利子負債} = \text{有利子負債} - \text{現預金}$$

**2.4.2 EV/EBITDA**

$$\frac{EV}{EBITDA} = \frac{\text{Enterprise Value}}{\text{Earnings Before Interest, Taxes, Depreciation, and Amortization}}$$

EBITDAは決算書から取得、または以下で近似：

$$EBITDA \approx \text{営業利益} + \text{減価償却費}$$

**2.4.3 PER（株価収益率）**

$$PER = \frac{\text{株価}}{EPS} = \frac{\text{時価総額}}{\text{当期純利益}}$$

**2.4.4 PBR（株価純資産倍率）**

$$PBR = \frac{\text{株価}}{BPS} = \frac{\text{時価総額}}{\text{自己資本}}$$

**2.4.5 ROE（自己資本利益率）**

$$ROE = \frac{\text{当期純利益}}{\text{自己資本}} \times 100$$

**2.4.6 自己資本比率**

$$\text{自己資本比率} = \frac{\text{自己資本}}{\text{総資産}} \times 100$$

**2.4.7 DSCR（元利金返済カバー率）**

$$DSCR = \frac{\text{営業キャッシュフロー}}{\text{元利支払額}}$$

### 2.5 EDINET連携仕様

ValueScopeはEDINET API v2を使用して、決算短信や有価証券報告書から財務データを取得します。

**2.5.1 API呼び出しフロー**

```
1. 書類一覧取得
   GET /api/v2/documents.json?date={YYYY-MM-DD}&type=2&Subscription-Key={KEY}
   
2. 対象企業の提出書類特定（EDINET Code でフィルタ）

3. CSV変換ZIPダウンロード
   GET /api/v2/documents/{docID}?type=5&Subscription-Key={KEY}
   
4. ZIP解凍 → CSVパース → 必要科目抽出
```

**2.5.2 抽出対象XBRL要素**

|勘定科目|XBRLタグ（例）|用途|
|---|---|---|
|総資産|jppfs_cor:Assets|自己資本比率計算|
|自己資本|jppfs_cor:Equity|ROE、PBR計算|
|有利子負債|jppfs_cor:InterestBearingDebt|EV計算|
|現預金|jppfs_cor:CashAndCashEquivalents|EV計算|
|当期純利益|jppfs_cor:NetIncome|ROE、PER計算|
|営業利益|jppfs_cor:OperatingIncome|EBITDA近似|
|減価償却費|jppfs_cor:DepreciationAndAmortization|EBITDA近似|
|営業CF|jppfs_cor:CashFlowsFromOperatingActivities|DSCR計算|

### 2.6 ディレクトリ構成

```
valuescope/
├── src/
│   ├── components/
│   │   ├── ScoreCard.tsx
│   │   ├── KPIGauge.tsx
│   │   ├── TrendChart.tsx
│   │   ├── RadarChart.tsx
│   │   ├── CorrelationMatrix.tsx
│   │   └── PeerComparison.tsx
│   ├── hooks/
│   │   ├── useValuationData.ts
│   │   ├── useThresholds.ts
│   │   └── useScoreStatus.ts
│   ├── utils/
│   │   ├── valuationCalc.ts
│   │   ├── statusEvaluator.ts
│   │   └── formatters.ts
│   ├── styles/
│   │   ├── variables.css
│   │   ├── scorecard.css
│   │   └── gauges.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── data/
│   ├── edinet_parsed/
│   │   ├── TEPCO_2025Q2.json
│   │   └── CHUBU_2025Q2.json
│   ├── valuation.json
│   ├── kpi_thresholds.json
│   ├── scorecards.json
│   └── historical/
│       └── valuation_history.json
├── scripts/
│   ├── fetch_edinet.py
│   ├── parse_edinet_csv.py
│   ├── build_valuation.py
│   └── compute_scores.py
├── tests/
│   ├── unit/
│   │   ├── valuationCalc.test.ts
│   │   └── statusEvaluator.test.ts
│   └── e2e/
│       └── scorecard.spec.ts
├── .github/
│   └── workflows/
│       ├── update-valuation.yml
│       └── deploy-pages.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 2.7 GitHub Actions ワークフロー

**update-valuation.yml：**

```yaml
name: Update Valuation Data

on:
  schedule:
    - cron: '0 6 * * 1'  # 毎週月曜 6:00 UTC（日本時間15:00）
  workflow_dispatch:
    inputs:
      target_date:
        description: 'Target date for EDINET search (YYYY-MM-DD)'
        required: false
        default: ''

env:
  EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}
  EDINET_BASE_URL: ${{ secrets.EDINET_BASE_URL }}

jobs:
  update-valuation:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r scripts/requirements.txt

      - name: Fetch EDINET documents
        run: |
          TARGET_DATE="${{ github.event.inputs.target_date }}"
          if [ -z "$TARGET_DATE" ]; then
            TARGET_DATE=$(date -u +%Y-%m-%d)
          fi
          python scripts/fetch_edinet.py \
            --date "$TARGET_DATE" \
            --codes "E04498,E04503" \
            --output-dir data/edinet_parsed/

      - name: Parse EDINET CSV data
        run: |
          python scripts/parse_edinet_csv.py \
            --input-dir data/edinet_parsed/ \
            --output data/edinet_parsed/

      - name: Build valuation metrics
        run: |
          python scripts/build_valuation.py \
            --input-dir data/edinet_parsed/ \
            --output data/valuation.json

      - name: Compute scores
        run: |
          python scripts/compute_scores.py \
            --valuation data/valuation.json \
            --thresholds data/kpi_thresholds.json \
            --output data/scorecards.json

      - name: Commit and push changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update valuation data - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push

      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[ValueScope] Valuation Update Failed - ${new Date().toISOString().split('T')[0]}`,
              body: `Workflow run failed. Check the logs for details.\n\nRun ID: ${context.runId}`,
              labels: ['data-failure', 'edinet']
            });
```

### 2.8 UIコンポーネント仕様

**ScoreCard コンポーネント：**

```typescript
interface ScoreCardProps {
  company: 'TEPCO' | 'CHUBU';
  metrics: {
    name: string;
    value: number;
    unit?: string;
    status: 'good' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'worsening';
  }[];
}

// スタイル仕様
.score-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.score-card__metric {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.score-card__indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 0.5rem;
}

.score-card__indicator--good {
  background: var(--status-positive);
  box-shadow: 0 0 8px var(--status-positive);
}

.score-card__indicator--warning {
  background: var(--status-warning);
  box-shadow: 0 0 8px var(--status-warning);
}

.score-card__indicator--critical {
  background: var(--status-negative);
  box-shadow: 0 0 8px var(--status-negative);
}

.score-card__trend-icon {
  font-size: 0.875rem;
  margin-left: 0.25rem;
}

.score-card__trend-icon--improving::before {
  content: '↑';
  color: var(--status-positive);
}

.score-card__trend-icon--worsening::before {
  content: '↓';
  color: var(--status-negative);
}

.score-card__trend-icon--stable::before {
  content: '→';
  color: var(--status-neutral);
}
```

---

## 第3章：FinSight — 財務諸表分析ダッシュボード

### 3.1 アプリケーション概要

FinSightは、PL（損益計算書）、BS（貸借対照表）、CF（キャッシュフロー計算書）の詳細比較と分析機能を提供する財務分析ダッシュボードです。四半期・通期での推移分析、前年同期との差異ハイライト、注記からのリスク情報抽出・会計方針変更検知といった高度な分析機能を備えています。

### 3.2 機能要件

**3.2.1 損益計算書（PL）分析**

- **推移グラフ**：売上高、営業利益、経常利益、当期純利益の四半期推移
- **構成比分析**：売上高を100%とした各費目の構成比
- **前年同期比較**：同一四半期での前年比較、差異のハイライト表示
- **マージン推移**：営業利益率、経常利益率、純利益率のトレンド

**3.2.2 貸借対照表（BS）分析**

- **構成図**：流動資産/固定資産、流動負債/固定負債/純資産の積み上げ棒グラフ
- **流動比率・当座比率**：短期支払能力の指標
- **資産回転率**：総資産回転率、固定資産回転率

**3.2.3 キャッシュフロー計算書（CF）分析**

- **三区分推移**：営業CF、投資CF、財務CFの推移
- **フリーキャッシュフロー**：営業CF + 投資CF
- **現金残高推移**：期首残高からの増減累計

**3.2.4 財務健全性スコア**

総合的な財務健全性を100点満点でスコア化します。

$$\text{健全性スコア} = w_1 \times S_{流動性} + w_2 \times S_{収益性} + w_3 \times S_{安定性} + w_4 \times S_{CF}$$

重み付け：$w_1 = 0.25, w_2 = 0.30, w_3 = 0.25, w_4 = 0.20$

**3.2.5 注記NLP分析**

有価証券報告書の注記から以下を抽出します。

- **リスク情報**：訴訟、減損、引当金関連の記述をスコア付け
- **会計方針変更**：「会計方針の変更」セクションの検出と要約
- **重要性判定**：テキストの重要度を0.0–1.0でスコアリング

### 3.3 データモデル定義

**3.3.1 損益計算書データ**

```
ファイルパス: data/financials/{company}_pl_quarterly.csv
```

|カラム名|データ型|説明|
|---|---|---|
|period|string|期間（例: 2025Q2）|
|date|string|期末日（ISO8601）|
|revenue|number|売上高|
|cost_of_sales|number|売上原価|
|gross_profit|number|売上総利益|
|sga_expenses|number|販管費|
|operating_income|number|営業利益|
|non_operating_income|number|営業外収益|
|non_operating_expenses|number|営業外費用|
|ordinary_income|number|経常利益|
|extraordinary_income|number|特別利益|
|extraordinary_losses|number|特別損失|
|income_before_taxes|number|税引前当期純利益|
|income_taxes|number|法人税等|
|net_income|number|当期純利益|

**3.3.2 貸借対照表データ**

```
ファイルパス: data/financials/{company}_bs_quarterly.csv
```

|カラム名|データ型|説明|
|---|---|---|
|period|string|期間|
|date|string|期末日|
|current_assets|number|流動資産|
|fixed_assets|number|固定資産|
|total_assets|number|総資産|
|current_liabilities|number|流動負債|
|fixed_liabilities|number|固定負債|
|total_liabilities|number|負債合計|
|shareholders_equity|number|株主資本|
|total_equity|number|純資産合計|

**3.3.3 キャッシュフロー計算書データ**

```
ファイルパス: data/financials/{company}_cf_quarterly.csv
```

|カラム名|データ型|説明|
|---|---|---|
|period|string|期間|
|date|string|期末日|
|operating_cf|number|営業活動によるCF|
|investing_cf|number|投資活動によるCF|
|financing_cf|number|財務活動によるCF|
|cash_beginning|number|期首現金残高|
|cash_ending|number|期末現金残高|
|free_cash_flow|number|フリーCF（計算値）|

**3.3.4 財務比率データ**

```
ファイルパス: data/ratios.csv
```

|カラム名|データ型|説明|
|---|---|---|
|company|string|企業名|
|period|string|期間|
|current_ratio|number|流動比率（%）|
|quick_ratio|number|当座比率（%）|
|operating_margin|number|営業利益率（%）|
|net_margin|number|純利益率（%）|
|asset_turnover|number|総資産回転率（回）|
|health_score|number|健全性スコア（0-100）|

**3.3.5 注記NLP分析結果**

```
ファイルパス: data/xbrl_notes.json
```

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2025-11-26T10:00:00Z",
  "notes": [
    {
      "company": "TEPCO",
      "period": "2025Q2",
      "doc_id": "S100ABC1",
      "category": "risk",
      "title": "原子力発電所関連リスク",
      "text": "福島第一原子力発電所の廃炉・汚染水処理に関して...",
      "severity": 0.85,
      "keywords": ["廃炉", "汚染水", "賠償"],
      "detected_at": "2025-11-26T08:30:00Z"
    },
    {
      "company": "TEPCO",
      "period": "2025Q2",
      "doc_id": "S100ABC1",
      "category": "policy_change",
      "title": "収益認識に関する会計基準の適用",
      "text": "「収益認識に関する会計基準」（企業会計基準第29号）を適用し...",
      "severity": 0.60,
      "keywords": ["収益認識", "会計基準", "適用"],
      "detected_at": "2025-11-26T08:30:00Z"
    }
  ]
}
```

### 3.4 計算ロジック仕様

**3.4.1 流動比率**

$$\text{流動比率} = \frac{\text{流動資産}}{\text{流動負債}} \times 100$$

**3.4.2 当座比率**

$$\text{当座比率} = \frac{\text{当座資産}}{\text{流動負債}} \times 100$$

$$\text{当座資産} = \text{現金預金} + \text{売掛金} + \text{有価証券}$$

**3.4.3 営業利益率**

$$\text{営業利益率} = \frac{\text{営業利益}}{\text{売上高}} \times 100$$

**3.4.4 フリーキャッシュフロー**

$$FCF = \text{営業CF} + \text{投資CF}$$

**3.4.5 健全性スコア計算**

各サブスコアは0–100で正規化し、以下の閾値で計算します。

|サブスコア|指標|100点の条件|0点の条件|
|---|---|---|---|
|流動性|流動比率|≥ 200%|≤ 100%|
|収益性|営業利益率|≥ 15%|≤ 0%|
|安定性|自己資本比率|≥ 50%|≤ 10%|
|CF|FCF/売上高|≥ 10%|≤ -5%|

### 3.5 EDINET連携仕様

FinSightはValueScopeと同様のEDINET API v2を使用しますが、より詳細な勘定科目を抽出します。

**抽出対象勘定科目：**

```python
PL_ITEMS = [
    ("jppfs_cor:NetSales", "revenue"),
    ("jppfs_cor:CostOfSales", "cost_of_sales"),
    ("jppfs_cor:GrossProfit", "gross_profit"),
    ("jppfs_cor:SellingGeneralAndAdministrativeExpenses", "sga_expenses"),
    ("jppfs_cor:OperatingIncome", "operating_income"),
    ("jppfs_cor:OrdinaryIncome", "ordinary_income"),
    ("jppfs_cor:NetIncome", "net_income"),
]

BS_ITEMS = [
    ("jppfs_cor:CurrentAssets", "current_assets"),
    ("jppfs_cor:NoncurrentAssets", "fixed_assets"),
    ("jppfs_cor:Assets", "total_assets"),
    ("jppfs_cor:CurrentLiabilities", "current_liabilities"),
    ("jppfs_cor:NoncurrentLiabilities", "fixed_liabilities"),
    ("jppfs_cor:Liabilities", "total_liabilities"),
    ("jppfs_cor:NetAssets", "total_equity"),
]

CF_ITEMS = [
    ("jppfs_cor:CashFlowsFromOperatingActivities", "operating_cf"),
    ("jppfs_cor:CashFlowsFromInvestingActivities", "investing_cf"),
    ("jppfs_cor:CashFlowsFromFinancingActivities", "financing_cf"),
    ("jppfs_cor:CashAndCashEquivalents", "cash_ending"),
]
```

### 3.6 NLP分析仕様

**3.6.1 リスク検出キーワード**

```python
RISK_KEYWORDS = {
    "high": ["訴訟", "賠償", "減損", "損失", "破綻", "廃炉", "事故"],
    "medium": ["引当金", "不確実性", "リスク", "懸念", "影響"],
    "low": ["変動", "依存", "競争", "規制"]
}
```

**3.6.2 会計方針変更検出パターン**

```python
POLICY_CHANGE_PATTERNS = [
    r"会計方針の変更",
    r"会計基準.*適用",
    r"表示方法の変更",
    r"遡及適用",
    r"経過措置",
]
```

**3.6.3 重要度スコア計算**

$$\text{Severity} = \min(1.0, \sum_{k \in \text{keywords}} w_k \times \text{count}(k))$$

重み：high = 0.3、medium = 0.15、low = 0.05

### 3.7 ディレクトリ構成

```
finsight/
├── src/
│   ├── components/
│   │   ├── PLAnalysis.tsx
│   │   ├── BSAnalysis.tsx
│   │   ├── CFAnalysis.tsx
│   │   ├── HealthScore.tsx
│   │   ├── NotesList.tsx
│   │   ├── ComparisonTable.tsx
│   │   └── DifferenceHighlight.tsx
│   ├── hooks/
│   │   ├── useFinancials.ts
│   │   ├── useRatios.ts
│   │   └── useNotes.ts
│   ├── utils/
│   │   ├── ratioCalc.ts
│   │   ├── healthScore.ts
│   │   ├── comparison.ts
│   │   └── formatters.ts
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── data/
│   ├── financials/
│   │   ├── TEPCO_pl_quarterly.csv
│   │   ├── TEPCO_bs_quarterly.csv
│   │   ├── TEPCO_cf_quarterly.csv
│   │   ├── CHUBU_pl_quarterly.csv
│   │   ├── CHUBU_bs_quarterly.csv
│   │   └── CHUBU_cf_quarterly.csv
│   ├── ratios.csv
│   └── xbrl_notes.json
├── scripts/
│   ├── extract_financials.py
│   ├── compute_ratios.py
│   ├── nlp_notes_risk.py
│   └── requirements.txt
├── tests/
├── .github/
│   └── workflows/
│       ├── update-financials.yml
│       └── deploy-pages.yml
├── package.json
└── README.md
```

### 3.8 GitHub Actions ワークフロー

**update-financials.yml：**

```yaml
name: Update Financial Data

on:
  schedule:
    - cron: '0 7 * * 1,4'  # 月・木 7:00 UTC
  workflow_dispatch:

env:
  EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}
  EDINET_BASE_URL: ${{ secrets.EDINET_BASE_URL }}

jobs:
  update-financials:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r scripts/requirements.txt

      - name: Extract financial statements
        run: |
          python scripts/extract_financials.py \
            --codes "E04498,E04503" \
            --output-dir data/financials/

      - name: Compute financial ratios
        run: |
          python scripts/compute_ratios.py \
            --input-dir data/financials/ \
            --output data/ratios.csv

      - name: Analyze notes with NLP
        run: |
          python scripts/nlp_notes_risk.py \
            --input-dir data/financials/ \
            --output data/xbrl_notes.json

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update financial data - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push
```

---

## 第4章：EnergyChain — JERA貢献度分析ダッシュボード

### 4.1 アプリケーション概要

EnergyChainは、東京電力ホールディングスおよび中部電力の「受取配当金」の推移を可視化し、JERA（両社の折半出資による発電会社）からの配当貢献をトラッキングするダッシュボードです。

**重要な設計原則として**、親会社の単独PLに計上される「受取配当金」の金額をそのまま使用し、出資比率（50%）による調整は一切行いません。これは、開示される財務情報をありのまま表示するという原則に基づいています。

### 4.2 機能要件

**4.2.1 受取配当金トレンド**

両社の受取配当金の時系列推移を表示します。

- **ライングラフ**：TEPCOをシアン、CHUBUをマゼンタで表示
- **棒グラフ**：四半期毎の受取配当金額を積み上げ表示
- **期間選択**：1Y、3Y、5Y、全期間

**4.2.2 ウォーターフォールチャート**

年度間の受取配当金変動要因を可視化します。

- **開始値**：前年度受取配当金
- **増減要因**：JERA配当、その他関連会社配当
- **終了値**：当年度受取配当金

**4.2.3 イベントマーカー**

JERAの配当決議日や支払日をチャート上にマーカー表示します。

- **表示情報**：日付、配当金額、決議種別（中間/期末）
- **ツールチップ**：詳細情報のホバー表示

**4.2.4 比較分析**

TEPCO/CHUBUの受取配当金を比較します。

- **横棒グラフ**：期間毎の両社比較
- **成長率**：前年同期比の成長率表示

### 4.3 データモデル定義

**4.3.1 受取配当金トレンドデータ**

```
ファイルパス: data/contribution_trend.csv
```

|カラム名|データ型|説明|
|---|---|---|
|date|string|期末日（ISO8601）|
|doc_id|string|EDINET書類ID|
|company|string|企業名（TEPCO/CHUBU）|
|period|string|会計期間（例: 2025Q2）|
|dividends_received|number|受取配当金（百万円）|
|source|string|データソース（edinet/manual）|

**4.3.2 メタデータ**

```
ファイルパス: data/contribution_metadata.json
```

```json
{
  "schema_version": "1.0.0",
  "last_updated": "2025-11-26T10:00:00Z",
  "companies": {
    "TEPCO": {
      "edinet_code": "E04498",
      "formal_name": "東京電力ホールディングス株式会社",
      "fiscal_year_end": "03-31"
    },
    "CHUBU": {
      "edinet_code": "E04503",
      "formal_name": "中部電力株式会社",
      "fiscal_year_end": "03-31"
    }
  },
  "jera_events": [
    {
      "date": "2025-05-15",
      "type": "dividend_resolution",
      "description": "2025年3月期 期末配当決議",
      "amount_per_share": null
    }
  ],
  "data_notes": "受取配当金は親会社単独PLの値をそのまま使用。出資比率調整は行わない。"
}
```

**4.3.3 タクソノミマッピング**

```
ファイルパス: data/taxonomy_map.json
```

```json
{
  "schema_version": "1.0.0",
  "mappings": {
    "dividends_received": {
      "preferred": ["jppfs_cor:DividendsIncome", "jppfs_cor:DividendIncome"],
      "alternatives": [
        "jpcrp_cor:DividendsReceivedNOI",
        "受取配当金",
        "受取配当金（営業外収益）"
      ],
      "context": "NonConsolidatedMember",
      "notes": "単独決算の営業外収益に計上される受取配当金を対象とする"
    }
  },
  "fiscal_years": {
    "2024": "2023-04-01/2024-03-31",
    "2025": "2024-04-01/2025-03-31"
  }
}
```

### 4.4 EDINET連携仕様

EnergyChainはEDINET API v2から「受取配当金」を抽出します。抽出対象は**単独決算（NonConsolidated）の損益計算書における営業外収益の「受取配当金」**です。

**4.4.1 API呼び出しシーケンス**

```python
# 1. 書類一覧取得
GET /api/v2/documents.json
  ?date=2025-11-26
  &type=2  # 決算短信、有価証券報告書等
  &Subscription-Key={EDINET_API_KEY}

# 2. 対象書類のフィルタリング
# edinetCode が E04498 または E04503
# docTypeCode が "120" (有報) または "140" (四半期報告書)

# 3. CSV変換ZIPダウンロード
GET /api/v2/documents/{docID}
  ?type=5  # CSV変換ZIP
  &Subscription-Key={EDINET_API_KEY}

# 4. ZIP解凍 → CSVパース → 受取配当金抽出
```

**4.4.2 受取配当金抽出ロジック**

```python
def extract_dividends_received(csv_zip_bytes: bytes) -> Optional[float]:
    """
    CSVから受取配当金を抽出
    
    検索優先順位:
    1. 勘定科目タグ: jppfs_cor:DividendsIncome
    2. 勘定科目名: "受取配当金"
    3. 代替タグ: jpcrp_cor:DividendsReceivedNOI
    
    コンテキスト条件:
    - NonConsolidatedMember（単独決算）
    - CurrentYearDuration または CurrentYTDDuration
    """
    with zipfile.ZipFile(io.BytesIO(csv_zip_bytes)) as z:
        for filename in z.namelist():
            if not filename.endswith('.csv'):
                continue
            
            with z.open(filename) as f:
                reader = csv.DictReader(io.TextIOWrapper(f, encoding='utf-8'))
                for row in reader:
                    # タグまたはラベルで検索
                    element = row.get('element', '') or row.get('要素ID', '')
                    label = row.get('label', '') or row.get('勘定科目', '')
                    context = row.get('context', '') or row.get('コンテキストID', '')
                    
                    # 単独決算の受取配当金をチェック
                    is_dividends = (
                        'DividendsIncome' in element or
                        'DividendsReceived' in element or
                        '受取配当金' in label
                    )
                    is_non_consolidated = 'NonConsolidated' in context
                    is_current_period = 'Current' in context
                    
                    if is_dividends and is_non_consolidated and is_current_period:
                        amount = row.get('value', '') or row.get('金額', '')
                        if amount:
                            return float(amount)
    
    return None
```

### 4.5 ディレクトリ構成

```
energychain/
├── src/
│   ├── components/
│   │   ├── TrendChart.tsx
│   │   ├── WaterfallChart.tsx
│   │   ├── EventMarker.tsx
│   │   ├── ComparisonBar.tsx
│   │   └── DataTable.tsx
│   ├── hooks/
│   │   ├── useContributionData.ts
│   │   └── useJeraEvents.ts
│   ├── utils/
│   │   ├── chartTransform.ts
│   │   └── formatters.ts
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── data/
│   ├── contribution_trend.csv
│   ├── contribution_metadata.json
│   └── taxonomy_map.json
├── scripts/
│   ├── fetch_edinet_dividends.py
│   ├── build_contribution.py
│   └── requirements.txt
├── tests/
│   ├── unit/
│   │   └── extract_dividends.test.py
│   └── e2e/
│       └── trend_chart.spec.ts
├── .github/
│   └── workflows/
│       ├── update-energychain.yml
│       └── deploy-pages.yml
├── package.json
└── README.md
```

### 4.6 GitHub Actions ワークフロー

**update-energychain.yml：**

```yaml
name: Update EnergyChain Data

on:
  schedule:
    - cron: '0 8 1,15 * *'  # 毎月1日と15日 8:00 UTC
  workflow_dispatch:
    inputs:
      search_days:
        description: 'Number of days to search back'
        required: false
        default: '30'

env:
  EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}
  EDINET_BASE_URL: ${{ secrets.EDINET_BASE_URL }}

jobs:
  update-contribution:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r scripts/requirements.txt

      - name: Fetch EDINET dividends data
        run: |
          python scripts/fetch_edinet_dividends.py \
            --codes "E04498,E04503" \
            --days "${{ github.event.inputs.search_days || '30' }}" \
            --output data/contribution_trend.csv

      - name: Build contribution analysis
        run: |
          python scripts/build_contribution.py \
            --input data/contribution_trend.csv \
            --metadata data/contribution_metadata.json

      - name: Validate data integrity
        run: |
          python scripts/validate_contribution.py \
            --input data/contribution_trend.csv

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update contribution data - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          git push

      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[EnergyChain] Data Update Failed - ${new Date().toISOString().split('T')[0]}`,
              body: `Failed to update contribution data. Check logs for details.\n\nRun ID: ${context.runId}`,
              labels: ['data-failure', 'edinet', 'energychain']
            });
```

### 4.7 スクリプト実装

**fetch_edinet_dividends.py：**

```python
#!/usr/bin/env python3
"""
EDINET API v2 から受取配当金データを取得するスクリプト

重要: 親会社単独PLの「受取配当金」をそのまま使用。
      出資比率による調整は行わない。
"""

import os
import sys
import io
import csv
import json
import zipfile
import argparse
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Any

import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 環境変数
EDINET_BASE_URL = os.environ.get('EDINET_BASE_URL', 'https://api.edinet-fsa.go.jp/api/v2')
EDINET_API_KEY = os.environ.get('EDINET_API_KEY')

# 対象書類タイプ
TARGET_DOC_TYPES = ['120', '140', '160']  # 有報、四半期報告書、半期報告書

# 受取配当金の検索パターン
DIVIDENDS_PATTERNS = [
    'DividendsIncome',
    'DividendIncome',
    'DividendsReceived',
    '受取配当金',
]


class EDINETClient:
    """EDINET API v2 クライアント"""
    
    def __init__(self, api_key: str, base_url: str = EDINET_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Subscription-Key': api_key
        })
    
    def list_documents(self, date: str, doc_type: int = 2) -> List[Dict]:
        """書類一覧を取得"""
        url = f"{self.base_url}/documents.json"
        params = {
            'date': date,
            'type': doc_type
        }
        
        response = self.session.get(url, params=params, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        return data.get('results', [])
    
    def download_csv_zip(self, doc_id: str) -> bytes:
        """CSV変換ZIPをダウンロード"""
        url = f"{self.base_url}/documents/{doc_id}"
        params = {'type': 5}  # CSV変換ZIP
        
        response = self.session.get(url, params=params, timeout=120)
        response.raise_for_status()
        
        return response.content


def extract_dividends_from_csv_zip(zip_content: bytes) -> Optional[float]:
    """
    CSV ZIPから受取配当金を抽出
    
    単独決算（NonConsolidated）の営業外収益における
    「受取配当金」を検索して返す
    """
    try:
        with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
            for filename in z.namelist():
                if not filename.endswith('.csv'):
                    continue
                
                logger.debug(f"Processing: {filename}")
                
                with z.open(filename) as f:
                    # BOM対応
                    content = f.read()
                    try:
                        text = content.decode('utf-8-sig')
                    except:
                        text = content.decode('cp932', errors='replace')
                    
                    reader = csv.DictReader(io.StringIO(text))
                    
                    for row in reader:
                        # 要素IDまたはラベルを取得
                        element = (
                            row.get('要素ID', '') or 
                            row.get('element', '') or 
                            row.get('ElementId', '')
                        )
                        label = (
                            row.get('項目名', '') or 
                            row.get('label', '') or 
                            row.get('勘定科目', '')
                        )
                        context = (
                            row.get('コンテキストID', '') or 
                            row.get('context', '') or 
                            row.get('ContextId', '')
                        )
                        value = (
                            row.get('値', '') or 
                            row.get('value', '') or 
                            row.get('金額', '')
                        )
                        
                        # 受取配当金かチェック
                        is_dividends = any(
                            pattern in element or pattern in label 
                            for pattern in DIVIDENDS_PATTERNS
                        )
                        
                        # 単独決算かチェック
                        is_non_consolidated = (
                            'NonConsolidated' in context or
                            '非連結' in context or
                            'Individual' in context
                        )
                        
                        # 当期の値かチェック
                        is_current = (
                            'Current' in context or
                            '当期' in context
                        )
                        
                        if is_dividends and is_non_consolidated and is_current:
                            if value and value.strip():
                                try:
                                    # カンマ除去、数値変換
                                    amount = float(value.replace(',', '').replace('円', ''))
                                    logger.info(f"Found dividends: {amount} (context: {context})")
                                    return amount
                                except ValueError:
                                    continue
        
        logger.warning("Dividends received not found in CSV")
        return None
        
    except zipfile.BadZipFile:
        logger.error("Invalid ZIP file")
        return None
    except Exception as e:
        logger.error(f"Error extracting dividends: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description='Fetch dividends received from EDINET')
    parser.add_argument('--codes', type=str, required=True, help='EDINET codes (comma-separated)')
    parser.add_argument('--days', type=int, default=30, help='Days to search back')
    parser.add_argument('--output', type=str, required=True, help='Output CSV file')
    args = parser.parse_args()
    
    if not EDINET_API_KEY:
        logger.error("EDINET_API_KEY environment variable not set")
        sys.exit(1)
    
    client = EDINETClient(EDINET_API_KEY)
    codes = [c.strip() for c in args.codes.split(',')]
    
    # 既存データの読み込み
    output_path = Path(args.output)
    existing_records = {}
    if output_path.exists():
        with open(output_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row['date'], row['company'])
                existing_records[key] = row
    
    # 日付範囲の生成
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.days)
    
    new_records = []
    
    # 各日付で書類を検索
    current = start_date
    while current <= end_date:
        date_str = current.strftime('%Y-%m-%d')
        logger.info(f"Searching documents for {date_str}")
        
        try:
            documents = client.list_documents(date_str)
            
            for doc in documents:
                edinet_code = doc.get('edinetCode', '')
                doc_type = doc.get('docTypeCode', '')
                
                if edinet_code not in codes:
                    continue
                if doc_type not in TARGET_DOC_TYPES:
                    continue
                
                doc_id = doc.get('docID')
                company = 'TEPCO' if edinet_code == 'E04498' else 'CHUBU'
                period_end = doc.get('periodEnd', date_str)
                
                logger.info(f"Processing {company} document: {doc_id}")
                
                # CSV ZIPダウンロード
                zip_content = client.download_csv_zip(doc_id)
                
                # 受取配当金抽出
                dividends = extract_dividends_from_csv_zip(zip_content)
                
                if dividends is not None:
                    record = {
                        'date': period_end,
                        'doc_id': doc_id,
                        'company': company,
                        'period': doc.get('periodEnd', '')[:7].replace('-', 'Q'),
                        'dividends_received': dividends,
                        'source': 'edinet'
                    }
                    new_records.append(record)
                    logger.info(f"Extracted: {company} {period_end} = {dividends}")
        
        except Exception as e:
            logger.warning(f"Error processing {date_str}: {e}")
        
        current += timedelta(days=1)
    
    # 結果をマージして保存
    all_records = list(existing_records.values())
    for record in new_records:
        key = (record['date'], record['company'])
        if key not in existing_records:
            all_records.append(record)
    
    # 日付でソート
    all_records.sort(key=lambda x: (x['date'], x['company']))
    
    # CSV出力
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['date', 'doc_id', 'company', 'period', 'dividends_received', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)
    
    logger.info(f"Saved {len(all_records)} records to {output_path}")


if __name__ == '__main__':
    main()
```

---

## 第5章：PulseWatch — ニュース・アラートダッシュボード

### 5.1 アプリケーション概要

PulseWatchは、東京電力・中部電力に関連する最新ニュースとプレスリリースを収集し、タグ付けとセンチメント分析を行うダッシュボードです。重大なネガティブニュース（Critical）を検出した場合は、画面上部にバナー表示するとともに、GitHub Issueを自動起票して関係者に通知します。

### 5.2 機能要件

**5.2.1 ニュースフィード**

最新のニュース・プレスリリースを時系列で表示します。

- **表示項目**：タイトル、要旨（100文字）、ソース、公開日時、タグ、センチメントスコア
- **フィルタ**：ソース別、タグ別、期間別
- **ソート**：新着順、センチメント順、重要度順

**5.2.2 タグ分類**

ニュースを以下のカテゴリでタグ付けします。

|タグ|説明|キーワード例|
|---|---|---|
|事故|設備トラブル、事故|事故、トラブル、停止、漏洩|
|規制|行政処分、規制変更|規制、行政、処分、認可|
|財務|業績、財務関連|決算、業績、増益、減益|
|人事|役員人事|社長、CEO、人事、就任|
|環境|環境・ESG|脱炭素、再エネ、ESG|
|JERA|JERA関連|JERA、火力、発電|
|原子力|原発関連|原子力、再稼働、柏崎|

**5.2.3 センチメント分析**

各ニュースに対して -1.0（非常にネガティブ）から +1.0（非常にポジティブ）のセンチメントスコアを付与します。

**閾値定義：**

|範囲|分類|表示色|
|---|---|---|
|≤ -0.6|Critical|赤|
|-0.6 to -0.2|Negative|オレンジ|
|-0.2 to 0.2|Neutral|グレー|
|0.2 to 0.6|Positive|黄緑|
|≥ 0.6|Very Positive|緑|

**5.2.4 クリティカルアラート**

センチメントスコアが -0.6 以下のニュースを検出した場合：

1. **バナー表示**：画面上部にスライドイン表示（赤背景、パルスアニメーション）
2. **GitHub Issue起票**：ラベル `critical-news` で自動作成
3. **履歴保存**：`data/alerts.json` に記録

**5.2.5 アラート履歴**

過去のクリティカルアラートを一覧表示します。

- **表示項目**：日時、タイトル、センチメントスコア、対応状況
- **フィルタ**：未対応/対応済み

### 5.3 データモデル定義

**5.3.1 ニュースデータ**

```
ファイルパス: data/news.json
```

```json
{
  "schema_version": "1.0.0",
  "last_updated": "2025-11-26T10:00:00Z",
  "items": [
    {
      "id": "news-20251126-001",
      "source": "PressRelease",
      "source_url": "https://www.tepco.co.jp/press/...",
      "company": "TEPCO",
      "published_at": "2025-11-26T08:30:00Z",
      "title": "柏崎刈羽原子力発電所における安全対策の完了について",
      "summary": "当社は、柏崎刈羽原子力発電所の安全対策工事が完了したことをお知らせします...",
      "full_text": "...",
      "tags": ["原子力", "規制"],
      "sentiment": {
        "score": 0.35,
        "label": "positive",
        "confidence": 0.82
      },
```