import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { ArrowLeft, Loader2, AlertTriangle, Calendar, Tag, Lock } from 'lucide-react';

/**
 * ResearchDetail — Full research document viewer with tier-gating
 *
 * Features:
 * - Fetch single research document by ID
 * - Tier-based access control (show "Upgrade Required" if user doesn't have access)
 * - Breadcrumb navigation
 * - Markdown or plain text rendering
 * - Author, category, tags, and creation date info
 * - Back to Research Hub link
 *
 * Firestore:
 * - Reads from /research/{docId}
 * - Checks targetTier <= user.tier
 */
export default function ResearchDetail() {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.currentUser || !docId) return;

    const fetchResearch = async () => {
      try {
        const docRef = doc(db, 'research', docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('Pesquisa não encontrada');
          setLoading(false);
          return;
        }

        setResearch({
          firestoreId: docSnap.id,
          ...docSnap.data(),
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching research:', err);
        setError('Erro ao carregar pesquisa');
        setLoading(false);
      }
    };

    fetchResearch();
  }, [user, docId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090C] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !research) {
    return (
      <div className="min-h-screen bg-[#07090C] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/research')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Pesquisas
          </button>

          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error || 'Pesquisa não encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Tier-gating check
  const tierRank = { free: 0, pro: 1, vip: 2, admin: 3, assessor: 2 };
  const userTierRank = tierRank[userTier] || 0;
  const docTierRank = tierRank[research.targetTier] || 0;
  const hasAccess = docTierRank <= userTierRank;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#07090C] py-12">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate('/research')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Pesquisas
          </button>

          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-12 text-center">
            <Lock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h2>
            <p className="text-gray-400 mb-6">
              Este conteúdo é exclusivo para utilizadores tier <span className="font-semibold text-blue-400 uppercase">{research.targetTier}</span> ou
              superior.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/research')}
                className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Explorar Outras Pesquisas
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Fazer Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090C] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/research')}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Pesquisas
        </button>

        {/* Hero Image */}
        {research.heroImage && (
          <div className="w-full h-64 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl overflow-hidden mb-8">
            <img
              src={research.heroImage}
              alt={research.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          {/* Category Badge */}
          {research.category && (
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full mb-4">
              {research.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">{research.title}</h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
            {research.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(research.createdAt.toDate?.() || research.createdAt).toLocaleDateString(
                  'pt-BR'
                )}
              </div>
            )}
            {research.targetTier && (
              <span className="text-blue-400 font-semibold uppercase text-xs">
                {research.targetTier}+
              </span>
            )}
            {research.createdBy && (
              <span>Por: <span className="text-gray-300">{research.createdBy}</span></span>
            )}
          </div>

          {/* Tags */}
          {research.tags && research.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {research.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 mb-8" />

        {/* Content Section */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-8 mb-8">
          {/* Description */}
          {research.description && (
            <div className="mb-8">
              <p className="text-gray-300 text-lg leading-relaxed">{research.description}</p>
            </div>
          )}

          {/* Main Content (Markdown/Plain Text) */}
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {research.content || research.recommendationText || 'Sem conteúdo disponível'}
            </div>
          </div>

          {/* Supporting Data if present */}
          {research.supportingData && research.supportingData !== '{}' && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Dados de Suporte</h3>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-300 font-mono">
                  {JSON.stringify(
                    typeof research.supportingData === 'string'
                      ? JSON.parse(research.supportingData)
                      : research.supportingData,
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 mb-4">Gostou desta pesquisa?</p>
          <button
            onClick={() => navigate('/research')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explorar Mais Pesquisas
          </button>
        </div>
      </div>
    </div>
  );
}
