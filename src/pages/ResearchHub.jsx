import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { Book, Search, Filter, Loader2, AlertTriangle } from 'lucide-react';

const RESEARCH_CATEGORIES = ['Análise Técnica', 'DeFi', 'NFT', 'Regulação', 'Blockchain', 'Web3'];

/**
 * ResearchHub — Consumer page to view published research documents
 *
 * Features:
 * - Real-time sync from /research collection
 * - Filter by published status
 * - Tier-based access control (show only content <= user.tier)
 * - Search by title
 * - Filter by category
 * - Grid layout with cards
 * - Navigate to detail page on click
 *
 * Firestore:
 * - Reads from /research/{docId}
 * - Filters: status == 'published'
 * - Client-side filtering by: targetTier <= user.tier
 */
export default function ResearchHub() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const [research, setResearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const unsubscribeRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    // Prevent duplicate listener setup (React StrictMode compatibility)
    if (unsubscribeRef.current) return;

    const q = query(collection(db, 'research'), where('status', '==', 'published'));
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

        // Filter by tier: only show content accessible to user's tier
        const tierRank = { free: 0, pro: 1, vip: 2, admin: 3, assessor: 2 };
        const userTierRank = tierRank[userTier] || 0;
        const filtered = data.filter(doc => (tierRank[doc.targetTier] || 0) <= userTierRank);

        setResearch(
          filtered.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error loading research:', err);
        setError('Erro ao carregar pesquisas');
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
  }, [userTier]);

  // Filter research based on search and category
  const filteredResearch = research.filter((doc) => {
    const matchesSearch =
      !searchText || doc.title?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#07090C] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Book className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Centro de Pesquisa</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Análises técnicas, insights de DeFi e relatórios de mercado curados pelo time Mercurius
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar pesquisas..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Todas
            </button>
            {RESEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {cat}
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
        ) : filteredResearch.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
            <Book className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchText || selectedCategory
                ? 'Nenhuma pesquisa encontrada com os critérios de busca.'
                : 'Nenhuma pesquisa publicada ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResearch.map((doc) => (
              <div
                key={doc.firestoreId}
                onClick={() => navigate(`/research/${doc.firestoreId}`)}
                className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer group"
              >
                {/* Hero Image */}
                {doc.heroImage && (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-600 to-purple-600 overflow-hidden">
                    <img
                      src={doc.heroImage}
                      alt={doc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  {doc.category && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full mb-2">
                      {doc.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>

                  {/* Preview Text */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {doc.content || 'Sem descrição disponível'}
                  </p>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-800/50 text-gray-400 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-800">
                    <span>
                      {doc.createdAt
                        ? new Date(doc.createdAt.toDate?.() || doc.createdAt).toLocaleDateString(
                            'pt-BR'
                          )
                        : 'Data desconhecida'}
                    </span>
                    {doc.targetTier && (
                      <span className="text-blue-400 font-semibold uppercase text-xs">
                        {doc.targetTier}+
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
