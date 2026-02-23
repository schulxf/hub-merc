import { useEffect, useState } from 'react';
import { fetchWalletBalances } from '../lib/web3Api';

/**
 * Hook responsável por orquestrar a leitura de saldos on-chain
 * a partir das carteiras registadas em users/{uid}/wallets.
 *
 * O fetch só é disparado quando o parâmetro `trigger` muda
 * (ex: timestamp gerado num clique de botão).
 */
export function useWalletBalances(wallets, trigger) {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    if (!wallets || wallets.length === 0) {
      setWarning('Adicione pelo menos uma carteira para puxar dados on-chain.');
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      setWarning(null);

      try {
        const result = await fetchWalletBalances(wallets);
        if (cancelled) return;

        setTokens(result.tokens || []);
        if (result.warning) {
          setWarning(result.warning);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Erro ao buscar saldos on-chain:', err);
        setError('Não foi possível atualizar os saldos on-chain neste momento.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [trigger, JSON.stringify(wallets || [])]);

  return { tokens, isLoading, error, warning };
}

