import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// "OJOS" PARA TERMINAL/CONSOLA: Verificación de carga de variables
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
console.log('[Firebase Init] API Key cargada:', rawApiKey ? `${rawApiKey.substring(0, 5)}...` : 'FALTANTE');

const firebaseConfig = {
    apiKey: rawApiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validación preventiva
if (!firebaseConfig.apiKey) {
    console.error('[CRÍTICO] Firebase API Key no detectada. Revisa tu archivo .env y reinicia el servidor.');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

console.log('[Firebase Init] App inicializada correctamente con projectId:', firebaseConfig.projectId);
