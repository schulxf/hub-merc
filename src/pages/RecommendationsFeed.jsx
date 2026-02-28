import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { useUserProfile } from '../hooks/useUserProfile';
import { Lightbulb, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const RECOMMENDATION_TYPES = {
  rebalance: { label: 'Rebalanceamento', badge: 'bg-blue-500/20 text-blue-300' },
  add: { label: 'Adicionar Ativo', badge: 'bg-green-500/20 text-green-300' },
  remove: { label: 'Remover Ativo', badge: 'bg-red-500/20 text-red-300' },
  replace: { label: 'Substituir Ativo', badge: 'bg-purple-500/20 text-purple-300' },
  general: { label: 'Recomendação Geral', badge: 'bg-gray-500/20 text-gray-300' },
};

/**
 * RecommendationsFeed — Personalized recommendations for the logged-in user
 *
 * Features:
 * - Real-time sync from /recommendations collection
 * - Filter by sent status
 * - Personalized filtering:
 *   - Recommendations for user's tier: targetUserTier === user.tier
 *   - Personal recommendations: targetUserId === user.uid
 * - Mark as read/unread
 * - Display supporting data as JSON
 * - Sort by creation date (newest first)
 *
 * Firestore:
 * - Reads from /recommendations/{docId}
 * - Filters: status == 'sent'
 * - Client-side filtering by: targetUserTier OR targetUserId
 */
export default function RecommendationsFeed() {
  const { profile } = useUserProfile();
  const userTier = profile?.tier || 'free';
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readRecommendations, setReadRecommendations] = useState(new Set());
  const unsubscribeRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    if (unsubscribeRef.current) return;

    const q = query(collection(db, 'recommendations'), where('status', '==', 'sent'));
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

        // Filter recommendations: show if targeted to user's tier OR specifically to this user
        const filtered = data.filter(
          (doc) =>
            doc.targetUserTier === userTier ||
            doc.targetUserId === auth.currentUser.uid
        );

        setRecommendations(
          filtered.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime - aTime;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('Error loading recommendations:', err);
        setError('Erro ao carregar recomendações');
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

  const toggleRead = (recId) => {
    setReadRecommendations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recId)) {
        newSet.delete(recId);
      } else {
        newSet.add(recId);
      }
      return newSet;
    });
  };

  const unreadCount = recommendations.filter((rec) => !readRecommendations.has(rec.firestoreId))
    .length;

  return (
    <div className="min-h-screen bg-[#07090C] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-bold text-white">Recomendações</h1>
            {unreadCount > 0 && (
              <span className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-lg">
            Recomendações personalizadas dos assessores Mercurius
          </p>
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
        ) : recommendations.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-12 text-center">
            <Lightbulb className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Sem Recomendações</h3>
            <p className="text-gray-400">
              Você receberá recomendações personalizadas dos assessores Mercurius em breve.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const isRead = readRecommendations.has(rec.firestoreId);
              const typeInfo = RECOMMENDATION_TYPES[rec.type] || RECOMMENDATION_TYPES.general;

              return (
                <div
                  key={rec.firestoreId}
                  className={`border rounded-xl p-6 transition-all ${
                    isRead
                      ? 'bg-gray-900/30 border-gray-700'
                      : 'bg-blue-500/5 border-blue-500/30 shadow-sm shadow-blue-500/20'
                  }`}
                >
                  {/* Header with Type Badge and Read Toggle */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Indicator */}
                      <div className="mt-1">
                        {isRead ? (
                          <CheckCircle2 className="w-5 h-5 text-gray-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${typeInfo.badge}`}>
                            {typeInfo.label}
                          </span>
                          {rec.targetUserId && (
                            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                              Pessoal
                            </span>
                          )}
                        </div>

                        {/* Recommendation Text */}
                        <p className={`text-sm leading-relaxed mb-3 ${isRead ? 'text-gray-400' : 'text-white'}`}>
                          {rec.recommendationText}
                        </p>

                        {/* Supporting Data */}
                        {rec.supportingData && rec.supportingData !== '{}' && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 font-medium mb-2">Dados de Suporte</p>
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 overflow-x-auto">
                              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                                {JSON.stringify(
                                  typeof rec.supportingData === 'string'
                                    ? JSON.parse(rec.supportingData)
                                    : rec.supportingData,
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Read Toggle Button */}
                    <button
                      onClick={() => toggleRead(rec.firestoreId)}
                      className={`ml-4 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                        isRead
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isRead ? 'Marcar não lido' : 'Marcar lido'}
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {rec.createdAt
                          ? new Date(rec.createdAt.toDate?.() || rec.createdAt).toLocaleDateString(
                              'pt-BR'
                            )
                          : 'Data desconhecida'}
                      </span>
                    </div>
                    {rec.createdBy && (
                      <span className="text-gray-400">
                        Por: <span className="font-medium">{rec.createdBy}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
