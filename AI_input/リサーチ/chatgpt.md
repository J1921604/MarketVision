
# 重要：外部API（運用制約・参照）

- **Alpha Vantage（無料）**：無料キーの利用は **1日最大25リクエスト**（かつ実運用では「/分」レート制限も存在）を前提に設計してください。超過した場合はスキップ→Issue自動作成／アラートを行う設計とします。 ([アルファ・バンテージ](https://www.alphavantage.co/support/?utm_source=chatgpt.com "Customer Support"))
    
- **EDINET API v2**：APIキーの発行・多要素認証が必要。書類一覧（documents.json）→書類取得（documents/{docID}?type=5）で**CSV変換ZIP**をダウンロードするフローが公式仕様（ESE140206）に記載されています。API発行手順や多要素認証フローは仕様書を厳守してください。 ([EDINET](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf?utm_source=chatgpt.com "EDINET API 仕様書"))
    

（以降の設計は上記前提に厳密に適合します）

---

# 共通（全アプリ）実装補強（短く）

- `repo/` 配下の共通ユーティリティ：
    
    - `scripts/quota_manager.py` — 日次・時間バッチ化クォータ管理（Alpha Vantage 専用拡張可能）
        
    - `scripts/edinet_client.py` — EDINET v2 用の一覧／DL／ZIP展開ユーティリティ（APIキー必須）
        
    - `scripts/validate_schema.py` — data/ 内ファイルをスキーマ検証（CSV/JSON）
        
    - `scripts/issue_on_fail.py` — GitHub API を使い Issue を自動作成（失敗通知）
        
- 共通 CI（`.github/workflows/deploy-pages.yml` + per-app `update-*.yml`）は既仕様どおり。
    
- **Secrets** 必須：`ALPHA_VANTAGE_API_KEY`, `EDINET_API_KEY`, `EDINET_BASE_URL`。Secrets は `Actions` スコープで登録。
    
- **データフォルダ**：`/data/{app}/`（CSV/JSON/Parquet）＋`/data/.quota/`（日次クォータ保存用JSON）。
    
- **バージョン**：`schema_version` を全 JSON に埋め、後方互換ルールを README に明記。
    

---

# 1) MarketVision — Spec-Kit 改善（完成度高め）

## 目的

東電/中電株価＋USD/JPY を重ね、テクニカル指標をインタラクティブ表示。Alpha Vantage 日次25枠制限を厳守して **1時間毎のバッチ更新**。±5% 変化でアラート。

---

## ファイル構成（必須）

```
marketvision/
├─ src/ (React + charting)
├─ data/ price/, fx/, indicators/, meta.json
├─ scripts/
│   ├─ fetch_alpha_vantage.py
│   ├─ quota_init.py
│   └─ build_indicators.py
└─ .github/workflows/update-marketvision.yml
```

---

## データスキーマ（例）

- `data/price/{symbol}.csv` (OHLCV)
    

```
schema_version,symbol
1.0.0,9501.T
date,open,high,low,close,volume
2025-11-26,1234,1250,1220,1245,100200
```

- `data/fx/usd_jpy.csv`
    

```
schema_version
1.0.0
date,rate
2025-11-26,151.23
```

- `data/indicators/{symbol}_indicators.json`
    

```json
{
  "schema_version":"1.0.0",
  "symbol":"9501.T",
  "asOf":"2025-11-26T09:00:00Z",
  "sma":{"5":1230.1,"25":1205.2,"75":1180.8},
  "rsi":{"14":58.3},
  "macd":{"macd":1.23,"signal":0.89,"hist":0.34}
}
```

---

## fetch_alpha_vantage.py（要点・改善版）

- **戦略**：1時間の Cron（top of hour）でジョブを起動。ジョブは `symbols` と `fx` の **バッチリクエストリスト**を作成し、`quota_manager` により当日の残枠を確認後、可能な分だけ順次実行。残りはスキップして Issue 作成。
    
- **Retry**：HTTP 429 → exponential backoff（最大 3 回）。
    
- **キャッシュ**：成功時は `data/price/{symbol}.csv` に追記（重複防止キー：date）。
    
- **安全設計**：ジョブ先頭で `quota_init.py --provider alpha_vantage --limit 25` を呼び、`data/.quota/alpha_vantage_daily.json` に `{date,count,limit}` を保存/更新。
    

**サンプル（抜粋）**（実装チームに渡すスニペット）

```python
# quota_manager snippet
import json, os, datetime
QUOTA_PATH = "data/.quota/alpha_vantage_daily.json"

def load_quota():
    today = datetime.date.today().isoformat()
    if os.path.exists(QUOTA_PATH):
        with open(QUOTA_PATH,"r",encoding="utf-8") as f:
            q=json.load(f)
        if q.get("date")==today:
            return q
    return {"date":today,"count":0,"limit":25}

def incr_quota(n=1):
    q=load_quota()
    q["count"] += n
    os.makedirs(os.path.dirname(QUOTA_PATH),exist_ok=True)
    with open(QUOTA_PATH,"w",encoding="utf-8") as f:
        json.dump(q,f,ensure_ascii=False,indent=2)
    return q
```

---

## update-marketvision.yml（GitHub Actions 要点）

```yaml
on:
  schedule: [{ cron: "0 * * * *" }]
  workflow_dispatch:
jobs:
  fetch-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with: python-version: '3.11'
      - name: Install deps
        run: pip install -r marketvision/requirements.txt
      - name: Init quota
        run: python marketvision/scripts/quota_init.py --provider alpha_vantage --limit 25
      - name: Fetch AV
        env:
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
        run: python marketvision/scripts/fetch_alpha_vantage.py --symbols "9501.T,9502.T" --fx "USDJPY"
      - name: Build indicators
        run: python marketvision/scripts/build_indicators.py
      - name: Validate
        run: python scripts/validate_schema.py marketvision/data
```

> 重要：Actions 実行回数が増えると GitHub の無料実行時間やSecrets露出に関する規定が絡むので、ジョブは必要最小限に。

---

## UI コンポーネント（設計）

- `TickerTile`（props: symbol, price, change, pct, volume, alertLevel）
    
    - ニューモフィズムカード、キーボードフォーカス対応、aria-label 完備
        
    - Hover アニメーション（内側押し込み + グロウ）
        
- `PriceChart`（props: symbol, period, granularity, overlays[]）
    
    - Recharts / lightweight-candlestick（SVG）ベース
        
    - オーバーレイ線：`--line--tepco` / `--line--chubu` クラス
        
    - パフォーマンス: データポイント 2000 以上の場合 WebWorker でインジケータ計算
        
- `AlertBanner`（±5% 超過時）→ クリックで Issue 作成 UI（バックエンド呼出）
    

---

## テスト（抜粋）

- Unit: RSI/MACD/Bollinger 算出（数値一致）
    
- Integration: Cron 実行 → `data/.quota/` の更新 → 残枠超過時はファイルが更新されず Issue が作られる
    
- E2E: 期間切替 → re-render → ±5% アラートトリガー
    

---

# 2) ValueScope — Spec-Kit 改善

## 目的

EV/EBITDA/PER/PBR/ROE 等を可視化し、閾値でスコア表示。EDINET（v2）から正式な財務情報を取得して計算に反映。

---

## ファイル構成（必須）

```
valuescope/
├─ src/
├─ data/ edinet_parsed/, valuation.json, kpi_targets.json, scorecards.json
├─ scripts/ parse_edinet_xbrl.py, build_valuation.py, compute_scores.py
└─ .github/workflows/update-valuation.yml
```

---

## データスキーマ（例）

- `data/valuation.json`
    

```json
{
  "schema_version":"1.0.0",
  "as_of":"2025-09-30",
  "companies":{
    "TEPCO": {
      "market_cap": 123456789000,
      "net_debt": 3456789000,
      "ev": null,
      "ebitda": 2345678000,
      "ev_ebitda": null,
      "per": null,
      "pbr": null
    }
  }
}
```

---

## EDINET の取り込み（parse_edinet_xbrl.py）

- **フロー**：
    
    1. `documents.json` に日付で問い合わせ → `results` をフィルタ（有価証券報告書等）
        
    2. `documents/{docID}?type=5` で CSV 変換 ZIP を DL
        
    3. ZIP 展開 → タグ・科目（様式コード）を正規化して `data/edinet_parsed/{company}_{period}.json` に保存
        
- **耐性**：タクソノミ差分（異なるラベル名）には alias table（`taxonomy_map.json`）で対応（例：`NetCash` ⇄ `現金及び現金同等物`）。
    
- **公開仕様準拠**：APIキー発行・CSV変換は ESE140206 を参照。 ([EDINET](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf?utm_source=chatgpt.com "EDINET API 仕様書"))
    

---

## build_valuation.py（要点）

- EV = market_cap + net_debt
    
- PER = market_cap / net_income（直近12M または TTM）
    
- PBR = market_cap / book_value
    
- **通貨統一**：EDINET は報告書ベース → 単位（千円/百万円）をパースして正規化（unit field 必須）
    

---

## CI（update-valuation.yml）

- schedule: daily at 02:30 JST（EDINET 更新は業務時間外に）
    
- 必ず `EDINET_API_KEY` を環境で読み込み、欠如時は Job を中止して Issue 作成
    

---

## UI（ValueScope）

- `ScoreCard`（閾値 JSON でスタイリング）
    
- `Gauge`（ROE, DSCR）カスタム SVG、アクセシビリティのためテキスト代替を常時表示
    
- `PeerCompare`（同業比較のテーブル + レーダーチャート）
    

---

## テスト要件

- 金融指標計算ユニット（EV/EBITDA/PER/PBR）
    
- EDINET CSV→JSON パイプライン（タクソノミ差分のユニットテスト）
    
- UI: 閾値ファイル差分で ScoreCard 色が変わる E2E
    

---

# 3) FinSight — Spec-Kit 改善（注記NLP含む）

## 目的

PL/BS/CF を構造化比較、注記からリスク抽出・会計方針変更検知（NLP）。

---

## ファイル構成

```
finsight/
├─ data/ financials/, ratios.csv, xbrl_notes.json
├─ scripts/ extract_financials.py, compute_ratios.py, nlp_notes_risk.py
└─ .github/workflows/update-financials.yml
```

---

## データスキーマ（例）

- `data/financials/TEPCO_quarterly.csv`
    

```
schema_version,company,period
1.0.0,TEPCO,2025Q2
date,revenue,op_income,net_income,ebitda
2025-06-30,100000000,12000000,8000000,15000000
```

- `data/xbrl_notes.json`
    

```json
[{"company":"TEPCO","period":"2025Q2","tag":"risk","text":"…","severity":0.8}]
```

---

## 注記NLP（nlp_notes_risk.py）

- **処理**：
    
    - XBRL/CSV の注記テキストを抽出 → 前処理（正規化、tokenize, sentence split）
        
    - ルール+MLハイブリッド：まずルールベース（キーワード辞書：`減損`,`関連当事者`,`見積`）で高感度抽出 → その候補を軽量 Transformer（オンプレ小モデル or external API）で分類（`risk|policy_change|info`）・severity スコア（0..1）
        
- **注意**：高精度が必要な場合はモデルの再学習が必須。NLP 出力は必ず人の確認フロー（Lint/PR）を入れる。
    

---

## CI

- EDINET パイプライン（一覧→DL→抽出）を daily cron で実行
    
- NLP にはリソース制限（max tokens/time）を設け、失敗時に partial result を commit + Issue
    

---

## テスト

- 注記抽出ルール（キーワードベース）のカバレッジテスト
    
- 会計方針変更（サンプル注記）を正しく `policy_change` にタグ付けする E2E
    

---

# 4) EnergyChain — Spec-Kit 改善（最優先：EDINET 受取配当金）

> **厳守事項**：親会社の「受取配当金」を**そのまま採用**（出資比率による調整なし）。仕様どおり。

## 目的

親会社単独の受取配当金を時系列可視化。JERA の配当イベントと重ねる。

---

## ファイル構成

```
energychain/
├─ data/ contribution_trend.csv, contribution_metadata.json, taxonomy_map.json
├─ scripts/ fetch_edinet_dividends.py, build_contribution.py
└─ .github/workflows/update-energychain.yml
```

---

## fetch_edinet_dividends.py（改良ポイント）

- **一覧**：`GET {BASE}/documents.json?date=YYYY-MM-DD&type=2&Subscription-Key=KEY`
    
- **CSV取得**：`GET {BASE}/documents/{docID}?type=5&Subscription-Key=KEY`（CSV変換ZIP）→ ZIP 展開 → `受取配当金` ラベルを検索して金額を取得（ラベル alias に対応）。（仕様書準拠） ([EDINET](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf?utm_source=chatgpt.com "EDINET API 仕様書"))
    
- **ラベル alias**（必須）：`["受取配当金","受取配当金（四半期）","受取配当"]` などを `taxonomy_map.json` で管理
    
- **出力**：`data/contribution_trend.csv`（`_date,docID,company,dividends_received,source_file`）
    

**コードスニペット（抜粋）**

```python
def extract_dividends(zip_bytes, label_alias=("受取配当金","受取配当金（四半期）")):
    import zipfile, io, csv
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for nm in z.namelist():
            if nm.endswith(".csv"):
                with z.open(nm) as f:
                    reader = csv.DictReader(io.TextIOWrapper(f,encoding="utf-8"))
                    for row in reader:
                        label = (row.get("accountTitle") or row.get("label") or "").strip()
                        if label in label_alias:
                            amt = row.get("amount") or row.get("value") or "0"
                            return float(amt.replace(",",""))
    return None
```

---

## update-energychain.yml（要点）

- schedule: weekly（EDINET 大量ダウンロード回避のため）
    
- 必須チェック：`EDINET_API_KEY` がなければ Job 停止 + Issue（運用ミスを早期検知）
    

---

## UI

- `ContributionTrend`（line + bar）＋ `Waterfall`
    
- `EventMarker`（JERA 配当決議日）を tooltips で出典（docID）を表示
    

---

## テスト

- EDINET DL → ZIP 展開に失敗した時のフェールセーフ（ログ + Issue）
    
- ラベル alias の追加・変更で正しく抽出される単体テスト
    

---

# 5) PulseWatch — Spec-Kit 改善（ニュース & クリティカル通知）

## 目的

ニュースを取り込みタグ付け・センチメント分析。重大（<= -0.6）をバナーで表示し Issue 発行。

---

## ファイル構成

```
pulsewatch/
├─ data/ news.json, alerts.json
├─ scripts/ ingest_feeds.py, sentiment_tagging.py
└─ .github/workflows/update-news.yml
```

---

## ingest_feeds.py（方針）

- ソース：PressRelease、RSS（公式サイト）、Twitter（API 利用は注意）など。
    
- 正規化フィールド：`id,source,publishedAt,title,summary,url,tags,lang`
    
- Sentiment：`sentiment_score`（-1..1） を付与（`sentiment_tagging.py`）。クリティカル閾値は `<= -0.6`。
    
- 重大記事は `alerts.json` に push + UI で Banner 表示 + `scripts/issue_on_fail.py` を呼んで Issue を作成（運用追跡）。
    

---

## sentiment_tagging.py（実装メモ）

- 軽量ルール（辞書）→ Transformer スコアのハイブリッド
    
- 日本語向け辞書とエンベディングモデル（社内ポリシーにより外部APIが使えない場合は小型日本語モデルを導入）
    
- スコアキャリブレーション用に `data/sentiment_calibration.json`（サンプルラベル付き）を用意
    

---

## UI

- `NewsFeed`：タグフィルタ、センチメントスライダ（>= -0.6 を警戒色で表示）
    
- `CriticalBanner`：自動的にページ上部に展開、閉じた操作はアラート履歴へ保存
    

---

## テスト

- fake RSS サンプル投入 → sentiment <= -0.6 の記事が `alerts.json` に入る E2E
    
- バナークリックで Issue が作成される統合テスト
    

---

# 追加：品質 / セキュリティ / 運用（具体的アクション）

1. **Secret ローテーションの実装手順**：README に 6 ヶ月ごとの更新フローを記載（PR テンプレ＋Issue テンプレ）。
    
2. **Main branch Protection**：`require pull request reviews`, `status checks`（validate_schema, unit tests）を必須。
    
3. **Monitoring**：`data/.quota/*` の急増や EDINET 呼出しの 4xx/5xx を監視する GitHub Action（失敗時 Issue auto-create）を全 update-workflow に追加。
    
4. **Performance Budget**：LCP < 2.5s を実現するため、Chart の静的プリレンダリング（SSR）とデータの遅延ロード（lazy load）を採用。
    
5. **アクセシビリティ**：WCAG AA 自動チェック（axe-core を CI に組込む）
    

---

# テスト計画（要約）

- **ユニット**：テクニカル指標（RSI/MACD/BB）、EV/PER/PBR、受取配当金抽出ロジック
    
- **統合**：EDINET一覧→DL→抽出→保存（一連のパイプライン）
    
- **E2E**：UI 操作（期間切替/閾値変更/バナーの表示）
    
- **運用テスト**：AV クォータ超過時（スキップ→Issue）、EDINET 認証欠如
    

---

# デリバラブル（あなたへ納品する spec-kit の形）

- 各アプリごとの **`spec-kit/marketvision.md`** のような単一の Markdown（＝実装仕様書）を作成（含む：API 仕様、データモデル、CI スニペット、主要スクリプトの雛形、テストケース一覧、運用手順）。
    
- さらに希望があれば、各アプリの **雛形リポジトリ（ファイルツリー＋主要スクリプト skeleton）** を生成します（GitHub に直接コミットする操作は行えないため、ダウンロード可能な zip を提供）。
    

---

# 参考（外部参照）

- Alpha Vantage サポート（無料枠 25/day）。 ([アルファ・バンテージ](https://www.alphavantage.co/support/?utm_source=chatgpt.com "Customer Support"))
    
- EDINET API 仕様書（ESE140206.pdf） — APIキー発行や `type=5`（CSV変換ZIP）仕様。 ([EDINET](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf?utm_source=chatgpt.com "EDINET API 仕様書"))
    

---
