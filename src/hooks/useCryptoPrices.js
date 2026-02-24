/**
 * Hook para buscar preços de criptos via TanStack Query.
 * Usa CoinGecko com cache de 5 min + auto-refetch a cada 60s.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchCoinPrices, pricesKeys } from '../services/pricesService';

export function useCryptoPrices(coinIds) {
  // Deduplicar e ordenar IDs para cache consistente
  const uniqueSortedIds = useMemo(
    () => (coinIds ? [...new Set(coinIds)].sort() : []),
    [coinIds]
  );

  const { data: prices = {}, isLoading, error } = useQuery({
    queryKey: pricesKeys.byIds(uniqueSortedIds),
    queryFn: () => fetchCoinPrices(uniqueSortedIds),
    enabled: uniqueSortedIds.length > 0,
    refetchInterval: 60 * 1000, // auto-refetch a cada 60s
    staleTime: 5 * 60 * 1000,  // 5 min (redundante, já definido em queryClient)
  });

  return { prices, isLoading, error: error?.message || null };
}