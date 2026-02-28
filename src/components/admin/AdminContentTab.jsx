import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { uploadAirdropImage, deleteAirdropImage, generateAirdropId } from '../../lib/storage';

const EMPTY_AIRDROP_FORM = {
  name: '',
  type: '',
  cost: '',
  time: '',
  accent: '#D2FF00',
  description: '',
  videoUrl: '',
  image: null,
  imagePreview: null,
  imageUrl: '',
  phases: [],
};

/**
 * AdminContentTab — Tab 4 of AdminPanel (CMS for Airdrop Guides).
 *
 * Allows admins to create, edit, and delete airdrop guides stored in the
 * Firestore 'airdrops' collection. Supports image uploads via Cloud Storage.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminContentTab({ onError }) {
  const [airdrops, setAirdrops] = useState([]);
  const [loadingAirdrops, setLoadingAirdrops] = useState(true);
  const [airdropForm, setAirdropForm] = useState(EMPTY_AIRDROP_FORM);
  const [selectedAirdropId, setSelectedAirdropId] = useState(null);
  const [isSavingAirdrop, setIsSavingAirdrop] = useState(false);

  useEffect(() => {
    const airdropsColl = collection(db, 'airdrops');
    const unsubscribe = onSnapshot(
      airdropsColl,
      (snapshot) => {
        const airdropsData = [];
        snapshot.forEach((doc) => {
          airdropsData.push({ firestoreId: doc.id, ...doc.data() });
        });
        setAirdrops(airdropsData);
        setLoadingAirdrops(false);
      },
      (error) => {
        console.error('Erro ao carregar airdrops:', error);
        setLoadingAirdrops(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSelectAirdrop = (airdrop) => {
    setSelectedAirdropId(airdrop.firestoreId);
    setAirdropForm({
      name: airdrop.name,
      type: airdrop.type,
      cost: airdrop.cost,
      time: airdrop.time,
      accent: airdrop.accent,
      description: airdrop.description,
      videoUrl: airdrop.videoUrl || '',
      image: null,
      imagePreview: airdrop.imageUrl || null,
      imageUrl: airdrop.imageUrl || '',
      phases: airdrop.phases || [],
    });
  };

  const handleClearAirdropForm = () => {
    setSelectedAirdropId(null);
    setAirdropForm(EMPTY_AIRDROP_FORM);
  };

  const handleAirdropImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setAirdropForm((prev) => ({ ...prev, image: file, imagePreview: preview }));
    }
  };

  const handleAddPhase = () => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: [
        ...prev.phases,
        { id: Date.now().toString(), title: '', description: '', tasks: [] },
      ],
    }));
  };

  const handleRemovePhase = (phaseId) => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p.id !== phaseId),
    }));
  };

  const handleUpdatePhase = (phaseId, field, value) => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId ? { ...p, [field]: value } : p
      ),
    }));
  };

  const handleAddTaskToPhase = (phaseId) => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                { id: Date.now().toString(), title: '', desc: '', link: '', subLinks: [] },
              ],
            }
          : p
      ),
    }));
  };

  const handleRemoveTaskFromPhase = (phaseId, taskId) => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p
      ),
    }));
  };

  const handleUpdateTask = (phaseId, taskId, field, value) => {
    setAirdropForm((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, [field]: value } : t
              ),
            }
          : p
      ),
    }));
  };

  const handleSaveAirdrop = async (e) => {
    e.preventDefault();
    if (!airdropForm.name || !airdropForm.type) {
      onError('Preencha ao menos o nome e tipo do airdrop.');
      return;
    }

    setIsSavingAirdrop(true);

    try {
      let imageUrl = airdropForm.imageUrl;
      const airdropId = selectedAirdropId || generateAirdropId(airdropForm.name);

      if (airdropForm.image) {
        if (airdropForm.imageUrl) {
          await deleteAirdropImage(airdropForm.imageUrl);
        }
        imageUrl = await uploadAirdropImage(airdropForm.image, airdropId);
      }

      const airdropRef = doc(db, 'airdrops', airdropId);
      await setDoc(airdropRef, {
        id: airdropId,
        name: airdropForm.name,
        type: airdropForm.type,
        cost: airdropForm.cost,
        time: airdropForm.time,
        accent: airdropForm.accent,
        description: airdropForm.description,
        videoUrl: airdropForm.videoUrl,
        imageUrl,
        layout: 'standard',
        phases: airdropForm.phases,
        createdAt: new Date().toISOString(),
      });

      handleClearAirdropForm();
    } catch (error) {
      console.error('Erro ao salvar airdrop:', error);
      onError(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSavingAirdrop(false);
    }
  };

  const handleDeleteAirdrop = async (airdrop) => {
    if (!window.confirm(`Tem certeza que deseja deletar o airdrop "${airdrop.name}"?`)) return;

    try {
      if (airdrop.imageUrl) {
        await deleteAirdropImage(airdrop.imageUrl);
      }
      const airdropRef = doc(db, 'airdrops', airdrop.firestoreId);
      await deleteDoc(airdropRef);

      if (selectedAirdropId === airdrop.firestoreId) {
        handleClearAirdropForm();
      }
    } catch (error) {
      console.error('Erro ao deletar airdrop:', error);
      onError(`Erro ao deletar: ${error.message}`);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Create / Edit Form */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {selectedAirdropId ? 'Editar Guia de Airdrop' : 'Criar Nova Guia de Airdrop'}
          </h3>
          <p className="text-sm text-gray-400">Preencha os detalhes e crie as fases com tarefas.</p>
        </div>

        <form onSubmit={handleSaveAirdrop} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nome do Airdrop *
              </label>
              <input
                type="text"
                required
                value={airdropForm.name}
                onChange={(e) => setAirdropForm({ ...airdropForm, name: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: Robinhood"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Tipo *</label>
              <input
                type="text"
                required
                value={airdropForm.type}
                onChange={(e) => setAirdropForm({ ...airdropForm, type: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: Testnet, Mainnet"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Custo Estimado
              </label>
              <input
                type="text"
                value={airdropForm.cost}
                onChange={(e) => setAirdropForm({ ...airdropForm, cost: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: $15 - $30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={airdropForm.time}
                onChange={(e) => setAirdropForm({ ...airdropForm, time: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Ex: 25 Mins"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Cor de Destaque
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={airdropForm.accent}
                  onChange={(e) => setAirdropForm({ ...airdropForm, accent: e.target.value })}
                  className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={airdropForm.accent}
                  onChange={(e) => setAirdropForm({ ...airdropForm, accent: e.target.value })}
                  className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 text-sm"
                  placeholder="#D2FF00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
            <textarea
              value={airdropForm.description}
              onChange={(e) => setAirdropForm({ ...airdropForm, description: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 text-sm"
              placeholder="Descrição breve do airdrop..."
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              URL do Vídeo (opcional)
            </label>
            <input
              type="url"
              value={airdropForm.videoUrl}
              onChange={(e) => setAirdropForm({ ...airdropForm, videoUrl: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Imagem de Capa
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAirdropImageChange}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-gray-400 text-sm cursor-pointer file:bg-blue-600 file:border-0 file:rounded file:px-3 file:py-1 file:text-white file:cursor-pointer"
                />
              </div>
              {airdropForm.imagePreview && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={airdropForm.imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg border border-gray-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Phases */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white">
                Fases do Guia ({airdropForm.phases.length})
              </h4>
              <button
                type="button"
                onClick={handleAddPhase}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors outline-none text-sm"
              >
                <Plus className="w-4 h-4" /> Adicionar Fase
              </button>
            </div>

            <div className="space-y-4">
              {airdropForm.phases.map((phase) => (
                <div
                  key={phase.id}
                  className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={phase.title}
                        onChange={(e) =>
                          handleUpdatePhase(phase.id, 'title', e.target.value)
                        }
                        className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500 font-semibold text-sm"
                        placeholder="Título da Fase"
                      />
                      <textarea
                        value={phase.description || ''}
                        onChange={(e) =>
                          handleUpdatePhase(phase.id, 'description', e.target.value)
                        }
                        className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-gray-300 outline-none focus:border-blue-500 text-sm"
                        placeholder="Descrição da fase"
                        rows="2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhase(phase.id)}
                      className="text-red-500 hover:text-red-400 p-2 outline-none"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Phase Tasks */}
                  <div className="ml-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase">
                      Tarefas ({phase.tasks?.length || 0})
                    </div>
                    {phase.tasks?.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#151515] border border-gray-700 rounded p-3 space-y-2 text-sm"
                      >
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) =>
                            handleUpdateTask(phase.id, task.id, 'title', e.target.value)
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-white outline-none focus:border-blue-500 font-semibold"
                          placeholder="Título da tarefa"
                        />
                        <textarea
                          value={task.desc}
                          onChange={(e) =>
                            handleUpdateTask(phase.id, task.id, 'desc', e.target.value)
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-gray-300 outline-none focus:border-blue-500"
                          placeholder="Descrição"
                          rows="2"
                        />
                        <input
                          type="url"
                          value={task.link || ''}
                          onChange={(e) =>
                            handleUpdateTask(phase.id, task.id, 'link', e.target.value)
                          }
                          className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-gray-300 outline-none focus:border-blue-500 text-xs"
                          placeholder="Link (opcional)"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTaskFromPhase(phase.id, task.id)}
                          className="text-red-500 hover:text-red-400 text-xs font-semibold"
                        >
                          Remover Tarefa
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddTaskToPhase(phase.id)}
                      className="bg-[#151515] hover:bg-[#1a1a1a] text-blue-400 font-semibold px-3 py-1.5 rounded text-xs transition-colors outline-none flex items-center gap-1 w-full justify-center"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Tarefa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-800">
            <button
              type="submit"
              disabled={isSavingAirdrop}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none flex-1"
            >
              {isSavingAirdrop ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {selectedAirdropId ? 'Atualizar Guia' : 'Criar Guia'}
            </button>
            {selectedAirdropId && (
              <button
                type="button"
                onClick={handleClearAirdropForm}
                className="bg-[#151515] hover:bg-[#1a1a1a] text-gray-300 font-bold py-3 px-6 rounded-xl transition-colors outline-none"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Guides List */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Guias Criadas ({airdrops.length})</h3>
        </div>
        <div className="divide-y divide-gray-800/50">
          {loadingAirdrops ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Carregando guias...</p>
            </div>
          ) : airdrops.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma guia de airdrop criada.</p>
            </div>
          ) : (
            airdrops.map((airdrop) => (
              <div
                key={airdrop.firestoreId}
                className="p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white mb-1">{airdrop.name}</h4>
                    <p className="text-xs text-gray-500">
                      <span className="inline-block px-2 py-0.5 bg-gray-800 rounded mr-2">
                        {airdrop.type}
                      </span>
                      <span className="text-gray-600">
                        Fases: {airdrop.phases?.length || 0}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSelectAirdrop(airdrop)}
                      className="bg-[#151515] hover:bg-[#1a1a1a] text-blue-400 font-semibold px-4 py-2 rounded-lg transition-colors outline-none text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteAirdrop(airdrop)}
                      className="text-gray-600 hover:text-red-400 p-2 transition-colors outline-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
