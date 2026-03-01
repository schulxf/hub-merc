import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SUPPORTED_COINS } from '../../data/mockDb';

const EMPTY_STRATEGY_FORM = {
  name: '',
  riskProfile: 'medium',
  status: 'draft',
  description: '',
  allocations: [],
  coins: [],
  minTier: 'pro',
};

const RISK_PROFILES = ['low', 'medium', 'high'];
const STATUSES = ['draft', 'published', 'archived'];
const MIN_TIERS = ['free', 'pro', 'vip'];

/**
 * AdminStrategyTab — Tab for managing DeFi strategies
 *
 * Allows admins/assessors to create and manage investment strategies
 * that clients can follow. Includes allocation rules and risk profiles.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminStrategyTab({ onError }) {
  const [strategies, setStrategies] = useState([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [strategyForm, setStrategyForm] = useState(EMPTY_STRATEGY_FORM);
  const [selectedStrategyId, setSelectedStrategyId] = useState(null);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const unsubscribeRef = useRef(null);

  // Fetch all strategies
  useEffect(() => {
    // Prevent duplicate listener setup (React StrictMode compatibility)
    if (unsubscribeRef.current) return;

    const strategiesColl = collection(db, 'strategies');
    const unsubscribe = onSnapshot(
      strategiesColl,
      (snapshot) => {
        const strategiesData = [];
        snapshot.forEach((doc) => {
          strategiesData.push({ firestoreId: doc.id, ...doc.data() });
        });
        setStrategies(strategiesData);
        setLoadingStrategies(false);
      },
      (error) => {
        console.error('Erro ao carregar estratégias:', error);
        if (onError) onError('Erro ao carregar estratégias de investimento');
        setLoadingStrategies(false);
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

  const handleSelectStrategy = (item) => {
    setEditingId(item.firestoreId);
    setSelectedStrategyId(item.firestoreId);
    setStrategyForm({
      name: item.name,
      riskProfile: item.riskProfile,
      status: item.status,
      description: item.description,
      allocations: item.allocations || [],
      coins: item.coins || [],
      minTier: item.minTier,
    });
  };

  const handleNewStrategy = () => {
    setEditingId(null);
    setSelectedStrategyId(null);
    setStrategyForm(EMPTY_STRATEGY_FORM);
  };

  const handleAddAllocation = () => {
    setStrategyForm({
      ...strategyForm,
      allocations: [
        ...strategyForm.allocations,
        { coinId: 'bitcoin', percentage: 0 },
      ],
    });
  };

  const handleUpdateAllocation = (index, field, value) => {
    const updated = [...strategyForm.allocations];
    updated[index] = { ...updated[index], [field]: value };
    setStrategyForm({ ...strategyForm, allocations: updated });
  };

  const handleRemoveAllocation = (index) => {
    setStrategyForm({
      ...strategyForm,
      allocations: strategyForm.allocations.filter((_, i) => i !== index),
    });
  };

  const handleToggleCoin = (coinId) => {
    setStrategyForm({
      ...strategyForm,
      coins: strategyForm.coins.includes(coinId)
        ? strategyForm.coins.filter((c) => c !== coinId)
        : [...strategyForm.coins, coinId],
    });
  };

  const handleSaveStrategy = async (e) => {
    e.preventDefault();
    if (!strategyForm.name || strategyForm.allocations.length === 0) {
      onError('Nome e pelo menos uma alocação são obrigatórios');
      return;
    }

    const totalPercentage = strategyForm.allocations.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0);
    if (totalPercentage < 99 || totalPercentage > 101) {
      onError(`Total de alocação deve ser 100% (atual: ${totalPercentage}%)`);
      return;
    }

    setIsSavingStrategy(true);
    try {
      const docId = editingId || `strategy_${Date.now()}`;
      const strategyRef = doc(db, 'strategies', docId);
      await setDoc(strategyRef, {
        name: strategyForm.name,
        riskProfile: strategyForm.riskProfile,
        status: strategyForm.status,
        description: strategyForm.description,
        allocations: strategyForm.allocations,
        coins: strategyForm.coins,
        minTier: strategyForm.minTier,
        updatedAt: new Date().toISOString(),
      });

      handleNewStrategy();
    } catch (error) {
      console.error('Erro ao salvar estratégia:', error);
      onError('Erro ao salvar estratégia de investimento');
    } finally {
      setIsSavingStrategy(false);
    }
  };

  const handleDeleteStrategy = async (firestoreId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta estratégia?')) return;

    try {
      await deleteDoc(doc(db, 'strategies', firestoreId));
      if (editingId === firestoreId) {
        handleNewStrategy();
      }
    } catch (error) {
      console.error('Erro ao deletar estratégia:', error);
      onError('Erro ao deletar estratégia');
    }
  };

  const allocationTotal = strategyForm.allocations.reduce(
    (sum, a) => sum + (parseFloat(a.percentage) || 0),
    0
  );

  return (
    <div className="max-w-6xl space-y-6">
      {/* Form Section */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingId ? '✏️ Editar Estratégia' : '📈 Nova Estratégia de Investimento'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Defina uma estratégia de alocação que clientes possam seguir.
        </p>

        <form onSubmit={handleSaveStrategy} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Estratégia *</label>
            <input
              type="text"
              required
              value={strategyForm.name}
              onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Ex: Conservative DeFi"
            />
          </div>

          {/* Risk Profile, Status, Min Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Perfil de Risco *</label>
              <select
                value={strategyForm.riskProfile}
                onChange={(e) => setStrategyForm({ ...strategyForm, riskProfile: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {RISK_PROFILES.map((profile) => (
                  <option key={profile} value={profile}>
                    {profile.charAt(0).toUpperCase() + profile.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status *</label>
              <select
                value={strategyForm.status}
                onChange={(e) => setStrategyForm({ ...strategyForm, status: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-400 mb-1">Nível Mínimo *</label>
              <select
                value={strategyForm.minTier}
                onChange={(e) => setStrategyForm({ ...strategyForm, minTier: e.target.value })}
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
              value={strategyForm.description}
              onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="Descreva a estratégia e seu objetivo..."
            />
          </div>

          {/* Allocations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-400">Alocações (Total: {allocationTotal}%) *</label>
              <button
                type="button"
                onClick={handleAddAllocation}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {strategyForm.allocations.map((alloc, index) => (
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

          {/* Related Coins */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Moedas Relacionadas</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUPPORTED_COINS.map((coin) => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => handleToggleCoin(coin.id)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    strategyForm.coins.includes(coin.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {coin.symbol.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={isSavingStrategy}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
            >
              {isSavingStrategy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {editingId ? 'Atualizar' : 'Criar'} Estratégia
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleNewStrategy}
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
            🎯 Estratégias ({strategies.length})
          </h3>
        </div>

        {loadingStrategies ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Carregando estratégias...</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-gray-500">Nenhuma estratégia criada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {strategies.map((item) => (
              <div
                key={item.firestoreId}
                className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                  editingId === item.firestoreId ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleSelectStrategy(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-white text-sm">{item.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          item.riskProfile === 'low'
                            ? 'bg-green-500/20 text-green-400'
                            : item.riskProfile === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {item.riskProfile.charAt(0).toUpperCase() + item.riskProfile.slice(1)}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          item.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : item.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      {item.allocations && item.allocations.map((alloc) => (
                        <span key={alloc.coinId} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                          {SUPPORTED_COINS.find((c) => c.id === alloc.coinId)?.symbol.toUpperCase()}: {alloc.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStrategy(item.firestoreId);
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
