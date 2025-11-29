
# Master Spec-Kit v2.1 — The Gemini Edition

## はじめに

本ドキュメントは、5つの独立した金融分析アプリケーション群「Corporate Value Monitor」を構成する各アプリケーション（`MarketVision`, `ValueScope`, `FinSight`, `EnergyChain`, `PulseWatch`）の最終実装仕様書です。

各アプリケーションが独立した開発プロジェクトとして遂行可能なレベルまで詳細化されており、共通基盤仕様と個別アプリケーション仕様の2部構成となっています。本仕様書は、開発チーム間の連携を円滑にし、一貫性のある高品質なプロダクトスイートを実現するための唯一の正（Single Source of Truth）となります。

---

## 第0章: 共通基盤仕様 (Master Platform Specification)

全アプリケーションは、本章で定義される共通基盤上で構築・運用されます。これにより、開発効率、運用保守性、ブランドの一貫性を最大化します。

### 0.1 アーキテクチャ: Static-First & Git-based

- **ホスティング**: 全てのアプリケーションは**GitHub Pages**を通じて静的サイトとしてデプロイされます。
    - **デプロイ対象ブランチ**: `main`
    - **ビルド成果物ディレクトリ**: `dist`
- **データストレージ**: リポジトリ内の`/data/`ディレクトリを単一のデータソースとして利用します。
    - **フォーマット**: CSV, JSON, Parquet
    - **データ更新**: **GitHub Actions**による定期的なバッチ処理で外部APIからデータを取得し、リポジトリに直接コミットします。
    - **監査証跡**: Gitのコミット履歴が、そのままデータの変更履歴（いつ、誰が、何を）となります。

### 0.2 CI/CD: GitHub Actions

- **サイトデプロイ**: `.github/workflows/deploy-pages.yml`
    - **トリガー**: `main`ブランチへの`push`、または手動実行 (`workflow_dispatch`)
- **データ更新**: 各アプリ専用のワークフロー (例: `update-marketvision.yml`)
    - **トリガー**: 定期実行 (`schedule: cron`) および手動実行 (`workflow_dispatch`)

### 0.3 Secrets管理

リポジトリの`Settings > Secrets and variables > Actions`にて、以下のSecretを登録します。

| Secret名              | 説明                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage APIキー。**無料枠（25リクエスト/日）**を厳守する設計。                               |
| `EDINET_API_KEY`        | EDINET API v2の認証キー。公式サイトでの発行が必須。                                              |
| `EDINET_BASE_URL`       | EDINET API v2のエンドポイント。デフォルト: `https://api.edinet-fsa.go.jp/api/v2`                   |
| `GITHUB_TOKEN`          | Issue自動起票など、GitHub API連携で使用。通常は`secrets.GITHUB_TOKEN`で自動的に利用可能。         |

### 0.4 デザインシステム: "Cyberpunk Neumorphism"

ダークテーマを基調とし、ニューモフィズムの立体感とサイバーパンクのネオンカラーを融合させます。

- **カラーパレット (CSS Variables)**:

```css
:root {
  --bg-primary: #0A0F0F;
  --bg-secondary: #0D1414;
  --fg-primary: #E6F5F1;
  --fg-secondary: #A8C5BE;
  --neon-green: #00FF84;
  --tepco-cyan: #00D4FF;
  --chubu-magenta: #FF2ECC;
  --status-positive: #00FF84;
  --status-warning: #FFB800;
  --status-negative: #FF4757;
  --shadow-light: rgba(255, 255, 255, 0.08);
  --shadow-dark: rgba(0, 0, 0, 0.55);
  --glow-neon: rgba(0, 255, 132, 0.65);
  --glow-cyan: rgba(0, 212, 255, 0.5);
  --glow-magenta: rgba(255, 46, 204, 0.5);
  --ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

- **コンポーネントスタイル**:

```css
.neumorph-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: -6px -6px 12px var(--shadow-light), 6px 6px 12px var(--shadow-dark);
}
.button--selected {
  background: var(--neon-green);
  color: var(--bg-primary);
  box-shadow: 0 0 16px var(--glow-neon);
}
.line--tepco { stroke: var(--tepco-cyan); filter: drop-shadow(0 0 6px var(--glow-cyan)); }
.line--chubu { stroke: var(--chubu-magenta); filter: drop-shadow(0 0 6px var(--glow-magenta)); }
```

### 0.5 外部API連携規約

- **Alpha Vantage**:
    - **制約**: **1日最大25リクエスト**。
    - **実装**: 1時間ごとのバッチ処理で複数シンボルをまとめて取得。日次クォータは`data/.quota/alpha_vantage_daily.json`で厳格に管理し、超過時はジョブをスキップしてGitHub Issueを自動起票する。
- **EDINET API v2**:
    - **制約**: APIキー必須。金融庁提供の[公式仕様書(ESE140206)](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf)に厳格準拠。
    - **フロー**:
        1. **書類一覧API**: `GET /api/v2/documents.json` でメタデータを取得。
        2. **書類取得API**: `GET /api/v2/documents/{docID}?type=5` で**CSV形式のZIPファイル**をダウンロード。

### 0.6 共通ユーティリティスクリプト (`repo/scripts/`)

- `quota_manager.py`: APIクォータを管理する共通モジュール。
- `edinet_client.py`: EDINET API v2へのリクエストを抽象化するクライアント。
- `validate_schema.py`: `data/`配下のファイルが定義済みスキーマに準拠しているか検証する。
- `issue_on_fail.py`: ワークフロー失敗時にGitHub Issueを起票する。

---

## 第1章: MarketVision — 市場価格分析ダッシュボード

### 1.1 目的
東電/中電の株価、USD/JPY為替、テクニカル指標を統合し、インタラクティブな市場分析環境を提供する。**±5%の価格急変アラート**を実装する。

### 1.2 ファイル構成
```
marketvision/
├─ src/
│  ├─ components/ (TickerTile.tsx, PriceChart.tsx, AlertBanner.tsx)
│  └─ hooks/ (useMarketData.ts)
├─ data/
│  ├─ price/ (9501.T.csv, 9502.T.csv)
│  ├─ fx/ (usd_jpy.csv)
│  ├─ indicators/ (9501.T_indicators.json)
│  └─ .quota/ (alpha_vantage_daily.json)
├─ scripts/
│  ├─ fetch_alpha_vantage.py
│  ├─ build_indicators.py
│  └─ quota_init.py
└─ .github/workflows/update-marketvision.yml
```

### 1.3 データスキーマ

- **`data/price/{symbol}.csv`**:
  ```csv
  date,open,high,low,close,volume
  2025-11-26,1234,1250,1220,1245,100200
  ```
- **`data/indicators/{symbol}_indicators.json`**:
  ```json
  {
    "schema_version": "1.1.0",
    "symbol": "9501.T",
    "asOf": "2025-11-26T09:00:00Z",
    "sma": {"5": 1230.1, "25": 1205.2, "75": 1180.8},
    "rsi": {"14": 58.3},
    "macd": {"macd": 1.23, "signal": 0.89, "hist": 0.34}
  }
  ```

### 1.4 主要スクリプト: `fetch_alpha_vantage.py`
- **戦略**: 1時間ごとのCronジョブで起動。`quota_manager`で残枠を確認後、複数シンボルとFXをまとめてリクエスト。残枠不足時はスキップし、Issueを起票。
- **堅牢性**: HTTP 429（レート制限）に対し、指数バックオフで最大3回リトライ。
- **キャッシュ**: 成功時はCSVに追記（`date`をキーに重複排除）。

### 1.5 CI/CD: `update-marketvision.yml`
```yaml
on:
  schedule: [{ cron: "0 * * * *" }] # 毎時実行
  workflow_dispatch:
jobs:
  fetch-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with: { python-version: '3.11' }
      - run: pip install -r marketvision/requirements.txt
      - run: python marketvision/scripts/quota_init.py --provider alpha_vantage --limit 25
      - name: Fetch AV Data
        env: { ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }} }
        run: python marketvision/scripts/fetch_alpha_vantage.py --symbols "9501.T,9502.T" --fx "USDJPY"
      - run: python marketvision/scripts/build_indicators.py
      - run: python scripts/validate_schema.py marketvision/data
```

---

## 第2章: ValueScope — 企業価値分析ダッシュボード

### 2.1 目的
EV/EBITDA, PER, PBR, ROE等の企業価値指標をEDINETの正式な財務情報から算出し、閾値に基づいたスコアカードで可視化する。

### 2.2 ファイル構成
```
valuescope/
├─ src/
├─ data/
│  ├─ edinet_parsed/ ({company}_{period}.json)
│  ├─ valuation.json
│  ├─ kpi_targets.json
│  └─ scorecards.json
├─ scripts/
│  ├─ parse_edinet_xbrl.py
│  ├─ build_valuation.py
│  └─ compute_scores.py
└─ .github/workflows/update-valuation.yml
```

### 2.3 データスキーマ: `data/valuation.json`
```json
{
  "schema_version": "1.1.0",
  "as_of": "2025-09-30",
  "companies": {
    "TEPCO": {
      "market_cap": 123456789000,
      "net_debt": 3456789000,
      "ev": 126913578000,
      "ebitda": 2345678000,
      "ev_ebitda": 54.1,
      "per": 15.2,
      "pbr": 0.8
    }
  }
}
```

### 2.4 主要スクリプト: `parse_edinet_xbrl.py`
- **フロー**:
    1. `documents.json`で有価証券報告書等を検索。
    2. `documents/{docID}?type=5`でCSV変換ZIPをダウンロード。
    3. ZIPを展開し、勘定科目を正規化して`data/edinet_parsed/`にJSONとして保存。
- **耐性**: タクソノミの差異（例: `NetCash` vs `現金及び現金同等物`）を吸収するため、`taxonomy_map.json`によるエイリアス管理を導入。

---

## 第3章: FinSight — 財務諸表インサイト

### 3.1 目的
PL/BS/CFを構造化して比較し、財務諸表の注記からNLP（自然言語処理）を用いてリスク要因や会計方針の変更を自動的に抽出・検知する。

### 3.2 ファイル構成
```
finsight/
├─ data/
│  ├─ financials/ (TEPCO_quarterly.csv)
│  ├─ ratios.csv
│  └─ xbrl_notes.json
├─ scripts/
│  ├─ extract_financials.py
│  ├─ compute_ratios.py
│  └─ nlp_notes_risk.py
└─ .github/workflows/update-financials.yml
```

### 3.3 データスキーマ: `data/xbrl_notes.json`
```json
[
  {
    "company": "TEPCO",
    "period": "2025Q2",
    "tag": "risk",
    "text": "燃料価格の変動は、当社の経営成績に重要な影響を与える可能性があります...",
    "severity": 0.8,
    "keywords": ["燃料価格", "変動", "影響"]
  }
]
```

### 3.4 主要スクリプト: `nlp_notes_risk.py`
- **戦略**: ルールベースと機械学習のハイブリッドアプローチ。
    1. **キーワード抽出**: `減損`, `訴訟`, `関連当事者`などのキーワード辞書でリスク候補を高感度に抽出。
    2. **分類・スコアリング**: 抽出された候補文を、軽量な日本語Transformerモデル（例: `cl-tohoku/bert-base-japanese-whole-word-masking`）を用いて`risk | policy_change | info`に分類し、重要度（severity）を0〜1でスコアリングする。
- **品質担保**: NLPの出力は確定的ではないため、結果はUI上で「AIによる分析結果」と明記し、必ず出典（docID）へのリンクを併記する。

---

## 第4章: EnergyChain — JERA貢献度分析

### 4.1 目的
親会社（東電・中電）の**単独PL**から「受取配当金」を抽出し、時系列で可視化する。JERAの配当イベントと重ねることで、JERAの貢献度トレンドを分析する。

### 4.2 **最重要要件**
> **親会社の「受取配当金」をそのまま採用すること。出資比率等による調整は一切行わない。**

### 4.3 ファイル構成
```
energychain/
├─ data/
│  ├─ contribution_trend.csv
│  ├─ contribution_metadata.json
│  └─ taxonomy_map.json
├─ scripts/
│  ├─ fetch_edinet_dividends.py
│  └─ build_contribution.py
└─ .github/workflows/update-energychain.yml
```

### 4.4 データスキーマ: `data/contribution_trend.csv`
```csv
date,docID,company,dividends_received,source_file
2025-06-30,S10XXXXX,TEPCO,12345000000,jpcrp030000-asr-001_E04498-000_2025-06-30_01_2025-08-14.csv
```

### 4.5 主要スクリプト: `fetch_edinet_dividends.py`
- **抽出ロジック**:
    1. EDINET APIからCSV変換ZIPをダウンロード。
    2. ZIP内をループし、**単独**財務諸表のCSVファイルを特定。
    3. CSV内から`受取配当金`またはそのエイリアス（`taxonomy_map.json`で管理）に合致する行を探し、金額を抽出する。
- **コードスニペット (改良版)**:
```python
def extract_dividends(zip_bytes, label_aliases):
    import zipfile, io, csv
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for filename in z.namelist():
            # 'Consolidated'や'連結'を含まない単独財務諸表のみを対象とする
            if 'consolidated' in filename.lower() or '連結' in filename:
                continue
            if filename.endswith(".csv"):
                with z.open(filename) as f:
                    reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"))
                    for row in reader:
                        label = (row.get("accountTitle") or row.get("label") or "").strip()
                        if label in label_aliases:
                            amount_str = row.get("amount") or row.get("value") or "0"
                            return float(amount_str.replace(",", ""))
    return None
```

---

## 第5章: PulseWatch — ニュース・アラート監視

### 5.1 目的
関連ニュースを自動収集し、センチメント分析とタグ付けを行う。センチメントスコアが閾値（例: -0.6）以下の重大なネガティブニュースを検知し、アラートバナー表示とIssueによる通知を行う。

### 5.2 ファイル構成
```
pulsewatch/
├─ data/
│  ├─ news.json
│  └─ alerts.json
├─ scripts/
│  ├─ ingest_feeds.py
│  └─ sentiment_tagging.py
└─ .github/workflows/update-news.yml
```

### 5.3 データスキーマ: `data/news.json`
```json
[{
  "id": "news-12345",
  "source": "PressRelease",
  "publishedAt": "2025-11-26T14:00:00Z",
  "title": "...",
  "summary": "...",
  "url": "...",
  "tags": ["事故", "コンプライアンス"],
  "sentiment": {"score": -0.75, "label": "negative"},
  "isCritical": true
}]
```

### 5.4 主要スクリプト: `sentiment_tagging.py`
- **戦略**:
    1. **ソース収集**: `ingest_feeds.py`が公式サイトのプレスリリースやRSSフィードからニュースを収集・正規化する。
    2. **センチメント分析**: `sentiment_tagging.py`が収集したテキストに対し、日本語の事前学習済みモデル（例: `line-corporation/line-distilbert-base-japanese`）を用いてセンチメントスコア（-1.0〜1.0）を付与する。
    3. **クリティカル判定**: スコアが`-0.6`以下の記事をクリティカルと判定し、`alerts.json`に追記すると同時に、`issue_on_fail.py`を呼び出してIssueを起票する。

---

## 第6章: マスターテスト計画

- **ユニットテスト**:
    - テクニカル指標（RSI/MACD）、企業価値指標（EV/PER）、受取配当金抽出ロジックなど、計算ロジックの正確性を検証。
- **統合テスト**:
    - EDINET一覧→DL→抽出→保存の一連のパイプラインが正常に動作することを確認。
    - Alpha Vantageのクォータ超過時に、ジョブが正常にスキップされIssueが起票されることを確認。
- **E2Eテスト**:
    - UI操作（期間切替、閾値変更）が正しく再描画に反映されることを確認。
    - クリティカルニュース検知時にアラートバナーが表示されることを確認。
- **品質/セキュリティ**:
    - **ブランチ保護**: `main`ブランチへの直接pushを禁止し、PRレビューとステータスチェック（ユニットテスト、スキーマ検証）を必須とする。
    - **Secretスキャン**: CIにSecretスキャンツール（例: `trufflehog`）を組み込み、誤ったキーのコミットを防止する。
    - **アクセシビリティ**: CIに`axe-core`を組み込み、WCAG AA基準の自動チェックを行う。
