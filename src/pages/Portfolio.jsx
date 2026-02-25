import React, { useReducer, useCallback, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SUPPORTED_COINS } from '../data/mockDb';
import { lookupCoinGeckoId } from '../lib/web3Api';

import { PortfolioProvider, usePortfolioContext } from '../components/portfolio/PortfolioContext';
import { useFirstLoadSnapshot } from '../hooks/useFirstLoadSnapshot';
import PortfolioHeader from '../components/portfolio/PortfolioHeader';
import PortfolioTabs from '../components/portfolio/PortfolioTabs';
import OverviewTab from '../components/portfolio/OverviewTab';
import AdvancedAssetTable from '../components/portfolio/AdvancedAssetTable';
import AssetDetailSlideOver from '../components/portfolio/AssetDetailSlideOver';
import TransactionHistory from '../components/portfolio/TransactionHistory';
import AddTransactionDropdown from '../components/portfolio/AddTransactionDropdown';
import SnapshotStatus from '../components/portfolio/SnapshotStatus';
import OpportunityBanner from '../components/portfolio/OpportunityBanner';
import { seedTransactionsIfEmpty } from '../services/transactionService';
import { fmt } from '../lib/utils';
import { portfolioReducer, initialPortfolioState, PORTFOLIO_ACTIONS } from './portfolioReducer';

// ---------------------------------------------------------------------------
// Tab persistence key (sessionStorage)
// ---------------------------------------------------------------------------

const SESSION_TAB_KEY = 'portfolio_active_tab';
const VALID_TABS = ['overview', 'assets', 'history'];

function readPersistedTab() {
  try {
    const saved = sessionStorage.getItem(SESSION_TAB_KEY);
    return VALID_TABS.includes(saved) ? saved : 'overview';
  } catch {
    return 'overview';
  }
}

function persistTab(tabId) {
  try {
    sessionStorage.setItem(SESSION_TAB_KEY, tabId);
  } catch {
    // sessionStorage unavailable — proceed silently
  }
}

// ---------------------------------------------------------------------------
// AssetsTab — Tab 2 inner component (needs slide-over state)
// ---------------------------------------------------------------------------

/**
 * AssetsTab — renders the "Gestao de Ativos" tab.
 *
 * Manages the AssetDetailSlideOver state locally since it's only needed here.
 *
 * @param {object}   props
 * @param {Function} props.onEditAsset   - Delegates edit to Portfolio-level modal
 * @param {Function} props.onDeleteAsset - Delegates delete to Portfolio-level handler
 */
function AssetsTab({ onEditAsset, onDeleteAsset }) {
  const { portfolioAssets, livePrices } = usePortfolioContext();

  const [slideOverAsset, setSlideOverAsset] = React.useState(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = React.useState(false);

  const handleRowClick = useCallback((asset) => {
    setSlideOverAsset(asset);
    setIsSlideOverOpen(true);
  }, []);

  const handleCloseSlideOver = useCallback(() => {
    setIsSlideOverOpen(false);
  }, []);

  const currentPriceForSlideOver = slideOverAsset
    ? (livePrices[slideOverAsset.coinId]?.usd ?? 0)
    : 0;

  return (
    <>
      <div className="animate-fade-in">
        <AdvancedAssetTable
          onRowClick={handleRowClick}
          onEditAsset={onEditAsset}
          onDeleteAsset={onDeleteAsset}
        />
      </div>

      <AssetDetailSlideOver
        asset={slideOverAsset}
        currentPrice={currentPriceForSlideOver}
        isOpen={isSlideOverOpen}
        onClose={handleCloseSlideOver}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// PortfolioContent
// ---------------------------------------------------------------------------

/**
 * PortfolioContent — inner component that consumes PortfolioContext.
 *
 * All local UI state is managed by a single useReducer call (portfolioReducer).
 * This replaces the original 10 useState hooks, centralising the modal logic
 * and the on-chain import flow into predictable, testable transitions.
 *
 * @returns {React.ReactElement}
 */
function PortfolioContent() {
  const {
    portfolioAssets,
    livePrices,
    onChainTokens,
    isSyncingOnChain,
    onChainError,
    onChainWarning,
    isLoading,
  } = usePortfolioContext();

  // Capture a daily snapshot on first load if one does not yet exist for today
  const { isCapturing: isCapturingSnapshot, lastCapturedAt } =
    useFirstLoadSnapshot(portfolioAssets, livePrices);

  // ===== SINGLE REDUCER FOR ALL PAGE STATE =====
  const [state, dispatch] = useReducer(portfolioReducer, initialPortfolioState);

  // Destructure for readability
  const { modal, addingOnChain, syncWarning } = state;

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = React.useState(readPersistedTab);

  const handleSetActiveTab = useCallback((tabId) => {
    setActiveTab(tabId);
    persistTab(tabId);
  }, []);

  // ===== SEED TRANSACTIONS (once assets are loaded) =====
  useEffect(() => {
    if (Array.isArray(portfolioAssets) && portfolioAssets.length > 0) {
      seedTransactionsIfEmpty(portfolioAssets).catch((err) => {
        console.warn('[Portfolio] seed transactions failed:', err);
      });
    }
  }, [portfolioAssets]);

  // ===== HANDLERS =====

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !modal.amount || !modal.buyPrice) return;

    dispatch({ type: PORTFOLIO_ACTIONS.SAVE_START });
    const coin = SUPPORTED_COINS.find((c) => c.id === modal.selectedCoin);

    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', modal.selectedCoin);
      await setDoc(assetRef, {
        coinId: modal.selectedCoin,
        symbol: coin.symbol,
        name: coin.name,
        color: coin.color,
        amount: parseFloat(modal.amount),
        averageBuyPrice: parseFloat(modal.buyPrice),
        updatedAt: new Date().toISOString(),
      });

      dispatch({ type: PORTFOLIO_ACTIONS.CLOSE_MODAL });
    } catch (error) {
      console.error('Erro ao guardar ativo:', error);
      alert('Erro ao guardar ativo. Tente novamente.');
    } finally {
      dispatch({ type: PORTFOLIO_ACTIONS.SAVE_END });
    }
  };

  const handleEditAsset = useCallback((asset) => {
    dispatch({
      type: PORTFOLIO_ACTIONS.OPEN_MODAL_EDIT,
      payload: {
        assetId: asset.id,
        coinId: asset.coinId,
        amount: asset.amount,
        buyPrice: asset.averageBuyPrice,
      },
    });
  }, []);

  const handleCancelModal = useCallback(() => {
    dispatch({ type: PORTFOLIO_ACTIONS.CLOSE_MODAL });
  }, []);

  const handleRemoveAsset = useCallback(async (coinId) => {
    if (!auth.currentUser) return;
    if (!window.confirm('Tem a certeza que deseja remover este ativo?')) return;

    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', coinId);
      await deleteDoc(assetRef);
    } catch (error) {
      console.error('Erro ao remover ativo:', error);
    }
  }, []);

  const handleAddAssetClick = useCallback(() => {
    dispatch({ type: PORTFOLIO_ACTIONS.OPEN_MODAL });
  }, []);

  const handleRefresh = useCallback(() => {
    // Future: trigger a manual price refresh via useCryptoPrices
  }, []);

  const handleAddOnChainToken = async (token) => {
    if (!auth.currentUser) return;
    dispatch({
      type: PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_START,
      payload: { tokenId: token.id },
    });

    try {
      const cgMatch = await lookupCoinGeckoId(token.symbol);
      const coinId = cgMatch?.id || token.symbol.toLowerCase();

      dispatch({
        type: PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_END,
        payload: {
          token: {
            coinId,
            symbol: token.symbol,
            name: cgMatch?.name || token.name,
            amount: token.amount,
          },
        },
      });
    } catch (error) {
      console.error('Erro ao buscar token:', error);
      dispatch({ type: PORTFOLIO_ACTIONS.ONCHAIN_CLEAR });
    }
  };

  const handleSaveOnChainAsset = async () => {
    if (!auth.currentUser || !addingOnChain.token) return;
    dispatch({ type: PORTFOLIO_ACTIONS.SAVE_START });

    try {
      const t = addingOnChain.token;
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', t.coinId);

      await setDoc(assetRef, {
        coinId: t.coinId,
        symbol: t.symbol,
        name: t.name,
        color: '#6366F1',
        amount: parseFloat(t.amount),
        averageBuyPrice: 0,
        source: 'onchain',
        updatedAt: new Date().toISOString(),
      });

      dispatch({ type: PORTFOLIO_ACTIONS.ONCHAIN_CLEAR });
    } catch (error) {
      console.error('Erro ao guardar ativo on-chain:', error);
      alert('Erro ao guardar ativo. Tente novamente.');
    } finally {
      dispatch({ type: PORTFOLIO_ACTIONS.SAVE_END });
    }
  };

  // ===== DERIVED PORTFOLIO METRICS (for header) =====

  const totalValue = Array.isArray(portfolioAssets)
    ? portfolioAssets.reduce((sum, asset) => {
        const price = livePrices[asset.coinId]?.usd ?? 0;
        return sum + asset.amount * price;
      }, 0)
    : 0;

  // ===== LOADING STATE =====

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ===== RENDER =====

  return (
    <div className="animate-fade-in pb-12 px-6 md:px-8 max-w-[1600px] mx-auto relative min-h-screen">

      {/* ── ATMOSPHERIC BACKGROUND ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0" style={{ background: '#07090C' }} />
        <div
          className="absolute rounded-full"
          style={{
            top: '-160px', left: '-120px',
            width: '720px', height: '720px',
            background: 'radial-gradient(circle, rgba(0,255,239,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-200px', right: '-160px',
            width: '640px', height: '640px',
            background: 'radial-gradient(circle, rgba(26,111,212,0.1) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(0,255,239,0.04) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(7,9,12,0.55)' }} />
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* ========== 1. HEADER ========== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4">
        {/* Left: Title + Value */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-black text-text-primary tracking-tight">Meu Portfolio</h1>
            <div className="px-3 py-1 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-bold uppercase tracking-widest">
              Principal
            </div>
          </div>

          <div className="flex items-baseline gap-4 md:gap-6 mt-3">
            <h2 className="text-5xl md:text-6xl font-black text-text-primary tracking-tighter leading-none">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <p className="text-sm text-text-tertiary mt-2 font-medium">Atualizado nas ultimas 24h</p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
          <AddTransactionDropdown />

          <PortfolioHeader
            onAddAsset={handleAddAssetClick}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      {/* ========== 2. ALERTS ========== */}
      {(syncWarning || onChainWarning || onChainError) && (
        <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 text-sm text-orange-200 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 text-orange-400 flex-shrink-0" />
          <div className="space-y-1">
            {syncWarning && <p>{syncWarning}</p>}
            {onChainWarning && <p>{onChainWarning}</p>}
            {onChainError && <p>{onChainError}</p>}
          </div>
        </div>
      )}

      {/* ========== 3. SNAPSHOT & OPPORTUNITY ========== */}
      <div className="space-y-4 mb-8">
        <SnapshotStatus isCapturing={isCapturingSnapshot} lastCapturedAt={lastCapturedAt} />
        <OpportunityBanner onSwapClick={handleAddAssetClick} />
      </div>

      {/* ========== 4. TABS NAVIGATION ========== */}
      <PortfolioTabs activeTab={activeTab} setActiveTab={handleSetActiveTab} />

      {/* ========== 5. TAB CONTENT ========== */}

      {/* Tab 1: Visao Geral */}
      {activeTab === 'overview' && <OverviewTab />}

      {/* Tab 2: Gestao de Ativos */}
      {activeTab === 'assets' && (
        <AssetsTab
          onEditAsset={handleEditAsset}
          onDeleteAsset={handleRemoveAsset}
        />
      )}

      {/* Tab 3: Historico de Transacoes */}
      {activeTab === 'history' && <TransactionHistory />}

      {/* ========== ON-CHAIN TOKENS (only on overview tab) ========== */}
      {activeTab === 'overview' && onChainTokens && onChainTokens.length > 0 && (
        <section className="animate-fade-in mt-8">
          <div className="space-y-4 mb-5">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-text-primary">Tokens On-Chain</h2>
                <p className="text-sm text-text-tertiary">Ativos detectados nas suas carteiras</p>
              </div>
            </div>
          </div>

          <div
            className="relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '18px',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 pointer-events-none"
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(0,255,239,0.3), rgba(26,111,212,0.2))',
                zIndex: 1,
              }}
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Token</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Quantidade</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Valor USD</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {onChainTokens.map((token) => {
                    const alreadyAdded = Array.isArray(portfolioAssets)
                      ? portfolioAssets.some(
                          (a) => a.symbol?.toUpperCase() === token.symbol?.toUpperCase()
                        )
                      : false;

                    return (
                      <tr
                        key={token.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-text-primary">{token.symbol}</span>
                            <span className="text-xs text-text-tertiary">{token.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm text-text-primary">
                            {token.amount?.toLocaleString('en-US', {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 8,
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-sm text-text-primary">
                            {typeof token.valueUsd === 'number'
                              ? `$${fmt.usd(token.valueUsd)}`
                              : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleAddOnChainToken(token)}
                            disabled={alreadyAdded || addingOnChain.isLooking === token.id}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed outline-none"
                            style={{
                              background: 'rgba(0,255,239,0.08)',
                              color: '#00FFEF',
                              border: '1px solid rgba(0,255,239,0.15)',
                            }}
                            title={alreadyAdded ? 'Ja adicionado' : 'Adicionar ao portfolio'}
                          >
                            {addingOnChain.isLooking === token.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : alreadyAdded ? (
                              'Adicionado'
                            ) : (
                              '+ Adicionar'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========== MODAL ADICIONAR/EDITAR ATIVO ========== */}
      {modal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="relative w-full max-w-md p-8 overflow-hidden"
            style={{
              background: 'rgba(15,17,23,0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: '1px',
                background:
                  'linear-gradient(to right, transparent, rgba(0,255,239,0.5), rgba(26,111,212,0.3))',
              }}
            />
            <h2 className="text-2xl font-black text-text-primary mb-6">
              {modal.isEditing ? 'Editar Ativo' : 'Adicionar Ativo'}
            </h2>

            <form onSubmit={handleAddAsset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Moeda
                </label>
                <select
                  value={modal.selectedCoin}
                  onChange={(e) =>
                    dispatch({
                      type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
                      payload: { field: 'selectedCoin', value: e.target.value },
                    })
                  }
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-4 py-3 text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all appearance-none"
                >
                  {SUPPORTED_COINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Quantidade Comprada
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={modal.amount}
                  onChange={(e) =>
                    dispatch({
                      type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
                      payload: { field: 'amount', value: e.target.value },
                    })
                  }
                  placeholder="Ex: 0.5"
                  className="w-full bg-bg-tertiary border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Preco Medio de Compra (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-semibold">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={modal.buyPrice}
                    onChange={(e) =>
                      dispatch({
                        type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
                        payload: { field: 'buyPrice', value: e.target.value },
                      })
                    }
                    placeholder="Ex: 60000"
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-lg pl-8 pr-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 focus-visible:border-cyan transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="flex-1 px-4 py-3 rounded-lg font-bold text-text-secondary bg-bg-quaternary hover:bg-bg-quaternary/80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modal.isSaving}
                  className="flex-1 bg-cyan text-bg px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 hover:shadow-cyan"
                >
                  {modal.isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL: CONFIRMAR IMPORTACAO ON-CHAIN ========== */}
      {addingOnChain.token && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        >
          <div
            className="relative w-full max-w-md p-8 overflow-hidden"
            style={{
              background: 'rgba(15,17,23,0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: '1px',
                background:
                  'linear-gradient(to right, transparent, rgba(0,255,239,0.5), rgba(26,111,212,0.3))',
              }}
            />
            <h2 className="text-2xl font-black text-text-primary mb-6">
              Adicionar ao Portfolio
            </h2>
            <div className="space-y-5">
              <div
                className="p-5 space-y-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
                    Token
                  </p>
                  <p className="text-text-primary font-bold text-lg">
                    {addingOnChain.token.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
                    Nome
                  </p>
                  <p className="text-text-primary">{addingOnChain.token.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
                    Quantidade
                  </p>
                  <p className="text-text-primary font-mono">
                    {addingOnChain.token.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 8,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">
                    CoinGecko ID
                  </p>
                  <p className="text-cyan font-mono text-xs">{addingOnChain.token.coinId}</p>
                </div>
              </div>
              <p className="text-xs text-text-tertiary bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                O ativo sera adicionado com preco medio $0. Pode editar depois.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => dispatch({ type: PORTFOLIO_ACTIONS.ONCHAIN_CLEAR })}
                  className="flex-1 px-4 py-3 rounded-lg font-bold text-text-secondary bg-bg-quaternary hover:bg-bg-quaternary/80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-cyan/50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOnChainAsset}
                  disabled={modal.isSaving}
                  className="flex-1 bg-cyan text-bg px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-cyan/50 hover:shadow-cyan"
                >
                  {modal.isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Portfolio — page component (public export)
// ---------------------------------------------------------------------------

/**
 * Portfolio — page-level component.
 *
 * Mounts PortfolioProvider which owns all Firestore/price/on-chain state,
 * then renders PortfolioContent which consumes that context.
 *
 * @returns {React.ReactElement}
 */
export default function Portfolio() {
  return (
    <PortfolioProvider>
      <PortfolioContent />
    </PortfolioProvider>
  );
}
