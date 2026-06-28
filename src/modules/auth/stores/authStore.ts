import { defineStore } from 'pinia';
import { ref, markRaw, computed } from 'vue';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User
} from 'firebase/auth';
import { auth, db } from '../../../plugins/firebase';
import { doc, getDoc, setDoc, serverTimestamp, query, where, collection, getDocs, limit, writeBatch, onSnapshot } from 'firebase/firestore';

export type UserRole = 1 | 2 | 3 | null; // 1: Admin, 2: Designador, 3: Asignado

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const userRole = ref<UserRole>(null);
    const userData = ref<any>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const showProfileModal = ref(false);
    const shouldFocusSvc = ref(false);
    let userUnsubscribe: any = null;

    /**
     * Promise que se resuelve cuando Firebase determina por primera vez el estado
     * de autenticación. Evita race conditions entre el router y onAuthStateChanged.
     */
    let _resolveReady!: () => void;
    const authReady: Promise<void> = new Promise((resolve) => { _resolveReady = resolve; });
    let _authReadyResolved = false;

    // Determinar si el perfil está incompleto
    const isProfileIncomplete = computed(() => {
        if (!user.value) return false;
        if (userRole.value === 1) return false; // Admin siempre completo para evitar bloqueos
        if (!userData.value) return true;

        const d = userData.value;
        const basicInfo = !!(d.displayName && d.dni && d.phone && d.reparticion && d.hierarchy);
        if (!basicInfo) return true;

        // Si es Designador, debe tener al menos un SVC
        if (userRole.value === 2) {
            return !d.svcNumbers || d.svcNumbers.length === 0;
        }

        return false;
    });

    /**
     * Crea o migra el perfil en Firestore.
     */
    const initializeUserProfile = async (firebaseUser: User) => {
        console.log('[Auth] Inicializando perfil para:', firebaseUser.email);
        try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.log('[Auth] UID no encontrado. Buscando por email para migración...');
                const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email), limit(1));
                const querySnap = await getDocs(q);

                if (!querySnap.empty) {
                    const legacyData = querySnap.docs[0].data();
                    console.log('[Auth] Perfil legacy encontrado. Migrando datos...', legacyData);

                    // 1. Migrar documento de usuario
                    await setDoc(userRef, {
                        ...legacyData,
                        uid: firebaseUser.uid,
                        photoURL: firebaseUser.photoURL ?? legacyData.photoURL ?? '',
                        updatedAt: serverTimestamp()
                    });

                    // 2. Migrar "Propiedad" de las hojas (Deep Migration)
                    // Esto evita el error de permisos y asegura que la query UID las encuentre
                    try {
                        const sheetsQ = query(collection(db, 'serviceSheets'), where('createdByEmail', '==', firebaseUser.email));
                        const sheetsSnap = await getDocs(sheetsQ);

                        if (!sheetsSnap.empty) {
                            console.log(`[Auth] Migrando ${sheetsSnap.size} hojas de servicio al nuevo UID...`);
                            const batch = writeBatch(db);
                            sheetsSnap.docs.forEach((d) => {
                                batch.update(d.ref, {
                                    createdBy: firebaseUser.uid,
                                    updatedAt: serverTimestamp()
                                });
                            });
                            await batch.commit();
                            console.log('[Auth] Migración de hojas completada con éxito.');
                        }
                    } catch (migrationErr) {
                        console.warn('[Auth] No se pudieron migrar las hojas (posible falta de permisos como admin):', migrationErr);
                    }

                    return legacyData;
                }

                console.log('[Auth] No se encontró perfil previo. Creando nuevo con Role 3.');
                const newData = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName ?? '',
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL ?? '',
                    role: 3,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    svcNumbers: [],
                    membershipType: 'GRATIS'
                };
                await setDoc(userRef, newData);
                return newData;
            }
            console.log('[Auth] Perfil ya existente con este UID.');
            return userDoc.data();
        } catch (err) {
            console.error('[Auth] Error crítico en initializeUserProfile:', err);
            return null;
        }
    };

    /**
     * Observer de estado de autenticación. Lee Firestore UNA sola vez por sesión.
     * Resuelve authReady en la primera ejecución para desbloquear el router.
     */
    auth.onAuthStateChanged(async (firebaseUser) => {
        console.log('[Auth] onAuthStateChanged:', firebaseUser?.email || 'No user');

        // Limpiar listener previo si existe
        if (userUnsubscribe) {
            userUnsubscribe();
            userUnsubscribe = null;
        }

        user.value = firebaseUser ? markRaw(firebaseUser) : null;

        if (firebaseUser) {
            try {
                // 1. Verificar/Inicializar perfil
                await initializeUserProfile(firebaseUser);

                // 2. Establecer listener en tiempo real para userData
                const userRef = doc(db, 'users', firebaseUser.uid);
                userUnsubscribe = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        userData.value = data;
                        userRole.value = data.role as UserRole;
                        console.log('[Auth] Perfil actualizado (Realtime):', userRole.value);
                    }

                    // Solo resolvemos la carga inicial una vez
                    if (!_authReadyResolved) {
                        _authReadyResolved = true;
                        _resolveReady();
                    }
                }, (err) => {
                    console.error('[Auth] Error en listener de perfil:', err);
                    if (!_authReadyResolved) { _authReadyResolved = true; _resolveReady(); }
                });

            } catch (err) {
                console.error('[Auth] Error al inicializar usuario:', err);
                userRole.value = 3;
                if (!_authReadyResolved) { _authReadyResolved = true; _resolveReady(); }
            }
        } else {
            userRole.value = null;
            userData.value = null;

            if (!_authReadyResolved) {
                _authReadyResolved = true;
                _resolveReady();
            }
        }
    });

    // Procesar resultado de redirect al volver de Google (ya no se usa pero se mantiene por compatibilidad)
    // getRedirectResult(auth).catch(() => { });

    /**
     * Login con Google via popup.
     * Vite está configurado con 'Cross-Origin-Opener-Policy: same-origin-allow-popups'
     * lo que permite que el popup de Google funcione correctamente en desarrollo.
     */
    const loginWithGoogle = async () => {
        loading.value = true;
        error.value = null;
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            // onAuthStateChanged + authReady se encargan del resto
        } catch (err: any) {
            error.value = err.code ?? err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const logout = async () => {
        await signOut(auth);
        user.value = null;
        userRole.value = null;
        userData.value = null;
    };

    return {
        user,
        userRole,
        userData,
        loading,
        error,
        authReady,
        isProfileIncomplete,
        showProfileModal,
        shouldFocusSvc,
        loginWithGoogle,
        logout
    };
});
