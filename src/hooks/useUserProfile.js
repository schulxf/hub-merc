import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes instead of using mutable auth.currentUser reference
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      // User is authenticated, subscribe to their profile document
      const profileRef = doc(db, 'users', user.uid);

      const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // If user document doesn't exist yet, default to 'free' tier
          setProfile({ tier: 'free' });
        }
        setIsLoadingProfile(false);
      }, (error) => {
        console.error("Erro ao ler o perfil:", error);
        setProfile({ tier: 'free' });
        setIsLoadingProfile(false);
      });

      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  return { profile, isLoadingProfile };
}