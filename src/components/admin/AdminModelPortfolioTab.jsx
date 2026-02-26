import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SUPPORTED_COINS } from '../../data/mockDb';

const EMPTY_PORTFOLIO_FORM = {
  name: '',
  status: 'draft',
  description: '',
  targetAllocation: [],
  minInvestment: 1000,
  maxInvestment: 1000000,
  riskLevel: 'medium',
  minTier: 'pro',
  coins: [],
};

const STATUSES = ['draft', 'published'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const MIN_TIERS = ['free', 'pro', 'vip'];

/**
 * AdminModelPortfolioTab — Tab for managing model portfolios
 *
 * Allows admins to create reference portfolios that clients can
 * view and optionally import into their own accounts.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminModelPortfolioTab({ onError }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loadingPortfolios, setLoadingPortfolios] = useState(true);
  const [portfolioForm, setPortfolioForm] = useState(EMPTY_PORTFOLIO_FORM);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const unsubscribeRef = useRef(null);

  // Fetch all model portfolios
  useEffect(() => {
    // Prevent duplicate listener setup (React StrictMode compatibility)
    if (unsubscribeRef.current) return;

    const portfoliosColl = collection(db, 'model_portfolios');
    const unsubscribe = onSnapshot(
      portfoliosColl,
      (snapshot) => {
        const portfoliosData = [];
        snapshot.forEach((doc) => {
          portfoliosData.push({ firestoreId: doc.id, ...doc.data() });
        });
        setPortfolios(portfoliosData);
        setLoadingPortfolios(false);
      },
      (error) => {
        console.error('Erro ao carregar portfólios modelo:', error);
        if (onError) onError('Erro ao carregar portfólios modelo');
        setLoadingPortfolios(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const handleSelectPortfolio = (item) => {
    setEditingId(item.firestoreId);
    setSelectedPortfolioId(item.firestoreId);
    setPortfolioForm({
      name: item.name,
      status: item.status,
      description: item.description,
      targetAllocation: item.targetAllocation || [],
      minInvestment: item.minInvestment,
      maxInvestment: item.maxInvestment,
      riskLevel: item.riskLevel,
      minTier: item.minTier,
      coins: item.coins || [],
    });
  };

  const handleNewPortfolio = () => {
    setEditingId(null);
    setSelectedPortfolioId(null);
    setPortfolioForm(EMPTY_PORTFOLIO_FORM);
  };

  const handleAddAllocation = () => {
    setPortfolioForm({
      ...portfolioForm,
      targetAllocation: [
        ...portfolioForm.targetAllocation,
        { coinId: 'bitcoin', percentage: 0 },
      ],
    });
  };

  const handleUpdateAllocation = (index, field, value) => {
    const updated = [...portfolioForm.targetAllocation];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioForm({ ...portfolioForm, targetAllocation: updated });
  };

  const handleRemoveAllocation = (index) => {
    setPortfolioForm({
      ...portfolioForm,
      targetAllocation: portfolioForm.targetAllocation.filter((_, i) => i !== index),
    });
  };

  const handleToggleCoin = (coinId) => {
    setPortfolioForm({
      ...portfolioForm,
      coins: portfolioForm.coins.includes(coinId)
        ? portfolioForm.coins.filter((c) => c !== coinId)
        : [...portfolioForm.coins, coinId],
    });
  };

  const handleSavePortfolio = async (e) => {
    e.preventDefault();
    if (!portfolioForm.name || portfolioForm.targetAllocation.length === 0) {
      onError('Nome e pelo menos uma alocação são obrigatórios');
      return;
    }

    if (portfolioForm.minInvestment >= portfolioForm.maxInvestment) {
      onError('Investimento mínimo deve ser menor que o máximo');
      return;
    }

    const totalPercentage = portfolioForm.targetAllocation.reduce(
      (sum, a) => sum + (parseFloat(a.percentage) || 0),
      0
    );
    if (totalPercentage < 99 || totalPercentage > 101) {
      onError(`Total de alocação deve ser 100% (atual: ${totalPercentage}%)`);
      return;
    }

    setIsSavingPortfolio(true);
    try {
      const docId = editingId || `portfolio_${Date.now()}`;
      const portfolioRef = doc(db, 'model_portfolios', docId);
      await setDoc(portfolioRef, {
        name: portfolioForm.name,
        status: portfolioForm.status,
        description: portfolioForm.description,
        targetAllocation: portfolioForm.targetAllocation,
        minInvestment: portfolioForm.minInvestment,
        maxInvestment: portfolioForm.maxInvestment,
        riskLevel: portfolioForm.riskLevel,
        minTier: portfolioForm.minTier,
        coins: portfolioForm.coins,
        updatedAt: new Date().toISOString(),
      });

      handleNewPortfolio();
    } catch (error) {
      console.error('Erro ao salvar portfólio:', error);
      onError('Erro ao salvar portfólio modelo');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleDeletePortfolio = async (firestoreId) => {
    if (!window.confirm('Tem certeza que deseja deletar este portfólio?')) return;

    try {
      await deleteDoc(doc(db, 'model_portfolios', firestoreId));
      if (editingId === firestoreId) {
        handleNewPortfolio();
      }
    } catch (error) {
      console.error('Erro ao deletar portfólio:', error);
      onError('Erro ao deletar portfólio modelo');
    }
  };

  const allocationTotal = portfolioForm.targetAllocation.reduce(
    (sum, a) => sum + (parseFloat(a.percentage) || 0),
    0
  );

  return (
    <div className="max-w-6xl space-y-6">
      {/* Form Section */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingId ? '✏️ Editar Portfólio' : '💼 Novo Portfólio Modelo'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Crie um portfólio modelo que clientes possam usar como referência.
        </p>

        <form onSubmit={handleSavePortfolio} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Portfólio *</label>
            <input
              type="text"
              required
              value={portfolioForm.name}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Ex: Balanced Growth Portfolio"
            />
          </div>

          {/* Status, Risk Level, Min Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status *</label>
              <select
                value={portfolioForm.status}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, status: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nível de Risco *</label>
              <select
                value={portfolioForm.riskLevel}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, riskLevel: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {RISK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nível Mínimo *</label>
              <select
                value={portfolioForm.minTier}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, minTier: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {MIN_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
            <textarea
              value={portfolioForm.description}
              onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="Descreva o objetivo e características do portfólio..."
            />
          </div>

          {/* Investment Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Investimento Mínimo (USD) *</label>
              <input
                type="number"
                min="100"
                value={portfolioForm.minInvestment}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, minInvestment: parseFloat(e.target.value) })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Investimento Máximo (USD) *</label>
              <input
                type="number"
                min="1000"
                value={portfolioForm.maxInvestment}
                onChange={(e) => setPortfolioForm({ ...portfolioForm, maxInvestment: parseFloat(e.target.value) })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Target Allocations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-400">Alocação Alvo (Total: {allocationTotal}%) *</label>
              <button
                type="button"
                onClick={handleAddAllocation}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {portfolioForm.targetAllocation.map((alloc, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <select
                    value={alloc.coinId}
                    onChange={(e) => handleUpdateAllocation(index, 'coinId', e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                  >
                    {SUPPORTED_COINS.map((coin) => (
                      <option key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={alloc.percentage}
                    onChange={(e) => handleUpdateAllocation(index, 'percentage', parseFloat(e.target.value))}
                    className="w-20 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                    placeholder="%"
                  />
                  <span className="text-gray-500 text-sm">%</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllocation(index)}
                    className="text-gray-600 hover:text-red-400 p-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {allocationTotal !== 100 && (
              <p className={`text-xs ${allocationTotal === 0 ? 'text-gray-500' : 'text-yellow-500'}`}>
                Total deve ser 100% (atual: {allocationTotal}%)
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={isSavingPortfolio}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
            >
              {isSavingPortfolio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {editingId ? 'Atualizar' : 'Criar'} Portfólio
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleNewPortfolio}
                className="text-gray-400 hover:text-gray-300 font-medium py-3 px-6"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            📊 Portfólios Modelo ({portfolios.length})
          </h3>
        </div>

        {loadingPortfolios ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Carregando portfólios...</p>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-gray-500">Nenhum portfólio modelo criado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {portfolios.map((item) => (
              <div
                key={item.firestoreId}
                className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                  editingId === item.firestoreId ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleSelectPortfolio(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          item.riskLevel === 'low'
                            ? 'bg-green-500/20 text-green-400'
                            : item.riskLevel === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          item.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      ${item.minInvestment?.toLocaleString()} - ${item.maxInvestment?.toLocaleString()}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {item.targetAllocation && item.targetAllocation.map((alloc) => (
                        <span key={alloc.coinId} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                          {SUPPORTED_COINS.find((c) => c.id === alloc.coinId)?.symbol.toUpperCase()}: {alloc.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePortfolio(item.firestoreId);
                    }}
                    className="text-gray-600 hover:text-red-400 p-2 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
