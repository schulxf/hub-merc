// src/hooks/useCryptoPrices.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export function useCryptoPrices(coinIds) {
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const idsString = useMemo(() => [...new Set(coinIds)].join(','), [coinIds]);

  useEffect(() => {
    if (!idsString) return;
    const abortController = new AbortController();

    const fetchPrices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`,
          { signal: abortController.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPrices(data);
      } catch (e) {
        if (e.name !== 'AbortError') {
          setError(e.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);

    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [idsString]);

  return { prices, isLoading, error };
}