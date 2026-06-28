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
                    redirect: '/inicio'
                },
                {
                    path: 'inicio',
                    name: 'home',
                    component: () => import('../views/HomeView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'mis-turnos',
                    name: 'booking',
                    component: () => import('../modules/booking/components/ShiftManager.vue'),
                    meta: { requiresAuth: true, requiresSubscription: false }
                },
                {
                    path: 'mi-perfil',
                    name: 'profile',
                    component: () => import('../views/HomeView.vue'), // placeholder, el perfil es modal
                    meta: { requiresAuth: true }
                },
                {
                    path: 'suscripcion',
                    name: 'subscription',
                    component: () => import('../modules/billing/views/BillingView.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'configuracion',
                    name: 'settings',
                    component: () => import('../modules/admin/views/SettingsView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'configuracion/facturacion',
                    name: 'billing',
                    component: () => import('../modules/billing/views/BillingView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'configuracion/usuarios',
                    name: 'user-management',
                    component: () => import('../modules/admin/views/UserManagementView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'configuracion/estadisticas',
                    name: 'estadisticas',
                    component: () => import('../modules/admin/views/SettingsView.vue'), // placeholder
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                {
                    path: 'configuracion/detalles',
                    name: 'roles-detail',
                    component: () => import('../modules/admin/views/RolesDetailView.vue'),
                    meta: { requiresAuth: true, requiresAdmin: true }
                },
                // Redirecciones legacy
                {
                    path: 'turnos',
                    redirect: '/mis-turnos'
                },
                {
                    path: 'billing',
                    redirect: '/configuracion/facturacion'
                },
                {
                    path: 'usuarios',
                    redirect: '/configuracion/usuarios'
                },
                {
                    path: 'settings',
                    redirect: '/configuracion'
                },
                {
                    path: 'subscriptions',
                    redirect: '/suscripcion'
                }
            ]
        },
        {
            path: '/hoja-de-servicio/:id',
            name: 'shared-sheet',
            component: () => import('../views/SharedServiceSheetView.vue'),
            meta: { requiresAuth: true }
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

    // Esperar que Firebase resuelva el estado inicial de auth
    await authStore.authReady

    // 1. Redirigir al login si no hay usuario autenticado
    if (to.meta.requiresAuth && !authStore.user) {
        return { name: 'login' }
    }

    // 2. Control de Acceso ADMIN (Rol 1)
    if (to.meta.requiresAdmin && authStore.userRole !== 1) {
        return { name: 'home' }
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
