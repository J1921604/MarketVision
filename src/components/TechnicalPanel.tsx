interface TechnicalPanelProps {
  showSMA5: boolean;
  showSMA25: boolean;
  showSMA50: boolean;
  showSMA75: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showBB: boolean;
  onToggleSMA5: () => void;
  onToggleSMA25: () => void;
  onToggleSMA50: () => void;
  onToggleSMA75: () => void;
  onToggleRSI: () => void;
  onToggleMACD: () => void;
  onToggleBB: () => void;
}

/**
 * テクニカル指標のON/OFF切り替えパネル
 */
export function TechnicalPanel({
  showSMA5,
  showSMA25,
  showSMA50,
  showSMA75,
  showRSI,
  showMACD,
  showBB,
  onToggleSMA5,
  onToggleSMA25,
  onToggleSMA50,
  onToggleSMA75,
  onToggleRSI,
  onToggleMACD,
  onToggleBB,
}: TechnicalPanelProps) {
  const buttonClass = (isActive: boolean) => 
    `px-3 py-2 rounded text-sm transition-all ${
      isActive
        ? 'bg-neon-green/20 border-2 border-neon-green text-neon-green'
        : 'border border-border text-fg/70 hover:border-neon-green/50'
    }`;

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {/* 移動平均線カード (25%) */}
      <div className="neumorphic p-4">
        <h3 className="text-sm font-semibold mb-3 text-blue-400">移動平均線</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onToggleSMA5} className={buttonClass(showSMA5)}>
            <span className="text-blue-400">SMA5</span><br/><span className="text-xs text-blue-400">(5日)</span>
          </button>
          <button onClick={onToggleSMA25} className={buttonClass(showSMA25)}>
            <span className="text-blue-400">SMA25</span><br/><span className="text-xs text-orange-400">(25日)</span>
          </button>
          <button onClick={onToggleSMA50} className={buttonClass(showSMA50)}>
            <span className="text-blue-400">SMA50</span><br/><span className="text-xs text-green-400">(50日)</span>
          </button>
          <button onClick={onToggleSMA75} className={buttonClass(showSMA75)}>
            <span className="text-blue-400">SMA75</span><br/><span className="text-xs text-purple-400">(75日)</span>
          </button>
        </div>
      </div>

      {/* オシレーター & バンドカード (25%) */}
      <div className="neumorphic p-4">
        <h3 className="text-sm font-semibold mb-3 text-neon-green">オシレーター & バンド</h3>
        <div className="grid grid-cols-1 gap-2">
          <button onClick={onToggleRSI} className={buttonClass(showRSI)}>
            <span className="text-neon-green">RSI</span> <span className="text-fg/70">(14日)</span>
          </button>
          <button onClick={onToggleMACD} className={buttonClass(showMACD)}>
            <span className="text-magenta">MACD</span>
          </button>
          <button onClick={onToggleBB} className={buttonClass(showBB)}>
            <span className="text-yellow-400">BB</span> <span className="text-fg/70">(ボリンジャーバンド)</span>
          </button>
        </div>
      </div>

      {/* 指標説明カード (50%) */}
      <div className="col-span-2 neumorphic p-4">
        <h4 className="text-sm font-semibold text-neon-green mb-3 border-b border-gray-700 pb-1">指標の説明</h4>
        <div className="space-y-2 text-base">
          <p><strong className="text-blue-400">SMA</strong>: 単純移動平均線。トレンドの方向性を把握します。</p>
          <p><strong className="text-neon-green">RSI</strong>: 相対力指数。買われすぎ・売られすぎを判断します。</p>
          <p><strong className="text-magenta">MACD</strong>: トレンドの転換点や強弱を分析します。</p>
          <p><strong className="text-yellow-400">BB</strong>: ボリンジャーバンド。価格変動の範囲を予測します。</p>
        </div>
      </div>
    </div>
  );
}
