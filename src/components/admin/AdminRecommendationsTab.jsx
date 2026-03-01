import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

const RECOMMENDATION_TYPES = [
  { value: 'rebalance', label: 'Rebalanceamento' },
  { value: 'add', label: 'Adicionar Ativo' },
  { value: 'remove', label: 'Remover Ativo' },
  { value: 'replace', label: 'Substituir Ativo' },
  { value: 'general', label: 'Recomendação Geral' },
];

const RECOMMENDATION_STATUS = [
  { value: 'draft', label: 'Rascunho', badge: 'bg-gray-700 text-gray-200' },
  { value: 'sent', label: 'Enviada', badge: 'bg-blue-700 text-blue-200' },
  { value: 'archived', label: 'Arquivada', badge: 'bg-gray-600 text-gray-300' },
];

const EMPTY_FORM = {
  type: 'general',
  targetUserTier: 'pro',
  targetUserId: '',
  recommendationText: '',
  supportingData: '{}',
  status: 'draft',
};

/**
 * AdminRecommendationsTab — Manage recommendations sent to clients by assessors.
 *
 * Features:
 * - Create/edit/delete recommendations
 * - Target by user tier or specific user ID
 * - Support JSON data payload for advanced recommendations
 * - Real-time sync from Firestore
 * - Draft/sent/archived status tracking
 *
 * Firestore: /recommendations/{recId}
 * - type: enum (rebalance, add, remove, replace, general)
 * - targetUserTier: enum (free, pro, vip) or null if targetUserId
 * - targetUserId: string | null (specific user override)
 * - recommendationText: string (markdown or plain text)
 * - supportingData: JSON string (optional metadata)
 * - status: enum (draft, sent, archived)
 * - createdBy: string (assessor UID)
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */
export default function AdminRecommendationsTab({ onError = () => {} }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recForm, setRecForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const unsubscribeRef = useRef(null);

  // Real-time sync from Firestore
  useEffect(() => {
    // Prevent duplicate listener setup (React StrictMode compatibility)
    if (unsubscribeRef.current) return;

    const coll = collection(db, 'recommendations');
    const unsubscribe = onSnapshot(
      coll,
      (snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({
            firestoreId: doc.id,
            ...doc.data(),
          });
        });
        setRecommendations(data.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime - aTime;
        }));
        setLoadingRecs(false);
      },
      (error) => {
        console.error('Error loading recommendations:', error);
        if (onError) onError(`Erro ao carregar recomendações: ${error.message}`);
        setLoadingRecs(false);
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

  const validateForm = () => {
    if (!recForm.type) return 'Selecione um tipo de recomendação';
    if (!recForm.recommendationText.trim()) return 'Texto da recomendação é obrigatório';
    if (!recForm.targetUserTier && !recForm.targetUserId) {
      return 'Escolha um tier alvo ou um ID de usuário específico';
    }
    if (recForm.supportingData.trim()) {
      try {
        JSON.parse(recForm.supportingData);
        setJsonError('');
      } catch (e) {
        return 'JSON inválido em "Dados de Suporte"';
      }
    }
    return '';
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      onError(error);
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        type: recForm.type,
        targetUserTier: recForm.targetUserId ? null : recForm.targetUserTier,
        targetUserId: recForm.targetUserId || null,
        recommendationText: recForm.recommendationText,
        supportingData: recForm.supportingData.trim() || '{}',
        status: recForm.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        const docRef = doc(db, 'recommendations', editingId);
        await updateDoc(docRef, payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.createdBy = 'admin'; // TODO: get actual user UID from auth
        await addDoc(collection(db, 'recommendations'), payload);
      }

      setRecForm(EMPTY_FORM);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving recommendation:', error);
      onError(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (rec) => {
    setRecForm({
      type: rec.type || 'general',
      targetUserTier: rec.targetUserTier || 'pro',
      targetUserId: rec.targetUserId || '',
      recommendationText: rec.recommendationText || '',
      supportingData: rec.supportingData || '{}',
      status: rec.status || 'draft',
    });
    setEditingId(rec.firestoreId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar esta recomendação?')) return;
    try {
      await deleteDoc(doc(db, 'recommendations', id));
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      onError(`Erro ao apagar: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setRecForm(EMPTY_FORM);
    setEditingId(null);
    setJsonError('');
  };

  const getStatusBadge = (status) => {
    const st = RECOMMENDATION_STATUS.find((s) => s.value === status);
    return st ? st.badge : 'bg-gray-700 text-gray-200';
  };

  const getTypeLabel = (type) => {
    const t = RECOMMENDATION_TYPES.find((r) => r.value === type);
    return t ? t.label : type;
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          {editingId ? 'Editar Recomendação' : 'Nova Recomendação'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
            <select
              value={recForm.type}
              onChange={(e) => setRecForm({ ...recForm, type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RECOMMENDATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target (Tier or User ID) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Alvo (Tier ou User ID)
            </label>
            <div className="flex gap-2">
              <select
                value={recForm.targetUserTier}
                onChange={(e) =>
                  setRecForm({ ...recForm, targetUserTier: e.target.value, targetUserId: '' })
                }
                disabled={!!recForm.targetUserId}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Selecionar...</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
              </select>
              <input
                type="text"
                placeholder="ou User ID..."
                value={recForm.targetUserId}
                onChange={(e) =>
                  setRecForm({ ...recForm, targetUserId: e.target.value, targetUserTier: '' })
                }
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <select
              value={recForm.status}
              onChange={(e) => setRecForm({ ...recForm, status: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RECOMMENDATION_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recommendation Text */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Texto da Recomendação *
          </label>
          <textarea
            value={recForm.recommendationText}
            onChange={(e) =>
              setRecForm({ ...recForm, recommendationText: e.target.value })
            }
            placeholder="Descreva a recomendação em detalhes..."
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Supporting Data (JSON) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Dados de Suporte (JSON opcional)
          </label>
          <textarea
            value={recForm.supportingData}
            onChange={(e) => {
              setRecForm({ ...recForm, supportingData: e.target.value });
              // Validate JSON
              if (e.target.value.trim()) {
                try {
                  JSON.parse(e.target.value);
                  setJsonError('');
                } catch (err) {
                  setJsonError('JSON inválido');
                }
              } else {
                setJsonError('');
              }
            }}
            placeholder='{"coins": ["bitcoin", "ethereum"], "targetPercentage": 50}'
            rows={3}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${
              jsonError ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-blue-500'
            }`}
          />
          {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {editingId && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saveLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Salvar Recomendação
              </>
            )}
          </button>
        </div>
      </div>

      {/* List Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-500" />
          Recomendações ({recommendations.length})
        </h3>

        {loadingRecs ? (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-gray-400">Nenhuma recomendação criada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.firestoreId}
                className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">
                        {getTypeLabel(rec.type)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(rec.status)}`}>
                        {RECOMMENDATION_STATUS.find((s) => s.value === rec.status)?.label ||
                          rec.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Alvo:{' '}
                      <span className="text-gray-300 font-medium">
                        {rec.targetUserId ? `User: ${rec.targetUserId}` : `Tier: ${rec.targetUserTier}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(rec)}
                      className="px-3 py-2 rounded-lg bg-gray-800 text-blue-400 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(rec.firestoreId)}
                      className="px-3 py-2 rounded-lg bg-gray-800 text-red-400 text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar
                    </button>
                  </div>
                </div>

                <p className="text-white text-sm leading-relaxed mb-4">
                  {rec.recommendationText}
                </p>

                {rec.supportingData && rec.supportingData !== '{}' && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-400 font-mono">
                      {rec.supportingData}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
                  <span>
                    Criada por: <span className="text-gray-400">{rec.createdBy || 'Sistema'}</span>
                  </span>
                  <span>
                    {rec.createdAt
                      ? new Date(rec.createdAt.toDate?.() || rec.createdAt).toLocaleDateString(
                          'pt-BR'
                        )
                      : 'Data desconhecida'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
