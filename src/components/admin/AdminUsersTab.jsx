import React, { useState, useEffect } from 'react';
import { Users, Loader2, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

/**
 * AdminUsersTab — Tab 1 of AdminPanel.
 *
 * Manages the live list of platform users and allows admins to change tier levels.
 * Subscribes to the Firestore 'users' collection in real-time.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminUsersTab({ onError }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleTierChange = async (userId, newTier) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { tier: newTier });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, tier: newTier } : u))
      );
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      onError('Erro ao atualizar nível do usuário.');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
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
                <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                  Nenhum cliente encontrado.
                </td>
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
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                      : 'Desconhecido'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={user.tier || 'free'}
                      onChange={(e) => handleTierChange(user.id, e.target.value)}
                      className={`bg-[#0a0a0a] border rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        user.tier === 'vip'
                          ? 'text-yellow-500 border-yellow-500/30'
                          : user.tier === 'pro'
                          ? 'text-blue-400 border-blue-500/30'
                          : user.tier === 'admin'
                          ? 'text-purple-500 border-purple-500/30'
                          : 'text-gray-400 border-gray-700'
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
  );
}
