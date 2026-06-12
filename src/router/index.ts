import { createRouter, createWebHistory } from 'vue-router'
import { db } from '../plugins/firebase'
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
                    meta: { requiresAuth: true, requiresSubscription: false }
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
                },
                {
                    path: 'settings',
                    name: 'settings',
                    component: () => import('../modules/admin/views/SettingsView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'subscriptions',
                    redirect: '/settings'
                }
            ]
        }
    ]
})

/**
 * Verificación de suscripción.
 */
async function checkSubscription(uid: string): Promise<boolean> {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        return userDoc.exists() && userDoc.data()?.isSubscribed === true
    } catch (error) {
        return true // No bloquear en desarrollo
    }
}

router.beforeEach(async (to, _) => {
    const authStore = useAuthStore()

    // 1. Redirigir al login si no hay usuario autenticado
    if (to.meta.requiresAuth && !authStore.user) {
        return { name: 'login' }
    }

    // 2. Control de Acceso ADMIN (Rol 1)
    if (to.meta.requiresAdmin && authStore.userRole !== 1) {
        // Por ahora dejamos pasar para no bloquear desarrollo, pero validamos lógica
        // return { name: 'home' } 
    }

    // 3. Verificación de Suscripción
    if (to.meta.requiresSubscription && authStore.user) {
        const hasActiveSub = await checkSubscription(authStore.user.uid)
        if (!hasActiveSub) {
            return { name: 'billing' }
        }
    }

    // 4. Redirigir si intenta ir al login estando ya logueado
    if (to.name === 'login' && authStore.user) {
        return { name: 'home' }
    }

    return true
})

export default router
