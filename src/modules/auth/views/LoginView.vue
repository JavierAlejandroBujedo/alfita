<template>
  <div class="login-root">
    <v-container fluid class="pa-4 pa-sm-6 fill-height">
      <v-row no-gutters align="center" justify="center" class="fill-height">
        <v-col cols="12" sm="8" md="6" lg="4" xl="3">

          <!-- Marca -->
          <div class="text-center mb-8">
            <div class="brand-icon-wrapper mx-auto mb-3">
              <v-icon color="white" size="28">mdi-shield-check</v-icon>
            </div>
            <h1 class="brand-name text-primary">ALFITA</h1>
            <p class="brand-tagline text-medium-emphasis">Gestión de servicios</p>
          </div>

          <!-- Tarjeta -->
          <v-card
            class="login-card pa-6 pa-sm-8"
            rounded="xl"
            flat
            border
          >
            <!-- Encabezado de la tarjeta -->
            <div class="mb-6">
              <h2 class="card-title text-high-emphasis">Bienvenido</h2>
              <p class="card-subtitle text-medium-emphasis mt-1">
                Ingresá con tu cuenta de Google para acceder al sistema.
              </p>
            </div>

            <!-- Botón Google -->
            <v-btn
              id="btn-google-login"
              block
              size="large"
              rounded="pill"
              class="google-btn font-weight-bold mb-4"
              :loading="loading"
              :disabled="loading"
              variant="flat"
              @click="handleGoogleLogin"
            >
              <template #prepend>
                <svg
                  class="google-svg"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </template>
              Continuar con Google
            </v-btn>

            <!-- Nota de acceso -->
            <p class="access-note text-center text-medium-emphasis">
              Al ingresar por primera vez, recordá completar tus datos en <strong>Mi Perfil</strong>.
            </p>
          </v-card>

        </v-col>
      </v-row>
    </v-container>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      rounded="pill"
      location="bottom center"
    >
      <div class="d-flex align-center ga-2">
        <v-icon size="18">mdi-alert-circle-outline</v-icon>
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'error' })

// Códigos que NO deben mostrar snackbar (el usuario simplemente cerró el popup)
const silentCodes = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

const errorMessages: Record<string, string> = {
  'auth/popup-blocked':           'El navegador bloqueó la ventana de Google. Habilitá los popups para este sitio.',
  'auth/network-request-failed':  'Error de red. Verificá tu conexión a internet.',
  'auth/user-disabled':           'Tu cuenta fue deshabilitada. Contactá al administrador.',
  'auth/account-exists-with-different-credential': 'Esta cuenta ya existe con otro método de acceso.',
}

const handleGoogleLogin = async () => {
  loading.value = true
  try {
    await authStore.loginWithGoogle()
    router.replace('/')
  } catch (err: any) {
    const code: string = err?.code ?? ''
    if (!silentCodes.has(code)) {
      snackbar.text = errorMessages[code] ?? 'Ocurrió un error al iniciar sesión. Reintentá en unos segundos.'
      snackbar.show = true
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ---- Raíz: fondo gris very-light de Google ---- */
.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
}

/* ---- Ícono de marca ---- */
.brand-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #1a73e8;
  box-shadow: 0 4px 16px rgba(26, 115, 232, 0.28);
}

/* ---- Tipografía de marca ---- */
.brand-name {
  font-size: clamp(2rem, 8vw, 2.6rem);
  font-weight: 900;
  letter-spacing: -2px;
  line-height: 1;
  margin: 0;
}

.brand-tagline {
  font-size: 0.78rem;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  margin: 4px 0 0;
}

/* ---- Tarjeta ---- */
.login-card {
  background: #ffffff !important;
  border-color: #e0e0e0 !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06) !important;
}

/* ---- Encabezado de tarjeta ---- */
.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.3px;
}

.card-subtitle {
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* ---- Botón Google ---- */
.google-btn {
  background: #f1f3f4 !important;
  color: #3c4043 !important;
  border: 1px solid #dadce0 !important;
  height: 52px !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.1px !important;
  transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease !important;
}

.google-btn:hover:not(:disabled) {
  background: #e8eaed !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
  transform: translateY(-1px);
}

.google-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none !important;
}

.google-svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ---- Nota de acceso ---- */
.access-note {
  font-size: 0.75rem;
  line-height: 1.5;
  margin: 0;
}

/* ---- Responsividad extra-pequeña ---- */
@media (max-width: 360px) {
  .brand-icon-wrapper { width: 44px; height: 44px; border-radius: 12px; }
  .login-card { padding: 20px 16px !important; }
}
</style>
