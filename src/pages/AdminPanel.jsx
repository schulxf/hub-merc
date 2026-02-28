import React, { useState, useEffect } from 'react';
import { Users, Shield, Save, Loader2, Search, CheckCircle2, Crown, AlertTriangle, Calendar, Plus, Trash2, Newspaper, GraduationCap, BarChart2 } from 'lucide-react';

import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc, getDocs, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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

  // Estados para Insights (Feed Institucional)
  const [insights, setInsights] = useState([]);
  const [insightForm, setInsightForm] = useState({ titulo: '', corpo: '', categoria: 'Giro Diário' });
  const [isSavingInsight, setIsSavingInsight] = useState(false);

  // Estados para Academia (Vídeos DeFi)
  const [videos, setVideos] = useState([]);
  const [videoForm, setVideoForm] = useState({ titulo: '', descricao: '', url: '', categoria: 'Protocolos DeFi' });
  const [isSavingVideo, setIsSavingVideo] = useState(false);

  // Estados para Assessores
  const [assessors, setAssessors] = useState([]);
  const [clientUidInput, setClientUidInput] = useState({});
  const [isSavingAssessor, setIsSavingAssessor] = useState(false);

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

  // Buscar insights
  useEffect(() => {
    const postsRef = collection(db, 'public_content', 'insights', 'posts');
    const unsubscribe = onSnapshot(postsRef, (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.publishedAt?.seconds || 0) - (a.publishedAt?.seconds || 0));
      setInsights(data);
    }, () => {});
    return () => unsubscribe();
  }, []);

  // Buscar vídeos da academia
  useEffect(() => {
    const videosRef = collection(db, 'public_content', 'academy', 'videos');
    const unsubscribe = onSnapshot(videosRef, (snap) => {
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setVideos(data);
    }, () => {});
    return () => unsubscribe();
  }, []);

  // Filtrar assessores da lista de users
  useEffect(() => {
    setAssessors(users.filter(u => u.tier === 'assessor'));
  }, [users]);

  // Handler: publicar insight
  const handlePublishInsight = async (e) => {
    e.preventDefault();
    if (!insightForm.titulo || !insightForm.corpo) return;
    setIsSavingInsight(true);
    try {
      const postsRef = collection(db, 'public_content', 'insights', 'posts');
      await addDoc(postsRef, {
        ...insightForm,
        publishedAt: new Date(),
        authorName: 'Equipa Mercurius',
      });
      setInsightForm({ titulo: '', corpo: '', categoria: 'Giro Diário' });
    } catch (err) {
      console.error('Erro ao publicar insight:', err);
      setActionError('Erro ao publicar insight.');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setIsSavingInsight(false);
    }
  };

  // Handler: apagar insight
  const handleDeleteInsight = async (postId) => {
    try {
      await deleteDoc(doc(db, 'public_content', 'insights', 'posts', postId));
    } catch (err) {
      console.error('Erro ao apagar insight:', err);
    }
  };

  // Handler: publicar vídeo
  const handlePublishVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.titulo || !videoForm.url) return;
    setIsSavingVideo(true);
    try {
      const videosRef = collection(db, 'public_content', 'academy', 'videos');
      await addDoc(videosRef, { ...videoForm, createdAt: new Date() });
      setVideoForm({ titulo: '', descricao: '', url: '', categoria: 'Protocolos DeFi' });
    } catch (err) {
      console.error('Erro ao publicar vídeo:', err);
      setActionError('Erro ao publicar vídeo.');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Handler: apagar vídeo
  const handleDeleteVideo = async (videoId) => {
    try {
      await deleteDoc(doc(db, 'public_content', 'academy', 'videos', videoId));
    } catch (err) {
      console.error('Erro ao apagar vídeo:', err);
    }
  };

  // Handler: adicionar cliente a assessor
  const handleAddClientToAssessor = async (assessorId) => {
    const clientUid = (clientUidInput[assessorId] || '').trim();
    if (!clientUid) return;
    setIsSavingAssessor(true);
    try {
      // Add clientUid to assessor's clients array
      await updateDoc(doc(db, 'users', assessorId), { clients: arrayUnion(clientUid) });
      // Add assessorId to client's profile.assessorIds
      const profileRef = doc(db, 'users', clientUid, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        await updateDoc(profileRef, { [`assessorIds.${assessorId}`]: true });
      } else {
        await setDoc(profileRef, { assessorIds: { [assessorId]: true } });
      }
      setClientUidInput(prev => ({ ...prev, [assessorId]: '' }));
    } catch (err) {
      console.error('Erro ao adicionar cliente ao assessor:', err);
      setActionError('Erro ao adicionar cliente. Verifique o UID.');
      setTimeout(() => setActionError(''), 3000);
    } finally {
      setIsSavingAssessor(false);
    }
  };

  // Handler: remover cliente de assessor
  const handleRemoveClientFromAssessor = async (assessorId, clientUid) => {
    setIsSavingAssessor(true);
    try {
      await updateDoc(doc(db, 'users', assessorId), { clients: arrayRemove(clientUid) });
      const profileRef = doc(db, 'users', clientUid, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        await updateDoc(profileRef, { [`assessorIds.${assessorId}`]: false });
      }
    } catch (err) {
      console.error('Erro ao remover cliente:', err);
    } finally {
      setIsSavingAssessor(false);
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
      <div className="flex border-b border-gray-800 mb-8">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" /> Gestão de Clientes
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'permissions' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield className="w-4 h-4" /> Permissões de Acesso
        </button>
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'agenda' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Calendar className="w-4 h-4" /> Agenda Global
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'insights' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Newspaper className="w-4 h-4" /> Insights
        </button>
        <button
          onClick={() => setActiveTab('academia')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'academia' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Academia
        </button>
        <button
          onClick={() => setActiveTab('assessores')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none ${
            activeTab === 'assessores' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Assessores
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

      {/* TAB 4: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">Publicar Insight</h3>
            <p className="text-sm text-gray-400 mb-6">O post ficará visível imediatamente para todos os clientes VIP no feed de Insights.</p>
            <form onSubmit={handlePublishInsight} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={insightForm.titulo}
                  onChange={e => setInsightForm({ ...insightForm, titulo: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="Ex: Giro de Mercado — 27 Fev"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                <select
                  value={insightForm.categoria}
                  onChange={e => setInsightForm({ ...insightForm, categoria: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                >
                  <option>Giro Diário</option>
                  <option>Relatório Semanal</option>
                  <option>Flash de Mercado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Corpo</label>
                <textarea
                  required
                  rows={6}
                  value={insightForm.corpo}
                  onChange={e => setInsightForm({ ...insightForm, corpo: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                  placeholder="Escreva a análise de mercado aqui..."
                />
              </div>
              <button
                type="submit"
                disabled={isSavingInsight}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
              >
                {isSavingInsight ? <Loader2 className="w-5 h-5 animate-spin" /> : <Newspaper className="w-5 h-5" />}
                Publicar Insight
              </button>
            </form>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Insights Publicados ({insights.length})</h3>
            </div>
            <div className="divide-y divide-gray-800/50">
              {insights.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum insight publicado ainda.</p>
                </div>
              ) : (
                insights.map(post => (
                  <div key={post.id} className="flex items-start justify-between px-6 py-4 gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{post.categoria}</span>
                      </div>
                      <p className="font-bold text-white text-sm truncate">{post.titulo}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.corpo}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteInsight(post.id)}
                      className="text-gray-600 hover:text-red-400 p-2 transition-colors outline-none flex-shrink-0"
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

      {/* TAB 5: ACADEMIA */}
      {activeTab === 'academia' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-2">Adicionar Vídeo</h3>
            <p className="text-sm text-gray-400 mb-6">Adicione screencasts e tutoriais DeFi para os clientes VIP.</p>
            <form onSubmit={handlePublishVideo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={videoForm.titulo}
                    onChange={e => setVideoForm({ ...videoForm, titulo: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="Ex: Como fazer Supply na Aave"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                  <select
                    value={videoForm.categoria}
                    onChange={e => setVideoForm({ ...videoForm, categoria: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option>Protocolos DeFi</option>
                    <option>Gestão de Risco</option>
                    <option>Ferramentas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">URL do YouTube</label>
                <input
                  type="url"
                  required
                  value={videoForm.url}
                  onChange={e => setVideoForm({ ...videoForm, url: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição (opcional)</label>
                <input
                  type="text"
                  value={videoForm.descricao}
                  onChange={e => setVideoForm({ ...videoForm, descricao: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                  placeholder="Breve descrição do que é ensinado no vídeo"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingVideo}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 outline-none"
              >
                {isSavingVideo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Adicionar Vídeo
              </button>
            </form>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Vídeos na Academia ({videos.length})</h3>
            </div>
            <div className="divide-y divide-gray-800/50">
              {videos.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhum vídeo adicionado ainda.</p>
                </div>
              ) : (
                videos.map(v => (
                  <div key={v.id} className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">{v.categoria}</span>
                      </div>
                      <p className="font-bold text-white text-sm truncate">{v.titulo}</p>
                      <p className="text-xs text-gray-500 truncate">{v.url}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteVideo(v.id)}
                      className="text-gray-600 hover:text-red-400 p-2 transition-colors outline-none flex-shrink-0"
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

      {/* TAB 6: ASSESSORES */}
      {activeTab === 'assessores' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              Para criar um Assessor: primeiro mude o tier do utilizador para <strong>Assessor</strong> no tab "Gestão de Clientes". Depois, atribua-lhe clientes VIP aqui.
            </p>
          </div>

          {assessors.length === 0 ? (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum Assessor encontrado.</p>
              <p className="text-gray-500 text-sm mt-1">Mude o tier de um utilizador para "Assessor" no tab Gestão de Clientes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessors.map(assessor => (
                <div key={assessor.id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm uppercase">
                      {assessor.email?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-white">{assessor.email}</p>
                      <p className="text-xs text-blue-400">Assessor • {(assessor.clients || []).length} clientes</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Clientes Atribuídos</p>
                    {(assessor.clients || []).length === 0 ? (
                      <p className="text-xs text-gray-600">Nenhum cliente atribuído.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(assessor.clients || []).map(uid => (
                          <div key={uid} className="flex items-center justify-between bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2">
                            <span className="text-xs font-mono text-gray-400 truncate">{uid}</span>
                            <button
                              onClick={() => handleRemoveClientFromAssessor(assessor.id, uid)}
                              disabled={isSavingAssessor}
                              className="text-gray-600 hover:text-red-400 p-1 transition-colors outline-none flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="UID do cliente (ex: abc123...)"
                      value={clientUidInput[assessor.id] || ''}
                      onChange={e => setClientUidInput(prev => ({ ...prev, [assessor.id]: e.target.value }))}
                      className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      onClick={() => handleAddClientToAssessor(assessor.id)}
                      disabled={isSavingAssessor || !clientUidInput[assessor.id]}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2 disabled:opacity-50 outline-none"
                    >
                      {isSavingAssessor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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