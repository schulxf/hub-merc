import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient central da aplicação.
 *
 * staleTime: 5 min — evita re-fetch ao navegar entre abas (poupa créditos Moralis / CoinGecko)
 * gcTime: 10 min  — mantém dados em memória mesmo após o componente desmontar
 * retry: 2        — tenta 2x antes de emitir erro ao utilizador
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutos
      gcTime: 10 * 60 * 1000,     // 10 minutos
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false, // não re-fetcha ao dar alt+tab
    },
  },
});
