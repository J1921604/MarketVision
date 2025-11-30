import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import type { Symbol, PeriodFilter, PriceData, SMAData, RSIData, MACDData, BollingerBandData } from '../types';

interface MarketData {
  price: PriceData[];
  sma: SMAData[];
  rsi: RSIData[];
  macd: MACDData[];
  bb: BollingerBandData[];
}

interface UseMarketDataReturn {
  data: MarketData | null;
  loading: boolean;
  error: string | null;
  filteredData: MarketData | null;
}

/**
 * 株価データとテクニカル指標データを読み込むカスタムフック
 * 
 * @param symbol - 銘柄コード（'9501.T' または '9502.T'）
 * @param periodFilter - 期間フィルタ（'1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'Custom'）
 * @returns MarketData、ローディング状態、エラー
 */
export function useMarketData(symbol: Symbol, periodFilter: PeriodFilter = '1Y'): UseMarketDataReturn {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Viteのベースパス対応: import.meta.env.BASE_URL を使用
        const basePath = import.meta.env.BASE_URL || '/';
        
        // 並列で全CSVを読み込み
        const [priceRes, smaRes, rsiRes, macdRes, bbRes] = await Promise.all([
          fetch(`${basePath}data/price/${symbol}.csv`),
          fetch(`${basePath}data/indicators/${symbol}_sma.csv`),
          fetch(`${basePath}data/indicators/${symbol}_rsi.csv`),
          fetch(`${basePath}data/indicators/${symbol}_macd.csv`),
          fetch(`${basePath}data/indicators/${symbol}_bb.csv`),
        ]);

        // エラーチェック
        if (!priceRes.ok) throw new Error(`株価データの取得に失敗しました: ${priceRes.statusText}`);
        if (!smaRes.ok) throw new Error(`SMAデータの取得に失敗しました: ${smaRes.statusText}`);
        if (!rsiRes.ok) throw new Error(`RSIデータの取得に失敗しました: ${rsiRes.statusText}`);
        if (!macdRes.ok) throw new Error(`MACDデータの取得に失敗しました: ${macdRes.statusText}`);
        if (!bbRes.ok) throw new Error(`ボリンジャーバンドデータの取得に失敗しました: ${bbRes.statusText}`);

        // CSV → テキスト
        const [priceText, smaText, rsiText, macdText, bbText] = await Promise.all([
          priceRes.text(),
          smaRes.text(),
          rsiRes.text(),
          macdRes.text(),
          bbRes.text(),
        ]);

        // PapaParse でパース
        // 注意: CSVヘッダーが大文字始まり(Open, High...)の場合があるため、小文字に変換する処理が必要
        // ここではtransformHeaderオプションを使用して小文字に統一します
        const parseOptions = {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.toLowerCase(),
        };

        const priceData = parseCSV<PriceData>(priceText, parseOptions);
        const smaData = parseCSV<SMAData>(smaText, parseOptions);
        const rsiData = parseCSV<RSIData>(rsiText, parseOptions);
        const rawMacdData = parseCSV<any>(macdText, parseOptions);
        const bbData = parseCSV<BollingerBandData>(bbText, parseOptions);

        // MACDデータのカラム名をマッピング
        const macdData: MACDData[] = rawMacdData.map(item => ({
          date: item.date,
          macd: item.macd,
          signal: item.macd_signal,
          histogram: item.macd_hist,
        }));

        if (isMounted) {
          setData({
            price: priceData,
            sma: smaData,
            rsi: rsiData,
            macd: macdData,
            bb: bbData,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '不明なエラー');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // 期間フィルタリング
  const filteredData = useMemo(() => {
    if (!data) return null;

    const filterDate = getFilterDate(periodFilter);
    if (!filterDate) return data;

    return {
      price: data.price.filter(d => new Date(d.date) >= filterDate),
      sma: data.sma.filter(d => new Date(d.date) >= filterDate),
      rsi: data.rsi.filter(d => new Date(d.date) >= filterDate),
      macd: data.macd.filter(d => new Date(d.date) >= filterDate),
      bb: data.bb.filter(d => new Date(d.date) >= filterDate),
    };
  }, [data, periodFilter]);

  return { data, loading, error, filteredData };
}

/**
 * CSVテキストをパースして型付き配列に変換
 */
function parseCSV<T>(csvText: string, options: Papa.ParseConfig = {}): T[] {
  // コメント行（# schema_version:）を削除
  const lines = csvText.split('\n').filter(line => !line.startsWith('#'));
  const cleanedText = lines.join('\n');

  const result = Papa.parse<T>(cleanedText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    ...options
  });

  if (result.errors.length > 0) {
    console.error('CSV parsing errors:', result.errors);
  }

  return result.data;
}

/**
 * 期間フィルタから開始日付を計算
 */
export function getFilterDate(periodFilter: PeriodFilter, now: Date = new Date()): Date | null {
  const createUTCDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

  switch (periodFilter) {
    case '1M':
      return createUTCDate(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate());
    case '3M':
      return createUTCDate(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate());
    case '6M':
      return createUTCDate(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate());
    case '1Y':
      return createUTCDate(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate());
    case '3Y':
      return createUTCDate(now.getUTCFullYear() - 3, now.getUTCMonth(), now.getUTCDate());
    case '5Y':
      return createUTCDate(now.getUTCFullYear() - 5, now.getUTCMonth(), now.getUTCDate());
    case 'Custom':
      // カスタム期間は別途実装
      return null;
    default:
      return null;
  }
}
