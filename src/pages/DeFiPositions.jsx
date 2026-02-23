import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Activity, Trash2, X, Loader2, Droplets, Layers, Clock, ArrowRightLeft } from 'lucide-react';

// ============================================================================
// INSTRUÇÕES PARA O VS CODE LOCAL:
// 1. DESCOMENTE as importações abaixo para ligar aos seus ficheiros reais:
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { fmt } from '../lib/utils';
import { DEFI_TYPES } from '../data/mockDb';
//

export default function DeFiPositions() {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [opType, setOpType] = useState('staking');
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({ protocol: '', asset: '', capital: '', apr: '', rangeMin: '', rangeMax: '', fees: '', leverage: '', maturity: '' });

  // 1. LER POSIÇÕES DO FIREBASE
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const defiRef = collection(db, 'users', auth.currentUser.uid, 'defi');
    const q = query(defiRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setPositions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar posições DeFi:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. ADICIONAR NOVA POSIÇÃO NO FIREBASE
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setIsSaving(true);
    try {
      // Geramos um ID único para o documento
      const newId = Date.now().toString();
      const posRef = doc(db, 'users', auth.currentUser.uid, 'defi', newId);
      
      const newPosData = {
        type: opType,
        ...form,
        capital: parseFloat(form.capital) || 0,
        apr: parseFloat(form.apr) || 0,
        fees: parseFloat(form.fees) || 0,
        leverage: parseFloat(form.leverage) || 0,
        updatedAt: new Date().toISOString()
      };

      // Apenas gravamos no Firebase. O onSnapshot vai tratar de atualizar o ecrã automaticamente!
      await setDoc(posRef, newPosData);

      setIsModalOpen(false);
      setForm({ protocol: '', asset: '', capital: '', apr: '', rangeMin: '', rangeMax: '', fees: '', leverage: '', maturity: '' });
    } catch (error) {
      console.error("Erro ao guardar posição:", error);
      alert("Erro ao guardar posição.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. REMOVER POSIÇÃO DO FIREBASE
  const removePos = async (id) => {
    if (!auth.currentUser) return;
    if (!window.confirm("Tem a certeza que deseja remover esta posição?")) return;

    try {
      const posRef = doc(db, 'users', auth.currentUser.uid, 'defi', id);
      // Apenas apagamos do Firebase. O onSnapshot vai removê-lo do ecrã automaticamente!
      await deleteDoc(posRef);
    } catch (error) {
      console.error("Erro ao remover posição:", error);
    }
  };

  const totalCapital = positions.reduce((acc, p) => acc + (Number(p.capital) || 0), 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-24 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Posições DeFi</h1>
          <p className="text-gray-400">Rastreie todas as suas operações on-chain em um só lugar.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-500 transition-colors outline-none focus:outline-none focus:ring-0">
          <Plus className="w-4 h-4" /> Nova Posição
        </button>
      </div>

      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-xl">
        <div>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Alocado em DeFi</p>
          <p className="text-3xl font-extrabold text-white">${fmt.usd(totalCapital)}</p>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
          <Wallet className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-2xl bg-[#111]">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma posição ativa</h3>
          <p className="text-gray-500 text-sm">Adicione suas pools, staking e lending para rastrear os rendimentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {positions.map(pos => {
            const defInfo = DEFI_TYPES.find(d => d.id === pos.type) || DEFI_TYPES[0];
            const Icon = defInfo.icon;
            return (
              <div key={pos.id} className="bg-[#111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors shadow-sm flex flex-col group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${defInfo.bg} ${defInfo.color} ${defInfo.border} border`}>
                      {Icon && <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white leading-tight">{pos.protocol}</h4>
                      <p className="text-xs text-gray-500">{defInfo.label}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removePos(pos.id)} 
                    className="text-gray-600 hover:text-red-500 outline-none focus:outline-none focus:ring-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover posição"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>

                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800/50 mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Ativo</p>
                    <p className="font-bold text-gray-200">{pos.asset}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Capital Alocado</p>
                    <p className="font-mono font-bold text-white">${fmt.usd(pos.capital)}</p>
                  </div>
                  <div className="col-span-2 border-t border-gray-800/50 pt-2 mt-1">
                    <p className="text-[10px] text-gray-500 uppercase">Rendimento Base</p>
                    <p className="font-mono font-bold text-[#00C805]">{pos.apr}% APY</p>
                  </div>
                </div>

                {pos.type === 'pool' && (
                  <div className="mt-auto flex justify-between text-xs text-gray-400 bg-blue-500/5 px-3 py-2 rounded border border-blue-500/10">
                    <span>Range: {pos.rangeMin} - {pos.rangeMax}</span>
                    <span className="font-bold text-blue-400">Taxas: ${pos.fees}</span>
                  </div>
                )}
                {pos.type === 'pendle' && (
                  <div className="mt-auto text-xs text-gray-400 bg-orange-500/5 px-3 py-2 rounded border border-orange-500/10">
                    Maturidade: <span className="font-bold text-orange-400">{pos.maturity}</span>
                  </div>
                )}
                {pos.type === 'looping' && (
                  <div className="mt-auto text-xs text-gray-400 bg-pink-500/5 px-3 py-2 rounded border border-pink-500/10">
                    Alavancagem: <span className="font-bold text-pink-400">{pos.leverage}x</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE ADICIONAR POSIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#111] sticky top-0 z-10">
              <h3 className="text-xl font-bold text-white">Nova Posição DeFi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white outline-none focus:outline-none focus:ring-0"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Operação</label>
                <select value={opType} onChange={(e) => setOpType(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
                  {DEFI_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Protocolo</label>
                  <input type="text" required value={form.protocol} onChange={e => setForm({...form, protocol: e.target.value})} placeholder="Ex: Aave" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Ativo(s)</label>
                  <input type="text" required value={form.asset} onChange={e => setForm({...form, asset: e.target.value})} placeholder="Ex: USDC" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Capital (USD)</label>
                  <input type="number" step="any" required value={form.capital} onChange={e => setForm({...form, capital: e.target.value})} placeholder="1000" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">APR/APY (%)</label>
                  <input type="number" step="any" required value={form.apr} onChange={e => setForm({...form, apr: e.target.value})} placeholder="12.5" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
              </div>

              {/* Campos Dinâmicos */}
              {opType === 'pool' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Range Min</label>
                      <input type="text" value={form.rangeMin} onChange={e => setForm({...form, rangeMin: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Range Max</label>
                      <input type="text" value={form.rangeMax} onChange={e => setForm({...form, rangeMax: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Taxas Coletadas (USD)</label>
                    <input type="number" step="any" value={form.fees} onChange={e => setForm({...form, fees: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                  </div>
                </>
              )}

              {opType === 'pendle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Maturidade</label>
                  <input type="date" value={form.maturity} onChange={e => setForm({...form, maturity: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
              )}

              {opType === 'looping' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Fator de Alavancagem (x)</label>
                  <input type="number" step="0.1" value={form.leverage} onChange={e => setForm({...form, leverage: e.target.value})} placeholder="Ex: 3.5" className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white outline-none focus:border-blue-500" />
                </div>
              )}

              <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors mt-6 flex items-center justify-center gap-2 outline-none focus:outline-none focus:ring-0 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Adicionar Posição'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}