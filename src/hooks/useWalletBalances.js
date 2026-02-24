/**
 * Hook para buscar saldos on-chain via TanStack Query.
 * Dispara fetch apenas quando o parâmetro `trigger` muda
 * (timestamp de um clique no botão "Sync on-chain").
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchWalletsData, walletsKeys } from '../services/walletsService';

export function useWalletBalances(wallets, trigger) {
  // Validação de entrada
  const hasWallets = wallets && wallets.length > 0;
  const walletsKey = useMemo(() => JSON.stringify(wallets || []), [wallets]);

  const { data = {}, isLoading, error } = useQuery({
    queryKey: walletsKeys.byTrigger(trigger || 'no-trigger'),
    queryFn: () => fetchWalletsData(wallets),
    enabled: hasWallets && !!trigger, // só executa se houver wallets E um trigger
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const tokens = data.tokens || [];
  const warning = data.warning || (hasWallets ? null : 'Adicione pelo menos uma carteira para puxar dados on-chain.');

  return {
    tokens,
    isLoading: isLoading && trigger, // só "loading" se realmente está buscando
    error: error?.message || null,
    warning,
  };
}

