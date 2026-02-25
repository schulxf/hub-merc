/**
 * useAuthRole — retrieve user role from Firebase custom claims.
 * Subscribes to auth state and resolves role with fallback to 'user'.
 *
 * @returns {{ role: 'user' | 'assessor' | 'admin', isLoading: boolean, error: Error | null }}
 */
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function useAuthRole() {
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole('user');
        setIsLoading(false);
        return;
      }

      try {
        const result = await user.getIdTokenResult();
        const claimedRole = result.claims.role;
        setRole(claimedRole ?? 'user');
        setError(null);
      } catch (err) {
        console.error('[useAuthRole] Failed to resolve role from claims:', err);
        setError(err);
        setRole('user');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { role, isLoading, error };
}
