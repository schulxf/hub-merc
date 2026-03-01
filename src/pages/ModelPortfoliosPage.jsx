import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { Briefcase, Search, Loader2, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

const RISK_LEVELS = ['low', 'medium', 'high'];
const RISK_COLORS = {
  low: 'bg-green-500/20 text-green-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-red-500/20 text-red-300',
};
const RISK_LABELS = {
  low: 'Risco Baixo',
  medium: 'Risco Médio',
  high: 'Risco Alto',
};

/**
 * ModelPortfoliosPage — Consumer page for model portfolio templates
 *
 * Features:
 * - Real-time sync from /model_portfolios collection
 * - Filter by published status
 * - Tier-based access control
 * - Search by name
 * - Filter by risk level
 * - Display investment range
 * - "Use as Template" action (imports to user's portfolio)
 *
 * Firestore:
 * - Reads from /model_portfolios/{docId}
 * - Filters: status == 'published'
 * - Writes to users/{uid}/portfolio on import
 */
export default function ModelPortfoliosPage() {
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('');
  const [importing, setImporting] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const unsubscribeRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    if (unsubscribeRef.current) return;

    const q = query(collection(db, 'model_portfolios'), where('status', '==', 'published'));
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

        setPortfolios(
          filtered.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error loading portfolios:', err);
        setError('Erro ao carregar carteiras modelo');
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

  // Filter portfolios
  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch =
      !searchText || portfolio.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesRisk = !selectedRisk || portfolio.riskLevel === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const handleImportTemplate = async (portfolio) => {
    if (!auth.currentUser) return;

    setImporting(portfolio.firestoreId);
    try {
      // Create assets from model portfolio allocations
      const assets = (portfolio.allocations || []).map((alloc) => ({
        symbol: alloc.symbol,
        name: alloc.name || alloc.symbol,
        quantity: 0, // User will adjust this
        currentValue: 0,
        color: alloc.color || '#1A6FD4',
        targetPercentage: alloc.percentage,
        source: 'template',
      }));

      // Add assets to user's portfolio (simplified — in production, would batch write)
      for (const asset of assets) {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/portfolio`), {
          ...asset,
          createdAt: new Date(),
          templateId: portfolio.firestoreId,
        });
      }

      setSuccessMessage(`Carteira "${portfolio.name}" importada com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error importing template:', err);
      setError('Erro ao importar carteira');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090C] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Carteiras Modelo</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Portfólios de referência curados para diferentes perfis e objetivos
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar carteiras..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <TrendingUp className="w-5 h-5 text-gray-500" />
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
                  selectedRisk === risk ? `${RISK_COLORS[risk]} bg-opacity-40` : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {RISK_LABELS[risk]}
              </button>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

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
        ) : filteredPortfolios.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
            <Briefcase className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchText || selectedRisk
                ? 'Nenhuma carteira encontrada com os critérios de busca.'
                : 'Nenhuma carteira modelo publicada ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolios.map((portfolio) => (
              <div
                key={portfolio.firestoreId}
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all flex flex-col"
              >
                {/* Header */}
                <div className="mb-4 flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {portfolio.name}
                  </h3>
                  {portfolio.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{portfolio.description}</p>
                  )}

                  {/* Risk Badge */}
                  {portfolio.riskLevel && (
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-4 ${
                        RISK_COLORS[portfolio.riskLevel]
                      }`}
                    >
                      {RISK_LABELS[portfolio.riskLevel]}
                    </span>
                  )}

                  {/* Investment Range */}
                  {(portfolio.minInvestment || portfolio.maxInvestment) && (
                    <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Faixa de Investimento</p>
                      <div className="flex items-center gap-2 text-sm text-white font-semibold">
                        <DollarSign className="w-4 h-4" />
                        {portfolio.minInvestment?.toLocaleString('pt-BR')} -{' '}
                        {portfolio.maxInvestment?.toLocaleString('pt-BR')} USD
                      </div>
                    </div>
                  )}

                  {/* Allocation Preview */}
                  {portfolio.allocations && portfolio.allocations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium mb-2">Composição</p>
                      <div className="space-y-1">
                        {portfolio.allocations.slice(0, 4).map((alloc, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">{alloc.symbol}</span>
                            <span className="text-gray-300 font-medium">{alloc.percentage}%</span>
                          </div>
                        ))}
                        {portfolio.allocations.length > 4 && (
                          <p className="text-xs text-gray-500 pt-1">
                            +{portfolio.allocations.length - 4} ativos
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with CTA and Tier */}
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleImportTemplate(portfolio)}
                    disabled={importing === portfolio.firestoreId}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    {importing === portfolio.firestoreId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Usar como Template'
                    )}
                  </button>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {portfolio.createdAt
                        ? new Date(
                            portfolio.createdAt.toDate?.() || portfolio.createdAt
                          ).toLocaleDateString('pt-BR')
                        : 'Data desconhecida'}
                    </span>
                    {portfolio.targetTier && (
                      <span className="text-blue-400 font-semibold uppercase">
                        {portfolio.targetTier}+
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
