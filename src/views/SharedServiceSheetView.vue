<template>
  <v-container fluid class="fill-height bg-grey-lighten-4 pa-0">
    <!-- CARGANDO -->
    <div v-if="loading" class="d-flex flex-column align-center justify-center w-100">
      <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
      <div class="text-h6 font-weight-bold">Buscando planilla...</div>
    </div>

    <!-- ERROR / NO ENCONTRADO -->
    <div v-else-if="error" class="d-flex flex-column align-center justify-center w-100 pa-6 text-center">
      <v-icon size="80" color="error" class="mb-4">mdi-alert-circle</v-icon>
      <div class="text-h5 font-weight-black mb-2">{{ error }}</div>
      <v-btn color="primary" rounded="pill" prepend-icon="mdi-home" to="/">Volver al Inicio</v-btn>
    </div>

    <!-- VISTA DE LA PLANILLA (Si está autorizado) -->
    <div v-else-if="authorized && sheet" class="w-100 h-100 bg-white">
      <ServiceSheetTemplate 
        :show="true" 
        :sheet="sheet" 
        :availability="availabilityData"
        @close="goHome"
      />
    </div>

    <!-- MODAL DE ADVERTENCIA: NO AUTORIZADO -->
    <v-dialog v-model="showAccessDenied" persistent max-width="500">
      <v-card rounded="xl" class="pa-4 text-center">
        <v-card-text>
          <v-icon size="80" color="amber-darken-3" class="mb-4">mdi-shield-lock</v-icon>
          <div class="text-h5 font-weight-black mb-4">Acceso Restringido</div>
          <div class="text-body-1 text-grey-darken-2 mb-6">
            No tenés permisos para ver esta planilla en este momento.<br>
            <strong>Debe autorizarte el Designador para poder ver esta planilla.</strong>
          </div>
          <v-btn
            block
            color="primary"
            size="large"
            variant="elevated"
            rounded="pill"
            class="font-weight-bold"
            @click="goHome"
          >
            Entendido
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../plugins/firebase'
import { useAuthStore } from '../modules/auth/stores/authStore'
import ServiceSheetTemplate from '../components/ServiceSheetTemplate.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref<string | null>(null)
const sheet = ref<any>(null)
const availabilityData = ref<any[]>([])
const authorized = ref(false)
const showAccessDenied = ref(false)

const goHome = () => router.push('/')

const checkAccess = async (serviceData: any) => {
  // 1. Admins y Designadores tienen acceso total
  if (authStore.userRole === 1 || authStore.userRole === 3) return true

  // 2. Verificar vinculación directa (service_links)
  const qLinks = query(
    collection(db, 'service_links'),
    where('serviceId', '==', serviceData.id),
    where('email', '==', authStore.user?.email)
  )
  const linkSnap = await getDocs(qLinks)
  if (!linkSnap.empty) return true

  // 3. Verificar por número de servicio en el perfil (si aplica)
  const userSvc = authStore.userData?.svcNumber
  if (userSvc && serviceData.svcNumber) {
     const mySvcs = String(userSvc).split(',').map(s => s.trim())
     if (mySvcs.includes(String(serviceData.svcNumber))) return true
  }

  return false
}

onMounted(async () => {
  const sheetId = route.params.id as string
  if (!sheetId) {
    error.value = 'ID de planilla no válido'
    loading.value = false
    return
  }

  try {
    // 1. Obtener la Hoja de Servicio
    const docRef = doc(db, 'servicios', sheetId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      error.value = 'La planilla solicitada no existe o fue eliminada.'
      loading.value = false
      return
    }

    const data: any = { id: docSnap.id, ...docSnap.data() }
    sheet.value = data

    // 2. Validar Acceso
    const isAllowed = await checkAccess(data)
    if (!isAllowed) {
      showAccessDenied.value = true
      loading.value = false
      return
    }

    authorized.value = true
    document.title = `Planilla SVC ${data.svcNumber || '---'} - Alfita`

    // 3. Cargar disponibilidad (necesaria para el template)
    const qAvailability = query(collection(db, 'availability_submissions'), where('serviceId', '==', sheetId))
    const availSnap = await getDocs(qAvailability)
    availabilityData.value = availSnap.docs.map(d => ({ id: d.id, ...d.data() }))

  } catch (err) {
    console.error('[SharedView] Error:', err)
    error.value = 'Hubo un problema al cargar la planilla.'
  } finally {
    loading.value = false
  }
})
</script>
