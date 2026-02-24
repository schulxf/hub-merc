import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useWallets } from '../../hooks/useWallets';
import { useWalletBalances } from '../../hooks/useWalletBalances';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';

/**
 * Context for sharing Portfolio state across all portfolio sub-components.
 * Provides asset data, live prices, on-chain sync state, and loading indicators.
 *
 * @type {React.Context}
 */
const PortfolioContext = createContext(null);

/**
 * PortfolioProvider — wraps portfolio sub-components and manages all shared state.
 *
 * Responsibilities:
 * - Subscribes to Firestore portfolio collection in real-time
 * - Fetches live crypto prices for all held assets via useCryptoPrices
 * - Exposes on-chain sync trigger and results via useWalletBalances
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components that consume context
 */
export function PortfolioProvider({ children }) {
  const [portfolioAssets, setPortfolioAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncTrigger, setSyncTrigger] = useState(null);

  const { wallets } = useWallets();

  const {
    tokens: onChainTokens,
    isLoading: isSyncingOnChain,
    error: onChainError,
    warning: onChainWarning,
  } = useWalletBalances(wallets, syncTrigger);

  // Derive coin IDs from portfolio for price fetching
  const coinIds = useMemo(
    () => {
      if (!Array.isArray(portfolioAssets)) {
        return [];
      }
      return portfolioAssets.map((asset) => asset.coinId);
    },
    [portfolioAssets],
  );

  const { prices: livePrices = {} } = useCryptoPrices(coinIds) || {};

  // Subscribe to Firestore portfolio collection in real-time
  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    const portfolioRef = collection(db, 'users', auth.currentUser.uid, 'portfolio');
    const q = query(portfolioRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const assets = [];
        snapshot.forEach((doc) => {
          assets.push({ id: doc.id, ...doc.data() });
        });
        setPortfolioAssets(assets);
        setIsLoading(false);
      },
      (error) => {
        console.error('[PortfolioContext] Erro ao buscar portfólio:', error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  /**
   * Stable trigger callback — identity is preserved across renders so consumers
   * that only depend on setSyncTrigger are not unnecessarily re-rendered.
   */
  const triggerSync = useCallback(() => {
    setSyncTrigger(Date.now());
  }, []);

  /**
   * Memoised context value so that the object reference only changes when one
   * of the underlying pieces of state actually changes.  Without this memo
   * every render of PortfolioProvider creates a new object, causing every
   * context consumer to re-render even when the data is identical.
   */
  const value = useMemo(
    () => ({
      portfolioAssets,
      livePrices,
      isLoading,
      syncTrigger,
      setSyncTrigger,
      triggerSync,
      onChainTokens,
      isSyncingOnChain,
      onChainError,
      onChainWarning,
      wallets,
    }),
    [
      portfolioAssets,
      livePrices,
      isLoading,
      syncTrigger,
      onChainTokens,
      isSyncingOnChain,
      onChainError,
      onChainWarning,
      wallets,
    ],
  );

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

/**
 * usePortfolioContext — hook to access all portfolio context values.
 *
 * Must be used inside a <PortfolioProvider> tree, otherwise throws an error.
 *
 * @returns {{
 *   portfolioAssets: Array<object>,
 *   livePrices: object,
 *   isLoading: boolean,
 *   syncTrigger: string | null,
 *   setSyncTrigger: Function,
 *   triggerSync: Function,
 *   onChainTokens: Array<object>,
 *   isSyncingOnChain: boolean,
 *   onChainError: string | null,
 *   onChainWarning: string | null,
 *   wallets: Array<object>,
 * }}
 */
export function usePortfolioContext() {
  const context = useContext(PortfolioContext);

  if (context === null) {
    throw new Error(
      'usePortfolioContext must be used within a PortfolioProvider. ' +
      'Wrap your component tree with <PortfolioProvider>.',
    );
  }

  return context;
}

export default PortfolioContext;
