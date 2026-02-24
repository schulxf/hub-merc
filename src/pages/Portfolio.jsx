import React, { useState, useCallback } from 'react';
import { AlertCircle, Loader2, Wallet } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SUPPORTED_COINS } from '../data/mockDb';
import { lookupCoinGeckoId } from '../lib/web3Api';

import { PortfolioProvider, usePortfolioContext } from '../components/portfolio/PortfolioContext';
import PortfolioHeader from '../components/portfolio/PortfolioHeader';
import KpiCards from '../components/portfolio/KpiCards';
import PortfolioSidebar from '../components/portfolio/PortfolioSidebar';
import ChartArea from '../components/portfolio/ChartArea';
import ChartAreaEvolution from '../components/portfolio/ChartAreaEvolution';
import AssetTable from '../components/portfolio/AssetTable';

// ---------------------------------------------------------------------------
// PortfolioContent — inner component that consumes PortfolioContext
// ---------------------------------------------------------------------------

/**
 * PortfolioContent — renders the full portfolio UI.
 *
 * Separated from Portfolio so it can call usePortfolioContext() after
 * PortfolioProvider has been mounted in the tree.  All modal state and
 * Firestore write/delete handlers live here.
 *
 * @returns {React.ReactElement}
 */
function PortfolioContent() {
  const {
    portfolioAssets,
    onChainTokens,
    isSyncingOnChain,
    onChainError,
    onChainWarning,
    isLoading,
  } = usePortfolioContext();

  // ===== MODAL STATE =====
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ===== ON-CHAIN IMPORT STATE =====
  const [addingOnChainToken, setAddingOnChainToken] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(null);

  // ===== WARNING STATE (sync without wallets) =====
  const [localSyncWarning, setLocalSyncWarning] = useState('');

  // ===== HANDLERS =====

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !buyPrice) return;

    setIsSaving(true);
    const coin = SUPPORTED_COINS.find((c) => c.id === selectedCoin);

    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', selectedCoin);
      await setDoc(assetRef, {
        coinId: selectedCoin,
        symbol: coin.symbol,
        name: coin.name,
        color: coin.color,
        amount: parseFloat(amount),
        averageBuyPrice: parseFloat(buyPrice),
        updatedAt: new Date().toISOString(),
      });

      setIsModalOpen(false);
      setIsEditingAsset(null);
      setAmount('');
      setBuyPrice('');
      setSelectedCoin('bitcoin');
    } catch (error) {
      console.error('Erro ao guardar ativo:', error);
      alert('Erro ao guardar ativo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAsset = useCallback((asset) => {
    setSelectedCoin(asset.coinId);
    setAmount(asset.amount.toString());
    setBuyPrice(asset.averageBuyPrice.toString());
    setIsEditingAsset(asset.id);
    setIsModalOpen(true);
  }, []);

  const handleCancelModal = useCallback(() => {
    setIsModalOpen(false);
    setIsEditingAsset(null);
    setAmount('');
    setBuyPrice('');
    setSelectedCoin('bitcoin');
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
    setIsEditingAsset(null);
    setSelectedCoin('bitcoin');
    setAmount('');
    setBuyPrice('');
    setIsModalOpen(true);
  }, []);

  /**
   * Placeholder refresh handler — stabilised with useCallback so the reference
   * is identical across renders and PortfolioHeader (React.memo) is not forced
   * to re-render unnecessarily.
   */
  const handleRefresh = useCallback(() => {
    // Future: trigger a manual price refresh via useCryptoPrices
  }, []);

  const handleAddOnChainToken = async (token) => {
    if (!auth.currentUser) return;
    setIsLookingUp(token.id);

    try {
      const cgMatch = await lookupCoinGeckoId(token.symbol);
      const coinId = cgMatch?.id || token.symbol.toLowerCase();

      setAddingOnChainToken({
        coinId,
        symbol: token.symbol,
        name: cgMatch?.name || token.name,
        amount: token.amount,
      });
    } catch (error) {
      console.error('Erro ao buscar token:', error);
    } finally {
      setIsLookingUp(null);
    }
  };

  const handleSaveOnChainAsset = async () => {
    if (!auth.currentUser || !addingOnChainToken) return;
    setIsSaving(true);

    try {
      const t = addingOnChainToken;
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

      setAddingOnChainToken(null);
    } catch (error) {
      console.error('Erro ao guardar ativo on-chain:', error);
      alert('Erro ao guardar ativo. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="animate-in fade-in pb-12 grid gap-5 md:grid-cols-[260px,1fr]">
      {/* SIDEBAR ESQUERDA */}
      <PortfolioSidebar onDeleteAsset={handleRemoveAsset} />

      {/* CONTEÚDO PRINCIPAL */}
      <section className="space-y-6">
        {/* HEADER COM AÇÕES */}
        <PortfolioHeader
          onAddAsset={handleAddAssetClick}
          onRefresh={handleRefresh}
        />

        {/* AVISO SE HOUVER */}
        {(localSyncWarning || onChainWarning || onChainError) && (
          <div className="bg-[#111111] border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-200 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-400" />
            <div>
              {localSyncWarning && <p>{localSyncWarning}</p>}
              {onChainWarning && <p>{onChainWarning}</p>}
              {onChainError && <p>{onChainError}</p>}
            </div>
          </div>
        )}

        {/* KPI CARDS */}
        <KpiCards />

        {/* GRÁFICOS EM GRID 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartArea />
          <ChartAreaEvolution />
        </div>

        {/* TABELA VIRTUALIZED */}
        <AssetTable onDeleteAsset={handleRemoveAsset} />

        {/* SECÇÃO ON-CHAIN TOKENS */}
        {onChainTokens && onChainTokens.length > 0 && (
          <div className="mt-10 bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Visão on-chain das carteiras</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#151515]">
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Token
                    </th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Valor (USD)
                    </th>
                    <th className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {onChainTokens.map((token) => {
                    const alreadyAdded = portfolioAssets.some(
                      (a) => a.symbol?.toUpperCase() === token.symbol?.toUpperCase(),
                    );
                    return (
                      <tr key={token.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{token.symbol}</span>
                            <span className="text-xs text-gray-500">{token.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-gray-100">
                            {token.amount?.toLocaleString('en-US', {
                              minimumFractionDigits: 4,
                              maximumFractionDigits: 8,
                            })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm text-gray-100">
                            {typeof token.valueUsd === 'number'
                              ? `$${token.valueUsd.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : '—'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleAddOnChainToken(token)}
                            disabled={alreadyAdded || isLookingUp === token.id}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed outline-none"
                          >
                            {isLookingUp === token.id ? (
                              <Loader2 className="w-3 h-3 animate-spin inline" />
                            ) : alreadyAdded ? (
                              'Adicionado'
                            ) : (
                              '+ Portfólio'
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
        )}
      </section>

      {/* MODAL ADICIONAR/EDITAR ATIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">
              {isEditingAsset ? 'Editar Ativo' : 'Adicionar Transação'}
            </h2>

            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Moeda</label>
                <select
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors appearance-none"
                >
                  {SUPPORTED_COINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Quantidade Comprada
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 0.5"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Preço Médio de Compra (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Ex: 60000"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition-colors outline-none focus:ring-2 focus:ring-blue-500 select-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none focus:ring-2 focus:ring-blue-500 select-none"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gravar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR IMPORTAÇÃO ON-CHAIN */}
      {addingOnChainToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Adicionar ao Portfólio</h2>
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800 space-y-2">
                <p className="text-sm text-gray-400">
                  Token:{' '}
                  <span className="text-white font-bold">{addingOnChainToken.symbol}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Nome: <span className="text-white">{addingOnChainToken.name}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Quantidade:{' '}
                  <span className="text-white font-mono">
                    {addingOnChainToken.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 8,
                    })}
                  </span>
                </p>
                <p className="text-sm text-gray-400">
                  CoinGecko ID:{' '}
                  <span className="text-blue-400 font-mono text-xs">
                    {addingOnChainToken.coinId}
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-500">
                O ativo será adicionado com preço médio $0. Pode editar depois.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAddingOnChainToken(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition-colors outline-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOnChainAsset}
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
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
