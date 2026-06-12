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
      <div class="d-flex align-center mb-10 mt-2 px-2">
        <v-icon color="primary" size="32" class="mr-3" style="transform: rotate(180deg)">mdi-vuetify</v-icon>
        <h1 class="text-h5 font-weight-black text-primary ls-tight">ALFITA</h1>
      </div>

      <v-list density="compact" nav class="bg-transparent px-2">
        <!-- 1. Inicio -->
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="Inicio"
          to="/"
          color="primary"
          rounded="pill"
          class="mb-2"
        />
        
        <!-- 2. Mis Turnos -->
        <v-list-item
          prepend-icon="mdi-calendar-check-outline"
          title="Mis Turnos"
          to="/turnos"
          color="primary"
          rounded="pill"
          class="mb-2"
        />

        <!-- 3. Mi Perfil (Global Modal) -->
        <v-list-item
          prepend-icon="mdi-account-circle-outline"
          title="Mi Perfil"
          @click="profileModalShow = true"
          color="primary"
          rounded="pill"
          class="mb-2"
        />

        <!-- 4. CONFIGURACIÓN (ADMIN SOLAMENTE) -->
        <v-list-group v-if="authStore.userRole === 1" value="Settings">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-cog-outline"
              title="Configuración"
              to="/settings"
              rounded="pill"
              class="mb-2"
            ></v-list-item>
          </template>

          <v-list-item
            prepend-icon="mdi-credit-card-outline"
            title="Facturación"
            to="/billing"
            rounded="pill"
            class="mb-1 ml-4"
          />

          <v-list-item
            prepend-icon="mdi-account-multiple-outline"
            title="Usuarios"
            to="/usuarios"
            rounded="pill"
            class="mb-1 ml-4"
          />

          <v-list-item
            prepend-icon="mdi-star-settings-outline"
            title="Planes"
            to="/settings"
            rounded="pill"
            class="mb-1 ml-4"
          />
        </v-list-group>
      </v-list>

      <template v-slot:append>
        <div class="px-2 pb-4">
          <v-divider class="mb-6 mx-2"></v-divider>
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
      @close="profileModalShow = false" 
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

const currentRouteTitle = computed(() => {
  switch (route.name) {
    case 'home': return 'Panel de Inicio'
    case 'profile': return 'Mi Perfil'
    case 'booking': return 'Mis Turnos'
    case 'billing': return 'Facturación'
    case 'user-management': return 'Control de Usuarios'
    case 'settings': return 'Configuración de Planes'
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
