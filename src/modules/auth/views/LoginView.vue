<template>
  <div class="auth-container-root">
    <v-container fluid class="pa-0">
      <v-row no-gutters align="center" justify="center" class="pa-4 pa-md-0">
        <v-col cols="12" sm="10" md="8" lg="4" xl="3">
        <!-- Logo y Nombre de Marca -->
        <div class="text-center mb-8">
          <h1 class="text-h2 font-weight-black text-primary mb-2 ls-tight">ALFITA</h1>
          <p class="text-body-1 text-grey-darken-1">Gestión Inteligente de Turnos</p>
        </div>

        <v-card class="pa-8 alfita-login-card" flat rounded="xl">
          <!-- TABS para alternar Login/Registro -->
          <v-tabs
            v-model="tab"
            color="primary"
            grow
            class="mb-8"
            bg-color="transparent"
            @update:model-value="resetStates"
          >
            <v-tab value="login" class="text-none">Iniciar Sesión</v-tab>
            <v-tab value="register" class="text-none">Registrarse</v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <!-- VISTA INICIAR SESIÓN -->
            <v-window-item value="login">
              <v-form @submit.prevent="handleLogin">
                <div class="text-subtitle-2 mb-1 text-grey-darken-1 ml-4">Correo electrónico</div>
                <v-text-field
                  v-model="email"
                  placeholder="tucorreo@gmail.com"
                  variant="plain"
                  persistent-placeholder
                  prepend-inner-icon="mdi-email-outline"
                  class="mb-4"
                  :rules="[rules.required, rules.gmailOnly]"
                  hide-details="auto"
                />
                
                <div v-if="isValidGmail" class="animate-fade-in">
                  <div class="text-subtitle-2 mb-1 text-grey-darken-1 ml-4">Contraseña</div>
                  <v-text-field
                    v-model="password"
                    placeholder="••••••••"
                    variant="plain"
                    type="password"
                    persistent-placeholder
                    prepend-inner-icon="mdi-lock-outline"
                    class="mb-4"
                    :rules="[rules.required]"
                    hide-details="auto"
                  />

                  <!-- Simulación Contenedor reCAPTCHA Login -->
                  <div v-if="password.length > 0" class="mb-6 animate-fade-in">
                    <v-sheet
                      border
                      rounded="lg"
                      class="pa-4 d-flex align-center bg-grey-lighten-4 cursor-pointer"
                      @click="recaptchaResolved = !recaptchaResolved"
                    >
                      <v-checkbox-btn
                        v-model="recaptchaResolved"
                        color="secondary"
                        hide-details
                      />
                      <span class="text-body-2 font-weight-medium grey-darken-2">No soy un robot</span>
                      <v-spacer />
                      <v-img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="30" height="30" />
                    </v-sheet>
                  </div>
                </div>

                <div class="text-right mb-6">
                  <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    class="text-none px-0"
                    @click="handleResetPassword"
                  >
                    ¿Olvidaste tu contraseña?
                  </v-btn>
                </div>

                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  type="submit"
                  class="mb-6 font-weight-bold"
                  :loading="authStore.loading"
                  :disabled="!recaptchaResolved || !isValidGmail || !password"
                >
                  Entrar
                </v-btn>
              </v-form>
            </v-window-item>

            <!-- VISTA REGISTRO -->
            <v-window-item value="register">
              <v-form @submit.prevent="handleRegister">
                <div class="text-subtitle-2 mb-1 text-grey-darken-1 ml-4">Correo electrónico</div>
                <v-text-field
                  v-model="email"
                  placeholder="tucorreo@gmail.com"
                  variant="plain"
                  persistent-placeholder
                  prepend-inner-icon="mdi-email-outline"
                  class="mb-4"
                  :rules="[rules.required, rules.gmailOnly]"
                  hide-details="auto"
                />

                <div v-if="isValidGmail" class="animate-fade-in">
                  <div class="text-subtitle-2 mb-1 text-grey-darken-1 ml-4">Contraseña</div>
                  <v-text-field
                    v-model="password"
                    placeholder="Crea una contraseña segura"
                    variant="plain"
                    type="password"
                    persistent-placeholder
                    prepend-inner-icon="mdi-lock-outline"
                    class="mb-4"
                    hide-details="auto"
                  />

                  <!-- Indicadores de Requisitos de Contraseña -->
                  <div class="mb-6 px-4">
                    <div
                      v-for="(req, index) in passwordRequirements"
                      :key="index"
                      :class="['d-flex align-center mb-1 text-caption transition-color', req.met ? 'text-secondary' : 'text-grey']"
                    >
                      <v-icon
                        size="16"
                        class="mr-2"
                        :color="req.met ? 'secondary' : 'grey-lighten-1'"
                      >
                        {{ req.met ? 'mdi-check-circle-outline' : 'mdi-circle-outline' }}
                      </v-icon>
                      {{ req.text }}
                    </div>
                  </div>

                  <!-- reCAPTCHA Registro -->
                  <div v-if="allRequirementsMet" class="mb-6 animate-fade-in">
                    <v-sheet
                      border
                      rounded="lg"
                      class="pa-4 d-flex align-center bg-grey-lighten-4 cursor-pointer"
                      @click="recaptchaResolved = !recaptchaResolved"
                    >
                      <v-checkbox-btn
                        v-model="recaptchaResolved"
                        color="secondary"
                        hide-details
                      />
                      <span class="text-body-2 font-weight-medium grey-darken-2">Verificar identidad</span>
                      <v-spacer />
                      <v-img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="30" height="30" />
                    </v-sheet>
                  </div>
                </div>

                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  rounded="xl"
                  type="submit"
                  class="mb-6 font-weight-bold"
                  :loading="authStore.loading"
                  :disabled="!recaptchaResolved || !allRequirementsMet || !isValidGmail"
                >
                  Crear Cuenta
                </v-btn>
              </v-form>
            </v-window-item>
          </v-window>

          <v-divider class="mb-8">ó continuar con</v-divider>

          <!-- Botón de Google Estilo Institucional -->
          <v-btn
            block
            color="surface"
            variant="flat"
            size="x-large"
            rounded="xl"
            class="text-none google-btn font-weight-medium"
            @click="handleGoogleLogin"
            :disabled="authStore.loading"
          >
            <template v-slot:prepend>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.91c1.71-1.57 2.68-3.88 2.68-6.57z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.71H.92v2.31C2.4 15.98 5.48 18 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.95H.92C.33 6.16 0 7.54 0 9s.33 2.84.92 4.05l3.05-2.31z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.86 11.42 0 9 0 5.48 0 2.4 2.02.92 4.95l3.05 2.31c.7-2.13 2.7-3.71 5-3.71z"/>
              </svg>
            </template>
            Google
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Notificaciones -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const tab = ref('login');
const email = ref('');
const password = ref('');
const recaptchaResolved = ref(false);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'error'
});

// Reglas de Validación
const rules = {
  required: (v: any) => !!v || 'Campo requerido',
  gmailOnly: (v: string) => v.endsWith('@gmail.com') || 'Solo se permiten cuentas de Google (@gmail.com)'
};

// Computada común para validación de dominio Gmail
const isValidGmail = computed(() => email.value.endsWith('@gmail.com'));

// Computadas para Requisitos de Registro
const passwordRequirements = computed(() => [
  { text: 'Mínimo 8 caracteres', met: password.value.length >= 8 },
  { text: 'Al menos una mayúscula', met: /[A-Z]/.test(password.value) },
  { text: 'Al menos una minúscula', met: /[a-z]/.test(password.value) },
  { text: 'Al menos un carácter especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(password.value) }
]);

const allRequirementsMet = computed(() => passwordRequirements.value.every(r => r.met));

// Reinicio de estados al cambiar de pestaña
const resetStates = () => {
  email.value = '';
  password.value = '';
  recaptchaResolved.value = false;
};

const showMessage = (text: string, color = 'error') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

const handleLogin = async () => {
  try {
    await authStore.loginWithEmail(email.value, password.value);
    router.push('/');
  } catch (err: any) {
    showMessage('Error: Credenciales incorrectas');
    recaptchaResolved.value = false;
  }
};

const handleRegister = async () => {
  try {
    await authStore.registerWithEmail(email.value, password.value);
    router.push('/');
  } catch (err: any) {
    showMessage('Error: Datos inválidos o usuario existente');
    recaptchaResolved.value = false;
  }
};

const handleGoogleLogin = async () => {
  try {
    await authStore.loginWithGoogle();
    router.push('/');
  } catch (err: any) {
    showMessage('Error al conectar con Google');
  }
};

const handleResetPassword = async () => {
  if (!email.value || !isValidGmail.value) {
    showMessage('Por favor ingresa un email de Google válido primero');
    return;
  }
  try {
    await authStore.resetPassword(email.value);
    showMessage('Correo de recuperación enviado exitosamente', 'secondary');
  } catch (err: any) {
    showMessage('Error al enviar el correo de recuperación');
  }
};
</script>

<style scoped>
.auth-container-root {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa !important;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px) !important;
  background-size: 24px 24px !important;
  overflow-x: hidden;
}

.ls-tight {
  letter-spacing: -2px !important;
}

.alfita-login-card {
  border: 1px solid #dadce0 !important;
  background-color: #ffffff !important;
}

.google-btn {
  border: 1px solid #dadce0 !important;
}

/* Forzar diseño de inputs estilo Google */
.v-text-field :deep(.v-field) {
  border-radius: 28px !important;
  background-color: #f8f9fa !important;
  padding-left: 16px !important;
  padding-right: 16px !important;
  border: 1px solid transparent !important;
  transition: all 0.2s ease;
}

.v-text-field :deep(.v-field--focused) {
  border-color: #1a73e8 !important;
  background-color: #ffffff !important;
}

.v-text-field :deep(.v-field__outline) {
  display: none !important;
}

.v-text-field :deep(.v-field__input) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  min-height: 56px !important;
}

.transition-color {
  transition: color 0.3s ease;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
