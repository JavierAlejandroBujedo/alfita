import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "alfita-com-ar.firebaseapp.com",
    projectId: "alfita-com-ar",
    storageBucket: "alfita-com-ar.firebasestorage.app",
    messagingSenderId: "75685444510",
    appId: "1:75685444510:web:478caddfefec04c2d1b48f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
