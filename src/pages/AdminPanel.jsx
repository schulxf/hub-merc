import React, { useState, useEffect } from 'react';
import { Users, Shield, Save, Loader2, Search, CheckCircle2, Crown, AlertTriangle, Calendar, Plus, Trash2, FileText, Image as ImageIcon, X } from 'lucide-react';

import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { uploadAirdropImage, deleteAirdropImage, generateAirdropId } from '../lib/storage';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  
  // Estados para Gestão de Usuários
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Gestão de Permissões (Módulos)
  const [permissions, setPermissions] = useState({
    portfolio: 'pro',
    airdrops: 'free',
    defi: 'pro',
    reminders: 'free'
  });
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionError, setActionError] = useState('');

  // Estados para Agenda Global
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'tge', relatedAirdropId: '' });
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Estados para CMS de Airdrops
  const [airdrops, setAirdrops] = useState([]);
  const [loadingAirdrops, setLoadingAirdrops] = useState(true);
  const [airdropForm, setAirdropForm] = useState({
    name: '', type: '', cost: '', time: '', accent: '#D2FF00', description: '', videoUrl: '',
    image: null, imagePreview: null, imageUrl: '', phases: []
  });
  const [selectedAirdropId, setSelectedAirdropId] = useState(null);
  const [isSavingAirdrop, setIsSavingAirdrop] = useState(false);

  // 1. Buscar todos os usuários do Firebase
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersData = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Buscar configurações de permissão (se existirem)
  useEffect(() => {
    const permsRef = doc(db, 'settings', 'permissions');
    const unsubscribe = onSnapshot(permsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPermissions(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Buscar eventos da agenda global
  useEffect(() => {
    const eventsRef = doc(db, 'settings', 'calendar_events');
    const unsub = onSnapshot(eventsRef, (snap) => {
      if (snap.exists()) {
        setCalendarEvents(snap.data().events || []);
      }
    }, () => {});
    return () => unsub();
  }, []);

  // 4. Buscar airdrops do CMS
  useEffect(() => {
    const airdropsColl = collection(db, 'public_content', 'airdrops');
    const unsubscribe = onSnapshot(airdropsColl, (snapshot) => {
      const airdropsData = [];
      snapshot.forEach((doc) => {
        airdropsData.push({ firestoreId: doc.id, ...doc.data() });
      });
      setAirdrops(airdropsData);
      setLoadingAirdrops(false);
    }, (error) => {
      console.error('Erro ao carregar airdrops:', error);
      setLoadingAirdrops(false);
    });
    return () => unsubscribe();
  }, []);

  // Função para alterar o Tier de um usuário na hora
  const handleTierChange = async (userId, newTier) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { tier: newTier });
      
      // Apenas para refletir instantaneamente na visualização local
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setActionError("Erro ao atualizar nível do usuário.");
      setTimeout(() => setActionError(''), 3000);
    }
  };

  // Função para salvar as novas regras de acesso
  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    setSaveSuccess(false);
    setActionError('');
    try {
      const permsRef = doc(db, 'settings', 'permissions');
      await setDoc(permsRef, permissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      setActionError("Erro ao salvar as novas regras.");
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Handlers para Agenda Global
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date) return;
    setIsSavingEvent(true);
    try {
      const colorMap = { tge: '#EAB308', launch: '#22C55E', deadline: '#EF4444' };
      const newEvent = {
        id: Date.now().toString(),
        title: eventForm.title,
        date: eventForm.date,
        type: eventForm.type,
        relatedAirdropId: eventForm.relatedAirdropId || null,
        color: colorMap[eventForm.type] || '#EAB308',
      };
      const updated = [...calendarEvents, newEvent];
      const eventsRef = doc(db, 'settings', 'calendar_events');
      await setDoc(eventsRef, { events: updated });
      setEventForm({ title: '', date: '', type: 'tge', relatedAirdropId: '' });
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setActionError('Erro ao salvar evento na agenda.');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const updated = calendarEvents.filter(e => e.id !== eventId);
      const eventsRef = doc(db, 'settings', 'calendar_events');
      await setDoc(eventsRef, { events: updated });
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      setActionError('Erro ao remover evento.');
      setTimeout(() => setActionError(''), 3000);
    }
  };

  // Handlers para CMS de Airdrops
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
      phases: airdrop.phases || []
    });
  };

  const handleClearAirdropForm = () => {
    setSelectedAirdropId(null);
    setAirdropForm({
      name: '', type: '', cost: '', time: '', accent: '#D2FF00', description: '', videoUrl: '',
      image: null, imagePreview: null, imageUrl: '', phases: []
    });
  };

  const handleAirdropImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setAirdropForm(prev => ({ ...prev, image: file, imagePreview: preview }));
    }
  };

  const handleAddPhase = () => {
    setAirdropForm(prev => ({
      ...prev,
      phases: [...prev.phases, { id: Date.now().toString(), title: '', description: '', tasks: [] }]
    }));
  };

  const handleRemovePhase = (phaseId) => {
    setAirdropForm(prev => ({
      ...prev,
      phases: prev.phases.filter(p => p.id !== phaseId)
    }));
  };

  const handleUpdatePhase = (phaseId, field, value) => {
    setAirdropForm(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phaseId ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleAddTaskToPhase = (phaseId) => {
    setAirdropForm(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phaseId
          ? { ...p, tasks: [...p.tasks, { id: Date.now().toString(), title: '', desc: '', link: '', subLinks: [] }] }
          : p
      )
    }));
  };

  const handleRemoveTaskFromPhase = (phaseId, taskId) => {
    setAirdropForm(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      )
    }));
  };

  const handleUpdateTask = (phaseId, taskId, field, value) => {
    setAirdropForm(prev => ({
      ...prev,
      phases: prev.phases.map(p =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId ? { ...t, [field]: value } : t
              )
            }
          : p
      )
    }));
  };

  const handleSaveAirdrop = async (e) => {
    e.preventDefault();
    if (!airdropForm.name || !airdropForm.type) {
      setActionError('Preencha ao menos o nome e tipo do airdrop.');
      return;
    }

    setIsSavingAirdrop(true);
    setActionError('');

    try {
      let imageUrl = airdropForm.imageUrl;
      const airdropId = selectedAirdropId || generateAirdropId(airdropForm.name);

      // Upload de imagem se fornecida
      if (airdropForm.image) {
        if (airdropForm.imageUrl) {
          await deleteAirdropImage(airdropForm.imageUrl);
        }
        imageUrl = await uploadAirdropImage(airdropForm.image, airdropId);
      }

      // Salvar no Firestore
      const airdropRef = doc(db, 'public_content', 'airdrops', airdropId);
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

      setActionError('');
      handleClearAirdropForm();
      // O useEffect vai atualizar automaticamente
    } catch (error) {
      console.error('Erro ao salvar airdrop:', error);
      setActionError(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSavingAirdrop(false);
    }
  };

  const handleDeleteAirdrop = async (airdrop) => {
    if (!window.confirm(`Tem certeza que deseja deletar o airdrop "${airdrop.name}"?`)) return;

    try {
      // Deletar imagem do Storage se existir
      if (airdrop.imageUrl) {
        await deleteAirdropImage(airdrop.imageUrl);
      }

      // Deletar documento do Firestore
      const airdropRef = doc(db, 'public_content', 'airdrops', airdrop.firestoreId);
      await deleteDoc(airdropRef);

      // Limpar formulário se era o selecionado
      if (selectedAirdropId === airdrop.firestoreId) {
        handleClearAirdropForm();
      }
    } catch (error) {
      console.error('Erro ao deletar airdrop:', error);
      setActionError(`Erro ao deletar: ${error.message}`);
      setTimeout(() => setActionError(''), 3000);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in pb-24 md:pb-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          Painel de Controle Mercurius
        </h1>
        <p className="text-gray-400">Área restrita para gestão da plataforma e clientes.</p>
      </div>

      {actionError && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">{actionError}</p>
        </div>
      )}

      {/* Tabs de Navegação */}
      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none whitespace-nowrap ${
            activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" /> Gestão de Clientes
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none whitespace-nowrap ${
            activeTab === 'permissions' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield className="w-4 h-4" /> Permissões de Acesso
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none whitespace-nowrap ${
            activeTab === 'agenda' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Calendar className="w-4 h-4" /> Agenda Global
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none whitespace-nowrap ${
            activeTab === 'content' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Conteúdo (Guias)
        </button>
      </div>

      {/* TAB 1: GESTÃO DE USUÁRIOS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#111] p-4 rounded-xl border border-gray-800">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar cliente por email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="text-sm text-gray-400 font-medium px-4">
              Total: <strong className="text-white">{users.length}</strong> usuários
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#16181D] border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Usuário (Email)</th>
                  <th className="px-6 py-4 font-semibold">Data de Cadastro</th>
                  <th className="px-6 py-4 font-semibold text-right">Nível de Acesso (Tier)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {loadingUsers ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Carregando base de clientes...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs uppercase">
                          {user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        {user.email || 'Sem email'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Desconhecido'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={user.tier || 'free'}
                          onChange={(e) => handleTierChange(user.id, e.target.value)}
                          className={`bg-[#0a0a0a] border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            user.tier === 'vip' ? 'text-yellow-500 border-yellow-500/30' :
                            user.tier === 'pro' ? 'text-blue-400 border-blue-500/30' :
                            user.tier === 'admin' ? 'text-purple-500 border-purple-500/30' :
                            'text-gray-400 border-gray-700'
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Premium (Pro)</option>
                          <option value="vip">Consultoria (VIP)</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GESTÃO DE PERMISSÕES DE MÓDULOS */}
      {activeTab === 'permissions' && (
        <div className="max-w-2xl bg-[#111] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Bloqueios da Plataforma</h3>
            <p className="text-sm text-gray-400">Defina qual é o nível mínimo exigido para o cliente acessar cada módulo do Hub.</p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { id: 'portfolio', label: 'Portfólio Avançado', desc: 'Gráficos e rentabilidade' },
              { id: 'airdrops', label: 'Hub de Airdrops', desc: 'Listagem e guias práticos' },
              { id: 'defi', label: 'Posições DeFi', desc: 'Rastreio de staking, pools, etc' },
              { id: 'reminders', label: 'Trackers & Agenda', desc: 'Lembretes de interação' },
            ].map((mod) => (
              <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl">
                <div>
                  <h4 className="font-bold text-white text-sm">{mod.label}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
                </div>
                <select
                  value={permissions[mod.id]}
                  onChange={(e) => setPermissions({ ...permissions, [mod.id]: e.target.value })}
                  className="bg-[#151515] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500"
                >
                  <option value="free">Livre (Free, Pro, VIP)</option>
                  <option value="pro">Apenas Assinantes (Pro, VIP)</option>
                  <option value="vip">Exclusivo Consultoria (VIP)</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-800">
            <button
              onClick={handleSavePermissions}
              disabled={isSavingPerms}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-50"
            >
              {isSavingPerms ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Regras
            </button>
            {saveSuccess && (
              <span className="flex items-center gap-2 text-green-400 text-sm font-semibold animate-in slide-in-from-left-2">
                <CheckCircle2 className="w-4 h-4" /> Atualizado em tempo real!
              </span>
            )}
          </div>
          
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
             <p className="text-sm text-blue-300">
               <strong>Atenção:</strong> Ao clicar em salvar, os usuários que estiverem com o Hub aberto terão as telas bloqueadas ou desbloqueadas instantaneamente, sem precisarem recarregar a página.
             </p>
          </div>
        </div>
      )}

      {/* TAB 4: CONTEÚDO (GUIAS DE AIRDROPS) */}
      {activeTab === 'content' && (
        <div className="max-w-5xl space-y-6">
          {/* Seção: Formulário de Criação/Edição */}
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                {selectedAirdropId ? 'Editar Guia de Airdrop' : 'Criar Nova Guia de Airdrop'}
              </h3>
              <p className="text-sm text-gray-400">Preencha os detalhes e crie as fases com tarefas.</p>
            </div>

            <form onSubmit={handleSaveAirdrop} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Nome do Airdrop *</label>
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">Custo Estimado</label>
                  <input
                    type="text"
                    value={airdropForm.cost}
                    onChange={(e) => setAirdropForm({ ...airdropForm, cost: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ex: $15 - $30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tempo Estimado</label>
                  <input
                    type="text"
                    value={airdropForm.time}
                    onChange={(e) => setAirdropForm({ ...airdropForm, time: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ex: 25 Mins"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Cor de Destaque</label>
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
                <label className="block text-sm font-medium text-gray-400 mb-2">URL do Vídeo (opcional)</label>
                <input
                  type="url"
                  value={airdropForm.videoUrl}
                  onChange={(e) => setAirdropForm({ ...airdropForm, videoUrl: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Imagem de Capa</label>
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
                      <img src={airdropForm.imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg border border-gray-700" />
                    </div>
                  )}
                </div>
              </div>

              {/* Fases */}
              <div className="border-t border-gray-800 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-white">Fases do Guia ({airdropForm.phases.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors outline-none text-sm"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Fase
                  </button>
                </div>

                <div className="space-y-4">
                  {airdropForm.phases.map((phase, phaseIdx) => (
                    <div key={phase.id} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={phase.title}
                            onChange={(e) => handleUpdatePhase(phase.id, 'title', e.target.value)}
                            className="w-full bg-[#111] border border-gray-700 rounded px-3 py-2 text-white outline-none focus:border-blue-500 font-semibold text-sm"
                            placeholder="Título da Fase"
                          />
                          <textarea
                            value={phase.description || ''}
                            onChange={(e) => handleUpdatePhase(phase.id, 'description', e.target.value)}
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

                      {/* Tarefas da Fase */}
                      <div className="ml-4 space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Tarefas ({phase.tasks?.length || 0})</div>
                        {phase.tasks?.map((task) => (
                          <div key={task.id} className="bg-[#151515] border border-gray-700 rounded p-3 space-y-2 text-sm">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => handleUpdateTask(phase.id, task.id, 'title', e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-white outline-none focus:border-blue-500 font-semibold"
                              placeholder="Título da tarefa"
                            />
                            <textarea
                              value={task.desc}
                              onChange={(e) => handleUpdateTask(phase.id, task.id, 'desc', e.target.value)}
                              className="w-full bg-[#0a0a0a] border border-gray-700 rounded px-2 py-1 text-gray-300 outline-none focus:border-blue-500"
                              placeholder="Descrição"
                              rows="2"
                            />
                            <input
                              type="url"
                              value={task.link || ''}
                              onChange={(e) => handleUpdateTask(phase.id, task.id, 'link', e.target.value)}
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

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isSavingAirdrop}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none flex-1"
                >
                  {isSavingAirdrop ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
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

          {/* Seção: Lista de Guias Existentes */}
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
                  <div key={airdrop.firestoreId} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white mb-1">{airdrop.name}</h4>
                        <p className="text-xs text-gray-500">
                          <span className="inline-block px-2 py-0.5 bg-gray-800 rounded mr-2">{airdrop.type}</span>
                          <span className="text-gray-600">Fases: {airdrop.phases?.length || 0}</span>
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
      )}

      {/* TAB 3: AGENDA GLOBAL */}
      {activeTab === 'agenda' && (
        <div className="max-w-3xl space-y-6">
          {/* Formulário de adicionar evento */}
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Adicionar Evento Global</h3>
            <p className="text-sm text-gray-400 mb-6">Eventos adicionados aqui aparecerão no calendário de todos os usuários.</p>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ex: TGE Robinhood"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={e => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                  <select
                    value={eventForm.type}
                    onChange={e => setEventForm({...eventForm, type: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 appearance-none"
                  >
                    <option value="tge">TGE</option>
                    <option value="launch">Launch</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Airdrop Relacionado (opcional)</label>
                  <input
                    type="text"
                    value={eventForm.relatedAirdropId}
                    onChange={e => setEventForm({...eventForm, relatedAirdropId: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ex: robinhood"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingEvent}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
              >
                {isSavingEvent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Adicionar Evento
              </button>
            </form>
          </div>

          {/* Lista de eventos */}
          <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Eventos Agendados ({calendarEvents.length})</h3>
            </div>
            <div className="divide-y divide-gray-800/50">
              {calendarEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum evento global adicionado.</p>
                </div>
              ) : (
                [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date)).map(evt => (
                  <div key={evt.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: evt.color }} />
                      <div>
                        <p className="font-bold text-white text-sm">{evt.title}</p>
                        <p className="text-xs text-gray-500">
                          {evt.type.toUpperCase()} &bull; {new Date(evt.date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          {evt.relatedAirdropId ? ` &bull; ${evt.relatedAirdropId}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-gray-600 hover:text-red-400 p-2 transition-colors outline-none"
                      title="Remover evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}