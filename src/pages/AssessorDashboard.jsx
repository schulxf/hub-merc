import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2, Users, DollarSign, Calendar, Plus, Loader2,
  Clock, ArrowRightLeft, X, CheckCircle2, ChevronDown, ChevronUp,
  FileText, AlertTriangle, User,
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import {
  doc, collection, onSnapshot, addDoc, updateDoc,
} from 'firebase/firestore';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

const formatUSD = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

const formatDate = (ts) => {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysSince = (ts) => {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

const tierLabel = (tier) => {
  const map = { vip: 'VIP', pro: 'Pro', free: 'Free', assessor: 'Assessor', admin: 'Admin' };
  return map[tier] || tier || '—';
};

const tierColor = (tier) => {
  if (tier === 'vip') return 'text-yellow-400 bg-yellow-500/10';
  if (tier === 'pro') return 'text-blue-400 bg-blue-500/10';
  if (tier === 'assessor') return 'text-purple-400 bg-purple-500/10';
  return 'text-gray-400 bg-gray-500/10';
};

// ─── Proposal Modal ────────────────────────────────────────────────────────────
function ProposalModal({ clientUid, clientEmail, onClose, onSuccess }) {
  const [form, setForm] = useState({ fromAsset: '', toAsset: '', amount: '', justification: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromAsset.trim() || !form.toAsset.trim() || !form.justification.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const proposalsRef = collection(db, 'users', clientUid, 'proposals');
      await addDoc(proposalsRef, {
        fromAsset: form.fromAsset.trim(),
        toAsset: form.toAsset.trim(),
        amount: form.amount.trim(),
        justification: form.justification.trim(),
        status: 'pending',
        createdAt: new Date(),
        assessorUid: auth.currentUser?.uid || '',
        assessorName: auth.currentUser?.email || 'Assessor Mercurius',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Erro ao criar proposta:', err);
      setError('Erro ao criar proposta. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Nova Proposta de Rebalanceamento
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Para: {clientEmail}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                De (Asset) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Morpho"
                value={form.fromAsset}
                onChange={e => setForm({ ...form, fromAsset: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Para (Asset) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Syrup"
                value={form.toAsset}
                onChange={e => setForm({ ...form, toAsset: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Quantidade / % (opcional)</label>
            <input
              type="text"
              placeholder="Ex: 500 USDC ou 25% da posição"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Justificativa <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Explique o racional da sugestão de alocação..."
              value={form.justification}
              onChange={e => setForm({ ...form, justification: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1A1D24] hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors border border-gray-700 outline-none text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 outline-none disabled:opacity-50 text-sm"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Enviar Proposta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Client Row ────────────────────────────────────────────────────────────────
function ClientRow({ client, assets, aum, onMarkMeeting, onCreateProposal, isMarkingMeeting }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const days = daysSince(client.lastMeetingDate);
  const lastMeetingStr = formatDate(client.lastMeetingDate);

  const meetingStatus = () => {
    if (days === null) return { label: 'Nunca realizada', color: 'text-red-400' };
    if (days > 45) return { label: `Há ${days} dias`, color: 'text-yellow-400' };
    return { label: `Há ${days} dias`, color: 'text-green-400' };
  };
  const meeting = meetingStatus();

  return (
    <>
      <tr
        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setIsExpanded(p => !p)}
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-xs uppercase text-gray-300 flex-shrink-0">
              {client.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{client.email || client.id}</p>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${tierColor(client.tier)}`}>
                {tierLabel(client.tier)}
              </span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="font-bold text-white text-sm">{formatUSD(aum)}</p>
          <p className="text-xs text-gray-500">{assets.length} assets</p>
        </td>
        <td className="px-6 py-4">
          <p className={`text-sm font-semibold ${meeting.color}`}>{meeting.label}</p>
          {lastMeetingStr && <p className="text-xs text-gray-500">{lastMeetingStr}</p>}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => onMarkMeeting(client.id)}
              disabled={isMarkingMeeting}
              title="Registar reunião realizada hoje"
              className="flex items-center gap-1.5 bg-[#1A1D24] hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors outline-none disabled:opacity-50"
            >
              {isMarkingMeeting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              Reunião
            </button>
            <button
              onClick={() => onCreateProposal(client.id)}
              title="Criar proposta de rebalanceamento"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Proposta
            </button>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          {isExpanded
            ? <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
            : <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-6 pb-4 pt-0 bg-[#0B0D12]">
            <div className="border border-gray-800/50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#111] text-xs uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Asset</th>
                    <th className="px-4 py-2.5 text-right">Quantidade</th>
                    <th className="px-4 py-2.5 text-right">Valor (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-gray-500 text-xs">
                        Portfólio vazio ou sem dados.
                      </td>
                    </tr>
                  ) : (
                    assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-white">{asset.name || asset.symbol || asset.coinId}</p>
                          <p className="text-xs text-gray-500 uppercase">{asset.symbol}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-300">
                          {Number(asset.amount || 0).toLocaleString('pt-PT', { maximumFractionDigits: 6 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white">
                          —
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssessorDashboard() {
  const [clientUids, setClientUids] = useState([]);
  const [clientData, setClientData] = useState({});
  const [portfolios, setPortfolios] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [proposalTarget, setProposalTarget] = useState(null); // clientUid
  const [markingMeeting, setMarkingMeeting] = useState(null);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // 1. Load assessor's client list in real-time
  useEffect(() => {
    if (!auth.currentUser) { setIsLoading(false); return; }
    const assessorRef = doc(db, 'users', auth.currentUser.uid);
    const unsub = onSnapshot(assessorRef, (snap) => {
      setClientUids(snap.exists() ? (snap.data().clients || []) : []);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, []);

  // 2. Load each client's user doc + portfolio subcollection
  useEffect(() => {
    if (clientUids.length === 0) {
      setClientData({});
      setPortfolios({});
      return;
    }
    const unsubscribers = [];

    clientUids.forEach(uid => {
      const clientRef = doc(db, 'users', uid);
      unsubscribers.push(
        onSnapshot(clientRef, (snap) => {
          if (snap.exists()) {
            setClientData(prev => ({ ...prev, [uid]: { id: uid, ...snap.data() } }));
          }
        }, () => {})
      );

      const portfolioRef = collection(db, 'users', uid, 'portfolio');
      unsubscribers.push(
        onSnapshot(portfolioRef, (snap) => {
          const assets = [];
          snap.forEach(d => assets.push({ id: d.id, ...d.data() }));
          setPortfolios(prev => ({ ...prev, [uid]: assets }));
        }, () => {})
      );
    });

    return () => unsubscribers.forEach(u => u());
  }, [clientUids]);

  // 3. Collect all unique coin IDs for pricing
  const allCoinIds = useMemo(() => {
    const ids = new Set();
    Object.values(portfolios).forEach(assets =>
      assets.forEach(a => { if (a.coinId) ids.add(a.coinId); })
    );
    return Array.from(ids);
  }, [portfolios]);

  const { prices: livePrices } = useCryptoPrices(allCoinIds);

  // 4. Compute AUM per client
  const clientAUM = useMemo(() => {
    const result = {};
    Object.entries(portfolios).forEach(([uid, assets]) => {
      result[uid] = assets.reduce((sum, a) => {
        const price = livePrices[a.coinId]?.usd || 0;
        return sum + (a.amount || 0) * price;
      }, 0);
    });
    return result;
  }, [portfolios, livePrices]);

  const totalAUM = useMemo(() =>
    Object.values(clientAUM).reduce((s, v) => s + v, 0),
    [clientAUM]
  );

  const handleMarkMeeting = async (clientUid) => {
    setMarkingMeeting(clientUid);
    try {
      await updateDoc(doc(db, 'users', clientUid), { lastMeetingDate: new Date() });
    } catch (err) {
      console.error('Erro ao marcar reunião:', err);
    } finally {
      setMarkingMeeting(null);
    }
  };

  const handleProposalSuccess = () => {
    setProposalSuccess(true);
    setTimeout(() => setProposalSuccess(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Terminal do Assessor</h1>
          <p className="text-gray-400 text-sm mt-1">Gestão de clientes VIP e AUM em tempo real.</p>
        </div>
      </div>

      {/* Proposal success notification */}
      {proposalSuccess && (
        <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 text-sm font-semibold">Proposta enviada com sucesso! O cliente receberá uma notificação.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-400 opacity-70" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">AUM Total</p>
          </div>
          <p className="text-2xl font-extrabold text-white">{formatUSD(totalAUM)}</p>
          <p className="text-xs text-gray-500 mt-1">Sob gestão</p>
        </div>
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400 opacity-70" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Clientes</p>
          </div>
          <p className="text-2xl font-extrabold text-white">{clientUids.length}</p>
          <p className="text-xs text-gray-500 mt-1">Clientes atribuídos</p>
        </div>
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-400 opacity-70" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Reuniões Pendentes</p>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {clientUids.filter(uid => {
              const d = clientData[uid]?.lastMeetingDate;
              return !d || daysSince(d) > 45;
            }).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Sem reunião há +45 dias</p>
        </div>
      </div>

      {/* Client Table */}
      {clientUids.length === 0 ? (
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-16 text-center">
          <User className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold text-lg">Nenhum cliente atribuído</p>
          <p className="text-gray-500 text-sm mt-1">
            Um Administrador deve atribuir clientes ao seu perfil no Painel Admin → tab Assessores.
          </p>
        </div>
      ) : (
        <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Carteira de Clientes</h2>
            <span className="text-xs text-gray-500 font-medium">{clientUids.length} clientes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#16181D] border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">AUM</th>
                  <th className="px-6 py-4 font-semibold">Última Reunião</th>
                  <th className="px-6 py-4 font-semibold">Ações</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {clientUids.map(uid => {
                  const client = clientData[uid] || { id: uid, email: uid };
                  const assets = portfolios[uid] || [];
                  const aum = clientAUM[uid] || 0;
                  return (
                    <ClientRow
                      key={uid}
                      client={client}
                      assets={assets}
                      aum={aum}
                      onMarkMeeting={handleMarkMeeting}
                      onCreateProposal={setProposalTarget}
                      isMarkingMeeting={markingMeeting === uid}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      {proposalTarget && (
        <ProposalModal
          clientUid={proposalTarget}
          clientEmail={clientData[proposalTarget]?.email || proposalTarget}
          onClose={() => setProposalTarget(null)}
          onSuccess={handleProposalSuccess}
        />
      )}
    </div>
  );
}
