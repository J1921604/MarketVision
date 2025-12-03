import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Customized,
} from 'recharts';
import type { PriceData, SMAData, BollingerBandData } from '../types';

interface ChartCanvasProps {
  priceData: PriceData[];
  smaData: SMAData[];
  bbData: BollingerBandData[];
  showSMA5?: boolean;
  showSMA25?: boolean;
  showSMA50?: boolean;
  showSMA75?: boolean;
  showBB?: boolean;
}

interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma5?: number;
  sma25?: number;
  sma50?: number;
  sma75?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
}

/**
 * ローソク足チャートと移動平均線を表示するコンポーネント
 */
export function ChartCanvas({
  priceData,
  smaData,
  bbData,
  showSMA5 = true,
  showSMA25 = true,
  showSMA50 = false,
  showSMA75 = false,
  showBB = false,
}: ChartCanvasProps) {
  // 価格データ、SMAデータ、BBデータを結合
  const chartData = useMemo(() => {
    const smaMap = new Map(smaData.map(d => [d.date, d]));
    const bbMap = new Map(bbData.map(d => [d.date, d]));

    return priceData.map(price => {
      const sma = smaMap.get(price.date);
      const bb = bbMap.get(price.date);
      const point: ChartDataPoint = {
        date: price.date,
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume,
      };

      if (sma) {
        point.sma5 = sma.sma_5;
        point.sma25 = sma.sma_25;
        point.sma50 = sma.sma_50;
        point.sma75 = sma.sma_75;
      }

      if (bb) {
        const upper = (bb as any).bb_upper ?? bb.upper;
        const middle = (bb as any).bb_middle ?? bb.middle;
        const lower = (bb as any).bb_lower ?? bb.lower;
        point.bb_upper = typeof upper === 'number' ? upper : undefined;
        point.bb_middle = typeof middle === 'number' ? middle : undefined;
        point.bb_lower = typeof lower === 'number' ? lower : undefined;
      }

      return point;
    });
  }, [priceData, smaData, bbData]);

  // 日付フォーマット（YYYY-MM-DD → MM/DD）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 価格フォーマット（整数、カンマ区切り）
  const formatPrice = (value: number) => {
    return `¥${Math.round(value).toLocaleString('ja-JP')}`;
  };

  // 出来高フォーマット（百万株単位）
  const formatVolume = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="w-full h-full">
      {/* 株価チャート */}
      <ResponsiveContainer width="100%" height="70%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            scale="band"
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            yAxisId="price"
            domain={['auto', 'auto']}
            tickFormatter={formatPrice}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}/>
          <Customized
            component={<CandlestickLayer data={chartData} />}
          />
          <Customized
            component={<SMALayer data={chartData} showSMA5={showSMA5} showSMA25={showSMA25} showSMA50={showSMA50} showSMA75={showSMA75} showBB={showBB} />}
          />
          {/* Y軸のスケール計算用ダミーライン（非表示） */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke="transparent"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
            tooltipType="none"
          />
          {/* ツールチップとLegend用のダミーライン */}
          {showBB && (
            <>
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                stroke="transparent"
                dot={false}
                strokeWidth={0}
                name="BB上限"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_middle"
                stroke="transparent"
                dot={false}
                strokeWidth={0}
                name="BB中央"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="transparent"
                dot={false}
                strokeWidth={0}
                name="BB下限"
              />
            </>
          )}
          {showSMA5 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="sma5"
              stroke="transparent"
              dot={false}
              strokeWidth={0}
              name="SMA5"
            />
          )}
          {showSMA25 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="sma25"
              stroke="transparent"
              dot={false}
              strokeWidth={0}
              name="SMA25"
            />
          )}
          {showSMA50 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="sma50"
              stroke="transparent"
              dot={false}
              strokeWidth={0}
              name="SMA50"
            />
          )}
          {showSMA75 && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="sma75"
              stroke="transparent"
              dot={false}
              strokeWidth={0}
              name="SMA75"
            />
          )}
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const data = payload[0].payload as ChartDataPoint;
              return (
                <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '4px' }}>
                  <p style={{ color: '#f3f4f6', margin: '0 0 8px 0', fontWeight: 'bold' }}>{formatDate(label)}</p>
                  <p style={{ color: '#f3f4f6', margin: '4px 0' }}>始値: {formatPrice(data.open)}</p>
                  <p style={{ color: '#f3f4f6', margin: '4px 0' }}>高値: {formatPrice(data.high)}</p>
                  <p style={{ color: '#f3f4f6', margin: '4px 0' }}>安値: {formatPrice(data.low)}</p>
                  <p style={{ color: '#f3f4f6', margin: '4px 0' }}>終値: {formatPrice(data.close)}</p>
                  {showSMA5 && data.sma5 && <p style={{ color: '#3b82f6', margin: '4px 0' }}>SMA5: {formatPrice(data.sma5)}</p>}
                  {showSMA25 && data.sma25 && <p style={{ color: '#f59e0b', margin: '4px 0' }}>SMA25: {formatPrice(data.sma25)}</p>}
                  {showSMA50 && data.sma50 && <p style={{ color: '#10b981', margin: '4px 0' }}>SMA50: {formatPrice(data.sma50)}</p>}
                  {showSMA75 && data.sma75 && <p style={{ color: '#8b5cf6', margin: '4px 0' }}>SMA75: {formatPrice(data.sma75)}</p>}
                  {showBB && data.bb_upper && <p style={{ color: '#facc15', margin: '4px 0' }}>BB上限: {formatPrice(data.bb_upper)}</p>}
                  {showBB && data.bb_middle && <p style={{ color: '#facc15', margin: '4px 0' }}>BB中央: {formatPrice(data.bb_middle)}</p>}
                  {showBB && data.bb_lower && <p style={{ color: '#facc15', margin: '4px 0' }}>BB下限: {formatPrice(data.bb_lower)}</p>}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ color: '#f3f4f6' }} />

        </ComposedChart>
      </ResponsiveContainer>

      {/* 出来高チャート */}
      <ResponsiveContainer width="100%" height="30%">
        <ComposedChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            scale="band"
            padding={{ left: 10, right: 10 }}
          />
          <YAxis
            tickFormatter={formatVolume}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value: number) => [formatVolume(value), '出来高']}
            labelFormatter={formatDate}
          />
          <Bar
            dataKey="volume"
            fill="#6366f1"
            opacity={0.7}
            name="出来高"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const CandlestickLayer = (props: any) => {
  const {
    xAxisMap = {},
    yAxisMap = {},
    offset = { left: 0, top: 0, width: 0 },
    formattedGraphicalItems = [],
    data: providedData,
    chartData,
  } = props;

  const xAxisKey = Object.keys(xAxisMap)[0];
  const xAxis = xAxisKey ? xAxisMap[xAxisKey] : undefined;
  const yAxis = yAxisMap['price'] ?? yAxisMap[Object.keys(yAxisMap)[0]];
  const data = providedData ?? chartData ?? formattedGraphicalItems[0]?.props?.data ?? [];

  if (!xAxis || !yAxis) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  if (typeof xScale !== 'function' || typeof yScale !== 'function') {
    return null;
  }
  const rawBandSize = typeof xAxis.bandSize === 'number' ? xAxis.bandSize : undefined;
  const scaleBandSize = typeof xScale?.bandwidth === 'function' ? xScale.bandwidth() : undefined;
  const bandSize = rawBandSize ?? scaleBandSize ?? 8;

  return (
    <g className="candlesticks">
      {data.map((entry: ChartDataPoint, index: number) => {
        const rawX = xScale(entry.date);
        if (rawX == null) return null;

        // band scaleのbandwidthを取得
        const bandwidth = typeof xScale?.bandwidth === 'function' ? xScale.bandwidth() : bandSize;
        
        // rawXはバンドの開始位置、bandwidth/2で中央
        const bandCenterX = rawX + bandwidth / 2;
        const candleWidth = Math.min(12, bandwidth * 0.7);
        
        const rectX = bandCenterX - candleWidth / 2;

        const highY = yScale(entry.high) + offset.top;
        const lowY = yScale(entry.low) + offset.top;
        const openY = yScale(entry.open) + offset.top;
        const closeY = yScale(entry.close) + offset.top;
        const bodyY = Math.min(openY, closeY);
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        const candleColor = entry.close >= entry.open ? '#10b981' : '#ef4444';

        return (
          <g key={`candle-${entry.date}-${index}`}>
            <line
              x1={bandCenterX}
              x2={bandCenterX}
              y1={highY}
              y2={lowY}
              stroke={candleColor}
              strokeWidth={1}
            />
            <rect
              x={rectX}
              y={bodyY}
              width={candleWidth}
              height={bodyHeight}
              fill={candleColor}
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
};

const SMALayer = (props: any) => {
  const {
    xAxisMap = {},
    yAxisMap = {},
    offset = { left: 0, top: 0, width: 0, height: 0 },
    formattedGraphicalItems = [],
    data: providedData,
    chartData,
    showSMA5,
    showSMA25,
    showSMA50,
    showSMA75,
    showBB,
  } = props;

  const xAxisKey = Object.keys(xAxisMap)[0];
  const xAxis = xAxisKey ? xAxisMap[xAxisKey] : undefined;
  const yAxis = yAxisMap['price'] ?? yAxisMap[Object.keys(yAxisMap)[0]];
  const data = providedData ?? chartData ?? formattedGraphicalItems[0]?.props?.data ?? [];

  if (!xAxis || !yAxis) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  if (typeof xScale !== 'function' || typeof yScale !== 'function') {
    return null;
  }

  const rawBandSize = typeof xAxis.bandSize === 'number' ? xAxis.bandSize : undefined;
  const scaleBandSize = typeof xScale?.bandwidth === 'function' ? xScale.bandwidth() : undefined;
  const bandSize = rawBandSize ?? scaleBandSize ?? 8;

  // 各ラインのパスを生成
  const createLinePath = (dataKey: string) => {
    const points: string[] = [];
    data.forEach((entry: ChartDataPoint, index: number) => {
      const value = (entry as any)[dataKey];
      if (value == null) return;

      const rawX = xScale(entry.date);
      if (rawX == null) return;

      const bandwidth = typeof xScale?.bandwidth === 'function' ? xScale.bandwidth() : bandSize;
      // オフセットなし（中央配置）
      const x = rawX + bandwidth / 2;
      const y = yScale(value) + offset.top;

      points.push(index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    });
    return points.join(' ');
  };

  return (
    <g className="sma-lines">
      {/* ボリンジャーバンド */}
      {showBB && (
        <>
          <path
            d={createLinePath('bb_upper')}
            stroke="#facc15"
            strokeWidth={1}
            strokeDasharray="3 3"
            fill="none"
          />
          <path
            d={createLinePath('bb_middle')}
            stroke="#facc15"
            strokeWidth={1}
            fill="none"
          />
          <path
            d={createLinePath('bb_lower')}
            stroke="#facc15"
            strokeWidth={1}
            strokeDasharray="3 3"
            fill="none"
          />
        </>
      )}
      {/* SMA5 */}
      {showSMA5 && (
        <path
          d={createLinePath('sma5')}
          stroke="#3b82f6"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {/* SMA25 */}
      {showSMA25 && (
        <path
          d={createLinePath('sma25')}
          stroke="#f59e0b"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {/* SMA50 */}
      {showSMA50 && (
        <path
          d={createLinePath('sma50')}
          stroke="#10b981"
          strokeWidth={1.5}
          fill="none"
        />
      )}
      {/* SMA75 */}
      {showSMA75 && (
        <path
          d={createLinePath('sma75')}
          stroke="#8b5cf6"
          strokeWidth={1.5}
          fill="none"
        />
      )}
    </g>
  );
};

export default ChartCanvas;


