import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

/**
 * Mostra o status atual de uma posição de liquidez salva:
 * - Preço atual vs preço de entrada
 * - IL estimada em tempo real
 * - P&L líquido (taxas - IL)
 * - Indicador de in/out range
 */
export default function PositionStatus({ position, totalFees, calculateCurrentIL }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    calculateCurrentIL(position).then((result) => {
      if (!cancelled) {
        setStatus(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [position, calculateCurrentIL]);

  if (loading || !status) {
    return (
      <div className="bg-[#0D0F13] rounded-xl p-4 border border-gray-800/50 animate-pulse">
        <div className="h-12 bg-gray-800/30 rounded" />
      </div>
    );
  }

  const netPnL = totalFees - status.ilDollar;
  const inRange = status.currentPrice >= position.priceLow && status.currentPrice <= position.priceHigh;
  const priceChange = ((status.currentPrice - position.entryPrice) / position.entryPrice) * 100;

  return (
    <div className="bg-[#0D0F13] rounded-xl p-4 border border-gray-800/50">
      {/* Range indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
          inRange
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {inRange ? 'In Range' : 'Out of Range'}
        </span>
        <span className={`text-xs font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-[10px] text-gray-500 uppercase mb-1">Preço Atual</p>
          <p className="font-bold text-white">
            ${status.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase mb-1">IL Estimada</p>
          <p className="font-bold text-red-400">
            {status.ilDollar > 0 ? '-' : ''}${Math.abs(status.ilDollar).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase mb-1">P&L Líquido</p>
          <div className="flex items-center gap-1">
            {netPnL >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
            <p className={`font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netPnL >= 0 ? '+' : ''}${netPnL.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Barra visual do range */}
      <div className="mt-3 pt-3 border-t border-gray-800/50">
        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
          <span>${position.priceLow.toFixed(2)}</span>
          <span>${position.priceHigh.toFixed(2)}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
          {(() => {
            const range = position.priceHigh - position.priceLow;
            const pos = Math.max(0, Math.min(1, (status.currentPrice - position.priceLow) / range));
            return (
              <div
                className={`absolute top-0 h-full w-2 rounded-full ${inRange ? 'bg-emerald-400' : 'bg-red-400'}`}
                style={{ left: `${pos * 100}%`, transform: 'translateX(-50%)' }}
              />
            );
          })()}
          <div className="h-full bg-blue-500/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
