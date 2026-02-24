import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Loader2, Globe2, AlertCircle, User2, Crown } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWallets } from '../hooks/useWallets';

export default function Wallets() {
  const { wallets, isLoading } = useWallets();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    address: '',
    networkType: 'evm',
    label: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [walletToRemove, setWalletToRemove] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const { profile } = useUserProfile();

  const handleOpenAddModal = () => {
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleCloseAddModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setErrorMessage('');
    setForm({ address: '', networkType: 'evm', label: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!auth.currentUser) {
      setErrorMessage('Sessão expirada. Volte a iniciar sessão para gerir as carteiras.');
      return;
    }

    const trimmedAddress = form.address.trim();
    if (!trimmedAddress) {
      setErrorMessage('Insira um endereço de carteira válido.');
      return;
    }

    setIsSaving(true);
    try {
      const newId = Date.now().toString();
      const walletRef = doc(db, 'users', auth.currentUser.uid, 'wallets', newId);

      const now = new Date().toISOString();

      await setDoc(walletRef, {
        address: trimmedAddress,
        networkType: form.networkType,
        label: form.label.trim() || null,
        createdAt: now,
        updatedAt: now,
      });

      handleCloseAddModal();
    } catch (error) {
      console.error('Erro ao guardar carteira:', error);
      setErrorMessage('Não foi possível guardar a carteira. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const openRemoveModal = (wallet) => {
    setWalletToRemove(wallet);
    setIsRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    if (isRemoving) return;
    setIsRemoveModalOpen(false);
    setWalletToRemove(null);
  };

  const confirmRemove = async () => {
    if (!walletToRemove || !auth.currentUser) return;

    setIsRemoving(true);
    try {
      const walletRef = doc(db, 'users', auth.currentUser.uid, 'wallets', walletToRemove.id);
      await deleteDoc(walletRef);
      closeRemoveModal();
    } catch (error) {
      console.error('Erro ao remover carteira:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const formatNetworkLabel = (networkType) => {
    if (networkType === 'solana') return 'Solana';
    return 'EVM (Ethereum / L2s)';
  };

  const shortAddress = (address) => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="animate-in fade-in pb-24 md:pb-12">
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <section className="space-y-4">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/40 flex items-center justify-center">
              <User2 className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Perfil do utilizador
              </p>
              <p className="text-sm font-bold text-white truncate">
                {auth.currentUser?.email || 'Membro Mercurius'}
              </p>
              <p className="text-[11px] mt-1 text-gray-400 flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                <span className="uppercase font-semibold tracking-wide">
                  {profile?.tier === 'admin'
                    ? 'Administrador'
                    : profile?.tier === 'vip'
                    ? 'VIP'
                    : profile?.tier === 'pro'
                    ? 'Premium'
                    : 'Plano Gratuito'}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Portfólio próprio
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              A gestão de carteiras abaixo alimenta os módulos de portfólio e DeFi. Nenhuma transação
              será executada em seu nome.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Carteiras ligadas
                </p>
                <p className="text-2xl font-extrabold text-white mt-1">{wallets.length}</p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                <Plus className="w-4 h-4" /> Adicionar carteira
              </button>
            </div>
          </div>
        </section>

        <section>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[260px]">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 pt-6 pb-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-500" />
                    Carteiras conectadas
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    EVM e Solana usados para sincronizar o seu universo on-chain.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 bg-[#151515]">
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Carteira
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Rede
                      </th>
                      <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {wallets.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Nenhuma carteira registada ainda.</p>
                          <p className="text-sm mt-1">
                            Adicione o primeiro endereço para começar a sincronizar os seus saldos.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      wallets.map((wallet) => (
                        <tr key={wallet.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-sm text-white">
                                {shortAddress(wallet.address)}
                              </span>
                              {wallet.label && (
                                <span className="text-xs text-gray-500 mt-1">{wallet.label}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                wallet.networkType === 'solana'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/40'
                              }`}
                            >
                              {formatNetworkLabel(wallet.networkType)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => openRemoveModal(wallet)}
                              className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                              title="Remover carteira"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-1">Adicionar Carteira</h2>
            <p className="text-sm text-gray-500 mb-6">
              Guarde aqui o endereço da carteira que será usada para leitura on-chain. Não será feita
              nenhuma transação em seu nome.
            </p>

            {errorMessage && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Endereço</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="0x... ou endereço Solana"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Rede</label>
                  <select
                    value={form.networkType}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, networkType: e.target.value }))
                    }
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="evm">EVM (Ethereum / L2 / EVM chains)</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Etiqueta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                    placeholder="Carteira principal, cold, etc."
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition-colors outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Carteira'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRemoveModalOpen && walletToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Remover carteira</h3>
              <p className="text-gray-400 text-sm mb-4">
                Tem a certeza que deseja remover esta carteira?
              </p>
              <p className="font-mono text-xs text-gray-500 mb-6">
                {shortAddress(walletToRemove.address)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeRemoveModal}
                  className="flex-1 bg-[#1A1D24] hover:bg-gray-800 text-white font-bold py-3 rounded-lg transition-colors border border-gray-700 outline-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRemove}
                  disabled={isRemoving}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors outline-none disabled:opacity-50"
                >
                  {isRemoving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

