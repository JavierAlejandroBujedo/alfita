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
                <!-- Similar compression for Register -->
                <v-form ref="registerForm" v-model="isRegisterValid" @submit.prevent="handleRegister">
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Tu Nombre</div>
                  <v-text-field
                    v-model="registerName"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-2"
                    hide-details="auto"
                  />
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Correo (Google)</div>
                  <v-text-field
                    v-model="registerEmail"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-2"
                    hide-details="auto"
                  />
                  <div class="text-caption font-weight-bold text-grey-darken-1 ml-4 mb-1">Contraseña</div>
                  <v-text-field
                    v-model="registerPassword"
                    type="password"
                    variant="solo-filled"
                    flat
                    density="compact"
                    rounded="lg"
                    class="mb-4"
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
              class="text-none font-weight-bold text-white"
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
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
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

const resetStates = () => {
  email.value = ''
  password.value = ''
}

const handleLogin = async () => {
  loading.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.replace('/')
  } catch (err) {
    snackbar.text = 'Error al iniciar sesión'
    snackbar.color = 'error'
    snackbar.show = true
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
        role: 3, // Alfita por defecto
        createdAt: new Date()
      })
    }
    router.replace('/')
  } catch (err) { /* silent */ }
}

const handleRegister = async () => {
  loading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, registerEmail.value, registerPassword.value)
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName: registerName.value,
      email: registerEmail.value,
      role: 3,
      createdAt: new Date()
    })
    router.replace('/')
  } catch (err) {
    snackbar.text = 'Error al registrarse'
    snackbar.color = 'error'
    snackbar.show = true
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-container-root { min-height: 100vh; display: flex; align-items: center; background-color: #f8f9fa; }
.ls-tight { letter-spacing: -2px !important; }
.mt-n2 { margin-top: -8px !important; }
.alfita-login-card { border: 1px solid #e0e0e0; }
</style>
