<template>
  <v-app id="alfita-app">
    <!-- Menú Lateral Estilo Google -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      border="0"
      elevation="2"
      :color="sidebarColor"
      class="pa-4 border-none"
      width="280"
    >
      <!-- Logo centrado sobre ALFITA -->
      <div class="d-flex flex-column align-center mb-8 mt-2 px-2">
        <v-icon color="primary" size="36" style="transform: rotate(180deg)" class="mb-1">mdi-vuetify</v-icon>
        <h1 class="text-h5 font-weight-black ls-tight" :class="isSidebarDark ? 'text-white' : 'text-primary'">ALFITA</h1>
      </div>

      <v-list 
        v-model:opened="openedGroups"
        density="compact" 
        nav 
        class="bg-transparent px-2" 
        :theme="isSidebarDark ? 'dark' : 'light'"
      >
        <!-- 1. Inicio -->
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="Inicio"
          to="/inicio"
          color="primary"
          rounded="pill"
          class="mb-2"
        />
        
        <!-- 2. Mis Turnos -->
        <v-list-item
          prepend-icon="mdi-calendar-check-outline"
          title="Mis Turnos"
          to="/mis-turnos"
          color="primary"
          rounded="pill"
          class="mb-2"
        />

        <!-- 3. Mi Perfil (abre modal + URL /mi-perfil) -->
        <v-list-item
          prepend-icon="mdi-account-circle-outline"
          title="Mi Perfil"
          color="primary"
          rounded="pill"
          class="mb-2"
          :active="profileModalShow"
          @click="openProfile"
        />

        <!-- 4. Suscripción -->
        <v-list-item
          prepend-icon="mdi-star-circle-outline"
          title="Suscripción"
          to="/suscripcion"
          color="primary"
          rounded="pill"
          class="mb-2"
        />

        <!-- 5. CONFIGURACIÓN (ADMIN SOLAMENTE) -->
        <v-list-group v-if="authStore.userRole === 1" value="Settings">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-cog-outline"
              title="Configuración"
              to="/configuracion"
              rounded="pill"
              class="mb-2 font-weight-bold"
            ></v-list-item>
          </template>

          <v-list-item
            prepend-icon="mdi-credit-card-outline"
            title="Facturación"
            to="/configuracion/facturacion"
            rounded="pill"
            class="mb-1 ml-4"
          />

          <v-list-item
            prepend-icon="mdi-account-multiple-outline"
            title="Control de Usuarios"
            to="/configuracion/usuarios"
            rounded="pill"
            class="mb-1 ml-4"
          />

          <v-list-item
            prepend-icon="mdi-chart-bar"
            title="Estadísticas"
            to="/configuracion/estadisticas"
            rounded="pill"
            class="mb-1 ml-4"
          />

          <v-list-item
            prepend-icon="mdi-information-outline"
            title="Detalles"
            to="/configuracion/detalles"
            rounded="pill"
            class="mb-1 ml-4"
          />
        </v-list-group>
      </v-list>

      <div class="px-4 pb-8">
        <v-divider class="mt-6 mb-4 mx-2" :color="isSidebarDark ? 'white' : 'primary'"></v-divider>
        <v-btn
          block
          variant="text"
          :color="isSidebarDark ? 'white' : 'primary'"
          rounded="pill"
          prepend-icon="mdi-logout"
          class="text-none justify-start px-4 font-weight-medium"
          @click="handleLogout"
        >
          Cerrar Sesión
        </v-btn>
      </div>
    </v-navigation-drawer>

    <!-- App Bar Global -->
    <v-app-bar flat class="bg-background border-b px-2">
      <v-app-bar-nav-icon color="primary" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="font-weight-bold text-grey-darken-3">
        {{ currentRouteTitle }}
      </v-app-bar-title>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container fluid class="pa-6">
        <router-view></router-view>
      </v-container>
    </v-main>

    <!-- Modal de Perfil Global -->
    <ProfileModal 
      :show="profileModalShow" 
      @close="closeProfile" 
      @updated="onProfileUpdated"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { auth } from '../plugins/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

import { useAuthStore } from '../modules/auth/stores/authStore'
import ProfileModal from '../components/ProfileModal.vue'

const { mobile: isMobile } = useDisplay()
const authStore = useAuthStore()
const drawer = ref(false)
const router = useRouter()
const route = useRoute()

// Color dinámico según el Rol
const sidebarColor = computed(() => {
  switch (authStore.userRole) {
    case 1: return 'deep-purple-lighten-5' // Admin (Púrpura suave)
    case 2: return 'blue-lighten-5'        // Alfita (Celeste suave)
    case 3: return 'amber-lighten-4'       // Designador (Naranja suave)
    case 4: return 'green-lighten-5'       // Asignado (Verde suave)
    default: return 'grey-lighten-4'
  }
})

// Determina si el texto debe ser blanco o negro por contraste
const isSidebarDark = computed(() => {
  // Ahora todos los fondos son claros para una estética suave
  return false
})

const profileModalShow = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const openProfile = () => {
  profileModalShow.value = true
}

const closeProfile = () => {
  profileModalShow.value = false
}

const currentRouteTitle = computed(() => {
  switch (route.name) {
    case 'home': {
      const name = authStore.userData?.displayName
      if (name && name.trim()) {
        const firstWord = name.trim().split(' ')[0]
        return `¡Hola ${firstWord}!`
      }
      return 'Panel de Inicio'
    } 
    case 'profile': return 'Mi Perfil'
    case 'subscription': return 'Suscripción'
    case 'booking': return 'Mis Turnos'
    case 'billing': return 'Facturación'
    case 'user-management': return 'Control de Usuarios'
    case 'settings': return 'Configuración'
    case 'estadisticas': return 'Estadísticas'
    case 'roles-detail': return 'Detalles del Sistema'
    default: return 'ALFITA'
  }
})

const handleLogout = async () => {
  try {
    await signOut(auth)
    router.replace('/login')
  } catch (error) {
    console.error('Error logout:', error)
  }
}

const onProfileUpdated = () => {
  snackbar.text = 'Perfil actualizado correctamente'
  snackbar.color = 'success'
  snackbar.show = true
}

// Control de grupos abiertos en el sidebar
const openedGroups = ref<string[]>([])

watch(() => route.path, (newPath) => {
  if (isMobile.value) drawer.value = false
  
  // Auto-expandir configuración si estamos en la ruta raíz o subrutas
  if (newPath === '/configuracion' || newPath.startsWith('/configuracion/')) {
    if (!openedGroups.value.includes('Settings')) {
      openedGroups.value = ['Settings']
    }
  }
}, { immediate: true })
</script>

<style scoped>
.ls-tight { letter-spacing: -2px !important; }
#alfita-app { font-family: 'Inter', 'Google Sans', 'Roboto', sans-serif !important; }
</style>
