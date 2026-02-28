import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { TrendingUp, Search, Filter, Loader2, AlertTriangle, Heart } from 'lucide-react';

const RISK_LEVELS = ['low', 'medium', 'high'];
const RISK_COLORS = {
  low: { badge: 'bg-green-500/20 text-green-300', bar: 'bg-green-500' },
  medium: { badge: 'bg-yellow-500/20 text-yellow-300', bar: 'bg-yellow-500' },
  high: { badge: 'bg-red-500/20 text-red-300', bar: 'bg-red-500' },
};

const RISK_LABELS = {
  low: 'Risco Baixo',
  medium: 'Risco Médio',
  high: 'Risco Alto',
};

/**
 * StrategiesMarketplace — Consumer page for investment strategies
 *
 * Features:
 * - Real-time sync from /strategies collection
 * - Filter by published status
 * - Tier-based access control
 * - Search by name
 * - Filter by risk level
 * - Visual allocation bars showing coin percentages
 * - Follow strategy action
 *
 * Firestore:
 * - Reads from /strategies/{docId}
 * - Filters: status == 'published'
 * - Client-side filtering by: targetTier <= user.tier
 */
export default function StrategiesMarketplace() {
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [followedStrategies, setFollowedStrategies] = useState(new Set());
  const unsubscribeRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    if (unsubscribeRef.current) return;

    const q = query(collection(db, 'strategies'), where('status', '==', 'published'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({
            firestoreId: doc.id,
            ...doc.data(),
          });
        });

        // Filter by tier
        const tierRank = { free: 0, pro: 1, vip: 2, admin: 3, assessor: 2 };
        const userTierRank = tierRank[userTier] || 0;
        const filtered = data.filter(doc => (tierRank[doc.targetTier] || 0) <= userTierRank);

        setStrategies(
          filtered.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error loading strategies:', err);
        setError('Erro ao carregar estratégias');
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, userTier]);

  // Filter strategies
  const filteredStrategies = strategies.filter((strategy) => {
    const matchesSearch =
      !searchText || strategy.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesRisk = !selectedRisk || strategy.riskProfile === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const toggleFollow = (strategyId) => {
    setFollowedStrategies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId);
      } else {
        newSet.add(strategyId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-[#07090C] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Mercado de Estratégias</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Estratégias de investimento curadas, com diferentes perfis de risco
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar estratégias..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <button
              onClick={() => setSelectedRisk('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRisk === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Todos
            </button>
            {RISK_LEVELS.map((risk) => (
              <button
                key={risk}
                onClick={() => setSelectedRisk(risk)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRisk === risk
                    ? `${RISK_COLORS[risk].badge} bg-opacity-30 border border-current`
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {RISK_LABELS[risk]}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filteredStrategies.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchText || selectedRisk
                ? 'Nenhuma estratégia encontrada com os critérios de busca.'
                : 'Nenhuma estratégia publicada ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStrategies.map((strategy) => (
              <div
                key={strategy.firestoreId}
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
              >
                {/* Header with Risk Badge and Follow Button */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {strategy.name}
                    </h3>
                    {strategy.riskProfile && (
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          RISK_COLORS[strategy.riskProfile].badge
                        }`}
                      >
                        {RISK_LABELS[strategy.riskProfile]}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFollow(strategy.firestoreId)}
                    className={`p-2 rounded-lg transition-colors ${
                      followedStrategies.has(strategy.firestoreId)
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={followedStrategies.has(strategy.firestoreId) ? 'currentColor' : 'none'}
                    />
                  </button>
                </div>

                {/* Description */}
                {strategy.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{strategy.description}</p>
                )}

                {/* Allocation Bars */}
                {strategy.allocations && strategy.allocations.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Alocação</p>
                    {strategy.allocations.slice(0, 5).map((alloc, idx) => {
                      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-green-500'];
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span className="font-medium">{alloc.symbol}</span>
                            <span>{alloc.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colors[idx % colors.length]}`}
                              style={{ width: `${alloc.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {strategy.allocations.length > 5 && (
                      <p className="text-xs text-gray-500">+{strategy.allocations.length - 5} moedas</p>
                    )}
                  </div>
                )}

                {/* Tier & Date Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
                  <span>
                    {strategy.createdAt
                      ? new Date(strategy.createdAt.toDate?.() || strategy.createdAt).toLocaleDateString(
                          'pt-BR'
                        )
                      : 'Data desconhecida'}
                  </span>
                  {strategy.targetTier && (
                    <span className="text-blue-400 font-semibold uppercase text-xs">
                      {strategy.targetTier}+
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
