import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Puxamos as chaves seguras do ficheiro .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar os serviços que vamos usar
export const auth = getAuth(app); // Para Login

// Firestore com offline persistence (PR1 - Infraestrutura)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} catch (e) {
  // Se falhar, usar getFirestore() sem cache
  db = getFirestore(app);
}
export { db };

// Storage para upload de ficheiros
export const storage = getStorage(app);
