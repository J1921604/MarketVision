export interface PriceData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IndicatorData {
  date: string
  sma5?: number
  sma25?: number
  sma50?: number
  sma75?: number
  rsi14?: number
  macd?: number
  macd_signal?: number
  macd_hist?: number
  bb_upper?: number
  bb_middle?: number
  bb_lower?: number
}

export interface SMAData {
  date: string
  sma_5?: number
  sma_25?: number
  sma_50?: number
  sma_75?: number
}

export interface RSIData {
  date: string
  rsi?: number
}

export interface MACDData {
  date: string
  macd?: number
  signal?: number
  histogram?: number
}

export interface BollingerBandData {
  date: string
  upper?: number
  middle?: number
  lower?: number
}

export interface EventData {
  date: string
  symbol: string
  type: 'earnings' | 'ex-dividend' | 'other'
  label: string
}

export interface AlertData {
  timestamp: string
  symbol: string
  change_pct: number
  trigger: string
  close: number
}

export interface ChartData extends PriceData, IndicatorData {}

export type PeriodFilter = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'Custom'

export type Symbol = '9501.T' | '9502.T'
