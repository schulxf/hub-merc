import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

// Lista de moedas suportadas para adicionar (pode expandir depois)
const SUPPORTED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', color: '#14F195' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA' },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0' },
];

export default function Portfolio() {
  const [portfolioAssets, setPortfolioAssets] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados do Modal de Adicionar Ativo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 1. LER DADOS DO FIREBASE EM TEMPO REAL
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    // Aponta para a "pasta" do utilizador logado
    const portfolioRef = collection(db, 'users', auth.currentUser.uid, 'portfolio');
    const q = query(portfolioRef);

    // onSnapshot fica a ouvir mudanças em tempo real no servidor
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assets = [];
      snapshot.forEach((doc) => {
        assets.push({ id: doc.id, ...doc.data() });
      });
      setPortfolioAssets(assets);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar portfólio:", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpeza quando sai da página
  }, []);

  // 2. BUSCAR PREÇOS REAIS DA COINGECKO
  useEffect(() => {
    if (portfolioAssets.length === 0) return;

    const fetchPrices = async () => {
      try {
        const coinIds = portfolioAssets.map(a => a.coinId).join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`);
        const data = await response.json();
        setLivePrices(data);
      } catch (error) {
        console.error("Erro ao buscar preços:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Atualiza a cada 1 minuto
    return () => clearInterval(interval);
  }, [portfolioAssets]);

  // 3. GRAVAR NOVO ATIVO NO FIREBASE
  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !buyPrice) return;
    
    setIsSaving(true);
    const coin = SUPPORTED_COINS.find(c => c.id === selectedCoin);
    
    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', selectedCoin);
      
      // Salva ou atualiza a moeda no banco de dados da Google
      await setDoc(assetRef, {
        coinId: selectedCoin,
        symbol: coin.symbol,
        name: coin.name,
        color: coin.color,
        amount: parseFloat(amount),
        averageBuyPrice: parseFloat(buyPrice),
        updatedAt: new Date().toISOString()
      });

      setIsModalOpen(false);
      setAmount('');
      setBuyPrice('');
    } catch (error) {
      console.error("Erro ao guardar ativo:", error);
      alert("Erro ao guardar ativo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. APAGAR ATIVO DO FIREBASE
  const handleRemoveAsset = async (coinId) => {
    if (!auth.currentUser) return;
    if (!window.confirm("Tem a certeza que deseja remover este ativo?")) return;

    try {
      const assetRef = doc(db, 'users', auth.currentUser.uid, 'portfolio', coinId);
      await deleteDoc(assetRef);
    } catch (error) {
      console.error("Erro ao remover ativo:", error);
    }
  };

  // 5. CÁLCULOS DO PORTFÓLIO
  const portfolioStats = useMemo(() => {
    let totalValue = 0;
    let totalInvested = 0;

    const enrichedAssets = portfolioAssets.map(asset => {
      const liveData = livePrices[asset.coinId] || { usd: asset.averageBuyPrice, usd_24h_change: 0 };
      const currentPrice = liveData.usd;
      const currentValue = asset.amount * currentPrice;
      const investedValue = asset.amount * asset.averageBuyPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPct = (profitLoss / investedValue) * 100;

      totalValue += currentValue;
      totalInvested += investedValue;

      return {
        ...asset,
        currentPrice,
        currentValue,
        investedValue,
        profitLoss,
        profitLossPct,
        change24h: liveData.usd_24h_change
      };
    }).sort((a, b) => b.currentValue - a.currentValue); // Ordena por maior valor

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return { totalValue, totalInvested, totalProfitLoss, totalProfitLossPct, enrichedAssets };
  }, [portfolioAssets, livePrices]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in pb-12">
      {/* HEADER DO PORTFÓLIO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-500" />
            Meu Portfólio
          </h1>
          <p className="text-gray-400">Acompanhe a sua alocação e rentabilidade em tempo real.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 outline-none focus:outline-none focus:ring-0"
        >
          <Plus className="w-5 h-5" /> Adicionar Ativo
        </button>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Wallet className="w-5 h-5" />
            <h3 className="font-semibold">Saldo Atual</h3>
          </div>
          <p className="text-3xl font-black text-white">
            ${portfolioStats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="font-semibold">Total Investido</h3>
          </div>
          <p className="text-3xl font-black text-white">
            ${portfolioStats.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-[#111] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            {portfolioStats.totalProfitLoss >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
            <h3 className="font-semibold">Lucro / Prejuízo Total</h3>
          </div>
          <div className="flex items-baseline gap-3">
            <p className={`text-3xl font-black ${portfolioStats.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {portfolioStats.totalProfitLoss >= 0 ? '+' : ''}${portfolioStats.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className={`font-bold px-2 py-1 rounded-md text-sm ${portfolioStats.totalProfitLossPct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {portfolioStats.totalProfitLossPct >= 0 ? '+' : ''}{portfolioStats.totalProfitLossPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* LISTA DE ATIVOS */}
      <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-[#151515]">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ativo</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Preço Atual</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Saldo</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Lucro / Prejuízo</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {portfolioStats.enrichedAssets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>O seu portfólio está vazio.</p>
                    <p className="text-sm mt-1">Clique em "Adicionar Ativo" para começar.</p>
                  </td>
                </tr>
              ) : (
                portfolioStats.enrichedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: asset.color }}>
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{asset.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{asset.amount} {asset.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-white">${asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                      <p className={`text-xs font-medium ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h?.toFixed(2)}% (24h)
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-white">${asset.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-500">Méd: ${asset.averageBuyPrice.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <p className={`font-bold ${asset.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.profitLoss >= 0 ? '+' : ''}${asset.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-medium ${asset.profitLossPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.profitLossPct >= 0 ? '+' : ''}{asset.profitLossPct.toFixed(2)}%
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"
                        title="Remover ativo"
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

      {/* MODAL ADICIONAR ATIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151515] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-6">Adicionar Transação</h2>
            
            <form onSubmit={handleAddAsset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Moeda</label>
                <select 
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  {SUPPORTED_COINS.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Quantidade Comprada</label>
                <input 
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 0.5"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Preço Médio de Compra (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input 
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="Ex: 60000"
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition-colors outline-none focus:outline-none focus:ring-0"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 outline-none focus:outline-none focus:ring-0"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gravar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}