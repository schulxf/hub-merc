import React from 'react';
import { Calculator, ArrowRightLeft, BarChart3, Layers } from 'lucide-react';

const DEFI_TOOLS = [
  {
    id: 'uniswap-calc',
    title: 'Calculadora de Pools (Uniswap V3)',
    description: 'Simule posições de liquidez concentrada, calcule Impermanent Loss, compare HODL vs LP, e gerencie posições com histórico de taxas.',
    icon: Calculator,
    color: 'blue',
    tags: ['Simulador', 'IL', 'APR'],
  },
  // Ferramentas futuras podem ser adicionadas aqui
];

const COMING_SOON = [
  {
    title: 'Yield Farming Aggregator',
    description: 'Compare APRs entre protocolos e encontre as melhores oportunidades de farming.',
    icon: BarChart3,
  },
  {
    title: 'Token Swap Simulator',
    description: 'Simule swaps entre tokens com estimativa de slippage e gas fees.',
    icon: ArrowRightLeft,
  },
  {
    title: 'Portfolio DeFi Tracker',
    description: 'Acompanhe todas as suas posições DeFi em um único painel.',
    icon: Layers,
  },
];

export default function DeFiToolsLanding({ navigateTo }) {
  return (
    <div className="animate-in fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-blue-500" />
          Ferramentas DeFi
        </h1>
        <p className="text-gray-400 text-sm">Suite de ferramentas para otimizar suas estratégias DeFi.</p>
      </div>

      {/* Active Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {DEFI_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigateTo(tool.id)}
            className="bg-[#111] border border-gray-800 rounded-2xl p-6 text-left hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-${tool.color}-500/10 border border-${tool.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <tool.icon className={`w-6 h-6 text-${tool.color}-400`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{tool.title}</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{tool.description}</p>
            {tool.tags && (
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-lg font-bold text-gray-400 mb-4 uppercase tracking-wider text-xs">Em Breve</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COMING_SOON.map((tool, i) => (
            <div key={i} className="bg-[#111] border border-gray-800/50 rounded-2xl p-5 opacity-50">
              <tool.icon className="w-6 h-6 text-gray-600 mb-3" />
              <h3 className="text-sm font-bold text-gray-500 mb-1">{tool.title}</h3>
              <p className="text-xs text-gray-600">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
