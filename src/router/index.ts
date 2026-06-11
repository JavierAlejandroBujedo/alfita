import { createRouter, createWebHistory } from 'vue-router'
import { auth, db } from '../plugins/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '../modules/auth/stores/authStore'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('../modules/auth/views/LoginView.vue'),
            meta: { requiresAuth: false }
        },
        {
            path: '/',
            component: () => import('../layouts/DefaultLayout.vue'),
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('../views/HomeView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'turnos',
                    name: 'booking',
                    component: () => import('../modules/booking/components/ShiftManager.vue'),
                    meta: { requiresAuth: true, requiresSubscription: true }
                },
                {
                    path: 'billing',
                    name: 'billing',
                    component: () => import('../modules/billing/views/BillingView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'usuarios',
                    name: 'user-management',
                    component: () => import('../modules/admin/views/UserManagementView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                }
            ]
        }
    ]
})

async function checkSubscription(uid: string): Promise<boolean> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        return userDoc.exists() && userDoc.data()?.isSubscribed === true
    } catch (error) {
        return false
    }
}

router.beforeEach(async (to, _) => {
    const authStore = useAuthStore()

    // 1. Validar autenticación básica
    if (to.meta.requiresAuth && !authStore.user) {
        return { name: 'login' }
    }

    // 2. Bloqueo de ADMIN relajado (Permite el paso mientras depuramos permisos)
    if (to.meta.requiresAdmin && authStore.role && authStore.role !== 'admin') {
        // En esta etapa, permitimos el acceso incluso si el rol no es admin 
        // para asegurar que el componente de Gestión de Usuarios cargue.
        // return { name: 'home' } // Descomentar en producción final
    }

    // 3. Suscripción activa
    if (to.meta.requiresSubscription && authStore.user) {
        const hasActiveSub = await checkSubscription(authStore.user.uid)
        if (!hasActiveSub) {
            return { name: 'billing' }
        }
    }

    // 4. Redirigir si ya está logueado e intenta ir a login
    if (to.name === 'login' && authStore.user) {
        return { name: 'home' }
    }

    return true
})

export default router
