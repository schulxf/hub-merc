import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AIRDROPS_DB } from '../data/mockDb';

const AirdropHub = ({ onSelect }) => (
  <div className="animate-in fade-in pb-24 md:pb-12">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white mb-2">Hub de Airdrops</h1>
      <p className="text-gray-400">Descubra e acompanhe as melhores oportunidades selecionadas.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {AIRDROPS_DB.map((airdrop) => (
        <div key={airdrop.id} onClick={() => onSelect(airdrop)} className="bg-[#111] border border-gray-800 hover:border-gray-600 rounded-2xl cursor-pointer transform hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col group outline-none select-none focus:outline-none focus:ring-0">
          <div className="h-32 w-full bg-[#1A1D24] relative overflow-hidden">
            <img src={airdrop.image} alt={airdrop.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-[#111] to-transparent"></div>
            <span className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded border border-gray-800 text-[10px] font-bold uppercase text-gray-300">
              {airdrop.type}
            </span>
          </div>
          <div className="p-6 relative z-10 flex-1 flex flex-col">
            <h3 className="text-xl font-extrabold text-white mb-2">{airdrop.name}</h3>
            <p className="text-sm text-gray-500 mb-6 line-clamp-2">{airdrop.description}</p>
            <div className="mt-auto flex items-center justify-between border-t border-gray-800/60 pt-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase">Custo Est.</span>
                <span className="text-sm font-semibold text-gray-300">{airdrop.cost}</span>
              </div>
              <div className="p-2 rounded-full bg-[#151515] border border-gray-800 transition-colors" style={{ color: airdrop.accent }}>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: airdrop.accent }}></div>
        </div>
      ))}
    </div>
  </div>
);

export default AirdropHub;