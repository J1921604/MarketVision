#!/usr/bin/env python3
"""
MarketVision - Stock Price Data Fetcher
Stooq経由でpandas_datareaderを使用して株価データを取得
毎日JST17時に保存されていない日の株価のみ取得するロジック
"""

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    import pandas as pd
    from pandas_datareader import data as pdr
except ImportError:
    print("エラー: 必要なライブラリがインストールされていません")
    print("実行: pip install -r scripts/requirements.txt")
    sys.exit(1)


def get_existing_dates(csv_path: Path) -> set:
    """
    既存CSVファイルから保存済みの日付セットを取得
    
    Args:
        csv_path: CSVファイルのパス
        
    Returns:
        保存済み日付のセット（YYYY-MM-DD形式の文字列）
    """
    if not csv_path.exists():
        return set()
    
    try:
        # スキーマバージョン行をスキップして読み込み
        df = pd.read_csv(csv_path, comment='#')
        if 'Date' in df.columns:
            dates = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d').tolist()
            return set(dates)
        return set()
    except Exception as e:
        print(f"[WARNING] 既存ファイル読み込みエラー: {str(e)}")
        return set()


def fetch_stock_data(symbol: str, start_date: str, end_date: str, output_dir: Path, incremental: bool = True) -> bool:
    """
    指定された銘柄の株価データを取得してCSVに保存
    incrementalモード時は既存データと統合し、未保存の日付のみ取得
    
    Args:
        symbol: 銘柄コード (例: 9501.T)
        start_date: 開始日 (YYYY-MM-DD)
        end_date: 終了日 (YYYY-MM-DD)
        output_dir: 出力ディレクトリ
        incremental: 増分モード（既存データに追加）
        
    Returns:
        成功時True、失敗時False
    """
    try:
        # ファイル名を生成（9501.T.csv）
        filename = f"{symbol}.csv"
        output_path = output_dir / filename
        
        # 既存データの日付を取得
        existing_dates = get_existing_dates(output_path) if incremental else set()
        
        if existing_dates:
            print(f"[INFO] {symbol} の既存データ: {len(existing_dates)} 日分")
            # 最新の保存済み日付を確認
            latest_date = max(existing_dates)
            print(f"       最新保存日: {latest_date}")
        
        print(f"[INFO] {symbol} のデータを取得中...")
        print(f"       期間: {start_date} ～ {end_date}")
        print(f"       データソース: Stooq")
        
        # Stooqからデータ取得（pandas_datareader）
        # Stooqの銘柄コードフォーマット: 9501.JP (Tokyo), 9502.JP
        stooq_symbol = symbol.replace('.T', '.JP')
        print(f"       Stooq銘柄コード: {stooq_symbol}")
        
        df = pdr.DataReader(stooq_symbol, 'stooq', start_date, end_date)
        
        if df.empty:
            print(f"[WARNING] {symbol} のデータが取得できませんでした")
            return False
        
        # カラム名を小文字に統一
        df.columns = df.columns.str.lower()
        
        # インデックスをリセット（日付列を明示的に作成）
        df.reset_index(inplace=True)
        if 'date' in df.columns:
            df.rename(columns={'date': 'Date'}, inplace=True)
        else:
            df.rename(columns={df.columns[0]: 'Date'}, inplace=True)
        
        # カラム名を標準化
        column_mapping = {
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }
        df.rename(columns=column_mapping, inplace=True)
        
        # 必要なカラムのみ選択
        required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        df = df[required_columns]
        
        # 銘柄コード列を追加
        df['symbol'] = symbol
        
        # 日付を文字列に変換
        df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d')
        
        # 増分モード: 既存データと統合
        if incremental and existing_dates:
            # 新規データのみフィルタ
            new_df = df[~df['Date'].isin(existing_dates)]
            
            if new_df.empty:
                print(f"[INFO] {symbol} の新規データなし（既に最新）")
                return True
            
            print(f"[INFO] {symbol} の新規データ: {len(new_df)} 日分")
            
            # 既存データを読み込み
            existing_df = pd.read_csv(output_path, comment='#')
            
            # 新旧データを結合
            df = pd.concat([existing_df, new_df], ignore_index=True)
        
        # 日付でソート（昇順）
        df['Date'] = pd.to_datetime(df['Date'])
        df.sort_values('Date', inplace=True)
        df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')
        
        # 出力ディレクトリを作成
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # CSV保存（スキーマバージョン付き）
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('# schema_version: 1.0\n')
            df.to_csv(f, index=False)
        
        print(f"[SUCCESS] {len(df)} 行のデータを保存: {output_path}")
        if incremental and existing_dates:
            print(f"          新規追加: {len(df) - len(existing_dates)} 行")
        return True
        
    except Exception as e:
        print(f"[ERROR] {symbol} のデータ取得中にエラー: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(description='MarketVision株価データ取得スクリプト')
    parser.add_argument(
        '--symbols',
        type=str,
        default='9501.T,9502.T',
        help='取得する銘柄コード（カンマ区切り）'
    )
    parser.add_argument(
        '--years',
        type=int,
        default=10,
        help='過去何年分のデータを取得するか'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='data/price',
        help='出力ディレクトリ'
    )
    parser.add_argument(
        '--incremental',
        action='store_true',
        default=True,
        help='増分モード（既存データに追加、デフォルト: 有効）'
    )
    parser.add_argument(
        '--full',
        action='store_true',
        help='全データを再取得（既存データを上書き）'
    )
    
    args = parser.parse_args()
    
    # 増分モードの決定（--fullが指定されていない場合は増分モード）
    incremental = not args.full
    
    # 日付範囲を計算
    end_date = datetime.now()
    start_date = end_date - timedelta(days=args.years * 365)
    
    symbols = args.symbols.split(',')
    output_dir = Path(args.output)
    
    print("=" * 60)
    print("MarketVision - Stock Price Data Fetcher")
    print("=" * 60)
    print(f"銘柄数: {len(symbols)}")
    print(f"期間: {start_date.strftime('%Y-%m-%d')} ～ {end_date.strftime('%Y-%m-%d')}")
    print(f"出力先: {output_dir}")
    print(f"モード: {'増分（新規データのみ追加）' if incremental else '全体（既存データ上書き）'}")
    print("=" * 60)
    print()
    
    # 各銘柄のデータを取得
    success_count = 0
    for symbol in symbols:
        symbol = symbol.strip()
        if fetch_stock_data(
            symbol,
            start_date.strftime('%Y-%m-%d'),
            end_date.strftime('%Y-%m-%d'),
            output_dir,
            incremental
        ):
            success_count += 1
        print()
    
    # 結果サマリー
    print("=" * 60)
    print(f"完了: {success_count}/{len(symbols)} 銘柄のデータ取得に成功")
    print("=" * 60)
    
    sys.exit(0 if success_count == len(symbols) else 1)


if __name__ == '__main__':
    main()
