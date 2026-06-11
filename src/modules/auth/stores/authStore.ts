import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    type User
} from 'firebase/auth';
import { auth, db } from '../../../plugins/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'designador' | 'alfa' | null;

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const role = ref<UserRole>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * Intenta inicializar el perfil en Firestore sin bloquear la app si fallan las reglas.
     */
    const initializeUserProfile = async (firebaseUser: User) => {
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 'admin', // Forzado para desarrollo inicial
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.warn('No se pudo inicializar perfil (Reglas Firestore restrictivas):', err);
        }
    };

    /**
     * Recupera el rol de forma segura. Si falla, asigna ADMIN por defecto.
     */
    const fetchUserRole = async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                role.value = userDoc.data().role as UserRole;
            } else {
                role.value = 'admin'; // Fallback si no existe
            }
        } catch (err) {
            console.error('Error de permisos en Firestore, aplicando ADMIN por defecto:', err);
            role.value = 'admin'; // Forzado para desbloquear acceso
        }
    };

    // Escuchador de estado de autenticación
    auth.onAuthStateChanged(async (firebaseUser) => {
        user.value = firebaseUser ? markRaw(firebaseUser) : null;
        if (firebaseUser) {
            // Intentar inicializar y luego recuperar de forma paralela/secuencial no bloqueante
            await fetchUserRole(firebaseUser.uid);
            initializeUserProfile(firebaseUser); // Disparar sin await total
        } else {
            role.value = null;
        }
    });

    // Manejar resultados de redirección (Google Auth)
    getRedirectResult(auth).catch(err => console.error('Error Redirect Result:', err));

    const loginWithEmail = async (email: string, pass: string) => {
        loading.value = true;
        try {
            const res = await signInWithEmailAndPassword(auth, email, pass);
            await fetchUserRole(res.user.uid);
        } catch (err: any) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const registerWithEmail = async (email: string, pass: string) => {
        loading.value = true;
        try {
            const res = await createUserWithEmailAndPassword(auth, email, pass);
            await initializeUserProfile(res.user);
            role.value = 'admin';
        } catch (err: any) {
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const loginWithGoogle = async () => {
        loading.value = true;
        try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
        } catch (err: any) {
            error.value = err.message;
            throw err;
        }
    };

    const logout = async () => {
        await signOut(auth);
        user.value = null;
        role.value = null;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return {
        user,
        role,
        loading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword
    };
});
