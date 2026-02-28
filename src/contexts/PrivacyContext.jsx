// src/contexts/PrivacyContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const PrivacyContext = createContext(null);

/**
 * PrivacyProvider — manages privacy mode toggle and masked value rendering.
 * Persists preference to localStorage under 'mercurius_privacy_mode'.
 *
 * Context Value:
 * {
 *   isPrivate: boolean,
 *   togglePrivacy: () => void,
 *   formatValue: (value: number, type?: 'usd'|'percent'|'crypto') => string
 * }
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function PrivacyProvider({ children }) {
  // Initialize from localStorage so the preference survives page reloads
  const [isPrivate, setIsPrivate] = useState(() => {
    try {
      return localStorage.getItem('mercurius_privacy_mode') === 'true';
    } catch {
      return false;
    }
  });

  const togglePrivacy = useCallback(() => {
    setIsPrivate((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mercurius_privacy_mode', String(next));
      } catch {}
      return next;
    });
  }, []);

  /**
   * formatValue — conditionally masks or formats monetary values.
   *
   * @param {number} value - The value to format
   * @param {'usd'|'percent'|'crypto'} [type='usd'] - Format type
   * @returns {string}
   */
  const formatValue = useCallback(
    (value, type = 'usd') => {
      if (isPrivate) {
        if (type === 'percent') return '**.*%';
        if (type === 'crypto') return '*.***** ';
        return '$ ***,***.** ';
      }

      if (type === 'percent') {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
      }
      if (type === 'crypto') {
        return value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 8,
        });
      }
      // Default: usd
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [isPrivate],
  );

  const contextValue = useMemo(
    () => ({
      isPrivate,
      togglePrivacy,
      formatValue,
    }),
    [isPrivate, togglePrivacy, formatValue],
  );

  return (
    <PrivacyContext.Provider value={contextValue}>
      {children}
    </PrivacyContext.Provider>
  );
}

/**
 * usePrivacyMode — convenience hook for accessing PrivacyContext.
 * Must be used within a PrivacyProvider tree.
 *
 * @returns {{
 *   isPrivate: boolean,
 *   togglePrivacy: () => void,
 *   formatValue: (value: number, type?: string) => string
 * }}
 */
export function usePrivacyMode() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacyMode must be used within a PrivacyProvider');
  }
  return context;
}

export default PrivacyContext;
