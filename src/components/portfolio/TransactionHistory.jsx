import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, ArrowDownCircle, ArrowUpCircle, Download, Search, CalendarDays } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getAllTransactions } from '../../services/transactionService';
import { usePortfolioContext } from './PortfolioContext';
import { fmt } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a Date as "DD/MM/YYYY" for display.
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
 * Format a Date as "YYYY-MM-DD" for the date input value attribute.
 *
 * @param {Date} date
 * @returns {string}
 */
function toInputDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Convert all transactions to a CSV string and trigger a download.
 *
 * @param {Array<object>} transactions
 */
function exportToCsv(transactions) {
  const headers = ['Data', 'Tipo', 'Ativo', 'Simbolo', 'Quantidade', 'Preco USD', 'Valor Total USD', 'Notas'];
  const rows = transactions.map((tx) => [
    formatDate(tx.date),
    tx.type,
    tx.name ?? tx.coinId ?? '',
    (tx.symbol ?? '').toUpperCase(),
    tx.quantity,
    tx.price,
    tx.usdValue,
    tx.notes ?? '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * TransactionCard — renders a single transaction in the timeline.
 */
function TransactionCard({ tx }) {
  const isBuy = tx.type === 'BUY';
  const plColor = isBuy ? '#4ADE80' : '#F87171';
  const coinColor = '#00FFEF';

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl transition-colors"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
    >
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: isBuy ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
          border: isBuy ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(248,113,113,0.2)',
        }}
      >
        {isBuy ? (
          <ArrowDownCircle className="w-4.5 h-4.5 text-green-400" />
        ) : (
          <ArrowUpCircle className="w-4.5 h-4.5 text-red-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left: Type + Asset */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: plColor }}
            >
              {isBuy ? 'Compra' : 'Venda'}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ color: coinColor, background: 'rgba(0,255,239,0.08)', border: '1px solid rgba(0,255,239,0.12)' }}
            >
              {(tx.symbol ?? tx.coinId ?? '').toUpperCase()}
            </span>
          </div>

          {/* Right: Date */}
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
            {formatDate(tx.date)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          {/* Qty + price */}
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {tx.quantity.toLocaleString('en-US', { maximumFractionDigits: 8 })}
              {' '}
              <span className="text-text-tertiary font-normal text-xs">
                {(tx.symbol ?? '').toUpperCase()}
              </span>
              <span className="text-text-tertiary font-normal text-xs ml-2">
                @ ${fmt.usd(tx.price)}
              </span>
            </p>
            {tx.notes && (
              <p className="text-xs mt-0.5 truncate max-w-[280px]" style={{ color: '#6B7280' }} title={tx.notes}>
                {tx.notes}
              </p>
            )}
          </div>

          {/* Total USD */}
          <p className="text-sm font-bold text-text-primary">
            ${fmt.usd(tx.usdValue)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * TransactionHistory — Tab 3 of the Portfolio page.
 *
 * Renders a reverse-chronological timeline of ALL portfolio transactions,
 * with filter controls (date range, type, asset) and a CSV export button.
 *
 * Must be rendered inside a <PortfolioProvider> tree.
 *
 * @returns {React.ReactElement}
 */
function TransactionHistory() {
  const { portfolioAssets } = usePortfolioContext();

  // ===== DATA =====
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== FILTERS =====
  const [filterType, setFilterType] = useState('ALL');   // 'ALL' | 'BUY' | 'SELL'
  const [filterCoin, setFilterCoin] = useState('ALL');   // 'ALL' | coinId
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  // Fetch all transactions on mount
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getAllTransactions(uid)
      .then((txs) => {
        setTransactions(txs);
      })
      .catch((err) => {
        console.error('[TransactionHistory] fetch error:', err);
        setError('Nao foi possivel carregar o historico. Por favor tente novamente.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Unique coin options for the filter dropdown
  const coinOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const tx of transactions) {
      const key = tx.coinId ?? '';
      if (key && !seen.has(key)) {
        seen.add(key);
        options.push({ coinId: key, label: `${(tx.symbol ?? key).toUpperCase()} - ${tx.name ?? key}` });
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (filterType !== 'ALL') {
      result = result.filter((tx) => tx.type === filterType);
    }

    if (filterCoin !== 'ALL') {
      result = result.filter((tx) => (tx.coinId ?? '') === filterCoin);
    }

    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      result = result.filter((tx) => tx.date >= from);
    }

    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((tx) => tx.date <= to);
    }

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter(
        (tx) =>
          (tx.name ?? '').toLowerCase().includes(q) ||
          (tx.symbol ?? '').toLowerCase().includes(q) ||
          (tx.notes ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [transactions, filterType, filterCoin, filterDateFrom, filterDateTo, searchText]);

  const handleExportCsv = useCallback(() => {
    exportToCsv(filteredTransactions);
  }, [filteredTransactions]);

  const handleClearFilters = useCallback(() => {
    setFilterType('ALL');
    setFilterCoin('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchText('');
  }, []);

  const hasActiveFilters =
    filterType !== 'ALL' ||
    filterCoin !== 'ALL' ||
    filterDateFrom !== '' ||
    filterDateTo !== '' ||
    searchText.trim() !== '';

  // ===== RENDER =====

  return (
    <div className="animate-fade-in space-y-6">

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-bg-tertiary border border-border-subtle text-text-primary placeholder-text-tertiary outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
            />
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border-subtle text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 transition-all appearance-none cursor-pointer"
          >
            <option value="ALL">Todos os tipos</option>
            <option value="BUY">Compras</option>
            <option value="SELL">Vendas</option>
          </select>

          {/* Asset filter */}
          <select
            value={filterCoin}
            onChange={(e) => setFilterCoin(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border-subtle text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 transition-all appearance-none cursor-pointer"
          >
            <option value="ALL">Todos os ativos</option>
            {coinOptions.map((opt) => (
              <option key={opt.coinId} value={opt.coinId}>{opt.label}</option>
            ))}
          </select>

          {/* Date From */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#6B7280' }} />
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border-subtle text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 transition-all cursor-pointer"
              title="Data inicial"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#6B7280' }} />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm rounded-lg bg-bg-tertiary border border-border-subtle text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 transition-all cursor-pointer"
              title="Data final"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
              style={{ color: '#9CA3AF', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E5E7EB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF'; }}
            >
              Limpar filtros
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(0,255,239,0.08)',
              border: '1px solid rgba(0,255,239,0.2)',
              color: '#00FFEF',
            }}
            onMouseEnter={(e) => { if (filteredTransactions.length > 0) e.currentTarget.style.background = 'rgba(0,255,239,0.14)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,239,0.08)'; }}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* ── RESULTS COUNT ───────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
            {filteredTransactions.length} transacao{filteredTransactions.length !== 1 ? 'es' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtrado)'}
          </p>
        </div>
      )}

      {/* ── LOADING ─────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-cyan" />
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="p-5 rounded-xl text-sm text-orange-300"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* ── EMPTY STATE ─────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredTransactions.length === 0 && (
        <div
          className="p-12 text-center rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>
            {hasActiveFilters
              ? 'Nenhuma transacao encontrada para os filtros aplicados.'
              : 'Ainda sem transacoes. Adicione um ativo e registe a primeira transacao.'}
          </p>
        </div>
      )}

      {/* ── TIMELINE ────────────────────────────────────────────────────── */}
      {!isLoading && !error && filteredTransactions.length > 0 && (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
