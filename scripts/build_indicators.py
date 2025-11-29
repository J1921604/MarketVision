"""
テクニカル指標計算スクリプト
株価データ（CSV）からSMA、RSI、MACD、ボリンジャーバンドを計算してCSV出力
"""

import pandas as pd
import numpy as np
import argparse
from pathlib import Path
import sys

def calculate_sma(df, windows=[5, 25, 50, 75]):
    """移動平均線（SMA）を計算
    
    Args:
        df: 株価DataFrame（closeカラム必須）
        windows: ウィンドウサイズリスト（デフォルト: [5, 25, 50, 75]）
    
    Returns:
        SMAカラムを追加したDataFrame
    """
    for window in windows:
        df[f'sma_{window}'] = df['close'].rolling(window=window).mean()
    return df


def calculate_rsi(df, window=14):
    """RSI（相対力指数）を計算
    
    Args:
        df: 株価DataFrame（closeカラム必須）
        window: ウィンドウサイズ（デフォルト: 14）
    
    Returns:
        RSIカラムを追加したDataFrame
    """
    delta = df['close'].diff()
    
    # 上昇幅と下落幅を分離
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    
    # 平均上昇幅と平均下落幅
    avg_gain = gain.rolling(window=window).mean()
    avg_loss = loss.rolling(window=window).mean()
    
    # RS（相対力）とRSI計算
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    return df


def calculate_macd(df, fast=12, slow=26, signal=9):
    """MACD（移動平均収束拡散法）を計算
    
    Args:
        df: 株価DataFrame（closeカラム必須）
        fast: 短期EMAウィンドウ（デフォルト: 12）
        slow: 長期EMAウィンドウ（デフォルト: 26）
        signal: シグナルEMAウィンドウ（デフォルト: 9）
    
    Returns:
        MACD、シグナル、ヒストグラムカラムを追加したDataFrame
    """
    # 指数移動平均（EMA）
    ema_fast = df['close'].ewm(span=fast, adjust=False).mean()
    ema_slow = df['close'].ewm(span=slow, adjust=False).mean()
    
    # MACD = 短期EMA - 長期EMA
    df['macd'] = ema_fast - ema_slow
    
    # シグナル = MACDの9日EMA
    df['macd_signal'] = df['macd'].ewm(span=signal, adjust=False).mean()
    
    # ヒストグラム = MACD - シグナル
    df['macd_hist'] = df['macd'] - df['macd_signal']
    
    return df


def calculate_bollinger_bands(df, window=20, num_std=2):
    """ボリンジャーバンドを計算
    
    Args:
        df: 株価DataFrame（closeカラム必須）
        window: ウィンドウサイズ（デフォルト: 20）
        num_std: 標準偏差の倍数（デフォルト: 2）
    
    Returns:
        ボリンジャーバンド（上限、中央、下限）カラムを追加したDataFrame
    """
    # 中央線（SMA）
    df['bb_middle'] = df['close'].rolling(window=window).mean()
    
    # 標準偏差
    std = df['close'].rolling(window=window).std()
    
    # 上限・下限バンド
    df['bb_upper'] = df['bb_middle'] + (std * num_std)
    df['bb_lower'] = df['bb_middle'] - (std * num_std)
    
    return df


def process_symbol(symbol, input_dir, output_dir):
    """1銘柄のテクニカル指標を計算
    
    Args:
        symbol: 銘柄コード（例: '9501.T'）
        input_dir: 株価CSVディレクトリ
        output_dir: 出力ディレクトリ
    """
    # 株価データ読み込み
    input_file = Path(input_dir) / f"{symbol}.csv"
    if not input_file.exists():
        print(f"エラー: {input_file} が存在しません")
        return False
    
    # コメント行（# schema_version:）をスキップして読み込み
    df = pd.read_csv(input_file, comment='#')
    
    # カラム名を小文字に統一
    df.columns = df.columns.str.lower()
    
    # 必須カラム確認
    required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
    if not all(col in df.columns for col in required_cols):
        print(f"エラー: {symbol} に必須カラムがありません: {required_cols}")
        return False
    
    # 日付でソート
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    # テクニカル指標計算
    print(f"{symbol}: SMA計算中...")
    df = calculate_sma(df)
    
    print(f"{symbol}: RSI計算中...")
    df = calculate_rsi(df)
    
    print(f"{symbol}: MACD計算中...")
    df = calculate_macd(df)
    
    print(f"{symbol}: ボリンジャーバンド計算中...")
    df = calculate_bollinger_bands(df)
    
    # 出力ディレクトリ作成
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # SMA CSV出力
    sma_cols = ['date', 'sma_5', 'sma_25', 'sma_50', 'sma_75']
    sma_df = df[sma_cols].copy()
    sma_file = output_path / f"{symbol}_sma.csv"
    with open(sma_file, 'w', encoding='utf-8') as f:
        f.write("# schema_version: 1.0.0\n")
        sma_df.to_csv(f, index=False)
    print(f"✅ 保存: {sma_file}")
    
    # RSI CSV出力
    rsi_cols = ['date', 'rsi']
    rsi_df = df[rsi_cols].copy()
    rsi_file = output_path / f"{symbol}_rsi.csv"
    with open(rsi_file, 'w', encoding='utf-8') as f:
        f.write("# schema_version: 1.0.0\n")
        rsi_df.to_csv(f, index=False)
    print(f"✅ 保存: {rsi_file}")
    
    # MACD CSV出力
    macd_cols = ['date', 'macd', 'macd_signal', 'macd_hist']
    macd_df = df[macd_cols].copy()
    macd_file = output_path / f"{symbol}_macd.csv"
    with open(macd_file, 'w', encoding='utf-8') as f:
        f.write("# schema_version: 1.0.0\n")
        macd_df.to_csv(f, index=False)
    print(f"✅ 保存: {macd_file}")
    
    # ボリンジャーバンド CSV出力
    bb_cols = ['date', 'bb_upper', 'bb_middle', 'bb_lower']
    bb_df = df[bb_cols].copy()
    bb_file = output_path / f"{symbol}_bb.csv"
    with open(bb_file, 'w', encoding='utf-8') as f:
        f.write("# schema_version: 1.0.0\n")
        bb_df.to_csv(f, index=False)
    print(f"✅ 保存: {bb_file}")
    
    return True


def main():
    parser = argparse.ArgumentParser(description='テクニカル指標計算スクリプト')
    parser.add_argument('--symbols', type=str, default='9501.T,9502.T',
                        help='銘柄コード（カンマ区切り）')
    parser.add_argument('--input', type=str, default='data/price',
                        help='株価CSVディレクトリ')
    parser.add_argument('--output', type=str, default='data/indicators',
                        help='指標CSV出力ディレクトリ')
    
    args = parser.parse_args()
    symbols = [s.strip() for s in args.symbols.split(',')]
    
    print(f"📊 テクニカル指標計算開始")
    print(f"対象銘柄: {symbols}")
    print(f"入力: {args.input}")
    print(f"出力: {args.output}\n")
    
    success_count = 0
    for symbol in symbols:
        print(f"--- {symbol} ---")
        if process_symbol(symbol, args.input, args.output):
            success_count += 1
        print()
    
    print(f"✅ 完了: {success_count}/{len(symbols)} 銘柄")
    if success_count < len(symbols):
        sys.exit(1)


if __name__ == "__main__":
    main()
