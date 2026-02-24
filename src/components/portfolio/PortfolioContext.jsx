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
 * @param {React.ReactNode} props.children   - Child components that consume context
 * @param {string|null}     [props.clientUid] - Optional UID to view another user's portfolio.
 *                                              When provided the context operates in read-only mode.
 */
export function PortfolioProvider({ children, clientUid = null }) {
  // Use clientUid if provided (assessor viewing client), otherwise the logged-in user.
  const uid = clientUid || auth.currentUser?.uid;
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

  // Subscribe to Firestore portfolio collection in real-time.
  // Re-subscribes whenever `uid` changes (e.g. assessor switching between clients).
  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      return;
    }

    const portfolioRef = collection(db, 'users', uid, 'portfolio');
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
  }, [uid]);

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
      /** true when the provider is viewing another user's portfolio (assessor mode) */
      readOnly: !!clientUid,
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
      clientUid,
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
 *   readOnly: boolean,
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
