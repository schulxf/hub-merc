import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { addTransaction } from '../../services/transactionService';
import { usePortfolioContext } from './PortfolioContext';
import { SUPPORTED_COINS } from '../../data/mockDb';

// ---------------------------------------------------------------------------
// Transaction Form Modal
// ---------------------------------------------------------------------------

/**
 * TransactionFormModal — modal dialog for recording a BUY or SELL transaction.
 *
 * @param {object}   props
 * @param {'BUY'|'SELL'} props.type   - Transaction type
 * @param {Function} props.onClose    - Called when the modal should close
 * @param {Function} props.onSuccess  - Called after a successful save
 */
function TransactionFormModal({ type, onClose, onSuccess }) {
  const { portfolioAssets } = usePortfolioContext();

  // Build coin options from portfolio assets first, then from SUPPORTED_COINS as fallback
  const coinOptions = portfolioAssets.length > 0
    ? portfolioAssets.map((a) => ({ id: a.coinId ?? a.id, symbol: a.symbol ?? a.coinId, name: a.name ?? a.coinId }))
    : SUPPORTED_COINS;

  const [selectedCoin, setSelectedCoin] = useState(coinOptions[0]?.id ?? 'bitcoin');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const isBuy = type === 'BUY';
  const accentColor = isBuy ? '#4ADE80' : '#F87171';
  const accentBg = isBuy ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)';
  const accentBorder = isBuy ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Utilizador nao autenticado.');
      return;
    }

    const qty = parseFloat(quantity);
    const px = parseFloat(price);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantidade invalida.');
      return;
    }
    if (isNaN(px) || px < 0) {
      setError('Preco invalido.');
      return;
    }

    setIsSaving(true);

    try {
      const coinInfo = coinOptions.find((c) => c.id === selectedCoin);

      await addTransaction(uid, selectedCoin, {
        type,
        quantity: qty,
        price: px,
        date: new Date(date),
        notes: notes.trim(),
        symbol: coinInfo?.symbol ?? selectedCoin,
        name: coinInfo?.name ?? selectedCoin,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[AddTransactionDropdown] save error:', err);
      setError('Erro ao guardar transacao. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-md overflow-hidden"
        style={{
          background: 'rgba(15,17,23,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{ height: '1px', background: `linear-gradient(to right, transparent, ${accentColor}66, transparent)` }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
          >
            {isBuy
              ? <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
              : <TrendingDown className="w-4 h-4" style={{ color: accentColor }} />
            }
          </div>
          <div>
            <h2 className="text-base font-black text-text-primary leading-none">
              {isBuy ? 'Registar Compra' : 'Registar Venda'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">Adicionar transacao ao historico</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Coin selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-widest">
              Ativo
            </label>
            <select
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all appearance-none"
            >
              {coinOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({(c.symbol ?? c.id).toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-widest">
                Quantidade
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 0.5"
                className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-widest">
                Preco (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-semibold">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 60000"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-xl pl-7 pr-4 py-3 text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-widest">
              Data
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-widest">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: DCA mensal, entrada estrategica..."
              className="w-full bg-bg-tertiary border border-border-subtle rounded-xl px-4 py-3 text-text-primary text-sm placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
            />
          </div>

          {/* Total preview */}
          {quantity && price && !isNaN(parseFloat(quantity)) && !isNaN(parseFloat(price)) && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
            >
              <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>Total USD</span>
              <span className="text-sm font-black" style={{ color: accentColor }}>
                ${(parseFloat(quantity) * parseFloat(price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs font-medium text-orange-400 px-1">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-text-secondary bg-bg-quaternary hover:bg-bg-quaternary/80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2"
              style={{
                background: isBuy ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                color: accentColor,
                border: `1px solid ${accentBorder}`,
              }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isBuy ? 'Registar Compra' : 'Registar Venda'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dropdown trigger
// ---------------------------------------------------------------------------

/**
 * AddTransactionDropdown — dropdown button with [+ Compra] and [- Venda] options.
 * Opens a TransactionFormModal for the selected transaction type.
 *
 * @param {object}   props
 * @param {Function} [props.onSuccess] - Called after a transaction is saved
 */
function AddTransactionDropdown({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'BUY' | 'SELL' | null
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const openModal = useCallback((type) => {
    setActiveModal(type);
    setIsOpen(false);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleSuccess = useCallback(() => {
    onSuccess?.();
  }, [onSuccess]);

  return (
    <>
      {/* Dropdown container */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
          style={{
            background: 'rgba(0,255,239,0.1)',
            border: '1px solid rgba(0,255,239,0.25)',
            color: '#00FFEF',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,239,0.16)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,239,0.1)'; }}
          title="Registar transacao"
        >
          <span>+ Transacao</span>
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-44 overflow-hidden rounded-xl z-40 animate-fade-in"
            style={{
              background: 'rgba(15,17,23,0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Compra */}
            <button
              onClick={() => openModal('BUY')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left outline-none"
              style={{ color: '#4ADE80' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              + Compra
            </button>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

            {/* Venda */}
            <button
              onClick={() => openModal('SELL')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors text-left outline-none"
              style={{ color: '#F87171' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <TrendingDown className="w-4 h-4 shrink-0" />
              - Venda
            </button>
          </div>
        )}
      </div>

      {/* Transaction modal */}
      {activeModal && (
        <TransactionFormModal
          type={activeModal}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

export default AddTransactionDropdown;
