
# EnergyChain — 実装仕様書 v1.0

## 1. プロジェクト概要

### 1.1 目的
東京電力HD・中部電力の**単独PL「受取配当金」**を可視化し、JERAからの配当貢献度トレンドを分析する。

### 1.2 重要要件
> **受取配当金は親会社単独PLの値をそのまま使用**  
> **出資比率による調整は一切行わない**

### 1.3 スコープ
- 受取配当金推移グラフ（時系列ライン＋棒グラフ）
- ウォーターフォールチャート（増減要因分析）
- JERAイベントマーカー（配当決議日）
- 前年同期比較
- CSV/JSONエクスポート

---

## 2. 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript |
| チャート | Recharts |
| スタイリング | Tailwind CSS |
| ビルド | Vite |
| ホスティング | GitHub Pages |
| データ更新 | GitHub Actions (週次) |
| 外部API | EDINET API v2 |

---

## 3. ディレクトリ構成

```
energychain/
├── .github/workflows/
│   ├── deploy-pages.yml
│   └── update-energychain.yml
├── src/
│   ├── components/
│   │   ├── TrendChart.tsx
│   │   ├── WaterfallChart.tsx
│   │   ├── EventMarkers.tsx
│   │   ├── ComparisonTable.tsx
│   │   └── ExportButton.tsx
│   ├── hooks/
│   │   ├── useDividends.ts
│   │   └── useEvents.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   └── export.ts
│   ├── types/
│   │   └── dividends.d.ts
│   └── App.tsx
├── data/
│   ├── contribution_trend.csv
│   ├── contribution_metadata.json
│   ├── jera_events.json
│   └── taxonomy_map.json
├── scripts/
│   ├── fetch_edinet_dividends.py
│   ├── build_contribution.py
│   └── validate_taxonomy.py
└── package.json
```

---

## 4. データモデル

### 4.1 受取配当金推移 (CSV)
**ファイル**: `data/contribution_trend.csv`

```csv
date,docID,company,dividends_received,fiscal_period,doc_type
2024-06-30,S100XXXXX,TEPCO,12345678900,2024Q2,四半期報告書
2024-06-30,S100YYYYY,CHUBU,6789012340,2024Q2,四半期報告書
2024-09-30,S100ZZZZZ,TEPCO,15678901230,2024Q3,四半期報告書
2024-09-30,S100WWWWW,CHUBU,8901234560,2024Q3,四半期報告書
```

### 4.2 メタデータ (JSON)
**ファイル**: `data/contribution_metadata.json`

```json
{
  "lastUpdated": "2025-11-28T10:00:00Z",
  "dataSource": "EDINET API v2",
  "companies": {
    "TEPCO": {
      "edinetCode": "E04498",
      "fullName": "東京電力ホールディングス株式会社",
      "fiscalYearEnd": "03-31"
    },
    "CHUBU": {
      "edinetCode": "E04516",
      "fullName": "中部電力株式会社",
      "fiscalYearEnd": "03-31"
    }
  },
  "notes": "受取配当金は単独PLの値を出資比率調整なしで採用"
}
```

### 4.3 JERAイベント (JSON)
**ファイル**: `data/jera_events.json`

```json
[
  {
    "date": "2024-06-28",
    "type": "dividend_resolution",
    "label": "JERA 配当決議（中間）",
    "amount": 50000000000,
    "source": "プレスリリース"
  },
  {
    "date": "2024-11-29",
    "type": "dividend_resolution",
    "label": "JERA 配当決議（期末）",
    "amount": 80000000000,
    "source": "プレスリリース"
  }
]
```

### 4.4 タクソノミマッピング (JSON)
**ファイル**: `data/taxonomy_map.json`

```json
{
  "version": "2024",
  "mappings": {
    "dividends_received": [
      "受取配当金",
      "DividendIncome",
      "受取配当金（四半期）",
      "営業外収益_受取配当金"
    ]
  },
  "notes": "年度によりタクソノミ要素名が変わる場合がある"
}
```

---

## 5. GitHub Actions

### 5.1 データ更新ワークフロー

**ファイル**: `.github/workflows/update-energychain.yml`

```yaml
name: Update EnergyChain Data

on:
  schedule:
    - cron: '0 4 * * 3'  # 毎週水曜 4:00 JST
  workflow_dispatch:

jobs:
  fetch-dividends:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install requests pandas
      
      - name: Fetch EDINET dividends
        env:
          EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}
          EDINET_BASE_URL: ${{ secrets.EDINET_BASE_URL }}
          TEPCO_EDINET_CODE: ${{ secrets.TEPCO_EDINET_CODE }}
          CHUBU_EDINET_CODE: ${{ secrets.CHUBU_EDINET_CODE }}
        run: |
          python scripts/fetch_edinet_dividends.py \
            --companies "TEPCO,CHUBU" \
            --lookback-days 90
      
      - name: Build contribution trend
        run: |
          python scripts/build_contribution.py
      
      - name: Validate taxonomy
        run: |
          python scripts/validate_taxonomy.py
      
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "Update dividends $(date +'%Y-%m-%d')" && git push)
      
      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'EnergyChain data update failed',
              body: 'Workflow run: ' + context.runId,
              labels: ['data-failure', 'edinet', 'dividends']
            })
```

---

## 6. Python スクリプト

### 6.1 EDINET 受取配当金抽出

**ファイル**: `scripts/fetch_edinet_dividends.py`

```python
import os
import json
import csv
import io
import zipfile
import requests
from datetime import datetime, timedelta
from pathlib import Path

API_KEY = os.getenv("EDINET_API_KEY")
BASE_URL = os.getenv("EDINET_BASE_URL", "https://api.edinet-fsa.go.jp/api/v2")
DATA_DIR = Path("data")

EDINET_CODES = {
    "TEPCO": os.getenv("TEPCO_EDINET_CODE", "E04498"),
    "CHUBU": os.getenv("CHUBU_EDINET_CODE", "E04516")
}

def load_taxonomy_map():
    """タクソノミマッピング読み込み"""
    map_file = DATA_DIR / "taxonomy_map.json"
    if map_file.exists():
        with open(map_file, 'r', encoding='utf-8') as f:
            return json.load(f)["mappings"]["dividends_received"]
    return ["受取配当金", "DividendIncome"]

def list_documents(date, doc_type=2):
    """書類一覧取得"""
    url = f"{BASE_URL}/documents.json"
    params = {
        "date": date,
        "type": doc_type,
        "Subscription-Key": API_KEY
    }
    
    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()
    return response.json().get("results", [])

def download_csv_zip(doc_id):
    """CSV変換ZIP取得"""
    url = f"{BASE_URL}/documents/{doc_id}"
    params = {
        "type": 5,  # CSV変換
        "Subscription-Key": API_KEY
    }
    
    response = requests.get(url, params=params, timeout=120)
    response.raise_for_status()
    return io.BytesIO(response.content)

def extract_dividends(zip_bytes, label_aliases):
    """
    受取配当金を抽出（単独PL）
    
    重要：出資比率による調整は一切行わない
    """
    with zipfile.ZipFile(zip_bytes) as z:
        for filename in z.namelist():
            # 単独財務諸表のみ対象
            if '連結' in filename or 'consolidated' in filename.lower():
                continue
            
            if not filename.endswith('.csv'):
                continue
            
            with z.open(filename) as f:
                reader = csv.DictReader(io.TextIOWrapper(f, encoding='utf-8'))
                
                for row in reader:
                    # ラベルマッチング
                    label = (row.get("label") or row.get("accountTitle") or "").strip()
                    
                    if label in label_aliases:
                        # 金額取得
                        amount_str = row.get("amount") or row.get("value") or "0"
                        try:
                            amount = float(amount_str.replace(',', ''))
                            return amount
                        except ValueError:
                            continue
    
    return None

def find_quarterly_reports(company_code, lookback_days=90):
    """四半期報告書を検索"""
    results = []
    today = datetime.now()
    
    for i in range(lookback_days):
        check_date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        docs = list_documents(check_date)
        
        for doc in docs:
            if doc.get("edinetCode") == company_code and \
               "四半期報告書" in doc.get("docDescription", ""):
                results.append(doc)
    
    return results

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--companies", default="TEPCO,CHUBU")
    parser.add_argument("--lookback-days", type=int, default=90)
    args = parser.parse_args()
    
    companies = args.companies.split(",")
    label_aliases = load_taxonomy_map()
    
    # 既存データ読み込み
    csv_file = DATA_DIR / "contribution_trend.csv"
    existing_data = []
    existing_doc_ids = set()
    
    if csv_file.exists():
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_data = list(reader)
            existing_doc_ids = {row['docID'] for row in existing_data}
    
    # 新規データ取得
    new_records = []
    
    for company in companies:
        if company not in EDINET_CODES:
            print(f"⚠️ Unknown company: {company}")
            continue
        
        code = EDINET_CODES[company]
        print(f"Searching quarterly reports for {company} ({code})...")
        
        docs = find_quarterly_reports(code, args.lookback_days)
        print(f"Found {len(docs)} documents")
        
        for doc in docs:
            doc_id = doc["docID"]
            
            # 重複チェック
            if doc_id in existing_doc_ids:
                print(f"⏭️  Skipping {doc_id} (already exists)")
                continue
            
            print(f"Processing {doc_id}...")
            
            try:
                # CSV ZIP ダウンロード
                csv_zip = download_csv_zip(doc_id)
                
                # 受取配当金抽出（出資比率調整なし）
                dividends = extract_dividends(csv_zip, label_aliases)
                
                if dividends is None:
                    print(f"⚠️  No dividends found in {doc_id}")
                    continue
                
                # レコード作成
                submit_date = doc["submitDateTime"][:10]  # YYYY-MM-DD
                fiscal_period = doc.get("periodEnd", "")[:7]  # YYYY-MM
                
                new_records.append({
                    "date": submit_date,
                    "docID": doc_id,
                    "company": company,
                    "dividends_received": dividends,
                    "fiscal_period": fiscal_period,
                    "doc_type": doc["docDescription"]
                })
                
                print(f"✓ Extracted {company}: {dividends:,.0f} JPY")
                
            except Exception as e:
                print(f"❌ Error processing {doc_id}: {e}")
                continue
    
    # データマージ
    all_records = existing_data + new_records
    all_records.sort(key=lambda x: x['date'])
    
    # CSV保存
    if all_records:
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['date', 'docID', 'company', 'dividends_received', 
                         'fiscal_period', 'doc_type']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_records)
        
        print(f"\n✓ Saved {len(all_records)} records ({len(new_records)} new)")
    else:
        print("⚠️ No data to save")

if __name__ == "__main__":
    main()
```

### 6.2 貢献度トレンド構築

**ファイル**: `scripts/build_contribution.py`

```python
import pandas as pd
from pathlib import Path

DATA_DIR = Path("data")

def calculate_yoy_change(df):
    """前年同期比を計算"""
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['company', 'date'])
    
    df['yoy_change'] = df.groupby('company')['dividends_received'].pct_change(4) * 100
    df['yoy_change_abs'] = df.groupby('company')['dividends_received'].diff(4)
    
    return df

def main():
    csv_file = DATA_DIR / "contribution_trend.csv"
    
    if not csv_file.exists():
        print("⚠️ No data file found")
        return
    
    df = pd.read_csv(csv_file)
    df = calculate_yoy_change(df)
    
    # 上書き保存
    df.to_csv(csv_file, index=False)
    
    print(f"✓ Built contribution trend with {len(df)} records")
    print(f"\nSummary:")
    print(df.groupby('company')['dividends_received'].agg(['count', 'mean', 'sum']))

if __name__ == "__main__":
    main()
```

---

## 7. フロントエンド実装

### 7.1 トレンドチャート

**ファイル**: `src/components/TrendChart.tsx`

```typescript
import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface DividendData {
  date: string;
  TEPCO: number;
  CHUBU: number;
}

interface Props {
  data: DividendData[];
}

export const TrendChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="neumorph-card p-6">
      <h3 className="text-xl font-bold mb-4">受取配当金推移</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <XAxis dataKey="date" stroke="#E6F5F1" />
          <YAxis stroke="#E6F5F1" />
          <Tooltip 
            contentStyle={{ 
              background: '#0D1414', 
              border: 'none',
              borderRadius: '8px'
            }}
            formatter={(value: number) => `¥${(value / 1e9).toFixed(2)}B`}
          />
          <Legend />
          
          <Bar dataKey="TEPCO" fill="#00D4FF" opacity={0.6} />
          <Bar dataKey="CHUBU" fill="#FF2ECC" opacity={0.6} />
          
          <Line 
            type="monotone" 
            dataKey="TEPCO" 
            stroke="#00D4FF" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="CHUBU" 
            stroke="#FF2ECC" 
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <p className="text-sm text-gray-400 mt-4">
        ※ 単独PL「受取配当金」の値（出資比率調整なし）
      </p>
    </div>
  );
};
```

### 7.2 ウォーターフォールチャート

**ファイル**: `src/components/WaterfallChart.tsx`

```typescript
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WaterfallData {
  label: string;
  value: number;
  isTotal?: boolean;
}

interface Props {
  data: WaterfallData[];
}

export const WaterfallChart: React.FC<Props> = ({ data }) => {
  const getColor = (value: number, isTotal?: boolean) => {
    if (isTotal) return '#00FF84';
    return value >= 0 ? '#00D4FF' : '#FF4444';
  };

  return (
    <div className="neumorph-card p-6">
      <h3 className="text-xl font-bold mb-4">増減要因分析</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="#E6F5F1" />
          <YAxis stroke="#E6F5F1" />
          <Tooltip 
            contentStyle={{ background: '#0D1414', border: 'none' }}
            formatter={(value: number) => `¥${(value / 1e9).toFixed(2)}B`}
          />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColor(entry.value, entry.isTotal)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### 7.3 イベントマーカー

**ファイル**: `src/components/EventMarkers.tsx`

```typescript
import React from 'react';

interface Event {
  date: string;
  label: string;
  amount: number;
}

interface Props {
  events: Event[];
}

export const EventMarkers: React.FC<Props> = ({ events }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold">JERAイベント</h3>
      
      {events.map((event, idx) => (
        <div key={idx} className="neumorph-card p-4 border-l-4 border-neon-green">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400">{event.date}</div>
              <div className="font-semibold">{event.label}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neon-green">
                ¥{(event.amount / 1e9).toFixed(1)}B
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 8. 型定義

**ファイル**: `src/types/dividends.d.ts`

```typescript
export interface DividendRecord {
  date: string;
  docID: string;
  company: string;
  dividends_received: number;
  fiscal_period: string;
  doc_type: string;
  yoy_change?: number;
  yoy_change_abs?: number;
}

export interface JERAEvent {
  date: string;
  type: 'dividend_resolution' | 'earnings' | 'announcement';
  label: string;
  amount: number;
  source: string;
}

export interface ContributionMetadata {
  lastUpdated: string;
  dataSource: string;
  companies: {
    [key: string]: {
      edinetCode: string;
      fullName: string;
      fiscalYearEnd: string;
    };
  };
  notes: string;
}
```

---

## 9. テスト計画

### 9.1 ユニットテスト
- タクソノミマッピングの正確性
- 受取配当金抽出ロジック（単独/連結の判別）
- 前年同期比計算

### 9.2 統合テスト
- EDINET API → CSV抽出 → トレンド構築
- 重複docIDの排除

### 9.3 E2Eテスト
- チャート描画の確認
- イベントマーカーの位置精度
- エクスポート機能

---

## 10. 今後の拡張

- [ ] JERAの財務データ連携
- [ ] 配当性向の自動計算
- [ ] シナリオ分析（配当予測）
- [ ] アラート機能（配当減少時）

---

**Version**: 1.0  
**Last Updated**: 2025-11-28  

**重要注意事項**: このアプリは親会社の単独PL「受取配当金」を**出資比率調整なし**で扱います。
