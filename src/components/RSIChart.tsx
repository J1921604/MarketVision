import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import type { RSIData } from '../types';

interface RSIChartProps {
  rsiData: RSIData[];
}

/**
 * RSI（相対力指数）チャートコンポーネント
 * - RSI 30未満: 売られすぎ（買いシグナル）
 * - RSI 70超過: 買われすぎ（売りシグナル）
 */
export function RSIChart({ rsiData }: RSIChartProps) {
  // 日付フォーマット（YYYY-MM-DD → MM/DD）
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // RSI値フォーマット
  const formatRSI = (value: number) => {
    return value.toFixed(1);
  };

  return (
    <div className="w-full bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-neon-green">
          RSI (14日) - 相対力指数
        </h3>
        <div className="text-xs text-gray-400">
          <span className="text-red-400">■ 30未満: 売られすぎ（買いシグナル）</span>
          <span className="ml-3 text-green-400">■ 70超過: 買われすぎ（売りシグナル）</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={rsiData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={(value: number) => [formatRSI(value), 'RSI']}
            labelFormatter={formatDate}
          />
          <Legend wrapperStyle={{ color: '#f3f4f6' }} />

          {/* 買われすぎライン（70） */}
          <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" label={{ value: '買われすぎ (70)', fill: '#10b981', fontSize: 10 }} />
          
          {/* 中立ライン（50） */}
          <ReferenceLine y={50} stroke="#6b7280" strokeDasharray="1 1" />
          
          {/* 売られすぎライン（30） */}
          <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '売られすぎ (30)', fill: '#ef4444', fontSize: 10 }} />

          {/* RSI線 */}
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            name="RSI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
