<template>
  <v-app id="alfita-app">
    <!-- Menú Lateral -->
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
        <v-icon color="primary" size="32" class="mr-3">mdi-calendar-check</v-icon>
        <h1 class="text-h5 font-weight-black text-primary ls-tight">ALFITA</h1>
      </div>

      <v-list density="compact" nav class="bg-transparent px-2">
        <v-list-item
          prepend-icon="mdi-home-outline"
          title="Inicio"
          to="/"
          color="primary"
          rounded="pill"
          class="mb-2"
        />
        <v-list-item
          prepend-icon="mdi-calendar-check-outline"
          title="Mis Turnos"
          to="/turnos"
          color="primary"
          rounded="pill"
          class="mb-2"
        />
        <v-list-item
          prepend-icon="mdi-credit-card-outline"
          title="Facturación"
          to="/billing"
          color="primary"
          rounded="pill"
          class="mb-2"
        />

        <!-- ACCESO FORZADO PARA DEPURACIÓN -->
        <v-list-item
          prepend-icon="mdi-account-multiple-outline"
          title="Usuarios"
          to="/usuarios"
          color="primary"
          rounded="pill"
          class="mb-2"
        />
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
            Cerrar sesión
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar flat border="b" class="px-4 bg-surface" height="64" elevation="0">
      <v-app-bar-nav-icon v-if="isMobile" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="font-weight-bold text-grey-darken-3">
        {{ currentRouteTitle }}
      </v-app-bar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main class="bg-background">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { auth } from '../plugins/firebase'
import { signOut } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const { mobile: isMobile } = useDisplay()
const drawer = ref(!isMobile.value)
const router = useRouter()
const route = useRoute()

const currentRouteTitle = computed(() => {
  switch (route.name) {
    case 'home': return 'Panel de Inicio'
    case 'booking': return 'Gestión de Turnos'
    case 'billing': return 'Planes y Facturación'
    case 'user-management': return 'Control de Usuarios'
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

watch(() => route.path, () => {
  if (isMobile.value) drawer.value = false
})
</script>

<style scoped>
.ls-tight { letter-spacing: -2px !important; }
#alfita-app { font-family: 'Google Sans', 'Roboto', sans-serif !important; }
</style>
