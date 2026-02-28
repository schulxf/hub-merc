import React, { useEffect, useState, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getTransactionsForAsset } from '../../services/transactionService';
import { fmt } from '../../lib/utils';

/**
 * Format a Date object as a localised date string.
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '-';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * AssetDetailSlideOver — slide-in panel displaying the transaction history
 * and summary metrics for a single portfolio asset.
 *
 * @param {object}   props
 * @param {object|null} props.asset       - The asset being viewed (from PortfolioContext)
 * @param {number}   [props.currentPrice] - Live price in USD
 * @param {boolean}  props.isOpen         - Controls panel visibility
 * @param {Function} props.onClose        - Called when the panel should close
 */
function AssetDetailSlideOver({ asset, currentPrice = 0, isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transactions whenever the panel opens for a new asset
  useEffect(() => {
    if (!isOpen || !asset) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setIsLoading(true);
    setError(null);
    setTransactions([]);

    getTransactionsForAsset(uid, asset.coinId ?? asset.id)
      .then((txs) => {
        setTransactions(txs);
      })
      .catch((err) => {
        console.error('[AssetDetailSlideOver] fetch error:', err);
        setError('Nao foi possivel carregar as transacoes.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, asset]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  if (!isOpen || !asset) return null;

  // ===== DERIVED METRICS =====

  const totalQty = asset.amount ?? 0;
  const avgPrice = asset.averageBuyPrice ?? 0;
  const totalInvested = totalQty * avgPrice;
  const currentValue = totalQty * currentPrice;
  const plDollar = currentValue - totalInvested;
  const plPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
  const isPositive = plDollar >= 0;

  const coinColor = asset.color ?? '#00FFEF';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex justify-end animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      {/* Panel */}
      <div
        className="relative h-full w-full max-w-lg flex flex-col overflow-hidden"
        style={{
          background: 'rgba(10,12,18,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: '1px',
            background: `linear-gradient(to right, transparent, ${coinColor}66, rgba(26,111,212,0.3))`,
          }}
        />

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            {/* Color dot */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: `${coinColor}18`, border: `1px solid ${coinColor}30`, color: coinColor }}
            >
              {(asset.symbol ?? asset.coinId ?? '?').slice(0, 3).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-text-primary leading-none">
                {asset.name ?? asset.coinId}
              </h2>
              <p className="text-xs text-text-tertiary mt-0.5 font-medium">
                {(asset.symbol ?? '').toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#E5E7EB'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'transparent'; }}
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SUMMARY METRICS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Total Invested */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Investido</p>
            <p className="text-sm font-black text-text-primary">${fmt.usd(totalInvested)}</p>
          </div>

          {/* Current Value */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>Valor Atual</p>
            <p className="text-sm font-black text-text-primary">${fmt.usd(currentValue)}</p>
          </div>

          {/* P&L */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>P&L</p>
            <p
              className="text-sm font-black flex items-center gap-1"
              style={{ color: isPositive ? '#4ADE80' : '#F87171' }}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              )}
              {isPositive ? '+' : ''}${fmt.usd(Math.abs(plDollar))}
              <span className="text-xs font-bold ml-0.5">
                ({isPositive ? '+' : ''}{fmt.pct(plPercent)}%)
              </span>
            </p>
          </div>
        </div>

        {/* ── TRANSACTION HISTORY ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#6B7280' }}>
            Extrato de Transacoes
          </h3>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-cyan" />
            </div>
          )}

          {error && (
            <div
              className="p-4 rounded-xl text-sm text-orange-300"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              {error}
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div
              className="p-6 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                Nenhuma transacao registada ainda.
              </p>
            </div>
          )}

          {!isLoading && !error && transactions.length > 0 && (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isBuy = tx.type === 'BUY';
                return (
                  <div
                    key={tx.id}
                    className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    {/* Type icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: isBuy ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        border: isBuy ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(248,113,113,0.2)',
                      }}
                    >
                      {isBuy ? (
                        <ArrowDownCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: isBuy ? '#4ADE80' : '#F87171' }}
                        >
                          {isBuy ? 'Compra' : 'Venda'}
                        </span>
                        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                          {formatDate(tx.date)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <div>
                          <p className="text-sm font-bold text-text-primary">
                            {tx.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                            {' '}
                            <span className="text-text-tertiary font-medium text-xs">
                              {(tx.symbol ?? asset.symbol ?? '').toUpperCase()}
                            </span>
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#6B7280' }}>
                            @ ${fmt.usd(tx.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text-primary">
                            ${fmt.usd(tx.usdValue)}
                          </p>
                          {tx.notes && (
                            <p
                              className="text-xs mt-0.5 truncate max-w-[140px]"
                              style={{ color: '#6B7280' }}
                              title={tx.notes}
                            >
                              {tx.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetDetailSlideOver;
