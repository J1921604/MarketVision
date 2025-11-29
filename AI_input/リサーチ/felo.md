
## 概要

本レポートは、5つの独立した金融分析アプリケーション群「Master Spec-Kit」を、各々が独立した開発プロジェクトとして遂行可能なレベルまで詳細化した技術仕様書である。共通基盤となるプラットフォーム、デザインシステム、CI/CDパイプラインの標準仕様を定義した上で、`MarketVision`、`ValueScope`、`FinSight`、`EnergyChain`、`PulseWatch`の各アプリケーションについて、機能要件、データモデル、アーキテクチャ、API統合、テスト計画を個別に詳述する。これにより、各開発チームは担当アプリケーションの仕様を明確に理解し、効率的かつ整合性の取れた開発を推進できる。特に、Alpha Vantage APIの無料枠（1日25リクエスト）とEDINET API v2の厳格な仕様を遵守するための具体的な実装戦略を提示する[[9](https://github.blog/enterprise-software/ci-cd/build-ci-cd-pipeline-github-actions-four-steps/)][[37](https://www.alphavantage.co/)][[52](https://qiita.com/hifistar/items/0114c6f60ded96785178)]。

## 詳細レポート

### 1. 共通基盤仕様 (Master Platform Specification)

すべてのアプリケーションは、以下の共通基盤上で構築・運用される。これにより、開発効率、運用保守性、ブランドの一貫性を確保する。

**プラットフォームとCI/CD**

*   **ホスティング**: 全てのアプリケーションはGitHub Pagesを通じて静的サイトとしてデプロイされる[[2](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)][[151](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)]。
    *   **デプロイ対象ブランチ**: `main`
    *   **ビルド成果物ディレクトリ**: `dist`
*   **CI/CD**: GitHub Actionsを利用してビルド、テスト、デプロイ、データ更新を自動化する[[3](https://resources.github.com/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)][[9](https://github.blog/enterprise-software/ci-cd/build-ci-cd-pipeline-github-actions-four-steps/)][[24](https://docs.github.com/en/actions/get-started/continuous-integration)]。
    *   **サイトデプロイ**: `push`または`workflow_dispatch`をトリガーとする共通ワークフロー`.github/workflows/deploy-pages.yml`を使用する[[151](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)]。
    *   **データ更新**: 各アプリ専用のワークフロー（例: `update-marketvision.yml`）を`cron`スケジュール実行および手動実行（`workflow_dispatch`）で運用する[[1](https://zenn.dev/utokyo_aido/articles/20250226-080332)]。

![GitHub Actionsのワークフロー提案画面[152]](https://images.ctfassets.net/wfutmusr1t3h/2R9tm0k2UtfnpPK1wDaSNc/e40e62af4f9ad6854f5e3edf69f17985/GitHub-Actions-Workfile-Suggestions.jpg?w=1280&q=75)

**Secrets管理**

リポジトリの`Settings > Secrets and variables > Actions`にて、以下のSecretを登録する[[14](https://10-5.jp/blog-tenfive/4137/)][[16](https://envader.plus/article/479)][[138](https://10-5.jp/blog-tenfive/4137/)]。

| Secret名 | 値の例 | 説明 |
| :--- | :--- | :--- |
| `ALPHA_VANTAGE_API_KEY` | `YOUR_AV_API_KEY` | Alpha Vantage APIキー。**無料枠（25リクエスト/日）**を厳守する[[60](https://www.alphavantage.co/support/)]。 |
| `EDINET_API_KEY` | `YOUR_EDINET_API_KEY` | EDINET API v2の認証キー。公式サイトでの発行が必須[[33](https://qiita.com/XBRLJapan/items/27e623b8ca871740f352)][[41](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)][[56](https://note.com/python_lab/n/n510c3315b3f9)]。 |
| `TEPCO_EDINET_CODE` | `E04505` | 東京電力のEDINETコード（参考値） |
| `CHUBU_EDINET_CODE` | `E04508` | 中部電力のEDINETコード（参考値） |
| `JERA_EDINET_CODE` | `E31599` | JERAのEDINETコード（参考値） |

**デザインシステム: "Cyberpunk Neumorphism"**

ダークテーマを基調とし、ニューモフィズムの立体感とサイバーパンクのネオンカラーを融合させる。

*   **カラーパレット**:
    *   Base Background: `#0A0F0F`
    *   Base Foreground: `#E6F5F1`
    *   Primary (Neon Green): `#00FF84`
    *   TEPCO (Cyan): `#00D4FF`
    *   CHUBU (Magenta): `#FF2ECC`
*   **コンポーネントスタイル**: CSSカスタムプロパティ（コードトークン）を用いてスタイルを統一管理する。

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
     6px  6px 12px var(--soft-shadow-dark),
     0 0 12px rgba(0, 255, 132, 0.15);
}

.button--selected {
  background: var(--neon-green);
  color: #051010;
  box-shadow: 0 0 16px rgba(0, 255, 132, 0.65);
}

.line--tepco { stroke: var(--cyan); filter: drop-shadow(0 0 6px var(--cyan)); }
.line--chubu { stroke: var(--magenta); filter: drop-shadow(0 0 6px var(--magenta)); }
```

**外部API連携の標準規約**

*   **Alpha Vantage**: 1時間ごとのバッチ処理で複数シンボルをまとめて取得する。日次クォータ（25件）はリポジトリ内のファイルで管理し、超過時はジョブをスキップしてGitHub Issueを自動起票する[[9](https://github.blog/enterprise-software/ci-cd/build-ci-cd-pipeline-github-actions-four-steps/)][[60](https://www.alphavantage.co/support/)]。
*   **EDINET API v2**: 金融庁提供の公式仕様書に厳格準拠する[[34](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WEEK0060.html)][[52](https://qiita.com/hifistar/items/0114c6f60ded96785178)]。
    1.  **書類一覧API**: `GET /api/v2/documents.json` を使用し、特定日に提出された書類のメタデータを取得する[[36](https://zenn.dev/paradinight/articles/f4567f3728e4d2)][[41](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)]。
    2.  **書類取得API**: 上記で得た`docID`を使い、`GET /api/v2/documents/{docID}?type=5`で**CSV形式のZIPファイル**をダウンロードする[[41](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)][[52](https://qiita.com/hifistar/items/0114c6f60ded96785178)]。
    *   APIキーは`Subscription-Key`ヘッダまたはクエリパラメータで送信する[[36](https://zenn.dev/paradinight/articles/f4567f3728e4d2)]。
    *   API利用前の準備（アカウント作成、MFA設定、ポップアップ許可）は`WZEK0110`操作ガイド集約ページを参照し完了させること[[32](https://disclosure2.edinet-fsa.go.jp/week0020.aspx)][[44](https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx)][[56](https://note.com/python_lab/n/n510c3315b3f9)]。

---

### 2. MarketVision — Market & Price Analytics

![MarketVisionのロゴ[85]](https://assets.equifax.com/marketing/US/images/featured/marketvision-securities_benefits_feature_700x500.jpg)

**目的**

東京電力（TEPCO）と中部電力（CHUBU）の株価、およびUSD/JPY為替レートを統合的に可視化する。テクニカル指標と重要イベントを重ねて表示し、市場動向の直感的な把握と、株価の急変（±5%）に対するアラートを提供する。

**機能要件**

*   **指標タイル**: 最新の株価・為替レート、前日比、騰落率、出来高をニューモフィズムデザインのタイルで表示する。
*   **メインチャート**:
    *   ローソク足（日足/週足切替）
    *   移動平均線（SMA: 5日, 25日, 75日）
    *   出来高（棒グラフ）
    *   イベントマーカー（決算発表日、権利落ち日など）
*   **テクニカル指標サブチャート**:
    *   RSI (14期間)
    *   MACD (短期12, 長期26, シグナル9)
    *   ボリンジャーバンド (20期間, ±2σ)
*   **インタラクション**:
    *   表示期間フィルタ (1M, 3M, 6M, 1Y, 3Y, 5Y, カスタム)
    *   銘柄比較（TEPCO/CHUBUの株価をオーバーレイ表示）
    *   相関分析（12ヶ月週次データに基づく相関係数を表示）

**データモデル**

*   **入力/保存データ**:
    *   `data/price/9501.T.csv`: 東電株価 (OHLCV形式)
    *   `data/price/9502.T.csv`: 中電株価 (OHLCV形式)
    *   `data/fx/usd_jpy.csv`: USD/JPY為替レート
*   **生成データ**:
    *   `data/indicators/9501.T_indicators.json`: 東電のテクニカル指標
    *   `data/indicators/9502.T_indicators.json`: 中電のテクニカル指標

**Alpha Vantage API統合**

*   **対象API**: `TIME_SERIES_DAILY`, `FX_DAILY`
*   **クォータ管理**: 1回のワークフロー実行で最大3リクエスト（東電株価、中電株価、USD/JPY）を消費する。`data/.quota/alpha_vantage_daily.json`ファイルで日次カウンターを管理し、上限（25件）に達した場合は処理をスキップする[[60](https://www.alphavantage.co/support/)]。

**CI/CDワークフロー (`.github/workflows/update-marketvision.yml`)**

```yaml
name: Update MarketVision Data

on:
  schedule:
    - cron: "0 * * * *" # 1時間ごとに実行
  workflow_dispatch:

jobs:
  fetch-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: pip install requests pandas

      - name: Fetch data from Alpha Vantage with quota
        id: fetch_data
        run: |
          python scripts/fetch_alpha_vantage.py \
            --symbols "9501.T,9502.T" \
            --fx "USDJPY" \
            --output-dir "data" \
            --quota-file "data/.quota/alpha_vantage_daily.json"
        env:
          ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}

      - name: Build technical indicators
        if: steps.fetch_data.outputs.data_updated == 'true'
        run: python scripts/build_indicators.py --input-dir "data/price" --output-dir "data/indicators"

      - name: Commit and push if changed
        if: steps.fetch_data.outputs.data_updated == 'true'
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update MarketVision data" && git push
```

---

### 3. ValueScope — Corporate Value Dashboard

**目的**

EV/EBITDA, PER, PBRなどの企業価値評価指標と、ROE, 自己資本比率などの財務健全性指標を統合し、ダッシュボード形式で提供する。信号機（青/黄/赤）とゲージによる直感的な評価により、企業の財務状態を即座に判断可能にする。

**機能要件**

*   **スコアカード**: 各指標を定義済みの閾値（`kpi_targets.json`）に基づき、青（良好）、黄（注意）、赤（警告）の3段階で色分け表示する。
*   **KPIゲージ**: ROEや自己資本比率などの重要指標をゲージメーターで可視化し、目標達成度を示す。
*   **推移グラフ**: 主要な評価指標（EV/EBITDA, PER, PBR, ROE）の四半期ごとの推移をグラフで表示する。
*   **比較分析**: レーダーチャートでTEPCOとCHUBUの財務指標バランスを比較する。

**計算定義**

*   **EV (企業価値)**: 時価総額 + 純有利子負債 (有利子負債 - 現金及び預金)
*   **DSCR (元利金償還カバー率)**: 営業キャッシュフロー / (有利子負債の返済額 + 支払利息)
*   **閾値定義ファイル (`data/kpi_targets.json`)**:

```json
{
  "ROE": { "good": 10, "warning": 5 },
  "EquityRatio": { "good": 40, "warning": 20 },
  "DSCR": { "good": 1.5, "warning": 1.0 }
}
```

**EDINET API統合**

*   **対象書類**: 有価証券報告書（`docTypeCode: 120`）、四半期報告書（`docTypeCode: 140`）
*   **データ抽出**: `type=5`で取得したCSV ZIPファイルの中から、連結財務諸表（BS, PL, CF）のCSVを特定し、パースする。勘定科目はEDINETタクソノミと`taxonomy_map.json`を基に特定する[[41](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)][[55](https://github.com/SakanaAI/edinet2dataset)]。
*   **実行頻度**: 毎日深夜に実行し、直近1週間に提出された書類をチェックする。

**CI/CDワークフロー (`.github/workflows/update-valuescope.yml`)**

```yaml
name: Update ValueScope Data

on:
  schedule:
    - cron: "0 1 * * *" # 毎日AM1:00 (UTC)に実行
  workflow_dispatch:

jobs:
  build-valuation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install requests pandas
      
      - name: Fetch and parse EDINET financials
        run: |
          python scripts/fetch_edinet_financials.py \
            --edinet-codes "${{ secrets.TEPCO_EDINET_CODE }},${{ secrets.CHUBU_EDINET_CODE }}" \
            --days-ago 7 \
            --output-dir "data/edinet_parsed"
        env:
          EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}

      - name: Build valuation metrics and scorecards
        run: |
          python scripts/build_valuation.py --input-dir "data/edinet_parsed" --output-file "data/valuation.json"
          python scripts/compute_scores.py --valuation-file "data/valuation.json" --targets-file "data/kpi_targets.json" --output-file "data/scorecards.json"

      - name: Commit and push if changed
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update ValueScope valuation data" && git push
```

---

### 4. FinSight — Financial Insights

![FinSightのイメージ[79]](https://finosight-analytics.co.jp/wp-content/uploads/2025/10/%E6%96%B0%E6%A9%9F%E8%83%BD%E6%8A%95%E7%A8%BF-11.jpg)

**目的**

企業の財務諸表（PL, BS, CF）を詳細に分析し、四半期および通期の業績推移、前年同期比での差異、財務健全性を可視化する。さらに、XBRLの注記情報からリスク要因や会計方針の変更を自動的に抽出し、潜在的な警告サインを提示する。

**機能要件**

*   **財務諸表ビューア**: PL, BS, CFをタブで切り替え表示。連結/単独の表示切替も可能。
*   **推移分析**: 売上高、営業利益、純利益などの主要項目の四半期推移を棒グラフで表示。
*   **前年同期比較**: 主要項目について、前年同期比（YoY）の増減率をハイライト表示。
*   **構成比分析**: BSの資産構成（流動/固定）、負債・純資産構成を円グラフで可視化。
*   **注記分析 (NLP)**:
    *   「事業等のリスク」注記から、キーワード（例：「訴訟」「規制強化」「燃料価格」）を基にリスク項目を抽出・ハイライト。
    *   「重要な会計方針」注記の前回提出分との差分を検出し、変更点を提示。

**データモデル**

*   `data/financials/TEPCO_pl_quarterly.csv`: 勘定科目ごとのPLデータ。
*   `data/financials/CHUBU_bs_annual.csv`: 勘定科目ごとのBSデータ。
*   `data/xbrl_notes.json`: 注記から抽出したリスク情報。

```json
// data/xbrl_notes.json
[
  {
    "company": "TEPCO",
    "period": "2025Q2",
    "docID": "S10XXXXX",
    "tag": "risk_litigation",
    "text": "当社グループは、原子力損害賠償に関する複数の訴訟を提起されております...",
    "severity": 0.8
  }
]
```

**EDINET API統合**

ValueScopeと同様に、EDINET API v2から有価証券報告書等のCSV ZIPを取得する[[36](https://zenn.dev/paradinight/articles/f4567f3728e4d2)][[52](https://qiita.com/hifistar/items/0114c6f60ded96785178)]。注記情報は、ZIP内に含まれるXBRL/HTMLファイルから直接パースする必要がある。`type=1`（提出本文（XBRL/HTML））の取得も検討する。

**CI/CDワークフロー (`.github/workflows/update-finsight.yml`)**

ValueScopeのワークフローをベースとし、`scripts/`内のスクリプトを`extract_financials.py`（財務データ抽出）、`compute_ratios.py`（財務比率計算）、`nlp_notes_risk.py`（注記NLP分析）に置き換えて実行する。

---

### 5. EnergyChain — JERA Contribution & Scenario

**目的**

JERAの親会社である東京電力と中部電力の**単独損益計算書（PL）**に計上される「受取配当金」の推移を追跡する。このデータをJERAの配当決議イベントと時系列で重ね合わせることで、JERAが親会社の収益に与える貢献度のトレンドを明確に可視化する。

**重要要件**

*   **データソース**: 親会社（東電・中電）の**単独PL**に記載された「受取配当金」の金額を**そのまま使用**する。出資比率などを用いた按分計算や調整は一切行わない。

**機能要件**

*   **貢献度トレンドグラフ**:
    *   各社の受取配当金を四半期ごとの棒グラフで表示。
    *   両社の合計額を折れ線グラフで重ねて表示。
*   **ウォーターフォールチャート**: 年間の受取配当金の増減要因を（仮説ベースで）示すウォーターフォールチャート。
*   **イベントマーカー**: JERAの配当が確定した日（親会社の有価証券報告書等で言及された日）をグラフ上にマーカーでプロットする。

**データモデル**

*   `data/contribution_trend.csv`: EDINETから抽出した受取配当金の時系列データ。

```csv
date,docID,company,dividends_received
2025-06-30,S10XXXXX,TEPCO,12345000000
2025-06-30,S10YYYYY,CHUBU,67890000000
```

**EDINET API統合**

*   **抽出ロジック**: `fetch_edinet_dividends.py`スクリプトは、EDINET APIから取得したCSV ZIPを解析し、**単独**PLのCSVファイルから「受取配当金」またはそのエイリアス（例：「受取配当金（四半期）」）の行を特定し、金額を抽出する。
*   **API仕様**: `documents.json`で`docTypeCode`が`120`（有報）または`140`（四半期報告書）の書類を対象とする[[59](https://note.com/python_beginner/n/n4c1bb83bee83)]。

**CI/CDワークフロー (`.github/workflows/update-energychain.yml`)**

```yaml
name: Update EnergyChain Data

on:
  schedule:
    - cron: "30 1 * * *" # 毎日AM1:30 (UTC)に実行
  workflow_dispatch:

jobs:
  fetch-dividends:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install requests pandas
      
      - name: Fetch and extract dividends from EDINET
        run: |
          python scripts/fetch_edinet_dividends.py \
            --edinet-codes "${{ secrets.TEPCO_EDINET_CODE }},${{ secrets.CHUBU_EDINET_CODE }}" \
            --output-file "data/contribution_trend.csv"
        env:
          EDINET_API_KEY: ${{ secrets.EDINET_API_KEY }}

      - name: Commit and push if changed
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/contribution_trend.csv
          git diff --staged --quiet || git commit -m "Update EnergyChain dividend data" && git push
```

---

### 6. PulseWatch — News & Alerts

![PulseWatchのイメージ[82]](https://media.withings.com/web/images/pulse-watch/heart_rate.jpg)

**目的**

東京電力、中部電力、JERAに関連する最新ニュースやプレスリリースをリアルタイムで収集・分析する。センチメント分析とタグ付けを行い、特にネガティブで重要度が高い「クリティカル」な情報を即座に特定し、バナー表示とGitHub Issueによる通知を行う。

**機能要件**

*   **ニュースフィード**: 収集したニュースをカード形式で一覧表示。各カードにはタイトル、要約、情報源、発行日時、センチメントスコア、関連タグ（例：「原子力」「再生可能エネルギー」「財務」）を表示。
*   **クリティカルアラートバナー**: センチメントスコアが閾値（例: -0.6）以下のニュースを、画面上部に常時表示されるアラートバナーで通知する。
*   **アラート履歴**: 発行されたクリティカルアラートを一覧で確認できるページ。
*   **自動通知**: クリティカルなニュースを検知した際、GitHubリポジトリに`critical-alert`ラベル付きのIssueを自動で起票する。

**データモデル**

*   `data/news.json`: 収集・分析済みのニュースデータ。
*   `data/alerts.json`: 発行されたアラートの履歴。

**外部サービス統合**

*   **ニュースソース**: ニュース取得元を定義する（例: Google News RSSフィード、特定のプレスリリースサイトのスクレイピング、NewsAPIなどの外部API）。`ingest_feeds.py`スクリプトでこれらのソースから情報を収集する。
*   **センチメント分析**: `sentiment_tagging.py`スクリプト内で、自然言語処理ライブラリ（例: `transformers`, `VADER`）または外部API（例: Google Cloud Natural Language API）を使用してセンチメントスコアとタグを付与する。

**CI/CDワークフロー (`.github/workflows/update-pulsewatch.yml`)**

```yaml
name: Update PulseWatch News Feed

on:
  schedule:
    - cron: "*/15 * * * *" # 15分ごとに実行
  workflow_dispatch:

jobs:
  ingest-and-analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt # requests, beautifulsoup4, transformers, etc.

      - name: Ingest and analyze news feeds
        id: analysis
        run: |
          python scripts/ingest_feeds.py --output-file data/news_raw.json
          python scripts/sentiment_tagging.py --input-file data/news_raw.json --output-file data/news.json
          python scripts/check_alerts.py --news-file data/news.json --alerts-file data/alerts.json --threshold -0.6
        
      - name: Create GitHub Issue for critical alerts
        if: steps.analysis.outputs.critical_alert_detected == 'true'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const { title, body } = require('./alert_payload.json');
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Critical Alert: ${title}`,
              body: body,
              labels: ['critical-alert']
            });

      - name: Commit and push if changed
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update PulseWatch news feed" && git push
```

1. [GitHub ActionsでCI/CDパイプラインを構築する方法](https://zenn.dev/utokyo_aido/articles/20250226-080332)
2. [今更ながらCDを学んでみた：GitHub Pages に自動デプロイ](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)
3. [Building a CI/CD Workflow with GitHub Actions](https://resources.github.com/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)
4. [GitHub Actions を使用した CI/CD ワークフローの構築](https://resources.github.com/ja/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)
5. [GitHub ActionsとGitHub Pagesを活用してCI/CDの設定を行っ ...](https://qiita.com/Kotabrog/items/19ef23a7a2aaf5d37fbb)
6. [CI/CD Pipeline to publish a web app to GitHub Pages using ...](https://medium.com/@prabhashi.mm/ci-cd-pipeline-to-publish-a-web-app-to-github-pages-using-github-actions-workflow-bf73de51facd)
7. [GitHub Actionsを使ったCI/CDの仕組みと基本設定からECR ...](https://qiita.com/free-honda/items/ca41b7b61193c801110e)
8. [大変なドキュメント作りを自動化しよう！GitHub Actionsによる ...](https://tech.niftylifestyle.co.jp/entry/1492)
9. [How to build a CI/CD pipeline with GitHub Actions in four ...](https://github.blog/enterprise-software/ci-cd/build-ci-cd-pipeline-github-actions-four-steps/)
10. [継続的インテグレーション - GitHub ドキュメント](https://docs.github.com/ja/actions/get-started/continuous-integration)
11. [GitHub を使用して CI/CD に環境をデプロイする - Azure](https://learn.microsoft.com/ja-jp/azure/deployment-environments/tutorial-deploy-environments-in-cicd-github)
12. [Could you please tell me how to set up CI/CD on GitHub?](https://github.com/orgs/community/discussions/172466)
13. [CI/CD の設定 | Docker Docs](https://matsuand.github.io/docker.docs-ja/guides/cpp/configure-ci-cd/)
14. [GitHub Actionsで自動化するCI/CDパイプライン](https://10-5.jp/blog-tenfive/4137/)
15. [How to Automate CI/CD with GitHub Actions and Streamline ...](https://www.freecodecamp.org/news/automate-cicd-with-github-actions-streamline-workflow/)
16. [GitHub ActionsでAWSへのCI/CDを実現！初心者向け ...](https://envader.plus/article/479)
17. [GitHub Actions でのワークフローの自動化およびデプロイ](https://resources.github.com/ja/learn/pathways/automation/essentials/automating-deploying-workflows-with-github-actions/)
18. [Introduction to GitHub Actions for CI/CD pipelines - Graphite](https://graphite.com/guides/introduction-to-github-actions-for-ci-cd-pipelines)
19. [GitHub ActionsとKinsta APIでCI/CDパイプラインを構築する方法](https://kinsta.com/jp/blog/how-to-setup-ci-cd-pipeline/)
20. [GitHub Pagesで静的サイトを構築する方法](https://kinsta.com/jp/blog/github-pages/)
21. [Implementing CI/CD pipeline with GitHub Actions, and GitHub ...](https://dev.to/efkumah/implementing-cicd-pipeline-with-github-actions-and-github-pages-in-a-react-app-ij9)
22. [CI/CDを実現するツール「GitHub Actions」を使ってみよう](https://thinkit.co.jp/article/23109)
23. [GitHub Pages + GitHub ActionsでCI/CDする - 青ポスの部屋](https://bluepost69.hatenablog.com/entry/20200913/1599972795)
24. [Continuous integration - GitHub Docs](https://docs.github.com/en/actions/get-started/continuous-integration)
25. [「GitHub CI/CD実践ガイド」を読んで、GitHub Actionsを始めよう](https://devops-blog.virtualtech.jp/entry/20240619/1718764468)
26. [React.JSアプリをGitHub PagesでCI/CDする - sgryjp.log](https://blog.sgry.jp/entry/2020/01/03/184130)
27. [CI/CD for GitHub Pages with GitHub Actions | Veerendra's Blog](https://veerendra2.github.io/ci-cd-github-pages-with-github-actions/)
28. [EDINET API関連資料](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0110.html)
29. [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
30. [第六节: Alpha Vantage API · 使用Python处理金融数据 - 鎏金天涯](https://maiernte.github.io/gitbook_python_finance/chapter1/alphavantage.html)
31. [Alpha Vantage | Postman API Network](https://www.postman.com/api-evangelist/alpha-vantage/api/a9b0e9b6-e072-41f7-ba3f-e0c2540dc7a3/version/15587e96-34c7-435a-b971-34b0180eeba3)
32. [system maintenance information - EDINET](https://disclosure2.edinet-fsa.go.jp/week0020.aspx)
33. [EDINET APIを利用して、企業情報（XBRLデータ）を自動で集め ...](https://qiita.com/XBRLJapan/items/27e623b8ca871740f352)
34. [Operation guides EDINET Guidelines (Japanese Only)](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WEEK0060.html)
35. [Alpha Vantage API を使用してみる](https://qiita.com/TaichiEndoh/items/7e152cc190efe12245a7)
36. [EDINETのAPI仕様書を読んでみたPart1](https://zenn.dev/paradinight/articles/f4567f3728e4d2)
37. [Alpha Vantage: Free Stock APIs in JSON & Excel](https://www.alphavantage.co/)
38. [深入解析Alpha Vantage API：实时金融数据的强大工具](https://blog.csdn.net/bhawfgrcbtwny/article/details/142280814)
39. [Alpha Vantage | Free Open API Spec Download](https://www.versori.com/open-api-spec-library/alpha-vantage)
40. [matthelmer/edinet-tools](https://github.com/matthelmer/edinet-api-tools)
41. [EDINETを使って金融ポートフォリオを作る](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)
42. [Global Filings API | Financial Filings](https://developer.factset.com/api-catalog/global-filings-api)
43. [【Python金融データ】AlphaVantageの使い方(第1回)](https://lifetechia.com/python-alphavantage-1/)
44. [EDINET](https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx)
45. [Alpha Vantage Premium API Key](https://www.alphavantage.co/premium/)
46. [实用指南：使用Alpha Vantage API快速获取金融数据](https://juejin.cn/post/7446366084326162444)
47. [Alpha Vantage Stock API - Economics](https://libguides.lib.cwu.edu/c.php?g=379550&p=9458908)
48. [Creating an AI Chatbot That Parses Financial Information](https://hackernoon.com/creating-an-ai-chatbot-that-parses-financial-information)
49. [【Python金融データ】EDINET APIの使い方(第2回)](https://lifetechia.com/edinet-api-2/)
50. [Administrative API Information Display - APIカタログ - e-Gov](https://api-catalog.e-gov.go.jp/info/en/apicatalog/view/33)
51. [PythonでAlpha Vantage APIを使って株価データを取得する方法](https://www.omi.me/ja/blogs/api-guides/how-to-fetch-stock-data-using-alpha-vantage-api-in-python?srsltid=AfmBOorpuO-y1F_5aG_p9Oj2j48639erTDIe6ZORlVSkiRVL9NUD56Rj)
52. [[EDINET] 上場企業の業績データをAPIで取得する](https://qiita.com/hifistar/items/0114c6f60ded96785178)
53. [Alpha Vantage Introduction Guide](https://algotrading101.com/learn/alpha-vantage-guide/)
54. [Alpha Vantage API密钥获取与金融数据调用实践_文心快码](https://comate.baidu.com/zh/page/nqxsx0vyl7i)
55. [edinet2dataset is a tool to construct financial dataset using ...](https://github.com/SakanaAI/edinet2dataset)
56. [【Python】EDINETのAPI v2を使って決算書類データを ...](https://note.com/python_lab/n/n510c3315b3f9)
57. [Share Buyback Status Data (TDnet/EDINET)](https://pro.jpx-jquants.com/datasets/12)
58. [金融データソース紹介：Alpha Vantage | System Trading Note](https://www.systrenote.com/alpha-vantage/)
59. [EDINET APIの分類コードを整理する｜イワシ銀行](https://note.com/python_beginner/n/n4c1bb83bee83)
60. [Customer Support](https://www.alphavantage.co/support/)
61. [利用Alpha Vantage API获取金融市场数据](https://blog.csdn.net/shuoac/article/details/146466317)
62. [edinet-python](https://pypi.org/project/edinet-python/0.1.13/)
63. [有価証券報告書の表質問応答を対象としたSIG-FIN](https://www.jstage.jst.go.jp/article/jsaisigtwo/2025/FIN-034/2025_13/_pdf)
64. [外部APIから株価データを取得するGPTsの作成方法｜IT navi](https://note.com/it_navi/n/n4e8d7d6437bf)
65. [HULFT Squareアプリケーション仕様書](https://www.hulft.com/download_file/20832)
66. [🚀 Unlocking the Power of Alpha Vantage: Your Guide to ...](https://medium.com/@b.antoine.se/unlocking-the-power-of-alpha-vantage-your-guide-to-financial-data-apis-10423580ce9f)
67. [Alpha Vantage | LangChain中文网](https://www.langchain.com.cn/docs/integrations/tools/alpha_vantage/)
68. [Part 1: Building Environments](https://medjedspace.com/Part1.html)
69. [PythonでFRED、Alpha Vantage、Binanceからデータを取得 ...](https://zenn.dev/relm/articles/e5880db75394ca)
70. [【Python金融データ】EDINET APIの使い方](https://lifetechia.com/edinet-api-1/)
71. [Welcome to alpha_vantage's documentation ...](https://alpha-vantage.readthedocs.io/en/latest/)
72. [Alpha Vantage MCP 服务器- 网页与API类 ...](https://mcps.live/server/alpha-vantage-mcp--6873)
73. [Complete API Reference | Cell Store Documentation v26.8.0](http://28msec.github.io/cellstore-pro/api-ref-queries.html)
74. [株価情報を簡単に取得できる。Python ALPHA VANTAGE API ...](https://rbelgblog.com/blog/2022/04/15/%E6%A0%AA%E4%BE%A1%E6%83%85%E5%A0%B1%E3%82%92%E7%B0%A1%E5%8D%98%E3%81%AB%E5%8F%96%E5%BE%97%E3%81%A7%E3%81%8D%E3%82%8B%E3%80%82python-alpha-vantage-api%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%A6%E3%81%BF/)
75. [書類閲覧利用環境』および『EDINET API仕様書（Version 2 ...](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0090_001.html)
76. [Alpha Vantage股票MACDEXT指标API接口介绍及对接](https://www.explinks.com/api/scd20240511673617eec9d1)
77. [Day 36. 用Python抓取股價](https://medium.com/%E7%92%BF%E7%9A%84%E7%AD%86%E8%A8%98%E6%9C%AC/day-36-%E7%94%A8python%E6%8A%93%E5%8F%96%E8%82%A1%E5%83%B9-5888b0cb9159)
78. [深入解析Alpha Vantage Python模块：股票与加密货币数据 ...](https://www.showapi.com/news/article/66ba0ee64ddd79f11a008648)
79. [[新機能リリース]米国企業データ搭載](https://finosight-analytics.co.jp/%E6%96%B0%E6%A9%9F%E8%83%BD%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E7%B1%B3%E5%9B%BD%E4%BC%81%E6%A5%AD%E3%83%87%E3%83%BC%E3%82%BF%E6%90%AD%E8%BC%89/)
80. [About - MarketVision](https://marketvision.com/about/)
81. [電力系のコンソーシアムチェーン「Energy Web Chain」の概要](https://hashhub-research.com/articles/2019-10-24-energy-web-chain-overview)
82. [Pulse Watch](https://www.withings.com/jp/ja/landing/pulse-watch?srsltid=AfmBOoozyQ6KUw0iRr082ekJByt37s1dXTBE_jEO29F3N9qfOzgguAxJ)
83. [生活者理解を一歩先へ導くリサーチエンジン「Perscope（ペル ...](https://www.valuesccg.com/news/20240924-8219/)
84. [経営企画向けERP GEN FINSIGHT SUITE](https://www.gen-square.com/finsight-suite/)
85. [MarketVision for Securities | Business](https://www.equifax.com/business/product/marketvision-securities/)
86. [About - Energy Chain](https://energychain.ca/about/)
87. [パルスウォッチ PMP200-G Plus X](https://www.souken-r.com/syouhin_web_annai/display_division_small.php?ClientId=1&LargeItemId=1&SmallItemId=221&rentaru=1&prev=rental)
88. [ヴァリューズがリサーチエンジン「Perscope」提供、生活者 ...](https://webtan.impress.co.jp/n/2024/09/27/47822)
89. [Insight Note](https://finsight-note.com/)
90. [Market Vision](https://www.keboola.com/components/export-data-from-market-vision)
91. [The Chain - Energy Chain](https://energychain.ca/the-chain/)
92. [パルスウォッチ2 PMP-200GplusX2 販売中 レンタル](https://www.imimed.co.jp/medical/product/sleep/pmp-200gplusx2/)
93. [Perscope｜生活者理解を一歩先へ導くリサーチエンジン](https://www.valuesccg.com/perscope/)
94. [[新機能リリース]企業リリースをAIがモニタリングしてお届け](https://finosight-analytics.co.jp/%E6%96%B0%E6%A9%9F%E8%83%BD%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E4%BC%81%E6%A5%AD%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E3%82%92ai%E3%81%8C%E3%83%A2%E3%83%8B%E3%82%BF%E3%83%AA%E3%83%B3%E3%82%B0/)
95. [MarketVision Research](https://www.mv-research.com/)
96. [エネルギーWebチェーン](https://blog.ueex.com/ja/%E6%9A%97%E5%8F%B7%E7%94%A8%E8%AA%9E/%E3%82%A8%E3%83%8D%E3%83%AB%E3%82%AE%E3%83%BC%E3%82%A6%E3%82%A7%E3%83%96%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3/)
97. [よくあるご質問 Pulse Watch MⅡ - 健康わくわくサイト](https://www.soily.co.jp/15341233315360)
98. [KANTOOL 工業用内視鏡 バリュー・スコープPro 自動水平 ...](https://www.orange-book.com/ja/c/products/index.html?itemCd=VSP3830S++++++++++++++++++++++2245)
99. [テキストアナリティクスの概要 - Gainsight Japanese ...](https://gainsight-ja.mindtouch.us/Gainsight_NXT_%E6%97%A5%E6%9C%AC/%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%A2%E3%83%8A%E3%83%AA%E3%83%86%E3%82%A3%E3%82%AF%E3%82%B9/%E6%A6%82%E8%A6%81/%E3%83%86%E3%82%AD%E3%82%B9%E3%83%88%E3%82%A2%E3%83%8A%E3%83%AA%E3%83%86%E3%82%A3%E3%82%AF%E3%82%B9%E3%81%AE%E6%A6%82%E8%A6%81)
100. [MarketVision: Home](https://mvculture.com/)
101. [エナジーチェーンwiki](https://www.igus.co.jp/energy-chain/wiki)
102. [8-5504-15 パルスオキシメーター(Pulse Watch)用フレックス ...](https://axel.as-1.co.jp/asone/d/8-5504-15/)
103. [63-9648-88 工業用内視鏡 バリュースコープ3 VS250A3 - AXEL](https://axel.as-1.co.jp/asone/d/63-9648-88/)
104. [FinSight: Towards Real-World Financial Deep Research](https://chatpaper.com/ja/paper/201276)
105. [Conference Details — Market Vision, Inc.](https://www.mktvsn.com/conference-details)
106. [Blockchain Applications | EnerChain](https://enerchain.in/blockchain-applications)
107. [パルスメディア IGPM01 | コロナ対策グッズの達人 コロタツ](https://i-goods.co.jp/covid/goods/pulse-media/)
108. [ネットスコープSSEの総経済効果 - misman 님의 블로그](https://misman.tistory.com/12)
109. [FINSIGHT: Financial Forecasting using Machine Learning ...](https://www.amazon.co.jp/FINSIGHT-Financial-Forecasting-AI-Powered-Transformation-ebook/dp/B0FLWHJMFJ)
110. [Advanced Analytics | Consumer Packaged Goods](https://www.mckinsey.com/industries/consumer-packaged-goods/how-we-help-clients/big-data-and-advanced-analytics)
111. [EnergyChain - Decentralized Energy Marketplace](https://energychain.site/)
112. [パルスオキシメータ TM-1111（Pulse Pro J） | 医療・健康](https://www.aandd.co.jp/products/medical/equipment/me-pulse_oximeter/tm1111/)
113. [qBotica - Orchestrator Asset Automation - RPA コンポーネント](https://marketplace.uipath.com/ja/listings/orchestrator-asset-automation?utm_source=internal&utm_medium=related&utm_campaign=uipathteam-orchestrator-release-activities&clickSource=Listings.Related&recId=4bf9eec2-24a6-45cd-9e9b-f70ec105c4fe)
114. [Finsight Headquarters Axis Mundi - Newyork-Architects](https://www.newyork-architects.com/ja/axis-mundi-new-york/project/finsight-headquarters)
115. [MarketVision Research - Greenbook Directory Listing](https://www.greenbook.org/company/MarketVision-Research)
116. [Energy Chain – Decentralized, Token Powered, Integrated](https://energychain.ca/)
117. [福祉用具詳細](https://www.techno-tais.jp/ServiceWelfareGoodsDetail.php?RowNo=0&YouguCode1=02114&YouguCode2=000001&ViewType=1)
118. [データインテリジェンス×マーケティングで価値創造をともに ...](https://www.valuesccg.com/)
119. [MarketVision](https://marketvision.com/)
120. [What Are Energy Chains - Twinkl Science Teaching Wiki](https://www.twinkl.jp/teaching-wiki/energy-chains)
121. [パルスオキシメーターとは？メリットや注意点・使い方・選び方 ...](https://tokyo-doctors.com/webdoctor/17437)
122. [CCC Intelligent Solutions Holdings マネジメント](https://simplywall.st/ja/stocks/us/software/nasdaq-ccc/ccc-intelligent-solutions-holdings/management)
123. [Market Vision in Web3: How Organizations Driving Radical ...](https://medium.com/@Bmgentile/market-vision-in-web3-how-organizations-driving-radical-innovation-succeed-part-1-2eed72fa9542)
124. [バリュー・スコープⅢ （φ30～100㎜）【代引き不可】](https://kantool-shop.jp/shop/g/g312011000000/)
125. [GitHub ActionsでCI/CDパイプラインを構築する方法](https://zenn.dev/utokyo_aido/articles/20250226-080332)
126. [今更ながらCDを学んでみた：GitHub Pages に自動デプロイ](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)
127. [Building a CI/CD Workflow with GitHub Actions](https://resources.github.com/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)
128. [GitHub Actions を使用した CI/CD ワークフローの構築](https://resources.github.com/ja/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)
129. [GitHub ActionsとGitHub Pagesを活用してCI/CDの設定を行っ ...](https://qiita.com/Kotabrog/items/19ef23a7a2aaf5d37fbb)
130. [CI/CD Pipeline to publish a web app to GitHub Pages ...](https://medium.com/@prabhashi.mm/ci-cd-pipeline-to-publish-a-web-app-to-github-pages-using-github-actions-workflow-bf73de51facd)
131. [GitHub Actionsを使ったCI/CDの仕組みと基本設定からECR ...](https://qiita.com/free-honda/items/ca41b7b61193c801110e)
132. [大変なドキュメント作りを自動化しよう！GitHub Actionsによる ...](https://tech.niftylifestyle.co.jp/entry/1492)
133. [How to build a CI/CD pipeline with GitHub Actions in four ...](https://github.blog/enterprise-software/ci-cd/build-ci-cd-pipeline-github-actions-four-steps/)
134. [継続的インテグレーション - GitHub ドキュメント](https://docs.github.com/ja/actions/get-started/continuous-integration)
135. [GitHub を使用して CI/CD に環境をデプロイする - Azure](https://learn.microsoft.com/ja-jp/azure/deployment-environments/tutorial-deploy-environments-in-cicd-github)
136. [Could you please tell me how to set up CI/CD on GitHub?](https://github.com/orgs/community/discussions/172466)
137. [CI/CD の設定 | Docker Docs](https://matsuand.github.io/docker.docs-ja/guides/cpp/configure-ci-cd/)
138. [GitHub Actionsで自動化するCI/CDパイプライン](https://10-5.jp/blog-tenfive/4137/)
139. [How to Automate CI/CD with GitHub Actions and ...](https://www.freecodecamp.org/news/automate-cicd-with-github-actions-streamline-workflow/)
140. [GitHub ActionsでAWSへのCI/CDを実現！初心者向け ...](https://envader.plus/article/479)
141. [GitHub Actions でのワークフローの自動化およびデプロイ](https://resources.github.com/ja/learn/pathways/automation/essentials/automating-deploying-workflows-with-github-actions/)
142. [Introduction to GitHub Actions for CI/CD pipelines - Graphite](https://graphite.com/guides/introduction-to-github-actions-for-ci-cd-pipelines)
143. [GitHub ActionsとKinsta APIでCI/CDパイプラインを構築する方法](https://kinsta.com/jp/blog/how-to-setup-ci-cd-pipeline/)
144. [GitHub Pagesで静的サイトを構築する方法](https://kinsta.com/jp/blog/github-pages/)
145. [Implementing CI/CD pipeline with GitHub Actions, and ...](https://dev.to/efkumah/implementing-cicd-pipeline-with-github-actions-and-github-pages-in-a-react-app-ij9)
146. [CI/CDを実現するツール「GitHub Actions」を使ってみよう](https://thinkit.co.jp/article/23109)
147. [GitHub Pages + GitHub ActionsでCI/CDする - 青ポスの部屋](https://bluepost69.hatenablog.com/entry/20200913/1599972795)
148. [Continuous integration](https://docs.github.com/en/actions/get-started/continuous-integration)
149. [「GitHub CI/CD実践ガイド」を読んで、GitHub Actionsを始めよう](https://devops-blog.virtualtech.jp/entry/20240619/1718764468)
150. [React.JSアプリをGitHub PagesでCI/CDする - sgryjp.log](https://blog.sgry.jp/entry/2020/01/03/184130)
151. [今更ながらCDを学んでみた：GitHub Pages に自動デプロイ](https://zenn.dev/tajicode/articles/bb5ec4e5b86b06)
152. [GitHub Actions を使用した CI/CD ワークフローの構築 | GitHub Resources - GitHub Resources](https://resources.github.com/ja/learn/pathways/automation/essentials/building-a-workflow-with-github-actions/)
153. [RustとWebAssemblyでWebサービスを作って、GitHub ActionsとGitHub Pagesを活用してCI/CDの設定を行ってみた #GitHubActions - Qiita](https://qiita.com/Kotabrog/items/19ef23a7a2aaf5d37fbb)
154. [EDINETからdocID（書類管理番号）を取得する（EDINET API ...](https://zenn.dev/robes/articles/f6dfcc5cfbbdb6)
155. [matthelmer/edinet-tools](https://github.com/matthelmer/edinet-api-tools)
156. [EDINETのAPI仕様書を読んでみたPart1](https://zenn.dev/paradinight/articles/f4567f3728e4d2)
157. [【Python】EDINETのAPI v2を使って決算書類データを ...](https://note.com/python_lab/n/n510c3315b3f9)
158. [Creating an AI Chatbot That Parses Financial Information](https://hackernoon.com/creating-an-ai-chatbot-that-parses-financial-information)
159. [【第1章】Python × EDINET API: 企業の財務情報を自動取得 ...](https://study-note.blog/chapter-1-python-edinet-api-financial-data/)
160. [[EDINET] 上場企業の業績データをAPIで取得する](https://qiita.com/hifistar/items/0114c6f60ded96785178)
161. [Complete API Reference | Cell Store Documentation v26.8.0](http://28msec.github.io/cellstore-pro/api-ref-queries.html)
162. [EDINET](https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx)
163. [EDINET API v2に登録して株式関連書類をGETしよう](https://kenpos.dev/edinet-api-v2%E3%81%AB%E7%99%BB%E9%8C%B2%E3%81%97%E3%81%A6%E6%A0%AA%E5%BC%8F%E9%96%A2%E9%80%A3%E6%9B%B8%E9%A1%9E%E3%82%92get%E3%81%97%E3%82%88%E3%81%86/)
164. [system maintenance information - EDINET](https://disclosure2.edinet-fsa.go.jp/week0020.aspx)
165. [EDINETのAPIを使用してみる](https://colab.research.google.com/github/nanjakorewa/kdm-notebooks/blob/main/finance/misc/edinet2.ipynb)
166. [edinet2dataset is a tool to construct financial dataset using ...](https://github.com/SakanaAI/edinet2dataset)
167. [EDINET API ver.2で企業情報を取得する](https://www.enlighton.co.jp/post/edinet-api-ver-2%E3%81%A7%E4%BC%81%E6%A5%AD%E6%83%85%E5%A0%B1%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B)
168. [Operation guides EDINET Guidelines (Japanese Only)](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WEEK0060.html)
169. [【Python金融データ】EDINET APIの使い方](https://lifetechia.com/edinet-api-1/)
170. [EDINET via API(v2)｜じゃけさん](https://note.com/jake_nagoya_mh/n/n0dac2b36ba60)
171. [EDINETを使って金融ポートフォリオを作る](https://zenn.dev/sre_holdings/articles/dc0909ad62429f)
172. [EDINET書類取得APIについて](https://time2log.com/ja/edinet/edinet%E6%9B%B8%E9%A1%9E%E5%8F%96%E5%BE%97api%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6/)
173. [EDINET](https://disclosure2.edinet-fsa.go.jp/WEEK0010.aspx)
174. [EDINET](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/WZEK0110.html)
175. [ESE140206.pdf](https://disclosure2dl.edinet-fsa.go.jp/guide/static/disclosure/download/ESE140206.pdf)
176. [Alpha Vantage API を使用してみる](https://qiita.com/TaichiEndoh/items/7e152cc190efe12245a7)
177. [Alpha Vantage API 키 발급 방법: 초보자도 쉽게 따라하는 가이드](https://secondlife.lol/ja/alpha-vantage-api-key-guide/)
178. [Customer Support](https://www.alphavantage.co/support/)
179. [Alpha Vantage Stock APIの使い方について助けて](https://www.reddit.com/r/learnpython/comments/1f2akvh/help_in_using_alpha_vantage_stock_api/?tl=ja)
180. [Batch Stock Quotes | Alpha Vantage](https://www.postman.com/api-evangelist/alpha-vantage/request/2c9bvfn/batch-stock-quotes)
181. [Pythonでリアルタイムな株価を取得する方法](https://qiita.com/Octoparse_Japan/items/785cf24a6b7509c3428a)
182. [株をやっている友人の一言から生まれた分析ツール開発](https://note.com/wabisuke94/n/nb9d3f380758f)
183. [外部APIから株価データを取得するGPTsの作成方法｜IT navi](https://note.com/it_navi/n/n4e8d7d6437bf)
184. [Is there an API where a person can get a batch request for ...](https://www.reddit.com/r/algotrading/comments/y4kbdn/is_there_an_api_where_a_person_can_get_a_batch/)
185. [Alpha Vantage Premium API Key](https://www.alphavantage.co/premium/)
186. [Yahoo が Yahoo Finance API を終了。これは、ほとんどの ...](https://www.reddit.com/r/finance/comments/7ad8ns/yahoo_kills_yahoo_finance_api_the_service_which/?tl=ja)
187. [株価情報を簡単に取得できる。Python ALPHA VANTAGE API ...](https://rbelgblog.com/blog/2022/04/15/%E6%A0%AA%E4%BE%A1%E6%83%85%E5%A0%B1%E3%82%92%E7%B0%A1%E5%8D%98%E3%81%AB%E5%8F%96%E5%BE%97%E3%81%A7%E3%81%8D%E3%82%8B%E3%80%82python-alpha-vantage-api%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%A6%E3%81%BF/)
188. [Batch Stock Requests from Alpha Vantage [#3014132]](https://www.drupal.org/project/stocks_api/issues/3014132)
189. [ウェブサイトで公開できる無料の株式市場APIってある？](https://www.reddit.com/r/webdev/comments/151zk8y/is_there_any_free_stock_market_api_that_allows/?tl=ja)
190. [【Python入門】プログラミングで自分だけの株価データを手に ...](https://blog.codecamp.jp/programming-python-stockprice)
191. [PythonでFRED、Alpha Vantage、Binanceからデータを取得 ...](https://zenn.dev/relm/articles/e5880db75394ca)
192. [AlphaVantage now supports batch quotes · Issue #77](https://github.com/finance-quote/finance-quote/issues/77)
193. [これが最強！Pythonで株価を取得する方法 - 猫の手も借りたい](https://tip-memo.com/2799/)
194. [Alpha Vantage - "daily API rate limit reached" shown every ...](https://stackoverflow.com/questions/79352540/alpha-vantage-daily-api-rate-limit-reached-shown-every-day)
195. [Pythonでドル円（為替）をALPHA VANTAGEで取得する方法](https://kingteru.com/698/)
196. [Alpha Vantage API Documentation](https://www.alphavantage.co/documentation/)
197. [生成AIと投資系APIとの連携②｜tana1440](https://note.com/tana1440/n/nd55643f8950a)
198. [Navigating the Challenges of Alpha Vantage API Call ...](https://apipark.com/technews/ekqZjDgp.html)
199. [【Python金融データ】AlphaVantageの使い方(第1回)](https://lifetechia.com/python-alphavantage-1/)
200. [json - Finance data on alphavantage](https://stackoverflow.com/questions/45778710/finance-data-on-alphavantage)
201. [Alpha Vantage API rate exceeded on free tier. #109153](https://github.com/home-assistant/core/issues/109153)
202. [Managing rate limiting rules | Trend Micro Service Central](https://docs.trendmicro.com/en-us/documentation/article/trend-vision-one-managing-rate-limiting-rules)
203. [AlphaVantage-MCP – 無料の Alpha Vantage API を通じて、 ...](https://www.reddit.com/r/mcp/comments/1ic9pqg/alphavantagemcp_a_model_context_protocol_mcp/?tl=ja)
204. [Top ETL Tools for Alpha Vantage Integration to follow](https://airbyte.com/top-etl-tools-for-sources/alpha-vantage)
205. [Pythonでリアルタイムな株価を取得する方法 - Octoparse](https://www.octoparse.jp/blog/get-real-time-stock-prices-by-python)
206. [Integrate the Alpha Vantage API with the Salesforce API](https://pipedream.com/apps/alpha-vantage/integrations/salesforce-rest-api)
207. [PythonのFX活用法 - キム日記](https://kimudiary.com/python/python-fx%E3%81%A7%E5%BD%B9%E7%AB%8B%E3%81%A4%E3%82%B3%E3%83%BC%E3%83%89/)
208. [A Robust Set Of Market Data APIs Over At Alpha Vantage](https://blog.axway.com/product-insights/amplify-platform/application-integration/robust-market-data-apis-alphavantage)
209. [cant make requests : Forums](https://www.pythonanywhere.com/forums/topic/34837/)