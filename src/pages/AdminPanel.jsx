import React, { useState, useEffect } from 'react';
import { Users, Shield, Save, Loader2, Search, CheckCircle2, Crown, AlertTriangle } from 'lucide-react';

// ============================================================================
// INSTRUÇÕES PARA O VS CODE LOCAL:
// 1. DESCOMENTE as importações abaixo para ligar aos seus arquivos reais:
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';

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
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none focus:outline-none ${
            activeTab === 'users' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" /> Gestão de Clientes
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-colors outline-none focus:outline-none ${
            activeTab === 'permissions' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield className="w-4 h-4" /> Permissões de Acesso
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
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
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
                          {user.email[0]}
                        </div>
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Desconhecido'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={user.tier || 'free'}
                          onChange={(e) => handleTierChange(user.id, e.target.value)}
                          className={`bg-[#0a0a0a] border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none transition-colors cursor-pointer ${
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
                  className="bg-[#151515] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 outline-none focus:outline-none disabled:opacity-50"
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
    </div>
  );
}