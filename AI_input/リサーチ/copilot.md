
# Master Spec‑Kit — Multi‑App Suite

**対象**：5つの独立アプリ

- **MarketVision**（株価/為替・テクニカル）
- **ValueScope**（企業価値/KPI）
- **FinSight**（PL/BS/CF＋注記）
- **EnergyChain**（受取配当金トレンド/JERA貢献）
- **PulseWatch**（ニュース/クリティカル通知）

> **運用上の重要事項**
> 
> - **Alpha Vantage 無料枠**：**1日最大25リクエスト**（全エンドポイント合算）。設計はこの上限に準拠し、**時間バッチ化＋日次クォータ**で制御する。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
> - **EDINET API v2**：**APIキー必須**。**閲覧サイト（WEEK0010）**、**操作ガイド集約（WZEK0110）**、**仕様書パッケージ（ESE140206.pdf）**を参照して設定・実装する。 [[note.com]](https://note.com/kotaro_studio/n/n8450c133c5bb), [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---

## 0. 共通仕様（全アプリ）

### 0.1 プラットフォーム

- **Hosting**：GitHub Pages（Branch: `main`、Artifact: `dist`）
- **CI/CD**：GitHub Actions
    - デプロイ：`deploy-pages.yml`（push/dispatch）
    - データ更新：各アプリ専用 `update-*.yml`（cron＋手動）
- **ストレージ**：リポジトリ `/data/`（CSV/JSON/ZIP/Parquet）
- **監査**：Git履歴＝データ変更ログ／Issue＝失敗通知

### 0.2 Secrets（リポジトリ）

- **Alpha Vantage**：`ALPHA_VANTAGE_API_KEY`（**無料枠25/day**を遵守） [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **EDINET**：
    - `EDINET_API_KEY`
    - `EDINET_BASE_URL=https://api.edinet-fsa.go.jp/api/v2`（**仕様書記載**） [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)
    - （必要に応じて）`TEPCO_EDINET_CODE` / `CHUBU_EDINET_CODE` / `JERA_EDINET_CODE`
- **登録手順**：Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**（GitHub Docs準拠）

### 0.3 デザイン・UIガイド

- **テーマ**：ダーク基調（Base: `#0A0F0F`）、**サイバーパンク×ニューモフィズム**
- **ブランドカラー**：Neon Green `#00FF84`、TEPCO=シアン `#00D4FF`、CHUBU=マゼンタ `#FF2ECC`
- **アニメーション**：
    - ページ遷移：フェード＋Zスライド（200–350ms）
    - ホバー：内側押し込み＋外側グロウ（80–120ms）
    - 背景：パララックス（PCのみ、モバイル縮退）
- **アクセシビリティ**：WCAG AA（コントラスト/フォーカス/キーボード）
- **パフォーマンス予算**：LCP < 2.5s、TTI < 2.0s、応答 < 200ms

### 0.4 外部API呼び出し制御

- **Alpha Vantage**：**1時間毎**の**まとめ呼び出し（バッチ）**＋**日次クォータ25**で厳格運用。超過時は**スキップ**してIssue通知。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **EDINET v2**：**APIキー必須**。**一覧（`documents.json`）**→**取得（`documents/{docID}?type=5`：CSV ZIP）**の2段階。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---

## 1. MarketVision — Market & Price Analytics

### 1.1 目的

- 東電/中電の株価に為替（USD/JPY）を重ね、テクニカル指標やイベントを**インタラクティブ**に可視化。**±5%アラート**で注意喚起。

### 1.2 機能

- **指標タイル**：現値、前日比、騰落率、出来高
- **チャート**：ローソク（日足/週足）、SMA(5/25/75)、出来高バー、イベント（決算・権利落ち）
- **テクニカル**：RSI(14)、MACD(12/26/9)、ボリンジャー(20,±2σ)、騰落率（日/週/月）
- **期間フィルタ**：1M/3M/6M/1Y/3Y/5Y/Custom
- **比較**：TEPCO／CHUBU オーバーレイ＋相関（12M, 週次）

### 1.3 非機能

- **更新頻度**：**1時間毎**（AV 25/day 制限に適合） [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **失敗時**：Issue自動起票（`data-failure`）

### 1.4 データモデル（例）

# data/price/9501.T.csv (OHLCV)

date,open,high,low,close,volume

2025-11-26,1234,1250,1220,1245,100200

  

# data/fx/usd_jpy.csv

date,rate

2025-11-26,151.23

### 1.5 外部統合（Alpha Vantage）

- **無料枠**：**1日25リクエスト**。拡張はプレミアム。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **設計**：1回のジョブで**複数銘柄/通貨**をまとめて取得し、**当日合計 ≤ 25**に制御。

### 1.6 API（ローカルJSON供給）

GET /api/chart?symbol=TEPCO&period=6M&granularity=1D&overlay=CHUBU

### 1.7 UI仕様

- **TickerTiles**：ニューモフィズムの二重シャドウ＋微小グロウ
- **Chart 背景**：グリッドの微パララックス（PC）

### 1.8 ディレクトリ / Actions

```
marketvision/
├─ src/
├─ data/ price/, fx/, indicators/
├─ scripts/ fetch_alpha_vantage.py, build_indicators.py, quota_init.py
└─ .github/workflows/ update-data.yml, deploy-pages.yml
```

**`update-data.yml`（要点）**

on:

  schedule: [ { cron: "0 * * * *" } ]   # 1時間毎

jobs:

  fetch-and-build:

    steps:

      - uses: actions/checkout@v4

      - run: python scripts/quota_init.py --provider alpha_vantage --limit 25 --scope daily

      - run: python scripts/fetch_alpha_vantage.py --symbols "9501.T,9502.T" --fx "USDJPY" --max-per-day 25

      - run: python scripts/build_indicators.py

---

## 2. ValueScope — Corporate Value Dashboard

### 2.1 目的

- **EV**、**EV/EBITDA**、**PER**、**PBR**等の企業価値指標と**ROE/Equity Ratio/DSCR**を、**信号機（青/黄/赤）**とゲージで提示。

### 2.2 機能

- スコアカード（閾値ファイルに準拠）／KPIゲージ／推移グラフ／相関・レーダー・同業比較

### 2.3 計算定義（例）

- **EV** = 時価総額 + 純有利子負債（有利子負債 − 現預金）
- **DSCR** ≈ 営業CF / 元利支払
- 閾値例：ROE（青≥10%、黄5–10%、赤<5%）等

### 2.4 データモデル（例）

// data/valuation.json

{

  "asOf":"2025-09-30",

  "TEPCO":{"ev":…, "ebitda":…, "evEbitda":…, "per":…, "pbr":…},

  "CHUBU":{"ev":…, "ebitda":…, "evEbitda":…, "per":…, "pbr":…}

}

### 2.5 EDINET連携（正式情報反映）

- **EDINET API v2**を利用し、提出書類一覧（`documents.json`）→書類取得（`type=5`の**CSV変換ZIP**）で財務データを取り込む。
- **APIキーが必須**。設定・手順は**操作ガイド集約（WZEK0110）**と**仕様書（ESE140206.pdf）**を参照。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)
- 最新運用通知は**閲覧サイト（WEEK0010）**で確認。 [[note.com]](https://note.com/kotaro_studio/n/n8450c133c5bb)

### 2.6 ディレクトリ / Actions

```
valuescope/
├─ data/ edinet_parsed/, valuation.json, kpi_targets.json, scorecards.json
├─ scripts/ parse_edinet_xbrl.py, build_valuation.py, compute_scores.py
└─ .github/workflows/ update-valuation.yml, deploy-pages.yml
```

---

## 3. FinSight — Financial Insights

### 3.1 目的

- **PL/BS/CF**の詳細比較（四半期・通期）、差異ハイライト、**注記のリスク抽出**・**会計方針変更検知**。

### 3.2 機能

- PL/BS/CF 推移、前年同期比較、流動/固定構成、フリーCF、健全性スコア、注記NLP（リスク/方針変更）

### 3.3 データモデル（例）

// data/financials/TEPCO_pl_quarterly.csv

date,revenue,op_income,net_income

// data/xbrl_notes.json

[{ "company":"TEPCO","period":"2025Q2","tag":"risk","text":"…", "severity":0.8 }]

### 3.4 EDINET連携（正式情報反映）

- **一覧API**（`documents.json`）→**取得API**（`documents/{docID}?type=5`）で**CSV ZIP**をダウンロードし解析。
- **APIキー必須**。**仕様書 v2（ESE140206.pdf）**の「2章：利用準備」「3章：インターフェース仕様」に準拠。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)
- 操作ガイド集約（**WZEK0110**）で最新版リンクを確認。

### 3.5 ディレクトリ / Actions

```
finsight/
├─ data/ financials/, ratios.csv, xbrl_notes.json
├─ scripts/ extract_financials.py, compute_ratios.py, nlp_notes_risk.py
└─ .github/workflows/ update-financials.yml, deploy-pages.yml
```

---

## 4. EnergyChain — JERA Contribution & Scenario

> **重要要件（再確認）**：親会社（東電・中電）の**単独PLの「受取配当金」**を**そのまま採用**。**出資比率による調整は一切行わない**。

### 4.1 目的

- 親会社の**受取配当金**推移を可視化し、JERAの配当イベントと重ねて**貢献度トレンド**を示す。

### 4.2 機能

- **トレンド**（ライン＋棒）、**ウォーターフォール**、**イベントマーカー**（JERA配当決議日）

### 4.3 EDINET連携（正式情報反映）

- **一覧**：`GET {BASE}/documents.json?date=YYYY-MM-DD&type=2&Subscription-Key=KEY`
- **CSV取得**：`GET {BASE}/documents/{docID}?type=5&Subscription-Key=KEY`（**CSV変換ZIP**）。
- **設定手順**：**操作ガイド集約（WZEK0110）**および**仕様書（ESE140206.pdf）**の「APIキー発行／MFA／ポップアップ許可」を完了しSecretsへ登録。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)
- **運用情報**：**閲覧サイト（WEEK0010）**で最新のお知らせを確認。 [[note.com]](https://note.com/kotaro_studio/n/n8450c133c5bb)

### 4.4 データモデル（例）

# data/contribution_trend.csv_

_date,docID,company,dividends_received

2025-06-30,S10XXXXX,TEPCO,12345.0

2025-06-30,S10YYYYY,CHUBU,6789.0

### 4.5 ディレクトリ / Actions

```
energychain/
├─ data/ contribution_trend.csv, contribution_metadata.json, taxonomy_map.json
├─ scripts/ fetch_edinet_dividends.py, build_contribution.py
└─ .github/workflows/ update-energychain.yml, deploy-pages.yml
```

---

## 5. PulseWatch — News & Alerts

### 5.1 目的

- 最新ニュース/プレスリリースを**タグ付け＋センチメント分析**。**重大（critical）**のみバナー表示＆Issue通知。

### 5.2 機能

- フィード（タイトル/要旨/タグ/センチメント）／クリティカルバナー（≤−0.6）／アラート履歴

### 5.3 データモデル（例）

// data/news.json

[{ "id":"n-10293", "source":"PressRelease", "publishedAt":"2025-11-12T08:30:00Z",

   "title":"…", "summary":"…", "url":"…", "tags":["事故","コンプライアンス"] }]

### 5.4 ディレクトリ / Actions

```
pulsewatch/
├─ data/ news.json, alerts.json
├─ scripts/ ingest_feeds.py, sentiment_tagging.py
└─ .github/workflows/ update-news.yml, deploy-pages.yml
```

---

## 6. 共通データ仕様／API

### 6.1 フォーマット

- **CSV**：`date,value,...`、UTF‑8、ヘッダ必須
- **JSON**：`snake_case`、`schema_version`（後方互換管理）

### 6.2 バージョニング（例）

// data/schema_manifest.json_

_{_

  _"schema_version":"1.0.0",

  "entities":{ "MarketPriceCSV":"1.0.0", "FXRateCSV":"1.0.0", "ValuationJSON":"1.0.0", "DividendsCSV":"1.0.0" }

}

### 6.3 エラー／ログ

- **AVクォータ超過**：`quota_exceeded` イベント → Issue（`alpha-quota`） [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **EDINETエラー**：認証失敗/CSV未提供など、仕様書のレスポンス定義に従いログ化。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---

## 7. UI Design System（コードトークン）

:root{

  --bg:#0A0F0F; --fg:#E6F5F1;

  --neon-green:#00FF84; --cyan:#00D4FF; --magenta:#FF2ECC;

  --soft-shadow-light: rgba(255,255,255,0.08);

  --soft-shadow-dark: rgba(0,0,0,0.55);

  --ease: cubic-bezier(0.25,0.1,0.25,1);

}

.neumorph-card{

  background:#0D1414; border-radius:16px;

  box-shadow:

    -6px -6px 12px var(--soft-shadow-light),

     6px  6px 12px var(--soft-shadow-dark),

     0 0 12px rgba(0,255,132,0.15);

}

.button{

  color:var(--fg); background:#0D1414; border-radius:12px; padding:.75rem 1rem;

  box-shadow:-4px -4px 8px var(--soft-shadow-light), 4px 4px 8px var(--soft-shadow-dark);

  transition: filter .12s var(--ease), box-shadow .12s var(--ease), color .12s, background .12s;

}

.button--selected{

  background:var(--neon-green); color:#051010;

  box-shadow:0 0 16px rgba(0,255,132,.65);

}

.line--tepco{ stroke:var(--cyan); filter:drop-shadow(0 0 6px var(--cyan)); }

.line--chubu{ stroke:var(--magenta); filter:drop-shadow(0 0 6px var(--magenta)); }

.parallax-layer{ will-change: transform; transition: transform .35s var(--ease); }

---

## 8. リポジトリ標準構成＆Pagesデプロイ

```
repo/
├─ src/ ├─ public/ ├─ data/ ├─ scripts/
└─ .github/workflows/ (update-*.yml, deploy-pages.yml)
```

**Pagesデプロイ（共通）**

name: Deploy Pages

on:

  push: { branches: ['main'] }

  workflow_dispatch:

jobs:

  build:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - name: Build site

        run: |

          npm ci

          npm run build

      - name: Upload artifact

        uses: actions/upload-pages-artifact@v3

        with: { path: ./dist }

  deploy:

    needs: build

    runs-on: ubuntu-latest

    permissions: { pages: write, id-token: write }

    environment: { name: github-pages }

    steps:

      - name: Deploy to GitHub Pages

        uses: actions/deploy-pages@v4

---

## 9. 外部APIリファレンス（リンク／遵守事項）

### 9.1 Alpha Vantage

- **無料枠**：**1日25リクエスト**（FAQ/Supportページに明記）。プレミアム契約で拡張可。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **設計側の遵守**：**時間バッチ化＋クォータファイル**で当日合計を管理。

### 9.2 EDINET API v2（金融庁）

- **閲覧サイト（トップ）**：**WEEK0010**（運用通知・API案内あり）。 [[note.com]](https://note.com/kotaro_studio/n/n8450c133c5bb)
- **操作ガイド集約ページ**：**WZEK0110**（**EDINET API仕様書（Version 2）**、別紙、コード集、関連技術資料への公式リンク）。
- **仕様書パッケージ**：**ESE140206.pdf**（**APIキー発行/MFA/ポップアップ許可**、**一覧/取得/CSVの正式仕様**）。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---

## 10. テスト計画

### 10.1 ユニット／統合

- 指標計算（RSI/MACD/BB、EV/EBITDA、DSCR）
- EDINET抽出（受取配当金）— 年版タクソノミ差分への耐性
- センチメント閾値→クリティカル判定

### 10.2 E2E

- MarketVision：期間切替→再計算→±5%アラート
- ValueScope：閾値変更→スコアカード色変化
- FinSight：連結/単独トグルで推移グラフ同期
- EnergyChain：docID更新→受取配当金の非調整値で再描画
- PulseWatch：ニュース取り込み→Issue自動起票

### 10.3 運用テスト

- **AVクォータ**：**25超過**の挙動（スキップ＋Issue）。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **EDINET認証**：APIキー欠如/未設定、CSV未提供時のエラー処理（仕様書準拠）。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---

## 11. セキュリティ／運用

- **Secrets**：最小権限・半期ローテーション
- **Branch Protection**：`main` へのPRレビュー必須
- **監査**：閾値・目標変更・シナリオ保存はコミット/Issueで記録
- **データ品質**：`validate_schema.py` の前段検証

---

## 12. ロードマップ（導入順）

1. **EnergyChain**（EDINET CSV抽出・非調整値表示）
2. **MarketVision**（AVバッチ＋クォータ制御）
3. **ValueScope**（企業価値計算/スコアカード）
4. **FinSight**（PL/BS/CF＋注記NLP）
5. **PulseWatch**（クリティカル通知）

---

## 付録：実装スニペット

### A. EDINET 受取配当金 抽出（CSV ZIP）

# fetch_edinet_dividends.py

import os, io, zipfile, csv, requests

  

BASE = os.getenv("EDINET_BASE_URL", "https://api.edinet-fsa.go.jp/api/v2")

KEY  = os.getenv("EDINET_API_KEY")

  

def list_docs__(day):_

  _url=f"{BASE}/documents.json"_

  _params={"date":day, "type":2, "Subscription-Key":KEY}_

  _r=requests.get(url, params=params, timeout=60); r.raise_for_status()_

  _return r.json().get("results", [])_

_def dl_csv_zip(doc_id):

  url=f"{BASE}/documents/{doc_id}"_

  _params={"type":5, "Subscription-Key":KEY}  # CSV変換ZIP_

  _r=requests.get(url, params=params, timeout=120); r.raise_for_status()_

  _return io.BytesIO(r.content)_

_def extract_dividends(zip_bytes__, label_alias=("受取配当金","受取配当金（四半期）")):

  with zipfile.ZipFile(zip_bytes__) as z:_

    _for nm in z.namelist():_

      _if nm.endswith(".csv"):_

        _with z.open(nm) as f:_

          _reader=csv.DictReader(io.TextIOWrapper(f,encoding="utf-8"))_

          _for row in reader:_

            _label=(row.get("accountTitle") or row.get("label") or "").strip()_

            _if label in label_alias:

              amt=row.get("amount") or row.get("value") or "0"

              return float(amt)

  return None

> **一覧/取得・CSV変換ZIP・APIキー必須**は**EDINET API仕様書 v2（ESE140206）**に準拠。 [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

### B. Alpha Vantage バッチ取得＋クォータ

# fetch_alpha_vantage.py

import os, json, time, requests, sys

KEY=os.getenv("ALPHA_VANTAGE_API_KEY"__)_

_QUOTA_PATH="data/.quota/alpha_vantage_daily.json"

  

def load_quota__(limit=25):_

  _try:_

    _with open(QUOTA_PATH,"r",encoding="utf-8") as f: q=json.load(f)

  except: q={"date":"","count":0,"limit":limit}

  return q

  

def save_quota__(q):_

  _os.makedirs(os.path.dirname(QUOTA_PATH), exist_ok__=True)_

  _with open(QUOTA_PATH,"w",encoding="utf-8") as f: json.dump(q,f,ensure_ascii__=False,indent=2)_

_def call_av(params):

  url="https://www.alphavantage.co/query"

  r=requests.get(url, params=params, timeout=60)

  if r.status_code__==429: time.sleep(30)  # 429対策_

  _r.raise_for_status()

  return r.json()

  

# メイン：symbols（株）とfx（通貨）をまとめて取得し、日次25枠で制御

> **無料枠は1日25件**。設計は**時間バッチ化＋クォータファイル**で管理。 [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)

---

## 参考資料（公式／一次情報）

- **Alpha Vantage Support（無料枠25/dayのFAQ記載）**\ [https://www.alphavantage.co/support/](https://www.alphavantage.co/support/) [[dev.to]](https://dev.to/msnmongare/how-to-add-github-secrets-easily-step-by-step-guide-3cmh)
- **EDINET 閲覧サイト（WEEK0010）**\ [https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx](https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx) [[note.com]](https://note.com/kotaro_studio/n/n8450c133c5bb)
- **EDINET 操作ガイド集約（WZEK0110）**\ [https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0110.html](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0110.html)
- **EDINET API仕様書（Version 2）パッケージ（ESE140206.pdf）**\ [https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf) [[geeksforgeeks.org]](https://www.geeksforgeeks.org/devops/how-to-add-github-actions-secrets/)

---
