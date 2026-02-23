import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

/**
 * Dropdown pesquisável para seleção de tokens.
 * Mostra imagem, símbolo e nome. Suporta filtro por texto.
 */
export default function TokenSelector({ tokens, selectedToken, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus no input ao abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 bg-[#0D0F13] border border-gray-700 rounded-xl px-4 py-3 text-white hover:border-gray-600 transition-colors outline-none"
      >
        {selectedToken?.image && (
          <img
            src={selectedToken.image}
            alt={selectedToken.symbol}
            className="w-6 h-6 rounded-full flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <span className="font-bold text-sm">{selectedToken?.symbol || 'Selecionar'}</span>
        <span className="text-gray-500 text-xs truncate flex-1 text-left">{selectedToken?.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#111316] border border-gray-700 rounded-xl shadow-2xl shadow-black/50 z-[60] overflow-hidden">
          {/* Barra de busca */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar token..."
              className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
          </div>

          {/* Lista de tokens */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Nenhum token encontrado
              </div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedToken?.id === token.id
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'hover:bg-[#181A1F] text-white'
                  }`}
                >
                  {token.image ? (
                    <img
                      src={token.image}
                      alt={token.symbol}
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex-shrink-0" />
                  )}
                  <span className="font-semibold text-sm w-12">{token.symbol}</span>
                  <span className="text-gray-500 text-xs truncate">{token.name}</span>
                  {token.currentPrice && (
                    <span className="ml-auto text-gray-500 text-xs font-mono">
                      ${token.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
