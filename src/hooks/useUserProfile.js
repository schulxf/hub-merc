import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    // Se não há ninguém logado, limpamos o perfil
    if (!auth.currentUser) {
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    // CORREÇÃO AQUI: Apontamos diretamente para o documento do utilizador (2 passos: Coleção -> Doc)
    const profileRef = doc(db, 'users', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        // Caso o utilizador ainda não tenha perfil, assumimos 'free'
        setProfile({ tier: 'free' }); 
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Erro ao ler o perfil:", error);
      setIsLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return { profile, isLoadingProfile };
}