// src/hooks/useWallets.js
import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

/**
 * Hook reutilizável para ouvir carteiras do utilizador em tempo real.
 * Substitui listeners duplicados em Portfolio.jsx e Wallets.jsx.
 */
export function useWallets() {
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setWallets([]);
      setIsLoading(false);
      return;
    }

    const walletsRef = collection(db, 'users', auth.currentUser.uid, 'wallets');
    const q = query(walletsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = [];
        snapshot.forEach((docSnap) => {
          next.push({ id: docSnap.id, ...docSnap.data() });
        });
        setWallets(next);
        setIsLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar carteiras:', error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { wallets, isLoading };
}
