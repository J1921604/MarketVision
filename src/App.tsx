import { useState, useEffect } from 'react';
import { useMarketData } from './hooks/useMarketData';
import { ChartCanvas } from './components/ChartCanvas';
import { TechnicalPanel } from './components/TechnicalPanel';
import { RSIChart } from './components/RSIChart';
import { MACDChart } from './components/MACDChart';
import type { Symbol, PeriodFilter } from './types';

function App() {
  const [symbol, setSymbol] = useState<Symbol>('9501.T');
  const [period, setPeriod] = useState<PeriodFilter>('1Y');
  const [lastUpdate, setLastUpdate] = useState<string>('-');
  
  // テクニカル指標表示フラグ
  const [showSMA5, setShowSMA5] = useState(true);
  const [showSMA25, setShowSMA25] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showSMA75, setShowSMA75] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showBB, setShowBB] = useState(false);

  const { filteredData, loading, error } = useMarketData(symbol, period);

  // 最終更新日時を設定
  useEffect(() => {
    if (filteredData && filteredData.price.length > 0) {
      const latestDate = filteredData.price[filteredData.price.length - 1].date;
      setLastUpdate(latestDate);
    }
  }, [filteredData]);

  const periods: PeriodFilter[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y'];
  const periodLabels: Record<PeriodFilter, string> = {
    '1M': '1か月',
    '3M': '3か月',
    '6M': '6か月',
    '1Y': '1年',
    '3Y': '3年',
    '5Y': '5年',
    'Custom': 'カスタム'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-neon-green text-xl neon-glow">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-red-400 text-xl">エラー: {error}</div>
      </div>
    );
  }

  if (!filteredData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg p-4 md:p-8">
      {/* ヘッダー */}
      <header className="header">
        <h1 className="title">株価テクニカル分析ダッシュボード - MarketVision</h1>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-[1600px] mx-auto">
        {/* 上段: コントロールパネル（銘柄・期間・テクニカル指標） */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* 銘柄・期間選択 (33%) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* 銘柄選択 */}
            <div className="neumorphic p-2">
              <h3 className="text-sm font-semibold mb-2 text-neon-green">銘柄選択</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setSymbol('9501.T')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                    symbol === '9501.T'
                      ? 'neon-border text-neon-green'
                      : 'border border-border text-fg/70 hover:border-cyan'
                  }`}
                >
                  東京電力HD (9501.T)
                </button>
                <button
                  onClick={() => setSymbol('9502.T')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                    symbol === '9502.T'
                      ? 'neon-border text-neon-green'
                      : 'border border-border text-fg/70 hover:border-magenta'
                  }`}
                >
                  中部電力 (9502.T)
                </button>
              </div>
            </div>

            {/* 期間フィルタ */}
            <div className="neumorphic p-2">
              <h3 className="text-sm font-semibold mb-2 text-neon-green">期間選択</h3>
              <div className="grid grid-cols-3 gap-2">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-2 rounded text-sm transition-all ${
                      period === p
                        ? 'bg-neon-green/20 border-2 border-neon-green text-neon-green'
                        : 'border border-border text-fg/70 hover:border-neon-green/50'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* テクニカル指標パネル（右側） (66%) */}
          <div className="col-span-12 lg:col-span-8">
            <TechnicalPanel
              showSMA5={showSMA5}
              showSMA25={showSMA25}
              showSMA50={showSMA50}
              showSMA75={showSMA75}
              showRSI={showRSI}
              showMACD={showMACD}
              showBB={showBB}
              onToggleSMA5={() => setShowSMA5(!showSMA5)}
              onToggleSMA25={() => setShowSMA25(!showSMA25)}
              onToggleSMA50={() => setShowSMA50(!showSMA50)}
              onToggleSMA75={() => setShowSMA75(!showSMA75)}
              onToggleRSI={() => setShowRSI(!showRSI)}
              onToggleMACD={() => setShowMACD(!showMACD)}
              onToggleBB={() => setShowBB(!showBB)}
            />
          </div>
        </div>

        {/* 下段: チャートエリア（全幅） */}
        <div className="space-y-6">
          {/* 株価チャート */}
          <div className="neumorphic p-4 h-[500px]">
            <h3 className="text-lg font-semibold mb-2 text-cyan">
              {symbol} - {period}
            </h3>
            <ChartCanvas
              priceData={filteredData.price}
              smaData={filteredData.sma}
              bbData={filteredData.bb}
              showSMA5={showSMA5}
              showSMA25={showSMA25}
              showSMA50={showSMA50}
              showSMA75={showSMA75}
              showBB={showBB}
            />
          </div>

          {/* RSIチャート */}
          {showRSI && (
            <div>
              <RSIChart rsiData={filteredData.rsi} />
            </div>
          )}

          {/* MACDチャート */}
          {showMACD && (
            <div>
              <MACDChart macdData={filteredData.macd} />
            </div>
          )}
        </div>

        {/* フッター */}
        <footer className="text-center text-fg/50 text-sm mt-12">
          <div className="update-info mb-4">
            最終更新: <span id="last-update">{lastUpdate}</span> | 次回更新予定: 毎日 07:00 (日本時間)
          </div>
          <p>&copy; 2025 MarketVision | Version 1.0.0</p>
          <p className="mt-2">
            Data provided by Stooq via pandas_datareader
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App
