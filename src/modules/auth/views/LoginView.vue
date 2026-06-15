<template>
  <div class="auth-container-root px-4">
    <v-container fluid class="pa-0">
      <v-row no-gutters align="center" justify="center">
        <v-col cols="12" sm="10" md="8" lg="4" xl="3">
          
          <!-- Logo y Nombre de Marca (Compacto) -->
          <div class="text-center mb-6">
            <v-icon color="primary" size="56" class="mb-0" style="transform: rotate(180deg)">mdi-vuetify</v-icon>
            <h1 class="text-h2 font-weight-black text-primary mt-n2 ls-tight">ALFITA</h1>
          </div>

          <v-card class="pa-6 alfita-login-card mx-auto" flat rounded="xl" max-width="450">
            <!-- TABS (Más compactas) -->
            <v-tabs
              v-model="tab"
              color="primary"
              grow
              class="mb-4"
              bg-color="transparent"
              @update:model-value="resetStates"
              density="compact"
            >
              <v-tab value="login" class="text-none">Iniciar Sesión</v-tab>
              <v-tab value="register" class="text-none">Registrarse</v-tab>
            </v-tabs>

            <v-window v-model="tab">
              <!-- LOGIN -->
              <v-window-item value="login">
                <v-form ref="loginForm" v-model="isLoginValid" @submit.prevent="handleLogin">
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Correo electrónico</div>
                  <v-text-field
                    v-model="email"
                    placeholder="tucorreo@gmail.com"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    prepend-inner-icon="mdi-email-outline"
                    class="mb-3"
                    :rules="[rules.required]"
                    hide-details="auto"
                  />
                  
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Contraseña</div>
                  <v-text-field
                    v-model="password"
                    placeholder="••••••••"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    type="password"
                    prepend-inner-icon="mdi-lock-outline"
                    class="mb-4"
                    :rules="[rules.required]"
                    hide-details="auto"
                  />

                  <v-btn
                    block
                    color="primary"
                    size="large"
                    rounded="pill"
                    class="font-weight-bold mb-3"
                    type="submit"
                    :loading="loading"
                  >
                    Entrar
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- REGISTER -->
              <v-window-item value="register">
                <v-form ref="registerForm" v-model="isRegisterValid" @submit.prevent="handleRegister">
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Tu Nombre y Apellido</div>
                  <v-text-field
                    v-model="registerName"
                    placeholder="Juan Pérez"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-2"
                    :rules="nameRules"
                    hide-details="auto"
                    maxlength="26"
                  />

                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Correo electrónico</div>
                  <v-text-field
                    v-model="registerEmail"
                    placeholder="ejemplo@correo.com"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-2"
                    :rules="emailRules"
                    @input="registerEmail = registerEmail.toLowerCase()"
                    hide-details="auto"
                  />

                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1 text-uppercase">Contraseña</div>
                  <v-text-field
                    v-model="registerPassword"
                    placeholder="••••••••"
                    type="password"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-2"
                    hide-details="auto"
                  />

                  <!-- LISTADO DE VALIDACIONES DE CONTRASEÑA -->
                  <v-expand-transition>
                    <div v-if="!allRequirementsMet && registerPassword.length > 0" class="px-4 mb-4 pass-requirements">
                      <div :class="passRequirements.length ? 'text-success' : 'text-grey'" class="d-flex align-center text-caption font-weight-bold">
                        <v-icon size="14" class="mr-1">{{ passRequirements.length ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        Al menos 8 caracteres
                      </div>
                      <div :class="passRequirements.hasUpper ? 'text-success' : 'text-grey'" class="d-flex align-center text-caption font-weight-bold">
                        <v-icon size="14" class="mr-1">{{ passRequirements.hasUpper ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        Al menos una mayúscula
                      </div>
                      <div :class="passRequirements.hasLower ? 'text-success' : 'text-grey'" class="d-flex align-center text-caption font-weight-bold">
                        <v-icon size="14" class="mr-1">{{ passRequirements.hasLower ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        Al menos una minúscula
                      </div>
                      <div :class="passRequirements.hasNumber ? 'text-success' : 'text-grey'" class="d-flex align-center text-caption font-weight-bold">
                        <v-icon size="14" class="mr-1">{{ passRequirements.hasNumber ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        Al menos un número
                      </div>
                      <div :class="passRequirements.hasSpecial ? 'text-success' : 'text-grey'" class="d-flex align-center text-caption font-weight-bold">
                        <v-icon size="14" class="mr-1">{{ passRequirements.hasSpecial ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                        Al menos un carácter especial
                      </div>
                    </div>
                  </v-expand-transition>

                  <v-btn
                    block
                    color="primary"
                    size="large"
                    rounded="pill"
                    class="font-weight-bold mb-3"
                    type="submit"
                    :loading="loading"
                    :disabled="!isRegisterValid || !allRequirementsMet"
                  >
                    Crear Cuenta
                  </v-btn>
                </v-form>
              </v-window-item>
            </v-window>

            <v-divider class="my-4">o continua con</v-divider>

            <v-btn
              block
              variant="flat"
              color="#4285F4"
              size="large"
              rounded="pill"
              class="text-none font-weight-bold text-white shadow-btn"
              prepend-icon="mdi-google"
              @click="handleGoogleLogin"
            >
              Continuar con Google
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" rounded="pill">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db, googleProvider } from '../../../plugins/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const router = useRouter()
const tab = ref('login')
const loading = ref(false)
const isLoginValid = ref(false)
const isRegisterValid = ref(false)

const email = ref('')
const password = ref('')

const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')

const snackbar = reactive({ show: false, text: '', color: 'success' })

const rules = {
  required: (v: string) => !!v || 'Campo obligatorio'
}

const nameRules = [
  (v: string) => !!v || 'Campo obligatorio',
  (v: string) => v.trim().split(/\s+/).length >= 2 || 'Ingresá al menos nombre y apellido',
  (v: string) => v.length <= 26 || 'Máximo 26 caracteres'
]

const emailRules = [
  (v: string) => !!v || 'Campo obligatorio',
  (v: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) || 'Ingresá un correo electrónico válido'
]

const passRequirements = computed(() => {
  const p = registerPassword.value
  return {
    length: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(p)
  }
})

const allRequirementsMet = computed(() => {
  const reqs = passRequirements.value
  return !!(reqs.length && reqs.hasUpper && reqs.hasLower && reqs.hasNumber && reqs.hasSpecial)
})

const resetStates = () => {
  email.value = ''
  password.value = ''
  registerName.value = ''
  registerEmail.value = ''
  registerPassword.value = ''
}

const firebaseErrorMsg = (code: string): string => {
  const map: Record<string, string> = {
    'auth/invalid-credential':       'El correo o la contraseña son incorrectos.',
    'auth/user-not-found':           'No encontramos una cuenta con ese correo.',
    'auth/wrong-password':           'La contraseña ingresada es incorrecta.',
    'auth/invalid-email':            'El formato del correo no es válido.',
    'auth/too-many-requests':        'Demasiados intentos fallidos. Por seguridad, esperá unos minutos.',
    'auth/email-already-in-use':     'Este correo ya se encuentra registrado en el sistema.',
    'auth/weak-password':            'La contraseña es demasiado débil.',
    'auth/operation-not-allowed':    'El registro con correo y contraseña no está habilitado.',
    'auth/network-request-failed':   'Error de red. Verificá tu conexión a internet.',
    'auth/popup-closed-by-user':     'Se cerró el acceso con Google antes de completar.',
  }
  return map[code] || 'Ocurrió un error inesperado al intentar ingresar. Reintentá en unos segundos.'
}

const handleLogin = async () => {
  if (!isLoginValid.value) return
  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.replace('/')
  } catch (err: any) {
    const msg = firebaseErrorMsg(err?.code || '')
    snackbar.text  = msg
    snackbar.color = 'error'
    snackbar.show  = true
  } finally { loading.value = false }
}

const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        role: 2,
        createdAt: new Date()
      })
    }
    router.replace('/')
  } catch (err: any) {
    const msg = firebaseErrorMsg(err?.code || '')
    if (msg) {
      snackbar.text  = msg
      snackbar.color = 'error'
      snackbar.show  = true
    }
  }
}

const handleRegister = async () => {
  if (!isRegisterValid.value || !allRequirementsMet.value) return
  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value)
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: registerName.value,
      email: registerEmail.value.toLowerCase().trim(),
      role: 2,
      createdAt: new Date()
    })
    router.replace('/')
  } catch (err: any) {
    console.error('Registration error:', err)
    const msg = firebaseErrorMsg(err?.code || '')
    snackbar.text  = msg
    snackbar.color = 'error'
    snackbar.show  = true
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-container-root { min-height: 100vh; display: flex; align-items: center; background-color: #f8f9fa; }
.ls-tight { letter-spacing: -2px !important; }
.mt-n2 { margin-top: -8px !important; }
.alfita-login-card { border: 1px solid #e0e0e0; }
</style>
