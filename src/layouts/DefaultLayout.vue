<template>
  <v-app id="alfita-app">
    <!-- Menú Lateral Estilo Google -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      border="0"
      elevation="0"
      class="bg-background pa-4"
      width="280"
    >
      <!-- Logo centrado sobre ALFITA -->
      <div class="d-flex flex-column align-center mb-8 mt-2 px-2">
        <v-icon color="primary" size="36" style="transform: rotate(180deg)" class="mb-1">mdi-vuetify</v-icon>
        <h1 class="text-h5 font-weight-black text-primary ls-tight">ALFITA</h1>
      </div>

      <v-list density="compact" nav class="bg-transparent px-2">
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
          :active="route.path === '/mi-perfil'"
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
              class="mb-2 text-black font-weight-bold"
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
            class="mb-1 ml-4 text-black"
          />

          <v-list-item
            prepend-icon="mdi-chart-bar"
            title="Estadísticas"
            to="/configuracion/estadisticas"
            rounded="pill"
            class="mb-1 ml-4"
          />
        </v-list-group>
      </v-list>

      <template v-slot:append>
        <div class="px-2 pb-8">
          <v-divider class="mb-4 mx-2"></v-divider>
          <v-btn
            block
            variant="text"
            color="error"
            rounded="pill"
            prepend-icon="mdi-logout"
            class="text-none justify-start px-4 font-weight-medium"
            @click="handleLogout"
          >
            Cerrar Sesión
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar para Móviles -->
    <v-app-bar v-if="isMobile" flat class="bg-background border-b px-2">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
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
const drawer = ref(!isMobile.value)
const router = useRouter()
const route = useRoute()

const profileModalShow = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const openProfile = () => {
  router.push('/mi-perfil')
  profileModalShow.value = true
}

const closeProfile = () => {
  profileModalShow.value = false
  if (route.path === '/mi-perfil') {
    router.push('/inicio')
  }
}

// Si el usuario navega directamente a /mi-perfil, abrir el modal automáticamente
watch(() => route.path, (path) => {
  if (path === '/mi-perfil') {
    profileModalShow.value = true
  }
}, { immediate: true })

const currentRouteTitle = computed(() => {
  switch (route.name) {
    case 'home': return 'Panel de Inicio'
    case 'profile': return 'Mi Perfil'
    case 'subscription': return 'Suscripción'
    case 'booking': return 'Mis Turnos'
    case 'billing': return 'Facturación'
    case 'user-management': return 'Control de Usuarios'
    case 'settings': return 'Configuración'
    case 'estadisticas': return 'Estadísticas'
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

watch(() => route.path, () => {
  if (isMobile.value) drawer.value = false
})
</script>

<style scoped>
.ls-tight { letter-spacing: -2px !important; }
#alfita-app { font-family: 'Inter', 'Google Sans', 'Roboto', sans-serif !important; }
</style>
