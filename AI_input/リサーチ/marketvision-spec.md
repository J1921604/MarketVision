
# MarketVision — 実装仕様書 v1.0

## 1. プロジェクト概要

### 1.1 目的
東京電力HD（9501.T）・中部電力（9502.T）の株価データに為替（USD/JPY）を重ねて表示し、テクニカル指標・イベントマーカーを用いた**インタラクティブな価格分析環境**を提供する。

### 1.2 スコープ
- 日次OHLCV（ローソク足）チャート
- テクニカル指標（SMA、RSI、MACD、ボリンジャーバンド）
- 為替オーバーレイ（USD/JPY）
- イベントマーカー（決算日、権利落ち日）
- ±5%価格変動アラート
- 期間フィルタ（1M/3M/6M/1Y/3Y/5Y/Custom）
- 企業間比較（TEPCO vs CHUBU）

---

## 2. 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript |
| チャート | Recharts / D3.js |
| スタイリング | Tailwind CSS + CSS Variables |
| ビルド | Vite |
| ホスティング | GitHub Pages |
| データ更新 | GitHub Actions (Cron) |
| 外部API | Alpha Vantage (無料枠: 25req/day) |

---

## 3. ディレクトリ構成

```
marketvision/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml
│       └── update-data.yml
├── src/
│   ├── components/
│   │   ├── TickerTiles.tsx
│   │   ├── ChartCanvas.tsx
│   │   ├── TechnicalPanel.tsx
│   │   ├── PeriodSelector.tsx
│   │   ├── ComparisonToggle.tsx
│   │   └── AlertBanner.tsx
│   ├── hooks/
│   │   ├── useMarketData.ts
│   │   └── useAlerts.ts
│   ├── utils/
│   │   ├── indicators.ts
│   │   ├── formatters.ts
│   │   └── theme.ts
│   ├── types/
│   │   └── market.d.ts
│   ├── App.tsx
│   └── main.tsx
├── data/
│   ├── price/
│   │   ├── 9501.T.csv
│   │   └── 9502.T.csv
│   ├── fx/
│   │   └── usd_jpy.csv
│   ├── indicators/
│   │   ├── 9501.T_sma.csv
│   │   ├── 9501.T_rsi.csv
│   │   ├── 9501.T_macd.csv
│   │   └── 9501.T_bb.csv
│   ├── events/
│   │   └── corporate_events.json
│   └── .quota/
│       └── alpha_vantage_daily.json
├── scripts/
│   ├── fetch_alpha_vantage.py
│   ├── build_indicators.py
│   ├── quota_init.py
│   └── validate_data.py
├── public/
│   └── favicon.ico
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 4. データモデル

### 4.1 価格データ (CSV)
**ファイル**: `data/price/{symbol}.csv`

```csv
date,open,high,low,close,volume
2025-11-26,1234.0,1250.0,1220.0,1245.0,1002000
2025-11-27,1245.0,1260.0,1235.0,1255.0,985000
```

### 4.2 為替データ (CSV)
**ファイル**: `data/fx/usd_jpy.csv`

```csv
date,rate
2025-11-26,151.23
2025-11-27,151.45
```

### 4.3 テクニカル指標 (CSV)
**ファイル**: `data/indicators/{symbol}_sma.csv`

```csv
date,sma5,sma25,sma75
2025-11-26,1240.5,1235.2,1230.8
```

**ファイル**: `data/indicators/{symbol}_rsi.csv`

```csv
date,rsi14
2025-11-26,58.3
```

### 4.4 イベント (JSON)
**ファイル**: `data/events/corporate_events.json`

```json
[
  {
    "date": "2025-11-15",
    "symbol": "9501.T",
    "type": "earnings",
    "label": "Q2決算発表"
  },
  {
    "date": "2025-09-26",
    "symbol": "9501.T",
    "type": "ex-dividend",
    "label": "権利落ち日"
  }
]
```

### 4.5 アラート (JSON)
**ファイル**: `data/alerts.json`

```json
[
  {
    "timestamp": "2025-11-26T09:30:00Z",
    "symbol": "9501.T",
    "change_pct": -5.2,
    "trigger": "下落",
    "close": 1180.0
  }
]
```

---

## 5. API設計（フロントエンド内部）

### 5.1 データ取得フック

```typescript
// useMarketData.ts
export function useMarketData(symbol: string, period: string) {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const priceData = await fetch(`/data/price/${symbol}.csv`);
      const fxData = await fetch('/data/fx/usd_jpy.csv');
      const indicators = await fetch(`/data/indicators/${symbol}_sma.csv`);
      
      // Parse CSV and merge data
      const merged = mergePriceAndIndicators(priceData, fxData, indicators);
      setData(filterByPeriod(merged, period));
      setLoading(false);
    }
    fetchData();
  }, [symbol, period]);
  
  return { data, loading };
}
```

---

## 6. GitHub Actions設定

### 6.1 データ更新ワークフロー

**ファイル**: `.github/workflows/update-data.yml`

```yaml
name: Update Market Data

on:
  schedule:
    - cron: '0 */1 * * *'  # 毎時実行
  workflow_dispatch:

jobs:
  fetch-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Install dependencies
        run: |
          pip install requests pandas numpy
          
      - name: Initialize quota
        run: |
          python scripts/quota_init.py \
            --provider alpha_vantage \
            --limit 25 \
            --scope daily
            
      - name: Fetch Alpha Vantage data
        env:
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
        run: |
          python scripts/fetch_alpha_vantage.py \
            --symbols "9501.T,9502.T" \
            --fx "USDJPY" \
            --max-per-day 25
            
      - name: Build indicators
        run: |
          python scripts/build_indicators.py
          
      - name: Validate data
        run: |
          python scripts/validate_data.py
          
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "Update market data $(date +'%Y-%m-%d %H:%M')" && git push)
          
      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Market data update failed',
              body: 'Workflow run: ' + context.runId,
              labels: ['data-failure', 'alpha-vantage']
            })
```

### 6.2 Pagesデプロイワークフロー

**ファイル**: `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
          
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 7. Python スクリプト実装

### 7.1 Alpha Vantage データ取得

**ファイル**: `scripts/fetch_alpha_vantage.py`

```python
import os
import json
import time
import requests
import csv
from datetime import datetime
from pathlib import Path

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
BASE_URL = "https://www.alphavantage.co/query"
QUOTA_FILE = Path("data/.quota/alpha_vantage_daily.json")
DATA_DIR = Path("data")

def load_quota():
    """クォータファイルを読み込み"""
    if QUOTA_FILE.exists():
        with open(QUOTA_FILE, 'r') as f:
            return json.load(f)
    return {"date": "", "count": 0, "limit": 25}

def save_quota(quota):
    """クォータファイルを保存"""
    QUOTA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(QUOTA_FILE, 'w') as f:
        json.dump(quota, f, indent=2)

def check_quota(quota):
    """クォータをチェック"""
    today = datetime.now().strftime("%Y-%m-%d")
    if quota["date"] != today:
        quota["date"] = today
        quota["count"] = 0
    
    if quota["count"] >= quota["limit"]:
        print(f"⚠️ Daily quota exceeded ({quota['count']}/{quota['limit']})")
        return False
    return True

def fetch_stock_data(symbol):
    """株価データ取得"""
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "outputsize": "full",
        "apikey": API_KEY
    }
    
    response = requests.get(BASE_URL, params=params, timeout=60)
    if response.status_code == 429:
        time.sleep(30)
        response = requests.get(BASE_URL, params=params, timeout=60)
    
    response.raise_for_status()
    data = response.json()
    
    if "Time Series (Daily)" not in data:
        raise ValueError(f"Invalid response: {data}")
    
    return data["Time Series (Daily)"]

def fetch_fx_data(pair="USDJPY"):
    """為替データ取得"""
    params = {
        "function": "FX_DAILY",
        "from_symbol": pair[:3],
        "to_symbol": pair[3:],
        "outputsize": "full",
        "apikey": API_KEY
    }
    
    response = requests.get(BASE_URL, params=params, timeout=60)
    response.raise_for_status()
    data = response.json()
    
    if "Time Series FX (Daily)" not in data:
        raise ValueError(f"Invalid FX response: {data}")
    
    return data["Time Series FX (Daily)"]

def save_stock_csv(symbol, data):
    """株価CSVを保存"""
    output_file = DATA_DIR / "price" / f"{symbol}.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["date", "open", "high", "low", "close", "volume"])
        
        for date, values in sorted(data.items()):
            writer.writerow([
                date,
                values["1. open"],
                values["2. high"],
                values["3. low"],
                values["4. close"],
                values["5. volume"]
            ])
    
    print(f"✓ Saved {symbol} data to {output_file}")

def save_fx_csv(data):
    """為替CSVを保存"""
    output_file = DATA_DIR / "fx" / "usd_jpy.csv"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["date", "rate"])
        
        for date, values in sorted(data.items()):
            writer.writerow([date, values["4. close"]])
    
    print(f"✓ Saved FX data to {output_file}")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbols", default="9501.T,9502.T")
    parser.add_argument("--fx", default="USDJPY")
    parser.add_argument("--max-per-day", type=int, default=25)
    args = parser.parse_args()
    
    quota = load_quota()
    quota["limit"] = args.max_per_day
    
    symbols = args.symbols.split(",")
    total_calls = len(symbols) + 1  # 株価 + FX
    
    if not check_quota(quota):
        return
    
    if quota["count"] + total_calls > quota["limit"]:
        print(f"⚠️ Not enough quota for this run ({total_calls} calls needed, {quota['limit'] - quota['count']} remaining)")
        return
    
    # 株価取得
    for symbol in symbols:
        print(f"Fetching {symbol}...")
        data = fetch_stock_data(symbol)
        save_stock_csv(symbol, data)
        quota["count"] += 1
        time.sleep(12)  # Rate limit対策
    
    # FX取得
    print(f"Fetching {args.fx}...")
    fx_data = fetch_fx_data(args.fx)
    save_fx_csv(fx_data)
    quota["count"] += 1
    
    save_quota(quota)
    print(f"✓ Completed. Quota used: {quota['count']}/{quota['limit']}")

if __name__ == "__main__":
    main()
```

### 7.2 テクニカル指標計算

**ファイル**: `scripts/build_indicators.py`

```python
import pandas as pd
import numpy as np
from pathlib import Path

DATA_DIR = Path("data")

def calculate_sma(df, periods=[5, 25, 75]):
    """単純移動平均"""
    for period in periods:
        df[f'sma{period}'] = df['close'].rolling(window=period).mean()
    return df

def calculate_rsi(df, period=14):
    """RSI"""
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    df['rsi14'] = 100 - (100 / (1 + rs))
    return df

def calculate_macd(df, fast=12, slow=26, signal=9):
    """MACD"""
    ema_fast = df['close'].ewm(span=fast).mean()
    ema_slow = df['close'].ewm(span=slow).mean()
    df['macd'] = ema_fast - ema_slow
    df['macd_signal'] = df['macd'].ewm(span=signal).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    return df

def calculate_bollinger(df, period=20, std=2):
    """ボリンジャーバンド"""
    df['bb_middle'] = df['close'].rolling(window=period).mean()
    rolling_std = df['close'].rolling(window=period).std()
    df['bb_upper'] = df['bb_middle'] + (rolling_std * std)
    df['bb_lower'] = df['bb_middle'] - (rolling_std * std)
    return df

def process_symbol(symbol):
    """銘柄ごとに指標を計算"""
    price_file = DATA_DIR / "price" / f"{symbol}.csv"
    if not price_file.exists():
        print(f"⚠️ Price file not found: {price_file}")
        return
    
    df = pd.read_csv(price_file, parse_dates=['date'])
    df = df.sort_values('date')
    
    # 各指標計算
    df = calculate_sma(df)
    df = calculate_rsi(df)
    df = calculate_macd(df)
    df = calculate_bollinger(df)
    
    # 指標別に保存
    indicators_dir = DATA_DIR / "indicators"
    indicators_dir.mkdir(parents=True, exist_ok=True)
    
    # SMA
    df[['date', 'sma5', 'sma25', 'sma75']].to_csv(
        indicators_dir / f"{symbol}_sma.csv", index=False
    )
    
    # RSI
    df[['date', 'rsi14']].to_csv(
        indicators_dir / f"{symbol}_rsi.csv", index=False
    )
    
    # MACD
    df[['date', 'macd', 'macd_signal', 'macd_hist']].to_csv(
        indicators_dir / f"{symbol}_macd.csv", index=False
    )
    
    # Bollinger
    df[['date', 'bb_upper', 'bb_middle', 'bb_lower']].to_csv(
        indicators_dir / f"{symbol}_bb.csv", index=False
    )
    
    print(f"✓ Built indicators for {symbol}")

def main():
    symbols = ["9501.T", "9502.T"]
    for symbol in symbols:
        process_symbol(symbol)

if __name__ == "__main__":
    main()
```

---

## 8. フロントエンド実装

### 8.1 TypeScript型定義

**ファイル**: `src/types/market.d.ts`

```typescript
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicators {
  sma5?: number;
  sma25?: number;
  sma75?: number;
  rsi14?: number;
  macd?: number;
  macd_signal?: number;
  macd_hist?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
}

export interface MarketData extends PriceData, Indicators {
  fx_rate?: number;
}

export interface Alert {
  timestamp: string;
  symbol: string;
  change_pct: number;
  trigger: string;
  close: number;
}

export type Period = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'Custom';
export type Symbol = '9501.T' | '9502.T';
```

### 8.2 チャートコンポーネント

**ファイル**: `src/components/ChartCanvas.tsx`

```typescript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, ComposedChart } from 'recharts';
import { MarketData } from '../types/market';

interface Props {
  data: MarketData[];
  showFX: boolean;
  showVolume: boolean;
}

export const ChartCanvas: React.FC<Props> = ({ data, showFX, showVolume }) => {
  return (
    <div className="neumorph-card p-6">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <XAxis dataKey="date" stroke="#E6F5F1" />
          <YAxis yAxisId="left" stroke="#00D4FF" />
          {showFX && <YAxis yAxisId="right" orientation="right" stroke="#FF2ECC" />}
          <Tooltip contentStyle={{ background: '#0D1414', border: 'none' }} />
          
          {/* ローソク足（簡易版 - 実際はカスタムShape推奨） */}
          <Line yAxisId="left" type="monotone" dataKey="close" stroke="#00D4FF" strokeWidth={2} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="sma5" stroke="#00FF84" strokeWidth={1} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="sma25" stroke="#FFD700" strokeWidth={1} dot={false} />
          
          {showFX && (
            <Line yAxisId="right" type="monotone" dataKey="fx_rate" stroke="#FF2ECC" strokeWidth={1} dot={false} />
          )}
          
          {showVolume && (
            <Bar yAxisId="left" dataKey="volume" fill="rgba(0, 255, 132, 0.2)" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
```

---

## 9. UIデザインシステム

**ファイル**: `src/styles/theme.css`

```css
:root {
  --bg: #0A0F0F;
  --fg: #E6F5F1;
  --neon-green: #00FF84;
  --cyan: #00D4FF;
  --magenta: #FF2ECC;
  --soft-shadow-light: rgba(255, 255, 255, 0.08);
  --soft-shadow-dark: rgba(0, 0, 0, 0.55);
  --ease: cubic-bezier(0.25, 0.1, 0.25, 1);
}

.neumorph-card {
  background: #0D1414;
  border-radius: 16px;
  box-shadow:
    -6px -6px 12px var(--soft-shadow-light),
    6px 6px 12px var(--soft-shadow-dark),
    0 0 12px rgba(0, 255, 132, 0.15);
  transition: box-shadow 0.3s var(--ease);
}

.neumorph-card:hover {
  box-shadow:
    -8px -8px 16px var(--soft-shadow-light),
    8px 8px 16px var(--soft-shadow-dark),
    0 0 20px rgba(0, 255, 132, 0.25);
}

.button {
  color: var(--fg);
  background: #0D1414;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow:
    -4px -4px 8px var(--soft-shadow-light),
    4px 4px 8px var(--soft-shadow-dark);
  transition: all 0.12s var(--ease);
  cursor: pointer;
  border: none;
}

.button:hover {
  filter: brightness(1.1);
}

.button--selected {
  background: var(--neon-green);
  color: #051010;
  box-shadow: 0 0 16px rgba(0, 255, 132, 0.65);
}

.line--tepco {
  stroke: var(--cyan);
  filter: drop-shadow(0 0 6px var(--cyan));
}

.line--chubu {
  stroke: var(--magenta);
  filter: drop-shadow(0 0 6px var(--magenta));
}
```

---

## 10. テスト計画

### 10.1 ユニットテスト
- `indicators.ts`: SMA/RSI/MACD/BB計算ロジック
- `formatters.ts`: 数値フォーマット関数

### 10.2 統合テスト
- Alpha Vantage API呼び出し→CSV保存→指標計算の一連のフロー
- クォータ管理: 25件超過時のスキップ動作

### 10.3 E2Eテスト
- 期間フィルタ切り替え→チャート再描画
- ±5%アラート発生→バナー表示
- 企業比較トグル→オーバーレイ表示

---

## 11. デプロイ手順

1. **Secretsの設定**
   - Repository Settings → Secrets and variables → Actions
   - `ALPHA_VANTAGE_API_KEY` を追加

2. **GitHub Pagesの有効化**
   - Settings → Pages → Source: GitHub Actions

3. **初回ビルド**
   ```bash
   npm install
   npm run build
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **データ更新の確認**
   - Actions タブで `Update Market Data` の実行を確認
   - `data/` ディレクトリにCSVが生成されることを確認

---

## 12. 運用監視

### 12.1 監視項目
- Alpha Vantageクォータ使用率（`data/.quota/alpha_vantage_daily.json`）
- データ更新の成功/失敗（GitHub Actions履歴）
- アラート発生頻度（`data/alerts.json`）

### 12.2 障害対応
- **API制限超過**: Issue自動起票 → 翌日の自動復旧を待つ
- **データ欠損**: `validate_data.py` で検知 → 手動再実行

---

## 13. 今後の拡張

- [ ] リアルタイム更新（WebSocket）
- [ ] カスタムアラート設定UI
- [ ] エクスポート機能（CSV/PDF）
- [ ] モバイルアプリ対応
- [ ] 多言語対応（i18n）

---

**Version**: 1.0  
**Last Updated**: 2025-11-28  
**Author**: Development Team
