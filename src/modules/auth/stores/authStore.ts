import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    sendPasswordResetEmail,
    type User
} from 'firebase/auth';
import { auth, db } from '../../../plugins/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 1 | 2 | 3 | 4 | null; // 1: Admin, 2: Alfita, 3: Designador, 4: Asignado

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const userRole = ref<UserRole>(null);
    const userData = ref<any>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * Inicializa perfil en Firestore sin bloquear.
     */
    const initializeUserProfile = async (firebaseUser: User) => {
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: 1, // Admin por defecto para desarrollo inicial
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.warn('Silent skip: No se pudo escribir en Firestore:', err);
        }
    };

    /**
     * Observer de estado de autenticación.
     */
    auth.onAuthStateChanged(async (firebaseUser) => {
        user.value = firebaseUser ? markRaw(firebaseUser) : null;

        if (firebaseUser) {
            try {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    userData.value = userDoc.data();
                    userRole.value = userDoc.data().role as UserRole;
                } else {
                    userRole.value = 1;
                }
            } catch (err) {
                console.error('Error de permisos, forzando rol Admin local:', err);
                userRole.value = 1;
            }
            initializeUserProfile(firebaseUser);
        } else {
            userRole.value = null;
            userData.value = null;
        }
    });

    const loginWithEmail = async (email: string, pass: string) => {
        loading.value = true;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
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
            userRole.value = 1;
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
            const result = await signInWithPopup(auth, provider);
            console.log('[Auth] Login Google exitoso:', result.user.email);
        } catch (err: any) {
            console.error('[Auth] Error en Login Google:', err.code, err.message);
            error.value = err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        user.value = null;
        userRole.value = null;
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return {
        user,
        userRole,
        userData,
        loading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword
    };
});
