import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const EMPTY_RESEARCH_FORM = {
  title: '',
  category: 'defi',
  status: 'draft',
  content: '',
  tags: [],
  minTier: 'pro',
  publishDate: new Date().toISOString().split('T')[0],
};

const CATEGORIES = ['defi', 'nft', 'l2', 'macro', 'governance', 'security'];
const STATUSES = ['draft', 'published', 'archived'];
const MIN_TIERS = ['free', 'pro', 'vip'];

/**
 * AdminResearchTab — Tab for managing research documents
 *
 * Allows admins to create, edit, and delete research documents stored in the
 * Firestore 'research' collection. Supports categories, status, and tier requirements.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminResearchTab({ onError }) {
  const [research, setResearch] = useState([]);
  const [loadingResearch, setLoadingResearch] = useState(true);
  const [researchForm, setResearchForm] = useState(EMPTY_RESEARCH_FORM);
  const [selectedResearchId, setSelectedResearchId] = useState(null);
  const [isSavingResearch, setIsSavingResearch] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const unsubscribeRef = useRef(null);

  // Fetch all research documents
  useEffect(() => {
    // Prevent duplicate listener setup (React StrictMode compatibility)
    if (unsubscribeRef.current) return;

    const researchColl = collection(db, 'research');
    const unsubscribe = onSnapshot(
      researchColl,
      (snapshot) => {
        const researchData = [];
        snapshot.forEach((doc) => {
          researchData.push({ firestoreId: doc.id, ...doc.data() });
        });
        setResearch(researchData);
        setLoadingResearch(false);
      },
      (error) => {
        console.error('Erro ao carregar pesquisas:', error);
        if (onError) onError('Erro ao carregar documentos de pesquisa');
        setLoadingResearch(false);
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

  const handleSelectResearch = (item) => {
    setEditingId(item.firestoreId);
    setSelectedResearchId(item.firestoreId);
    setResearchForm({
      title: item.title,
      category: item.category,
      status: item.status,
      content: item.content,
      tags: item.tags || [],
      minTier: item.minTier,
      publishDate: item.publishDate,
    });
  };

  const handleNewResearch = () => {
    setEditingId(null);
    setSelectedResearchId(null);
    setResearchForm(EMPTY_RESEARCH_FORM);
  };

  const handleClearForm = () => {
    setEditingId(null);
    setSelectedResearchId(null);
    setResearchForm(EMPTY_RESEARCH_FORM);
  };

  const handleAddTag = () => {
    if (!researchForm.tags) {
      setResearchForm({ ...researchForm, tags: [] });
    }
    setResearchForm({
      ...researchForm,
      tags: [...researchForm.tags, ''],
    });
  };

  const handleUpdateTag = (index, value) => {
    const updatedTags = [...researchForm.tags];
    updatedTags[index] = value;
    setResearchForm({ ...researchForm, tags: updatedTags });
  };

  const handleRemoveTag = (index) => {
    setResearchForm({
      ...researchForm,
      tags: researchForm.tags.filter((_, i) => i !== index),
    });
  };

  const handleSaveResearch = async (e) => {
    e.preventDefault();
    if (!researchForm.title || !researchForm.content) {
      onError('Título e conteúdo são obrigatórios');
      return;
    }

    setIsSavingResearch(true);
    try {
      const docId = editingId || `research_${Date.now()}`;
      const researchRef = doc(db, 'research', docId);
      await setDoc(researchRef, {
        title: researchForm.title,
        category: researchForm.category,
        status: researchForm.status,
        content: researchForm.content,
        tags: researchForm.tags.filter(t => t.trim()),
        minTier: researchForm.minTier,
        publishDate: researchForm.publishDate,
        updatedAt: new Date().toISOString(),
      });

      handleClearForm();
    } catch (error) {
      console.error('Erro ao salvar pesquisa:', error);
      onError('Erro ao salvar documento de pesquisa');
    } finally {
      setIsSavingResearch(false);
    }
  };

  const handleDeleteResearch = async (firestoreId) => {
    if (!window.confirm('Tem certeza que deseja deletar este documento?')) return;

    try {
      await deleteDoc(doc(db, 'research', firestoreId));
      if (editingId === firestoreId) {
        handleClearForm();
      }
    } catch (error) {
      console.error('Erro ao deletar pesquisa:', error);
      onError('Erro ao deletar documento');
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Form Section */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">
          {editingId ? '✏️ Editar Documento' : '📝 Novo Documento de Pesquisa'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Crie e gerencie documentos de pesquisa para compartilhar com clientes.
        </p>

        <form onSubmit={handleSaveResearch} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Título *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={researchForm.title}
              onChange={(e) => setResearchForm({ ...researchForm, title: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="Ex: DeFi Yield Farming Guide"
            />
            <p className="text-xs text-gray-500 mt-1">
              {researchForm.title.length}/200 caracteres
            </p>
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Categoria *</label>
              <select
                value={researchForm.category}
                onChange={(e) => setResearchForm({ ...researchForm, category: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status *</label>
              <select
                value={researchForm.status}
                onChange={(e) => setResearchForm({ ...researchForm, status: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Min Tier & Publish Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nível Mínimo *</label>
              <select
                value={researchForm.minTier}
                onChange={(e) => setResearchForm({ ...researchForm, minTier: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              >
                {MIN_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Data de Publicação</label>
              <input
                type="date"
                value={researchForm.publishDate}
                onChange={(e) => setResearchForm({ ...researchForm, publishDate: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Conteúdo (Markdown) *</label>
            <textarea
              required
              value={researchForm.content}
              onChange={(e) => setResearchForm({ ...researchForm, content: e.target.value })}
              rows={8}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 font-mono text-sm"
              placeholder="# Título do Documento&#10;&#10;Escreva seu conteúdo em Markdown..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tags (opcional)</label>
            <div className="space-y-2 mb-3">
              {researchForm.tags && researchForm.tags.map((tag, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleUpdateTag(index, e.target.value)}
                    className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-blue-500"
                    placeholder="Ex: defi, yield, farming"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="text-gray-600 hover:text-red-400 p-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddTag}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Adicionar Tag
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={isSavingResearch}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
            >
              {isSavingResearch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {editingId ? 'Atualizar' : 'Criar'} Documento
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleClearForm}
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
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            📚 Documentos de Pesquisa ({research.length})
          </h3>
          {research.length > 0 && (
            <button
              onClick={handleNewResearch}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Novo Documento
            </button>
          )}
        </div>

        {loadingResearch ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Carregando documentos...</p>
          </div>
        ) : research.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-gray-500 mb-4">Nenhum documento de pesquisa criado ainda.</p>
            <button
              onClick={handleNewResearch}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Criar primeiro documento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {research.map((item) => (
              <div
                key={item.firestoreId}
                className={`p-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                  editingId === item.firestoreId ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleSelectResearch(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-white text-sm">{item.title}</h4>
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
                      <span className="text-xs text-gray-500">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{item.content.substring(0, 100)}...</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {item.tags && item.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteResearch(item.firestoreId);
                    }}
                    className="text-gray-600 hover:text-red-400 p-2 transition-colors flex-shrink-0"
                    title="Remover documento"
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
