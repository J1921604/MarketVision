"""
データ検証スクリプト
株価データとテクニカル指標データの整合性・異常値を検証
"""

import pandas as pd
import numpy as np
import argparse
from pathlib import Path
import sys
import json

def validate_price_data(file_path):
    """株価データ（CSV）を検証
    
    検証項目:
    - 必須カラム存在確認
    - 価格整合性（high >= open, high >= low, high >= close, low <= open, low <= close）
    - 非負制約（すべての価格・出来高 >= 0）
    - 前日比制約（|変動率| <= 50%）
    - 銘柄コード確認（9501.T または 9502.T）
    
    Returns:
        (is_valid, errors): 検証成功フラグとエラーリスト
    """
    errors = []
    
    try:
        df = pd.read_csv(file_path, comment='#')
    except Exception as e:
        return False, [f"CSV読み込みエラー: {e}"]
    
    # 必須カラム確認
    required = ['date', 'open', 'high', 'low', 'close', 'volume']
    missing_cols = [col for col in required if col.lower() not in [c.lower() for c in df.columns]]
    if missing_cols:
        errors.append(f"必須カラム不足: {missing_cols}")
        return False, errors
    
    # カラム名を小文字に統一
    df.columns = df.columns.str.lower()
    
    # 価格整合性
    if not (df['high'] >= df['open']).all():
        errors.append("high < open の行が存在します")
    if not (df['high'] >= df['low']).all():
        errors.append("high < low の行が存在します")
    if not (df['high'] >= df['close']).all():
        errors.append("high < close の行が存在します")
    if not (df['low'] <= df['open']).all():
        errors.append("low > open の行が存在します")
    if not (df['low'] <= df['close']).all():
        errors.append("low > close の行が存在します")
    
    # 非負制約
    for col in ['open', 'high', 'low', 'close', 'volume']:
        if (df[col] < 0).any():
            errors.append(f"{col} に負の値が存在します")
    
    # 前日比制約（異常値検出）
    df = df.sort_values('date').reset_index(drop=True)
    df['pct_change'] = df['close'].pct_change()
    
    anomalies = df[df['pct_change'].abs() > 0.5]
    if len(anomalies) > 0:
        for idx, row in anomalies.iterrows():
            errors.append(f"異常な変動率: {row['date']} 変動率={row['pct_change']*100:.1f}%")
    
    # 銘柄コード確認
    if 'symbol' in df.columns:
        invalid_symbols = df[~df['symbol'].isin(['9501.T', '9502.T'])]
        if len(invalid_symbols) > 0:
            errors.append(f"無効な銘柄コード: {invalid_symbols['symbol'].unique().tolist()}")
    
    return len(errors) == 0, errors


def validate_indicator_data(file_path, indicator_type):
    """テクニカル指標データ（CSV）を検証
    
    Args:
        file_path: CSVファイルパス
        indicator_type: 'sma', 'rsi', 'macd', 'bb' のいずれか
    
    Returns:
        (is_valid, errors): 検証成功フラグとエラーリスト
    """
    errors = []
    
    try:
        df = pd.read_csv(file_path, comment='#')
    except Exception as e:
        return False, [f"CSV読み込みエラー: {e}"]
    
    # カラム名を小文字に統一
    df.columns = df.columns.str.lower()
    
    # 指標タイプ別の検証
    if indicator_type == 'sma':
        required = ['date', 'sma_5', 'sma_25', 'sma_75']
        for col in required:
            if col not in df.columns:
                errors.append(f"必須カラム不足: {col}")
        # SMAは非負
        for col in ['sma_5', 'sma_25', 'sma_75']:
            if col in df.columns and (df[col].dropna() < 0).any():
                errors.append(f"{col} に負の値が存在します")
    
    elif indicator_type == 'rsi':
        required = ['date', 'rsi']
        for col in required:
            if col not in df.columns:
                errors.append(f"必須カラム不足: {col}")
        # RSIは0～100
        if 'rsi' in df.columns:
            rsi_out_of_range = df[(df['rsi'] < 0) | (df['rsi'] > 100)].dropna(subset=['rsi'])
            if len(rsi_out_of_range) > 0:
                errors.append(f"RSIが範囲外（0～100）: {len(rsi_out_of_range)}行")
    
    elif indicator_type == 'macd':
        required = ['date', 'macd', 'macd_signal', 'macd_hist']
        for col in required:
            if col not in df.columns:
                errors.append(f"必須カラム不足: {col}")
        # MACDヒストグラム = MACD - シグナル
        if all(col in df.columns for col in ['macd', 'macd_signal', 'macd_hist']):
            df_clean = df.dropna(subset=['macd', 'macd_signal', 'macd_hist'])
            calculated_hist = df_clean['macd'] - df_clean['macd_signal']
            diff = (df_clean['macd_hist'] - calculated_hist).abs()
            if (diff > 0.01).any():
                errors.append("MACDヒストグラムの計算が不正確です")
    
    elif indicator_type == 'bb':
        required = ['date', 'bb_upper', 'bb_middle', 'bb_lower']
        for col in required:
            if col not in df.columns:
                errors.append(f"必須カラム不足: {col}")
        # ボリンジャーバンド: bb_upper >= bb_middle >= bb_lower
        if all(col in df.columns for col in required):
            df_clean = df.dropna(subset=['bb_upper', 'bb_middle', 'bb_lower'])
            if not (df_clean['bb_upper'] >= df_clean['bb_middle']).all():
                errors.append("bb_upper < bb_middle の行が存在します")
            if not (df_clean['bb_middle'] >= df_clean['bb_lower']).all():
                errors.append("bb_middle < bb_lower の行が存在します")
    
    return len(errors) == 0, errors


def main():
    parser = argparse.ArgumentParser(description='データ検証スクリプト')
    parser.add_argument('--symbols', type=str, default='9501.T,9502.T',
                        help='銘柄コード（カンマ区切り）')
    parser.add_argument('--price-dir', type=str, default='data/price',
                        help='株価CSVディレクトリ')
    parser.add_argument('--indicator-dir', type=str, default='data/indicators',
                        help='指標CSVディレクトリ')
    parser.add_argument('--output', type=str, default='data/validation_report.json',
                        help='検証レポート出力パス（JSON）')
    
    args = parser.parse_args()
    symbols = [s.strip() for s in args.symbols.split(',')]
    
    print(f"🔍 データ検証開始")
    print(f"対象銘柄: {symbols}\n")
    
    report = {
        'timestamp': pd.Timestamp.now().isoformat(),
        'results': []
    }
    
    total_errors = 0
    
    for symbol in symbols:
        print(f"--- {symbol} ---")
        
        # 株価データ検証
        price_file = Path(args.price_dir) / f"{symbol}.csv"
        if price_file.exists():
            is_valid, errors = validate_price_data(price_file)
            status = "✅ 正常" if is_valid else "❌ エラー"
            print(f"株価データ: {status}")
            if errors:
                for err in errors:
                    print(f"  - {err}")
                total_errors += len(errors)
            
            report['results'].append({
                'file': str(price_file),
                'type': 'price',
                'valid': is_valid,
                'errors': errors
            })
        else:
            print(f"株価データ: ⚠️  ファイル不存在 {price_file}")
            report['results'].append({
                'file': str(price_file),
                'type': 'price',
                'valid': False,
                'errors': ['ファイルが存在しません']
            })
            total_errors += 1
        
        # テクニカル指標検証
        indicators = {
            'sma': f"{symbol}_sma.csv",
            'rsi': f"{symbol}_rsi.csv",
            'macd': f"{symbol}_macd.csv",
            'bb': f"{symbol}_bb.csv"
        }
        
        for indicator_type, filename in indicators.items():
            indicator_file = Path(args.indicator_dir) / filename
            if indicator_file.exists():
                is_valid, errors = validate_indicator_data(indicator_file, indicator_type)
                status = "✅ 正常" if is_valid else "❌ エラー"
                print(f"{indicator_type.upper()}データ: {status}")
                if errors:
                    for err in errors:
                        print(f"  - {err}")
                    total_errors += len(errors)
                
                report['results'].append({
                    'file': str(indicator_file),
                    'type': indicator_type,
                    'valid': is_valid,
                    'errors': errors
                })
            else:
                print(f"{indicator_type.upper()}データ: ⚠️  ファイル不存在")
        
        print()
    
    # レポート出力
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"📄 検証レポート: {output_path}")
    print(f"総エラー数: {total_errors}")
    
    if total_errors > 0:
        print("❌ データ検証失敗")
        sys.exit(1)
    else:
        print("✅ すべてのデータが正常です")


if __name__ == "__main__":
    main()
