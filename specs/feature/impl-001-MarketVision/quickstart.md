# Quickstart: MarketVision

**Branch**: `feature/impl-001-MarketVision`  
**Date**: 2025-12-15  
**Phase**: 1 - 設計・契約

## 🚀 5分でMarketVisionを起動する

このガイドは、MarketVisionを最速で起動するためのクイックスタートです。

---

## 前提条件

以下がインストールされていることを確認してください：

- **Node.js 20.x** 以上（[ダウンロード](https://nodejs.org/)）
- **Python 3.11** 以上（[ダウンロード](https://www.python.org/)）
- **PowerShell 5.1** 以上（Windows標準）
- **Git**（[ダウンロード](https://git-scm.com/)）

---

## 手順1: リポジトリのクローン

```powershell
git clone https://github.com/J1921604/MarketVision.git
cd MarketVision
```

---

## 手順2: 依存関係インストールとデータ準備

```powershell
# フロントエンド依存関係のインストール
npm install

# Python依存関係のインストール
pip install -r scripts/requirements.txt

# 株価データの取得（初回のみ、public/data/price/に保存）
python scripts/fetch_price_data.py --symbols "9501.T,9502.T" --output public/data/price

# テクニカル指標の計算（初回のみ、public/data/indicators/に保存）
python scripts/build_indicators.py --symbols "9501.T,9502.T" --input public/data/price --output public/data/indicators

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

---

## 手順3: 動作確認

### ✅ チェックリスト

1. **株価チャート表示**:
   - 東京電力HD（9501.T）のローソク足チャートが表示される
   - 銘柄選択ボタンで中部電力（9502.T）に切り替えられる

2. **期間フィルタ**:
   - 1M/3M/6M/1Y/3Y/5Y ボタンをクリックして期間を切り替えられる
   - チャートが200ms以内に再描画される

3. **テクニカル指標**:
   - SMA（5/25/75日）チェックボックスで移動平均線が表示される
   - RSI、MACD、ボリンジャーバンドパネルが表示される

### 📊 サンプルデータ

初回起動時、サンプルデータ（過去1年分）が自動的にロードされます。

実データを取得するには：

```powershell
python scripts/fetch_price_data.py
```

---

## トラブルシューティング

### 問題1: `npm install` でエラーが発生する

**原因**: Node.jsバージョンが古い

**解決**:
```powershell
node --version  # 20.x以上を確認
```

20.x未満の場合、[Node.js公式サイト](https://nodejs.org/)から最新版をダウンロードしてください。

---

### 問題2: `python` コマンドが見つからない

**原因**: Pythonがインストールされていない、またはPATHが通っていない

**解決**:
```powershell
python --version  # 3.11以上を確認
```

PATHが通っていない場合：
1. Windows設定 → システム → バージョン情報 → システムの詳細設定
2. 環境変数 → Path → 編集
3. Pythonのインストールパス（例: `C:\Python311\`）を追加

---

### 問題3: ポート5173が使用中

**原因**: 別のプロセスがポート5173を使用している

**解決**:
```powershell
# ポートを使用しているプロセスを確認
netstat -ano | findstr :5173

# プロセスを終了（PIDは上記コマンドで確認）
taskkill /PID <PID> /F

# または、Viteの設定を変更してポートを変更
# vite.config.ts の server.port を 5174 に変更
```

---

### 問題4: データ取得エラー

**原因**: Stooq APIの一時的な障害、またはネットワークエラー

**解決**:
```powershell
# リトライ（最大3回）
python scripts/fetch_price_data.py --symbols "9501.T,9502.T" --years 10
```

3回失敗する場合、GitHub Issueを確認してください。

---

## 次のステップ

### 📚 ドキュメントを読む

- **[README.md](https://github.com/J1921604/MarketVision/blob/main/README.md)**: プロジェクト概要、技術スタック
- **[spec.md](https://github.com/J1921604/MarketVision/blob/main/specs/001-MarketVision/spec.md)**: 機能仕様書
- **[plan.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/plan.md)**: 実装計画書
- **[data-model.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/data-model.md)**: データモデル定義
- **[contracts/](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/contracts/README.md)**: データ契約（CSV/JSONスキーマ）

### 🛠️ 開発に参加する

1. **ブランチ戦略を確認する**:
   ```powershell
   git checkout -b feature/impl-001-<your-feature>
   ```

2. **テストを実行する**:
   ```powershell
   # ユニットテスト
   npm run test
   
   # E2Eテスト
   npm run test:e2e
   ```

3. **コミットメッセージ規約に従う**:
   ```
   feat: 新機能の追加
   fix: バグ修正
   docs: ドキュメント更新
   ```

詳細は [.github/copilot-commit-message-instructions.md](https://github.com/J1921604/MarketVision/blob/main/.github/copilot-commit-message-instructions.md) を参照してください。

---

## 本番デプロイ

### GitHub Pagesへの自動デプロイ

`main`ブランチにpushすると、GitHub Actionsが自動的にビルド・デプロイします。

```powershell
# 実装ブランチで作業
git add .
git commit -m "feat: 新機能の実装"
git push origin feature/impl-001-MarketVision

# プルリクエスト作成後、mainにマージするとデプロイ
```

デプロイ後、https://j1921604.github.io/MarketVision/ でアクセスできます。

### 手動ビルド

```powershell
# ビルド
npm run build

# プレビュー
npm run preview
```

`dist/`フォルダに静的ファイルが生成されます。

---

## よくある質問（FAQ）

### Q1: データ更新の頻度は？

**A**: GitHub Actionsで6時間ごとに自動更新されます。手動更新も可能です：

```powershell
python scripts/fetch_price_data.py
```

### Q2: テクニカル指標の計算方法は？

**A**: pandas/numpyで標準的な計算方法を使用しています。詳細は [research.md](https://github.com/J1921604/MarketVision/blob/main/specs/feature/impl-001-MarketVision/research.md) を参照してください。

### Q3: カスタム期間を設定できる？

**A**: 現在は1M/3M/6M/1Y/3Y/5Yの固定期間のみです。カスタム期間機能は将来のバージョンで追加予定です。

### Q4: 他の銘柄を追加できる？

**A**: 現在は9501.T（東京電力HD）と9502.T（中部電力）のみです。他の銘柄を追加するには、`scripts/fetch_price_data.py`の`--symbols`引数を変更してください。

---

## サポート

問題が発生した場合、以下の手順で報告してください：

1. **GitHub Issues**: https://github.com/J1921604/MarketVision/issues
2. **エラーログ**: ブラウザの開発者ツール（F12）でコンソールログを確認
3. **環境情報**: Node.jsバージョン、Pythonバージョン、OSバージョン

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-15
