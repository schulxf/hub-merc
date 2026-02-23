// src/components/ui/Shared.jsx
import React from 'react';
import { ExternalLink, Code } from 'lucide-react';

// Função de formatação integrada diretamente para evitar falhas de importação de caminhos relativos
const fmt = {
  usd: (n, decimals = 2) =>
    typeof n === 'number' && !isNaN(n)
      ? n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : '0.00',
  pct: (n) => (typeof n === 'number' && !isNaN(n) ? Math.abs(n).toFixed(2) : '0.00'),
  sign: (n) => (n >= 0 ? '+' : ''),
  arrow: (n) => (n >= 0 ? '▲' : '▼'),
};

export const StatBadge = ({ value, prefix = '', suffix = '' }) => {
  const isPositive = value >= 0;
  return (
    <span className={`font-mono text-xs font-bold ${isPositive ? 'text-[#00C805]' : 'text-red-500'}`}>
      {fmt.arrow(value)} {fmt.sign(value)}{prefix}{fmt.pct(value)}{suffix}
    </span>
  );
};

export const ExternalBtn = ({ href, children, className = '' }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors border border-gray-700 outline-none ${className}`}
  >
    {children} <ExternalLink className="w-3 h-3" />
  </a>
);

export const MockPage = ({ title }) => (
  <div className="animate-in fade-in flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
      <Code className="w-8 h-8 text-blue-500" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
    <p className="text-gray-500 max-w-md text-sm leading-relaxed">
      Esta funcionalidade está em desenvolvimento e será disponibilizada em breve para a comunidade.
    </p>
  </div>
);