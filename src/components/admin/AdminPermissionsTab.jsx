import React, { useState, useEffect } from 'react';
import { Shield, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

/**
 * AdminPermissionsTab — Tab 2 of AdminPanel.
 *
 * Manages platform-wide feature flags — which user tier is required to
 * access each module. Changes are persisted to the Firestore
 * 'settings/permissions' document and take effect in real-time.
 *
 * @param {{ onError: (msg: string) => void }} props
 */
export default function AdminPermissionsTab({ onError }) {
  const [permissions, setPermissions] = useState({
    portfolio: 'pro',
    airdrops: 'free',
    defi: 'pro',
    reminders: 'free',
  });
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const permsRef = doc(db, 'settings', 'permissions');
    const unsubscribe = onSnapshot(permsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPermissions(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSavePermissions = async () => {
    setIsSavingPerms(true);
    setSaveSuccess(false);
    try {
      const permsRef = doc(db, 'settings', 'permissions');
      await setDoc(permsRef, permissions);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      onError('Erro ao salvar as novas regras.');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const modules = [
    { id: 'portfolio', label: 'Portfólio Avançado', desc: 'Gráficos e rentabilidade' },
    { id: 'airdrops', label: 'Hub de Airdrops', desc: 'Listagem e guias práticos' },
    { id: 'defi', label: 'Posições DeFi', desc: 'Rastreio de staking, pools, etc' },
    { id: 'reminders', label: 'Trackers & Agenda', desc: 'Lembretes de interação' },
  ];

  return (
    <div className="max-w-2xl bg-[#111] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Bloqueios da Plataforma</h3>
        <p className="text-sm text-gray-400">
          Defina qual é o nível mínimo exigido para o cliente acessar cada módulo do Hub.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-gray-800 rounded-xl"
          >
            <div>
              <h4 className="font-bold text-white text-sm">{mod.label}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
            </div>
            <select
              value={permissions[mod.id]}
              onChange={(e) =>
                setPermissions({ ...permissions, [mod.id]: e.target.value })
              }
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
          {isSavingPerms ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
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
          <strong>Atenção:</strong> Ao clicar em salvar, os usuários que estiverem com o Hub
          aberto terão as telas bloqueadas ou desbloqueadas instantaneamente, sem precisarem
          recarregar a página.
        </p>
      </div>
    </div>
  );
}
