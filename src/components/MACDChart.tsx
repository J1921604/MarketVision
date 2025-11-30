import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Area } from 'recharts';
import type { MACDData } from '../types';
import { useMemo } from 'react';

interface MACDChartProps {
  macdData: MACDData[];
}

/**
 * MACDチャートコンポーネント
 * - MACD線: 12日EMA - 26日EMA
 * - Signal線: MACD線の9日EMA
 * - ヒストグラム: MACD - Signal
 * - ゴールデンクロス: MACD > Signal（買いシグナル）
 * - デッドクロス: MACD < Signal（売りシグナル）
 */
export function MACDChart({ macdData }: MACDChartProps) {
  // ゴールデンクロス・デッドクロス範囲用のデータ作成
  const crossData = useMemo(() => {
    return macdData.map(item => {
      const isBullish = (item.macd ?? 0) > (item.signal ?? 0); // ゴールデンクロス（強気）
      return {
        ...item,
        goldenCross: isBullish ? item.macd : null, // MACD > Signal のときのMACD値
        deadCross: !isBullish ? item.macd : null,  // MACD < Signal のときのMACD値
      };
    });
  }, [macdData]);

  // 日付フォーマット（YYYY-MM-DD → MM/DD）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // MACD値フォーマット
  const formatMACD = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-magenta">
          MACD (12, 26, 9) - 移動平均収束拡散法
        </h3>
        <div className="text-xs text-gray-400">
          <span className="text-green-400">■ ゴールデンクロス（MACD &gt; Signal）: 買いシグナル</span>
          <span className="ml-3 text-red-400">■ デッドクロス（MACD &lt; Signal）: 売りシグナル</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={crossData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value: number, name: string) => {
              if (name === 'macd') return [formatMACD(value), 'MACD'];
              if (name === 'signal') return [formatMACD(value), 'Signal'];
              if (name === 'histogram') return [formatMACD(value), 'ヒストグラム'];
              if (name === 'goldenCross') return [formatMACD(value), 'ゴールデンクロス範囲'];
              if (name === 'deadCross') return [formatMACD(value), 'デッドクロス範囲'];
              return [formatMACD(value), name];
            }}
            labelFormatter={formatDate}
          />
          <Legend wrapperStyle={{ color: '#f3f4f6' }} />

          {/* ゼロライン */}
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="1 1" />

          {/* ゴールデンクロス範囲（MACD > Signal）の面積 */}
          <Area
            type="monotone"
            dataKey="goldenCross"
            stroke="none"
            fill="#10b981"
            fillOpacity={0.2}
            name="ゴールデンクロス範囲"
            connectNulls={false}
          />

          {/* デッドクロス範囲（MACD < Signal）の面積 */}
          <Area
            type="monotone"
            dataKey="deadCross"
            stroke="none"
            fill="#ef4444"
            fillOpacity={0.2}
            name="デッドクロス範囲"
            connectNulls={false}
          />

          {/* ヒストグラム（MACD - Signal） */}
          <Bar
            dataKey="histogram"
            fill="#6366f1"
            opacity={0.7}
            name="ヒストグラム"
          />

          {/* MACD線 */}
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="MACD"
          />

          {/* Signal線 */}
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Signal"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
