# Data Contracts: MarketVision

**Branch**: `feature/impl-001-MarketVision`  
**Date**: 2025-12-15  
**Phase**: 1 - 設計・契約

## 概要

本ドキュメントは、MarketVisionプロジェクトで使用するデータ契約（CSV/JSONスキーマ）を定義します。すべてのデータファイルは、これらの契約に準拠する必要があります。

---

## 1. 株価データ契約（PriceData）

### ファイル形式

- **形式**: CSV
- **パス**: `data/price/{symbol}.csv`（例: `data/price/9501.T.csv`）
- **エンコーディング**: UTF-8
- **区切り文字**: カンマ (`,`)
- **ヘッダー**: 必須

### スキーマ定義

```csv
# schema_version: 1.0.0
date,open,high,low,close,volume,symbol
```

| カラム | 型 | 必須 | 説明 | 制約 |
|--------|-----|------|------|------|
| `date` | `string` | ✅ | 日付（YYYY-MM-DD） | 有効なISO 8601日付、未来日NG |
| `open` | `number` | ✅ | 始値（円） | ≥ 0、小数点以下2桁 |
| `high` | `number` | ✅ | 高値（円） | ≥ open、≥ low、≥ close |
| `low` | `number` | ✅ | 安値（円） | ≤ open、≤ high、≤ close、≥ 0 |
| `close` | `number` | ✅ | 終値（円） | ≥ 0、小数点以下2桁 |
| `volume` | `number` | ✅ | 出来高（株） | ≥ 0、整数 |
| `symbol` | `string` | ✅ | 銘柄コード | `9501.T` または `9502.T` |

### サンプルデータ

```csv
# schema_version: 1.0.0
date,open,high,low,close,volume,symbol
2024-11-29,450.5,455.0,448.0,452.0,12500000,9501.T
2024-11-28,448.0,451.0,445.5,450.5,11800000,9501.T
2024-11-27,445.0,450.0,443.0,448.0,13200000,9501.T
```

### 検証ルール

1. **必須フィールド**: すべてのカラムが存在すること
2. **日付形式**: `YYYY-MM-DD`形式で、有効な日付であること
3. **価格整合性**: `high >= open`, `high >= low`, `high >= close`, `low <= open`, `low <= close`
4. **非負制約**: `open`, `high`, `low`, `close`, `volume` ≥ 0
5. **前日比制約**: `abs(close_pct_change)` ≤ 50%（異常値検出）
6. **銘柄コード**: `9501.T` または `9502.T` のみ

---

## 2. SMAデータ契約（SMAData）

### ファイル形式

- **形式**: CSV
- **パス**: `data/indicators/{symbol}_sma.csv`（例: `data/indicators/9501.T_sma.csv`）
- **エンコーディング**: UTF-8

### スキーマ定義

```csv
# schema_version: 1.0.0
date,sma_5,sma_25,sma_75,symbol
```

| カラム | 型 | 必須 | 説明 | 制約 |
|--------|-----|------|------|------|
| `date` | `string` | ✅ | 日付 | PriceDataと一致 |
| `sma_5` | `number \| null` | ❌ | 5日移動平均 | ≥ 0、最初の4日間はnull |
| `sma_25` | `number \| null` | ❌ | 25日移動平均 | ≥ 0、最初の24日間はnull |
| `sma_75` | `number \| null` | ❌ | 75日移動平均 | ≥ 0、最初の74日間はnull |
| `symbol` | `string` | ✅ | 銘柄コード | `9501.T` または `9502.T` |

### サンプルデータ

```csv
# schema_version: 1.0.0
date,sma_5,sma_25,sma_75,symbol
2024-11-29,452.0,450.2,445.8,9501.T
2024-11-28,450.5,449.8,445.5,9501.T
2024-11-27,448.3,449.5,445.2,9501.T
```

---

## 3. RSIデータ契約（RSIData）

### ファイル形式

- **形式**: CSV
- **パス**: `data/indicators/{symbol}_rsi.csv`

### スキーマ定義

```csv
# schema_version: 1.0.0
date,rsi,symbol
```

| カラム | 型 | 必須 | 説明 | 制約 |
|--------|-----|------|------|------|
| `date` | `string` | ✅ | 日付 | PriceDataと一致 |
| `rsi` | `number \| null` | ❌ | RSI（14日） | 0 ≤ rsi ≤ 100、最初の14日間はnull |
| `symbol` | `string` | ✅ | 銘柄コード | `9501.T` または `9502.T` |

### サンプルデータ

```csv
# schema_version: 1.0.0
date,rsi,symbol
2024-11-29,65.5,9501.T
2024-11-28,62.3,9501.T
2024-11-27,58.7,9501.T
```

---

## 4. MACDデータ契約（MACDData）

### ファイル形式

- **形式**: CSV
- **パス**: `data/indicators/{symbol}_macd.csv`

### スキーマ定義

```csv
# schema_version: 1.0.0
date,macd,macd_signal,macd_hist,symbol
```

| カラム | 型 | 必須 | 説明 | 制約 |
|--------|-----|------|------|------|
| `date` | `string` | ✅ | 日付 | PriceDataと一致 |
| `macd` | `number \| null` | ❌ | MACDライン | 最初の26日間はnull |
| `macd_signal` | `number \| null` | ❌ | シグナルライン | 最初の34日間はnull |
| `macd_hist` | `number \| null` | ❌ | ヒストグラム | `macd - macd_signal`、最初の34日間はnull |
| `symbol` | `string` | ✅ | 銘柄コード | `9501.T` または `9502.T` |

### サンプルデータ

```csv
# schema_version: 1.0.0
date,macd,macd_signal,macd_hist,symbol
2024-11-29,2.5,1.8,0.7,9501.T
2024-11-28,2.3,1.7,0.6,9501.T
2024-11-27,2.1,1.6,0.5,9501.T
```

---

## 5. ボリンジャーバンドデータ契約（BollingerBandData）

### ファイル形式

- **形式**: CSV
- **パス**: `data/indicators/{symbol}_bb.csv`

### スキーマ定義

```csv
# schema_version: 1.0.0
date,bb_upper,bb_middle,bb_lower,symbol
```

| カラム | 型 | 必須 | 説明 | 制約 |
|--------|-----|------|------|------|
| `date` | `string` | ✅ | 日付 | PriceDataと一致 |
| `bb_upper` | `number \| null` | ❌ | 上限バンド（+2σ） | ≥ bb_middle、最初の19日間はnull |
| `bb_middle` | `number \| null` | ❌ | 中央線（SMA20） | ≥ 0、最初の19日間はnull |
| `bb_lower` | `number \| null` | ❌ | 下限バンド（-2σ） | ≤ bb_middle、≥ 0、最初の19日間はnull |
| `symbol` | `string` | ✅ | 銘柄コード | `9501.T` または `9502.T` |

### サンプルデータ

```csv
# schema_version: 1.0.0
date,bb_upper,bb_middle,bb_lower,symbol
2024-11-29,460.0,452.0,444.0,9501.T
2024-11-28,458.5,450.5,442.5,9501.T
2024-11-27,457.0,449.0,441.0,9501.T
```

---

## 6. イベントデータ契約（EventData）

### ファイル形式

- **形式**: JSON
- **パス**: `data/events/corporate_events.json`
- **エンコーディング**: UTF-8

### JSONスキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["schema_version", "events"],
  "properties": {
    "schema_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["date", "symbol", "event_type", "label"],
        "properties": {
          "date": {
            "type": "string",
            "format": "date"
          },
          "symbol": {
            "type": "string",
            "enum": ["9501.T", "9502.T"]
          },
          "event_type": {
            "type": "string",
            "enum": ["earnings", "ex-dividend", "regulation", "news"]
          },
          "label": {
            "type": "string",
            "minLength": 1,
            "maxLength": 50
          },
          "description": {
            "type": "string",
            "maxLength": 500
          }
        }
      }
    }
  }
}
```

### サンプルデータ

```json
{
  "schema_version": "1.0.0",
  "events": [
    {
      "date": "2024-11-01",
      "symbol": "9501.T",
      "event_type": "earnings",
      "label": "Q2決算発表",
      "description": "2024年度第2四半期決算発表"
    },
    {
      "date": "2024-12-28",
      "symbol": "9501.T",
      "event_type": "ex-dividend",
      "label": "権利落ち日",
      "description": "年間配当金50円"
    },
    {
      "date": "2024-10-15",
      "symbol": "9502.T",
      "event_type": "regulation",
      "label": "電気料金改定",
      "description": "規制当局による料金改定承認"
    }
  ]
}
```

---

## 7. アラートデータ契約（AlertData）

### ファイル形式

- **形式**: JSON
- **パス**: `data/alerts.json`
- **エンコーディング**: UTF-8

### JSONスキーマ

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["schema_version", "alerts"],
  "properties": {
    "schema_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "alerts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["timestamp", "symbol", "pct_change", "close_price", "trigger_type"],
        "properties": {
          "timestamp": {
            "type": "string",
            "format": "date-time"
          },
          "symbol": {
            "type": "string",
            "enum": ["9501.T", "9502.T"]
          },
          "pct_change": {
            "type": "number",
            "minimum": -100,
            "maximum": 100
          },
          "close_price": {
            "type": "number",
            "minimum": 0
          },
          "trigger_type": {
            "type": "string",
            "enum": ["spike_up", "spike_down"]
          }
        }
      }
    }
  }
}
```

### サンプルデータ

```json
{
  "schema_version": "1.0.0",
  "alerts": [
    {
      "timestamp": "2024-11-29T09:00:00Z",
      "symbol": "9501.T",
      "pct_change": -5.2,
      "close_price": 452.0,
      "trigger_type": "spike_down"
    },
    {
      "timestamp": "2024-11-28T09:00:00Z",
      "symbol": "9502.T",
      "pct_change": 5.8,
      "close_price": 1250.0,
      "trigger_type": "spike_up"
    }
  ]
}
```

---

## 契約テスト

### Python検証スクリプト

```python
# scripts/validate_contracts.py
import pandas as pd
import json
from jsonschema import validate
from pathlib import Path

def validate_price_data(file_path):
    """株価データCSVの契約検証"""
    df = pd.read_csv(file_path, comment='#')
    
    # 必須カラム確認
    required = ['date', 'open', 'high', 'low', 'close', 'volume', 'symbol']
    assert all(col in df.columns for col in required), f"Missing columns in {file_path}"
    
    # 価格整合性
    assert (df['high'] >= df['open']).all(), "high < open violation"
    assert (df['high'] >= df['low']).all(), "high < low violation"
    assert (df['high'] >= df['close']).all(), "high < close violation"
    assert (df['low'] <= df['open']).all(), "low > open violation"
    assert (df['low'] <= df['close']).all(), "low > close violation"
    
    # 非負制約
    assert (df[['open', 'high', 'low', 'close', 'volume']] >= 0).all().all(), "Negative price/volume detected"
    
    # 銘柄コード
    assert df['symbol'].isin(['9501.T', '9502.T']).all(), "Invalid symbol code"
    
    print(f"✅ {file_path} - 契約準拠")

def validate_event_data(file_path):
    """イベントデータJSONの契約検証"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    schema = {
        "type": "object",
        "required": ["schema_version", "events"],
        "properties": {
            "schema_version": {"type": "string"},
            "events": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["date", "symbol", "event_type", "label"],
                    "properties": {
                        "date": {"type": "string"},
                        "symbol": {"type": "string", "enum": ["9501.T", "9502.T"]},
                        "event_type": {"type": "string", "enum": ["earnings", "ex-dividend", "regulation", "news"]},
                        "label": {"type": "string", "minLength": 1, "maxLength": 50},
                        "description": {"type": "string", "maxLength": 500}
                    }
                }
            }
        }
    }
    
    validate(instance=data, schema=schema)
    print(f"✅ {file_path} - 契約準拠")

if __name__ == "__main__":
    # 株価データ検証
    validate_price_data("data/price/9501.T.csv")
    validate_price_data("data/price/9502.T.csv")
    
    # イベントデータ検証
    validate_event_data("data/events/corporate_events.json")
    
    # アラートデータ検証
    validate_event_data("data/alerts.json")  # スキーマは同様
```

---

## 契約バージョン管理

| バージョン | 変更日 | 変更内容 | 互換性 |
|-----------|--------|---------|--------|
| 1.0.0 | 2025-12-15 | 初期契約定義 | - |

破壊的変更が発生した場合、メジャーバージョンを更新します（例: 2.0.0）。

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-15
